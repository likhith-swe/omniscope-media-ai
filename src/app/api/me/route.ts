import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

/** Lightweight session probe used by the navigation on static pages. */
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ user: null });
    return NextResponse.json({
      user: {
        email: session.profile.email,
        fullName: session.profile.fullName ?? session.profile.email,
        isPro: session.profile.isPro,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
