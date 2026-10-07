import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { activateProSubscription, revokePro, plusDays } from "@/lib/billing";

interface RazorpayWebhookPayload {
  event?: string;
  payload?: {
    subscription?: {
      entity?: string;
      id?: string;
      status?: string;
      notes?: Record<string, string>;
      current_end?: number; // unix seconds
    };
    payment?: {
      entity?: string;
      id?: string;
      notes?: Record<string, string>;
    };
  };
}

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = Buffer.from(
    createHmac("sha256", secret).update(rawBody).digest("hex"),
    "utf8"
  );
  const received = Buffer.from(signature, "utf8");
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "RAZORPAY_WEBHOOK_SECRET is not configured on this deployment." },
      { status: 503 }
    );
  }

  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!verifySignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let body: RazorpayWebhookPayload;
  try {
    body = JSON.parse(raw) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Malformed webhook body." }, { status: 400 });
  }

  const event = body.event ?? "";
  const subscription = body.payload?.subscription;
  const notes = subscription?.notes ?? body.payload?.payment?.notes ?? {};
  const userId = notes.userId;
  const externalId = subscription?.id ?? body.payload?.payment?.id ?? "";

  if (event === "subscription.charged" || event === "payment.captured") {
    if (!userId || !externalId) {
      return NextResponse.json(
        { error: "Webhook is missing userId or subscription id in notes." },
        { status: 422 }
      );
    }
    const profileExists =
      (await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, userId))).length > 0;
    if (!profileExists) {
      return NextResponse.json({ error: "Unknown userId in webhook notes." }, { status: 422 });
    }
    const periodEnd = subscription?.current_end
      ? new Date(subscription.current_end * 1000)
      : plusDays(new Date(), 30);
    await activateProSubscription({
      userId,
      provider: "razorpay",
      externalSubscriptionId: externalId,
      status: "active",
      periodEnd,
    });
    return NextResponse.json({ received: true, upgraded: true });
  }

  if (event === "subscription.cancelled" || event === "subscription.halted") {
    if (userId && externalId) {
      await revokePro(userId, externalId);
    }
    return NextResponse.json({ received: true, downgraded: true });
  }

  return NextResponse.json({ received: true, ignored: event || "unknown-event" });
}
