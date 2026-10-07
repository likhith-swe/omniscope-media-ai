"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookmarkX } from "lucide-react";

export interface SavedEntry {
  slug: string;
  title: string;
  year: number;
  rating: number;
  genre: string;
  palette: { from: string; to: string };
}

export default function SavedGrid({ entries }: { entries: SavedEntry[] }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  const read = () => {
    try {
      const list = JSON.parse(localStorage.getItem("os_saved") ?? "[]") as string[];
      setSlugs(Array.isArray(list) ? list : []);
    } catch {
      setSlugs([]);
    }
  };

  useEffect(() => {
    read();
    const handler = () => read();
    window.addEventListener("omniscope:saved", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("omniscope:saved", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const saved = entries.filter((e) => slugs.includes(e.slug));

  if (saved.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-surface p-10 text-center">
        <BookmarkX size={22} className="mx-auto text-faint" />
        <p className="mt-3 text-sm text-mute">
          Nothing saved yet. Use the bookmark control on any recognition result to build your list.
        </p>
        <Link href="/#recognizer" className="mt-4 inline-block rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-obsidian transition hover:bg-amber-bright">
          Open the recognizer
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {saved.map((e) => (
        <Link key={e.slug} href={`/watch/${e.slug}`} className="group overflow-hidden rounded-lg border border-white/[0.08] transition hover:border-white/20">
          <div
            className="flex aspect-[2/3] flex-col justify-between p-3.5"
            style={{ background: `linear-gradient(165deg, ${e.palette.from}, ${e.palette.to})` }}
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/50">
              {e.year} · ★ {e.rating.toFixed(1)}
            </span>
            <div>
              <p className="text-base font-bold uppercase leading-[1.05] tracking-tight text-white">{e.title}</p>
              <p className="mt-1.5 font-mono text-[9px] uppercase tracking-wider text-white/50">{e.genre}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
