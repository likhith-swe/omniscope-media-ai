import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { searches } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import {
  checkQuota,
  clientIp,
  hashIp,
  syncProfileQuota,
} from "@/lib/ratelimit";
import {
  recognizeText,
  recognizeImage,
  averageRgbFromBase64,
  type QueryType,
} from "@/lib/recognize";
import { getAvailability } from "@/lib/rapidapi";
import { availabilityGap, type Region } from "@/lib/catalog";

interface RecognizeBody {
  input?: string;
  image?: string;
  region?: Region;
}

const MAX_TEXT = 500;
const MAX_IMAGE_BASE64 = 10_000_000;

export async function POST(req: NextRequest) {
  try {
    let body: RecognizeBody;
    try {
      body = (await req.json()) as RecognizeBody;
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 }
      );
    }

    const region: Region =
      body.region === "US" || body.region === "UK" ? body.region : "IN";
    const hasText = typeof body.input === "string" && body.input.trim().length > 0;
    const hasImage = typeof body.image === "string" && body.image.length > 0;

    if (!hasText && !hasImage) {
      return NextResponse.json(
        { error: "Provide a quoted line, a scene description, or a screenshot." },
        { status: 400 }
      );
    }
    if (hasText && body.input!.length > MAX_TEXT) {
      return NextResponse.json(
        { error: `Text input is limited to ${MAX_TEXT} characters.` },
        { status: 400 }
      );
    }
    if (hasImage && body.image!.length > MAX_IMAGE_BASE64) {
      return NextResponse.json(
        { error: "Image exceeds the 8 MB upload limit." },
        { status: 413 }
      );
    }

    const session = await getSessionUser().catch(() => null);
    const ipHash = await hashIp(clientIp(req.headers));

    if (session?.profile) await syncProfileQuota(session.profile);

    const quota = await checkQuota({ profile: session?.profile ?? null, ipHash });
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: "Daily lookup limit reached.",
          quota: {
            remaining: quota.remaining,
            limit: quota.limit,
            resetAt: quota.resetAt,
            isPro: Boolean(session?.profile?.isPro),
          },
          requiresPro: true,
        },
        { status: 429 }
      );
    }

    let queryType: QueryType;
    let hit;

    if (hasImage && !hasText) {
      queryType = "image";
      const avg = averageRgbFromBase64(body.image!);
      if (!avg) {
        return NextResponse.json(
          { error: "Could not read that image. Send a JPEG or PNG under 8 MB." },
          { status: 422 }
        );
      }
      hit = recognizeImage(avg);
    } else {
      const text = body.input!.trim();
      queryType =
        /["“”']/.test(text) || text.split(" ").length <= 14 ? "quote" : "description";
      hit = recognizeText(text, queryType);
    }

    const payload = hasImage && !hasText
      ? `[image ${body.image!.length} bytes]`
      : body.input!.trim().slice(0, MAX_TEXT);

    await db.insert(searches).values({
      userId: session?.profile.id ?? null,
      queryType,
      inputPayload: payload,
      detectedSlug: hit?.title.slug ?? null,
      tmdbId: hit?.title.tmdbId ?? null,
      ipHash,
    });

    if (!hit) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "No confident match. Try the exact dialogue line, or name a character or actor you remember.",
          quota: {
            remaining: Math.max(0, quota.remaining - 1),
            limit: quota.limit,
            resetAt: quota.resetAt,
            isPro: Boolean(session?.profile?.isPro),
          },
        },
        { status: 200 }
      );
    }

    const availability = await getAvailability(hit.title);
    const gap = availabilityGap(hit.title, region);

    return NextResponse.json({
      ok: true,
      queryType,
      match: {
        slug: hit.title.slug,
        title: hit.title.title,
        year: hit.title.year,
        rating: hit.title.rating,
        runtime: hit.title.runtime,
        genres: hit.title.genres,
        director: hit.title.director,
        overview: hit.title.overview,
        confidence: hit.confidence,
        matchedField: hit.matchedField,
        matchedSnippet: hit.matchedSnippet,
        palette: hit.title.palette,
      },
      availability: {
        offers: availability.offers,
        source: availability.source,
        fetchedAt: availability.fetchedAt,
        locked: gap.locked,
        availableIn: gap.availableIn,
        region,
      },
      quota: {
        remaining: quota.reason === "pro" ? null : Math.max(0, quota.remaining - 1),
        limit: quota.limit,
        resetAt: quota.resetAt,
        isPro: Boolean(session?.profile?.isPro),
      },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `Recognition pipeline failed: ${detail}` },
      { status: 500 }
    );
  }
}
