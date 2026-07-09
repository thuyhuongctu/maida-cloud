import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { getUsage, PLANS } from "@/lib/billing";
import { BillingPanel } from "@/components/BillingPanel";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const usage = await getUsage(ctx.org.id);
  const plans = [PLANS.FREE, PLANS.PRO, PLANS.TEAM].map((p) => ({ key: p.key, name: p.name, quota: p.quota }));
  return <BillingPanel usage={usage} plans={plans} orgName={ctx.org.name} />;
}
