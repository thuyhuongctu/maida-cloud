import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { resolveOverriddenR } from "@/lib/effect-size";
import { getSessionContext } from "@/lib/session";

const patchSchema = z.object({
  fieldOverrides: z
    .object({
      paperTitle: z.string().optional(),
      authors: z.string().optional(),
      year: z.number().int().optional(),
      country: z.string().optional(),
      sampleN: z.number().nullable().optional(),
      effectR: z.number().nullable().optional(),
      effectT: z.number().nullable().optional(),
      effectBeta: z.number().nullable().optional(),
      effectDf: z.number().int().nullable().optional(),
      pValue: z.number().nullable().optional(),
    })
    .default({}),
  approved: z.boolean().default(false),
  notes: z.string().default(""),
});

// Apply reviewer overrides and approval to a study. Recomputes r when an
// upstream statistic is corrected. Does not lock the record.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const study = await db.study.findUnique({ where: { id: params.id } });
  if (!study || study.projectId !== ctx.projectId) {
    return NextResponse.json({ error: "Study not found." }, { status: 404 });
  }
  if (study.piLocked) {
    return NextResponse.json({ error: "The record is locked and cannot be edited." }, { status: 409 });
  }

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid verification payload." }, { status: 422 });
  }
  const { fieldOverrides, approved, notes } = body.data;
  const keys = Object.keys(fieldOverrides);

  const merged = { ...study, ...fieldOverrides };
  const effectR = resolveOverriddenR(
    { effectR: merged.effectR, effectT: merged.effectT, effectBeta: merged.effectBeta, effectDf: merged.effectDf },
    keys
  );

  const updated = await db.study.update({
    where: { id: params.id },
    data: {
      ...fieldOverrides,
      effectR,
      piNotes: notes,
      requiresVerification: approved ? false : study.requiresVerification,
    },
  });
  return NextResponse.json({ data: updated });
}
