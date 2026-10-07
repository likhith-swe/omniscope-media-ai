import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { CATALOG } from "@/lib/catalog";
import SavedGrid, { type SavedEntry } from "@/components/SavedGrid";

export const metadata: Metadata = {
  title: "Saved titles",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const session = await getSessionUser();
  if (!session) redirect("/?signin=1&next=/saved");

  const entries: SavedEntry[] = CATALOG.map((t) => ({
    slug: t.slug,
    title: t.title,
    year: t.year,
    rating: t.rating,
    genre: t.genres[0],
    palette: { from: t.palette.from, to: t.palette.to },
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">watchlist</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">Saved titles</h1>
      <p className="mt-1 text-sm text-mute">
        Stored in this browser and keyed to your account surface. The bookmark control on any
        result card adds or removes entries.
      </p>
      <div className="mt-6">
        <SavedGrid entries={entries} />
      </div>
    </div>
  );
}
