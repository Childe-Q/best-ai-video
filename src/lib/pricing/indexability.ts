import type { PricingVerification } from '@/lib/pricing/display';
import { getToolPricingSummary } from '@/lib/pricing/display';
import { getCanonicalPricingPageOverride } from '@/lib/pricing/canonicalPricingAdapter';
import { getProofPricingPageData } from '@/lib/pricing/proofPages';
import { getProductizedPricingPageOverride } from '@/lib/pricing/productPageOverrides';
import type { Tool } from '@/types/tool';

export type PricingPageExposure = {
  indexable: boolean;
  verification: PricingVerification;
  source: 'override' | 'proof-page' | 'summary';
};

export function getPricingPageExposure(slug: string, tool: Tool): PricingPageExposure {
  const canonicalPricingOverride = getCanonicalPricingPageOverride(slug, tool);
  const pricingPageOverride = canonicalPricingOverride ?? getProductizedPricingPageOverride(slug, tool);

  if (pricingPageOverride?.pricingVerification) {
    return {
      indexable: true,
      verification: pricingPageOverride.pricingVerification,
      source: 'override',
    };
  }

  if (getProofPricingPageData(slug)) {
    return {
      indexable: true,
      verification: 'verified',
      source: 'proof-page',
    };
  }

  const summary = getToolPricingSummary(tool);
  return {
    indexable: summary.verification !== 'unverified',
    verification: summary.verification,
    source: 'summary',
  };
}
