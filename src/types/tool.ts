export type FAQ = {
  question: string;
  answer: string;
};

export type PricingDetails = {
  free_plan: boolean;
  starting_price: string;
  currency: string;
};

export type Tool = {
  id: string;
  slug: string;
  name: string;
  logo_url: string;
  tagline: string;
  short_description: string;
  best_for: string; // e.g. "YouTube Beginners"
  affiliate_link: string;
  pricing: PricingDetails;
  has_free_trial: boolean;
  // Kept for backward compatibility but mapped to new structure
  pricing_model: string; 
  starting_price: string; 
  rating: number; // Keeping it in type but won't display if not needed
  features: string[];
  tags: string[]; // e.g., ['Avatar', 'Text-to-Video', 'Editor', 'Repurposing', 'Cheap', 'Professional']
  pros: string[];
  cons: string[];
  review_content: string;
  long_review?: string;
  faqs: FAQ[];
};

// Types for Alternatives Page
export type ComparisonRow = {
  feature: string;
  target_tool_value: string | boolean;
  others: Record<string, string | boolean>;
};

export type AlternativePageData = {
  slug: string;
  target_tool_slug: string;
  title: string;
  subtitle: string;
  updated_at: string;
  top_picks: {
    best_overall: string;
    best_value: string;
    best_specific: string;
    specific_label: string;
  };
  comparison_table: {
    headers: string[];
    rows: ComparisonRow[];
  };
  alternatives_list: string[];
  faqs: FAQ[];
};
