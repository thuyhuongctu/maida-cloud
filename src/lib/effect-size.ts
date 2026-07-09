// Effect-size conversion utilities.
//
// The canonical target is Pearson r. When a study reports t or a
// standardised beta instead, r is derived using published conversions:
//   t to r:    Cohen (1988), r = sqrt(t^2 / (t^2 + df)), sign of t preserved
//   beta to r: Peterson and Brown (2005), r approx 0.98 * beta
//
// A three-level confidence score flags records for human review.

export const CONFIDENCE_DIRECT_R = 1.0;
export const CONFIDENCE_FROM_T = 0.8;
export const CONFIDENCE_FROM_BETA = 0.6;
export const CONFIDENCE_REVIEW_THRESHOLD = 0.7;

export function computeRFromT(t: number, df: number): number {
  const tSq = t * t;
  const rUnsigned = Math.sqrt(tSq / (tSq + df));
  return t >= 0 ? rUnsigned : -rUnsigned;
}

export function convertBetaToR(beta: number): number {
  return beta * 0.98;
}

export interface RawStatistics {
  effectR?: number | null;
  effectT?: number | null;
  effectBeta?: number | null;
  effectDf?: number | null;
}

export interface ResolvedEffect {
  effectR: number | null;
  confidence: number;
  requiresVerification: boolean;
}

// Resolve the canonical r from the reported statistics, following the
// preference order r, then t, then beta, and attach the matching
// confidence level.
export function resolveEffect(raw: RawStatistics): ResolvedEffect {
  let effectR: number | null = null;
  let confidence = 0;

  if (raw.effectR !== null && raw.effectR !== undefined) {
    effectR = raw.effectR;
    confidence = CONFIDENCE_DIRECT_R;
  } else if (
    raw.effectT !== null && raw.effectT !== undefined &&
    raw.effectDf !== null && raw.effectDf !== undefined
  ) {
    effectR = computeRFromT(raw.effectT, raw.effectDf);
    confidence = CONFIDENCE_FROM_T;
  } else if (raw.effectBeta !== null && raw.effectBeta !== undefined) {
    effectR = convertBetaToR(raw.effectBeta);
    confidence = CONFIDENCE_FROM_BETA;
  }

  return {
    effectR,
    confidence,
    requiresVerification: confidence < CONFIDENCE_REVIEW_THRESHOLD,
  };
}

// Resolve the canonical r after a reviewer override. Mirrors the extraction
// hierarchy so that correcting an upstream statistic (t, df or beta) flows
// through to r instead of leaving a stale value. An explicit r override wins.
export function resolveOverriddenR(
  data: RawStatistics,
  overriddenKeys: string[]
): number | null {
  const keys = new Set(overriddenKeys);
  if (keys.has("effectR")) return data.effectR ?? null;
  if (
    (keys.has("effectT") || keys.has("effectDf")) &&
    data.effectT !== null && data.effectT !== undefined &&
    data.effectDf !== null && data.effectDf !== undefined
  ) {
    return computeRFromT(data.effectT, data.effectDf);
  }
  if (keys.has("effectBeta") && data.effectBeta !== null && data.effectBeta !== undefined) {
    return convertBetaToR(data.effectBeta);
  }
  return data.effectR ?? null;
}
