/**
 * Product intelligence schema for official-source capability research.
 *
 * This layer is intentionally separate from pricing/evidence/editorial outputs.
 * It stores structured product facts, bounded inferences, and unresolved gaps
 * that can later feed tool, pricing, alternatives, vs, and feature pages.
 */

export const CLAIM_TYPES = [
  'confirmed_fact',
  'structured_inference',
  'unclear',
] as const;

export type ClaimType = (typeof CLAIM_TYPES)[number];

export const CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const SOURCE_TYPES = [
  'docs',
  'api_docs',
  'feature_page',
  'product_page',
  'help_center',
  'faq',
  'pricing',
  'security',
  'legal',
  'blog',
  'changelog',
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const SUPPORT_TYPES = [
  'supported',
  'plan_gated',
  'enterprise_only',
  'api_available',
  'provider_option',
  'selectable_model',
  'proprietary',
  'addon_required',
  'beta',
  'not_supported',
  'unclear',
] as const;

export type SupportType = (typeof SUPPORT_TYPES)[number];

export const CAPABILITY_CATEGORIES = [
  'model_support',
  'core_capability',
  'unique_value',
  'differentiation',
  'commercial',
  'collaboration',
  'developer',
  'limitation',
  'use_case',
  'user_fit',
] as const;

export type CapabilityCategory = (typeof CAPABILITY_CATEGORIES)[number];

export type ProductIntelligenceSourceBlock = {
  id: string;
  sourceType: SourceType;
  title: string;
  url: string;
  priorityRank: number;
  coverage: string[];
  notes?: string;
};

export type ProductIntelligenceEvidenceItemBase = {
  rawLabel: string;
  normalizedLabel: string;
  value: string;
  supportType: SupportType;
  claimType: ClaimType;
  evidenceText: string;
  sourceUrl: string;
  confidence: ConfidenceLevel;
  scope?: string;
};

export type CapabilityFact = ProductIntelligenceEvidenceItemBase & {
  category: 'model_support' | 'core_capability' | 'commercial' | 'limitation';
};

export type ModelSupportItem = {
  rawName: string;
  normalizedName: string;
  provider: string;
  supportType: SupportType;
  scope: string;
  claimType: ClaimType;
  evidenceText: string;
  sourceUrl: string;
  confidence: ConfidenceLevel;
};

export type UniqueValueItem = {
  theme: string;
  summary: string;
  claimType: ClaimType;
  evidenceText: string;
  sourceUrl: string;
  confidence: ConfidenceLevel;
};

export type DifferentiationItem = {
  dimension: string;
  positioning: string;
  claimType: ClaimType;
  evidenceText: string;
  sourceUrl: string;
  confidence: ConfidenceLevel;
};

export type CollaborationItem = ProductIntelligenceEvidenceItemBase & {
  category: 'collaboration';
};

export type DeveloperItem = ProductIntelligenceEvidenceItemBase & {
  category: 'developer';
};

export type CommercialItem = ProductIntelligenceEvidenceItemBase & {
  category: 'commercial';
};

export type LimitationItem = ProductIntelligenceEvidenceItemBase & {
  category: 'limitation';
};

export type UseCaseItem = {
  useCase: string;
  audience: string;
  fit: string;
  claimType: ClaimType;
  evidenceText: string;
  sourceUrl: string;
  confidence: ConfidenceLevel;
};

export type UserFitItem = {
  segment: string;
  fit: string;
  rationale: string;
  claimType: ClaimType;
  evidenceText: string;
  sourceUrl: string;
  confidence: ConfidenceLevel;
};

export type RawEvidenceBlock = {
  sourceUrl: string;
  sourceType: SourceType;
  topic: string;
  evidenceText: string;
  claimType: ClaimType;
  confidence: ConfidenceLevel;
};

export type UnresolvedQuestion = {
  question: string;
  reason: string;
  recommendedSourceTypes: SourceType[];
  status: 'open' | 'needs_manual_verification';
};

export type ProductIntelligenceRecord = {
  toolSlug: string;
  metadata: {
    collectedAt: string;
    sampleTrack: string;
    officialSourceCount: number;
    sourceTypes: SourceType[];
  };
  sourceBlocks: ProductIntelligenceSourceBlock[];
  capabilityFacts: CapabilityFact[];
  modelSupportItems: ModelSupportItem[];
  uniqueValueItems: UniqueValueItem[];
  differentiationItems: DifferentiationItem[];
  collaborationItems: CollaborationItem[];
  developerItems: DeveloperItem[];
  commercialItems: CommercialItem[];
  limitationItems: LimitationItem[];
  useCaseItems: UseCaseItem[];
  userFitItems: UserFitItem[];
  rawEvidenceBlocks: RawEvidenceBlock[];
  unresolvedQuestions: UnresolvedQuestion[];
};
