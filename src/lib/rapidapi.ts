/**
 * External metadata client: TMDb + Streaming Availability (via RapidAPI).
 *
 * Reads fall through a 24-hour Postgres-backed cache (media_cache). When
 * TMDB_API_KEY / RAPIDAPI_KEY are absent, the client degrades to the
 * verified local catalog so the product stays fully functional offline.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaCache } from "@/db/schema";
import {
  CATALOG,
  type CatalogTitle,
  type Offer,
  type Region,
} from "@/lib/catalog";

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface AvailabilitySnapshot {
  source: "cache" | "live" | "catalog";
  fetchedAt: string;
  offers: Record<Region, Offer[]>;
}

interface RapidApiProviderEntry {
  service: string;
  type: "subscription" | "rent" | "buy" | "free" | "ads";
  link: string;
  quality?: string;
}

interface RapidAvailabilityResponse {
  streamingOptions?: Record<string, RapidApiProviderEntry[]>;
}

interface TmdbMovieResponse {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  runtime: number;
}

const SERVICE_TO_PROVIDER: Record<string, Offer["provider"] | undefined> = {
  netflix: "netflix",
  prime: "prime",
  hotstar: "hotstar",
  jiocinema: "jiocinema",
  apple: "apple",
  mubi: "mubi",
  sonyliv: "sonyliv",
  zee5: "zee5",
  max: "max",
  hbo: "max",
  hulu: "hulu",
  paramount: "paramount",
  youtube: "youtube",
  google: "google",
};

async function fetchJson<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    throw new Error(`upstream ${res.status} from ${new URL(url).host}`);
  }
  return (await res.json()) as T;
}

async function fetchTmdb(slug: string): Promise<TmdbMovieResponse | null> {
  const key = process.env.TMDB_API_KEY;
  if (!key) return null;
  const local = CATALOG.find((t) => t.slug === slug);
  if (!local) return null;
  try {
    return await fetchJson<TmdbMovieResponse>(
      `https://api.themoviedb.org/3/movie/${local.tmdbId}?api_key=${key}`,
      { method: "GET" }
    );
  } catch {
    return null;
  }
}

async function fetchStreamingAvailability(
  tmdbId: number
): Promise<Record<Region, Offer[]> | null> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return null;
  try {
    const data = await fetchJson<RapidAvailabilityResponse>(
      `https://streaming-availability.p.rapidapi.com/get?output_language=en&tmdb_id=movie%2F${tmdbId}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": key,
          "x-rapidapi-host": "streaming-availability.p.rapidapi.com",
        },
      }
    );
    const options = data.streamingOptions ?? {};
    const result: Record<Region, Offer[]> = { IN: [], US: [], UK: [] };
    for (const region of ["IN", "US", "UK"] as Region[]) {
      const entries = options[region] ?? [];
      for (const entry of entries.slice(0, 8)) {
        const provider = SERVICE_TO_PROVIDER[entry.service.toLowerCase()];
        if (!provider) continue;
        const kind: Offer["kind"] =
          entry.type === "subscription"
            ? "subscription"
            : entry.type === "free" || entry.type === "ads"
              ? "free"
              : entry.type;
        result[region].push({ provider, kind });
      }
    }
    return result;
  } catch {
    return null;
  }
}

/**
 * Resolves availability for a title with the 24h cache as the gate.
 * Order: fresh cache -> live APIs -> catalog fallback (still cached).
 */
export async function getAvailability(
  title: CatalogTitle
): Promise<AvailabilitySnapshot> {
  const cached = await db
    .select()
    .from(mediaCache)
    .where(eq(mediaCache.tmdbId, title.tmdbId))
    .limit(1);

  if (cached.length > 0) {
    const age = Date.now() - cached[0].cachedAt.getTime();
    if (age < CACHE_TTL_MS) {
      return {
        source: "cache",
        fetchedAt: cached[0].cachedAt.toISOString(),
        offers: cached[0].ottProvidersJson as Record<Region, Offer[]>,
      };
    }
  }

  const tmdb = await fetchTmdb(title.slug);
  const live = await fetchStreamingAvailability(title.tmdbId);
  const offers = live ?? title.offers;
  const posterUrl = tmdb?.poster_path
    ? `https://image.tmdb.org/t/p/w342${tmdb.poster_path}`
    : null;

  await db
    .insert(mediaCache)
    .values({
      tmdbId: title.tmdbId,
      title: tmdb?.title ?? title.title,
      year: tmdb ? Number(tmdb.release_date.slice(0, 4)) || title.year : title.year,
      posterUrl,
      overview: tmdb?.overview ?? title.overview,
      ottProvidersJson: offers,
      cachedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: mediaCache.tmdbId,
      set: {
        title: tmdb?.title ?? title.title,
        posterUrl,
        overview: tmdb?.overview ?? title.overview,
        ottProvidersJson: offers,
        cachedAt: new Date(),
      },
    });

  return {
    source: live ? "live" : "catalog",
    fetchedAt: new Date().toISOString(),
    offers,
  };
}
