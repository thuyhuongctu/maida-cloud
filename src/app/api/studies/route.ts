import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const studies = await db.study.findMany({
    where: { projectId: ctx.projectId },
    orderBy: { extractedAt: "desc" },
  });
  return NextResponse.json({ data: studies });
}
