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
export type PricingCaptureProvenance = 'live' | 'cache';
export type ExactPriceUsage = 'display' | 'comparison' | 'structured-data' | 'scoring';
export type CoarseDisplayText = 'Paid plans available' | 'Custom pricing' | 'Pricing not verified';
export type PricingBillingMode = 'monthly' | 'annual' | 'one-time' | 'custom' | 'mixed' | 'unknown';
export type PricingCadence = 'month' | 'year' | 'one-time' | null;
export type PricingUnit = 'account' | 'seat' | 'editor' | 'workspace' | 'credit-pack' | 'usage' | 'unknown';
export type PricingStateTriggerType = 'default' | 'toggle' | 'tab' | 'accordion' | 'modal';
export type RawPricingCardKind = 'core-plan' | 'enterprise-card' | 'upgrade-offer' | 'add-on' | 'unknown';
export type RawPricingPriceRole =
  | 'core-recurring'
  | 'yearly-total'
  | 'promo'
  | 'list'
  | 'strike-through'
  | 'add-on'
  | 'upgrade'
  | 'custom'
  | 'unknown';
export type RawPricingVisibility = 'default' | 'state-only';
export type PricingStructuredPlanType =
  | 'free'
  | 'paid'
  | 'enterprise'
  | 'custom'
  | 'trial'
  | 'promo'
  | 'add-on'
  | 'upgrade'
  | 'unknown';
export type RawPricingControlType =
  | 'seat-stepper'
  | 'credit-switch'
  | 'link'
  | 'add-on-selector'
  | 'billing-toggle'
  | 'unknown';

export interface RawPricingPlanControl {
  controlType: RawPricingControlType;
  label: string;
  valueText: string | null;
  href: string | null;
  options: string[];
}

export interface RawPricingCtaMeta {
  text: string | null;
  href: string | null;
  intent: 'start-trial' | 'get-started' | 'contact-sales' | 'upgrade' | 'learn-more' | 'unknown';
}

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
  cadence?: PricingCadence;
  unit?: PricingUnit;
  valueText: string;
  evidence: RawPricingEvidence[];
}

export interface RawPricingState {
  stateId: string;
  label: string;
  billingMode: PricingBillingMode;
  isDefaultVisible: boolean;
  triggerType: PricingStateTriggerType;
  triggerLabel: string | null;
  sourcePage: PricingSourceType;
  notes?: string[];
}

export interface RawPricingBulletSection {
  title: string | null;
  items: string[];
}

export type PricingMissingField =
  | 'planName'
  | 'planKind'
  | 'cta'
  | 'displayedPrice'
  | 'qualifier'
  | 'provenance'
  | 'defaultStateCoverage'
  | 'sectionHeadings'
  | 'bulletSections'
  | 'coreBullets'
  | 'priceBlocks';

export interface PricingCardProvenance {
  captureLayer: PricingCaptureLayer;
  provenance: PricingCaptureProvenance;
  cacheMode: 'static' | 'dynamic' | 'unknown' | null;
  capturedAt: string;
  sourceType: PricingSourceType;
  sourceUrl: string;
}

export interface RawPricingPriceBlock {
  rawText: string;
  amountText: string | null;
  amount: number | null;
  currency: string | null;
  cadence: PricingCadence;
  unit: PricingUnit;
  priceRole: RawPricingPriceRole;
  billingQualifier: string | null;
  visibility: RawPricingVisibility;
  safeDisplayCandidate: boolean;
}

export interface RawPricingCard {
  cardId: string;
  stateId: string;
  cardKind: RawPricingCardKind;
  isVisible: boolean;
  isDefaultVisible: boolean;
  selector: string;
  htmlFragment: string;
  textFragment: string;
  rawPlanText: string;
  planNameRaw: string | null;
  planNameNormalized: string | null;
  planName: string | null;
  planTypeHint: PricingStructuredPlanType;
  subtitle: string | null;
  cardDescription: string | null;
  badge: string | null;
  ctaText: string | null;
  ctaHref: string | null;
  ctaMeta: RawPricingCtaMeta;
  displayedPrice: string | null;
  displayedQualifier: string | null;
  eligibleForPublicStartPrice: boolean;
  sectionHeadings: string[];
  bulletSections: RawPricingBulletSection[];
  pricingQualifiers: string[];
  promoNotes: string[];
  trialNotes: string[];
  creditOptions: string[];
  usageOptions: string[];
  explanatoryCopy: string[];
  planControls: RawPricingPlanControl[];
  upgradeAddOnInfo: string[];
  priceBlocks: RawPricingPriceBlock[];
  missingFields: PricingMissingField[];
  provenance: PricingCardProvenance;
  sourceType: PricingSourceType;
  sourceUrl: string;
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
  stateIds: string[];
  cardIds: string[];
  snippets?: RawPricingSnippet[];
}

export interface RawPricingCaptureFile {
  toolSlug: string;
  capturedAt: string;
  pages: RawPricingPageCapture[];
  states: RawPricingState[];
  cards: RawPricingCard[];
  facts: RawPricingFact[];
  sourceUrls: string[];
  notes: string[];
}

export interface NormalizedPlanBullet {
  sectionTitle: string | null;
  text: string;
  kind: 'feature' | 'limit' | 'quota' | 'support' | 'unknown';
}

export interface NormalizedPlanPricePoint {
  stateId: string;
  amount: number | null;
  currency: string | null;
  cadence: PricingCadence;
  unit: PricingUnit;
  priceRole: RawPricingPriceRole;
  billingQualifier: string | null;
  isDefaultVisible: boolean;
  isCorePlanPrice: boolean;
  eligibleForRecommendedDisplay: boolean;
  blockedReason: string | null;
  rawText: string;
  displayText: string | null;
}

export interface NormalizedPricingBulletSection {
  title: string | null;
  bullets: string[];
}

export interface NormalizedPricingBillingVariant {
  stateId: string;
  stateLabel: string;
  billingMode: PricingBillingMode;
  isDefaultVisible: boolean;
  displayedPrice: string | null;
  displayedQualifier: string | null;
  headlinePriceText: string | null;
  cardDescription: string | null;
  subtitle: string | null;
  qualifiers: string[];
  promoNotes: string[];
  trialNotes: string[];
  creditOptions: string[];
  usageOptions: string[];
  planControls: RawPricingPlanControl[];
  explanatoryCopy: string[];
  rawPlanText: string;
}

export interface NormalizedPricingDetailCard {
  cardId: string;
  stateId: string;
  stateLabel: string;
  billingMode: PricingBillingMode;
  detailType: 'add-on' | 'upgrade' | 'enterprise-extension' | 'unknown';
  title: string;
  displayedPrice: string | null;
  displayedQualifier: string | null;
  rawPlanText: string;
  qualifiers: string[];
  promoNotes: string[];
  trialNotes: string[];
  creditOptions: string[];
  usageOptions: string[];
  planControls: RawPricingPlanControl[];
  bulletSections: NormalizedPricingBulletSection[];
  ctaMeta: RawPricingCtaMeta;
}

export interface NormalizedPricingPlanSourceMeta {
  stateId: string;
  sourceType: PricingSourceType;
  sourceUrl: string;
  captureLayer: PricingCaptureLayer;
  provenance: PricingCaptureProvenance;
  cacheMode: 'static' | 'dynamic' | 'unknown' | null;
  capturedAt: string;
}

export interface NormalizedPricingPlan {
  planId: string;
  name: string;
  planNameRaw: string | null;
  planNameNormalized: string;
  badge: string | null;
  subtitle: string | null;
  cardDescription: string | null;
  cta: {
    text: string | null;
    href: string | null;
  };
  ctaMeta: RawPricingCtaMeta;
  displayedPrice: string | null;
  displayedQualifier: string | null;
  eligibleForPublicStartPrice: boolean;
  headlinePriceText: string | null;
  billingQualifier: string | null;
  unit: PricingUnit;
  planType: PricingStructuredPlanType;
  stateAvailability: string[];
  billingVariants: NormalizedPricingBillingVariant[];
  pricePoints: NormalizedPlanPricePoint[];
  bulletSections: NormalizedPricingBulletSection[];
  bullets: NormalizedPlanBullet[];
  coreBullets: NormalizedPlanBullet[];
  rawBullets: string[];
  pricingQualifiers: string[];
  qualifiers: string[];
  promoNotes: string[];
  trialNotes: string[];
  creditOptions: string[];
  usageOptions: string[];
  explanatoryCopy: string[];
  planControls: RawPricingPlanControl[];
  marketingBadgeText: string | null;
  addOnCards: NormalizedPricingDetailCard[];
  upgradeCards: NormalizedPricingDetailCard[];
  upgradeAddOnInfo: string[];
  missingFields: PricingMissingField[];
  cardSnapshots: Array<{
    cardId: string;
    stateId: string;
    isDefaultVisible: boolean;
    cardKind: RawPricingCardKind;
    displayedPrice: string | null;
    displayedQualifier: string | null;
    eligibleForPublicStartPrice: boolean;
    selector: string;
    provenance: PricingCardProvenance;
  }>;
  sourceCardIds: string[];
  rawPlanText: string[];
  sourceMeta: NormalizedPricingPlanSourceMeta[];
  captureMeta: {
    defaultVisibleStateIds: string[];
    hasDefaultVisibleCardCoverage: boolean;
    cacheFallbackStateIds: string[];
  };
  notes: string[];
  sourceUrls: string[];
  evidence: string[];
}

export interface RecommendedDisplayPrice {
  amount: number | null;
  currency: string | null;
  cadence: PricingCadence;
  unit: PricingUnit;
  displayText: string | null;
  safeToShow: boolean;
  reason: string;
  planId: string | null;
  planName: string | null;
  stateId: string | null;
  priceRole: RawPricingPriceRole | null;
  comparisonEligible: boolean;
  structuredDataEligible: boolean;
  scoringEligible: boolean;
}

export interface VerifiedStartingPrice {
  amount: number | null;
  currency: string | null;
  cadence: PricingCadence;
  displayText: string | null;
  safeToShow: boolean;
  reason: string;
}

export interface PricingGovernance {
  origin: PricingOrigin;
  safeToShow: boolean;
  reviewRequired: boolean;
}

export interface NormalizedPricingBillingState {
  stateId: string;
  label: string;
  billingMode: PricingBillingMode;
  isDefaultVisible: boolean;
  sourcePage: PricingSourceType;
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
  billingStates: NormalizedPricingBillingState[];
  captureMeta: {
    pageCount: number;
    cardCount: number;
    factCount: number;
    defaultVisibleStateIds: string[];
    pageSources: Array<{
      sourceType: PricingSourceType;
      sourceUrl: string;
      captureLayer: PricingCaptureLayer;
      usedCache: boolean;
      cacheMode?: 'static' | 'dynamic' | 'unknown';
      capturedAt: string;
    }>;
  };
  plans: NormalizedPricingPlan[];
  recommendedDisplayPrice: RecommendedDisplayPrice | null;
  verifiedStartingPrice: VerifiedStartingPrice;
  notes: string[];
}

export interface PricingResolverPreview {
  displayText: string;
  coarseDisplayText: CoarseDisplayText;
  exactPriceAllowed: Record<ExactPriceUsage, boolean>;
}

export interface PricingAuditRecord {
  toolSlug: string;
  capturedAt: string;
  validationIssues: string[];
  capturedStates: NormalizedPricingBillingState[];
  planCardSummary: Array<{
    planId: string;
    name: string;
    planType: NormalizedPricingPlan['planType'];
    stateAvailability: string[];
    pricePointCount: number;
    bulletCount: number;
  }>;
  recommendedDisplayPrice: RecommendedDisplayPrice | null;
  resolverPreview: PricingResolverPreview;
  exactPriceAllowedForDisplay: boolean;
  comparisonEligible: boolean;
  structuredDataEligible: boolean;
  detailsOnlyPricePoints: Array<{
    planId: string;
    planName: string;
    stateId: string;
    displayText: string | null;
    priceRole: RawPricingPriceRole;
    reason: string | null;
  }>;
  blockedPricePoints: Array<{
    planId: string;
    planName: string;
    stateId: string;
    displayText: string | null;
    priceRole: RawPricingPriceRole;
    blockedReason: string | null;
  }>;
  manualReviewChecklist: string[];
  finalDisplayText: string;
  safeToShow: boolean;
  coarseDisplayText: CoarseDisplayText;
}

export interface PricingReviewSummaryRecord {
  toolSlug: string;
  capturedAt: string;
  billingStates: Array<{
    stateId: string;
    label: string;
    billingMode: PricingBillingMode;
    isDefaultVisible: boolean;
  }>;
  defaultVisibleStateIds: string[];
  recommendedPublicDisplay: string;
  publicStartPriceCandidate: {
    display: string | null;
    planName: string | null;
    stateId: string | null;
    provenance: string | null;
    allowedForExactDisplay: boolean;
  };
  monthlyPrices: Array<{
    planName: string;
    display: string;
    eligibleForPublicStartPrice: boolean;
  }>;
  annualPrices: Array<{
    planName: string;
    display: string;
    eligibleForPublicStartPrice: boolean;
  }>;
  blockedPrices: Array<{
    reason: string;
    items: Array<{
      planName: string;
      stateId: string;
      display: string | null;
      priceRole: RawPricingPriceRole;
      provenance: string | null;
    }>;
  }>;
  planCards: Array<{
    planName: string;
    planKind: NormalizedPricingPlan['planType'];
    displayedPrice: string | null;
    qualifier: string | null;
    eligibleForPublicStartPrice: boolean;
    badge: string | null;
    cta: string | null;
    cardProvenance: Array<{
      stateId: string;
      isDefaultVisible: boolean;
      provenance: string;
      displayedPrice: string | null;
      qualifier: string | null;
    }>;
    mainBullets: string[];
    pricingQualifiers: string[];
    upgradeAddOnInfo: string[];
    missingFields: PricingMissingField[];
  }>;
  reviewWarnings: string[];
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

function getDisplayCandidate(
  record: Pick<NormalizedPricingRecord, 'recommendedDisplayPrice' | 'verifiedStartingPrice'>,
): Pick<RecommendedDisplayPrice, 'displayText' | 'safeToShow' | 'comparisonEligible' | 'structuredDataEligible' | 'scoringEligible'> &
  Pick<VerifiedStartingPrice, 'displayText' | 'safeToShow'> {
  if (record.recommendedDisplayPrice) {
    return record.recommendedDisplayPrice;
  }

  return {
    ...record.verifiedStartingPrice,
    comparisonEligible: record.verifiedStartingPrice.safeToShow,
    structuredDataEligible: record.verifiedStartingPrice.safeToShow,
    scoringEligible: record.verifiedStartingPrice.safeToShow,
  };
}

export function canUseExactPrice(
  record: Pick<NormalizedPricingRecord, 'governance' | 'verification' | 'verifiedStartingPrice' | 'recommendedDisplayPrice'>,
  usage: ExactPriceUsage,
): boolean {
  const candidate = getDisplayCandidate(record);
  const newlyCapturedAllowed =
    record.governance.origin === 'newly-captured' &&
    record.verification === 'verified' &&
    record.governance.safeToShow === true &&
    candidate.safeToShow === true &&
    Boolean(candidate.displayText);

  if (usage === 'display') {
    const affiliateLegacyAllowed =
      record.governance.origin === 'affiliate-legacy-allowed' &&
      record.verification === 'trusted' &&
      record.governance.safeToShow === true &&
      candidate.safeToShow === true &&
      Boolean(candidate.displayText);
    return newlyCapturedAllowed || affiliateLegacyAllowed;
  }

  if (!newlyCapturedAllowed) {
    return false;
  }

  if (usage === 'comparison') {
    return candidate.comparisonEligible === true;
  }
  if (usage === 'structured-data') {
    return candidate.structuredDataEligible === true;
  }
  return candidate.scoringEligible === true;
}

export function buildResolverPreview(record: NormalizedPricingRecord): PricingResolverPreview {
  const coarseDisplayText = resolveCoarseDisplayText(record);
  const candidate = getDisplayCandidate(record);
  const exactPriceAllowed: Record<ExactPriceUsage, boolean> = {
    display: canUseExactPrice(record, 'display'),
    comparison: canUseExactPrice(record, 'comparison'),
    'structured-data': canUseExactPrice(record, 'structured-data'),
    scoring: canUseExactPrice(record, 'scoring'),
  };

  return {
    displayText:
      exactPriceAllowed.display && candidate.displayText
        ? candidate.displayText
        : coarseDisplayText,
    coarseDisplayText,
    exactPriceAllowed,
  };
}
