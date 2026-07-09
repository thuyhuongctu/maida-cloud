import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionContext } from "@/lib/session";
import { getStripe } from "@/lib/stripe";
import { PLANS } from "@/lib/billing";

const schema = z.object({ plan: z.enum(["PRO", "TEAM"]) });

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Choose a valid plan." }, { status: 422 });

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Billing is not configured yet. Set your Stripe keys to enable upgrades." },
      { status: 503 }
    );
  }

  const priceEnv = PLANS[body.data.plan].priceEnv;
  const priceId = priceEnv ? process.env[priceEnv] : undefined;
  if (!priceId) {
    return NextResponse.json({ error: "This plan has no configured price." }, { status: 503 });
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: ctx.org.id,
    customer_email: ctx.user.email,
    success_url: `${appUrl}/billing?status=success`,
    cancel_url: `${appUrl}/billing?status=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
