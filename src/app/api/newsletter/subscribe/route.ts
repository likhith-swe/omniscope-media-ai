import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { newsletterSubscribers, crmEvents } from "@/db/schema";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface SubscribeBody {
  email?: string;
  sourcePage?: string;
}

const WELCOME_HTML = (email: string) => `
<div style="background:#08090E;color:#E8E6E1;font-family:Helvetica,Arial,sans-serif;padding:32px;max-width:560px;margin:0 auto;">
  <h1 style="font-size:20px;letter-spacing:-0.02em;margin:0 0 8px;">OmniScope — you are on the list</h1>
  <p style="font-size:14px;line-height:1.6;color:#9BA0AB;">
    Confirmation for <strong style="color:#E8E6E1;">${email}</strong> is recorded.
    The Friday Movie Drop lands every Friday at 18:00 IST: five titles, each with
    the exact platform and plan that carries it in your region, plus one scene
    worth rewatching.
  </p>
  <p style="font-size:14px;line-height:1.6;color:#9BA0AB;">
    When a title you looked up becomes free to stream, that alert also goes out
    from this same address.
  </p>
  <p style="font-size:12px;color:#5A5F6B;margin-top:24px;">
    Sponsor slot: this digest carries one clearly-labelled sponsor per issue.
    Reply UNSUBSCRIBE to leave at any time.
  </p>
</div>`;

export async function POST(req: NextRequest) {
  try {
    let body: SubscribeBody;
    try {
      body = (await req.json()) as SubscribeBody;
    } catch {
      return NextResponse.json({ error: "Body must be valid JSON." }, { status: 400 });
    }

    const email = (body.email ?? "").trim().toLowerCase();
    const sourcePage = (body.sourcePage ?? "/").slice(0, 300);

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "That does not look like a valid email address." },
        { status: 422 }
      );
    }
    if (email.length > 254) {
      return NextResponse.json({ error: "Email address is too long." }, { status: 422 });
    }

    const existing = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].status !== "active") {
        await db
          .update(newsletterSubscribers)
          .set({ status: "active", sourcePage })
          .where(eq(newsletterSubscribers.email, email));
        return NextResponse.json({ ok: true, reactivated: true });
      }
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }

    await db.insert(newsletterSubscribers).values({ email, sourcePage, status: "active" });

    await db.insert(crmEvents).values({
      kind: "loops_sync",
      payload: { email, sourcePage, status: "queued" },
    });

    // CRM sync: Loops.so contact creation when the key is provisioned.
    const loopsKey = process.env.LOOPS_API_KEY;
    if (loopsKey) {
      try {
        const res = await fetch("https://app.loops.so/api/v1/contacts/create", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${loopsKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            source: "omniscope-web",
            userGroup: "friday-movie-drop",
            sourcePage,
          }),
          signal: AbortSignal.timeout(8_000),
        });
        await db.insert(crmEvents).values({
          kind: "loops_sync",
          payload: { email, status: res.ok ? "synced" : `failed:${res.status}` },
        });
      } catch (err) {
        await db.insert(crmEvents).values({
          kind: "loops_sync",
          payload: { email, status: "error", detail: String(err) },
        });
      }
    }

    // Welcome email through Resend when provisioned.
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM ?? "OmniScope <digest@omniscope.tv>",
            to: [email],
            subject: "Friday Movie Drop — subscription confirmed",
            html: WELCOME_HTML(email),
          }),
          signal: AbortSignal.timeout(8_000),
        });
        await db.insert(crmEvents).values({
          kind: "welcome_email",
          payload: { email, status: "sent" },
        });
      } catch (err) {
        await db.insert(crmEvents).values({
          kind: "welcome_email",
          payload: { email, status: "error", detail: String(err) },
        });
      }
    }

    return NextResponse.json({ ok: true, subscribed: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `Subscription failed: ${detail}` },
      { status: 500 }
    );
  }
}
