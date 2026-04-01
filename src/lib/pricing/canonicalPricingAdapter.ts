import { getCanonicalDisplayValue, getCanonicalPricingToolForSiteSlug, isCanonicalMissingValue } from '@/lib/pricingCards';
import type { ProductizedPricingPageOverride } from '@/lib/pricing/productPageOverrides';
import type { CanonicalPricingPlan, CanonicalPricingStatus, CanonicalPricingTool } from '@/types/pricingCards';
import type { PricingPlan, Tool } from '@/types/tool';

function stripMarkdown(value: string): string {
  return value.replace(/\*\*/g, '').replace(/`/g, '').trim();
}

function normalizeText(value: string): string {
  return stripMarkdown(value)
    .toLowerCase()
    .replace(/[^\w\s$/.%-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getOptionalCanonicalText(value: string | undefined): string | undefined {
  if (!value || isCanonicalMissingValue(value)) {
    return undefined;
  }

  return stripMarkdown(value);
}

function parseAmount(value: string): number | null {
  if (!value || isCanonicalMissingValue(value)) return null;
  const normalized = value.replace(/,/g, '');
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const amount = Number.parseFloat(match[0]);
  return Number.isFinite(amount) ? amount : null;
}

function isColossyanStructuralNoise(normalized: string): boolean {
  return (
    normalized === 'from' ||
    normalized === 'custom editors' ||
    /^\d+\s+editors?$/.test(normalized) ||
    /^\d+\s+(min|mins|minutes?)$/.test(normalized)
  );
}

function getColossyanTopicKey(normalized: string): string | null {
  if (/everything in/.test(normalized)) return 'carry-forward';
  if (/minutes? of video|unlimited minutes|generate up to \d+ minutes?|up to \d+ minutes? long/.test(normalized)) return 'minutes';
  if (/custom avatars?|voices? per editor|voice clone/.test(normalized)) return 'custom-avatar-voice';
  if (/avatars?/.test(normalized)) return 'avatars';
  if (/interactive videos?|quizzes|branching/.test(normalized)) return 'interactive';
  if (/translations?|translate videos?/.test(normalized)) return 'translation';
  if (/latest models?|neo/.test(normalized)) return 'models';
  if (/brand kits?/.test(normalized)) return 'brand-kit';
  if (/saml|sso|centralized authentication/.test(normalized)) return 'identity';
  if (/scorm|learning management system/.test(normalized)) return 'lms';
  if (/unlimited viewers/.test(normalized)) return 'viewers';
  if (/multiple avatars/.test(normalized)) return 'multi-avatar';
  if (/companies scaling video production/.test(normalized)) return 'enterprise-fit';
  return null;
}

function isColossyanExplanatorySentence(normalized: string): boolean {
  return (
    /generate |get access to|get unlimited access|create an avatar|invite unlimited viewers|create realistic conversational videos|powering our|ensure enterprise level|ensure enterprise-level|ensure enterprise level security|ensure enterprise-level security|seamlessly integrate|apply your company s branding|translate videos into|create videos with quizzes/.test(
      normalized,
    ) || normalized.length > 95
  );
}

function sanitizeColossyanBullets(bullets: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  const seenTopics = new Set<string>();

  for (const rawBullet of bullets) {
    const bullet = stripMarkdown(rawBullet).replace(/\bColossyan AI Avatars\b/g, 'AI avatars').trim();
    const normalized = normalizeText(bullet);
    if (!normalized || isColossyanStructuralNoise(normalized)) {
      continue;
    }

    const topic = getColossyanTopicKey(normalized);
    if (isColossyanExplanatorySentence(normalized)) {
      continue;
    }

    if (/unlimited features/.test(normalized)) {
      continue;
    }

    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    if (topic) {
      seenTopics.add(topic);
    }
    result.push(bullet);
  }

  return result;
}

function sanitizeBullets(toolSlug: string, plan: CanonicalPricingPlan): string[] {
  const badgePatterns = [
    /\bmost popular\b/i,
    /\bbest value\b/i,
    /\bpopular\b/i,
    /\brecommended\b/i,
  ];
  const unavailablePatterns = [
    /\bnot available\b/i,
    /\bnot_found\b/i,
    /\bbilling label not available\b/i,
    /\byearly total not available\b/i,
    /\bannual note not available\b/i,
    /\bpricing not found\b/i,
  ];
  const structuralPatterns = [/^includes:?$/i, /^features included:?$/i, /^key features:?$/i];

  const repeatedContext = new Set(
    [
      plan.name,
      plan.description,
      plan.cta,
      plan.monthlyPriceBlock.displayedPrice,
      plan.monthlyPriceBlock.displayUnit,
      plan.monthlyPriceBlock.billingLabel,
      plan.yearlyPriceBlock.displayedPrice,
      plan.yearlyPriceBlock.displayUnit,
      plan.yearlyPriceBlock.billingLabel,
      plan.yearlyPriceBlock.yearlyTotalPrice,
      plan.yearlyPriceBlock.annualNote,
    ]
      .filter(Boolean)
      .map((value) => normalizeText(value!))
      .filter(Boolean),
  );

  const seen = new Set<string>();

  const sanitized = plan.bullets
    .map((bullet) => stripMarkdown(bullet))
    .filter(Boolean)
    .filter((bullet) => !structuralPatterns.some((pattern) => pattern.test(bullet)))
    .filter((bullet) => !badgePatterns.some((pattern) => pattern.test(bullet)))
    .filter((bullet) => !unavailablePatterns.some((pattern) => pattern.test(bullet)))
    .filter((bullet) => {
      const normalized = normalizeText(bullet);
      if (!normalized) return false;
      if (repeatedContext.has(normalized)) return false;
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });

  if (toolSlug === 'colossyan') {
    return sanitizeColossyanBullets(sanitized);
  }

  return sanitized;
}

function toPricingVerification(status: CanonicalPricingStatus): 'verified' | 'trusted' {
  if (status === 'insufficient_evidence') {
    return 'trusted';
  }

  return 'verified';
}

function buildStatusHint(tool: CanonicalPricingTool): string {
  switch (tool.status) {
    case 'done':
      return 'Pricing cards on this page are coming from the canonical pricing dataset.';
    case 'usable_with_gaps':
      return 'Canonical pricing is connected here, but some plan fields are still partial.';
    case 'frozen':
      return 'This pricing record is frozen. Use the cards here as a baseline and confirm current pricing on the official page before budgeting around it.';
    case 'insufficient_evidence':
      return 'Canonical pricing exists for this tool, but the available evidence is not strong enough to render a complete current plan ladder.';
  }
}

function buildUsageNotes(tool: CanonicalPricingTool): ProductizedPricingPageOverride['usageNotes'] {
  switch (tool.status) {
    case 'done':
      return {
        bullets: [
          'Canonical pricing cards are connected as the primary plan source for this page.',
          'Compare the monthly and yearly blocks directly on each card before choosing a billing mode.',
          'Use the yearly total and annual note together instead of reading the yearly number in isolation.',
        ],
        tip: 'If a plan shows both monthly and yearly blocks, use the annual note to understand what the yearly number actually means.',
      };
    case 'usable_with_gaps':
      return {
        bullets: [
          'Canonical pricing is connected, but some plan fields are still incomplete.',
          'Treat blank labels or simplified notes as evidence gaps rather than hidden plan benefits.',
          'The core plan ladder is still usable for a first-pass pricing check.',
        ],
        tip: 'Use the cards for directional comparison, then confirm edge-case billing details on the official pricing page.',
      };
    case 'frozen':
      return {
        bullets: [
          'This tool is using a frozen canonical pricing record.',
          'The plan ladder is still useful for orientation, but current pricing may have drifted since the record was frozen.',
          'Check the official pricing page before budgeting around discounts, credits, or annual commitments.',
        ],
        tip: 'Use frozen records as a baseline comparison, not as your final procurement source.',
      };
    case 'insufficient_evidence':
      return {
        bullets: [
          'Canonical pricing exists for this tool, but current evidence is not strong enough to render complete live plan cards.',
          'Missing plans or missing price blocks should be treated as unresolved evidence gaps.',
          'The official pricing page is still the source of truth for current packaging.',
        ],
        tip: 'If pricing is a decision-maker for this tool, verify the live pricing page directly before comparing it against alternatives.',
      };
  }
}

function buildSnapshot(plans: PricingPlan[]): ProductizedPricingPageOverride['pricingSnapshot'] {
  return {
    plans: plans
      .filter((plan) => {
        const name = plan.name.toLowerCase();
        return !name.includes('free') && !name.includes('trial') && !name.includes('enterprise');
      })
      .slice(0, 3)
      .map((plan) => ({
        name: plan.name,
        bullets: (plan.featureItems || []).slice(0, 3).map((item) => item.text),
      })),
    note: 'Canonical pricing cards are being used as the primary plan source for this page.',
  };
}

function buildStartingPrice(tool: CanonicalPricingTool): string {
  const firstPaidPlan = tool.plans.find((plan) => {
    const displayed = plan.monthlyPriceBlock.displayedPrice;
    return !isCanonicalMissingValue(displayed) && !/^\$0$|^custom$/i.test(displayed);
  });

  if (!firstPaidPlan) {
    return 'Check pricing page';
  }

  const displayedPrice = getCanonicalDisplayValue(firstPaidPlan.monthlyPriceBlock.displayedPrice, 'Check pricing page');
  const displayUnit = getOptionalCanonicalText(firstPaidPlan.monthlyPriceBlock.displayUnit) || '';
  return `Starts at ${displayedPrice}${displayUnit}`;
}

function hasFreeTrialOrFreePlan(tool: CanonicalPricingTool, fallback: boolean): boolean {
  if (
    tool.plans.some((plan) => {
      const name = plan.name.toLowerCase();
      const cta = plan.cta.toLowerCase();
      return name.includes('free') || name.includes('trial') || cta.includes('trial');
    })
  ) {
    return true;
  }

  return fallback;
}

function toPricingPlan(toolSlug: string, plan: CanonicalPricingPlan): PricingPlan {
  const monthlyAmount = parseAmount(plan.monthlyPriceBlock.displayedPrice);
  const yearlyAmount = parseAmount(plan.yearlyPriceBlock.displayedPrice);
  const isCustom = /custom/i.test(plan.monthlyPriceBlock.displayedPrice) || /custom/i.test(plan.yearlyPriceBlock.displayedPrice);

  let price: PricingPlan['price'];

  if (isCustom) {
    price = 'Custom pricing';
  } else if (monthlyAmount !== null && yearlyAmount !== null) {
    price = {
      monthly: {
        amount: monthlyAmount,
        currency: 'USD',
        period: 'month',
      },
      yearly: {
        amount: yearlyAmount,
        currency: 'USD',
        period: 'month',
      },
    };
  } else if (monthlyAmount !== null) {
    price = {
      monthly: {
        amount: monthlyAmount,
        currency: 'USD',
        period: 'month',
      },
    };
  } else if (yearlyAmount !== null) {
    price = {
      monthly: {
        amount: yearlyAmount,
        currency: 'USD',
        period: 'month',
      },
    };
  } else {
    price = getCanonicalDisplayValue(plan.monthlyPriceBlock.displayedPrice, 'Price not listed');
  }

  const description = getOptionalCanonicalText(plan.description);
  const monthlyBillingLabel = getOptionalCanonicalText(plan.monthlyPriceBlock.billingLabel);
  const yearlyBillingLabel = getOptionalCanonicalText(plan.yearlyPriceBlock.billingLabel);
  const yearlyTotalPrice = getOptionalCanonicalText(plan.yearlyPriceBlock.yearlyTotalPrice);
  const annualNote = getOptionalCanonicalText(plan.yearlyPriceBlock.annualNote);

  return {
    name: plan.name,
    description,
    ctaText: getCanonicalDisplayValue(plan.cta, 'Get started'),
    price,
    featureItems: sanitizeBullets(toolSlug, plan).map((text) => ({ text })),
    monthlyPriceDisplay: getCanonicalDisplayValue(plan.monthlyPriceBlock.displayedPrice, 'Price not listed'),
    monthlyDisplayUnit: getOptionalCanonicalText(plan.monthlyPriceBlock.displayUnit),
    monthlyBillingLabel: monthlyBillingLabel,
    yearlyPriceDisplay: getCanonicalDisplayValue(plan.yearlyPriceBlock.displayedPrice, 'Price not listed'),
    yearlyDisplayUnit: getOptionalCanonicalText(plan.yearlyPriceBlock.displayUnit),
    yearlyBillingLabel: yearlyBillingLabel,
    yearlyTotalPrice: yearlyTotalPrice,
    annualNote: annualNote,
    billingNote: monthlyBillingLabel,
  };
}

export function getCanonicalPricingPageOverride(
  slug: string,
  tool: Tool,
): ProductizedPricingPageOverride | null {
  const canonicalTool = getCanonicalPricingToolForSiteSlug(slug);

  if (!canonicalTool) {
    return null;
  }

  const pricingPlans = canonicalTool.plans.map((plan) => toPricingPlan(canonicalTool.slug, plan));
  const usageNotes = buildUsageNotes(canonicalTool);

  return {
    pricingPlans,
    pricingVerification: toPricingVerification(canonicalTool.status),
    startingPrice: buildStartingPrice(canonicalTool),
    pricingStatusHint: buildStatusHint(canonicalTool),
    hasFreeTrial: hasFreeTrialOrFreePlan(canonicalTool, tool.has_free_trial),
    pricingSnapshot: buildSnapshot(pricingPlans),
    creditUsage: {
      title: 'Canonical pricing status',
      bullets: usageNotes.bullets,
    },
    usageNotes,
    usageGroups: [],
    pricingDetails: null,
    verdict: {
      title: `How to read ${tool.name} pricing`,
      text:
        canonicalTool.status === 'done'
          ? 'This page is using canonical pricing cards for the current plan ladder. Compare monthly and yearly blocks directly on each card, then use the annual note and yearly total before choosing a billing mode.'
          : 'This page is using canonical pricing cards where available. Treat missing fields as evidence gaps and confirm edge-case pricing details on the official pricing page.',
    },
  };
}
