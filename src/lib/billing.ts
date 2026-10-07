import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, subscriptions } from "@/db/schema";

export const PLAN_INR = 399; // monthly, India
export const PLAN_USD = 9; // monthly, international

export interface ActivateArgs {
  userId: string;
  provider: "razorpay" | "stripe" | "demo";
  externalSubscriptionId: string;
  status: "active" | "cancelled" | "past_due";
  periodEnd: Date;
}

/** Idempotently grants Pro: closes any prior active row, writes the new one, flips the flag. */
export async function activateProSubscription(args: ActivateArgs): Promise<void> {
  await db
    .update(subscriptions)
    .set({ status: "cancelled" })
    .where(eq(subscriptions.userId, args.userId));

  await db.insert(subscriptions).values({
    userId: args.userId,
    provider: args.provider,
    externalSubscriptionId: args.externalSubscriptionId,
    status: args.status,
    planId: "pro_monthly",
    currentPeriodEnd: args.periodEnd,
  });

  await db
    .update(profiles)
    .set({ isPro: args.status === "active" })
    .where(eq(profiles.id, args.userId));
}

export async function revokePro(userId: string, externalSubscriptionId: string): Promise<void> {
  await db
    .update(subscriptions)
    .set({ status: "cancelled" })
    .where(eq(subscriptions.externalSubscriptionId, externalSubscriptionId));
  await db.update(profiles).set({ isPro: false }).where(eq(profiles.id, userId));
}

export function plusDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 86_400_000);
}
