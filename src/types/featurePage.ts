export type FeatureHero = {
  h1: string;
  subheadline: string;
  definitionBullets: string[];
};

export type FeatureCriteriaItem = {
  title: string;
  desc?: string | null;
};

export type FeatureHowToChoose = {
  criteria: FeatureCriteriaItem[];
};

export type FeatureToolCard = {
  toolSlug: string;
  name?: string;
  logoUrl?: string | null;
  reasonLine1: string;
  reasonLine2?: string | null;
  pricingStartAt?: string | null;
  watermarkPolicy?: string | null;
  bestFor?: string | null;
  mainTradeoff?: string | null;
  hasReviewPage?: boolean;
  reviewUrl?: string | null;
  officialUrl?: string | null;
  outboundUrl?: string | null;
};

export type FeatureGroup = {
  groupTitle: string;
  groupSummary?: string;
  tools: FeatureToolCard[];
};

export type FeatureRecommendedReading = {
  tools?: string[];
  alternativesPages?: string[];
  vsPages?: string[];
  guides?: string[];
};

export type FeaturePageData = {
  slug: string;
  hero: FeatureHero;
  howToChoose?: FeatureHowToChoose;
  groups: FeatureGroup[];
  recommendedReading?: FeatureRecommendedReading;
};

export type FeatureToolCardDisplay = FeatureToolCard & {
  displayName: string;
  resolvedLogoUrl?: string | null;
};

export type FeatureGroupDisplay = Omit<FeatureGroup, 'tools'> & {
  tools: FeatureToolCardDisplay[];
};

export type FeatureInternalLinkType = 'tool' | 'tool_alternatives' | 'vs' | 'guide';

export type FeatureRecommendedReadingLink = {
  href: string;
  label: string;
  linkType: FeatureInternalLinkType;
  destinationSlug: string;
};
