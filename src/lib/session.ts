import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { profiles, sessions, type Profile } from "@/db/schema";

export const SESSION_COOKIE = "os_session";
const SESSION_TTL_DAYS = 30;

export interface SessionUser {
  profile: Profile;
  sessionToken: string;
}

export function newToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string): Promise<string> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
  await db.insert(sessions).values({ token, userId, expiresAt });
  return token;
}

export async function findOrCreateProfile(email: string, fullName?: string): Promise<Profile> {
  const normalized = email.trim().toLowerCase();
  const existing = await db.select().from(profiles).where(eq(profiles.email, normalized)).limit(1);
  if (existing.length > 0) return existing[0];
  const inserted = await db
    .insert(profiles)
    .values({ email: normalized, fullName: fullName ?? normalized.split("@")[0] })
    .returning();
  return inserted[0];
}

/** Reads the session cookie and resolves it against sessions + profiles. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({ session: sessions, profile: profiles })
    .from(sessions)
    .innerJoin(profiles, eq(sessions.userId, profiles.id))
    .where(
      and(eq(sessions.token, token), gt(sessions.expiresAt, new Date()))
    )
    .limit(1);

  if (rows.length === 0) return null;
  return { profile: rows[0].profile, sessionToken: token };
}

export async function destroySession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 86_400,
  };
}
