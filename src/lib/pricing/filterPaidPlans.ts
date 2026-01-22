import { PricingPlan } from '@/types/tool';

/**
 * Check if a plan is Contact Sales / Enterprise
 * This must be checked BEFORE isFreePlan to avoid misclassification
 */
export function isContactSalesPlan(plan: PricingPlan): boolean {
  const name = (plan.name || '').toLowerCase();
  const ctaText = (plan.ctaText || '').toLowerCase();
  const unitPriceNote = (plan.unitPriceNote || '').toLowerCase();
  
  // Check name
  if (name.includes('enterprise') || name.includes('custom') || name.includes('contact')) {
    return true;
  }
  
  // Check CTA text
  if (ctaText.includes('contact sales') || 
      ctaText.includes('talk to sales') || 
      ctaText.includes('request a demo') ||
      ctaText.includes('get a quote')) {
    return true;
  }
  
  // Check unitPriceNote
  if (unitPriceNote.includes('custom') || 
      unitPriceNote.includes('enterprise pricing') ||
      unitPriceNote.includes('contact sales')) {
    return true;
  }
  
  // Check description/features for contact sales indicators
  const allText = [
    plan.description || '',
    plan.tagline || '',
    ...(plan.features || []),
    ...(plan.highlights || []),
    ...(plan.featureItems?.map(f => f.text) || [])
  ].join(' ').toLowerCase();
  
  if (allText.includes('contact sales') ||
      allText.includes('invoice billing') ||
      allText.includes('custom pricing')) {
    return true;
  }
  
  return false;
}

/**
 * Check if a plan is Free
 * Rules:
 * - plan.name/label/slug contains "free" (case insensitive) => true
 * - price field is 0 / "Free" => true (BUT only if NOT Contact Sales)
 */
export function isFreePlan(plan: PricingPlan): boolean {
  // IMPORTANT: Check Contact Sales first to avoid misclassification
  if (isContactSalesPlan(plan)) {
    return false;
  }
  
  const name = (plan.name || '').toLowerCase();
  
  // Check name contains "free"
  if (name === 'free' || name.includes('free')) {
    return true;
  }
  
  // Check price is 0 or "Free" (only if name also suggests free)
  if (plan.price) {
    if (typeof plan.price === 'string' && plan.price.toLowerCase().includes('free')) {
      return true;
    }
    if (typeof plan.price === 'object' && 'monthly' in plan.price) {
      const monthly = (plan.price.monthly as any);
      if (typeof monthly === 'object' && 'amount' in monthly) {
        // Only return true if amount is 0 AND name suggests free (not Enterprise)
        if ((monthly.amount === 0 || monthly.amount === null) && name.includes('free')) {
          return true;
        }
      }
      if (typeof monthly === 'string' && monthly.toLowerCase().includes('free')) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Filter paid plans from pricing plans array
 */
export function filterPaidPlans(plans: PricingPlan[]): PricingPlan[] {
  return plans.filter(plan => !isFreePlan(plan));
}
