export type PricingOrigin =
  | 'affiliate-legacy-allowed'
  | 'legacy-hidden'
  | 'newly-captured';

export type PricingVerification =
  | 'verified'
  | 'partial'
  | 'trusted'
  | 'unverified';

export type PricingStatus =
  | 'free'
  | 'paid'
  | 'enterprise'
  | 'custom'
  | 'pricing-not-verified';

export type PricingSourceType = 'pricing' | 'faq' | 'help' | 'terms' | 'homepage' | 'api-pricing';
export type PricingCaptureLayer = 'fetch-cheerio' | 'playwright';
export type ExactPriceUsage = 'display' | 'comparison' | 'structured-data' | 'scoring';
export type CoarseDisplayText = 'Paid plans available' | 'Custom pricing' | 'Pricing not verified';

export interface RawPricingSnippet {
  kind: 'plan-card' | 'billing-note' | 'faq-item' | 'toggle' | 'cta' | 'generic';
  heading?: string;
  text: string;
}

export interface RawPricingEvidence {
  sourceType: PricingSourceType;
  sourceUrl: string;
  captureLayer: PricingCaptureLayer;
  capturedAt: string;
  snippet: string;
}

export interface RawPricingFact {
  kind:
    | 'free-plan'
    | 'free-trial'
    | 'self-serve-paid'
    | 'enterprise'
    | 'interactive-pricing'
    | 'price-point'
    | 'billing-note';
  planName?: string;
  amount?: number | null;
  currency?: string | null;
  cadence?: 'month' | 'year' | null;
  unit?: 'account' | 'seat' | 'editor' | 'workspace' | 'unknown';
  valueText: string;
  evidence: RawPricingEvidence[];
}

export interface RawPricingPageCapture {
  sourceType: PricingSourceType;
  sourceUrl: string;
  captureLayer: PricingCaptureLayer;
  usedCache: boolean;
  cacheMode?: 'static' | 'dynamic' | 'unknown';
  capturedAt: string;
  textLength: number;
  fallbackReasons: string[];
  snippets: RawPricingSnippet[];
}

export interface RawPricingCaptureFile {
  toolSlug: string;
  capturedAt: string;
  pages: RawPricingPageCapture[];
  facts: RawPricingFact[];
  sourceUrls: string[];
  notes: string[];
}

export interface NormalizedPricingPlan {
  name: string;
  headlinePriceText: string | null;
  billingQualifier: string | null;
  unit: 'account' | 'seat' | 'editor' | 'workspace' | 'unknown';
  planType: 'free' | 'trial' | 'paid' | 'enterprise' | 'custom' | 'unknown';
  sourceUrls: string[];
  evidence: string[];
}

export interface VerifiedStartingPrice {
  amount: number | null;
  currency: string | null;
  cadence: 'month' | 'year' | null;
  displayText: string | null;
  safeToShow: boolean;
  reason: string;
}

export interface PricingGovernance {
  origin: PricingOrigin;
  safeToShow: boolean;
  reviewRequired: boolean;
}

export interface NormalizedPricingRecord {
  toolSlug: string;
  capturedAt: string;
  sourceUrls: string[];
  governance: PricingGovernance;
  verification: PricingVerification;
  status: PricingStatus;
  coarseDisplayText: CoarseDisplayText;
  hasFreePlan: boolean | null;
  hasFreeTrial: boolean | null;
  hasSelfServePaid: boolean | null;
  hasEnterprise: boolean | null;
  hasInteractivePricing: boolean;
  interactiveReasons: string[];
  plans: NormalizedPricingPlan[];
  verifiedStartingPrice: VerifiedStartingPrice;
  notes: string[];
}

export interface PricingResolverPreview {
  displayText: string;
  coarseDisplayText: CoarseDisplayText;
  exactPriceAllowed: Record<ExactPriceUsage, boolean>;
}

export function isValidOriginVerificationCombo(
  origin: PricingOrigin,
  verification: PricingVerification,
): boolean {
  if (origin === 'newly-captured') {
    return verification === 'verified' || verification === 'partial' || verification === 'unverified';
  }
  if (origin === 'affiliate-legacy-allowed') {
    return verification === 'trusted';
  }
  return verification === 'trusted' || verification === 'unverified';
}

export function resolveCoarseDisplayText(record: Pick<
  NormalizedPricingRecord,
  'status' | 'hasSelfServePaid' | 'hasEnterprise' | 'verification'
>): CoarseDisplayText {
  if (record.hasEnterprise === true && record.hasSelfServePaid !== true) {
    return 'Custom pricing';
  }
  if (record.hasSelfServePaid === true) {
    return 'Paid plans available';
  }
  return 'Pricing not verified';
}

export function canUseExactPrice(
  record: Pick<NormalizedPricingRecord, 'governance' | 'verification' | 'verifiedStartingPrice'>,
  usage: ExactPriceUsage,
): boolean {
  const newlyCapturedAllowed =
    record.governance.origin === 'newly-captured' &&
    record.verification === 'verified' &&
    record.governance.safeToShow === true &&
    record.verifiedStartingPrice.safeToShow === true &&
    Boolean(record.verifiedStartingPrice.displayText);

  if (usage === 'display') {
    const affiliateLegacyAllowed =
      record.governance.origin === 'affiliate-legacy-allowed' &&
      record.verification === 'trusted' &&
      record.governance.safeToShow === true &&
      record.verifiedStartingPrice.safeToShow === true &&
      Boolean(record.verifiedStartingPrice.displayText);
    return newlyCapturedAllowed || affiliateLegacyAllowed;
  }

  return newlyCapturedAllowed;
}

export function buildResolverPreview(record: NormalizedPricingRecord): PricingResolverPreview {
  const coarseDisplayText = resolveCoarseDisplayText(record);
  const exactPriceAllowed: Record<ExactPriceUsage, boolean> = {
    display: canUseExactPrice(record, 'display'),
    comparison: canUseExactPrice(record, 'comparison'),
    'structured-data': canUseExactPrice(record, 'structured-data'),
    scoring: canUseExactPrice(record, 'scoring'),
  };

  return {
    displayText:
      exactPriceAllowed.display && record.verifiedStartingPrice.displayText
        ? record.verifiedStartingPrice.displayText
        : coarseDisplayText,
    coarseDisplayText,
    exactPriceAllowed,
  };
}
