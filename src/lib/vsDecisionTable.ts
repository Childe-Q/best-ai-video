import { VsDiffRow } from '@/types/vs';
import { normalizeRowSources, VsRowSources } from '@/lib/vsSources';
import { getStrictApiSources, getStrictPricingSources, resolveRowSourcesForTools } from '@/lib/vsToolSources';
import { getTool } from '@/lib/getTool';

export const DECISION_TABLE_ROWS = [
  'Best for',
  'Output type',
  'Workflow speed',
  'Languages & dubbing',
  'Templates',
  'API',
  'Pricing starting point',
  'Free plan',
] as const;

export type DecisionRowLabel = (typeof DECISION_TABLE_ROWS)[number];

export type DecisionTableRow = {
  label: string;
  aText: string;
  bText: string;
  sources: VsRowSources;
  hidden?: boolean;
  strict?: boolean;
};

const SCORE_TOKEN_PATTERN = /\b\d+(\.\d+)?\s*\/\s*10\b/gi;
const SCORE_HINT_PATTERN =
  /\((?:[^)]*?(?:dataset|internal estimate|internal score|score)[^)]*)\)|\b(?:dataset|internal estimate|internal score)\b/gi;
const PLACEHOLDER_PATTERN =
  /\b(?:see product docs|depends on plan|depends on account type|check limits|plan limits|not clearly listed|not explicitly listed|pending verification|see docs)\b/i;
const GENERIC_LANGUAGE_PATTERN = /\b(?:see product docs|see docs|check .*plan limits|check .*docs)\b/i;
const GENERIC_TEMPLATE_PATTERN = /\btemplate support not explicitly listed\b/i;
const WORKFLOW_PLACEHOLDER_PATTERN = /\b(?:see docs|moderate setup before repeatable output)\b/i;
const ALLOWED_WORKFLOW_BUCKETS = [
  'Fast for batch drafts',
  'Fast for short iterations',
  'Depends on workflow setup',
] as const;

function cleanSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function stripScoreLikeText(text: string): string {
  return cleanSpaces(text.replace(SCORE_TOKEN_PATTERN, '').replace(SCORE_HINT_PATTERN, '').replace(/\(\s*\)/g, ''));
}

function cleanText(raw?: string): string {
  return stripScoreLikeText(cleanSpaces(raw ?? ''));
}

function normalizeCellText(raw?: string): string {
  return cleanText(raw);
}

function getToolEvidenceText(slug?: string): string {
  if (!slug) return '';
  const tool = getTool(slug);
  if (!tool) return '';
  const values = [
    tool.best_for,
    tool.tagline,
    tool.short_description,
    tool.pricing_model,
    tool.starting_price,
    tool.pricing?.free_plan?.details,
    ...(tool.features ?? []),
    ...(tool.pros ?? []),
    ...(tool.cons ?? []),
    ...(tool.tags ?? []),
    ...(tool.faqs ?? []).flatMap((item) => [item.question, item.answer]),
  ];
  return values.filter(Boolean).join(' ').toLowerCase();
}

function hasStrictPricingSource(slug?: string): boolean {
  return Boolean(slug && getStrictPricingSources(slug).length > 0);
}

function normalizeStructuredPrice(raw?: string): string | null {
  const base = cleanSpaces(raw ?? '');
  if (!base) return null;
  const match = base.replace(/,/g, '').match(/([$€£]\s*\d+(?:\.\d+)?)(?:\s*\/\s*(mo|month|yr|year))?/i);
  if (!match) return null;
  const amount = match[1].replace(/\s+/g, '');
  const period = match[2] ? match[2].toLowerCase() : 'mo';
  return `${amount}/${period.startsWith('y') ? 'yr' : 'mo'}`;
}

function getStructuredPriceText(slug?: string): string | null {
  if (!slug) return null;
  const tool = getTool(slug);
  if (!tool) return null;
  const direct = normalizeStructuredPrice(tool.starting_price) ?? normalizeStructuredPrice(tool.pricing?.starting_price);
  if (direct) return direct;

  const monthlyPlan = tool.pricing_plans?.find((plan) => {
    if (typeof plan.price === 'object' && plan.price && 'monthly' in plan.price) {
      return true;
    }
    return false;
  });

  const price = monthlyPlan?.price;
  if (price && typeof price === 'object' && 'monthly' in price) {
    if (typeof price.monthly === 'object' && typeof price.monthly.amount === 'number') {
      return `$${price.monthly.amount}/${price.monthly.period === 'year' ? 'yr' : 'mo'}`;
    }
    if (typeof price.monthly === 'string') {
      return normalizeStructuredPrice(price.monthly);
    }
  }

  return null;
}

function buildPricingRowText(raw: string | undefined, slug: string | undefined, hasVerifiedPricingSource: boolean): string {
  if (!hasVerifiedPricingSource) return 'No verified source yet';
  return normalizeStructuredPrice(raw) ?? getStructuredPriceText(slug) ?? 'No verified source yet';
}

function getFreePlanBucket(slug?: string): string | null {
  if (!slug || !hasStrictPricingSource(slug)) return null;
  const tool = getTool(slug);
  if (!tool) return null;

  const pricingPlanNames = tool.pricing_plans?.map((plan) => plan.name.toLowerCase()) ?? [];
  const pricingModel = (tool.pricing_model ?? '').toLowerCase();
  const freePlanDetails = (tool.pricing?.free_plan?.details ?? '').toLowerCase();
  const faqText = (tool.faqs ?? [])
    .flatMap((item) => [item.question, item.answer])
    .join(' ')
    .toLowerCase();

  const hasFreePlan =
    tool.pricing?.free_plan?.exists === true ||
    pricingModel.includes('freemium') ||
    pricingPlanNames.some((name) => name.includes('free')) ||
    /\bfree plan\b/.test(freePlanDetails) ||
    /\bfree plan\b/.test(faqText);

  if (hasFreePlan) return 'Free plan';

  const hasFreeTrial =
    tool.has_free_trial === true ||
    pricingModel.includes('trial') ||
    /\bfree trial\b/.test(freePlanDetails) ||
    /\bfree trial\b/.test(faqText);

  return hasFreeTrial ? 'Free trial' : null;
}

function getApiBucket(slug?: string): { text: string; sources: string[] } | null {
  if (!slug) return null;
  const sources = getStrictApiSources(slug);
  if (sources.length === 0) return null;

  const evidence = getToolEvidenceText(slug);
  if (!/\bapi\b/.test(evidence)) return null;

  if (/\benterprise\b|\bon request\b|\blimited access\b|\bcontact sales\b/.test(evidence)) {
    return { text: 'Enterprise / API on request', sources };
  }

  return { text: 'Public API', sources };
}

function findExplicitFeatureMatch(slug: string | undefined, pattern: RegExp): string | null {
  if (!slug) return null;
  const tool = getTool(slug);
  if (!tool) return null;
  const values = [
    ...(tool.features ?? []),
    ...(tool.pros ?? []),
    ...(tool.tags ?? []),
    ...(tool.faqs ?? []).flatMap((item) => [item.question, item.answer]),
  ];
  const match = values.find((value) => pattern.test(value));
  return match ? cleanText(match) : null;
}

function getTemplatesText(raw: string | undefined, slug?: string): string | null {
  const base = normalizeCellText(raw);
  if (base && !GENERIC_TEMPLATE_PATTERN.test(base) && /template|brand kit|layout|scene/i.test(base)) {
    return base;
  }
  return findExplicitFeatureMatch(slug, /template|brand kit|layout|scene/i);
}

function getLanguagesText(raw: string | undefined, slug?: string): string | null {
  const base = normalizeCellText(raw);
  if (base && !GENERIC_LANGUAGE_PATTERN.test(base) && /language|dub|voice|locali|multilingual/i.test(base)) {
    return base;
  }
  return findExplicitFeatureMatch(slug, /language|dub|voice|locali|multilingual/i);
}

function normalizeWorkflowBucket(text: string): string | null {
  const normalized = text.toLowerCase();
  if (normalized.includes('batch') || normalized.includes('bulk') || normalized.includes('shorts') || normalized.includes('automation')) {
    return 'Fast for batch drafts';
  }
  if (normalized.includes('setup') || normalized.includes('template') || normalized.includes('avatar') || normalized.includes('manual')) {
    return 'Depends on workflow setup';
  }
  if (normalized.includes('fast') || normalized.includes('quick') || normalized.includes('iteration') || normalized.includes('turnaround')) {
    return 'Fast for short iterations';
  }
  return null;
}

function getWorkflowSpeedText(raw: string | undefined, slug?: string): string | null {
  const base = normalizeCellText(raw);
  if (base && !WORKFLOW_PLACEHOLDER_PATTERN.test(base)) {
    const normalized = normalizeWorkflowBucket(base);
    if (normalized) return normalized;
  }

  const evidence = getToolEvidenceText(slug);
  if (!evidence) return null;

  if (/\bbatch\b|\bbulk\b|\bshorts\b|\bhigh-volume\b|\bautomate\b/.test(evidence)) {
    return 'Fast for batch drafts';
  }
  if (/\bsetup\b|\blearning curve\b|\bcomplex\b|\bmanual\b|\bavatar\b/.test(evidence)) {
    return 'Depends on workflow setup';
  }
  if (/\bfast\b|\bquick\b|\bseconds\b|\bmins\b|\bminutes\b/.test(evidence)) {
    return 'Fast for short iterations';
  }

  return null;
}

function shouldHideGenericRow(label: DecisionRowLabel, aText: string, bText: string): boolean {
  if (label === 'Templates') {
    return !aText || !bText;
  }
  if (label === 'Languages & dubbing') {
    return !aText || !bText;
  }
  if (label === 'Workflow speed') {
    return !aText || !bText;
  }
  return false;
}

function buildRowBase(
  row: Partial<VsDiffRow> | undefined,
  slugA?: string,
  slugB?: string,
): VsRowSources {
  return slugA && slugB ? resolveRowSourcesForTools(row, slugA, slugB) : normalizeRowSources(row);
}

function normalizeVisibleRow(
  label: DecisionRowLabel,
  row: Partial<VsDiffRow> | undefined,
  slugA?: string,
  slugB?: string,
): DecisionTableRow {
  const defaultSources = buildRowBase(row, slugA, slugB);

  if (label === 'Pricing starting point') {
    const sources = {
      a: slugA ? getStrictPricingSources(slugA) : [],
      b: slugB ? getStrictPricingSources(slugB) : [],
    };
    return {
      label,
      aText: buildPricingRowText(row?.aText ?? row?.a, slugA, sources.a.length > 0),
      bText: buildPricingRowText(row?.bText ?? row?.b, slugB, sources.b.length > 0),
      sources,
      strict: true,
    };
  }

  if (label === 'Free plan') {
    const sources = {
      a: slugA ? getStrictPricingSources(slugA) : [],
      b: slugB ? getStrictPricingSources(slugB) : [],
    };
    const aText = getFreePlanBucket(slugA);
    const bText = getFreePlanBucket(slugB);
    if (!aText || !bText) {
      return { label, aText: '', bText: '', sources, strict: true, hidden: true };
    }
    return { label, aText, bText, sources, strict: true };
  }

  if (label === 'API') {
    const aBucket = getApiBucket(slugA);
    const bBucket = getApiBucket(slugB);
    const sources = {
      a: aBucket?.sources ?? [],
      b: bBucket?.sources ?? [],
    };
    if (!aBucket || !bBucket) {
      return { label, aText: '', bText: '', sources, strict: true, hidden: true };
    }
    return { label, aText: aBucket.text, bText: bBucket.text, sources, strict: true };
  }

  if (label === 'Templates') {
    const aText = getTemplatesText(row?.aText ?? row?.a, slugA);
    const bText = getTemplatesText(row?.bText ?? row?.b, slugB);
    if (shouldHideGenericRow(label, aText ?? '', bText ?? '')) {
      return { label, aText: '', bText: '', sources: defaultSources, hidden: true };
    }
    return { label, aText: aText ?? '', bText: bText ?? '', sources: defaultSources };
  }

  if (label === 'Languages & dubbing') {
    const aText = getLanguagesText(row?.aText ?? row?.a, slugA);
    const bText = getLanguagesText(row?.bText ?? row?.b, slugB);
    if (shouldHideGenericRow(label, aText ?? '', bText ?? '')) {
      return { label, aText: '', bText: '', sources: defaultSources, hidden: true };
    }
    return { label, aText: aText ?? '', bText: bText ?? '', sources: defaultSources };
  }

  if (label === 'Workflow speed') {
    const aText = getWorkflowSpeedText(row?.aText ?? row?.a, slugA);
    const bText = getWorkflowSpeedText(row?.bText ?? row?.b, slugB);
    if (shouldHideGenericRow(label, aText ?? '', bText ?? '')) {
      return { label, aText: '', bText: '', sources: defaultSources, hidden: true };
    }
    return { label, aText: aText ?? '', bText: bText ?? '', sources: defaultSources, strict: true };
  }

  return {
    label,
    aText: normalizeCellText(row?.aText ?? row?.a),
    bText: normalizeCellText(row?.bText ?? row?.b),
    sources: defaultSources,
  };
}

export function buildDecisionTableRowEntries(
  rows: VsDiffRow[],
  slugA?: string,
  slugB?: string,
  labels?: readonly string[],
): DecisionTableRow[] {
  const rowMap = new Map(rows.map((row) => [row.label.toLowerCase(), row]));
  const targetLabels = labels && labels.length > 0 ? labels : DECISION_TABLE_ROWS;

  return targetLabels.map((label) => {
    const found = rowMap.get(label.toLowerCase());
    return normalizeVisibleRow(label as DecisionRowLabel, found, slugA, slugB);
  });
}

export function buildDecisionTableRows(
  rows: VsDiffRow[],
  slugA?: string,
  slugB?: string,
  labels?: readonly string[],
): DecisionTableRow[] {
  return buildDecisionTableRowEntries(rows, slugA, slugB, labels).filter((row) => !row.hidden);
}

export function hasDecisionRow(entries: DecisionTableRow[], label: DecisionRowLabel): boolean {
  return entries.some((row) => row.label === label && !row.hidden);
}

export function countPlaceholderCells(rows: DecisionTableRow[]): number {
  return rows.reduce((total, row) => {
    const hits = [row.aText, row.bText].filter((value) => PLACEHOLDER_PATTERN.test(value)).length;
    return total + hits;
  }, 0);
}

export function toVsDiffRows(rows: DecisionTableRow[]): VsDiffRow[] {
  return rows
    .filter((row) => !row.hidden)
    .map((row) => ({
      label: row.label,
      a: row.aText,
      b: row.bText,
      sources: row.sources,
    }));
}
