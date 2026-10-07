import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import {
  createSession,
  findOrCreateProfile,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface MagicBody {
  email?: string;
}

/**
 * Passwordless entry point.
 * With RESEND_API_KEY provisioned: emails a 6-digit code, verified at
 * /api/auth/verify. Without it: issues a session immediately so the flow
 * remains testable in environments without an email provider.
 */
export async function POST(req: NextRequest) {
  try {
    let body: MagicBody;
    try {
      body = (await req.json()) as MagicBody;
    } catch {
      return NextResponse.json({ error: "Body must be valid JSON." }, { status: 400 });
    }

    const email = (body.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address, e.g. you@example.com." },
        { status: 422 }
      );
    }

    const profile = await findOrCreateProfile(email);

    if (process.env.RESEND_API_KEY) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      await db.insert(sessions).values({
        token: `code:${code}`,
        userId: profile.id,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? "OmniScope <auth@omniscope.tv>",
          to: [email],
          subject: `Your OmniScope sign-in code: ${code}`,
          html: `<div style="font-family:Helvetica,Arial,sans-serif;background:#08090E;color:#E8E6E1;padding:32px;"><p style="font-size:14px;color:#9BA0AB;">Your one-time code is:</p><p style="font-size:32px;letter-spacing:0.3em;font-weight:700;">${code}</p><p style="font-size:12px;color:#5A5F6B;">It expires in 10 minutes. If you did not request it, ignore this email.</p></div>`,
        }),
        signal: AbortSignal.timeout(8_000),
      });
      return NextResponse.json({ sent: true });
    }

    const token = await createSession(profile.id);
    const res = NextResponse.json({ instant: true, email });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: `Magic sign-in failed: ${detail}` }, { status: 500 });
  }
}
