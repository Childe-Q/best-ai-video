import fs from 'fs';
import path from 'path';
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

type SiteReadyPricingBullet = {
  text: string;
  isLimit?: boolean;
  isModelInfo?: boolean;
};

type SiteReadyPricingPlan = {
  name: string;
  isEnterprise?: boolean;
  pricing?: {
    amount?: string | null;
    originalAmount?: string | null;
    currency?: string | null;
    interval?: string | null;
    billingNote?: string | null;
    rawPriceText?: string | null;
  };
  cta?: string | null;
  bullets?: SiteReadyPricingBullet[];
};

type SiteReadyPricingFile = {
  slug: string;
  officialPricingUrl?: string;
  currentToggleState?: {
    billingView?: string;
    rawLabel?: string;
  };
  plans?: SiteReadyPricingPlan[];
};

type PlanDetailSection = {
  title: string;
  items: string[];
};

export type ProductizedPricingUsageGroup = {
  title: string;
  bullets: string[];
};

export type ProductizedPricingDetailPlan = {
  name: string;
  summary?: string;
  sections: PlanDetailSection[];
};

export type ProductizedPricingDetailSection = {
  title: string;
  intro?: string;
  plans: ProductizedPricingDetailPlan[];
};

type ProductizedPricingEditorial = {
  usageTitle: string;
  usageBullets: string[];
  usageTip: string;
  verdict: {
    title: string;
    text: string;
  };
  snapshotNote: string;
};

type ClassifiedPlanContent = {
  cardBullets: string[];
  annualNotes: string[];
  trialNotes: string[];
  promoNotes: string[];
  usageCaveats: string[];
  licensingNotes: string[];
  qualifiers: string[];
  explanatoryCopy: string[];
  creditOptions: string[];
  usageOptions: string[];
  planControls: string[];
  addOnCards: string[];
  upgradeCards: string[];
  detailBullets: string[];
};

type ProductizedPlanView = {
  infoPlan: SiteReadyPricingPlan | null;
  recordPlan: NormalizedPricingPlan | null;
  pricingPlan: PricingPlan;
  classified: ClassifiedPlanContent;
};

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export interface ProductizedPricingPageOverride {
  pricingPlans: PricingPlan[];
  pricingVerification: 'verified' | 'trusted';
  startingPrice: string;
  pricingStatusHint: string | null;
  hasFreeTrial: boolean;
  pricingSnapshot: {
    plans: Array<{ name: string; bullets: string[] }>;
    note?: string;
  };
  creditUsage: {
    title: string;
    bullets: string[];
  };
  usageNotes: {
    bullets: string[];
    tip: string;
  };
  usageGroups: ProductizedPricingUsageGroup[];
  pricingDetails: ProductizedPricingDetailSection | null;
  verdict: {
    title: string;
    text: string;
  };
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

const SITE_READY_FILE_BY_SLUG: Record<ProductizedPricingSlug, string> = {
  'deepbrain-ai': 'aistudios-com.json',
  'd-id': 'd-id.json',
  'steve-ai': 'steve-ai.json',
};

const PLAN_ORDER: Record<ProductizedPricingSlug, string[]> = {
  'deepbrain-ai': ['Free', 'Personal', 'Team', 'Enterprise'],
  'd-id': ['Lite', 'Pro', 'Advanced', 'Enterprise'],
  'steve-ai': ['Basic', 'Starter', 'Pro', 'Enterprise'],
};

const PLAN_DESCRIPTIONS: Record<ProductizedPricingSlug, Record<string, string>> = {
  'deepbrain-ai': {
    Free: 'Test AI avatar output',
    Personal: 'Solo avatar production',
    Team: 'Shared video workflow',
    Enterprise: 'Security and rollout',
  },
  'd-id': {
    Lite: 'Low-cost paid entry',
    Pro: 'Commercial publishing',
    Advanced: 'Higher monthly volume',
    Enterprise: 'Custom deployment',
  },
  'steve-ai': {
    Basic: 'Light monthly output',
    Starter: 'Regular publishing',
    Pro: 'Higher production volume',
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

const PRODUCTIZED_EDITORIAL: Record<ProductizedPricingSlug, ProductizedPricingEditorial> = {
  'deepbrain-ai': {
    usageTitle: 'How billing and usage work',
    usageBullets: [
      'DeepBrain AI mixes recurring pricing with generation limits, dubbing scope, and a seat-based Team tier.',
      'The cards keep the upgrade ladder readable, while billing qualifiers and shared workflow caveats are summarized here.',
      'Free is useful for validating output quality, but the real purchase decision starts at Personal versus Team.',
    ],
    usageTip:
      'If multiple reviewers, subtitles, or shared brand workflows are already part of the job, compare Team first instead of stretching Personal.',
    verdict: {
      title: 'Which DeepBrain AI plan fits best?',
      text: 'Personal is the clean self-serve choice for one owner who needs publishable avatar videos. Team is the right jump once shared workspaces, more credits, and stronger dubbing workflow matter. Enterprise only makes sense when security, rollout, or managed support is driving the purchase.',
    },
    snapshotNote:
      'Free is useful for testing, but most paid buyers are really deciding between Personal, Team, and Enterprise.',
  },
  'd-id': {
    usageTitle: 'How trial, billing, and usage work',
    usageBullets: [
      'D-ID leads with a trial and annual pricing language, but the real buying decision still lives in Lite versus Pro versus Advanced.',
      'Minutes, avatar access, voice cloning, watermark behavior, and licensing are the meaningful differences across paid tiers.',
      'Promo and slider-dependent credit lines belong in context here, not as the main story inside every plan card.',
    ],
    usageTip:
      'If the output is commercial or client-facing, compare Pro first; Lite is mainly for buyers who want a cheaper paid foothold.',
    verdict: {
      title: 'How to avoid the wrong D-ID plan',
      text: 'Treat Trial as a workflow check, not the main narrative. Lite is the budget entry, Pro is the practical commercial tier, and Advanced is the scale tier when monthly minutes, avatars, and voice capacity become real constraints. Enterprise is for custom capacity or service commitments, not just a small feature bump.',
    },
    snapshotNote:
      'The trial still matters, but the buying decision is really Lite versus Pro versus Advanced.',
  },
  'steve-ai': {
    usageTitle: 'How core tiers and quota notes work',
    usageBullets: [
      'Steve AI is easier to buy when you focus on the core tier ladder first: Basic, Starter, Pro, then Enterprise.',
      'Downloads, premium asset credits, resolution, and character capacity are the clearest reasons to move up a tier.',
      'The cards keep the main plan ladder readable, while billing qualifiers and extra notes sit below.',
    ],
    usageTip:
      'If you already know you will publish regularly, compare Starter and Pro first instead of optimizing around the cheapest entry tier.',
    verdict: {
      title: 'Which Steve AI plan should you actually buy?',
      text: 'Basic works for occasional output, but Starter is the more balanced plan for ongoing publishing because it improves both monthly capacity and export quality. Pro is the better fit once downloads and premium assets become recurring limits. Enterprise is the custom option for scale, security, and managed support.',
    },
    snapshotNote:
      'Most buyers are deciding how much monthly output and export quality they need, not whether they need every edge-case add-on.',
  },
};

const PRIORITY_PATTERNS: Record<ProductizedPricingSlug, RegExp[]> = {
  'deepbrain-ai': [
    /\b(create up to \d+ ai videos|unlimited ai video generation|bulk video generation)\b/i,
    /\b(videos? up to \d+ minutes?|video generation)\b/i,
    /\b(generative credits?)\b/i,
    /\b(ai dubbing|lip-sync|translation|proofread)\b/i,
    /\b(workspaces?|saml|sso|security|technical support)\b/i,
  ],
  'd-id': [
    /\b(\d+\s*min\.?\s*\/\s*month|\d+\s*min(?:ute)?s?\s*\/\s*month|unlimited video minutes)\b/i,
    /\b(personal avatars?|video avatars?|photo avatars?|studio avatars?)\b/i,
    /\b(voice clone|voice clones|premium voices|professional voice cloning)\b/i,
    /\b(embedded agent|embedded agents|api access|concurrent video processing)\b/i,
    /\b(commercial use license|personal use license|watermark|custom logo)\b/i,
  ],
  'steve-ai': [
    /\b(video downloads?\/month|unlimited downloads)\b/i,
    /\b(premium assets?\/month|credits to use premium assets\/month)\b/i,
    /\b(720p|1080p|2k|4k)\b/i,
    /\b(custom characters?)\b/i,
    /\b(watermark-free|dedicated account manager|sso)\b/i,
  ],
};

const GENERIC_BULLET_PATTERNS = [
  /\beverything in\b/i,
  /\bmarketing link\b/i,
];

const TRIAL_ONLY_PATTERNS = [/\btrial\b/i, /\b14-day\b/i];
const ANNUAL_NOTE_PATTERNS = [/\bbilled annually\b/i, /\bdiscount\b/i, /\bsave\b/i];
const PROMO_NOTE_PATTERNS = [/\bfirst month\b/i, /\bpromo\b/i, /\blimited-time\b/i];
const ADD_ON_PATTERNS = [/\badd-on\b/i, /\bpower[- ]?up\b/i, /\bextra credits?\b/i];
const UPGRADE_PATTERNS = [/\bupgrade\b/i];
const LICENSING_PATTERNS = [/\bwatermark\b/i, /\blicense\b/i, /\bcommercial use\b/i, /\bpersonal use\b/i, /\bcustom logo\b/i];
const EXPLANATORY_PATTERNS = [
  /\bsuitable for\b/i,
  /\bfor business-related\b/i,
  /\bfor non-business\b/i,
  /\bupload a\b/i,
  /\bembed your\b/i,
  /\bcreate and edit anything together\b/i,
  /\buse any of our\b/i,
  /\bremove the watermark\b/i,
];
const PLAN_CONTROL_PATTERNS = [/\bper seat\b/i, /\bseat\b/i, /\bshared across the team\b/i];

function loadSiteReadyFile(slug: ProductizedPricingSlug): SiteReadyPricingFile | null {
  try {
    const informationPath = path.join(
      process.cwd(),
      '..',
      'information',
      'data',
      'pricing-site-ready',
      SITE_READY_FILE_BY_SLUG[slug],
    );
    if (!fs.existsSync(informationPath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(informationPath, 'utf-8')) as SiteReadyPricingFile;
  } catch {
    return null;
  }
}

const SITE_READY_RECORDS: Record<ProductizedPricingSlug, SiteReadyPricingFile | null> = {
  'deepbrain-ai': loadSiteReadyFile('deepbrain-ai'),
  'd-id': loadSiteReadyFile('d-id'),
  'steve-ai': loadSiteReadyFile('steve-ai'),
};

function isProductizedPricingSlug(slug: string): slug is ProductizedPricingSlug {
  return PRODUCTIZED_PRICING_SLUG_SET.has(slug);
}

export function shouldUseProductizedPricingPage(slug: string): slug is ProductizedPricingSlug {
  return isProductizedPricingSlug(slug);
}

function cleanCapturedText(value: string | null | undefined): string {
  if (!value) return '';

  return value
    .replace(/`/g, '')
    .replace(/\r/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s*-\s*Evidence:.*?(?=(\d+\.\s)|$)/gi, ' ')
    .replace(/\s+\d+\.\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^null$/i, '')
    .trim();
}

function normalizeText(value: string): string {
  return cleanCapturedText(value)
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const item of items) {
    const cleaned = cleanCapturedText(item);
    const normalized = normalizeText(cleaned);
    if (!cleaned || !normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    deduped.push(cleaned);
  }

  return deduped;
}

function sanitizeBadge(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = cleanCapturedText(value).replace(/[^\p{L}\p{N}\s]/gu, '').trim();
  return cleaned || null;
}

function extractCreditOptions(value: string): string[] {
  const matches = cleanCapturedText(value).match(/\d+\s*credits?/gi) || [];
  return dedupeStrings(matches.map((match) => match.replace(/\s+/g, ' ').trim()));
}

function explodeBulletText(value: string): string[] {
  const cleaned = cleanCapturedText(value);
  if (!cleaned) return [];

  const promoMatches = cleaned.match(/Unlimited videos? for your first month!?/gi) || [];
  const parts = cleaned
    .replace(/\|/g, ' / ')
    .split(/\s{2,}/g)
    .flatMap((segment) => segment.split(/(?<=\))\s+(?=[A-Z$])/g))
    .map((segment) => cleanCapturedText(segment))
    .filter(Boolean);

  return dedupeStrings([...parts, ...promoMatches]);
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function isGenericCarryForward(text: string): boolean {
  return matchesAny(text, GENERIC_BULLET_PATTERNS);
}

function buildSiteReadyPrice(infoPlan: SiteReadyPricingPlan | null): PricingPlan['price'] {
  const rawAmount = cleanCapturedText(infoPlan?.pricing?.amount ?? '');
  const numericAmount = rawAmount ? Number.parseFloat(rawAmount.replace(/[^0-9.]/g, '')) : Number.NaN;
  const interval = cleanCapturedText(infoPlan?.pricing?.interval ?? '');

  if (!Number.isNaN(numericAmount)) {
    return {
      monthly: {
        amount: numericAmount,
        currency: 'USD',
        period: 'month',
      },
    };
  }

  if (/custom|let.?s talk/i.test(rawAmount) || /custom/i.test(interval)) {
    return 'Custom pricing';
  }

  return 'Custom pricing';
}

function getBillingStateIds(record: NormalizedPricingRecord, billingMode: 'monthly' | 'annual'): string[] {
  return record.billingStates
    .filter((state) => state.billingMode === billingMode)
    .map((state) => state.stateId);
}

function pickRecurringAmount(plan: NormalizedPricingPlan, stateIds: string[]): number | null {
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

function pickAmountByRole(plan: NormalizedPricingPlan, stateIds: string[], priceRole: string): number | null {
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

function resolveMonthlyRecurringAmount(record: NormalizedPricingRecord, plan: NormalizedPricingPlan): number | null {
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
  record: NormalizedPricingRecord,
  recordPlan: NormalizedPricingPlan | null,
  infoPlan: SiteReadyPricingPlan | null,
): PricingPlan['price'] {
  if (recordPlan && (recordPlan.planType === 'enterprise' || recordPlan.planType === 'custom')) {
    return 'Custom pricing';
  }

  if (recordPlan) {
    const monthly = resolveMonthlyRecurringAmount(record, recordPlan);
    const yearly = pickRecurringAmount(recordPlan, getBillingStateIds(record, 'annual'));

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

    if (recordPlan.displayedPrice) {
      return recordPlan.displayedPrice === 'Let’s Talk' ? 'Custom pricing' : recordPlan.displayedPrice;
    }
  }

  return buildSiteReadyPrice(infoPlan);
}

function buildUnitPriceNote(infoPlan: SiteReadyPricingPlan | null, recordPlan: NormalizedPricingPlan | null): string | undefined {
  const interval = cleanCapturedText(infoPlan?.pricing?.interval ?? '');
  if (interval.includes('/seat')) {
    return 'Per seat';
  }

  if (recordPlan?.unit === 'seat') {
    return 'Per seat';
  }

  return undefined;
}

function buildBillingNote(infoPlan: SiteReadyPricingPlan | null, recordPlan: NormalizedPricingPlan | null): string | undefined {
  const siteReadyNote = cleanCapturedText(infoPlan?.pricing?.billingNote ?? '');
  if (siteReadyNote) {
    return siteReadyNote;
  }

  if (recordPlan?.pricePoints.some((pricePoint) => pricePoint.stateId.includes('annual'))) {
    return 'Billed annually';
  }

  return undefined;
}

function classifyPlanContent(slug: ProductizedPricingSlug, infoPlan: SiteReadyPricingPlan | null): ClassifiedPlanContent {
  const rawBullets = (infoPlan?.bullets || []).flatMap((bullet) => explodeBulletText(bullet.text));
  const annualNotes: string[] = [];
  const trialNotes: string[] = [];
  const promoNotes: string[] = [];
  const usageCaveats: string[] = [];
  const licensingNotes: string[] = [];
  const qualifiers: string[] = [];
  const explanatoryCopy: string[] = [];
  const creditOptions: string[] = [];
  const usageOptions: string[] = [];
  const planControls: string[] = [];
  const addOnCards: string[] = [];
  const upgradeCards: string[] = [];
  const cardCandidates: string[] = [];

  for (const rawBullet of rawBullets) {
    const bullet = cleanCapturedText(rawBullet);
    if (!bullet || isGenericCarryForward(bullet)) continue;

    if (matchesAny(bullet, ANNUAL_NOTE_PATTERNS)) {
      annualNotes.push(bullet);
      continue;
    }

    if (matchesAny(bullet, PROMO_NOTE_PATTERNS)) {
      promoNotes.push(bullet);
      continue;
    }

    if ((infoPlan?.name || '').toLowerCase() === 'trial' || matchesAny(bullet, TRIAL_ONLY_PATTERNS)) {
      trialNotes.push(bullet);
    }

    if (matchesAny(bullet, LICENSING_PATTERNS)) {
      licensingNotes.push(bullet);
    }

    if (matchesAny(bullet, EXPLANATORY_PATTERNS) || bullet.length > 96) {
      explanatoryCopy.push(bullet);
    }

    if (matchesAny(bullet, PLAN_CONTROL_PATTERNS)) {
      planControls.push(bullet);
    }

    if (matchesAny(bullet, ADD_ON_PATTERNS)) {
      addOnCards.push(bullet);
    }

    if (matchesAny(bullet, UPGRADE_PATTERNS)) {
      upgradeCards.push(bullet);
    }

    const extractedCreditOptions = extractCreditOptions(bullet);
    if (extractedCreditOptions.length > 1) {
      creditOptions.push(...extractedCreditOptions);
      usageOptions.push(`${extractedCreditOptions.join(' / ')} (slider-dependent)`);
      usageCaveats.push(`${infoPlan?.name || 'Plan'} credit options vary by slider selection.`);
      continue;
    }

    if (/\b\d+\s*(min|mins|minutes?)\b/i.test(bullet) || /\bper month\b/i.test(bullet)) {
      usageCaveats.push(bullet);
    }

    if (!matchesAny(bullet, TRIAL_ONLY_PATTERNS) && !matchesAny(bullet, PROMO_NOTE_PATTERNS) && !matchesAny(bullet, ANNUAL_NOTE_PATTERNS)) {
      cardCandidates.push(bullet);
    }
  }

  const dedupedCandidates = dedupeStrings(cardCandidates);
  const prioritizedBullets: string[] = [];

  for (const pattern of PRIORITY_PATTERNS[slug]) {
    const match = dedupedCandidates.find((candidate) => pattern.test(candidate) && !prioritizedBullets.includes(candidate));
    if (match) {
      prioritizedBullets.push(match);
    }
  }

  for (const candidate of dedupedCandidates) {
    if (prioritizedBullets.length >= 6) break;
    if (prioritizedBullets.includes(candidate)) continue;
    prioritizedBullets.push(candidate);
  }

  const cardBullets = prioritizedBullets.slice(0, 6);
  const detailBullets = dedupeStrings(dedupedCandidates.filter((bullet) => !cardBullets.includes(bullet))).slice(0, 8);
  const pricingQualifier = cleanCapturedText(infoPlan?.pricing?.rawPriceText ?? '');
  const billingNote = cleanCapturedText(infoPlan?.pricing?.billingNote ?? '');
  const interval = cleanCapturedText(infoPlan?.pricing?.interval ?? '');

  if (billingNote) qualifiers.push(billingNote);
  if (interval && !['/m', '/month', 'custom'].includes(interval.toLowerCase())) {
    qualifiers.push(interval);
  }
  if (
    pricingQualifier &&
    /[a-zA-Z/]/.test(pricingQualifier) &&
    !/\$0 0|custom/i.test(pricingQualifier)
  ) {
    qualifiers.push(pricingQualifier);
  }

  return {
    cardBullets,
    annualNotes: dedupeStrings(annualNotes).slice(0, 4),
    trialNotes: dedupeStrings(trialNotes).slice(0, 4),
    promoNotes: dedupeStrings(promoNotes).slice(0, 4),
    usageCaveats: dedupeStrings(usageCaveats).slice(0, 6),
    licensingNotes: dedupeStrings(licensingNotes).slice(0, 6),
    qualifiers: dedupeStrings(qualifiers).slice(0, 4),
    explanatoryCopy: dedupeStrings(explanatoryCopy).slice(0, 5),
    creditOptions: dedupeStrings(creditOptions).slice(0, 6),
    usageOptions: dedupeStrings(usageOptions).slice(0, 4),
    planControls: dedupeStrings(planControls).slice(0, 4),
    addOnCards: dedupeStrings(addOnCards).slice(0, 4),
    upgradeCards: dedupeStrings(upgradeCards).slice(0, 4),
    detailBullets,
  };
}

function buildSnapshot(plans: PricingPlan[], slug: ProductizedPricingSlug) {
  const snapshotPlans = plans
    .filter((plan) => {
      const name = plan.name.toLowerCase();
      const isFree = name === 'free';
      const isCustom =
        typeof plan.price === 'string'
          ? plan.price.toLowerCase().includes('custom')
          : false;
      return !isFree && !isCustom;
    })
    .slice(0, 3)
    .map((plan) => ({
      name: plan.name,
      bullets: (plan.featureItems || []).slice(0, 3).map((item) => item.text),
    }))
    .filter((plan) => plan.bullets.length > 0);

  return {
    plans: snapshotPlans,
    note: PRODUCTIZED_EDITORIAL[slug].snapshotNote,
  };
}

function getPrimaryPaidPlan(pricingPlans: PricingPlan[]): PricingPlan | undefined {
  return pricingPlans.find((plan) => {
    if (!plan.price || typeof plan.price !== 'object' || !('monthly' in plan.price)) return false;
    if (typeof plan.price.monthly !== 'object' || plan.price.monthly === null) return false;
    return (plan.price.monthly.amount ?? 0) > 0;
  });
}

function getStartingPrice(slug: ProductizedPricingSlug, pricingPlans: PricingPlan[]): string {
  const firstPaidPlan = getPrimaryPaidPlan(pricingPlans);

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

  return `Starts at $${firstPaidPlan.price.monthly.amount}/mo`;
}

function getPricingStatusHint(slug: ProductizedPricingSlug): string {
  switch (slug) {
    case 'deepbrain-ai':
      return 'Official pricing reviewed. Cards keep the core plan ladder readable, while shared billing and workflow notes sit below.';
    case 'd-id':
      return 'Official pricing reviewed. Trial, annual billing, and slider-dependent pricing details are summarized below instead of leading the page.';
    case 'steve-ai':
      return 'Official pricing reviewed. Core plan differences stay on the cards, and the extra qualifiers are pushed into usage and detail sections.';
  }
}

function buildUsageGroups(planViews: ProductizedPlanView[], slug: ProductizedPricingSlug): ProductizedPricingUsageGroup[] {
  const allAnnual = dedupeStrings(
    planViews.flatMap((plan) => [
      ...plan.classified.annualNotes,
      ...plan.classified.qualifiers.filter((item) => /\b(yearly|annual|billed)\b/i.test(item)),
    ]),
  ).slice(0, 4);
  const allTrial = dedupeStrings(planViews.flatMap((plan) => plan.classified.trialNotes)).slice(0, 4);
  const allPromo = dedupeStrings(planViews.flatMap((plan) => plan.classified.promoNotes)).slice(0, 4);
  const allUsage = dedupeStrings(planViews.flatMap((plan) => [...plan.classified.usageCaveats, ...plan.classified.creditOptions])).slice(0, 4);
  const allLicensing = dedupeStrings(planViews.flatMap((plan) => plan.classified.licensingNotes)).slice(0, 4);

  const sections: ProductizedPricingUsageGroup[] = [];

  if (allAnnual.length > 0) {
    sections.push({ title: 'Annual billing', bullets: allAnnual });
  }
  if (slug === 'd-id' && allTrial.length > 0) {
    sections.push({ title: 'Trial access', bullets: allTrial });
  }
  if (allPromo.length > 0) {
    sections.push({ title: 'Promo notes', bullets: allPromo });
  }
  if (allUsage.length > 0) {
    sections.push({ title: 'Credits, minutes, and quota notes', bullets: allUsage });
  }
  if (allLicensing.length > 0) {
    sections.push({ title: 'Watermark and licensing', bullets: allLicensing });
  }

  return sections;
}

function buildPricingDetails(planViews: ProductizedPlanView[]): ProductizedPricingDetailSection | null {
  const detailPlans = planViews
    .map((planView) => {
      const sections: PlanDetailSection[] = [];
      const { classified, pricingPlan } = planView;

      if (classified.detailBullets.length > 0) {
        sections.push({
          title: 'More official plan details',
          items: classified.detailBullets,
        });
      }

      if (classified.creditOptions.length > 0 || classified.usageOptions.length > 0) {
        sections.push({
          title: 'Usage options',
          items: dedupeStrings([...classified.creditOptions, ...classified.usageOptions]),
        });
      }

      if (classified.explanatoryCopy.length > 0) {
        sections.push({
          title: 'Explanatory notes',
          items: classified.explanatoryCopy,
        });
      }

      if (classified.planControls.length > 0 || classified.qualifiers.length > 0) {
        sections.push({
          title: 'Billing and plan notes',
          items: dedupeStrings([...classified.planControls, ...classified.qualifiers]),
        });
      }

      if (classified.addOnCards.length > 0 || classified.upgradeCards.length > 0) {
        sections.push({
          title: 'Add-ons and upgrade notes',
          items: dedupeStrings([...classified.addOnCards, ...classified.upgradeCards]),
        });
      }

      if (sections.length === 0) {
        return null;
      }

      return {
        name: pricingPlan.name,
        summary: pricingPlan.description,
        sections,
      };
    })
    .filter(isDefined);

  if (detailPlans.length === 0) {
    return null;
  }

  return {
    title: 'More plan details',
    intro: 'These notes keep more of the official package wording available without turning the main cards into a raw data dump.',
    plans: detailPlans,
  };
}

function toPricingPlan(
  slug: ProductizedPricingSlug,
  record: NormalizedPricingRecord,
  recordPlan: NormalizedPricingPlan | null,
  infoPlan: SiteReadyPricingPlan | null,
  classified: ClassifiedPlanContent,
): PricingPlan {
  const normalizedName = infoPlan?.name || recordPlan?.name || 'Plan';
  const manualBadge = PLAN_BADGES[slug][normalizedName];
  const manualDescription = PLAN_DESCRIPTIONS[slug][normalizedName];
  const ctaText = cleanCapturedText(infoPlan?.cta ?? '');
  const badgeText =
    manualBadge ||
    sanitizeBadge(recordPlan?.badge) ||
    sanitizeBadge(recordPlan?.marketingBadgeText) ||
    undefined;

  return {
    name: normalizedName,
    price: buildPlanPrice(record, recordPlan, infoPlan),
    description: manualDescription,
    featureItems: classified.cardBullets.map((text) => ({ text })),
    ctaText: ctaText && ctaText.toLowerCase() !== 'null' ? ctaText : recordPlan?.planType === 'enterprise' ? 'Contact Sales' : 'Get started',
    ribbonText: badgeText,
    unitPriceNote: buildUnitPriceNote(infoPlan, recordPlan),
    billingNote: buildBillingNote(infoPlan, recordPlan),
    isPopular: Boolean(manualBadge),
  };
}

export function getProductizedPricingPageOverride(
  slug: string,
  tool: Tool,
): ProductizedPricingPageOverride | null {
  if (!isProductizedPricingSlug(slug)) {
    return null;
  }

  const record = PRODUCTIZED_RECORDS[slug];
  const siteReady = SITE_READY_RECORDS[slug];

  const orderedPlanViews: ProductizedPlanView[] = PLAN_ORDER[slug]
    .map((planName) => {
      const infoPlan = siteReady?.plans?.find((plan) => plan.name === planName) || null;
      const recordPlan = record.plans.find((plan) => plan.name === planName) || null;

      if (!infoPlan && !recordPlan) {
        return null;
      }

      const classified = classifyPlanContent(slug, infoPlan);
      return {
        infoPlan,
        recordPlan,
        classified,
        pricingPlan: toPricingPlan(slug, record, recordPlan, infoPlan, classified),
      };
    })
    .filter((plan): plan is ProductizedPlanView => Boolean(plan));

  const hiddenInfoPlanViews: ProductizedPlanView[] = (siteReady?.plans || [])
    .filter((plan) => !PLAN_ORDER[slug].includes(plan.name))
    .map((plan) => {
      const recordPlan = record.plans.find((candidate) => candidate.name === plan.name) || null;
      const classified = classifyPlanContent(slug, plan);
      return {
        infoPlan: plan,
        recordPlan,
        classified,
        pricingPlan: toPricingPlan(slug, record, recordPlan, plan, classified),
      };
    });

  const pricingPlans = orderedPlanViews.map((plan) => plan.pricingPlan);
  const usageGroups = buildUsageGroups([...orderedPlanViews, ...hiddenInfoPlanViews], slug);
  const pricingDetails = buildPricingDetails(orderedPlanViews);

  return {
    pricingPlans,
    pricingVerification: record.verification === 'verified' ? 'verified' : 'trusted',
    startingPrice: getStartingPrice(slug, pricingPlans),
    pricingStatusHint: getPricingStatusHint(slug),
    hasFreeTrial: slug === 'd-id' ? true : record.hasFreeTrial ?? tool.has_free_trial,
    pricingSnapshot: buildSnapshot(pricingPlans, slug),
    creditUsage: {
      title: PRODUCTIZED_EDITORIAL[slug].usageTitle,
      bullets: PRODUCTIZED_EDITORIAL[slug].usageBullets,
    },
    usageNotes: {
      bullets: PRODUCTIZED_EDITORIAL[slug].usageBullets,
      tip: PRODUCTIZED_EDITORIAL[slug].usageTip,
    },
    usageGroups,
    pricingDetails,
    verdict: PRODUCTIZED_EDITORIAL[slug].verdict,
  };
}
