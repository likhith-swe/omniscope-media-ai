import Link from "next/link";
import { ArrowRight, Radio } from "lucide-react";
import Lenis from "@/components/Lenis";
import SearchInterface from "@/components/SearchInterface";
import AdContainer from "@/components/AdContainer";
import NewsletterForm from "@/components/NewsletterForm";
import { CATALOG, trendingTitles, formatRuntime } from "@/lib/catalog";

function PosterTile({ slug }: { slug: string }) {
  const t = CATALOG.find((x) => x.slug === slug);
  if (!t) return null;
  return (
    <Link
      href={`/watch/${t.slug}`}
      className="group relative block overflow-hidden rounded-lg border border-white/[0.08] transition hover:border-white/20"
    >
      <div
        className="grain relative flex aspect-[2/3] flex-col justify-between p-3.5"
        style={{ background: `linear-gradient(165deg, ${t.palette.from}, ${t.palette.to})` }}
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/50">
          {t.year} · ★ {t.rating.toFixed(1)}
        </span>
        <div>
          <p className="text-base font-bold uppercase leading-[1.05] tracking-tight text-white">
            {t.title.split(" ").map((w, i) => (
              <span key={`${w}-${i}`} className="block">{w}</span>
            ))}
          </p>
          <p className="mt-2 line-clamp-1 font-mono text-[9px] uppercase tracking-wider text-white/50">
            {t.genres[0]}
          </p>
        </div>
        <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" aria-hidden />
      </div>
    </Link>
  );
}

export default function Home() {
  const trending = trendingTitles(11);

  return (
    <Lenis>
      {/* Hero + recognizer */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(640px 300px at 50% -80px, rgba(240,178,90,0.10), transparent 70%)",
          }}
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 md:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-surface px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
              <Radio size={11} className="animate-blink text-jade" />
              catalog of {CATALOG.length} graded titles · availability refreshed every 24h
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Name that movie.
              <br />
              <span className="text-amber">Know where it plays.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-mute">
              Paste the one line you remember, describe the scene you half-remember, or drop a
              screenshot. OmniScope resolves the title and lists the exact platform carrying it
              in India, the US and the UK.
            </p>
          </div>

          <div className="mt-10">
            <SearchInterface />
          </div>
        </div>
      </section>

      {/* Trending catalog */}
      <section id="trending" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              programmatic catalog
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              Trending lookups this week
            </h2>
          </div>
          <p className="hidden font-mono text-[10px] uppercase tracking-wider text-faint md:block">
            {CATALOG.length} pages · schema.org/Movie · OG cards
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {trending.slice(0, 6).map((t) => (
            <PosterTile key={t.slug} slug={t.slug} />
          ))}
        </div>

        <div className="mt-6">
          <AdContainer slot="between-results" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {trending.slice(6, 11).map((t) => (
            <PosterTile key={t.slug} slug={t.slug} />
          ))}
          <Link
            href="/blueprint"
            className="group relative block overflow-hidden rounded-lg border border-white/[0.08] bg-surface transition hover:border-amber/40"
          >
            <div className="flex aspect-[2/3] flex-col justify-between p-3.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
                operators
              </span>
              <div>
                <p className="text-base font-bold uppercase leading-[1.05] tracking-tight">
                  Revenue
                  <span className="block text-amber">Blueprint</span>
                </p>
                <p className="mt-2 flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-mute">
                  Open the playbook <ArrowRight size={10} className="transition group-hover:translate-x-0.5" />
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Pipeline explainer */}
      <section className="border-y border-white/[0.06] bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-px overflow-hidden px-4 py-14 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Resolve the title",
              d: "Quote, description or frame is scored against graded dialogue, scene notes and color signatures. The top match ships with a confidence figure, not a guess.",
            },
            {
              n: "02",
              t: "Check your region",
              d: `Availability is verified per region across ${new Set(CATALOG.flatMap((t) => [...t.offers.IN, ...t.offers.US, ...t.offers.UK].map((o) => o.provider))).size} platforms. If a title is region-locked, the workaround is shown inline.`,
            },
            {
              n: "03",
              t: "Never miss a drop",
              d: "Subscribe to alerts and the Friday Movie Drop. When a title you looked up goes free to stream, the email is already queued.",
            },
          ].map((step) => (
            <div key={step.n} className="px-5 py-6">
              <p className="font-mono text-xs text-amber">{step.n}</p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">{step.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{step.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter capture */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid items-center gap-8 rounded-xl border border-white/[0.08] bg-surface p-8 md:grid-cols-2 md:p-10">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber">
              friday movie drop
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              Get notified the minute a title goes free to stream
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-mute">
              One email every Friday: five titles with the exact platform and plan that carries
              them in your region, plus one scene worth rewatching. The list funds itself
              through one clearly-labelled sponsor slot per issue.
            </p>
          </div>
          <NewsletterForm sourcePage="/" />
        </div>

        <p className="mt-10 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
          {formatRuntime(CATALOG.reduce((a, t) => a + t.runtime, 0))} of catalogued cinema ·
          recognition served from {"PostgreSQL"} · zero tracking pixels
        </p>
      </section>
    </Lenis>
  );
}
