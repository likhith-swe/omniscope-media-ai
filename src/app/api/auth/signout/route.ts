import { NextRequest, NextResponse } from "next/server";
import { destroySession, getSessionUser, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (session) {
    await destroySession(session.sessionToken);
  }
  const res = NextResponse.redirect(new URL("/", req.nextUrl.origin), 303);
  res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
