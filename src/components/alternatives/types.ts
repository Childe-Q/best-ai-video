// Legacy type (kept for backward compatibility)
export type AlternativeTool = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  startingPrice: string;
  rating?: number;
  affiliateLink: string;
  compareLink?: string;
  hasFreeTrial: boolean;
  bestFor: string[];
  whySwitch: string[]; // 2-3 items, max 18 words each
  tradeOff: string | null; // 1 item, max 18 words
  pricingSignals: {
    freePlan?: string;
    watermark?: string;
    exportQuality?: string;
    refundCancel?: string;
  };
  evidenceLinks?: string[]; // Optional: evidence source URLs
};

// Legacy type (kept for backward compatibility)
export type AlternativeGroup = {
  id: string;
  title: string;
  description: string;
  tools: AlternativeTool[];
};

// Re-export new types from alternatives.ts
export type { 
  AlternativeToolWithEvidence, 
  AlternativeGroupWithEvidence 
} from '@/types/alternatives';

// Standard switching reasons for all tools (fixed 4 groups)
export const STANDARD_SWITCHING_REASONS = [
  {
    id: 'editing-control',
    title: 'Editing control',
    description: 'Tools with more manual editing control, timeline precision, or frame-level adjustments.'
  },
  {
    id: 'stock-voice-quality',
    title: 'Stock + voice quality',
    description: 'Alternatives with better stock libraries, higher voice quality, or more realistic audio.'
  },
  {
    id: 'predictable-pricing',
    title: 'Predictable pricing',
    description: 'Tools with clearer pricing, better free tiers, or more predictable credit consumption.'
  },
  {
    id: 'avatar-videos',
    title: 'Avatar videos',
    description: 'Alternatives with better avatar quality, more natural movements, or larger avatar libraries.'
  }
] as const;
