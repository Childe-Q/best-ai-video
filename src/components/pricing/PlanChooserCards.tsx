import { PricingPlan } from '@/types/tool';

interface PlanChooserCardsProps {
  pricingPlans: PricingPlan[];
  planPicker?: {
    title?: string;
    bullets?: string[];
  };
}

interface PlanAnalysis {
  name: string;
  isFree: boolean;
  hasWatermark: boolean;
  hasCommercial: boolean;
  has4K: boolean;
  hasTeam: boolean;
  credits?: string;
  minutes?: string;
  resolution?: string;
}

function analyzePlan(plan: PricingPlan): PlanAnalysis {
  const name = plan.name || '';
  const isFree = name.toLowerCase().includes('free') || 
                 (typeof plan.price === 'object' && plan.price !== null && 
                  'monthly' in plan.price && 
                  (plan.price.monthly as any)?.amount === 0);
  
  const featureText = [
    ...(plan.featureItems || []).map(f => f.text.toLowerCase()),
    ...(plan.features || []).map(f => f.toLowerCase())
  ].join(' ');

  const hasWatermark = !featureText.includes('no watermark') && 
                       !featureText.includes('watermark removal') &&
                       !featureText.includes('unwatermarked');
  
  const hasCommercial = featureText.includes('commercial') || 
                         featureText.includes('commercial use') ||
                         featureText.includes('commercial license');
  
  const has4K = featureText.includes('4k') || 
                featureText.includes('ultra hd') ||
                featureText.includes('4k ultra');
  
  const hasTeam = featureText.includes('team') || 
                  featureText.includes('users') ||
                  featureText.includes('collaboration') ||
                  name.toLowerCase().includes('team') ||
                  name.toLowerCase().includes('enterprise');

  // Extract credits/minutes
  const creditsMatch = featureText.match(/(\d+)\s*(credits?|credit)/i);
  const minutesMatch = featureText.match(/(\d+)\s*(minutes?|min)/i);
  const resolutionMatch = featureText.match(/(\d+p|1080p|720p|4k)/i);

  return {
    name,
    isFree,
    hasWatermark,
    hasCommercial,
    has4K,
    hasTeam,
    credits: creditsMatch ? `${creditsMatch[1]} credits` : undefined,
    minutes: minutesMatch ? `${minutesMatch[1]} minutes` : undefined,
    resolution: resolutionMatch ? resolutionMatch[1] : undefined,
  };
}

function generatePlanCard(analysis: PlanAnalysis, allPlans: PlanAnalysis[]): {
  title: string;
  bestFor: string[];
  watchouts: string[];
} {
  const { name, isFree, hasWatermark, hasCommercial, has4K, hasTeam, credits, minutes } = analysis;

  if (isFree) {
    return {
      title: name,
      bestFor: [
        "Testing workflows and learning the interface",
        "Personal projects where watermarks are acceptable"
      ],
      watchouts: [
        hasWatermark ? "Watermarked exports limit commercial use" : "Limited features compared to paid plans",
        credits || minutes ? `Limited ${credits || minutes} per period` : "Limited usage per period"
      ]
    };
  }

  // Find if this is a mid-tier or high-tier plan
  const paidPlans = allPlans.filter(p => !p.isFree);
  const isMidTier = paidPlans.length >= 2 && 
                     paidPlans.findIndex(p => p.name === name) === Math.floor(paidPlans.length / 2);
  const isHighTier = paidPlans.length >= 2 && 
                      paidPlans.findIndex(p => p.name === name) === paidPlans.length - 1;

  if (isMidTier || (paidPlans.length === 1)) {
    // Recommended / Starter tier
    return {
      title: name,
      bestFor: [
        hasCommercial ? "Regular publishing with commercial rights" : "Regular publishing without watermarks",
        credits || minutes ? `Moderate use (${credits || minutes} per period)` : "Moderate production volume"
      ],
      watchouts: [
        !has4K && allPlans.some(p => p.has4K) ? "4K exports require higher tier" : "Heavy iteration may require higher tier",
        credits || minutes ? `Watch credit/minute usage if you iterate frequently` : "Usage limits may vary by plan"
      ]
    };
  }

  if (isHighTier || hasTeam) {
    // High-tier / Team
    return {
      title: name,
      bestFor: [
        hasTeam ? "Teams and agencies needing collaboration" : "Daily production with higher limits",
        has4K ? "4K exports and advanced features" : "Higher credit/minute limits"
      ],
      watchouts: [
        "Higher cost may not be justified for light users",
        "Verify exact limits and features before committing"
      ]
    };
  }

  // Fallback
  return {
    title: name,
    bestFor: [
      hasCommercial ? "Commercial use" : "Regular publishing",
      credits || minutes ? `${credits || minutes} per period` : "Higher limits"
    ],
    watchouts: [
      "Verify exact features and limits",
      "Check if this tier fits your usage pattern"
    ]
  };
}

export default function PlanChooserCards({ pricingPlans, planPicker }: PlanChooserCardsProps) {
  if (!pricingPlans || pricingPlans.length === 0) {
    return null;
  }

  // Analyze all plans
  const analyses = pricingPlans.map(plan => analyzePlan(plan));
  
  // Find Free, Recommended (mid-tier), and High-tier plans
  const freePlan = analyses.find(p => p.isFree);
  const paidPlans = analyses.filter(p => !p.isFree);
  
  // Determine which plans to show based on total count
  let recommendedPlan: PlanAnalysis | null = null;
  let highTierPlan: PlanAnalysis | null = null;
  
  if (paidPlans.length === 0) {
    // Only free plan
    recommendedPlan = null;
    highTierPlan = null;
  } else if (paidPlans.length === 1) {
    // Only one paid plan - show it as recommended
    recommendedPlan = paidPlans[0];
    highTierPlan = null;
  } else if (paidPlans.length === 2) {
    // Two paid plans - first is recommended, second is high-tier
    recommendedPlan = paidPlans[0];
    highTierPlan = paidPlans[1];
  } else {
    // Three or more paid plans - middle is recommended, last is high-tier
    recommendedPlan = paidPlans[Math.floor(paidPlans.length / 2)];
    highTierPlan = paidPlans[paidPlans.length - 1];
  }

  // Generate cards based on available plans
  const cards = [];
  
  // Always show free plan if it exists
  if (freePlan) {
    cards.push({
      ...generatePlanCard(freePlan, analyses),
      type: 'free' as const
    });
  }
  
  // Show recommended plan (first/middle paid plan)
  if (recommendedPlan) {
    cards.push({
      ...generatePlanCard(recommendedPlan, analyses),
      type: 'recommended' as const
    });
  }
  
  // Show high-tier plan only if it's different from recommended and exists
  if (highTierPlan && highTierPlan !== recommendedPlan) {
    cards.push({
      ...generatePlanCard(highTierPlan, analyses),
      type: 'high-tier' as const
    });
  }
  
  // If we only have 2 cards total (e.g., Free + 1 Paid, or 2 Paid), that's fine
  // If we have 1 card (e.g., only Free or only 1 Paid), that's also fine

  // If planPicker bullets are provided, use them to enhance cards
  if (planPicker?.bullets && planPicker.bullets.length > 0) {
    // Parse bullets into cards (supports both "PlanName: description" and "PlanName description" formats)
    const parsedCards = planPicker.bullets.map(bullet => {
      // Try "PlanName: description" format first
      let match = bullet.match(/^([^:]+):\s*(.+)$/);
      if (!match) {
        // Try "PlanName description" format (first word is plan name)
        const words = bullet.split(' ');
        if (words.length > 1) {
          const planName = words[0];
          const description = words.slice(1).join(' ');
          match = [bullet, planName, description];
        }
      }
      
      if (match) {
        const planName = match[1].trim();
        const description = match[2].trim();
        const plan = analyses.find(p => 
          p.name.toLowerCase() === planName.toLowerCase() ||
          p.name.toLowerCase().includes(planName.toLowerCase()) ||
          planName.toLowerCase().includes(p.name.toLowerCase())
        );
        if (plan) {
          return {
            title: plan.name,
            bestFor: [description],
            watchouts: [],
            type: plan.isFree ? 'free' as const : (plan === highTierPlan ? 'high-tier' as const : 'recommended' as const),
            planAnalysis: plan
          };
        }
      }
      return null;
    }).filter(Boolean) as Array<{
      title: string;
      bestFor: string[];
      watchouts: string[];
      type: 'free' | 'recommended' | 'high-tier';
      planAnalysis: PlanAnalysis;
    }>;

    if (parsedCards.length > 0) {
      // Use parsed cards, but fill in watchouts from analysis
      parsedCards.forEach(card => {
        const generated = generatePlanCard(card.planAnalysis, analyses);
        // Merge bestFor if generated has more items
        if (generated.bestFor.length > card.bestFor.length) {
          card.bestFor = [...card.bestFor, ...generated.bestFor.slice(card.bestFor.length)];
        }
        card.watchouts = generated.watchouts;
      });
      
      // Build final cards array, ensuring we have the right number of cards
      const finalCards = [];
      
      // Add free plan if it exists
      const freeCard = parsedCards.find(c => c.type === 'free');
      if (freeCard) {
        finalCards.push(freeCard);
      } else if (freePlan) {
        finalCards.push({
          ...generatePlanCard(freePlan, analyses),
          type: 'free' as const
        });
      }
      
      // Add recommended plan
      const recommendedCard = parsedCards.find(c => c.type === 'recommended');
      if (recommendedCard) {
        finalCards.push(recommendedCard);
      } else if (recommendedPlan) {
        finalCards.push({
          ...generatePlanCard(recommendedPlan, analyses),
          type: 'recommended' as const
        });
      }
      
      // Add high-tier plan only if it exists and is different from recommended
      const highTierCard = parsedCards.find(c => c.type === 'high-tier');
      if (highTierCard) {
        finalCards.push(highTierCard);
      } else if (highTierPlan && highTierPlan !== recommendedPlan) {
        finalCards.push({
          ...generatePlanCard(highTierPlan, analyses),
          type: 'high-tier' as const
        });
      }
      
      // Determine grid columns based on number of cards
      const gridCols = finalCards.length === 1 
        ? 'md:grid-cols-1' 
        : finalCards.length === 2 
        ? 'md:grid-cols-2' 
        : 'md:grid-cols-3';
      
      return (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {planPicker.title || "Which plan should I choose?"}
          </h2>
          <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
            {finalCards.map((card, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all duration-200 p-6 ${
                  card.type === 'recommended' 
                    ? 'bg-indigo-50/30' 
                    : ''
                }`}
              >
                <h3 className="font-semibold text-gray-900 mb-3">{card.title}</h3>
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Best for</div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {card.bestFor.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {card.watchouts.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Watch-outs</div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {card.watchouts.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-orange-500 mt-1">⚠</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  if (cards.length === 0) {
    return null;
  }

  // Determine grid columns based on number of cards
  const gridCols = cards.length === 1 
    ? 'md:grid-cols-1' 
    : cards.length === 2 
    ? 'md:grid-cols-2' 
    : 'md:grid-cols-3';

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {planPicker?.title || "Which plan should I choose?"}
      </h2>
      <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`bg-white rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all duration-200 p-6 ${
              card.type === 'recommended' 
                ? 'bg-indigo-50/30' 
                : ''
            }`}
          >
            <h3 className="font-semibold text-gray-900 mb-3">{card.title}</h3>
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Best for</div>
              <ul className="text-sm text-gray-700 space-y-1">
                {card.bestFor.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {card.watchouts.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Watch-outs</div>
                <ul className="text-sm text-gray-600 space-y-1">
                  {card.watchouts.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">⚠</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
