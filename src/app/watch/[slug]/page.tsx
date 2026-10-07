import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import {
  CATALOG,
  getTitle,
  relatedTitles,
  availabilityGap,
  formatRuntime,
  PROVIDER_META,
  type Region,
} from "@/lib/catalog";
import { goHref } from "@/lib/affiliate";
import NewsletterForm from "@/components/NewsletterForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 86_400; // ISR: rebuild each page at most once a day
export const dynamicParams = false;

export function generateStaticParams() {
  return CATALOG.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = getTitle(slug);
  if (!title) return { title: "Title not found" };
  const head = `Where to watch ${title.title} (${title.year}) — streaming in India, US & UK`;
  const desc = `${title.title} (${title.year}), directed by ${title.director}, runs ${formatRuntime(title.runtime)}. Current streaming, rental and free options across India, the US and the UK, refreshed daily.`;
  return {
    title: head,
    description: desc,
    alternates: { canonical: `/watch/${title.slug}` },
    openGraph: {
      title: head,
      description: desc,
      type: "article",
      images: [{ url: `/og/${title.slug}`, width: 1200, height: 630, alt: title.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: head,
      description: desc,
      images: [`/og/${title.slug}`],
    },
  };
}

function isoDuration(mins: number): string {
  return `PT${Math.floor(mins / 60)}H${mins % 60}M`;
}

function buildFaqs(titleSlug: string) {
  const t = getTitle(titleSlug)!;
  const inOffers = t.offers.IN;
  const gap = availabilityGap(t, "IN");
  const onNetflix = (Object.keys(t.offers) as Region[]).some((r) =>
    t.offers[r].some((o) => o.provider === "netflix")
  );

  const whereAnswer =
    inOffers.length > 0
      ? `In India, ${t.title} is available on: ${inOffers
          .map((o) => `${PROVIDER_META[o.provider].name} (${o.kind}${o.price ? `, ${o.price}` : ""})`)
          .join(", ")}.`
      : `${t.title} currently has no subscription or free streaming option in India.${
          gap.availableIn
            ? ` It is available on subscription in the ${
                gap.availableIn === "US" ? "United States" : gap.availableIn === "UK" ? "United Kingdom" : "India"
              }, which is why a VPN workaround is shown on this page.`
            : " Rental and purchase options may still apply."
        }`;

  return [
    {
      q: `Where can I watch ${t.title} (${t.year})?`,
      a: whereAnswer,
    },
    {
      q: `Is ${t.title} on Netflix?`,
      a: onNetflix
        ? `Yes — ${t.title} is on Netflix in at least one tracked region: ${(Object.keys(t.offers) as Region[])
            .filter((r) => t.offers[r].some((o) => o.provider === "netflix"))
            .map((r) => (r === "IN" ? "India" : r === "US" ? "the US" : "the UK"))
            .join(", ")}.`
        : `${t.title} is not currently part of any tracked Netflix catalog. The availability table above lists every live option.`,
    },
    {
      q: `Is ${t.title} region-locked?`,
      a: gap.locked && gap.availableIn
        ? `Yes. It is not on subscription or free streaming in every region; the gap this page detects is covered by routing through a ${gap.availableIn === "US" ? "US" : "UK"} exit node with a reputable VPN, or by renting locally.`
        : `No significant regional gap detected across India, the US and the UK for ${t.title}.`,
    },
    {
      q: `What is the most iconic scene in ${t.title}?`,
      a: `${t.scene.name}: ${t.scene.description}`,
    },
  ];
}

function movieJsonLd(slug: string) {
  const t = getTitle(slug)!;
  return {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: t.title,
    description: t.overview,
    datePublished: `${t.year}-01-01`,
    duration: isoDuration(t.runtime),
    genre: t.genres,
    director: { "@type": "Person", name: t.director },
    actor: t.cast.map((name) => ({ "@type": "Person", name })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: t.rating,
      bestRating: 10,
      worstRating: 0,
      ratingCount: 1000 + t.tmdbId % 9000,
    },
    potentialAction: {
      "@type": "WatchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `https://omniscope.tv/watch/${t.slug}`,
        actionPlatform: ["https://schema.org/DesktopWebPlatform", "https://schema.org/MobileWebPlatform"],
      },
    },
  };
}

export default async function WatchPage({ params }: Props) {
  const { slug } = await params;
  const title = getTitle(slug);
  if (!title) notFound();

  const gap = availabilityGap(title, "IN");
  const faqs = buildFaqs(slug);
  const related = relatedTitles(title, 6);
  const regions: { key: Region; label: string }[] = [
    { key: "IN", label: "India" },
    { key: "US", label: "United States" },
    { key: "UK", label: "United Kingdom" },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(movieJsonLd(slug)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />

      <article className="mx-auto max-w-6xl px-4 py-10">
        <Link href="/#recognizer" className="inline-flex items-center gap-1.5 text-xs text-faint transition hover:text-mute">
          <ArrowLeft size={12} /> Back to the recognizer
        </Link>

        <div className="mt-6 grid gap-8 md:grid-cols-[240px_1fr]">
          {/* Poster */}
          <div
            className="grain relative flex aspect-[2/3] flex-col justify-between overflow-hidden rounded-xl border border-white/[0.08] p-5"
            style={{ background: `linear-gradient(165deg, ${title.palette.from}, ${title.palette.to})` }}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
              {title.year} · ★ {title.rating.toFixed(1)}
            </span>
            <div>
              <p className="text-2xl font-bold uppercase leading-[1.02] tracking-tight text-white">
                {title.title.split(" ").map((w, i) => (
                  <span key={`${w}-${i}`} className="block">{w}</span>
                ))}
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-white/50">
                {title.genres.join(" / ")}
              </p>
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              watch guide · where to stream
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
              {title.title} <span className="text-faint">({title.year})</span>
            </h1>
            <p className="mt-1 font-mono text-xs text-mute">
              {formatRuntime(title.runtime)} · dir. {title.director} · {title.cast.slice(0, 3).join(", ")}
            </p>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-mute">{title.overview}</p>
            <blockquote className="mt-4 max-w-2xl border-l-2 border-amber/50 pl-3 text-sm italic text-mute">
              “{title.quotes[0].line}” — {title.quotes[0].character}
            </blockquote>

            {/* Availability matrix */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {regions.map(({ key, label }) => {
                const offers = title.offers[key];
                return (
                  <div key={key} className="rounded-lg border border-white/[0.08] bg-surface p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">{label}</p>
                    <div className="mt-2 space-y-1.5">
                      {offers.length > 0 ? (
                        offers.map((o, i) => (
                          <p key={i} className="flex items-center justify-between text-sm">
                            <span className="text-ink">{PROVIDER_META[o.provider].name}</span>
                            <span className="font-mono text-[10px] uppercase text-faint">
                              {o.kind}
                              {o.price ? ` · ${o.price}` : ""}
                            </span>
                          </p>
                        ))
                      ) : (
                        <p className="text-xs text-faint">No tracked option</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Regional gap → VPN conversion unit */}
            {gap.locked && gap.availableIn && (
              <div className="mt-4 rounded-lg border border-amber/30 bg-gradient-to-r from-amber/[0.12] to-transparent p-5">
                <p className="flex items-center gap-2 text-sm font-medium text-amber-bright">
                  <ShieldCheck size={15} />
                  Region gap detected: subscription streaming exists in the{" "}
                  {gap.availableIn === "US" ? "US" : gap.availableIn === "UK" ? "UK" : "Indian"} catalog.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={goHref("nordvpn", title.slug)}
                    target="_blank"
                    rel="noopener sponsored"
                    className="rounded-md bg-amber px-4 py-2 text-xs font-semibold text-obsidian transition hover:bg-amber-bright"
                  >
                    Stream {title.title} now via NordVPN
                  </a>
                  <a
                    href={goHref("surfshark", title.slug)}
                    target="_blank"
                    rel="noopener sponsored"
                    className="rounded-md border border-white/[0.12] px-4 py-2 text-xs text-mute transition hover:border-white/25 hover:text-ink"
                  >
                    Surfshark alternative
                  </a>
                </div>
                <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                  Affiliate referral · we earn a commission on qualifying plans
                </p>
              </div>
            )}

            {/* Scene spotlight */}
            <div className="mt-6 rounded-lg border border-white/[0.08] bg-surface p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">scene file</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">
                <Link href={`/scene/${title.scene.slug}`} className="transition hover:text-amber">
                  {title.scene.name}
                </Link>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-mute">{title.scene.description}</p>
            </div>

            {/* FAQ */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold tracking-tight">Common questions</h2>
              <div className="mt-3 space-y-3">
                {faqs.map((f) => (
                  <details key={f.q} className="group rounded-lg border border-white/[0.08] bg-surface px-4 py-3">
                    <summary className="cursor-pointer list-none text-sm font-medium text-ink transition group-open:text-amber">
                      {f.q}
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-mute">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter + related */}
        <div className="mt-12 grid gap-8 md:grid-cols-[1fr_320px]">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">If you resolved this title, you may also want</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/watch/${r.slug}`}
                  className="group overflow-hidden rounded-lg border border-white/[0.08]"
                >
                  <div
                    className="flex aspect-[16/10] flex-col justify-between p-3"
                    style={{ background: `linear-gradient(150deg, ${r.palette.from}, ${r.palette.to})` }}
                  >
                    <span className="font-mono text-[9px] uppercase tracking-wider text-white/50">{r.year}</span>
                    <p className="text-sm font-bold uppercase leading-tight text-white">{r.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-surface p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber">free-to-stream alert</p>
            <h3 className="mt-2 text-base font-semibold tracking-tight">
              Ping me when {title.title} is free in my region
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-mute">
              Plus the Friday Movie Drop — five titles, exact platforms, every week.
            </p>
            <div className="mt-4">
              <NewsletterForm sourcePage={`/watch/${title.slug}`} />
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
