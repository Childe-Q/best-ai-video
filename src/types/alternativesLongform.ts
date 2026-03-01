export type AlternativesHeroCta = {
  label: string;
  href: string;
  external?: boolean;
};

export type AlternativesTldrItem = {
  toolName: string;
  toolSlug?: string;
  why: string;
  href: string;
};

export type AlternativesTldrBucket = {
  id: string;
  title: string;
  items: AlternativesTldrItem[];
};

export type AlternativesComparisonRow = {
  toolName: string;
  toolSlug?: string;
  price: string;
  freeVersion: string;
  watermark: string;
  exportLimits: string;
  editingControl: string;
  bestFor: string;
  mainTradeoff: string;
};

export type AlternativesDeepDive = {
  toolName: string;
  toolSlug?: string;
  logoUrl?: string;
  image?: string;
  imageSourceUrl: string;
  bestFor: string;
  strengths: string[];
  tradeoffs: string[];
  pricingStarting: string;
  ctaHref: string;
  ctaLabel: string;
  sourceUrls: string[];
};

export type AlternativesFaq = {
  question: string;
  answer: string;
};

export type AlternativesTemplateData = {
  pageKind: 'tool' | 'topic';
  slug: string;
  title: string;
  heroConclusion: string;
  heroUpdatedAt: string;
  heroCtas: AlternativesHeroCta[];
  tldrBuckets: AlternativesTldrBucket[];
  decisionCriteria: string[];
  comparisonRows: AlternativesComparisonRow[];
  deepDives: AlternativesDeepDive[];
  topPicks?: Array<{
    toolName: string;
    toolSlug?: string;
    href: string;
  }>;
  moreAlternatives?: AlternativesDeepDive[];
  topPicksLimit?: number;
  intersectionNotice?: string;
  atAGlanceRows?: Array<{
    toolName: string;
    toolSlug?: string;
    bestFor: string;
  }>;
  arcadeIntersection?: {
    referenceTools: string[];
    intersected: Array<{ name: string; slug: string; matchedArcadeName: string }>;
    missingFromSite: string[];
    aliasRules: Record<string, string>;
  };
  faqs: AlternativesFaq[];
  tocSections: Array<{ id: string; label: string }>;
  canonicalPath: string;
  contentReady: boolean;
  contentGapReason?: string;
  notSureHref?: string;
  toolSummary?: {
    toolName: string;
    rating?: number;
    startingPrice?: string;
    conclusion: string;
    ctas: AlternativesHeroCta[];
    reviewHref: string;
  };
};

export type TopicAlternativesTool = {
  name: string;
  bestFor: string;
  strengths: string[];
  tradeoffs: string[];
  pricingNote: string;
  visitUrl: string;
  sourceUrls: string[];
};

export type TopicAlternativesGroup = {
  id: string;
  title: string;
  why: string;
  toolNames: string[];
};

export type TopicAlternativesData = {
  slug: string;
  title: string;
  intro: string;
  updatedAt?: string;
  decisionCriteria: string[];
  recommendedGroups: TopicAlternativesGroup[];
  tools: TopicAlternativesTool[];
  faqs?: AlternativesFaq[];
};
