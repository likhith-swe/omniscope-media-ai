import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Crown, Search, Clock, Film } from "lucide-react";
import { db } from "@/db";
import { searches, subscriptions } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { getTitle } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSessionUser();
  if (!session) redirect("/?signin=1&next=/dashboard");
  const { profile } = session;

  const [recent, subs] = await Promise.all([
    db
      .select()
      .from(searches)
      .where(eq(searches.userId, profile.id))
      .orderBy(desc(searches.createdAt))
      .limit(25),
    db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, profile.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1),
  ]);

  const activeSub = subs.find((s) => s.status === "active");
  const matched = recent.filter((s) => s.detectedSlug).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">account</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{profile.fullName}</h1>
          <p className="text-sm text-mute">{profile.email}</p>
        </div>
        {profile.isPro ? (
          <span className="flex items-center gap-2 rounded-lg border border-amber/40 bg-amber/10 px-3 py-2 font-mono text-xs text-amber">
            <Crown size={14} /> PRO · unlimited lookups
          </span>
        ) : (
          <Link href="/pricing" className="rounded-lg border border-white/[0.08] px-3 py-2 text-sm text-mute transition hover:border-amber/40 hover:text-ink">
            Free plan · upgrade
          </Link>
        )}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/[0.08] bg-surface p-5">
          <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
            <Search size={12} /> total lookups
          </p>
          <p className="mt-2 text-2xl font-bold">{recent.length}{recent.length === 25 ? "+" : ""}</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-surface p-5">
          <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
            <Film size={12} /> resolved
          </p>
          <p className="mt-2 text-2xl font-bold">{matched}</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-surface p-5">
          <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
            <Clock size={12} /> member since
          </p>
          <p className="mt-2 text-2xl font-bold">
            {profile.createdAt.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {activeSub && (
        <p className="mt-4 rounded-lg border border-jade/25 bg-jade/10 px-4 py-3 text-xs text-jade">
          Active subscription: {activeSub.provider} · {activeSub.externalSubscriptionId} · renews{" "}
          {activeSub.currentPeriodEnd.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}

      <h2 className="mt-10 text-lg font-semibold tracking-tight">Recent lookups</h2>
      {recent.length === 0 ? (
        <p className="mt-3 rounded-xl border border-white/[0.08] bg-surface p-6 text-sm text-mute">
          No lookups yet. Head to the <Link href="/#recognizer" className="text-amber">recognizer</Link> and drop a quote or a frame.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-white/[0.05] overflow-hidden rounded-xl border border-white/[0.08] bg-surface">
          {recent.map((s) => {
            const title = s.detectedSlug ? getTitle(s.detectedSlug) : undefined;
            return (
              <li key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">
                    {s.queryType === "image" ? "Screenshot lookup" : `“${s.inputPayload}”`}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-faint">
                    {s.queryType} · {s.createdAt.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {title ? (
                  <Link href={`/watch/${title.slug}`} className="shrink-0 rounded-md border border-white/[0.08] px-2.5 py-1.5 text-xs text-mute transition hover:border-amber/40 hover:text-amber">
                    {title.title} →
                  </Link>
                ) : (
                  <span className="shrink-0 font-mono text-[10px] uppercase text-faint">no match</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
