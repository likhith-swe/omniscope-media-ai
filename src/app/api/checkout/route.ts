import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getSessionUser } from "@/lib/session";
import { activateProSubscription, plusDays, PLAN_INR, PLAN_USD } from "@/lib/billing";

interface CheckoutBody {
  provider?: "razorpay" | "stripe" | "demo";
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: "Sign in before starting a subscription." },
        { status: 401 }
      );
    }
    const userId = session.profile.id;

    let body: CheckoutBody = {};
    try {
      body = (await req.json()) as CheckoutBody;
    } catch {
      // Treat a missing body as the default provider selection below.
    }
    const requested = body.provider ?? "razorpay";

    // Path 1: Razorpay order (INR 399/mo). Client opens the Checkout modal
    // with the returned order id; success is verified in /api/checkout/verify
    // and re-confirmed by the webhook.
    if (
      requested === "razorpay" &&
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET
    ) {
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
          ).toString("base64")}`,
        },
        body: JSON.stringify({
          amount: PLAN_INR * 100,
          currency: "INR",
          receipt: `os_${userId.slice(0, 8)}_${Date.now()}`,
          notes: { userId, plan: "pro_monthly" },
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return NextResponse.json(
          { error: `Razorpay order creation failed (${res.status}): ${detail}` },
          { status: 502 }
        );
      }
      const order = (await res.json()) as { id: string };
      return NextResponse.json({
        mode: "razorpay",
        orderId: order.id,
        keyId: process.env.RAZORPAY_KEY_ID,
        amount: PLAN_INR * 100,
        currency: "INR",
      });
    }

    // Path 2: Stripe Billing ($9/mo international).
    if (
      requested === "stripe" &&
      process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_ID
    ) {
      const origin = req.headers.get("origin") ?? "https://omniscope.tv";
      const params = new URLSearchParams({
        mode: "subscription",
        client_reference_id: userId,
        "line_items[0][price]": process.env.STRIPE_PRICE_ID,
        "line_items[0][quantity]": "1",
        "metadata[userId]": userId,
        success_url: `${origin}/dashboard?pro=1`,
        cancel_url: `${origin}/pricing`,
      });
      const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return NextResponse.json(
          { error: `Stripe session creation failed (${res.status}): ${detail}` },
          { status: 502 }
        );
      }
      const checkout = (await res.json()) as { url: string };
      return NextResponse.json({ mode: "stripe", url: checkout.url });
    }

    // Path 3: sandbox / evaluation mode. Grants a live 30-day Pro period so
    // the full product surface can be exercised without payment credentials.
    const externalId = `demo_${randomBytes(8).toString("hex")}`;
    await activateProSubscription({
      userId,
      provider: "demo",
      externalSubscriptionId: externalId,
      status: "active",
      periodEnd: plusDays(new Date(), 30),
    });
    return NextResponse.json({
      mode: "demo",
      activated: true,
      subscriptionId: externalId,
      note: `Payment credentials are not configured on this deployment; a 30-day Pro pass (${PLAN_INR} INR / ${PLAN_USD} USD list price) was granted in sandbox mode.`,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: `Checkout failed: ${detail}` }, { status: 500 });
  }
}
