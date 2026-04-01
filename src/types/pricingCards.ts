export type CanonicalPricingStatus =
  | 'done'
  | 'usable_with_gaps'
  | 'insufficient_evidence'
  | 'frozen';

export type CanonicalPriceBlock = {
  displayedPrice: string;
  displayUnit: string;
  billingLabel: string;
  yearlyTotalPrice?: string;
  annualNote?: string;
};

export type CanonicalPricingPlan = {
  name: string;
  description: string;
  cta: string;
  monthlyPriceBlock: CanonicalPriceBlock;
  yearlyPriceBlock: CanonicalPriceBlock;
  bullets: string[];
};

export type CanonicalPricingTool = {
  slug: string;
  toolName: string;
  status: CanonicalPricingStatus;
  sourceType: string;
  notes: string[];
  plans: CanonicalPricingPlan[];
};

export type CanonicalPricingIndexEntry = {
  slug: string;
  toolName: string;
  status: CanonicalPricingStatus;
  planCount: number;
  dataFile: string;
};

export type CanonicalPricingIndex = {
  toolCount: number;
  tools: CanonicalPricingIndexEntry[];
};
