import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

const PROTECTED_PREFIXES = ["/dashboard", "/saved"];

/**
 * First-line guard for account surfaces. The definitive session check runs
 * server-side inside each protected page (middleware cannot touch the DB
 * on the edge); here we only bounce obviously anonymous visitors.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const next = new URL("/", req.nextUrl.origin);
    next.searchParams.set("signin", "1");
    next.searchParams.set("next", pathname);
    return NextResponse.redirect(next);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/saved/:path*"],
};
