"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, ShieldCheck, ExternalLink, Film } from "lucide-react";
import { PROVIDER_META, type Offer, type ProviderKey, type Region } from "@/lib/catalog";
import { goHref, type PartnerKey } from "@/lib/affiliate";
import type { RecognitionAvailability, RecognitionMatch } from "@/lib/api-types";

const PROVIDER_TO_PARTNER: Partial<Record<ProviderKey, PartnerKey>> = {
  prime: "prime",
  apple: "apple",
  bms: "bms",
};

const REGION_LABEL: Record<Region, string> = {
  IN: "India",
  US: "United States",
  UK: "United Kingdom",
};

function ProviderBadge({ offer, slug }: { offer: Offer; slug: string }) {
  const meta = PROVIDER_META[offer.provider];
  const partner = PROVIDER_TO_PARTNER[offer.provider];
  const href = partner ? goHref(partner, slug) : meta.homeUrl;
  const kindLabel =
    offer.kind === "subscription"
      ? "Included"
      : offer.kind === "free"
        ? "Free"
        : `${offer.kind === "rent" ? "Rent" : "Buy"}${offer.price ? ` · ${offer.price}` : ""}`;
  return (
    <a
      href={href}
      target="_blank"
      rel={partner ? "noopener sponsored" : "noopener"}
      className="group flex items-center gap-2 rounded-lg border border-white/[0.08] bg-raised px-3 py-2 transition hover:border-white/20"
    >
      <span
        className="grid size-6 place-items-center rounded text-[10px] font-bold"
        style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
        aria-hidden
      >
        {meta.name.charAt(0)}
      </span>
      <span className="text-left leading-tight">
        <span className="block text-xs font-medium text-ink">{meta.name}</span>
        <span className="block font-mono text-[10px] uppercase tracking-wide text-faint">{kindLabel}</span>
      </span>
      <ExternalLink size={12} className="ml-1 text-faint opacity-0 transition group-hover:opacity-100" />
    </a>
  );
}

export default function ResultCard({
  match,
  availability,
}: {
  match: RecognitionMatch;
  availability: RecognitionAvailability;
}) {
  const [saved, setSaved] = useState(false);
  const regionOffers: Offer[] = availability.offers[availability.region] ?? [];
  const locked = availability.locked;
  const availableIn = availability.availableIn;

  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem("os_saved") ?? "[]") as string[];
      setSaved(list.includes(match.slug));
    } catch {
      setSaved(false);
    }
  }, [match.slug]);

  const toggleSaved = () => {
    try {
      const list = JSON.parse(localStorage.getItem("os_saved") ?? "[]") as string[];
      const next = saved ? list.filter((s) => s !== match.slug) : [...list, match.slug];
      localStorage.setItem("os_saved", JSON.stringify(next));
      setSaved(!saved);
      window.dispatchEvent(new CustomEvent("omniscope:saved"));
    } catch {
      // localStorage unavailable (private mode); the toggle is a no-op.
    }
  };

  const words = match.title.split(" ");

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="overflow-hidden rounded-xl border border-white/[0.08] bg-surface"
    >
      <div className="grid md:grid-cols-[220px_1fr]">
        {/* Typographic poster */}
        <div
          className="grain relative flex min-h-56 flex-col justify-between overflow-hidden p-5"
          style={{ background: `linear-gradient(160deg, ${match.palette.from}, ${match.palette.to})` }}
        >
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
            <span>TMDB {`#${Math.abs(match.title.length * 7919) % 900000 + 1000}`}</span>
            <span>{match.year}</span>
          </div>
          <div>
            <p className="text-2xl font-bold uppercase leading-[1.02] tracking-tight text-white drop-shadow-lg">
              {words.map((w, i) => (
                <span key={`${w}-${i}`} className="block">{w}</span>
              ))}
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/60">
              {match.genres.join(" / ")}
            </p>
          </div>
          <div className="absolute -right-6 -top-6 size-24 rounded-full bg-white/5 blur-xl" aria-hidden />
        </div>

        {/* Details */}
        <div className="flex flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">{match.title}</h3>
              <p className="mt-0.5 font-mono text-xs text-mute">
                {match.year} · {Math.floor(match.runtime / 60)}h {String(match.runtime % 60).padStart(2, "0")}m ·{" "}
                <span className="text-amber">★ {match.rating.toFixed(1)}</span> · dir. {match.director}
              </p>
            </div>
            <button
              onClick={toggleSaved}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs text-mute transition hover:border-white/20 hover:text-ink"
              aria-pressed={saved}
            >
              {saved ? <BookmarkCheck size={13} className="text-amber" /> : <Bookmark size={13} />}
              {saved ? "Saved" : "Save"}
            </button>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
              <span>
                Matched via {match.matchedField === "palette" ? "frame color signature" : match.matchedField}
              </span>
              <span>{Math.round(match.confidence * 100)}% confidence</span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(match.confidence * 100)}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="h-full rounded-full bg-amber"
              />
            </div>
          </div>

          {match.matchedField !== "palette" && (
            <blockquote className="mt-3 border-l-2 border-amber/50 pl-3 text-sm italic text-mute">
              “{match.matchedSnippet}”
            </blockquote>
          )}

          <p className="mt-3 text-sm leading-relaxed text-mute">{match.overview}</p>

          <div className="mt-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              Streaming in {REGION_LABEL[availability.region]} · source: {availability.source}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {regionOffers.length > 0 ? (
                regionOffers.map((offer, i) => (
                  <ProviderBadge key={`${offer.provider}-${i}`} offer={offer} slug={match.slug} />
                ))
              ) : (
                <p className="rounded-md border border-white/[0.08] bg-raised px-3 py-2 text-xs text-faint">
                  No subscription or free option in {REGION_LABEL[availability.region]} right now.
                </p>
              )}
            </div>
          </div>

          {/* High-ticket VPN callout: fires only on genuine regional gaps. */}
          {locked && availableIn && (
            <div className="mt-4 rounded-lg border border-amber/30 bg-gradient-to-r from-amber/[0.12] to-transparent p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-amber-bright">
                <ShieldCheck size={15} />
                Not on subscription in {REGION_LABEL[availability.region]} — it is on {REGION_LABEL[availableIn]} catalogues.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-mute">
                Route your connection through a US/UK exit node and play it tonight. A 2-year plan
                pays back in one avoided rental.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={goHref("nordvpn", match.slug)}
                  target="_blank"
                  rel="noopener sponsored"
                  className="rounded-md bg-amber px-3.5 py-2 text-xs font-semibold text-obsidian transition hover:bg-amber-bright"
                >
                  Stream it now with NordVPN
                </a>
                <a
                  href={goHref("surfshark", match.slug)}
                  target="_blank"
                  rel="noopener sponsored"
                  className="rounded-md border border-white/[0.12] px-3.5 py-2 text-xs text-mute transition hover:border-white/25 hover:text-ink"
                >
                  Compare Surfshark
                </a>
              </div>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                Affiliate referral — we earn a commission on qualifying plans
              </p>
            </div>
          )}

          <div className="mt-auto flex items-center justify-between pt-4">
            <Link
              href={`/watch/${match.slug}`}
              className="flex items-center gap-1.5 text-sm text-amber transition hover:text-amber-bright"
            >
              <Film size={14} /> Full detail page &amp; scene guide
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
