import { PricingPlan } from '@/types/tool';
import { Tool } from '@/types/tool';

/**
 * Extract export quality from plan text
 * Returns shortest matching fragment like "1080p", "4K export"
 */
export function extractExportQuality(planTextParts: string[]): string | null {
  const qualityPatterns = [
    /\b(720p|1080p|4k|4K)\b/i,
    /\b(\d+p)\s*(export|resolution|quality)?/i,
    /\b(HD|FHD|UHD|ultra\s*hd)\b/i
  ];
  
  for (const text of planTextParts) {
    for (const pattern of qualityPatterns) {
      const match = text.match(pattern);
      if (match) {
        // Return shortest meaningful fragment
        const result = match[0].trim();
        if (result.length <= 20) return result;
        // If too long, try to extract just the resolution part
        const resolutionMatch = text.match(/\b(720p|1080p|4k|4K|\d+p)\b/i);
        if (resolutionMatch) return resolutionMatch[1];
      }
    }
  }
  
  return null;
}

/**
 * Extract commercial rights info
 * Returns "Included", "Limited", or null
 */
export function extractCommercialRights(planTextParts: string[]): string | null {
  const commercialKeywords = ['commercial', 'license', 'licensing', 'rights', 'resale', 'client'];
  const negativeKeywords = ['non-commercial', 'personal use only', 'no commercial'];
  
  let hasCommercial = false;
  let hasNegative = false;
  
  for (const text of planTextParts) {
    const lower = text.toLowerCase();
    
    // Check for negative first
    if (negativeKeywords.some(k => lower.includes(k))) {
      hasNegative = true;
    }
    
    // Check for positive
    if (commercialKeywords.some(k => lower.includes(k))) {
      hasCommercial = true;
    }
  }
  
  if (hasNegative) return 'Limited';
  if (hasCommercial) return 'Included';
  
  return null;
}

/**
 * Extract best for description for a plan
 * Priority: plan description -> snapshot bullets -> tool best_for
 */
export function extractBestFor(
  planName: string,
  plan: PricingPlan,
  tool: { best_for?: string } | null,
  snapshotPlans?: Array<{ name: string; bullets: string[] }>
): string | null {
  // Priority 1: Plan description
  if (plan.description && plan.description.length <= 50) {
    return plan.description;
  }
  
  // Priority 2: Snapshot bullets for this plan
  if (snapshotPlans) {
    const snapshotPlan = snapshotPlans.find(sp => 
      sp.name.toLowerCase() === planName.toLowerCase()
    );
    if (snapshotPlan && snapshotPlan.bullets.length > 0) {
      // Try to find a "best for" type bullet
      const bestForBullet = snapshotPlan.bullets.find(b => 
        b.toLowerCase().includes('best for') || 
        b.toLowerCase().includes('ideal for') ||
        b.toLowerCase().includes('suitable for')
      );
      if (bestForBullet) {
        // Extract the relevant part
        const match = bestForBullet.match(/(?:best for|ideal for|suitable for)[:\s]+(.+?)(?:\.|$)/i);
        if (match && match[1].length <= 50) {
          return match[1].trim();
        }
      }
      // Fallback: first bullet if it's short
      if (snapshotPlan.bullets[0] && snapshotPlan.bullets[0].length <= 50) {
        return snapshotPlan.bullets[0];
      }
    }
  }
  
  // Priority 3: Tool best_for (generic, but better than nothing)
  if (tool?.best_for && tool.best_for.length <= 50) {
    return tool.best_for;
  }
  
  return null;
}
