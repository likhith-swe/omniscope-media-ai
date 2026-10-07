"use client";

import { useEffect, useRef } from "react";
import { Crown } from "lucide-react";
import { useUI } from "@/components/UIProvider";

/**
 * Policy-compliant ad slot.
 *
 * Loads Google AdSense when NEXT_PUBLIC_ADSENSE_CLIENT + NEXT_PUBLIC_ADSENSE_SLOT
 * are provisioned, otherwise EthicalAds when NEXT_PUBLIC_ETHICALADS_PROPERTY is
 * set. Until either is approved for the domain, the slot renders a clearly
 * labelled house promotion for the Pro pass — this keeps the layout honest
 * (fixed dimensions, labelled unit) and monetized from day one.
 */
export default function AdContainer({
  slot,
}: {
  slot: "between-results" | "sidebar" | "footer-strip";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const adsenseSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT;
  const ethicaladsProperty = process.env.NEXT_PUBLIC_ETHICALADS_PROPERTY;

  const height = slot === "sidebar" ? "min-h-64" : "min-h-24";

  useEffect(() => {
    if (!adsenseClient || !adsenseSlot) return;
    const id = `adsense-js-${adsenseClient}`;
    if (!document.getElementById(id)) {
      const script = document.createElement("script");
      script.id = id;
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
    try {
      const win = window as unknown as { adsbygoogle?: unknown[] };
      (win.adsbygoogle = win.adsbygoogle ?? []).push({});
    } catch {
      // AdSense blocked (ad blocker); the house fallback stays visible.
    }
  }, [adsenseClient, adsenseSlot]);

  useEffect(() => {
    if (!ethicaladsProperty || adsenseClient) return;
    const id = "ethicalads-js";
    if (!document.getElementById(id)) {
      const script = document.createElement("script");
      script.id = id;
      script.async = true;
      script.src = "https://media.ethicalads.io/media/client/ethicalads.min.js";
      document.head.appendChild(script);
    }
  }, [ethicaladsProperty, adsenseClient]);

  if (adsenseClient && adsenseSlot) {
    return (
      <div ref={ref} className={`overflow-hidden rounded-xl border border-white/[0.08] bg-surface ${height}`}>
        <ins
          className="adsbygoogle block w-full"
          style={{ display: "block", minHeight: slot === "sidebar" ? 250 : 90 }}
          data-ad-client={adsenseClient}
          data-ad-slot={adsenseSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <p className="px-3 py-1 text-right font-mono text-[9px] uppercase tracking-widest text-faint">
          advertisement
        </p>
      </div>
    );
  }

  if (ethicaladsProperty) {
    return (
      <div className={`overflow-hidden rounded-xl border border-white/[0.08] bg-surface ${height}`}>
        <div data-ea-publisher={ethicaladsProperty} data-ea-type="image" className="flat" />
        <p className="px-3 py-1 text-right font-mono text-[9px] uppercase tracking-widest text-faint">
          advertisement
        </p>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-4 overflow-hidden rounded-xl border border-white/[0.08] bg-surface px-5 ${height}`}>
      <div className="py-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">House unit · slot {slot}</p>
        <p className="mt-1 text-sm font-medium text-ink">
          This ad slot pays the servers. Pro members never see it.
        </p>
        <p className="mt-0.5 text-xs text-faint">
          Free tier carries 1 display unit per 3 results. Pro removes all units.
        </p>
      </div>
      <HouseAdCta />
    </div>
  );
}

function HouseAdCta() {
  const { openPricing, user } = useUI();
  if (user?.isPro) {
    return (
      <span className="shrink-0 rounded-md border border-jade/30 bg-jade/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-jade">
        Pro · ads off
      </span>
    );
  }
  return (
    <button
      onClick={openPricing}
      className="flex shrink-0 items-center gap-1.5 rounded-md bg-amber px-3.5 py-2 text-xs font-semibold text-obsidian transition hover:bg-amber-bright"
    >
      <Crown size={13} /> Remove ads
    </button>
  );
}
