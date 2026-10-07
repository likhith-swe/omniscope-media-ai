import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * OmniScope data model.
 *
 * The schema is intentionally denormalized where read volume dominates:
 * pSEO pages are static, so the hot read paths are the recognition API,
 * the affiliate redirect logger and the quota counter.
 */

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
    isPro: boolean("is_pro").notNull().default(false),
    dailySearchCount: integer("daily_search_count").notNull().default(0),
    quotaWindowStart: timestamp("quota_window_start", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("profiles_email_idx").on(t.email)]
);

export const sessions = pgTable(
  "sessions",
  {
    token: text("token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)]
);

export const searches = pgTable(
  "searches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    queryType: text("query_type").notNull(), // 'quote' | 'description' | 'image'
    inputPayload: text("input_payload").notNull(),
    detectedSlug: text("detected_title"),
    tmdbId: integer("tmdb_id"),
    ipHash: text("ip_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("searches_user_time_idx").on(t.userId, t.createdAt),
    index("searches_ip_time_idx").on(t.ipHash, t.createdAt),
  ]
);

/** 24-hour TTL cache for TMDb / Streaming-Availability responses. */
export const mediaCache = pgTable("media_cache", {
  tmdbId: integer("tmdb_id").primaryKey(),
  title: text("title").notNull(),
  year: integer("year").notNull(),
  posterUrl: text("poster_url"),
  overview: text("overview"),
  ottProvidersJson: jsonb("ott_providers_json").notNull(),
  cachedAt: timestamp("cached_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const affiliateClicks = pgTable(
  "affiliate_clicks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    partner: text("partner").notNull(), // 'nordvpn' | 'surfshark' | 'prime' | 'apple' | 'bms' ...
    targetUrl: text("target_url").notNull(),
    titleSlug: text("title_slug"),
    ipHash: text("ip_hash").notNull(),
    clickedAt: timestamp("clicked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("affiliate_partner_idx").on(t.partner, t.clickedAt),
  ]
);

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    sourcePage: text("source_page").notNull(),
    status: text("status").notNull().default("active"), // active | unsubscribed
    subscribedAt: timestamp("subscribed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("newsletter_email_idx").on(t.email)]
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // 'razorpay' | 'stripe' | 'demo'
    externalSubscriptionId: text("subscription_id").notNull(),
    status: text("status").notNull(), // 'active' | 'cancelled' | 'past_due'
    planId: text("plan_id").notNull().default("pro_monthly"),
    currentPeriodEnd: timestamp("current_period_end", {
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("subscriptions_user_idx").on(t.userId)]
);

/** Append-only audit trail of CRM sync attempts (Loops / Resend). */
export const crmEvents = pgTable(
  "crm_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(), // 'welcome_email' | 'loops_sync' | 'resend_event'
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("crm_events_kind_idx").on(t.kind, t.createdAt)]
);

export type Profile = typeof profiles.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Search = typeof searches.$inferSelect;
export type AffiliateClick = typeof affiliateClicks.$inferSelect;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
