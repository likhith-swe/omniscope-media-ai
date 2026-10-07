import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber">404 · reel missing</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">This page is not in the catalog</h1>
      <p className="mt-2 text-sm leading-relaxed text-mute">
        The slug does not match any title or scene record. Head back to the recognizer and try
        the line of dialogue instead.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-obsidian transition hover:bg-amber-bright"
      >
        Back to the recognizer
      </Link>
    </div>
  );
}
