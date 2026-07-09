import { extractText, getDocumentProxy } from "unpdf";
import { complete } from "./llm";
import { resolveEffect } from "./effect-size";

const SYSTEM_PROMPT = `You are a precision meta-analysis data extraction assistant.
Read the provided article text and extract only the statistics that quantify
the primary relationship of interest.

Extract these fields when present:
- sampleN: total sample size
- effectR: Pearson correlation coefficient (preferred)
- effectT: t statistic
- effectDf: degrees of freedom paired with the t statistic
- effectBeta: standardised regression coefficient
- pValue: reported p value (encode an inequality as its boundary value)
- ciLower, ciUpper: bounds of a 95 percent confidence interval for r

Return a single JSON object with exactly these keys and no prose. Use null for
any field that is not reported. Never invent values. Preserve the sign of a
negative t or beta.`;

export interface ExtractionResult {
  sampleN: number | null;
  effectR: number | null;
  effectT: number | null;
  effectBeta: number | null;
  effectDf: number | null;
  pValue: number | null;
  ciLower: number | null;
  ciUpper: number | null;
  extractionConfidence: number;
  requiresVerification: boolean;
}

export async function extractFromPdf(bytes: Uint8Array): Promise<ExtractionResult> {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return extractFromText(String(text));
}

export async function extractFromText(text: string): Promise<ExtractionResult> {
  const user = `Article text (truncated):\n${text.slice(0, 40000)}\n\nReturn the JSON object.`;
  let raw = await complete({ system: SYSTEM_PROMPT, user });

  if (raw.startsWith("\`\`\`")) {
    raw = raw.replace(/^\`\`\`(json)?/, "").replace(/\`\`\`$/, "").trim();
  }

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  const num = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null;

  const resolved = resolveEffect({
    effectR: num(parsed.effectR),
    effectT: num(parsed.effectT),
    effectBeta: num(parsed.effectBeta),
    effectDf: num(parsed.effectDf),
  });

  return {
    sampleN: num(parsed.sampleN),
    effectR: resolved.effectR,
    effectT: num(parsed.effectT),
    effectBeta: num(parsed.effectBeta),
    effectDf: num(parsed.effectDf),
    pValue: num(parsed.pValue),
    ciLower: num(parsed.ciLower),
    ciUpper: num(parsed.ciUpper),
    extractionConfidence: resolved.confidence,
    requiresVerification: resolved.requiresVerification,
  };
}
