export type FAQ = {
  question: string;
  answer: string;
};

export type PricingPlan = {
  name: string; // e.g. "Free", "Creator"
  price: string | { // Support both old string format and new object format
    monthly: {
      amount: number;
      currency: string;
      period: string;
    };
    yearly?: {
      amount: number;
      currency: string;
      period: string;
    };
  } | {
    monthly: string; // Legacy format: e.g. "$28"
    yearly?: string;  // Legacy format: e.g. "$17" (The effective monthly cost when billed yearly)
  };
  period?: string; // e.g. "/mo", "/yr", or "" for free
  description?: string; // Short descriptor like "For beginners"
  highlights?: string[]; // Top section: Key highlights like "3 videos/mo", "1080p export"
  detailed_features?: string[]; // Bottom section: Detailed feature list
  features?: string[]; // Legacy field for backward compatibility
  badge?: string | null; // Psychological badge like "🔥 Most Popular", "Risk-Free Entry", etc.
  btn_text?: string; // "Start Free Trial" or "Get Started"
  tagline?: string;
  id?: string;
  unitPriceNote?: string;
  addonLabel?: string;
  addons?: Array<{ id: string; label: string } | { text: string; badge?: string }>;
  ctaText?: string;
  billingNote?: string;
  ribbonText?: string;
  featureItems?: Array<{ icon?: string; text: string; badge?: string }>;
  isPopular?: boolean;
};

export type ComparisonTableRow = {
  feature: string;
  label?: string; // Alternative to feature
  values_by_plan?: Record<string, string | boolean | number>;
  description?: string;
  note?: string;
};

export type ComparisonTableFeatureGroup = {
  group: string;
  rows: ComparisonTableRow[];
};

export type ComparisonTable = {
  feature_groups?: ComparisonTableFeatureGroup[];
  rows?: ComparisonTableRow[]; // Flat structure without groups
  headers?: string[]; // Plan names/keys
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
  pricing_plans?: PricingPlan[]; // New structure
  pricing?: {
    free_plan: { exists: boolean; details: string };
    starting_price: string;
    tiers: Array<{ name: string; monthly: string; annual: string | null; key_features: string[] }>;
  }; // Old structure - for backward compatibility during migration
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
  // Scoring fields for comparison tables (scale 1-10)
  ease_of_use_score?: number;
  speed_score?: number;
  price_score?: number; // Higher score = Cheaper/Better Value
  output_quality_score?: number;
  // Rich content fields
  video_url?: string; // YouTube video URL
  target_audience_list?: string[]; // e.g. ['Content Creators', 'Educators', 'Marketing Teams']
  // Social and metadata fields
  social_links?: {
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    instagram?: string;
  };
  deal?: string | null; // e.g., 'Code FLIKI10 for 10% Off'
  review_count?: number; // e.g., 7
  is_verified?: boolean; // true if verified
  categories?: string[]; // e.g., ['Video Generators', 'Text to Speech']
  user_sentiment?: string; // User sentiment summary from verified reviews
  featureCards?: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
  comparison_table?: ComparisonTable; // Pricing comparison table for extracting plan features
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
