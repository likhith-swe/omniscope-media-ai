import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  findOrCreateProfile,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/session";

/**
 * One-click Google entry point.
 * With Supabase provisioned (NEXT_PUBLIC_SUPABASE_URL), this hands off to
 * Supabase Auth's hosted Google OAuth flow. Without it, a labelled demo
 * identity is issued so the account surface stays testable.
 */
export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const origin = req.nextUrl.origin;

  if (supabaseUrl) {
    const authorize = new URL("/auth/v1/authorize", supabaseUrl);
    authorize.searchParams.set("provider", "google");
    authorize.searchParams.set("redirect_to", `${origin}/auth/callback`);
    return NextResponse.redirect(authorize.toString(), 302);
  }

  const profile = await findOrCreateProfile("demo@omniscope.tv", "Demo Viewer");
  const token = await createSession(profile.id);
  const res = NextResponse.redirect(new URL("/?signed_in=1", origin), 302);
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
