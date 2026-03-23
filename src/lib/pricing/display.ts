import { PricingPlan, Tool } from '@/types/tool';

export type PricingDisplayStatus =
  | 'free'
  | 'paid'
  | 'custom'
  | 'enterprise'
  | 'pricing-not-verified';

export type PricingVerification = 'verified' | 'trusted' | 'unverified';
export type PricingFreePlanStatus = 'yes' | 'no' | 'unverified';

export interface ToolPricingSummary {
  status: PricingDisplayStatus;
  verification: PricingVerification;
  freePlan: PricingFreePlanStatus;
  safeStartingPriceText: string | null;
  hasInteractivePricing?: boolean;
}

export interface PricingDisplayResult extends ToolPricingSummary {
  displayText: string;
  hintText: string | null;
}

type ToolLike = Pick<Tool, 'slug'> | string;
type PricingPlanWithRibbon = PricingPlan & { ribbonText?: string };

const DEFAULT_UNVERIFIED_SUMMARY: ToolPricingSummary = {
  status: 'pricing-not-verified',
  verification: 'unverified',
  freePlan: 'unverified',
  safeStartingPriceText: null,
  hasInteractivePricing: false,
};

const VERIFIED_PRICING_SUMMARIES: Record<string, ToolPricingSummary> = {
  heygen: {
    status: 'paid',
    verification: 'verified',
    freePlan: 'yes',
    safeStartingPriceText: null,
    hasInteractivePricing: true,
  },
  'veed-io': {
    status: 'paid',
    verification: 'verified',
    freePlan: 'yes',
    safeStartingPriceText: 'Starts at $12/mo',
    hasInteractivePricing: true,
  },
  synthesia: {
    status: 'paid',
    verification: 'verified',
    freePlan: 'yes',
    safeStartingPriceText: 'Starts at $18/mo',
    hasInteractivePricing: true,
  },
  'elai-io': {
    status: 'paid',
    verification: 'verified',
    freePlan: 'yes',
    safeStartingPriceText: 'Starts at $23/mo',
    hasInteractivePricing: true,
  },
  pika: {
    status: 'paid',
    verification: 'verified',
    freePlan: 'yes',
    safeStartingPriceText: 'Starts at $8/mo',
    hasInteractivePricing: true,
  },
  zebracat: {
    status: 'paid',
    verification: 'verified',
    freePlan: 'no',
    safeStartingPriceText: 'Starts at $19/mo',
    hasInteractivePricing: true,
  },
};

const TRUSTED_PRICING_SUMMARIES: Record<string, ToolPricingSummary> = {
  invideo: {
    status: 'paid',
    verification: 'trusted',
    freePlan: 'unverified',
    safeStartingPriceText: 'Starts at $28/mo',
    hasInteractivePricing: true,
  },
  fliki: {
    status: 'paid',
    verification: 'trusted',
    freePlan: 'unverified',
    safeStartingPriceText: 'Starts at $28/mo',
    hasInteractivePricing: true,
  },
  descript: {
    status: 'paid',
    verification: 'trusted',
    freePlan: 'unverified',
    safeStartingPriceText: 'Starts at $12/mo',
    hasInteractivePricing: false,
  },
  'opus-clip': {
    status: 'paid',
    verification: 'trusted',
    freePlan: 'unverified',
    safeStartingPriceText: 'Starts at $15/mo',
    hasInteractivePricing: false,
  },
  runway: {
    status: 'paid',
    verification: 'trusted',
    freePlan: 'unverified',
    safeStartingPriceText: 'Starts at $12/mo',
    hasInteractivePricing: false,
  },
  pictory: {
    status: 'paid',
    verification: 'trusted',
    freePlan: 'unverified',
    safeStartingPriceText: 'Starts at $19/mo',
    hasInteractivePricing: false,
  },
  flexclip: {
    status: 'paid',
    verification: 'trusted',
    freePlan: 'unverified',
    safeStartingPriceText: 'Starts at $12/mo',
    hasInteractivePricing: false,
  },
};

function getSlug(input: ToolLike): string {
  return typeof input === 'string' ? input : input.slug;
}

function normalizeText(value?: string | null): string {
  return (value || '').toLowerCase().trim();
}

function includesAny(value: string, patterns: string[]): boolean {
  return patterns.some((pattern) => value.includes(pattern));
}

export function isExplicitContactSalesPlan(plan: PricingPlan): boolean {
  const ribbonText = (plan as PricingPlanWithRibbon).ribbonText;
  const planText = [
    plan.name,
    plan.ctaText,
    plan.unitPriceNote,
    plan.badge,
    ribbonText,
    plan.description,
    plan.tagline,
    ...(plan.features || []),
    ...(plan.highlights || []),
    ...(plan.featureItems?.map((item) => item.text) || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return includesAny(planText, [
    'enterprise',
    'custom pricing',
    'contact sales',
    'talk to sales',
    'request a demo',
    'get a quote',
    "let's talk",
    'enterprise pricing',
    'invoice billing',
  ]);
}

export function isExplicitFreePlan(plan: PricingPlan): boolean {
  if (isExplicitContactSalesPlan(plan)) {
    return false;
  }

  const ribbonText = (plan as PricingPlanWithRibbon).ribbonText;
  const name = normalizeText(plan.name);
  const badgeText = normalizeText(plan.badge || ribbonText);
  const unitPriceNote = normalizeText(plan.unitPriceNote);

  if (name === 'free' || name.includes('free')) {
    return true;
  }

  if (badgeText.includes('free')) {
    return true;
  }

  if (typeof plan.price === 'string') {
    return normalizeText(plan.price).includes('free');
  }

  if (!plan.price || typeof plan.price !== 'object') {
    return false;
  }

  if ('monthly' in plan.price) {
    const monthly = plan.price.monthly;

    if (typeof monthly === 'string') {
      return normalizeText(monthly).includes('free');
    }

    if (typeof monthly === 'object' && monthly !== null && 'amount' in monthly) {
      if (monthly.amount !== 0) {
        return false;
      }

      if (includesAny(unitPriceNote, ['custom', 'contact', 'enterprise'])) {
        return false;
      }

      return badgeText.includes('free') || name.includes('free');
    }
  }

  if ('amount' in plan.price && 'period' in plan.price) {
    if (plan.price.amount !== 0) {
      return false;
    }

    if (includesAny(unitPriceNote, ['custom', 'contact', 'enterprise'])) {
      return false;
    }

    return badgeText.includes('free') || name.includes('free');
  }

  return false;
}

export function getToolPricingSummary(input: ToolLike): ToolPricingSummary {
  const slug = getSlug(input).toLowerCase().trim();
  return VERIFIED_PRICING_SUMMARIES[slug] || TRUSTED_PRICING_SUMMARIES[slug] || DEFAULT_UNVERIFIED_SUMMARY;
}

export function getPricingDisplay(input: ToolLike): PricingDisplayResult {
  const summary = getToolPricingSummary(input);

  let displayText: string;
  switch (summary.status) {
    case 'free':
      displayText = 'Free';
      break;
    case 'paid':
      displayText = summary.safeStartingPriceText || 'Paid plans available';
      break;
    case 'custom':
    case 'enterprise':
      displayText = 'Custom pricing';
      break;
    case 'pricing-not-verified':
    default:
      displayText = 'Pricing not verified';
      break;
  }

  return {
    ...summary,
    displayText,
    hintText: summary.hasInteractivePricing ? 'Interactive pricing on live page' : null,
  };
}

export function getVerifiedSafePriceValue(input: ToolLike): number | null {
  const summary = getToolPricingSummary(input);
  if (summary.verification !== 'verified' || !summary.safeStartingPriceText) {
    return null;
  }

  const match = summary.safeStartingPriceText.match(/\$([\d.]+)/);
  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  return Number.isFinite(amount) ? amount : null;
}

export function hasVerifiedFreePlan(input: ToolLike): boolean {
  return getToolPricingSummary(input).freePlan === 'yes';
}

export function isVerifiedPricingTool(input: ToolLike): boolean {
  return getToolPricingSummary(input).verification === 'verified';
}

export function isTrustedPricingTool(input: ToolLike): boolean {
  return getToolPricingSummary(input).verification === 'trusted';
}
