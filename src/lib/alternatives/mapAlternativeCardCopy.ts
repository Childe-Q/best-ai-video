import { AlternativeTool } from '@/components/alternatives/types';
import { Tool } from '@/types/tool';
import { cleanClaim, isValidClaim, truncateText } from '../buildAlternativesData';

/**
 * Enhanced copy mapper to ensure high information density for alternative cards
 * Ensures: 3+ bestFor tags, 2 whySwitch claims, pricing details, limitations
 */
export function mapAlternativeCardCopy(
  cardData: AlternativeTool,
  tool: Tool,
  evidence: any
): AlternativeTool {
  const enhanced = { ...cardData };

  // 1. Best For: Ensure at least 3 tags with longer descriptions
  if (enhanced.bestFor.length < 3) {
    // Try to get more from evidence
    const evidenceBestFor = (evidence?.bestFor || evidence?.best_for || [])
      .filter((tag: string) => isValidClaim(tag))
      .map((tag: string) => cleanClaim(tag));

    // Combine and prioritize longer descriptions
    const allBestFor = [...enhanced.bestFor, ...evidenceBestFor]
      .filter((tag, index, self) => self.indexOf(tag) === index) // dedupe
      .sort((a, b) => b.length - a.length); // longer first

    // Fallback to tool data if still insufficient
    if (allBestFor.length < 3) {
      const toolBestFor = tool.best_for?.split(/[,&]/).map((s: string) => s.trim()) || [];
      const toolTags = (tool as any).tags || [];
      const toolSegments = (tool as any).segments || [];
      
      const fallbackTags = [
        ...toolBestFor,
        ...toolTags,
        ...toolSegments
      ].filter((tag: string) => tag && tag.length > 5); // Only longer tags

      allBestFor.push(...fallbackTags);
    }

    // Ensure at least 3, prefer longer descriptions
    enhanced.bestFor = allBestFor
      .filter((tag, index, self) => self.indexOf(tag) === index) // dedupe
      .slice(0, Math.max(3, allBestFor.length));
  }

  // 2. Why Switch: Ensure 2 claims (Pick this if + highlight)
  // First claim should be a longer comparison sentence (better than InVideo)
  // Second claim should be a value proposition
  if (enhanced.whySwitch.length < 2) {
    const evidenceWhySwitch = (evidence?.whySwitch || evidence?.why_switch || [])
      .filter((item: any) => {
        if (!item.claim || !isValidClaim(item.claim)) return false;
        // Check sources for [NEED VERIFICATION]
        if (item.sources && Array.isArray(item.sources)) {
          for (const source of item.sources) {
            if (source.facts && Array.isArray(source.facts)) {
              for (const fact of source.facts) {
                if (typeof fact === 'string' && fact.includes('[NEED VERIFICATION]')) {
                  return false;
                }
              }
            }
          }
        }
        return true;
      })
      .map((item: any) => cleanClaim(item.claim));

    // Combine with existing
    const allWhySwitch = [...enhanced.whySwitch, ...evidenceWhySwitch]
      .filter((claim, index, self) => self.indexOf(claim) === index); // dedupe

    // Fallback to tool.pros if needed
    if (allWhySwitch.length < 2 && tool.pros && Array.isArray(tool.pros)) {
      const prosClaims = tool.pros
        .filter((p: string) => p && p.length > 20) // Only longer pros
        .map((p: string) => cleanClaim(p)); // Don't truncate - need full comparison sentences
      allWhySwitch.push(...prosClaims);
    }

    // Ensure we have 2 claims, prioritize longer ones (comparison sentences)
    enhanced.whySwitch = allWhySwitch
      .filter((claim, index, self) => self.indexOf(claim) === index)
      .sort((a, b) => {
        // Prioritize claims that mention comparison (better than, compared to, etc.)
        const aHasComparison = /better|compared|than|versus|vs/i.test(a);
        const bHasComparison = /better|compared|than|versus|vs/i.test(b);
        if (aHasComparison && !bHasComparison) return -1;
        if (!aHasComparison && bHasComparison) return 1;
        return b.length - a.length; // Longer first
      })
      .slice(0, 2);
  }

  // 3. Trade-off (Limitations): Ensure we have one
  if (!enhanced.tradeOff) {
    const evidenceTradeOffs = (evidence?.tradeoffs || evidence?.trade_offs || [])
      .filter((item: any) => {
        if (!item.claim || !isValidClaim(item.claim)) return false;
        if (item.sources && Array.isArray(item.sources)) {
          for (const source of item.sources) {
            if (source.facts && Array.isArray(source.facts)) {
              for (const fact of source.facts) {
                if (typeof fact === 'string' && fact.includes('[NEED VERIFICATION]')) {
                  return false;
                }
              }
            }
          }
        }
        return true;
      })
      .map((item: any) => cleanClaim(item.claim));

    if (evidenceTradeOffs.length > 0) {
      enhanced.tradeOff = evidenceTradeOffs[0];
    } else if (tool.cons && Array.isArray(tool.cons) && tool.cons.length > 0) {
      enhanced.tradeOff = cleanClaim(tool.cons[0]); // Don't truncate - need full limitation description
    }
  }

  // 4. Pricing Signals: Build from pricingSignals or create from tool pricing data
  const pricingBullets: string[] = [];
  
  // First, try to extract from evidence.pricingSignals (structured format)
  if (evidence?.pricingSignals || evidence?.pricing_signals) {
    const signals = evidence.pricingSignals || evidence.pricing_signals;
    if (signals.freePlan && isValidClaim(signals.freePlan.claim || signals.freePlan)) {
      const text = typeof signals.freePlan === 'string' ? signals.freePlan : signals.freePlan.claim;
      pricingBullets.push(cleanClaim(text));
    }
    if (signals.watermark && isValidClaim(signals.watermark.claim || signals.watermark)) {
      const text = typeof signals.watermark === 'string' ? signals.watermark : signals.watermark.claim;
      pricingBullets.push(cleanClaim(text));
    }
    if (signals.exportQuality && isValidClaim(signals.exportQuality.claim || signals.exportQuality)) {
      const text = typeof signals.exportQuality === 'string' ? signals.exportQuality : signals.exportQuality.claim;
      pricingBullets.push(cleanClaim(text));
    }
    if (signals.refundCancel && isValidClaim(signals.refundCancel.claim || signals.refundCancel)) {
      const text = typeof signals.refundCancel === 'string' ? signals.refundCancel : signals.refundCancel.claim;
      pricingBullets.push(cleanClaim(text));
    }
  }
  
  // Also collect from existing enhanced.pricingSignals (already processed)
  if (enhanced.pricingSignals.freePlan && !pricingBullets.includes(enhanced.pricingSignals.freePlan)) {
    pricingBullets.push(enhanced.pricingSignals.freePlan);
  }
  if (enhanced.pricingSignals.watermark && !pricingBullets.includes(enhanced.pricingSignals.watermark)) {
    pricingBullets.push(enhanced.pricingSignals.watermark);
  }
  if (enhanced.pricingSignals.exportQuality && !pricingBullets.includes(enhanced.pricingSignals.exportQuality)) {
    pricingBullets.push(enhanced.pricingSignals.exportQuality);
  }
  if (enhanced.pricingSignals.refundCancel && !pricingBullets.includes(enhanced.pricingSignals.refundCancel)) {
    pricingBullets.push(enhanced.pricingSignals.refundCancel);
  }

  // If we have pricingDetailsBullets array in evidence, use that
  const pricingDetailsBullets = evidence?.pricingDetailsBullets || evidence?.pricing_details_bullets;
  if (pricingDetailsBullets && Array.isArray(pricingDetailsBullets) && pricingDetailsBullets.length > 0) {
    const validBullets = pricingDetailsBullets
      .filter((bullet: any) => {
        const text = typeof bullet === 'string' ? bullet : bullet.text || bullet.claim;
        return text && isValidClaim(text);
      })
      .map((bullet: any) => {
        const text = typeof bullet === 'string' ? bullet : bullet.text || bullet.claim;
        return cleanClaim(text);
      });
    pricingBullets.push(...validBullets);
  }

  // If still insufficient, try to build from tool pricing data
  if (pricingBullets.length < 2 && tool.pricing_plans && Array.isArray(tool.pricing_plans)) {
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

    if (freePlan) {
      // Build free plan bullet
      const freeFeatures = freePlan.featureItems?.map((f: any) => f.text).join(', ') || '';
      if (freeFeatures) {
        pricingBullets.push(`${tool.name} free plan offers ${freeFeatures}`);
      }
    }

    if (paidPlans.length > 0) {
      const lowestPaid = paidPlans[0];
      const price = getMonthlyAmount(lowestPaid.price);
      if (price !== null && price > 0) {
        pricingBullets.push(`${tool.name} paid plans start at $${price}/mo`);
      }
    }
  }

  // Ensure we have at least 2 pricing bullets, max 4
  if (pricingBullets.length > 0) {
    // Update pricingSignals with the bullets we collected
    const uniqueBullets = pricingBullets
      .filter((bullet, index, self) => self.indexOf(bullet) === index)
      .slice(0, 4);

    // Map to pricingSignals structure (if we have 4, use all fields)
    enhanced.pricingSignals = {
      freePlan: uniqueBullets[0] || enhanced.pricingSignals.freePlan,
      watermark: uniqueBullets[1] || enhanced.pricingSignals.watermark,
      exportQuality: uniqueBullets[2] || enhanced.pricingSignals.exportQuality,
      refundCancel: uniqueBullets[3] || enhanced.pricingSignals.refundCancel
    };
  }

  return enhanced;
}
