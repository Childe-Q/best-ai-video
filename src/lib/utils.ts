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

// Helper function to get price as string (handles multiple price formats)
function getPriceString(price: any): string {
  if (!price) return '';
  
  // Old format: plain string
  if (typeof price === 'string') {
    return price;
  }
  
  // New format: { monthly: {amount, currency, period}, yearly?: {...} }
  if (typeof price === 'object' && price !== null) {
    // Check if it has monthly/yearly structure with nested objects
    if ('monthly' in price) {
      const monthly = price.monthly;
      
      // If monthly is a string (old format)
      if (typeof monthly === 'string') {
        return monthly;
      }
      
      // If monthly is an object with amount/currency/period (new format)
      if (typeof monthly === 'object' && monthly !== null && 'amount' in monthly) {
        if (monthly.amount === 0) {
          // Check if it's custom pricing
          const unitPriceNote = (price as any).unitPriceNote;
          if (unitPriceNote && typeof unitPriceNote === 'string' && unitPriceNote.toLowerCase().includes('custom')) {
            return 'Custom';
          }
          return 'Free';
        }
        const currency = monthly.currency === 'USD' ? '$' : monthly.currency || '$';
        return `${currency}${monthly.amount}`;
      }
    }
    
    // Old format: { monthly: string, yearly: string }
    if ('monthly' in price && typeof price.monthly === 'string') {
      return price.monthly;
    }
    
    // Old format: { amount, currency, period } (direct object, not nested)
    if ('amount' in price && 'currency' in price && 'period' in price && !('monthly' in price)) {
      if (price.amount === 0) {
        return 'Free';
      }
      const currency = price.currency === 'USD' ? '$' : price.currency || '$';
      return `${currency}${price.amount}`;
    }
  }
  
  return '';
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
      // Ensure priceStr is a string before calling toLowerCase
      if (typeof priceStr !== 'string') return false;
      const lower = priceStr.toLowerCase();
      return lower !== 'free' && 
             lower !== 'custom' &&
             lower !== 'contact' &&
             lower !== '';
    });
    if (paidPlan) {
      const priceStr = getPriceString(paidPlan.price);
      // Get period from plan or price object
      let period = '';
      if ((paidPlan as any).period) {
        period = (paidPlan as any).period;
      } else if (paidPlan.price && typeof paidPlan.price === 'object' && 'monthly' in paidPlan.price) {
        const monthly = paidPlan.price.monthly;
        if (typeof monthly === 'object' && monthly !== null && 'period' in monthly) {
          period = monthly.period === 'month' ? '/month' : monthly.period === 'year' ? '/year' : '';
        }
      }
      return `${priceStr}${period}`;
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

