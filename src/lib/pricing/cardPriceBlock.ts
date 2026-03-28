import type { Tool } from '@/types/tool';
import type {
  CardPriceBlock,
  CardPriceConfidence,
  CardPriceHintKind,
  CardPriceSourceKind,
  CardPriceState,
} from '@/types/cardPriceBlock';
import { getToolCardPricingDisplay } from '@/lib/pricing/cardDisplay';
import { getToolPricingSummary } from '@/lib/pricing/display';

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

const INTERACTIVE_LIVE_PAGE_HINT = 'Interactive pricing on live page';
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
const BILLING_VARIANCE_PATTERNS = ['annual', 'annually', 'yearly', 'billed', 'discount'];
const USAGE_VARIANCE_PATTERNS = [
  'varies by plan',
  'varies',
  'per seat',
  'seat-based',
  'per second',
  'per minute',
  'api',
  'credits',
  'minutes',
  'usage',
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
      ? 'Free plan available'
      : priceState === 'custom'
        ? 'Custom pricing'
        : priceState === 'unverified'
          ? 'Pricing not verified'
          : 'Paid plans available');

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
      helper: 'Billed annually',
      hintKind: 'billing-varies',
    };
  }

  if (remainder.includes('billed yearly')) {
    return {
      primary,
      helper: 'Billed yearly',
      hintKind: 'billing-varies',
    };
  }

  return {
    primary,
    helper: 'Billing varies by plan or annual selection',
    hintKind: 'billing-varies',
  };
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
  return NORMALIZED_CARD_PRICE_SLUGS.has(tool.slug) ? 'normalized' : 'legacy-summary';
}

export function getHomeCardPriceBlock(tool: Tool): CardPriceBlock {
  const display = getToolCardPricingDisplay(tool);
  const sourceKind = getHomePriceSourceKind(tool);

  if (display.displayText === 'Custom pricing') {
    return buildBlock({
      priceState: 'custom',
      priceHelper: null,
      priceSourceKind: sourceKind,
      priceConfidence: display.source === 'legacy-accepted' ? getLegacyConfidence(tool) : 'trusted',
      priceHintKind: 'none',
    });
  }

  if (display.displayText === 'Pricing not verified') {
    return buildBlock({
      priceState: 'unverified',
      priceHelper: null,
      priceSourceKind: sourceKind,
      priceConfidence: 'unverified',
      priceHintKind: 'none',
    });
  }

  if (display.displayText === 'Paid plans available') {
    return buildBlock({
      priceState: 'paid-coarse',
      priceHelper: null,
      priceSourceKind: sourceKind,
      priceConfidence: display.source === 'legacy-accepted' ? getLegacyConfidence(tool) : 'trusted',
      priceHintKind: 'none',
    });
  }

  if (display.displayText === 'Free') {
    return buildBlock({
      priceState: 'free',
      priceHelper: null,
      priceSourceKind: sourceKind,
      priceConfidence: display.source === 'legacy-accepted' ? getLegacyConfidence(tool) : 'trusted',
      priceHintKind: 'none',
    });
  }

  const exact = extractExactStartPrice(display.displayText);
  if (exact.primary) {
    const helper =
      display.hintText === INTERACTIVE_LIVE_PAGE_HINT ? INTERACTIVE_LIVE_PAGE_HINT : exact.helper;
    const hintKind: CardPriceHintKind =
      display.hintText === INTERACTIVE_LIVE_PAGE_HINT ? 'interactive-live-page' : exact.hintKind;

    return buildBlock({
      priceState: 'paid-exact',
      pricePrimary: exact.primary,
      priceHelper: helper,
      priceSourceKind: sourceKind,
      priceConfidence: display.source === 'legacy-accepted' ? getLegacyConfidence(tool) : 'verified',
      priceHintKind: hintKind,
    });
  }

  return buildBlock({
    priceState: 'paid-coarse',
    priceHelper: null,
    priceSourceKind: sourceKind,
    priceConfidence: display.source === 'legacy-accepted' ? getLegacyConfidence(tool) : 'trusted',
    priceHintKind: 'none',
  });
}

function getFeaturePriceHelper(seed: string, priceState: CardPriceState): {
  helper: string | null;
  hintKind: CardPriceHintKind;
} {
  if (priceState !== 'paid-coarse') {
    return {
      helper: null,
      hintKind: 'none',
    };
  }

  const lower = seed.toLowerCase();

  if (includesAny(lower, BILLING_VARIANCE_PATTERNS)) {
    return {
      helper: 'Billing varies by plan or annual selection',
      hintKind: 'billing-varies',
    };
  }

  if (includesAny(lower, USAGE_VARIANCE_PATTERNS)) {
    return {
      helper: 'Pricing varies by plan or usage',
      hintKind: 'editorial-summary',
    };
  }

  return {
    helper: null,
    hintKind: 'none',
  };
}

export function getFeatureSeedCardPriceBlock(pricingSeed?: string | null): CardPriceBlock {
  const trimmedSeed = pricingSeed?.trim() ?? '';
  if (!trimmedSeed) {
    return buildBlock({
      priceState: 'unverified',
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
      priceHelper: null,
      priceSourceKind: 'feature-seed',
      priceConfidence: 'editorial-seed',
      priceHintKind: 'none',
    });
  }

  if (lower === 'free' || includesAny(lower, FREE_PRICE_PATTERNS)) {
    return buildBlock({
      priceState: 'free',
      priceHelper: null,
      priceSourceKind: 'feature-seed',
      priceConfidence: 'editorial-seed',
      priceHintKind: 'none',
    });
  }

  const hasDollarAmount = /\$\d/.test(trimmedSeed);
  const hasPaidSignal = hasDollarAmount || includesAny(lower, PAID_PRICE_PATTERNS);

  if (hasPaidSignal) {
    const featureHint = getFeaturePriceHelper(trimmedSeed, 'paid-coarse');
    return buildBlock({
      priceState: 'paid-coarse',
      priceHelper: featureHint.helper,
      priceSourceKind: 'feature-seed',
      priceConfidence: 'editorial-seed',
      priceHintKind: featureHint.hintKind,
    });
  }

  return buildBlock({
    priceState: 'unverified',
    priceHelper: null,
    priceSourceKind: 'feature-seed',
    priceConfidence: 'unverified',
    priceHintKind: 'none',
  });
}
