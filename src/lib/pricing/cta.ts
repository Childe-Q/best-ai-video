import type { PricingPlan } from '@/types/tool';
import { isExplicitContactSalesPlan, isExplicitFreePlan } from '@/lib/pricing/display';

export type PricingCtaVariant = 'primary' | 'secondary';

export function getPricingCardCtaLabel(plan: PricingPlan): string {
  if (isExplicitContactSalesPlan(plan)) {
    return 'Contact Sales';
  }

  if (isExplicitFreePlan(plan)) {
    return 'Start Free';
  }

  return `Get ${plan.name}`;
}

export function getPricingCardCtaVariant(plan: PricingPlan): PricingCtaVariant {
  if (isExplicitFreePlan(plan)) {
    return 'secondary';
  }

  return 'primary';
}
