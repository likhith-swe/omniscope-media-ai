import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { profiles, sessions } from "@/db/schema";
import {
  createSession,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/session";

interface VerifyBody {
  email?: string;
  code?: string;
}

export async function POST(req: NextRequest) {
  try {
    let body: VerifyBody;
    try {
      body = (await req.json()) as VerifyBody;
    } catch {
      return NextResponse.json({ error: "Body must be valid JSON." }, { status: 400 });
    }

    const email = (body.email ?? "").trim().toLowerCase();
    const code = (body.code ?? "").trim();
    if (!email || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Provide the email and the 6-digit code exactly as sent." },
        { status: 422 }
      );
    }

    const profileRows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);
    if (profileRows.length === 0) {
      return NextResponse.json({ error: "No account matches that email." }, { status: 404 });
    }
    const profile = profileRows[0];

    const pending = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.token, `code:${code}`),
          eq(sessions.userId, profile.id),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (pending.length === 0) {
      return NextResponse.json(
        { error: "Code is invalid or expired. Request a new one." },
        { status: 401 }
      );
    }

    await db.delete(sessions).where(eq(sessions.token, `code:${code}`));
    const token = await createSession(profile.id);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: `Verification failed: ${detail}` }, { status: 500 });
  }
}
