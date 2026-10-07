"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, Check, Minus, Loader2, Zap } from "lucide-react";
import { useUI } from "@/components/UIProvider";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const ROWS: { label: string; free: string | boolean; pro: string | boolean }[] = [
  { label: "Scene & quote lookups", free: "5 per day", pro: "Unlimited" },
  { label: "Display advertising", free: true, pro: false },
  { label: "Timestamped quote search", free: false, pro: true },
  { label: "4K wallpaper exports", free: false, pro: true },
  { label: "WhatsApp / SMS release alerts", free: false, pro: true },
  { label: "Priority recognition queue", free: false, pro: true },
];

type CheckoutMode = "razorpay" | "stripe";

export default function PricingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { user, refreshUser, openAuth } = useUI();
  const [busy, setBusy] = useState<CheckoutMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const startCheckout = async (mode: CheckoutMode) => {
    setError(null);
    setSuccess(null);
    if (!user) {
      openAuth();
      return;
    }
    setBusy(mode);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: mode }),
      });
      const data = (await res.json()) as {
        mode?: "razorpay" | "stripe" | "demo";
        orderId?: string;
        keyId?: string;
        amount?: number;
        currency?: string;
        url?: string;
        note?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? `Checkout failed (${res.status})`);

      if (data.mode === "demo") {
        setSuccess(data.note ?? "Pro pass activated.");
        await refreshUser();
        router.refresh();
        return;
      }
      if (data.mode === "stripe" && data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.mode === "razorpay" && data.orderId && data.keyId) {
        await openRazorpaySheet({
          orderId: data.orderId,
          keyId: data.keyId,
          amount: data.amount ?? 39900,
          currency: data.currency ?? "INR",
          email: user.email,
        });
        await refreshUser();
        router.refresh();
        setSuccess("Pro pass activated. Limits are off and ads are gone.");
        return;
      }
      throw new Error("Unexpected checkout response.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setBusy(null);
    }
  };

  const openRazorpaySheet = (args: {
    orderId: string;
    keyId: string;
    amount: number;
    currency: string;
    email: string;
  }): Promise<void> =>
    new Promise((resolve, reject) => {
      const launch = () => {
        if (!window.Razorpay) {
          reject(new Error("Razorpay SDK failed to load."));
          return;
        }
        const rzp = new window.Razorpay({
          key: args.keyId,
          order_id: args.orderId,
          amount: args.amount,
          currency: args.currency,
          name: "OmniScope",
          description: "Pro Pass — monthly",
          prefill: { email: args.email },
          theme: { color: "#F0B25A", backdrop_color: "rgba(8,9,14,0.85)" },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const res = await fetch("/api/checkout/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              });
              if (!res.ok) {
                const detail = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(detail.error ?? `Verification failed (${res.status})`);
              }
              resolve();
            } catch (err) {
              reject(err instanceof Error ? err : new Error("Verification failed."));
            }
          },
          modal: { ondismiss: () => reject(new Error("Checkout closed before payment.")) },
        });
        rzp.open();
      };
      if (window.Razorpay) {
        launch();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = launch;
      script.onerror = () => reject(new Error("Could not load the Razorpay SDK."));
      document.body.appendChild(script);
    });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/[0.08] bg-surface p-6 shadow-2xl shadow-black/60"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-faint transition hover:text-ink"
              aria-label="Close pricing dialog"
            >
              <X size={16} />
            </button>

            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber">
              OmniScope Pro Pass
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <h2 className="text-3xl font-bold tracking-tight">₹399</h2>
              <span className="text-sm text-mute">/ month in India</span>
              <span className="ml-auto font-mono text-sm text-mute">$9/mo elsewhere</span>
            </div>
            <p className="mt-1 text-sm text-mute">
              Cancel anytime. Razorpay handles INR; Stripe Billing handles everything else.
            </p>

            <table className="mt-5 w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] font-mono text-[10px] uppercase tracking-widest text-faint">
                  <th className="pb-2 text-left font-medium">Capability</th>
                  <th className="pb-2 text-center font-medium">Free</th>
                  <th className="pb-2 text-center font-medium text-amber">Pro</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-white/[0.05] last:border-0">
                    <td className="py-2.5 pr-2 text-mute">{row.label}</td>
                    <td className="py-2.5 text-center">
                      {typeof row.free === "string" ? (
                        <span className="font-mono text-xs text-mute">{row.free}</span>
                      ) : row.free ? (
                        <Check size={14} className="mx-auto text-faint" />
                      ) : (
                        <Minus size={14} className="mx-auto text-faint/50" />
                      )}
                    </td>
                    <td className="py-2.5 text-center">
                      {typeof row.pro === "string" ? (
                        <span className="font-mono text-xs text-amber">{row.pro}</span>
                      ) : row.pro ? (
                        <Check size={14} className="mx-auto text-jade" />
                      ) : (
                        <Minus size={14} className="mx-auto text-faint/50" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-5 space-y-2">
              <button
                onClick={() => startCheckout("razorpay")}
                disabled={busy !== null}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber px-4 py-3 text-sm font-semibold text-obsidian transition hover:bg-amber-bright disabled:opacity-60"
              >
                {busy === "razorpay" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Zap size={15} />
                )}
                Start Pro — ₹399/mo (Razorpay)
              </button>
              <button
                onClick={() => startCheckout("stripe")}
                disabled={busy !== null}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-raised px-4 py-3 text-sm font-medium transition hover:border-white/20 disabled:opacity-60"
              >
                {busy === "stripe" && <Loader2 size={15} className="animate-spin" />}
                Pay in USD — $9/mo (Stripe)
              </button>
            </div>

            {error && (
              <p className="mt-3 rounded-md border border-signal/30 bg-signal/10 px-3 py-2 text-xs text-signal">
                {error}
              </p>
            )}
            {success && (
              <p className="mt-3 rounded-md border border-jade/25 bg-jade/10 px-3 py-2 text-xs text-jade">
                {success}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
