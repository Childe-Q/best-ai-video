import { PricingPlan } from '@/types/tool';

interface Recommendation {
  planName: string;
  reason: string; // <= 18 chars
  planSlug: string; // For scrolling to card
}

/**
 * Derive recommendation pills for paid plans
 * Priority:
 * 1. plan.description / plan.bestFor / plan.watchouts
 * 2. Extract most distinctive feature from bullets (watermark/4k/seats/commercial/minutes/credits/export)
 * 3. Extract from keyFacts (pricing-related)
 * 4. If none found, return null (don't show this plan)
 */
export function deriveRecommendations(
  plans: PricingPlan[],
  keyFacts?: string[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // Select plans: Most Popular -> Lowest price -> Team/High tier
  const sortedPlans = [...plans].sort((a, b) => {
    // Check if popular
    const badgeA = (a.badge || a.ribbonText || '').toLowerCase();
    const badgeB = (b.badge || b.ribbonText || '').toLowerCase();
    const isPopularA = badgeA.includes('popular') || badgeA.includes('best value') || a.isPopular;
    const isPopularB = badgeB.includes('popular') || badgeB.includes('best value') || b.isPopular;
    
    if (isPopularA !== isPopularB) return isPopularB ? 1 : -1;
    
    // Sort by price (ascending)
    const priceA = getPriceAmount(a);
    const priceB = getPriceAmount(b);
    return priceA - priceB;
  });
  
  // Select top 3 plans
  const selectedPlans = sortedPlans.slice(0, 3);
  
  for (const plan of selectedPlans) {
    const reason = extractRecommendationReason(plan, keyFacts);
    if (reason) {
      recommendations.push({
        planName: plan.name,
        reason,
        planSlug: `plan-${plan.name.toLowerCase().replace(/\s+/g, '-')}`
      });
    }
  }
  
  return recommendations;
}

function getPriceAmount(plan: PricingPlan): number {
  if (!plan.price || typeof plan.price !== 'object') return 999999;
  if ('monthly' in plan.price && typeof plan.price.monthly === 'object' && 'amount' in plan.price.monthly) {
    return (plan.price.monthly as any).amount || 999999;
  }
  return 999999;
}

function extractRecommendationReason(plan: PricingPlan, keyFacts?: string[]): string | null {
  // Priority 1: plan.description (if short enough)
  if (plan.description && plan.description.length <= 18) {
    return plan.description;
  }
  
  // Priority 2: Extract from bullets (most distinctive feature)
  const allFeatures = [
    ...(plan.highlights || []),
    ...(plan.featureItems?.map(f => f.text) || []),
    ...(plan.features || [])
  ];
  
  // Keywords to prioritize
  const priorityKeywords = ['watermark', '4k', 'seats', 'commercial', 'minutes', 'credits', 'export', 'team', 'collaboration'];
  
  // Find feature with priority keyword
  for (const keyword of priorityKeywords) {
    const matchingFeature = allFeatures.find(f => 
      f.toLowerCase().includes(keyword)
    );
    if (matchingFeature) {
      // Truncate to 18 chars
      let reason = matchingFeature.trim();
      if (reason.length > 18) {
        reason = reason.substring(0, 15) + '...';
      }
      return reason;
    }
  }
  
  // Fallback: take first feature and truncate
  if (allFeatures.length > 0) {
    let reason = allFeatures[0].trim();
    if (reason.length > 18) {
      reason = reason.substring(0, 15) + '...';
    }
    return reason;
  }
  
  // Priority 3: Extract from keyFacts (pricing-related)
  if (keyFacts) {
    const pricingKeywords = ['watermark', 'credit', 'minute', 'rights', 'export', 'commercial'];
    for (const fact of keyFacts) {
      const lower = fact.toLowerCase();
      if (pricingKeywords.some(k => lower.includes(k))) {
        // Extract short phrase
        let reason = fact.trim();
        if (reason.length > 18) {
          // Try to extract just the relevant part
          for (const keyword of pricingKeywords) {
            const idx = lower.indexOf(keyword);
            if (idx >= 0) {
              const start = Math.max(0, idx - 5);
              const end = Math.min(reason.length, idx + keyword.length + 10);
              reason = reason.substring(start, end).trim();
              if (reason.length <= 18) break;
            }
          }
          if (reason.length > 18) {
            reason = reason.substring(0, 15) + '...';
          }
        }
        return reason;
      }
    }
  }
  
  // No reason found - don't show this plan
  return null;
}
