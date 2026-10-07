# OmniScope — Autonomous Media Intelligence Business

Complete zero-to-one blueprint and production codebase for a self-monetizing
movie-identification platform. Users arrive from organic search and social
shares, resolve titles from quotes, scene descriptions or screenshots, and
generate revenue through five automated channels while they do it.

---

## 1. Revenue engine — five channels, one database

| # | Channel | Economics | Implementation |
|---|---------|-----------|----------------|
| 1 | VPN affiliate commissions | $30–$45 / conversion | Regional-gap detection renders a callout; clicks route through `GET /api/go/nordvpn?t=<slug>` which logs `affiliate_clicks` and 307-redirects with affiliate ID + UTM chain |
| 2 | OTT / rental affiliates | 4%–10% rev share | `/api/go/prime`, `/api/go/apple`, `/api/go/bms` deep links with Amazon Associates tag, Apple Performance Partner token, BookMyShow partner params |
| 3 | Display ads | $4–$18 CPM | `AdContainer` — labelled, fixed-size slot; AdSense/EthicalAds when provisioned, house Pro-pass unit until then; zero units on Pro tier |
| 4 | Newsletter sponsorships | $25–$80 / 1k subscribers / issue | `POST /api/newsletter/subscribe` → `newsletter_subscribers` + `crm_events` audit + Loops.so contact sync + Resend welcome email |
| 5 | Pro subscriptions | ₹399/mo (Razorpay) · $9/mo (Stripe) | `POST /api/checkout` → Razorpay order or Stripe Checkout Session; HMAC-verified webhook at `/api/webhooks/razorpay` flips `profiles.is_pro` |

Free tier: 5 lookups per rolling 24h (Upstash sliding window when provisioned,
Postgres window otherwise). Pro: unlimited, ad-free, timestamped quote search,
4K exports, WhatsApp/SMS release alerts.

## 2. Traffic engine

- **Programmatic SEO.** `/watch/[slug]` and `/scene/[slug]` are ISR pages
  (24h revalidation) with `schema.org/Movie` + `WatchAction` + `FAQPage`
  JSON-LD, canonical URLs, and generated `/sitemap.xml` + `/robots.txt`.
- **Viral loop.** `/og/[slug]` renders 1200×630 cards from each title's
  graded palette; every WhatsApp/X/Reddit share is branded artwork.
- **Recognition quality.** The matcher scores exact-phrase contiguity on
  graded quotes, weighted token overlap with IDF-style rarity, bigram
  contiguity, and a deterministic frame color-signature resolver.

## 3. Supabase migration (DDL, RLS, triggers)

The running deployment uses Drizzle ORM against PostgreSQL
(`src/db/schema.ts`). The Supabase-native equivalent of the same model:

```sql
-- ============================================================
-- OmniScope schema — Supabase PostgreSQL
-- ============================================================
create extension if not exists pgcrypto;

-- 1. profiles ------------------------------------------------
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  avatar_url text,
  is_pro boolean not null default false,
  daily_search_count integer not null default 0,
  quota_window_start timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 2. searches ------------------------------------------------
create table public.searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  query_type text not null check (query_type in ('quote','description','image')),
  input_payload text not null,
  detected_title text,
  tmdb_id integer,
  ip_hash text not null,
  timestamp timestamptz not null default now()
);
create index searches_user_time_idx on public.searches (user_id, timestamp);
create index searches_ip_time_idx on public.searches (ip_hash, timestamp);

-- 3. media_cache ---------------------------------------------
create table public.media_cache (
  tmdb_id integer primary key,
  title text not null,
  year integer not null,
  poster_url text,
  overview text,
  ott_providers_json jsonb not null,
  cached_at timestamptz not null default now()
);

-- 4. affiliate_clicks ----------------------------------------
create table public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  partner text not null,
  target_url text not null,
  title_slug text,
  ip_hash text not null,
  clicked_at timestamptz not null default now()
);
create index affiliate_partner_idx on public.affiliate_clicks (partner, clicked_at);

-- 5. newsletter_subscribers -----------------------------------
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source_page text not null,
  status text not null default 'active' check (status in ('active','unsubscribed')),
  subscribed_at timestamptz not null default now()
);

-- 6. subscriptions --------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('razorpay','stripe','demo')),
  subscription_id text not null,
  status text not null check (status in ('active','cancelled','past_due')),
  plan_id text not null default 'pro_monthly',
  current_period_end timestamptz not null,
  created_at timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.searches enable row level security;
alter table public.media_cache enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.subscriptions enable row level security;

create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "read own searches" on public.searches
  for select using (auth.uid() = user_id);
create policy "insert searches via service or owner" on public.searches
  for insert with check (user_id is null or auth.uid() = user_id);

create policy "media cache readable by everyone" on public.media_cache
  for select using (true);

create policy "read own clicks" on public.affiliate_clicks
  for select using (auth.uid() = user_id);
create policy "insert own clicks" on public.affiliate_clicks
  for insert with check (true); -- service-role writes carry ip_hash

create policy "newsletter inserts open" on public.newsletter_subscribers
  for insert with check (true);
create policy "newsletter reads for owner only" on public.newsletter_subscribers
  for select using (auth.uid()::text = email);

create policy "read own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);
-- subscriptions writes happen exclusively with the service_role key
-- from the verified payment webhooks.

-- ============================================================
-- Trigger 1: auto-provision a profile on signup + CRM welcome
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (email) do nothing;

  insert into public.crm_events (kind, payload)
  values ('welcome_email', jsonb_build_object('email', new.email, 'status', 'queued'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Trigger 2: rolling daily quota reset
-- ============================================================
create or replace function public.reset_daily_quota()
returns trigger
language plpgsql
as $$
begin
  if new.quota_window_start < now() - interval '24 hours' then
    new.daily_search_count := 0;
    new.quota_window_start := now();
  end if;
  return new;
end;
$$;

create trigger profiles_quota_reset
  before update of daily_search_count on public.profiles
  for each row execute function public.reset_daily_quota();
```

## 4. Environment variables

| Variable | Purpose | Fallback behaviour |
|----------|---------|--------------------|
| `DATABASE_URL` | PostgreSQL connection | required |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Redis rate limiting | Postgres sliding window |
| `TMDB_API_KEY`, `RAPIDAPI_KEY` | Live metadata + availability | verified local catalog, still cached 24h |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | INR billing | labelled 30-day sandbox Pro pass |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` | International billing | same sandbox path |
| `RESEND_API_KEY`, `RESEND_FROM` | Magic-link + welcome emails | instant session issue |
| `LOOPS_API_KEY` | CRM contact sync | audit row only |
| `NORDVPN_AFF_ID`, `SURFSHARK_AFF_ID`, `AMAZON_ASSOCIATE_TAG`, `APPLE_AFFILIATE_TOKEN` | Affiliate attribution | placeholder IDs — swap on approval |
| `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADSENSE_SLOT`, `NEXT_PUBLIC_ETHICALADS_PROPERTY` | Display ads | house Pro-pass unit |
| `NEXT_PUBLIC_SUPABASE_URL` | Google OAuth handoff | labelled demo identity |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for sitemap/OG | omniscope.tv |

## 5. Launch playbook

### 5.1 Infrastructure (~1 hour)
1. Import repo into Vercel; framework preset Next.js.
2. Create the database (Supabase project or any Postgres), apply the DDL
   above (or `npx drizzle-kit push` for the Drizzle schema).
3. Provision an Upstash Redis database; paste REST URL + token.
4. Add env vars, deploy, point the domain, wait for TLS.

### 5.2 Affiliate approvals without existing traffic
- **NordVPN / Surfshark (Impact):** apply with the live domain and the
  highest-intent page URL (`/watch/<slug>` with the VPN callout visible).
  Content review, not traffic volume, drives approval.
- **Amazon Associates:** approved immediately; the 180-day review requires
  three qualifying sales — concentrate Prime rental links on regional-gap
  pages where intent is highest.
- **Apple Performance Partners / BookMyShow:** describe the exact placement
  in the application; vague descriptions are the usual rejection cause.
- Keep the FTC disclosure (footer + adjacent to every unit) from day one.

### 5.3 First 1,000 visitors, zero ad spend
- **Reddit & X demand capture:** r/tipofmytongue, r/movies,
  r/MovieSuggestions and "what movie is this?" threads are the literal
  query this tool answers. Resolve the title for the poster and cite the
  site as source — a genuine, correct answer in a thread that will rank
  for that exact phrasing. Bulk-linking automation gets domains banned;
  the moat here is being right first.
- **Indexing:** verify the domain in Search Console and Bing Webmaster
  Tools, submit `/sitemap.xml`. The Indexing API is reserved for content
  Google explicitly permits it for; sitemap + internal links + FAQ
  snippets compound from there.

### 5.4 Unit economics summary
| Scenario | Assumption | Monthly revenue |
|----------|-----------|-----------------|
| VPN only | 3 conv/day × $35 | ~$3,150 |
| Display only | 150k PV × $8 CPM | ~$1,200 |
| Newsletter only | 10k subs × $40 × 4 | ~$1,600 |
| Pro only | 100 members blended $9 | ~$900 |
| **Combined at modest volume** | | **~$6,800/mo** |

Costs at this scale: hosting $0–20, database $0–25, Upstash $0–10,
email $0–20. Margin sits above 95%.

---

**Repository map.** `src/db/schema.ts` (data model) · `src/lib` (catalog,
recognition, quota, affiliate, billing, session, external-API client) ·
`src/app/api` (recognize, go/[partner], newsletter, checkout, webhooks,
auth) · `src/components` (Navigation, SearchInterface, ResultCard,
AdContainer, PricingModal, AuthModal) · `src/app/watch|scene|pricing|
blueprint|dashboard|saved` (pages) · `src/app/og` + `sitemap.ts` +
`robots.ts` (SEO surface).
