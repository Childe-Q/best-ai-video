// Unified ToolContent type for content JSON files
export interface ToolContent {
  // Overview section
  overview?: {
    tldr?: {
      bestFor: string;
      notFor: string;
      why: string;
    };
    miniTest?: {
      prompt: string;
      generationTime?: string;
      footageMatch?: string;
      subtitleAccuracy?: string;
      verdict?: string;
      checklist?: Array<{
        label: string;
        value: string;
      }>;
    };
    useCases?: Array<{
      title: string;
      why: string;
      linkHref: string;
      linkText?: string;
    }>;
    output?: {
      videoUrl?: string;
      description?: string;
    };
  };
  
  // Features section
  features?: {
    keyFeatures?: string[];
    detailedFeatures?: Array<{
      title: string;
      description: string;
      icon?: string;
      href?: string;
    }>;
  };
  
  // Pros & Cons
  pros?: string[];
  cons?: string[];
  
  // Reviews section
  reviews?: {
    userSentiment?: string;
    faqs?: Array<{
      question: string;
      answer: string;
    }>;
    verdict?: {
      bottomLine: string;
      bestFor: string | string[];
    };
    reviewHighlights?: {
      likes?: string[];
      complaints?: string[];
      commonIssues?: Array<{
        claim: string;
        impact: string;
        whatToDo: string;
      }>;
    };
  };
  
  // Pricing section (from dossiers, not external evidence)
  pricing?: {
    snapshot?: {
      plans: Array<{
        name: string;
        bullets: string[];
      }>;
      note?: string;
    };
  };
  
  // Sources
  sources?: Record<string, {
    type: string;
    howToVerify: string;
    suggestedQuery?: string;
  }>;
  
  // Related links
  related?: {
    comparisons?: Array<{
      slug: string;
      title: string;
    }>;
    alternatives?: {
      slug: string;
      title: string;
    };
  };
}
