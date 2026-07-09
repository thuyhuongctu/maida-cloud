import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import { ReviewPanel } from "@/components/ReviewPanel";
import type { StudyRow } from "@/components/StudiesTable";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const studies = await db.study.findMany({
    where: { projectId: ctx.projectId },
    orderBy: { extractedAt: "desc" },
    take: 50,
  });
  const rows: StudyRow[] = studies.map((s) => ({
    id: s.id, paperTitle: s.paperTitle, year: s.year,
    effectR: s.effectR, effectT: s.effectT, effectDf: s.effectDf, effectBeta: s.effectBeta,
    extractionConfidence: s.extractionConfidence,
    piLocked: s.piLocked, requiresVerification: s.requiresVerification,
  }));

  return <ReviewPanel initial={rows} />;
}
