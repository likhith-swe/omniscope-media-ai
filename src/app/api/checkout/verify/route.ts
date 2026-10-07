import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSessionUser } from "@/lib/session";
import { activateProSubscription, plusDays } from "@/lib/billing";

interface VerifyBody {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

/** Verifies the client-side Razorpay checkout response (HMAC of order_id|payment_id). */
export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: VerifyBody;
  try {
    body = (await req.json()) as VerifyBody;
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON." }, { status: 400 });
  }

  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body;
  if (!orderId || !paymentId || !signature) {
    return NextResponse.json(
      { error: "razorpay_order_id, razorpay_payment_id and razorpay_signature are required." },
      { status: 400 }
    );
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Razorpay is not configured on this deployment." },
      { status: 503 }
    );
  }

  const expected = Buffer.from(
    createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex"),
    "utf8"
  );
  const received = Buffer.from(signature, "utf8");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
  }

  await activateProSubscription({
    userId: session.profile.id,
    provider: "razorpay",
    externalSubscriptionId: `${orderId}:${paymentId}`,
    status: "active",
    periodEnd: plusDays(new Date(), 30),
  });

  return NextResponse.json({ ok: true, pro: true });
}
