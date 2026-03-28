export type CardPriceState = 'free' | 'paid-exact' | 'paid-coarse' | 'custom' | 'unverified';

export type CardPriceSourceKind = 'normalized' | 'legacy-summary' | 'feature-seed';

export type CardPriceConfidence = 'verified' | 'trusted' | 'editorial-seed' | 'unverified';

export type CardPriceHintKind =
  | 'interactive-live-page'
  | 'billing-varies'
  | 'editorial-summary'
  | 'none';

export type CardPriceBlock = {
  priceState: CardPriceState;
  priceLabel: 'Paid' | 'Free' | 'Custom pricing' | 'Pricing unverified';
  pricePrimary:
    | 'Free plan available'
    | `Starts at $${string}`
    | 'Paid plans available'
    | 'Custom pricing'
    | 'Pricing not verified';
  priceHelper: string | null;
  priceSourceKind: CardPriceSourceKind;
  priceConfidence: CardPriceConfidence;
  priceHintKind: CardPriceHintKind;
};
