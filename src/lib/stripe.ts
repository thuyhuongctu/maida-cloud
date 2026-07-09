import Stripe from "stripe";

let client: Stripe | null = null;

// Returns a configured Stripe client, or null when billing keys are not set.
// The application runs fully without Stripe; only paid upgrades require it.
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) client = new Stripe(key, { apiVersion: "2024-06-20" });
  return client;
}
