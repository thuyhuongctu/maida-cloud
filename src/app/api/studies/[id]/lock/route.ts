import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";

// Permanently lock a verified study owned by the signed-in user. Once locked
// the record is immutable and eligible for the analysis export.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const study = await db.study.findUnique({ where: { id: params.id } });
  if (!study || study.projectId !== ctx.projectId) {
    return NextResponse.json({ error: "Study not found." }, { status: 404 });
  }
  if (study.piLocked) return NextResponse.json({ data: study });
  if (study.requiresVerification) {
    return NextResponse.json({ error: "Approve the record before locking it." }, { status: 422 });
  }
  const locked = await db.study.update({
    where: { id: params.id },
    data: { piLocked: true, lockedAt: new Date() },
  });
  return NextResponse.json({ data: locked });
}
