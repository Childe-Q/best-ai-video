import { PricingPlan } from '@/types/tool';
import { filterPaidPlans } from './pricing/filterPaidPlans';

interface SnapshotPlan {
  name: string;
  bullets: string[];
}

/**
 * Generate pricing snapshot from actual pricing plans data
 * Only shows paid plans (Free is excluded)
 */
export function generatePricingSnapshot(
  pricingPlans: PricingPlan[],
  maxPlans: number = 3
): { plans: SnapshotPlan[]; note?: string } {
  if (!pricingPlans || pricingPlans.length === 0) {
    return { plans: [] };
  }

  // Filter out Free plans
  const paidPlans = filterPaidPlans(pricingPlans);
  
  // Filter out Enterprise/Custom (optional, but keep if total <= 4)
  const regularPaidPlans = paidPlans.filter(p => {
    const name = (p.name || '').toLowerCase();
    return !name.includes('enterprise') && !name.includes('custom');
  });

  // Select plans to display (3-4 paid plans)
  // If we have <= 4 regular paid plans, show all; otherwise show first 4
  const plansToShow: PricingPlan[] = regularPaidPlans.slice(0, Math.min(maxPlans + 1, 4));

  // Generate snapshot for each plan
  const snapshotPlans: SnapshotPlan[] = plansToShow.map(plan => {
    const bullets = extractPlanBullets(plan, pricingPlans);
    return {
      name: plan.name || 'Unknown',
      bullets
    };
  });

  // Generate note if applicable
  const note = generateSnapshotNote(pricingPlans);

  return {
    plans: snapshotPlans,
    note: note || undefined
  };
}

function extractPlanBullets(plan: PricingPlan, allPlans: PricingPlan[]): string[] {
  const bullets: string[] = [];
  const name = (plan.name || '').toLowerCase();
  // Note: This function is now only called for paid plans, so isFree should always be false
  const isFree = false; // Paid plans only

  // Collect all feature text
  const featureTexts: string[] = [];
  if (plan.featureItems) {
    plan.featureItems.forEach(item => {
      if (item.text) featureTexts.push(item.text.toLowerCase());
    });
  }
  if (plan.features) {
    plan.features.forEach(f => featureTexts.push(f.toLowerCase()));
  }

  const allText = featureTexts.join(' ');

  // 1. Watermark status
  if (isFree) {
    if (allText.includes('watermark') || allText.includes('fliki watermark') || allText.includes('veed.io watermark')) {
      bullets.push("Visible watermarks on exports");
    } else {
      bullets.push("Watermarked exports (typical for free plans)");
    }
  } else {
    if (allText.includes('remove watermark') || allText.includes('watermark removal') || allText.includes('no watermark') || allText.includes('unwatermarked')) {
      bullets.push("Watermark removal");
    } else if (!allText.includes('watermark')) {
      // Assume paid plans remove watermark if not mentioned
      bullets.push("No watermarks");
    }
  }

  // 2. Export quality/resolution
  const resolutionMatch = allText.match(/(\d+p|720p|1080p|4k|ultra hd)/i);
  if (resolutionMatch) {
    const res = resolutionMatch[1].toUpperCase();
    if (isFree) {
      bullets.push(`Export quality: Up to ${res} (watermarked)`);
    } else {
      bullets.push(`${res} export quality`);
    }
  } else {
    if (isFree) {
      bullets.push("Export quality: Varies by plan (typically lower resolution)");
    } else {
      bullets.push("Higher export quality than free plan");
    }
  }

  // 3. Usage limits (credits/minutes/videos)
  const creditsMatch = allText.match(/(\d+)\s*(credits?|credit)/i);
  const minutesMatch = allText.match(/(\d+)\s*(minutes?|min)/i);
  const videosMatch = allText.match(/(\d+)\s*(videos?|video)/i);
  const unlimitedMatch = allText.match(/unlimited\s+(videos?|credits?|minutes?|exports?)/i);

  if (unlimitedMatch) {
    bullets.push("Unlimited usage");
  } else if (creditsMatch) {
    const creditAmount = creditsMatch[1];
    // Check if it's per month or per year
    const periodMatch = allText.match(/(per\s+(month|year|mo|yr)|monthly|yearly)/i);
    const period = periodMatch ? (periodMatch[2] || periodMatch[1] || 'period') : 'period';
    bullets.push(`${creditAmount} credits ${period === 'period' ? 'per period' : `per ${period}`}`);
  } else if (minutesMatch) {
    const minuteAmount = minutesMatch[1];
    // Check if it's per month or per year
    const periodMatch = allText.match(/(per\s+(month|year|mo|yr)|monthly|yearly)/i);
    const period = periodMatch ? (periodMatch[2] || periodMatch[1] || 'period') : 'period';
    bullets.push(`${minuteAmount} minutes ${period === 'period' ? 'per period' : `per ${period}`}`);
  } else if (videosMatch) {
    const videoAmount = videosMatch[1];
    bullets.push(`${videoAmount} videos per period`);
  } else if (isFree) {
    bullets.push("Limited usage per period");
  }

  // 4. Commercial rights
  if (!isFree) {
    if (allText.includes('commercial') || allText.includes('commercial use') || allText.includes('commercial license')) {
      bullets.push("Commercial use allowed");
    } else {
      // For paid plans, assume commercial use unless stated otherwise
      bullets.push("Commercial licensing available");
    }
  } else {
    bullets.push("Not recommended for commercial publishing");
  }

  // 5. Additional features based on plan type
  if (!isFree) {
    // Check for team/collaboration features
    if (allText.includes('team') || allText.includes('users') || allText.includes('collaboration')) {
      bullets.push("Team collaboration features");
    }

    // Check for advanced features
    if (allText.includes('priority') || allText.includes('support')) {
      bullets.push("Priority support");
    }

    // Check for custom avatars/advanced AI
    if (allText.includes('custom avatar') || allText.includes('custom video avatar')) {
      bullets.push("Custom avatar creation");
    }
  }

  // 6. Specific warnings or notes
  if (isFree && allText.includes('limited')) {
    bullets.push("Limited features compared to paid plans");
  }

  // Limit to 4 bullets max (like InVideo)
  return bullets.slice(0, 4);
}

function generateSnapshotNote(pricingPlans: PricingPlan[]): string | null {
  // Check if any plan mentions credits/minutes consumption
  const allText = pricingPlans
    .map(p => [
      ...(p.featureItems || []).map(i => i.text),
      ...(p.features || [])
    ].join(' '))
    .join(' ')
    .toLowerCase();

  if (allText.includes('credit') || allText.includes('minute')) {
    if (allText.includes('edit') || allText.includes('regenerate') || allText.includes('revision')) {
      return "Repeated edits may consume additional credits/minutes. Consider finalizing your script before generating.";
    }
    return "Usage limits apply. Check your plan details for exact credit/minute allocations.";
  }

  return null;
}
