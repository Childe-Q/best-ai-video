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
  pros: string[];
  cons: string[];
  review_content: string;
  long_review?: string;
  faqs: FAQ[];
};
