import deepbrainAiRecordData from '@/data/pricing/normalized/deepbrain-ai.json';
import dIdRecordData from '@/data/pricing/normalized/d-id.json';
import steveAiRecordData from '@/data/pricing/normalized/steve-ai.json';
import type { PricingPlan, Tool } from '@/types/tool';
import {
  buildResolverPreview,
  type NormalizedPricingPlan,
  type NormalizedPricingRecord,
} from '@/lib/pricing/types';

type ProductizedPricingSlug = 'deepbrain-ai' | 'd-id' | 'steve-ai';

type ProductizedPricingContent = {
  snapshot: {
    plans: Array<{ name: string; bullets: string[] }>;
    note?: string;
  };
  creditUsage: {
    title: string;
    bullets: string[];
  };
  verdict: {
    title: string;
    text: string;
  };
  usageNotes: {
    bullets: string[];
    tip: string;
  };
};

export interface ProductizedPricingPageOverride {
  pricingPlans: PricingPlan[];
  pricingVerification: 'verified' | 'trusted';
  startingPrice: string;
  pricingStatusHint: string | null;
  hasFreeTrial: boolean;
  pricingSnapshot: ProductizedPricingContent['snapshot'];
  creditUsage: ProductizedPricingContent['creditUsage'];
  verdict: ProductizedPricingContent['verdict'];
  usageNotes: ProductizedPricingContent['usageNotes'];
}

export const PRODUCTIZED_PRICING_SLUGS: ProductizedPricingSlug[] = [
  'deepbrain-ai',
  'd-id',
  'steve-ai',
];

const PRODUCTIZED_PRICING_SLUG_SET = new Set<string>(PRODUCTIZED_PRICING_SLUGS);

const PRODUCTIZED_RECORDS: Record<ProductizedPricingSlug, NormalizedPricingRecord> = {
  'deepbrain-ai': deepbrainAiRecordData as NormalizedPricingRecord,
  'd-id': dIdRecordData as NormalizedPricingRecord,
  'steve-ai': steveAiRecordData as NormalizedPricingRecord,
};

const PLAN_ORDER: Record<ProductizedPricingSlug, string[]> = {
  'deepbrain-ai': ['Free', 'Personal', 'Team', 'Enterprise'],
  'd-id': ['Lite', 'Pro', 'Advanced', 'Enterprise'],
  'steve-ai': ['Basic', 'Starter', 'Pro', 'Generative AI', 'Enterprise'],
};

const PLAN_DESCRIPTIONS: Record<ProductizedPricingSlug, Record<string, string>> = {
  'deepbrain-ai': {
    Free: 'Test the workflow',
    Personal: 'Solo creation',
    Team: 'Shared production',
    Enterprise: 'Custom deployment',
  },
  'd-id': {
    Lite: 'Entry paid tier',
    Pro: 'Commercial use',
    Advanced: 'Higher-volume teams',
    Enterprise: 'Custom deployment',
  },
  'steve-ai': {
    Basic: 'Getting started',
    Starter: 'Regular publishing',
    Pro: 'Higher output',
    'Generative AI': 'Custom avatar workflows',
    Enterprise: 'Custom scale',
  },
};

const PLAN_BADGES: Record<ProductizedPricingSlug, Record<string, string>> = {
  'deepbrain-ai': {
    Team: 'Most popular',
  },
  'd-id': {
    Pro: 'Most popular',
  },
  'steve-ai': {
    Starter: 'Most popular',
  },
};

const PRODUCTIZED_EDITORIAL: Record<ProductizedPricingSlug, ProductizedPricingContent> = {
  'deepbrain-ai': {
    snapshot: {
      plans: [
        {
          name: 'Personal',
          bullets: [
            '60 generative credits with 1080p export',
            'Built for solo avatar video production',
            'Keeps the plan simple before team admin features matter',
          ],
        },
        {
          name: 'Team',
          bullets: [
            '150 generative credits and 4K export',
            'Adds collaboration, subtitles, and translation workflow controls',
            'Best fit once multiple reviewers or brand assets enter the process',
          ],
        },
        {
          name: 'Enterprise',
          bullets: [
            'Custom volume, security, and onboarding',
            'Adds SAML SSO, SCORM, and bulk generation support',
            'Use it when procurement, admin, and rollout matter more than seat price',
          ],
        },
      ],
      note: 'The free tier is useful for testing quality, but the paid decision starts at Personal vs Team.',
    },
    creditUsage: {
      title: 'How billing and usage work',
      bullets: [
        'DeepBrain AI mixes plan pricing with credits, export limits, and per-seat logic on higher tiers.',
        'Generative credits and watermark rules are easier to compare in one place than inside every card.',
        'Team pricing is seat-based, so shared workflows raise the real monthly cost faster than solo use.',
        'Annual billing lowers the effective monthly rate, but the cards keep the focus on core tier differences.',
      ],
    },
    usageNotes: {
      bullets: [
        'Use Free to validate avatar quality, export flow, and whether the interface fits your team.',
        'Personal is the real self-serve entry point if you need publishable exports and more generous credits.',
        'Team is where DeepBrain AI starts behaving like a shared production tool rather than a solo creator app.',
        'Enterprise should only be the conversation once security, onboarding, or rollout requirements are already clear.',
      ],
      tip: 'If you expect multiple reviewers, subtitle handoff, or admin controls, compare Team immediately instead of stretching Personal.',
    },
    verdict: {
      title: 'Which DeepBrain AI plan fits best?',
      text: 'Personal is the clean starting point for one owner who needs publishable avatar videos. Team is the upgrade when collaboration, 4K export, and admin workflow become part of the job. Enterprise is only worth the jump once security, rollout, or managed onboarding requirements are driving the buying decision.',
    },
  },
  'd-id': {
    snapshot: {
      plans: [
        {
          name: 'Lite',
          bullets: [
            'Lowest paid entry point for short monthly usage',
            'Keeps avatars and embedded-agent access in the workflow',
            'Best for testing paid output before commercial volume matters',
          ],
        },
        {
          name: 'Pro',
          bullets: [
            '15 minutes per month with commercial-use rights',
            'Adds personal avatars, voice cloning, and faster processing',
            'The practical choice once D-ID moves from experiment to client-facing use',
          ],
        },
        {
          name: 'Advanced',
          bullets: [
            '100 minutes per month for heavier production volume',
            'Adds more personal avatars, more voice clones, and more embedded agents',
            'Use it when recurring output is the bottleneck, not feature access',
          ],
        },
      ],
      note: 'The free trial still matters, but the buying decision is really Lite vs Pro vs Advanced.',
    },
    creditUsage: {
      title: 'How trial, annual billing, and usage work',
      bullets: [
        'D-ID leads with a 14-day trial, but trial access should not be confused with the long-term paid tiers.',
        'Annual pricing lowers the effective monthly number, so the cards keep the recurring tier ladder readable and move promo detail down here.',
        'Minutes, avatar count, voice cloning, and license terms are the real buying levers across the paid plans.',
        'Commercial use and watermark behavior matter more than promo language when deciding whether Lite is enough.',
      ],
    },
    usageNotes: {
      bullets: [
        'Treat the trial as a workflow check: quality, avatar style, and embedded-agent fit.',
        'Lite is the cheapest way to stay in the product, but Pro is where D-ID starts looking viable for real paid publishing.',
        'Advanced is the scale tier for teams that know they will burn through minutes every month.',
        'Enterprise is for custom volume, security, and service requirements, not for incremental upgrades.',
      ],
      tip: 'If you need commercial output, compare Pro first; Lite is mostly for buyers who want a lower-cost way to stay hands-on with the platform.',
    },
    verdict: {
      title: 'How to avoid the wrong D-ID plan',
      text: 'Ignore the trial as the main narrative and compare the paid tiers directly. Lite is the entry point, Pro is the practical commercial tier, and Advanced is the volume tier once minutes and assets become a recurring constraint. Enterprise only makes sense when you need custom capacity or service commitments, not just a few extra features.',
    },
  },
  'steve-ai': {
    snapshot: {
      plans: [
        {
          name: 'Basic',
          bullets: [
            'Entry tier for light monthly video output',
            'Keeps watermark-free exports and core Steve AI workflow',
            'Useful when budget matters more than resolution and scale',
          ],
        },
        {
          name: 'Starter',
          bullets: [
            '1080p output with the same 100 AI video minutes per month',
            'A cleaner default for regular publishing than staying on Basic',
            'Balances cost and output quality better than jumping straight to Pro',
          ],
        },
        {
          name: 'Pro',
          bullets: [
            '300 AI video minutes and stronger resolution',
            'Built for heavier monthly production without add-on dependence',
            'The best fit once Steve AI becomes part of an ongoing content pipeline',
          ],
        },
      ],
      note: 'Add-ons and upgrade paths exist, but the main buying decision is still Basic vs Starter vs Pro vs Generative AI.',
    },
    creditUsage: {
      title: 'How core tiers, generative quotas, and add-ons work',
      bullets: [
        'Steve AI surfaces add-ons, power-ups, and upgrade pricing alongside the main tiers, which makes the raw pricing page feel noisier than it needs to be.',
        'The cards here only keep the core tier ladder so minutes, stock quota, resolution, and voice quality stay readable.',
        'Generative credits matter most on the Generative AI tier; they should not dominate the lower plans if your job is mostly standard video output.',
        'If your team expects to rely on add-ons every month, compare the next core tier before assuming the cheapest plan will stay cheap.',
      ],
    },
    usageNotes: {
      bullets: [
        'Basic is the low-cost entry point, but Starter is the cleaner default for ongoing publishing because it improves output quality without jumping into the expensive tiers.',
        'Pro is where the monthly capacity really opens up for teams or creators with a regular production schedule.',
        'Generative AI is the special-case tier when custom-avatar and generative workflow limits become the main buying factor.',
        'Enterprise is a custom conversation and should not be used as the default comparison point for self-serve buyers.',
      ],
      tip: 'If you already know you will need more than occasional output, compare Starter and Pro first; add-ons make Basic look cheaper than it often ends up being.',
    },
    verdict: {
      title: 'Which Steve AI plan should you actually buy?',
      text: 'Basic works for light usage, but Starter is the more balanced paid plan if you publish regularly. Pro is the better value once monthly video volume becomes predictable, while Generative AI is only worth the jump when generative capacity is the main reason you are buying Steve AI. Ignore the add-on maze until you know the core tier itself is too small.',
    },
  },
};

const HIDDEN_BULLET_PATTERNS = [
  /\beverything in\b/i,
  /\bbilled annually\b/i,
  /\bdiscount\b/i,
  /\bsave\b/i,
  /\bfirst month\b/i,
  /\bsupports add-ons\b/i,
  /\bmarketing link\b/i,
  /\bpower[- ]?up\b/i,
  /\bgenai motion\b/i,
  /\boriginal price\b/i,
];

const PRIORITY_PATTERNS: Record<ProductizedPricingSlug, RegExp[]> = {
  'deepbrain-ai': [
    /\b(videos? up to|video exports?|video duration|unlimited ai videos?)\b/i,
    /\b(generative credits?|credits?)\b/i,
    /\b(720p|1080p|4k)\b/i,
    /\b(avatars?|languages?|voices?)\b/i,
    /\b(team|collaboration|workspace|brand kit|saml|sso|scorm|admin)\b/i,
    /\bwatermark\b/i,
  ],
  'd-id': [
    /\b(\d+\s*(min|mins|minutes?))\b/i,
    /\b(avatars?|voice clone|voices?)\b/i,
    /\b(watermark|commercial use|license)\b/i,
    /\b(embedded agent|agents?)\b/i,
    /\b(processing)\b/i,
    /\b(api access)\b/i,
  ],
  'steve-ai': [
    /\b(ai videos?\/month|mins?\s*ai videos?|mins? ai videos?)\b/i,
    /\b(ai images?|premium stock)\b/i,
    /\b(720p|1080p|2k|4k)\b/i,
    /\b(human-like voices?|voices?)\b/i,
    /\bwatermark\b/i,
    /\b(generative credits?|generative)\b/i,
  ],
};

function isProductizedPricingSlug(slug: string): slug is ProductizedPricingSlug {
  return PRODUCTIZED_PRICING_SLUG_SET.has(slug);
}

export function shouldUseProductizedPricingPage(slug: string): slug is ProductizedPricingSlug {
  return isProductizedPricingSlug(slug);
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function sanitizeBadge(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
  return cleaned || null;
}

function sanitizeBulletText(value: string): string {
  return value
    .replace(/([A-Za-z])\d+\b/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/^,+|,+$/g, '')
    .replace(/\bmins?\./gi, 'mins')
    .trim();
}

function isHiddenBullet(text: string): boolean {
  return HIDDEN_BULLET_PATTERNS.some((pattern) => pattern.test(text));
}

function dedupeBullets(items: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const item of items) {
    const normalized = normalizeText(item);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    deduped.push(item);
  }

  return deduped;
}

function pickWhitelistedBullets(
  slug: ProductizedPricingSlug,
  plan: NormalizedPricingPlan,
): Array<{ text: string }> {
  const sanitizedBullets = dedupeBullets(
    (plan.coreBullets || [])
      .map((bullet) => sanitizeBulletText(bullet.text))
      .filter(Boolean)
      .filter((text) => !isHiddenBullet(text)),
  );

  if (sanitizedBullets.length === 0) {
    return [];
  }

  const selected: string[] = [];
  const patterns = PRIORITY_PATTERNS[slug];

  for (const pattern of patterns) {
    const match = sanitizedBullets.find((bullet) => pattern.test(bullet) && !selected.includes(bullet));
    if (match) {
      selected.push(match);
    }
  }

  for (const bullet of sanitizedBullets) {
    if (selected.length >= 5) break;
    if (selected.includes(bullet)) continue;
    selected.push(bullet);
  }

  return selected.slice(0, 5).map((text) => ({ text }));
}

function getBillingStateIds(record: NormalizedPricingRecord, billingMode: 'monthly' | 'annual'): string[] {
  return record.billingStates
    .filter((state) => state.billingMode === billingMode)
    .map((state) => state.stateId);
}

function pickRecurringAmount(
  plan: NormalizedPricingPlan,
  stateIds: string[],
): number | null {
  const candidates = plan.pricePoints.filter((pricePoint) => {
    return (
      stateIds.includes(pricePoint.stateId) &&
      pricePoint.priceRole === 'core-recurring' &&
      typeof pricePoint.amount === 'number'
    );
  });

  const defaultVisible = candidates.find((candidate) => candidate.isDefaultVisible);
  return defaultVisible?.amount ?? candidates[0]?.amount ?? null;
}

function pickAmountByRole(
  plan: NormalizedPricingPlan,
  stateIds: string[],
  priceRole: string,
): number | null {
  const candidates = plan.pricePoints.filter((pricePoint) => {
    return (
      stateIds.includes(pricePoint.stateId) &&
      pricePoint.priceRole === priceRole &&
      typeof pricePoint.amount === 'number'
    );
  });

  const defaultVisible = candidates.find((candidate) => candidate.isDefaultVisible);
  return defaultVisible?.amount ?? candidates[0]?.amount ?? null;
}

function resolveMonthlyRecurringAmount(
  record: NormalizedPricingRecord,
  plan: NormalizedPricingPlan,
): number | null {
  const monthlyStateIds = getBillingStateIds(record, 'monthly');
  const annualStateIds = getBillingStateIds(record, 'annual');
  const monthlyRecurring = pickRecurringAmount(plan, monthlyStateIds);
  const annualRecurring = pickRecurringAmount(plan, annualStateIds);
  const annualStrikeThrough = pickAmountByRole(plan, annualStateIds, 'strike-through');

  if (
    typeof annualRecurring === 'number' &&
    typeof annualStrikeThrough === 'number' &&
    annualStrikeThrough > annualRecurring &&
    (monthlyRecurring === null || monthlyRecurring === annualRecurring)
  ) {
    return annualStrikeThrough;
  }

  return monthlyRecurring;
}

function buildPlanPrice(
  slug: ProductizedPricingSlug,
  record: NormalizedPricingRecord,
  plan: NormalizedPricingPlan,
): PricingPlan['price'] {
  if (plan.planType === 'enterprise' || plan.planType === 'custom') {
    return 'Custom pricing';
  }

  const monthly = resolveMonthlyRecurringAmount(record, plan);
  const yearly = pickRecurringAmount(plan, getBillingStateIds(record, 'annual'));

  if (typeof monthly === 'number' && typeof yearly === 'number') {
    return {
      monthly: {
        amount: monthly,
        currency: 'USD',
        period: 'month',
      },
      yearly: {
        amount: yearly,
        currency: 'USD',
        period: 'month',
      },
    };
  }

  if (typeof monthly === 'number') {
    return {
      amount: monthly,
      currency: 'USD',
      period: 'month',
    };
  }

  if (typeof yearly === 'number') {
    return {
      amount: yearly,
      currency: 'USD',
      period: 'month',
    };
  }

  if (slug === 'deepbrain-ai' || slug === 'steve-ai') {
    return plan.displayedPrice === 'Let’s Talk' ? 'Custom pricing' : plan.displayedPrice || 'Custom pricing';
  }

  return plan.displayedPrice || 'Custom pricing';
}

function buildUnitPriceNote(plan: NormalizedPricingPlan): string | undefined {
  if (plan.planType === 'enterprise' || plan.planType === 'custom') {
    return undefined;
  }

  if (plan.unit === 'seat') {
    return 'Per seat';
  }

  return undefined;
}

function buildBillingNote(plan: NormalizedPricingPlan): string | undefined {
  if (plan.planType === 'enterprise' || plan.planType === 'custom') {
    return undefined;
  }

  if (plan.pricePoints.some((pricePoint) => pricePoint.stateId.includes('annual'))) {
    return 'Billed annually';
  }

  return undefined;
}

function toPricingPlan(
  slug: ProductizedPricingSlug,
  record: NormalizedPricingRecord,
  plan: NormalizedPricingPlan,
): PricingPlan {
  const normalizedName = plan.name;
  const manualBadge = PLAN_BADGES[slug][normalizedName];
  const manualDescription = PLAN_DESCRIPTIONS[slug][normalizedName];

  return {
    name: normalizedName,
    price: buildPlanPrice(slug, record, plan),
    description: manualDescription,
    featureItems: pickWhitelistedBullets(slug, plan),
    ctaText: plan.planType === 'enterprise' ? 'Contact Sales' : plan.cta.text || 'Get started',
    ribbonText: manualBadge || sanitizeBadge(plan.badge) || sanitizeBadge(plan.marketingBadgeText) || undefined,
    unitPriceNote: buildUnitPriceNote(plan),
    billingNote: buildBillingNote(plan),
  };
}

function getStartingPrice(slug: ProductizedPricingSlug, pricingPlans: PricingPlan[]): string {
  const firstPaidPlan = pricingPlans.find((plan) => {
    return (
      typeof plan.price === 'object' &&
      plan.price !== null &&
      'monthly' in plan.price &&
      typeof plan.price.monthly === 'object' &&
      plan.price.monthly !== null &&
      'amount' in plan.price.monthly &&
      (plan.price.monthly.amount ?? 0) > 0
    );
  });

  if (
    !firstPaidPlan ||
    typeof firstPaidPlan.price !== 'object' ||
    firstPaidPlan.price === null ||
    !('monthly' in firstPaidPlan.price) ||
    typeof firstPaidPlan.price.monthly !== 'object' ||
    firstPaidPlan.price.monthly === null ||
    !('amount' in firstPaidPlan.price.monthly)
  ) {
    return buildResolverPreview(PRODUCTIZED_RECORDS[slug]).displayText;
  }

  const amount = firstPaidPlan.price.monthly.amount;
  return `Starts at $${amount}/mo`;
}

function getPricingStatusHint(slug: ProductizedPricingSlug): string {
  switch (slug) {
    case 'deepbrain-ai':
      return 'Official pricing reviewed. Cards keep the core self-serve and team tiers, while shared billing details are summarized below.';
    case 'd-id':
      return 'Official pricing reviewed. Trial, annual billing, and promo details are summarized below instead of leading the page.';
    case 'steve-ai':
      return 'Official pricing reviewed. Add-ons and upgrade pricing were removed from the main cards so the core tier ladder stays readable.';
  }
}

export function getProductizedPricingPageOverride(
  slug: string,
  tool: Tool,
): ProductizedPricingPageOverride | null {
  if (!isProductizedPricingSlug(slug)) {
    return null;
  }

  const record = PRODUCTIZED_RECORDS[slug];
  const orderedPlans = PLAN_ORDER[slug]
    .map((planName) => record.plans.find((plan) => plan.name === planName))
    .filter((plan): plan is NormalizedPricingPlan => Boolean(plan));

  const pricingPlans = orderedPlans.map((plan) => toPricingPlan(slug, record, plan));

  return {
    pricingPlans,
    pricingVerification: record.verification === 'verified' ? 'verified' : 'trusted',
    startingPrice: getStartingPrice(slug, pricingPlans),
    pricingStatusHint: getPricingStatusHint(slug),
    hasFreeTrial: record.hasFreeTrial ?? tool.has_free_trial,
    pricingSnapshot: PRODUCTIZED_EDITORIAL[slug].snapshot,
    creditUsage: PRODUCTIZED_EDITORIAL[slug].creditUsage,
    verdict: PRODUCTIZED_EDITORIAL[slug].verdict,
    usageNotes: PRODUCTIZED_EDITORIAL[slug].usageNotes,
  };
}
