import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { PLANS, planForPriceId } from "@/lib/billing";

export const dynamic = "force-dynamic";

// Stripe delivers subscription events here. On a completed checkout the
// organization is upgraded and its quota period is reset; on cancellation it
// returns to the free plan.
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature") ?? "";
  const raw = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { client_reference_id?: string | null; customer?: string | null; subscription?: string | null };
    const orgId = session.client_reference_id ?? undefined;
    if (orgId && session.subscription) {
      const sub = await stripe.subscriptions.retrieve(String(session.subscription));
      const priceId = sub.items.data[0]?.price?.id ?? "";
      const plan = planForPriceId(priceId);
      if (plan) {
        await db.organization.update({
          where: { id: orgId },
          data: {
            plan,
            extractionsUsed: 0,
            periodStart: new Date(),
            stripeCustomerId: session.customer ? String(session.customer) : undefined,
            stripeSubscriptionId: String(session.subscription),
          },
        });
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as { id: string };
    const org = await db.organization.findFirst({ where: { stripeSubscriptionId: sub.id } });
    if (org) {
      await db.organization.update({
        where: { id: org.id },
        data: { plan: "FREE", stripeSubscriptionId: null },
      });
    }
  }

  return NextResponse.json({ received: true });
}
