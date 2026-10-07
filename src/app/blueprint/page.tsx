import type { Metadata } from "next";
import {
  Banknote,
  Search,
  Megaphone,
  Mail,
  Crown,
  Server,
  ShieldCheck,
  Rocket,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Operator blueprint — how this product runs itself",
  description:
    "The full operating document for OmniScope: five automated revenue channels, the programmatic SEO engine, the launch sequence, and the traffic playbook.",
  alternates: { canonical: "/blueprint" },
};

const CHANNELS = [
  {
    icon: ShieldCheck,
    name: "1 · High-ticket VPN commissions",
    unit: "$30–$45 per conversion",
    math: "3 conversions/day ≈ $90–$135/day before costs",
    body: "When a title carries a regional gap — no subscription or free option in the visitor's country but a live catalog in the US or UK — the result card renders a native callout. Clicks route through /api/go/nordvpn or /api/go/surfshark, which writes an affiliate_clicks row with a salted IP hash and 307-forwards to the network URL with the affiliate ID and UTM chain attached. The callout only renders on genuine gaps, which is what keeps the conversion rate high and the page trustworthy.",
  },
  {
    icon: Search,
    name: "2 · OTT and rental affiliate links",
    unit: "4%–10% rev share",
    math: "Amazon Associates tag on Prime rentals, Apple Performance Partner token on Apple TV, BookMyShow partner links for India",
    body: "Every monetized provider badge on a result card points at /api/go/[partner] with the title slug. The handler resolves the partner, builds the deep link with the associate tag, logs the click, and redirects. Direct partners (Netflix, Hotstar) link out without attribution because no program exists for them — the table stays honest.",
  },
  {
    icon: Megaphone,
    name: "3 · Display advertising",
    unit: "$4–$18 CPM depending on geo mix",
    math: "1 unit per 3 results + 1 sidebar unit on watch pages; Pro removes all of it",
    body: "AdContainer ships as a fixed-dimension, labelled slot. With AdSense or EthicalAds credentials provisioned it hydrates the external script; until approval it renders a house unit that promotes the Pro pass, so every impression still drives toward paid conversion. No layout shift, no unlabeled placements.",
  },
  {
    icon: Mail,
    name: "4 · Newsletter sponsorships",
    unit: "$25–$80 per 1,000 subscribers per issue",
    math: "10k subscribers × $40 × 4 Fridays ≈ $1,600/month",
    body: "Capture points: the landing page, every watch page sidebar, and the free-to-stream alert promise. /api/newsletter/subscribe validates the address, upserts newsletter_subscribers, writes a crm_events audit row, and pushes the contact to Loops.so when LOOPS_API_KEY is set. The Friday Movie Drop template carries exactly one clearly-labelled sponsor slot.",
  },
  {
    icon: Crown,
    name: "5 · Pro subscriptions",
    unit: "₹399/mo India · $9/mo international",
    math: "100 paying members ≈ $900 MRR at the blended rate",
    body: "The free tier hard-caps at 5 lookups per rolling 24 hours, enforced by the same searches table that powers the analytics — no separate counter to drift. Checkout routes to Razorpay Subscriptions or Stripe Billing; both webhooks converge on activateProSubscription, which flips profiles.is_pro and closes any prior active row. This deployment runs in labelled sandbox mode until payment keys are provisioned.",
  },
];

const LAUNCH_STEPS = [
  {
    n: "01",
    t: "Infrastructure (≈ 1 hour)",
    points: [
      "Vercel: import the repository, set the framework preset to Next.js, add env vars (DATABASE_URL, Upstash REST URL/token, affiliate IDs).",
      "Database: this codebase runs on PostgreSQL via Drizzle. On Supabase, the equivalent DDL lives in README.md with RLS policies and triggers included.",
      "Upstash: create one Redis database, copy the REST URL and token into UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. Without them the quota engine falls back to a Postgres sliding window automatically.",
      "Domain: point DNS at Vercel, let the TLS cert issue, then set NEXT_PUBLIC_SITE_URL to the apex domain.",
    ],
  },
  {
    n: "02",
    t: "Affiliate approvals",
    points: [
      "NordVPN and Surfshark both run on Impact; apply with a live domain and one published page that already links streaming content — approval follows the content review, not traffic volume.",
      "Amazon Associates: complete the first three sales within 180 days (the program audits this) by placing the Prime rental deep links on the highest-intent watch pages first.",
      "Impact Radius and Apple Performance Partners approve faster when the application describes the placement precisely: 'contextual VPN workaround on regional-gap movie pages'.",
      "Keep the FTC disclosure in the footer and next to every affiliate unit; networks audit for it.",
    ],
  },
  {
    n: "03",
    t: "First 1,000 visitors at zero ad spend",
    points: [
      "Communities: r/tipofmytongue, r/movies, r/MovieSuggestions and X threads asking 'what movie is this' are the exact demand this tool serves. Answer the question yourself, resolve the title, and include the link as the source. Manual, useful answers — bulk posting gets domains banned and deserves to.",
      "Google Search Console: verify the domain, submit /sitemap.xml (2×29+ pages generated from the catalog), then use the Indexing API only for pages Google explicitly permits it on; sitemap submission plus internal linking does the rest.",
      "Ship the sitemap to Bing Webmaster Tools the same day; Bing indexes programmatic catalogs faster and its traffic converts identically.",
    ],
  },
  {
    n: "04",
    t: "Compounding loop",
    points: [
      "Every recognition writes to searches; weekly, read the top unmatched inputs and add those titles to the catalog — demand itself writes the roadmap.",
      "Every watch page ships JSON-LD (Movie, WatchAction, FAQPage) and a generated OG card, so each shared link is its own ad on WhatsApp, X and Reddit.",
      "Newsletter growth funds sponsorships; sponsorship revenue funds the domain, database and Upstash bills, which sit near $20/month at this scale.",
    ],
  },
];

export default function BlueprintPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber">operator blueprint</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
        How this product finds traffic, converts it, and collects revenue — without a human on shift
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-mute">
        This is the operating document for the deployment you are looking at. Every mechanism
        described below is implemented in this codebase: the redirect handlers, the quota engine,
        the webhook verification, the JSON-LD, and the capture forms.
      </p>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Banknote size={17} className="text-amber" /> The five revenue channels
        </h2>
        <div className="mt-4 space-y-4">
          {CHANNELS.map((c) => (
            <article key={c.name} className="rounded-xl border border-white/[0.08] bg-surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-base font-semibold tracking-tight">
                  <c.icon size={15} className="text-amber" /> {c.name}
                </h3>
                <span className="rounded border border-white/[0.08] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-mute">
                  {c.unit}
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-jade">{c.math}</p>
              <p className="mt-3 text-sm leading-relaxed text-mute">{c.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Server size={17} className="text-amber" /> Traffic engine
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/[0.08] bg-surface p-6">
            <h3 className="text-base font-semibold tracking-tight">Programmatic SEO</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-mute">
              <li>· /watch/[slug] and /scene/[slug] are statically generated with ISR revalidation every 24 hours.</li>
              <li>· Each page embeds schema.org/Movie with aggregateRating, a WatchAction entry point, and a FAQPage block built from the same availability data the UI renders.</li>
              <li>· /og/[slug] renders a 1200×630 card from the title's graded palette, so every shared link carries branded artwork.</li>
              <li>· /sitemap.xml and /robots.txt are generated from the catalog on every deploy.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-surface p-6">
            <h3 className="text-base font-semibold tracking-tight">Retention loop</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-mute">
              <li>· Free-to-stream alert capture converts the exact moment a user learns a title is unavailable locally.</li>
              <li>· The Friday Movie Drop keeps the list warm; one sponsor slot per issue is the inventory.</li>
              <li>· Saved titles and the dashboard give signed-in users a reason to return with a bookmark, not a query.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Rocket size={17} className="text-amber" /> Launch sequence
        </h2>
        <div className="mt-4 space-y-4">
          {LAUNCH_STEPS.map((s) => (
            <article key={s.n} className="rounded-xl border border-white/[0.08] bg-surface p-6">
              <p className="font-mono text-xs text-amber">{s.n}</p>
              <h3 className="mt-1 text-base font-semibold tracking-tight">{s.t}</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-mute">
                {s.points.map((p) => (
                  <li key={p.slice(0, 24)}>· {p}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-xl border border-white/[0.08] bg-surface p-6">
        <h2 className="text-base font-semibold tracking-tight">Guardrails this product enforces</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-mute">
          <li>· Affiliate clicks are logged with salted IP hashes only; no raw IPs, no fingerprinting, no third-party tracking pixels.</li>
          <li>· VPN callouts render only on verified regional gaps — never as generic banner noise.</li>
          <li>· Ad units are labelled, fixed-size, and replaced entirely on the Pro tier.</li>
          <li>· The payment webhook verifies HMAC-SHA256 before touching any row, and the Razorpay checkout signature is re-verified client response by client response.</li>
          <li>· Community outreach happens as genuine answers; automation that spams platforms violates their rules and burns the domain.</li>
        </ul>
      </section>
    </div>
  );
}
