import { db } from "./db";
import type { Plan } from "@prisma/client";

export interface PlanConfig {
  key: Plan;
  name: string;
  quota: number;
  priceEnv?: string;
}

// Monthly extraction quota per plan. Prices are configured through Stripe
// price identifiers in the environment; the quota logic itself needs no keys.
export const PLANS: Record<Plan, PlanConfig> = {
  FREE: { key: "FREE", name: "Free", quota: 10 },
  PRO: { key: "PRO", name: "Pro", quota: 500, priceEnv: "STRIPE_PRICE_PRO" },
  TEAM: { key: "TEAM", name: "Team", quota: 5000, priceEnv: "STRIPE_PRICE_TEAM" },
};

const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

export interface Usage {
  plan: Plan;
  used: number;
  quota: number;
  remaining: number;
}

// Reset the counter when the billing period has rolled over, then report the
// current usage against the plan quota.
export async function getUsage(orgId: string): Promise<Usage> {
  const org = await db.organization.findUniqueOrThrow({ where: { id: orgId } });
  let used = org.extractionsUsed;
  if (Date.now() - org.periodStart.getTime() > PERIOD_MS) {
    await db.organization.update({
      where: { id: orgId },
      data: { extractionsUsed: 0, periodStart: new Date() },
    });
    used = 0;
  }
  const quota = PLANS[org.plan].quota;
  return { plan: org.plan, used, quota, remaining: Math.max(0, quota - used) };
}

// Consume one extraction from the quota. Returns false when the quota is
// exhausted so the caller can prompt an upgrade.
export async function consumeExtraction(orgId: string): Promise<{ ok: boolean; usage: Usage }> {
  const usage = await getUsage(orgId);
  if (usage.remaining <= 0) return { ok: false, usage };
  await db.organization.update({
    where: { id: orgId },
    data: { extractionsUsed: { increment: 1 } },
  });
  return { ok: true, usage: { ...usage, used: usage.used + 1, remaining: usage.remaining - 1 } };
}

export function planForPriceId(priceId: string): Plan | null {
  if (priceId && priceId === process.env.STRIPE_PRICE_PRO) return "PRO";
  if (priceId && priceId === process.env.STRIPE_PRICE_TEAM) return "TEAM";
  return null;
}
