export type NormalizedFeatureTool = {
  name: string;
  slug: string;
  verdictSeed: string | null;
  pricingSeed: string | null;
  policySeed: string | null;
  bestForSeed: string | null;
  mainLimitationSeed: string | null;
  officialUrl: string | null;
  hasReviewPage: boolean;
  reviewUrl: string | null;
  logoUrl: string | null;
  sourceUrls: string[];
  flags: string[];
};

export type NormalizedFeatureGroup = {
  id: string;
  title: string;
  rule: string;
  toolSlugs: string[];
};

export type NormalizedFeatureFaqSeed = {
  question: string;
  answerSeed: string;
  sourceToolSlugs: string[];
};

export type NormalizedFeatureRelatedLinks = {
  reviewSlugs: string[];
  alternativesSlugs: string[];
  vsSlugs: string[];
  guideSlugs: string[];
};

export type NormalizedFeaturePage = {
  schemaVersion: number;
  slug: string;
  title: string;
  summarySeed: {
    oneLiner: string;
    boundaries: string[];
    primaryClassificationRule: string;
    comparisonAxes: string[];
  };
  howToChooseSeeds: Array<{
    title: string;
    desc: string;
  }>;
  groups: NormalizedFeatureGroup[];
  tools: NormalizedFeatureTool[];
  relatedLinks: NormalizedFeatureRelatedLinks;
  faqSeeds: NormalizedFeatureFaqSeed[];
  lastReviewed: string;
  reviewMetadata: {
    generatedFrom: 'research-raw' | 'existing-feature-page';
    sourceFile: string | null;
    sourceCount: number;
    uniqueToolCount: number;
    needsManualReview: boolean;
    reviewNotes: string[];
  };
};
