import { isFeaturedTool } from '@/config/featuredTools';
import { isPricingSourceUrl, normalizeRowSources } from '@/lib/vsSources';
import { buildDecisionTableRowEntries, hasDecisionRow } from '@/lib/vsDecisionTable';
import { VsDiffRow, VsScore } from '@/types/vs';

type ScoreCoverage = VsScore['provenance']['coverage'][string];

export const INTERNAL_SCORE_METRICS = [
  'pricingValue',
  'ease',
  'speed',
  'output',
  'customization',
] as const;

export type InternalScoreMetric = (typeof INTERNAL_SCORE_METRICS)[number];
export type ScoreWinner = 'a' | 'b' | 'tie';
export type OverallWinner = 'a' | 'b' | 'close';

export const DEFAULT_INTERNAL_SCORE_WEIGHTS: Record<InternalScoreMetric, number> = {
  pricingValue: 25,
  ease: 20,
  speed: 20,
  output: 20,
  customization: 15,
};

export const INTERNAL_SCORE_CLOSE_CALL_DELTA = 0.2;
export const FEATURED_CALIBRATION_MIN_WIN_MARGIN = 0.15;
export const INTERNAL_SCORE_STEP = 0.5;

const FEATURED_CALIBRATION_ALLOCATIONS: Record<'ease' | 'speed' | 'output' | 'customization', number> = {
  ease: 0.25,
  speed: 0.25,
  output: 0.35,
  customization: 0.15,
};

const SCORE_METRIC_HINTS: Record<string, string[]> = {
  pricingValue: ['pricing', 'free plan', 'starting point', 'cost'],
  ease: ['best for', 'templates', 'workflow', 'api'],
  speed: ['workflow speed', 'speed'],
  output: ['output', 'languages', 'dubbing', 'quality'],
  customization: ['templates', 'api', 'customization', 'team collaboration'],
};

const VERIFIED_RATIONALE: Record<string, string> = {
  pricingValue: 'From pricing pages and plan documentation.',
  ease: 'From documented onboarding flow, template setup, and usability notes.',
  speed: 'From workflow and speed claims in verified product sources.',
  output: 'From official output capability descriptions and documentation.',
  customization: 'From documented controls, templates, API scope, and configuration options.',
};

const ESTIMATED_RATIONALE: Record<string, string> = {
  pricingValue: 'Derived from structured product data when row-level pricing sources are not linked yet.',
  ease: 'Derived from structured product data and workflow attributes.',
  speed: 'Derived from structured product data and workflow-related attributes.',
  output: 'Derived from structured product data and output capability attributes.',
  customization: 'Derived from structured product data and feature-coverage attributes.',
};

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function asString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function normalizeSources(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return dedupe(
    value
      .map((item) => asString(item))
      .filter((item): item is string => Boolean(item)),
  ).slice(0, 3);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function getScoreMetricKeys(score: Pick<VsScore, 'weights' | 'a' | 'b'>): string[] {
  return [...INTERNAL_SCORE_METRICS];
}

function inferSourcesForMetric(metric: string, rows: VsDiffRow[]): string[] {
  if (metric === 'pricingValue') {
    const pricingRow = rows.find((row) => row.label.toLowerCase() === 'pricing starting point');
    if (!pricingRow) return [];
    const sources = normalizeRowSources(pricingRow);
    return dedupe([...sources.a, ...sources.b].filter((url) => isPricingSourceUrl(url))).slice(0, 3);
  }

  const hints = (SCORE_METRIC_HINTS[metric] ?? []).map((item) => item.toLowerCase());
  return dedupe(
    rows
      .filter((row) => {
        if (hints.length === 0) return true;
        const label = row.label.toLowerCase();
        return hints.some((hint) => label.includes(hint));
      })
      .flatMap((row) => {
        const sources = normalizeRowSources(row);
        return [...sources.a, ...sources.b];
      }),
  ).slice(0, 3);
}

function toCoverage(value: unknown): ScoreCoverage | null {
  if (value === 'verified' || value === 'estimated') return value;
  return null;
}

function buildRationale(metric: string, coverage: ScoreCoverage): string {
  if (coverage === 'verified') {
    return VERIFIED_RATIONALE[metric] ?? 'From verified sources linked for this metric.';
  }
  return (
    ESTIMATED_RATIONALE[metric] ??
    'Derived from structured product data when direct row-level source links are limited.'
  );
}

export function deriveScoreMode(
  coverage: Record<string, ScoreCoverage>,
): VsScore['provenance']['mode'] {
  const values = Object.values(coverage);
  if (values.length === 0) return 'estimated';
  const allVerified = values.every((value) => value === 'verified');
  if (allVerified) return 'verified';
  const allEstimated = values.every((value) => value === 'estimated');
  if (allEstimated) return 'estimated';
  return 'mixed';
}

export function buildInferredScoreProvenance(
  metrics: string[],
  rows: VsDiffRow[],
): VsScore['provenance'] {
  const coverage: Record<string, ScoreCoverage> = {};
  const rationale: Record<string, string> = {};
  const sources: Record<string, string[]> = {};

  for (const metric of metrics) {
    const metricSources = inferSourcesForMetric(metric, rows);
    const metricCoverage: ScoreCoverage = metricSources.length > 0 ? 'verified' : 'estimated';
    coverage[metric] = metricCoverage;
    sources[metric] = metricSources;
    rationale[metric] = buildRationale(metric, metricCoverage);
  }

  return {
    mode: deriveScoreMode(coverage),
    coverage,
    rationale,
    sources,
    calibration: undefined,
  };
}

export function mergeScoreProvenance(
  raw: unknown,
  metrics: string[],
  rows: VsDiffRow[],
): VsScore['provenance'] {
  const inferred = buildInferredScoreProvenance(metrics, rows);
  const source = asRecord(raw);
  if (!source) {
    return inferred;
  }
  const sourceCoverage =
    source.coverage && typeof source.coverage === 'object' && !Array.isArray(source.coverage)
      ? (source.coverage as Record<string, unknown>)
      : {};
  const sourceRationale =
    source.rationale && typeof source.rationale === 'object' && !Array.isArray(source.rationale)
      ? (source.rationale as Record<string, unknown>)
      : {};
  const sourceSources =
    source.sources && typeof source.sources === 'object' && !Array.isArray(source.sources)
      ? (source.sources as Record<string, unknown>)
      : {};
  const sourceCalibration = asRecord(source.calibration);

  const coverage: Record<string, ScoreCoverage> = {};
  const rationale: Record<string, string> = {};
  const sources: Record<string, string[]> = {};

  for (const metric of metrics) {
    const metricSources = normalizeSources(sourceSources[metric]);
    const fallbackSources = inferred.sources[metric] ?? [];
    const mergedSources = metricSources.length > 0 ? metricSources : fallbackSources;

    const explicitCoverage = toCoverage(sourceCoverage[metric]);
    const inferredCoverage = mergedSources.length > 0 ? 'verified' : inferred.coverage[metric] ?? 'estimated';
    const coverageValue = explicitCoverage === inferredCoverage ? explicitCoverage : inferredCoverage;
    const rationaleValue = asString(sourceRationale[metric]) ?? inferred.rationale[metric] ?? buildRationale(metric, coverageValue);

    coverage[metric] = coverageValue;
    rationale[metric] = rationaleValue;
    sources[metric] = mergedSources.slice(0, 3);
  }

  return {
    mode: deriveScoreMode(coverage),
    coverage,
    rationale,
    sources,
    calibration: sourceCalibration
      ? {
          applied: sourceCalibration.applied === true,
          reason: sourceCalibration.reason === 'featured_tool' ? 'featured_tool' : 'featured_tool',
          margin:
            typeof sourceCalibration.margin === 'number' && Number.isFinite(sourceCalibration.margin)
              ? sourceCalibration.margin
              : FEATURED_CALIBRATION_MIN_WIN_MARGIN,
        }
      : undefined,
  };
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 6.5;
  return Math.max(0, Math.min(10, Math.round(score / INTERNAL_SCORE_STEP) * INTERNAL_SCORE_STEP));
}

export function formatInternalScore(score: number): string {
  return clampScore(score).toFixed(1);
}

export function normalizeInternalScore(
  score: VsScore,
  rows: VsDiffRow[],
  slugA?: string,
  slugB?: string,
): VsScore {
  const metrics = [...INTERNAL_SCORE_METRICS];
  const normalizedWeights: Record<string, number> = {};
  const normalizedA: Record<string, number> = {};
  const normalizedB: Record<string, number> = {};
  const metricHasMissingRaw: Record<string, boolean> = {};

  for (const metric of metrics) {
    const rawWeight = score.weights?.[metric];
    normalizedWeights[metric] = isFiniteNumber(rawWeight)
      ? rawWeight
      : DEFAULT_INTERNAL_SCORE_WEIGHTS[metric];

    const rawA = score.a?.[metric];
    const rawB = score.b?.[metric];
    const hasRawA = isFiniteNumber(rawA);
    const hasRawB = isFiniteNumber(rawB);
    metricHasMissingRaw[metric] = !hasRawA || !hasRawB;

    normalizedA[metric] = clampScore(hasRawA ? rawA : 6.5);
    normalizedB[metric] = clampScore(hasRawB ? rawB : 6.5);
  }

  const normalizedProvenance = mergeScoreProvenance(score.provenance, metrics, rows);
  const decisionEntries = buildDecisionTableRowEntries(rows, slugA, slugB);
  const hasWorkflowSpeedRow = hasDecisionRow(decisionEntries, 'Workflow speed');
  const hasApiRow = hasDecisionRow(decisionEntries, 'API');
  for (const metric of metrics) {
    if (metricHasMissingRaw[metric]) {
      normalizedProvenance.coverage[metric] = 'estimated';
      if (!normalizedProvenance.rationale[metric]) {
        normalizedProvenance.rationale[metric] = buildRationale(metric, 'estimated');
      }
    }
  }
  if (!hasWorkflowSpeedRow) {
    normalizedWeights.speed = 0;
    normalizedProvenance.coverage.speed = 'estimated';
    normalizedProvenance.rationale.speed = 'Excluded from scoring because workflow-speed evidence is not explicit enough for a strict row.';
    normalizedProvenance.sources.speed = [];
  }
  if (!hasApiRow) {
    normalizedWeights.customization = 0;
    normalizedProvenance.coverage.customization = 'estimated';
    normalizedProvenance.rationale.customization =
      'Excluded from scoring because API evidence is not explicit enough for a strict row.';
    normalizedProvenance.sources.customization = [];
  }
  normalizedProvenance.mode = deriveScoreMode(normalizedProvenance.coverage);

  return {
    methodNote: score.methodNote,
    weights: normalizedWeights,
    a: normalizedA,
    b: normalizedB,
    provenance: {
      ...normalizedProvenance,
      calibration: normalizedProvenance.calibration,
    },
  };
}

function appendCalibrationNote(rationale: string): string {
  const note = 'Adjusted by featured calibration for site recommendation consistency.';
  if (rationale.includes(note)) return rationale;
  return `${rationale} ${note}`.trim();
}

function distributeFeaturedDelta(
  score: VsScore,
  featuredSide: 'a' | 'b',
  requiredContribution: number,
): { updatedScore: VsScore; adjustedMetrics: InternalScoreMetric[] } {
  const updatedSideScores = { ...score[featuredSide] };
  const adjustedMetrics = new Set<InternalScoreMetric>();
  let remainingContribution = requiredContribution;
  let activeMetrics: Array<'ease' | 'speed' | 'output' | 'customization'> = ['ease', 'speed', 'output', 'customization'];
  let pass = 0;

  while (remainingContribution > 0.0001 && activeMetrics.length > 0 && pass < 4) {
    const passContribution = remainingContribution;
    const allocationTotal = activeMetrics.reduce((sum, metric) => sum + FEATURED_CALIBRATION_ALLOCATIONS[metric], 0);
    const nextActive: Array<'ease' | 'speed' | 'output' | 'customization'> = [];

    for (const metric of activeMetrics) {
      const weight = score.weights[metric] ?? DEFAULT_INTERNAL_SCORE_WEIGHTS[metric];
      const weightFactor = weight / 100;
      if (weightFactor <= 0) continue;

      const capacity = 10 - (updatedSideScores[metric] ?? 0);
      if (capacity <= 0.0001) continue;

      const desiredContribution = passContribution * (FEATURED_CALIBRATION_ALLOCATIONS[metric] / allocationTotal);
      const desiredIncrease = desiredContribution / weightFactor;
      const appliedIncrease = Math.min(capacity, desiredIncrease);
      if (appliedIncrease <= 0) continue;

      updatedSideScores[metric] = clampScore((updatedSideScores[metric] ?? 0) + appliedIncrease);
      remainingContribution = Math.max(0, remainingContribution - appliedIncrease * weightFactor);
      adjustedMetrics.add(metric);

      if (10 - (updatedSideScores[metric] ?? 0) > 0.0001) {
        nextActive.push(metric);
      }
    }

    activeMetrics = nextActive;
    pass += 1;
  }

  return {
    updatedScore: {
      ...score,
      [featuredSide]: updatedSideScores,
    },
    adjustedMetrics: [...adjustedMetrics],
  };
}

export function applyFeaturedCalibration(
  score: VsScore,
  aSlug: string,
  bSlug: string,
  minWinMargin = FEATURED_CALIBRATION_MIN_WIN_MARGIN,
): VsScore {
  if (score.provenance.calibration?.applied) {
    return score;
  }

  const aFeatured = isFeaturedTool(aSlug);
  const bFeatured = isFeaturedTool(bSlug);
  if (aFeatured === bFeatured) {
    return score;
  }

  const featuredSide: 'a' | 'b' = aFeatured ? 'a' : 'b';
  const otherSide: 'a' | 'b' = featuredSide === 'a' ? 'b' : 'a';
  const effectiveMargin = Math.max(minWinMargin, INTERNAL_SCORE_CLOSE_CALL_DELTA);
  const totals = calculateWeightedInternalTotals(score);
  const featuredTotal = totals[featuredSide];
  const otherTotal = totals[otherSide];
  const targetTotal = otherTotal + effectiveMargin;

  if (featuredTotal > targetTotal - 0.0001) {
    return {
      ...score,
      provenance: {
        ...score.provenance,
        calibration: {
          applied: false,
          reason: 'featured_tool',
          margin: effectiveMargin,
        },
      },
    };
  }

  const delta = targetTotal - featuredTotal;
  const { updatedScore, adjustedMetrics } = distributeFeaturedDelta(score, featuredSide, delta);
  const recalculatedTotals = calculateWeightedInternalTotals(updatedScore);
  const shortfall = targetTotal - recalculatedTotals[featuredSide];
  let finalScore = updatedScore;

  if (shortfall > 0.0001) {
    const retry = distributeFeaturedDelta(updatedScore, featuredSide, shortfall);
    finalScore = retry.updatedScore;
    adjustedMetrics.push(...retry.adjustedMetrics);
  }

  const finalRationale = { ...finalScore.provenance.rationale };
  for (const metric of adjustedMetrics) {
    finalRationale[metric] = appendCalibrationNote(finalRationale[metric] ?? buildRationale(metric, finalScore.provenance.coverage[metric] ?? 'estimated'));
  }

  return {
    ...finalScore,
    provenance: {
      ...finalScore.provenance,
      rationale: finalRationale,
      calibration: {
        applied: true,
        reason: 'featured_tool',
        margin: effectiveMargin,
      },
    },
  };
}

function compareNumbers(left: number, right: number): ScoreWinner {
  if (Math.abs(left - right) < 0.05) return 'tie';
  return left > right ? 'a' : 'b';
}

export function compareMetricWinner(score: VsScore, metric: InternalScoreMetric): ScoreWinner {
  if ((score.weights[metric] ?? 0) <= 0) {
    return 'tie';
  }
  const left = score.a[metric] ?? 0;
  const right = score.b[metric] ?? 0;
  return compareNumbers(left, right);
}

function parseMonthlyPrice(text?: string): number | null {
  if (!text) return null;
  const normalized = text.replace(/,/g, '');
  const match = normalized.match(/[$€£]\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function derivePriceWinnerFromDecisionTable(rows: VsDiffRow[], score: VsScore): ScoreWinner {
  const pricingRow = rows.find((row) => row.label.toLowerCase() === 'pricing starting point');
  const parsedA = parseMonthlyPrice(pricingRow?.aText ?? pricingRow?.a);
  const parsedB = parseMonthlyPrice(pricingRow?.bText ?? pricingRow?.b);

  if (parsedA !== null && parsedB !== null) {
    if (Math.abs(parsedA - parsedB) < 0.01) return 'tie';
    return parsedA < parsedB ? 'a' : 'b';
  }

  if (score.provenance.coverage.pricingValue !== 'verified') {
    return 'tie';
  }

  return compareMetricWinner(score, 'pricingValue');
}

export function calculateWeightedInternalTotals(score: VsScore): { a: number; b: number } {
  const metrics = [...INTERNAL_SCORE_METRICS];
  let totalA = 0;
  let totalB = 0;
  let activeWeight = 0;

  for (const metric of metrics) {
    if (metric === 'pricingValue' && score.provenance.coverage.pricingValue !== 'verified') {
      continue;
    }
    const weight = score.weights[metric] ?? DEFAULT_INTERNAL_SCORE_WEIGHTS[metric];
    if (weight <= 0) {
      continue;
    }
    totalA += weight * (score.a[metric] ?? 0);
    totalB += weight * (score.b[metric] ?? 0);
    activeWeight += weight;
  }

  if (activeWeight <= 0) {
    return {
      a: clampScore(0),
      b: clampScore(0),
    };
  }

  return {
    a: clampScore(totalA / activeWeight),
    b: clampScore(totalB / activeWeight),
  };
}

export function computeInternalScoreVerdict(
  score: VsScore,
  closeCallDelta = INTERNAL_SCORE_CLOSE_CALL_DELTA,
  winnerPrice: ScoreWinner = compareMetricWinner(score, 'pricingValue'),
): {
  winnerPrice: ScoreWinner;
  winnerSpeed: ScoreWinner;
  winnerQuality: ScoreWinner;
  weightedTotalA: number;
  weightedTotalB: number;
  overallWinner: OverallWinner;
  difference: number;
} {
  const winnerSpeed = compareMetricWinner(score, 'speed');
  const winnerQuality = compareMetricWinner(score, 'output');
  const totals = calculateWeightedInternalTotals(score);
  const difference = Number(Math.abs(totals.a - totals.b).toFixed(2));

  if (difference < closeCallDelta) {
    return {
      winnerPrice,
      winnerSpeed,
      winnerQuality,
      weightedTotalA: totals.a,
      weightedTotalB: totals.b,
      overallWinner: 'close',
      difference,
    };
  }

  return {
    winnerPrice,
    winnerSpeed,
    winnerQuality,
    weightedTotalA: totals.a,
    weightedTotalB: totals.b,
    overallWinner: totals.a >= totals.b ? 'a' : 'b',
    difference,
  };
}
