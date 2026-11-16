export const ALGORITHM_VERSION = 'fit-v1.0.0';
export type GarmentType = 'bottom' | 'top' | 'dress';
export type FitCut = 'slim' | 'regular' | 'relaxed';
export interface BodyInput {
  height: number; weight: number; chest: number; waist: number; hips: number;
  inseam: number; outseam: number; shoulderWidth: number;
  bodyShapeType: 'hourglass' | 'pear' | 'apple' | 'rectangle' | 'athletic' | 'unspecified';
}
export interface MeasurementInput {
  variantId: string; size: string; stock: number;
  waist: number | null; hips: number | null; chest: number | null; inseam: number | null;
  outseam: number | null; totalLength: number | null; hemWidth: number | null; shoulderWidth: number | null;
}
export type Dimension = 'waist' | 'hips' | 'chest' | 'inseam' | 'shoulderWidth';
export interface DimensionResult {
  dimension: Dimension; score: number; bodyCm: number; garmentCm: number; differenceCm: number;
  comfortStretchCm: number; status: 'ideal' | 'loose' | 'tight' | 'long' | 'short';
}
export interface FitResult {
  overallScore: number;
  fitVerdict: 'Mükemmel' | 'Hafif Bol' | 'Basenden Dar Gelebilir' | 'Belden Dar Gelebilir' | 'Göğüsten Dar Gelebilir' | 'Paça Tadilat İster' | 'Bacak Boyu Kısa' | 'Uyum Düşük';
  verdictCode: 'perfect' | 'loose' | 'tight_hips' | 'tight_waist' | 'tight_chest' | 'hem_alteration' | 'short_leg' | 'poor';
  warnings: string[]; dimensions: DimensionResult[];
  recommendedSize: string | null; recommendedVariantId: string | null;
  algorithmVersion: string; confidence: 'measurement_based';
}
export class FitInputError extends Error {}
const round = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number) => Math.max(1, Math.min(100, Math.round(n)));
const policies: Record<GarmentType, Array<[Dimension, number]>> = {
  bottom: [['waist', 0.35], ['hips', 0.4], ['inseam', 0.25]],
  top: [['chest', 0.8], ['shoulderWidth', 0.2]],
  dress: [['chest', 0.35], ['waist', 0.3], ['hips', 0.35]],
};
const ease: Record<FitCut, Record<'waist' | 'hips' | 'chest', number>> = {
  slim: { waist: 0, hips: 0, chest: 2 }, regular: { waist: 2, hips: 4, chest: 6 },
  relaxed: { waist: 6, hips: 8, chest: 12 },
};

export function validateBody(body: BodyInput): void {
  const bounds: Record<Exclude<keyof BodyInput, 'bodyShapeType'>, [number, number]> = {
    height: [80, 250], weight: [15, 350], chest: [30, 250], waist: [25, 250], hips: [30, 250],
    inseam: [20, 130], outseam: [20, 250], shoulderWidth: [15, 90],
  };
  for (const [key, [min, max]] of Object.entries(bounds)) {
    const value = body[key as keyof typeof bounds];
    if (!Number.isFinite(value) || value < min || value > max) throw new FitInputError(`Invalid body measurement: ${key}`);
  }
  if (body.outseam < body.inseam || body.outseam > body.height) throw new FitInputError('Outseam must be between inseam and height');
}

export function assertMeasurements(m: MeasurementInput, type: GarmentType): void {
  for (const [dimension] of policies[type]) {
    const value = m[dimension];
    if (value === null || !Number.isFinite(value) || value <= 0)
      throw new FitInputError(`Missing or invalid garment measurement: ${dimension}`);
  }
}

function analyze(body: BodyInput, m: MeasurementInput, ratio: number, type: GarmentType, cut: FitCut): FitResult {
  assertMeasurements(m, type);
  const dimensions = policies[type].map(([dimension]) => {
    const bodyCm = body[dimension];
    const garmentCm = m[dimension]!;
    const differenceCm = garmentCm - bodyCm;
    let score: number, status: DimensionResult['status'], comfortStretchCm = 0;
    if (dimension === 'inseam' || dimension === 'shoulderWidth') {
      const tolerance = dimension === 'inseam' ? 2 : 1;
      score = 100 - Math.max(0, Math.abs(differenceCm) - tolerance) * (differenceCm < 0 ? 18 : 8);
      status = Math.abs(differenceCm) <= tolerance ? 'ideal' : dimension === 'inseam'
        ? differenceCm > 0 ? 'long' : 'short' : differenceCm > 0 ? 'loose' : 'tight';
    } else {
      // Only 60% of measured maximum stretch is treated as comfortable wearing capacity.
      comfortStretchCm = garmentCm * ratio * 0.6;
      const target = ease[cut][dimension];
      const shortage = Math.max(0, -differenceCm);
      const beyondStretch = Math.max(0, shortage - comfortStretchCm);
      const excess = Math.max(0, differenceCm - target - 2);
      const missingEase = Math.max(0, target - Math.max(0, differenceCm) - 2);
      score = 100 - beyondStretch * 18 - Math.min(shortage, comfortStretchCm) * 2 - excess * 5 - missingEase * 3;
      status = beyondStretch > 0.5 ? 'tight' : excess > 0 ? 'loose' : 'ideal';
    }
    return { dimension, bodyCm, garmentCm, differenceCm: round(differenceCm), comfortStretchCm: round(comfortStretchCm), score: clamp(score), status };
  });
  const weights = new Map(policies[type]);
  let overallScore = clamp(dimensions.reduce((sum, d) => sum + d.score * (weights.get(d.dimension) ?? 0), 0));
  const tight = dimensions.find(d => d.status === 'tight');
  const leg = dimensions.find(d => d.dimension === 'inseam');
  // A severe mismatch cannot be masked by high scores on the other dimensions.
  if (tight || leg?.status === 'short') overallScore = Math.min(overallScore, 69);
  let verdictCode: FitResult['verdictCode'] = 'perfect';
  if (tight) verdictCode = tight.dimension === 'hips' ? 'tight_hips' : tight.dimension === 'chest' ? 'tight_chest' : tight.dimension === 'waist' ? 'tight_waist' : 'poor';
  else if (leg?.status === 'short') verdictCode = 'short_leg';
  else if (leg?.status === 'long') verdictCode = 'hem_alteration';
  else if (dimensions.some(d => d.status === 'loose')) verdictCode = 'loose';
  else if (overallScore < 90) verdictCode = 'poor';
  const labels: Record<FitResult['verdictCode'], FitResult['fitVerdict']> = {
    perfect: 'Mükemmel', loose: 'Hafif Bol', tight_hips: 'Basenden Dar Gelebilir', tight_waist: 'Belden Dar Gelebilir',
    tight_chest: 'Göğüsten Dar Gelebilir', hem_alteration: 'Paça Tadilat İster', short_leg: 'Bacak Boyu Kısa', poor: 'Uyum Düşük',
  };
  const names: Record<Dimension, string> = { waist: 'Bel', hips: 'Basen', chest: 'Göğüs', inseam: 'İç bacak', shoulderWidth: 'Omuz' };
  const warnings = dimensions.filter(d => d.status !== 'ideal').map(d =>
    `${names[d.dimension]}: ${d.status === 'tight' ? 'dar gelebilir' : d.status === 'loose' ? 'bol gelebilir' : d.status === 'long' ? 'paça tadilatı gerekebilir' : 'kısa gelebilir'}`);
  return { overallScore, fitVerdict: labels[verdictCode], verdictCode, warnings, dimensions,
    recommendedSize: null, recommendedVariantId: null, algorithmVersion: ALGORITHM_VERSION, confidence: 'measurement_based' };
}

export function calculateFitScore(body: BodyInput, selected: MeasurementInput, elasticityRatio: number,
  alternatives: MeasurementInput[] = [], type: GarmentType = 'bottom', cut: FitCut = 'regular'): FitResult {
  validateBody(body);
  if (!Number.isFinite(elasticityRatio) || elasticityRatio < 0 || elasticityRatio > 0.5)
    throw new FitInputError('Elasticity ratio must be between 0 and 0.5');
  const result = analyze(body, selected, elasticityRatio, type, cut);
  const candidates = new Map([selected, ...alternatives].map(m => [m.variantId, m]));
  const ranked: Array<{ measurement: MeasurementInput; fit: FitResult }> = [];
  for (const m of candidates.values()) {
    if (m.stock <= 0) continue;
    try { ranked.push({ measurement: m, fit: analyze(body, m, elasticityRatio, type, cut) }); }
    catch (error) { if (!(error instanceof FitInputError)) throw error; }
  }
  ranked.sort((a, b) => b.fit.overallScore - a.fit.overallScore
    || Number(b.measurement.variantId === selected.variantId) - Number(a.measurement.variantId === selected.variantId)
    || a.measurement.variantId.localeCompare(b.measurement.variantId));
  const best = ranked[0];
  if (best && best.fit.overallScore >= 70) {
    result.recommendedSize = best.measurement.size;
    result.recommendedVariantId = best.measurement.variantId;
  }
  return result;
}
