import type { PricingPlan, Tool } from '@/types/tool';
import type {
  CardPriceBlock,
  CardPriceConfidence,
  CardPriceHintKind,
  CardPriceSourceKind,
  CardPriceState,
} from '@/types/cardPriceBlock';
import { getToolCardPricingCandidateRecord, getToolCardPricingDisplay } from '@/lib/pricing/cardDisplay';
import { getCanonicalCardSummary } from '@/lib/pricing/canonicalCardSummaries';
import {
  getToolPricingSummary,
  isExplicitContactSalesPlan,
  isExplicitFreePlan,
} from '@/lib/pricing/display';

const NORMALIZED_CARD_PRICE_SLUGS = new Set([
  'colossyan',
  'd-id',
  'deepbrain-ai',
  'heygen',
  'lumen5',
  'sora',
  'steve-ai',
  'synthesys',
]);
const CANONICAL_CARD_PRICE_SLUGS = new Set(['colossyan']);

const EXACT_START_PRICE_PATTERN = /^Starts at (\$[\d.]+(?:\/(?:mo|month)))(?:\s+(.*))?$/i;
const CUSTOM_PRICE_PATTERNS = [
  'custom pricing',
  'enterprise',
  'contact sales',
  'request a demo',
  'get a quote',
  'talk to sales',
];
const FREE_PRICE_PATTERNS = ['free plan', 'free tier', 'freemium', 'community plan'];
const PAID_PRICE_PATTERNS = [
  'paid',
  'starter',
  'basic',
  'standard',
  'pro',
  'plus',
  'business',
  'team',
  'creator',
  'self-serve',
  'proof-of-concept',
  'trial',
  'upgrade',
  'plan',
  'tier',
];
function includesAny(value: string, patterns: string[]): boolean {
  return patterns.some((pattern) => value.includes(pattern));
}

function normalizeExactPriceToken(token: string): string {
  return token.replace('/month', '/mo');
}

function buildBlock(params: {
  priceState: CardPriceState;
  pricePrimary?: CardPriceBlock['pricePrimary'];
  priceHelper: string | null;
  priceSourceKind: CardPriceSourceKind;
  priceConfidence: CardPriceConfidence;
  priceHintKind: CardPriceHintKind;
}): CardPriceBlock {
  const { priceState } = params;

  const priceLabel: CardPriceBlock['priceLabel'] =
    priceState === 'free'
      ? 'Free'
      : priceState === 'custom'
        ? 'Custom pricing'
        : priceState === 'unverified'
          ? 'Pricing unverified'
          : 'Paid';

  const pricePrimary: CardPriceBlock['pricePrimary'] =
    params.pricePrimary ??
    (priceState === 'free'
      ? 'Free'
      : priceState === 'custom'
        ? 'Custom pricing'
        : 'See pricing');

  const canShowHelper = priceState === 'paid-exact' || priceState === 'free' || priceState === 'paid-coarse';

  return {
    priceState,
    priceLabel,
    pricePrimary,
    priceHelper: canShowHelper ? params.priceHelper : null,
    priceSourceKind: params.priceSourceKind,
    priceConfidence: params.priceConfidence,
    priceHintKind: canShowHelper ? params.priceHintKind : 'none',
  };
}

function extractExactStartPrice(text: string): {
  primary: CardPriceBlock['pricePrimary'] | null;
  helper: string | null;
  hintKind: CardPriceHintKind;
} {
  const normalizedText = text.replace('/month', '/mo');
  const match = normalizedText.match(EXACT_START_PRICE_PATTERN);

  if (!match) {
    return {
      primary: null,
      helper: null,
      hintKind: 'none',
    };
  }

  const priceToken = normalizeExactPriceToken(match[1]);
  const primary = `Starts at ${priceToken}` as `Starts at $${string}`;
  const remainder = match[2]?.trim().toLowerCase() ?? '';

  if (!remainder) {
    return {
      primary,
      helper: null,
      hintKind: 'none',
    };
  }

  if (remainder.includes('billed annually')) {
    return {
      primary,
      helper: null,
      hintKind: 'billing-varies',
    };
  }

  if (remainder.includes('billed yearly')) {
    return {
      primary,
      helper: null,
      hintKind: 'billing-varies',
    };
  }

  return {
    primary,
    helper: null,
    hintKind: 'billing-varies',
  };
}

function normalizeCardPriceString(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace('/month', '/mo')
    .replace(/ billed yearly/i, ' billed annually');
}

function parseAmountFromText(raw?: string | null): number | null {
  if (!raw) {
    return null;
  }

  const match = raw.match(/\$([\d]+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function formatMonthlyPrice(amount: number): `$${string}/mo` {
  const normalized = Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.00$/, '');
  return `$${normalized}/mo`;
}

function combinePriceHelper(params: {
  hasFreePlan: boolean;
}): string | null {
  if (params.hasFreePlan) {
    return 'Free plan available';
  }

  return null;
}

function isStructuredCustomLike(plan: PricingPlan): boolean {
  if (isExplicitContactSalesPlan(plan)) {
    return true;
  }

  const priceText = typeof plan.price === 'string' ? plan.price.toLowerCase() : '';
  const buttonText = String(plan.btn_text || '').toLowerCase();

  return (
    priceText.includes('custom') ||
    priceText.includes('contact') ||
    buttonText.includes('contact') ||
    buttonText.includes('sales')
  );
}

function getStructuredFreePlanStatus(tool: Tool): 'yes' | 'no' | 'unverified' {
  if (tool.pricing_plans?.some((plan) => isExplicitFreePlan(plan))) {
    return 'yes';
  }

  if (tool.pricing?.free_plan?.exists === true) {
    return 'yes';
  }

  const candidateRecord = getToolCardPricingCandidateRecord(tool);

  if (candidateRecord?.hasFreePlan === true) {
    return 'yes';
  }

  if (candidateRecord?.hasFreePlan === false) {
    return 'no';
  }

  if (tool.pricing_plans && tool.pricing_plans.length > 0) {
    return 'no';
  }

  return getToolPricingSummary(tool).freePlan;
}

function getStructuredPriceCandidate(tool: Tool): {
  kind: 'free' | 'free-plus-paid' | 'exact-monthly' | 'annual-only' | 'custom-only' | 'see-pricing' | null;
  amount?: number;
} {
  const plans = tool.pricing_plans ?? [];
  if (plans.length === 0) {
    return { kind: null };
  }

  const freePlans = plans.filter((plan) => isExplicitFreePlan(plan));
  const customPlans = plans.filter((plan) => !isExplicitFreePlan(plan) && isStructuredCustomLike(plan));
  const selfServePlans = plans.filter((plan) => !isExplicitFreePlan(plan) && !isStructuredCustomLike(plan));

  const monthlyAmounts: number[] = [];
  const annualMonthlyEquivalentAmounts: number[] = [];

  for (const plan of selfServePlans) {
    const monthlyDisplay = normalizeCardPriceString(plan.monthlyPriceDisplay || '');
    const yearlyDisplay = normalizeCardPriceString(plan.yearlyPriceDisplay || '');

    const exactMonthlyDisplay =
      monthlyDisplay && !/\bbilled annually\b/i.test(monthlyDisplay) ? parseAmountFromText(monthlyDisplay) : null;
    const annualOnlyDisplay = yearlyDisplay ? parseAmountFromText(yearlyDisplay) : null;

    if (typeof plan.price === 'object' && plan.price !== null && 'monthly' in plan.price) {
      const monthly = plan.price.monthly;
      if (typeof monthly === 'object' && monthly !== null && typeof monthly.amount === 'number' && monthly.amount > 0) {
        monthlyAmounts.push(monthly.amount);
      } else if (typeof monthly === 'string') {
        const parsed = parseAmountFromText(monthly);
        if (parsed !== null) {
          monthlyAmounts.push(parsed);
        }
      }

      if ('yearly' in plan.price && plan.price.yearly) {
        const yearly = plan.price.yearly;
        if (typeof yearly === 'object' && yearly !== null && typeof yearly.amount === 'number' && yearly.amount > 0) {
          annualMonthlyEquivalentAmounts.push(yearly.amount);
        } else if (typeof yearly === 'string') {
          const parsed = parseAmountFromText(yearly);
          if (parsed !== null) {
            annualMonthlyEquivalentAmounts.push(parsed);
          }
        }
      }
    } else if (typeof plan.price === 'object' && plan.price !== null && 'amount' in plan.price) {
      if (typeof plan.price.amount === 'number' && plan.price.amount > 0) {
        const normalizedPeriod = String(plan.price.period || '').toLowerCase();
        if (normalizedPeriod.includes('month')) {
          monthlyAmounts.push(plan.price.amount);
        } else if (normalizedPeriod.includes('year')) {
          annualMonthlyEquivalentAmounts.push(plan.price.amount);
        }
      }
    } else if (typeof plan.price === 'string') {
      const parsed = parseAmountFromText(plan.price);
      if (parsed !== null) {
        const lowerPrice = plan.price.toLowerCase();
        if (lowerPrice.includes('year') || lowerPrice.includes('annual')) {
          annualMonthlyEquivalentAmounts.push(parsed);
        } else {
          monthlyAmounts.push(parsed);
        }
      }
    }

    if (exactMonthlyDisplay !== null) {
      monthlyAmounts.push(exactMonthlyDisplay);
    }
    if (annualOnlyDisplay !== null) {
      annualMonthlyEquivalentAmounts.push(annualOnlyDisplay);
    }
  }

  const hasFree = freePlans.length > 0;
  const hasSelfServe = selfServePlans.length > 0;

  if (monthlyAmounts.length > 0) {
    return { kind: 'exact-monthly', amount: Math.min(...monthlyAmounts) };
  }

  if (annualMonthlyEquivalentAmounts.length > 0) {
    return { kind: 'annual-only', amount: Math.min(...annualMonthlyEquivalentAmounts) };
  }

  if (hasFree && hasSelfServe) {
    return { kind: 'free-plus-paid' };
  }

  if (hasFree && !hasSelfServe && customPlans.length === 0) {
    return { kind: 'free' };
  }

  if (customPlans.length > 0 && !hasSelfServe) {
    return { kind: hasFree ? 'free' : 'custom-only' };
  }

  if (hasSelfServe) {
    return { kind: 'see-pricing' };
  }

  return { kind: null };
}

function getLegacyConfidence(tool: Tool): CardPriceConfidence {
  const verification = getToolPricingSummary(tool).verification;
  if (verification === 'verified') {
    return 'verified';
  }
  if (verification === 'trusted') {
    return 'trusted';
  }
  return 'unverified';
}

function getHomePriceSourceKind(tool: Tool): CardPriceSourceKind {
  if (CANONICAL_CARD_PRICE_SLUGS.has(tool.slug)) {
    return 'canonical';
  }
  return NORMALIZED_CARD_PRICE_SLUGS.has(tool.slug) ? 'normalized' : 'legacy-summary';
}

function getCanonicalExactPriceCandidate(tool: Tool): {
  amount: number;
  hasFreePlan: boolean;
  confidence: CardPriceConfidence;
} | null {
  const summary = CANONICAL_CARD_PRICE_SLUGS.has(tool.slug) ? getCanonicalCardSummary(tool.slug) : null;
  if (!summary) {
    return null;
  }

  return {
    amount: summary.monthlyStartAmount,
    hasFreePlan: summary.hasFreePlan,
    confidence: summary.confidence,
  };
}

function buildCategorySafeBlock(params: {
  displayText: string;
  sourceKind: CardPriceSourceKind;
  confidence: CardPriceConfidence;
  hasFreePlan: boolean;
}): CardPriceBlock {
  if (params.displayText === 'Custom pricing') {
    return buildBlock({
      priceState: 'custom',
      pricePrimary: 'Custom pricing',
      priceHelper: 'Contact sales for details',
      priceSourceKind: params.sourceKind,
      priceConfidence: params.confidence,
      priceHintKind: 'editorial-summary',
    });
  }

  if (params.displayText === 'Free') {
    return buildBlock({
      priceState: 'free',
      pricePrimary: 'Free',
      priceHelper: null,
      priceSourceKind: params.sourceKind,
      priceConfidence: params.confidence,
      priceHintKind: 'none',
    });
  }

  if (params.displayText === 'Paid plans available') {
    return buildBlock({
      priceState: 'paid-coarse',
      pricePrimary: 'See pricing',
      priceHelper: null,
      priceSourceKind: params.sourceKind,
      priceConfidence: params.confidence,
      priceHintKind: 'none',
    });
  }

  return buildBlock({
    priceState: 'unverified',
    pricePrimary: 'See pricing',
    priceHelper: null,
    priceSourceKind: params.sourceKind,
    priceConfidence: params.displayText === 'Pricing not verified' ? 'unverified' : params.confidence,
    priceHintKind: 'none',
  });
}

export function getHomeCardPriceBlock(tool: Tool): CardPriceBlock {
  const canonicalExactCandidate = getCanonicalExactPriceCandidate(tool);
  if (canonicalExactCandidate) {
    return buildBlock({
      priceState: 'paid-exact',
      pricePrimary: `Starts at ${formatMonthlyPrice(canonicalExactCandidate.amount)}`,
      priceHelper: combinePriceHelper({ hasFreePlan: canonicalExactCandidate.hasFreePlan }),
      priceSourceKind: 'canonical',
      priceConfidence: canonicalExactCandidate.confidence,
      priceHintKind: canonicalExactCandidate.hasFreePlan ? 'editorial-summary' : 'none',
    });
  }

  const display = getToolCardPricingDisplay(tool);
  const sourceKind = getHomePriceSourceKind(tool);
  const freePlanStatus = getStructuredFreePlanStatus(tool);
  const hasFreePlan = freePlanStatus === 'yes';
  const exactConfidence =
    display.source === 'legacy-accepted' ? getLegacyConfidence(tool) : 'verified';
  const coarseConfidence =
    display.source === 'legacy-accepted' ? getLegacyConfidence(tool) : 'trusted';

  if (display.source === 'candidate-exact') {
    const exact = extractExactStartPrice(display.displayText);
    if (exact.primary) {
      return buildBlock({
        priceState: 'paid-exact',
        pricePrimary: exact.primary,
        priceHelper: combinePriceHelper({ hasFreePlan }),
        priceSourceKind: sourceKind,
        priceConfidence: exactConfidence,
        priceHintKind: hasFreePlan ? 'editorial-summary' : exact.hintKind,
      });
    }
  }

  const structuredCandidate = getStructuredPriceCandidate(tool);

  if (structuredCandidate.kind === 'exact-monthly' && typeof structuredCandidate.amount === 'number') {
    return buildBlock({
      priceState: 'paid-exact',
      pricePrimary: `Starts at ${formatMonthlyPrice(structuredCandidate.amount)}`,
      priceHelper: combinePriceHelper({ hasFreePlan }),
      priceSourceKind: sourceKind,
      priceConfidence: exactConfidence,
      priceHintKind: hasFreePlan ? 'editorial-summary' : 'none',
    });
  }

  if (structuredCandidate.kind === 'annual-only' && typeof structuredCandidate.amount === 'number') {
    return buildBlock({
      priceState: 'paid-exact',
      pricePrimary: `Starts at ${formatMonthlyPrice(structuredCandidate.amount)}`,
      priceHelper: combinePriceHelper({ hasFreePlan }),
      priceSourceKind: sourceKind,
      priceConfidence: exactConfidence,
      priceHintKind: hasFreePlan ? 'editorial-summary' : 'billing-varies',
    });
  }

  if (structuredCandidate.kind === 'free') {
    return buildBlock({
      priceState: 'free',
      pricePrimary: 'Free',
      priceHelper: null,
      priceSourceKind: sourceKind,
      priceConfidence: coarseConfidence,
      priceHintKind: 'none',
    });
  }

  if (structuredCandidate.kind === 'custom-only') {
    return buildBlock({
      priceState: 'custom',
      pricePrimary: 'Custom pricing',
      priceHelper: 'Contact sales for details',
      priceSourceKind: sourceKind,
      priceConfidence: coarseConfidence,
      priceHintKind: 'editorial-summary',
    });
  }

  if (structuredCandidate.kind === 'see-pricing') {
    return buildBlock({
      priceState: 'paid-coarse',
      pricePrimary: 'See pricing',
      priceHelper: null,
      priceSourceKind: sourceKind,
      priceConfidence: coarseConfidence,
      priceHintKind: 'none',
      });
  }

  if (display.source === 'candidate-coarse') {
    return buildCategorySafeBlock({
      displayText: display.displayText,
      sourceKind,
      confidence: coarseConfidence,
      hasFreePlan,
    });
  }

  if (
    display.displayText === 'Custom pricing' ||
    display.displayText === 'Pricing not verified' ||
    display.displayText === 'Paid plans available' ||
    display.displayText === 'Free'
  ) {
    return buildCategorySafeBlock({
      displayText: display.displayText,
      sourceKind,
      confidence: coarseConfidence,
      hasFreePlan,
    });
  }

  const exact = extractExactStartPrice(display.displayText);
  if (exact.primary) {
    return buildBlock({
      priceState: 'paid-exact',
      pricePrimary: exact.primary,
      priceHelper: combinePriceHelper({ hasFreePlan }),
      priceSourceKind: sourceKind,
      priceConfidence: exactConfidence,
      priceHintKind: hasFreePlan ? 'editorial-summary' : exact.hintKind,
    });
  }

  return buildCategorySafeBlock({
    displayText: display.displayText,
    sourceKind,
    confidence: coarseConfidence,
    hasFreePlan,
  });
}

export function getFeatureSeedCardPriceBlock(pricingSeed?: string | null): CardPriceBlock {
  const trimmedSeed = pricingSeed?.trim() ?? '';
  if (!trimmedSeed) {
    return buildBlock({
      priceState: 'unverified',
      pricePrimary: 'See pricing',
      priceHelper: null,
      priceSourceKind: 'feature-seed',
      priceConfidence: 'unverified',
      priceHintKind: 'none',
    });
  }

  const lower = trimmedSeed.toLowerCase();

  if (includesAny(lower, CUSTOM_PRICE_PATTERNS)) {
    return buildBlock({
      priceState: 'custom',
      pricePrimary: 'Custom pricing',
      priceHelper: null,
      priceSourceKind: 'feature-seed',
      priceConfidence: 'editorial-seed',
      priceHintKind: 'none',
    });
  }

  const hasFreeSignal = lower === 'free' || includesAny(lower, FREE_PRICE_PATTERNS);
  const hasDollarAmount = /\$\d/.test(trimmedSeed);
  const hasPaidSignal = hasDollarAmount || includesAny(lower, PAID_PRICE_PATTERNS);

  if (hasFreeSignal && hasPaidSignal) {
    return buildBlock({
      priceState: 'paid-coarse',
      pricePrimary: 'See pricing',
      priceHelper: null,
      priceSourceKind: 'feature-seed',
      priceConfidence: 'editorial-seed',
      priceHintKind: 'none',
    });
  }

  if (hasFreeSignal) {
    return buildBlock({
      priceState: 'free',
      pricePrimary: 'Free',
      priceHelper: null,
      priceSourceKind: 'feature-seed',
      priceConfidence: 'editorial-seed',
      priceHintKind: 'none',
    });
  }

  if (hasPaidSignal) {
    return buildBlock({
      priceState: 'paid-coarse',
      pricePrimary: 'See pricing',
      priceHelper: null,
      priceSourceKind: 'feature-seed',
      priceConfidence: 'editorial-seed',
      priceHintKind: 'none',
    });
  }

  return buildBlock({
    priceState: 'unverified',
    pricePrimary: 'See pricing',
    priceHelper: null,
    priceSourceKind: 'feature-seed',
    priceConfidence: 'unverified',
    priceHintKind: 'none',
  });
}
