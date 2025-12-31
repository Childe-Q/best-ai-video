import { Tool } from '@/types/tool';

/**
 * Get the SEO current year for metadata
 * Returns next year if current month is November or December (>= 11)
 * Otherwise returns current year
 */
export function getSEOCurrentYear(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() returns 0-11, so add 1
  
  return month >= 11 ? year + 1 : year;
}

/**
 * Get current month and year string for status badge
 * Returns format like "Dec 2025"
 */
export function getCurrentMonthYear(): string {
  const now = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  
  return `${month} ${year}`;
}

/**
 * Get current month name
 * Returns format like "Dec"
 */
export function getCurrentMonthName(): string {
  const now = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return monthNames[now.getMonth()];
}

/**
 * Helper functions for pricing_plans structure
 */

// Helper function to get price as string (handles both string and object types)
function getPriceString(price: string | { monthly: string; yearly: string } | undefined): string {
  if (!price) return '';
  if (typeof price === 'string') return price;
  // If it's an object, return monthly price by default
  return price.monthly || '';
}

export function hasFreePlan(tool: Tool): boolean {
  if (tool.pricing_plans && tool.pricing_plans.length > 0) {
    return tool.pricing_plans.some(plan => {
      const priceStr = getPriceString(plan.price);
      return plan.name.toLowerCase() === 'free' && priceStr.toLowerCase() === 'free';
    });
  }
  // Fallback for old structure
  if (tool.pricing?.free_plan?.exists) {
    return tool.pricing.free_plan.exists;
  }
  return false;
}

export function getStartingPrice(tool: Tool): string {
  if (tool.pricing_plans && tool.pricing_plans.length > 0) {
    // Find first paid plan
    const paidPlan = tool.pricing_plans.find(plan => {
      const priceStr = getPriceString(plan.price);
      return priceStr.toLowerCase() !== 'free' && 
             priceStr.toLowerCase() !== 'custom' &&
             priceStr.toLowerCase() !== 'contact';
    });
    if (paidPlan) {
      const priceStr = getPriceString(paidPlan.price);
      return `${priceStr}${paidPlan.period}`;
    }
  }
  // Fallback for old structure
  if (tool.pricing?.starting_price) {
    return tool.pricing.starting_price;
  }
  if (tool.starting_price) {
    return tool.starting_price;
  }
  return 'Contact';
}

