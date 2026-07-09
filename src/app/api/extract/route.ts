import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import { extractFromPdf } from "@/lib/extractor";
import { consumeExtraction } from "@/lib/billing";

const metaSchema = z.object({
  title: z.string().default(""),
  authors: z.string().default(""),
  year: z.coerce.number().int().default(0),
  country: z.string().default(""),
});

// Accept a PDF upload, run extraction, and persist a study record in the
// signed-in user's project. The record still requires human verification.
export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A PDF file is required." }, { status: 400 });
  }
  const parsed = metaSchema.safeParse({
    title: form.get("title") ?? "", authors: form.get("authors") ?? "",
    year: form.get("year") ?? 0, country: form.get("country") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid metadata." }, { status: 422 });
  }

  const quota = await consumeExtraction(ctx.org.id);
  if (!quota.ok) {
    return NextResponse.json(
      { error: "You have reached your monthly extraction quota. Upgrade to continue.", usage: quota.usage },
      { status: 402 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await extractFromPdf(bytes);

  const study = await db.study.create({
    data: {
      projectId: ctx.projectId,
      paperTitle: parsed.data.title, authors: parsed.data.authors,
      year: parsed.data.year, country: parsed.data.country,
      ...result,
    },
  });
  return NextResponse.json({ data: study }, { status: 201 });
}
