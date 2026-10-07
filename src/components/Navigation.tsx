"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Search, ChevronDown, LogOut, LayoutDashboard, Bookmark, Crown } from "lucide-react";
import { useUI } from "@/components/UIProvider";

function ScopeMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="#F0B25A" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.4" fill="#F0B25A" />
      <path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4" stroke="#E8E6E1" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const LINKS = [
  { href: "/#recognizer", label: "Recognizer" },
  { href: "/#trending", label: "Catalog" },
  { href: "/blueprint", label: "Blueprint" },
  { href: "/pricing", label: "Pricing" },
];

export default function Navigation() {
  const { user, openAuth, openPricing } = useUI();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setDrawer(false);
    setMenu(false);
  }, [pathname]);

  const submitQuickSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    window.dispatchEvent(new CustomEvent("omniscope:search", { detail: { query: q } }));
    document.getElementById("recognizer")?.scrollIntoView({ behavior: "smooth" });
    setQuery("");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-obsidian/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <ScopeMark />
          <span className="text-[15px] font-semibold tracking-tight">
            Omni<span className="text-amber">Scope</span>
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-faint md:inline">
            media intelligence
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm text-mute transition hover:bg-white/[0.05] hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={submitQuickSearch} className="relative hidden flex-1 md:block" role="search">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Drop a quote: “You mustn't be afraid to dream a little bigger…”"
            className="w-full rounded-lg border border-white/[0.08] bg-surface py-1.5 pl-9 pr-3 text-sm placeholder:text-faint focus:border-amber/40"
            aria-label="Search a quoted line"
          />
        </form>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenu((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-surface px-3 py-1.5 text-sm transition hover:border-white/20"
                aria-expanded={menu}
              >
                <span className="grid size-6 place-items-center rounded-full bg-raised font-mono text-[11px] text-amber">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-28 truncate text-mute sm:inline">{user.email}</span>
                {user.isPro && (
                  <span className="flex items-center gap-1 rounded border border-amber/40 bg-amber/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-amber">
                    <Crown size={10} /> PRO
                  </span>
                )}
                <ChevronDown size={13} className="text-faint" />
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-white/[0.08] bg-surface shadow-xl shadow-black/50"
                  >
                    <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2.5 text-sm text-mute transition hover:bg-white/[0.05] hover:text-ink">
                      <LayoutDashboard size={14} /> Dashboard
                    </Link>
                    <Link href="/saved" className="flex items-center gap-2 px-3 py-2.5 text-sm text-mute transition hover:bg-white/[0.05] hover:text-ink">
                      <Bookmark size={14} /> Saved titles
                    </Link>
                    {!user.isPro && (
                      <button onClick={openPricing} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-amber transition hover:bg-white/[0.05]">
                        <Crown size={14} /> Upgrade to Pro
                      </button>
                    )}
                    <form action="/api/auth/signout" method="post" className="border-t border-white/[0.08]">
                      <button type="submit" className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-mute transition hover:bg-white/[0.05] hover:text-signal">
                        <LogOut size={14} /> Sign out
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <button
                onClick={openAuth}
                className="rounded-lg border border-white/[0.08] bg-surface px-3.5 py-1.5 text-sm text-mute transition hover:border-white/20 hover:text-ink"
              >
                Sign in
              </button>
              <button
                onClick={openPricing}
                className="hidden rounded-lg bg-amber px-3.5 py-1.5 text-sm font-semibold text-obsidian transition hover:bg-amber-bright sm:inline-flex"
              >
                Go Pro
              </button>
            </>
          )}

          <button
            onClick={() => setDrawer(true)}
            className="rounded-lg border border-white/[0.08] p-2 text-mute lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={16} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {drawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/70" onClick={() => setDrawer(false)} aria-hidden />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute right-0 top-0 h-full w-72 border-l border-white/[0.08] bg-surface p-5"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <ScopeMark size={18} /> OmniScope
                </span>
                <button onClick={() => setDrawer(false)} aria-label="Close menu" className="text-faint">
                  <X size={16} />
                </button>
              </div>
              <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile">
                {LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-3 py-2.5 text-sm text-mute transition hover:bg-white/[0.05] hover:text-ink"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link href="/dashboard" className="rounded-md px-3 py-2.5 text-sm text-mute transition hover:bg-white/[0.05] hover:text-ink">
                  Dashboard
                </Link>
                <Link href="/saved" className="rounded-md px-3 py-2.5 text-sm text-mute transition hover:bg-white/[0.05] hover:text-ink">
                  Saved titles
                </Link>
              </nav>
              {!user && (
                <button
                  onClick={() => {
                    setDrawer(false);
                    openAuth();
                  }}
                  className="mt-6 w-full rounded-lg border border-white/[0.08] px-4 py-2.5 text-sm text-mute"
                >
                  Sign in
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
