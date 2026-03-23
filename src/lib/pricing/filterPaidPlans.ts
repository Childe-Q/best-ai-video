import { PricingPlan } from '@/types/tool';
import { isExplicitContactSalesPlan, isExplicitFreePlan } from '@/lib/pricing/display';

/**
 * Check if a plan is Contact Sales / Enterprise
 * This must be checked BEFORE isFreePlan to avoid misclassification
 */
export function isContactSalesPlan(plan: PricingPlan): boolean {
  return isExplicitContactSalesPlan(plan);
}

/**
 * Check if a plan is Free
 * Rules:
 * - plan.name/label/slug contains "free" (case insensitive) => true
 * - price field is 0 / "Free" => true (BUT only if NOT Contact Sales)
 */
export function isFreePlan(plan: PricingPlan): boolean {
  return isExplicitFreePlan(plan);
}

/**
 * Filter paid plans from pricing plans array
 */
export function filterPaidPlans(plans: PricingPlan[]): PricingPlan[] {
  return plans.filter(plan => !isFreePlan(plan));
}
