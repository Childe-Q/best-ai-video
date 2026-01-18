import { Tool } from '@/types/tool';
import { getTool } from '@/lib/getTool';
import { alternativesEvidence } from '@/data/evidence/alternatives';
import alternativesEvidenceData from '@/data/alternativesEvidence.json';

/**
 * Get pricing details bullets for a tool from evidence or tool data
 * Returns 2-4 pricing bullets for display in alternative cards
 */
export function getPricingDetails(slug: string): string[] {
  const tool = getTool(slug);
  if (!tool) return [];
  
  const bullets: string[] = [];
  
  // First, try to get from evidence (alternativesEvidence.json or alternatives.ts)
  let evidence: any = null;
  
  // Check JSON file
  const jsonEvidence = (alternativesEvidenceData as any[]).find(e => e.tool === slug);
  if (jsonEvidence) evidence = jsonEvidence;
  
  // Check TS file
  if (!evidence && alternativesEvidence[slug]) {
    evidence = alternativesEvidence[slug];
  }
  
  // Extract pricing signals from evidence
  if (evidence?.pricingSignals || evidence?.pricing_signals) {
    const signals = evidence.pricingSignals || evidence.pricing_signals;
    
    if (signals.freePlan?.claim && !signals.freePlan.claim.includes('[NEED VERIFICATION]')) {
      bullets.push(signals.freePlan.claim);
    }
    if (signals.watermark?.claim && !signals.watermark.claim.includes('[NEED VERIFICATION]')) {
      bullets.push(signals.watermark.claim);
    }
    if (signals.exportQuality?.claim && !signals.exportQuality.claim.includes('[NEED VERIFICATION]')) {
      bullets.push(signals.exportQuality.claim);
    }
    if (signals.refundCancel?.claim && !signals.refundCancel.claim.includes('[NEED VERIFICATION]')) {
      bullets.push(signals.refundCancel.claim);
    }
  }
  
  // Fallback: Build from tool pricing_plans if we don't have enough bullets
  if (bullets.length < 2 && tool.pricing_plans && Array.isArray(tool.pricing_plans)) {
    // Helper function to extract monthly amount from price
    const getMonthlyAmount = (price: any): number | null => {
      if (typeof price === 'object' && price !== null && 'monthly' in price) {
        const monthly = price.monthly;
        if (typeof monthly === 'object' && monthly !== null && 'amount' in monthly) {
          return monthly.amount;
        }
      }
      return null;
    };
    
    const freePlan = tool.pricing_plans.find((p: any) => 
      p.name?.toLowerCase().includes('free') || getMonthlyAmount(p.price) === 0
    );
    
    const paidPlans = tool.pricing_plans.filter((p: any) => {
      const amount = getMonthlyAmount(p.price);
      return amount !== null && amount > 0;
    }).sort((a: any, b: any) => {
      const amountA = getMonthlyAmount(a.price) || 0;
      const amountB = getMonthlyAmount(b.price) || 0;
      return amountA - amountB;
    });
    
    if (freePlan && bullets.length < 4) {
      const freeFeatures = freePlan.featureItems?.slice(0, 2).map((f: any) => f.text).join(', ') || '';
      if (freeFeatures) {
        bullets.push(`${tool.name} free plan offers ${freeFeatures}`);
      }
    }
    
    if (paidPlans.length > 0 && bullets.length < 4) {
      const lowestPaid = paidPlans[0];
      const price = getMonthlyAmount(lowestPaid.price);
      if (price !== null && price > 0) {
        bullets.push(`${tool.name} paid plans start at $${price}/mo`);
      }
    }
  }
  
  // Return 2-4 bullets
  return bullets.slice(0, 4);
}
