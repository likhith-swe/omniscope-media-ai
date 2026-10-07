"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  Camera,
  X,
  Loader2,
  Crown,
  ScanSearch,
  AlertTriangle,
} from "lucide-react";
import ResultCard from "@/components/ResultCard";
import AdContainer from "@/components/AdContainer";
import { useUI } from "@/components/UIProvider";
import type { RecognitionResponse } from "@/lib/api-types";
import type { Region } from "@/lib/catalog";

const SAMPLE_QUOTES = [
  "You mustn't be afraid to dream a little bigger, darling",
  "Some men just want to watch the world burn",
  "Teja main hoon, mark idhar hai",
  "There is no spoon",
  "A million dollars isn't cool. A billion dollars is",
];

const REGIONS: { key: Region; label: string }[] = [
  { key: "IN", label: "India" },
  { key: "US", label: "United States" },
  { key: "UK", label: "United Kingdom" },
];

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export default function SearchInterface() {
  const { openPricing } = useUI();
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [region, setRegion] = useState<Region>("IN");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecognitionResponse | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const pushToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 6000);
  }, []);

  // Quick-search bridge from the navigation bar.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ query: string }>).detail;
      if (detail?.query) {
        setInput(detail.query);
        window.setTimeout(() => {
          runSearch(detail.query);
        }, 60);
      }
    };
    window.addEventListener("omniscope:search", handler);
    return () => window.removeEventListener("omniscope:search", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const readFile = (file: File) => {
    setImageError(null);
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      setImageError("Send a PNG, JPEG or WebP screenshot.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("That frame is over the 8 MB limit.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.onerror = () => setImageError("The file could not be read.");
    reader.readAsDataURL(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  const runSearch = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? input).trim();
      if (!text && !image) {
        pushToast("Type a quoted line or scene description, or drop a screenshot first.");
        return;
      }
      setLoading(true);
      setResult(null);
      try {
        const res = await fetch("/api/recognize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: text || undefined, image: image ?? undefined, region }),
        });
        const data = (await res.json()) as RecognitionResponse;
        if (res.status === 429) {
          setResult({ ...data, requiresPro: true });
          pushToast("Daily free limit reached. Pro removes it.");
          return;
        }
        if (!res.ok && !data.message) {
          pushToast(data.error ?? `Request failed (${res.status}).`);
          return;
        }
        setResult(data);
        if (data.ok) {
          document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      } catch {
        pushToast("Network error. Check your connection and retry.");
      } finally {
        setLoading(false);
      }
    },
    [input, image, region, pushToast]
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void runSearch();
  };

  const quotaChip = result?.quota
    ? result.quota.isPro
      ? "Pro · unlimited"
      : `${result.quota.remaining} of ${result.quota.limit} free lookups left today`
    : null;

  return (
    <section id="recognizer" className="relative mx-auto w-full max-w-3xl scroll-mt-24">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-xl border bg-surface transition ${
          dragging ? "border-amber/60 bg-amber/[0.04]" : "border-white/[0.08]"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-signal/70" />
              <span className="size-2.5 rounded-full bg-amber/70" />
              <span className="size-2.5 rounded-full bg-jade/70" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              scene recognizer · v2.4
            </span>
          </div>
          {quotaChip && (
            <span className="rounded border border-white/[0.08] px-2 py-0.5 font-mono text-[10px] text-mute">
              {quotaChip}
            </span>
          )}
        </div>

        <form onSubmit={onSubmit} className="p-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder={'Paste a line of dialogue or describe the scene: "…train platform, man in a grey suit, coin toss at a gas station"'}
            className="w-full resize-none rounded-lg border border-white/[0.08] bg-obsidian px-4 py-3 text-[15px] leading-relaxed placeholder:text-faint focus:border-amber/40"
            aria-label="Quoted line or scene description"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/[0.14] px-3 py-2 text-xs text-mute transition hover:border-amber/40 hover:text-ink"
            >
              <UploadCloud size={14} /> Drop / upload screenshot
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/[0.14] px-3 py-2 text-xs text-mute transition hover:border-amber/40 hover:text-ink"
            >
              <Camera size={14} /> Capture
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />

            <div className="ml-auto flex rounded-lg border border-white/[0.08] p-0.5" role="group" aria-label="Streaming region">
              {REGIONS.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRegion(r.key)}
                  className={`rounded-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                    region === r.key ? "bg-amber text-obsidian" : "text-faint hover:text-mute"
                  }`}
                >
                  {r.key}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-obsidian transition hover:bg-amber-bright disabled:opacity-60"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <ScanSearch size={15} />}
              Identify
            </button>
          </div>

          {(image || imageError) && (
            <div className="mt-3 flex items-center gap-3">
              {image && (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="Uploaded frame to identify" className="h-16 w-24 rounded-md border border-white/[0.08] object-cover" />
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-surface shadow"
                    aria-label="Remove image"
                  >
                    <X size={11} />
                  </button>
                </div>
              )}
              <p className="text-xs text-faint">
                {imageError ?? "Frame attached. The recognizer grades its color signature against the catalog."}
              </p>
            </div>
          )}
        </form>
      </div>

      {/* Sample quote pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        {SAMPLE_QUOTES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => {
              setInput(`"${q}"`);
              void runSearch(`"${q}"`);
            }}
            className="rounded-full border border-white/[0.08] bg-surface px-3 py-1.5 text-xs text-mute transition hover:border-amber/40 hover:text-ink"
          >
            “{q.length > 44 ? `${q.slice(0, 44)}…` : q}”
          </button>
        ))}
      </div>

      {/* Result area */}
      <div id="result" className="mt-6 space-y-4 scroll-mt-24">
        <AnimatePresence>
          {loading && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid overflow-hidden rounded-xl border border-white/[0.08] bg-surface md:grid-cols-[220px_1fr]"
            >
              <div className="skeleton min-h-56" />
              <div className="space-y-3 p-5">
                <div className="skeleton h-6 w-2/3 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="skeleton h-20 w-full rounded" />
                <div className="flex gap-2">
                  <div className="skeleton h-10 w-28 rounded" />
                  <div className="skeleton h-10 w-28 rounded" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {result?.requiresPro && (
          <div className="rounded-xl border border-amber/30 bg-amber/[0.06] p-5 text-center">
            <Crown size={22} className="mx-auto text-amber" />
            <h3 className="mt-2 text-lg font-semibold tracking-tight">You have used all 5 free lookups today</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-mute">
              The counter resets within 24 hours. Pro removes the cap entirely, kills the ads,
              and adds timestamped quote search.
            </p>
            <button
              onClick={openPricing}
              className="mt-4 rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-obsidian transition hover:bg-amber-bright"
            >
              Unlock Pro — ₹399/mo or $9/mo
            </button>
          </div>
        )}

        {result && !result.ok && !result.requiresPro && (
          <div className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-surface p-4">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber" />
            <p className="text-sm text-mute">
              {result.message ?? "No confident match. Try the exact dialogue line, or add an actor's name."}
            </p>
          </div>
        )}

        {result?.ok && result.match && result.availability && (
          <>
            <ResultCard match={result.match} availability={result.availability} />
            <AdContainer slot="between-results" />
          </>
        )}
      </div>

      {/* Error toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-white/[0.1] bg-raised px-4 py-2.5 text-sm text-ink shadow-xl shadow-black/50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
