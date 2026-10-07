import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { affiliateClicks } from "@/db/schema";
import { PARTNERS, isPartner } from "@/lib/affiliate";
import { getTitle } from "@/lib/catalog";
import { getSessionUser } from "@/lib/session";
import { clientIp, hashIp } from "@/lib/ratelimit";

/**
 * Tracked affiliate redirect.
 * GET /api/go/:partner?t=<title-slug>
 * Logs the click to affiliate_clicks, then 307-forwards to the partner
 * landing URL with full UTM + affiliate attribution.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ partner: string }> }
) {
  const { partner } = await params;

  if (!isPartner(partner)) {
    return NextResponse.json(
      { error: `Unknown partner "${partner}".` },
      { status: 404 }
    );
  }

  const slug = req.nextUrl.searchParams.get("t") ?? "";
  const title = slug ? getTitle(slug) : undefined;
  const query = title ? `${title.title} ${title.year}` : "movie";

  const definition = PARTNERS[partner];
  const target = definition.buildUrl(query, title?.slug ?? "generic");

  try {
    const ipHash = await hashIp(clientIp(req.headers));
    const session = await getSessionUser().catch(() => null);
    await db.insert(affiliateClicks).values({
      userId: session?.profile.id ?? null,
      partner,
      targetUrl: target,
      titleSlug: title?.slug ?? null,
      ipHash,
    });
  } catch {
    // Analytics must never block a monetized redirect.
  }

  return NextResponse.redirect(target, 307);
}
