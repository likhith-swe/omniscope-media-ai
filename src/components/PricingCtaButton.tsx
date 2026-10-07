"use client";

import { Crown } from "lucide-react";
import { useUI } from "@/components/UIProvider";

export default function PricingCtaButton({ label }: { label: string }) {
  const { openPricing } = useUI();
  return (
    <button
      onClick={openPricing}
      className="inline-flex items-center gap-2 rounded-lg bg-amber px-5 py-3 text-sm font-semibold text-obsidian transition hover:bg-amber-bright"
    >
      <Crown size={15} /> {label}
    </button>
  );
}
