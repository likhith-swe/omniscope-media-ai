import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clapperboard } from "lucide-react";
import { CATALOG, allScenePages } from "@/lib/catalog";
import NewsletterForm from "@/components/NewsletterForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 86_400;
export const dynamicParams = false;

export function generateStaticParams() {
  return allScenePages().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = allScenePages().find((s) => s.slug === slug);
  if (!entry) return { title: "Scene not found" };
  const t = entry.title;
  const head = `${t.scene.name} — the scene from ${t.title} (${t.year})`;
  const desc = `${t.scene.description} Why the ${t.scene.name.toLowerCase()} works, plus where ${t.title} streams right now.`;
  return {
    title: head,
    description: desc,
    alternates: { canonical: `/scene/${slug}` },
    openGraph: {
      title: head,
      description: desc,
      images: [{ url: `/og/${t.slug}`, width: 1200, height: 630, alt: t.title }],
    },
  };
}

export default async function ScenePage({ params }: Props) {
  const { slug } = await params;
  const entry = allScenePages().find((s) => s.slug === slug);
  if (!entry) return null;
  const t = entry.title;

  const others = CATALOG.filter((x) => x.slug !== t.slug).slice(0, 4);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: t.scene.name,
            description: t.scene.description,
            isPartOf: { "@type": "Movie", name: t.title, datePublished: `${t.year}-01-01` },
          }),
        }}
      />

      <Link href={`/watch/${t.slug}`} className="inline-flex items-center gap-1.5 text-xs text-faint transition hover:text-mute">
        <ArrowLeft size={12} /> Back to {t.title} watch guide
      </Link>

      <p className="mt-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
        <Clapperboard size={12} className="text-amber" /> scene file · {t.slug}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{t.scene.name}</h1>
      <p className="mt-1 font-mono text-xs text-mute">
        from {t.title} ({t.year}) · dir. {t.director}
      </p>

      <div
        className="grain relative mt-6 flex min-h-44 items-end overflow-hidden rounded-xl border border-white/[0.08] p-6"
        style={{ background: `linear-gradient(160deg, ${t.palette.from}, ${t.palette.to})` }}
      >
        <p className="max-w-lg text-xl font-bold uppercase leading-tight tracking-tight text-white drop-shadow">
          {t.scene.name}
        </p>
      </div>

      <p className="mt-6 text-[15px] leading-relaxed text-mute">{t.scene.description}</p>

      <blockquote className="mt-6 border-l-2 border-amber/50 pl-4">
        {t.quotes.map((q) => (
          <p key={q.line} className="mt-3 text-[15px] italic leading-relaxed text-ink">
            “{q.line}” <span className="not-italic text-xs text-faint">— {q.character}</span>
          </p>
        ))}
      </blockquote>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href={`/watch/${t.slug}`}
          className="rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-obsidian transition hover:bg-amber-bright"
        >
          Where to stream {t.title}
        </Link>
        <Link
          href="/#recognizer"
          className="rounded-lg border border-white/[0.08] px-4 py-2.5 text-sm text-mute transition hover:border-white/20 hover:text-ink"
        >
          Identify another scene
        </Link>
      </div>

      <div className="mt-12 rounded-xl border border-white/[0.08] bg-surface p-6">
        <h2 className="text-base font-semibold tracking-tight">More scene files</h2>
        <ul className="mt-3 space-y-2">
          {others.map((x) => (
            <li key={x.slug}>
              <Link href={`/scene/${x.scene.slug}`} className="text-sm text-mute transition hover:text-amber">
                {x.scene.name} — {x.title} ({x.year})
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <NewsletterForm sourcePage={`/scene/${slug}`} />
      </div>
    </article>
  );
}
