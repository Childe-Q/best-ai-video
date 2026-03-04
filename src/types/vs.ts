export type VsSide = 'a' | 'b';

export type VsDiffRow = {
  label: string;
  a: string;
  b: string;
  sourceUrl?: string;
};

export type VsScore = {
  methodNote: string;
  weights: Record<string, number>;
  a: Record<string, number>;
  b: Record<string, number>;
};

export type VsComparison = {
  slugA: string;
  slugB: string;
  updatedAt: string;
  pricingCheckedAt: string;
  shortAnswer: {
    a: string;
    b: string;
  };
  decisionCases?: Array<{
    label: string;
    keywords?: string[];
  }>;
  useCases?: string[];
  bestFor: {
    a: string[];
    b: string[];
  };
  notFor: {
    a: string[];
    b: string[];
  };
  keyDiffs: VsDiffRow[];
  matrixRows: VsDiffRow[];
  score: VsScore;
  promptBox: {
    prompt: string;
    settings: string[];
  };
  verdict: {
    winnerPrice: VsSide;
    winnerQuality: VsSide;
    winnerSpeed: VsSide;
    recommendation: string;
  };
  related: {
    toolPages: string[];
    alternatives: string[];
    comparisons: string[];
  };
  disclosure: string;
};
