export type VsSide = 'a' | 'b';

export type VsDiffRow = {
  label: string;
  a: string;
  b: string;
  aText?: string;
  bText?: string;
  sources?: {
    a?: string[];
    b?: string[];
  };
  sourceUrl?: string;
};

export type VsPromptVariant = {
  key: string;
  title: string;
  prompt: string;
  settings: string[];
};

export type VsIntent = 'avatar' | 'editor' | 'text' | 'repurpose';

export type VsIntentProfile = {
  primary: VsIntent;
  intents: VsIntent[];
};

export type VsScore = {
  methodNote: string;
  weights: Record<string, number>;
  a: Record<string, number>;
  b: Record<string, number>;
  provenance: {
    mode: 'verified' | 'estimated' | 'mixed';
    coverage: Record<string, 'verified' | 'estimated'>;
    rationale: Record<string, string>;
    sources: Record<string, string[]>;
    calibration?: {
      applied: boolean;
      reason: 'featured_tool';
      margin: number;
    };
  };
};

export type VsComparison = {
  slugA: string;
  slugB: string;
  updatedAt: string;
  pricingCheckedAt: string;
  intentProfile?: VsIntentProfile;
  shortAnswer: {
    a: string;
    b: string;
  };
  decisionCases?: Array<{
    label: string;
    keywords?: string[];
    winner?: VsSide;
    verdict?: string;
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
    variants?: VsPromptVariant[];
    helperText?: string;
  };
  decisionSummary?: string;
  editorialNotes?: {
    whyPeopleCompareTheseTools?: string;
    looksSimilarButActuallyDifferent?: string;
    realDecision?: string;
    editorsTake?: string;
    chooseAIf?: string;
    chooseBIf?: string;
    hiddenTradeOff?: string;
    whoWillRegretTheWrongChoice?: string;
  };
  verdict: {
    winnerPrice: VsSide;
    winnerQuality: VsSide;
    winnerSpeed: VsSide;
    recommendation: string;
  };
  faq?: Array<{
    question: string;
    answer: string;
  }>;
  related: {
    toolPages: string[];
    alternatives: string[];
    comparisons: string[];
  };
  disclosure: string;
};
