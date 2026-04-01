import type { CardPriceConfidence } from '@/types/cardPriceBlock';

type CanonicalCardSummary = {
  monthlyStartAmount: number;
  hasFreePlan: boolean;
  confidence: CardPriceConfidence;
};

const CANONICAL_CARD_SUMMARIES: Record<string, CanonicalCardSummary> = {
  colossyan: {
    monthlyStartAmount: 27,
    hasFreePlan: true,
    confidence: 'verified',
  },
};

export function getCanonicalCardSummary(toolSlug: string): CanonicalCardSummary | null {
  return CANONICAL_CARD_SUMMARIES[toolSlug] ?? null;
}
