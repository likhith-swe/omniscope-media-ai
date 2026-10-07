import type { Metadata } from "next";
import PricingCtaButton from "@/components/PricingCtaButton";
import { Check, Minus } from "lucide-react";

export const metadata: Metadata = {
  title: "Pro Pass pricing — ₹399/mo or $9/mo",
  description:
    "OmniScope Free: 5 lookups a day with one ad unit. Pro: unlimited recognition, zero ads, timestamped quote search, 4K wallpaper exports and WhatsApp release alerts. Razorpay in India, Stripe everywhere else.",
  alternates: { canonical: "/pricing" },
};

const ROWS: { label: string; free: string | boolean; pro: string | boolean }[] = [
  { label: "Scene, quote and frame lookups", free: "5 per day", pro: "Unlimited" },
  { label: "Streaming availability (IN / US / UK)", free: true, pro: true },
  { label: "Regional-gap VPN workarounds", free: true, pro: true },
  { label: "Display advertising", free: "1 unit per 3 results", pro: "None" },
  { label: "Timestamped quote search", free: false, pro: true },
  { label: "4K wallpaper exports from matched frames", free: false, pro: true },
  { label: "WhatsApp / SMS release alerts", free: false, pro: true },
  { label: "Priority recognition queue", free: false, pro: true },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber">pro pass</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
        Five lookups a day are free. Everything after that is Pro.
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-mute">
        The free tier is the product's front door and it stays genuinely useful. Pro is for
        people who resolve titles daily and want the ads gone and the extra tooling on.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/[0.08] bg-surface p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Free</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">₹0</p>
          <p className="mt-1 text-xs text-faint">forever</p>
          <ul className="mt-4 space-y-2 text-sm text-mute">
            <li>· 5 recognitions per rolling 24 hours</li>
            <li>· Full availability table, three regions</li>
            <li>· Friday Movie Drop newsletter</li>
          </ul>
        </div>
        <div className="relative rounded-xl border border-amber/40 bg-surface p-6">
          <span className="absolute -top-2.5 right-5 rounded bg-amber px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-obsidian">
            recommended
          </span>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber">Pro Pass</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">
            ₹399 <span className="text-base font-medium text-mute">/ month · $9 elsewhere</span>
          </p>
          <p className="mt-1 text-xs text-faint">Razorpay (INR) · Stripe Billing (international) · cancel anytime</p>
          <div className="mt-4">
            <PricingCtaButton label="Start Pro" />
          </div>
        </div>
      </div>

      <table className="mt-8 w-full text-sm">
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
              <td className="py-3 pr-2 text-mute">{row.label}</td>
              <td className="py-3 text-center">
                {typeof row.free === "string" ? (
                  <span className="font-mono text-xs text-mute">{row.free}</span>
                ) : row.free ? (
                  <Check size={14} className="mx-auto text-faint" />
                ) : (
                  <Minus size={14} className="mx-auto text-faint/50" />
                )}
              </td>
              <td className="py-3 text-center">
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

      <div className="mt-10 rounded-xl border border-white/[0.08] bg-surface p-6">
        <h2 className="text-base font-semibold tracking-tight">How the billing runs</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-mute">
          <li>· India: Razorpay Subscriptions at ₹399/month. The checkout modal opens an order; the HMAC-signed response is verified server-side and reconfirmed by the Razorpay webhook at <code className="font-mono text-xs text-ink">/api/webhooks/razorpay</code>.</li>
          <li>· International: Stripe Billing at $9/month through a hosted Checkout Session; the subscription webhook flips the same <code className="font-mono text-xs text-ink">profiles.is_pro</code> flag.</li>
          <li>· Downgrades and cancellations revoke the flag on the next webhook; nothing is billed after cancellation.</li>
          <li>· This deployment has no payment keys configured, so checkout grants a clearly-labelled 30-day sandbox Pro pass instead of charging a card.</li>
        </ul>
      </div>
    </div>
  );
}
