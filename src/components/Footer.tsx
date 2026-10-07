import Link from "next/link";
import { CATALOG } from "@/lib/catalog";

export default function Footer() {
  const year = new Date().getFullYear();
  const sample = CATALOG.slice(0, 6);

  return (
    <footer className="mt-24 border-t border-white/[0.08] bg-surface/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <p className="text-sm font-semibold tracking-tight">
            Omni<span className="text-amber">Scope</span>
          </p>
          <p className="mt-2 text-xs leading-relaxed text-faint">
            Media intelligence: identify any film from a quoted line, a frame, or a
            half-remembered scene, then see exactly where it streams in your region.
            Availability data refreshes every 24 hours.
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-mute">
            <li><Link href="/#recognizer" className="transition hover:text-ink">Scene recognizer</Link></li>
            <li><Link href="/pricing" className="transition hover:text-ink">Pro Pass</Link></li>
            <li><Link href="/dashboard" className="transition hover:text-ink">Dashboard</Link></li>
            <li><Link href="/blueprint" className="transition hover:text-ink">Operator blueprint</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">Catalog</p>
          <ul className="mt-3 space-y-2 text-sm text-mute">
            {sample.map((t) => (
              <li key={t.slug}>
                <Link href={`/watch/${t.slug}`} className="transition hover:text-ink">
                  Where to watch {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">Disclosure</p>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            Some outbound links (VPN, Prime Video, Apple TV, BookMyShow) are paid
            affiliate referrals; OmniScope earns a commission at no extra cost to
            you. Streaming rights shift between platforms; verify on the platform
            before purchasing.
          </p>
        </div>
      </div>
      <div className="border-t border-white/[0.05] py-5">
        <p className="mx-auto max-w-6xl px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
          © {year} OmniScope Labs · Built for organic search, runs itself
        </p>
      </div>
    </footer>
  );
}
