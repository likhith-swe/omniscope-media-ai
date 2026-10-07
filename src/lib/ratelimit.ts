/**
 * Recognition quota engine.
 *
 * Free tier: 5 lookups per rolling 24-hour window. Pro tier: bypass.
 * Primary backend is a Postgres sliding window over the `searches` table —
 * it needs zero extra infrastructure. If Upstash credentials are present
 * the limiter upgrades to a Redis sliding window for sub-millisecond
 * checks at the edge of the hot path.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { and, eq, gte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { searches, profiles, type Profile } from "@/db/schema";

export const FREE_DAILY_LIMIT = 5;
export const WINDOW_MS = 24 * 60 * 60 * 1000;

export interface QuotaResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string; // ISO timestamp
  reason: "pro" | "within-limit" | "exhausted" | "anon-exhausted";
}

let upstashLimiter: Ratelimit | null = null;

function getUpstashLimiter(): Ratelimit | null {
  if (upstashLimiter) return upstashLimiter;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    upstashLimiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(FREE_DAILY_LIMIT, "24 h"),
      analytics: false,
      prefix: "omniscope:rec",
    });
    return upstashLimiter;
  } catch {
    return null;
  }
}

async function postgresUsage(key: {
  userId?: string;
  ipHash: string;
}): Promise<{ count: number; oldestInWindow: Date }> {
  const since = new Date(Date.now() - WINDOW_MS);
  const condition = key.userId
    ? and(
        gte(searches.createdAt, since),
        or(eq(searches.userId, key.userId), eq(searches.ipHash, key.ipHash))
      )
    : and(gte(searches.createdAt, since), eq(searches.ipHash, key.ipHash));

  const rows = await db
    .select({
      count: sql<number>`count(*)::int`,
      oldest: sql<Date>`min(${searches.createdAt})`,
    })
    .from(searches)
    .where(condition);

  const count = rows[0]?.count ?? 0;
  const oldest = rows[0]?.oldest ?? new Date();
  return { count, oldestInWindow: oldest instanceof Date ? oldest : new Date(oldest) };
}

/** Resets a profile's rolling counter column once its window has passed. */
export async function syncProfileQuota(profile: Profile): Promise<void> {
  const windowStart = new Date(profile.quotaWindowStart);
  if (Date.now() - windowStart.getTime() > WINDOW_MS && profile.dailySearchCount > 0) {
    await db
      .update(profiles)
      .set({ dailySearchCount: 0, quotaWindowStart: new Date() })
      .where(eq(profiles.id, profile.id));
  }
}

export async function checkQuota(args: {
  profile: Profile | null;
  ipHash: string;
}): Promise<QuotaResult> {
  const { profile, ipHash } = args;

  if (profile?.isPro) {
    return {
      allowed: true,
      remaining: Number.MAX_SAFE_INTEGER,
      limit: Number.MAX_SAFE_INTEGER,
      resetAt: new Date(Date.now() + WINDOW_MS).toISOString(),
      reason: "pro",
    };
  }

  const limiter = getUpstashLimiter();
  if (limiter) {
    const key = profile ? `u:${profile.id}` : `ip:${ipHash}`;
    const res = await limiter.limit(key);
    return {
      allowed: res.success,
      remaining: res.remaining,
      limit: FREE_DAILY_LIMIT,
      resetAt: new Date(res.reset).toISOString(),
      reason: res.success ? "within-limit" : profile ? "exhausted" : "anon-exhausted",
    };
  }

  const usage = await postgresUsage({ userId: profile?.id, ipHash });
  const allowed = usage.count < FREE_DAILY_LIMIT;
  return {
    allowed,
    remaining: Math.max(0, FREE_DAILY_LIMIT - usage.count),
    limit: FREE_DAILY_LIMIT,
    resetAt: new Date(usage.oldestInWindow.getTime() + WINDOW_MS).toISOString(),
    reason: allowed ? "within-limit" : profile ? "exhausted" : "anon-exhausted",
  };
}

/** Stable, privacy-safe visitor fingerprint for anonymous quotas. */
export async function hashIp(ip: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256")
    .update(`${ip}::${process.env.IP_SALT ?? "omniscope-static-salt"}`)
    .digest("hex")
    .slice(0, 32);
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "0.0.0.0"
  );
}
