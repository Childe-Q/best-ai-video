import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getTool, getAllTools, findBestAlternatives } from '@/lib/getTool';
import CTAButton from '@/components/CTAButton';
import { getSEOCurrentYear } from '@/lib/utils';
import AlternativesClient, { AlternativeGroup, AlternativeTool } from './AlternativesClient';
import alternativesEvidenceData from '@/data/alternativesEvidence.json';
import { alternativesEvidence as alternativesEvidenceTS } from '@/data/evidence/alternatives';

export async function generateStaticParams() {
  const tools = getAllTools();
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};

  const seoYear = getSEOCurrentYear();

  return {
    title: `Top ${tool.name} Alternatives & Competitors (${seoYear}) - Evidence Based`,
    description: `Looking for better than ${tool.name}? Compare top alternatives based on editing control, voice quality, pricing, and avatar features.`,
  };
}

// InVideo Alternatives Shortlist (affiliate-first)
const INVideo_SHORTLIST = ['invideo', 'heygen', 'fliki', 'veed-io', 'zebracat', 'synthesia', 'elai-io', 'pika'];

// Group definitions (only from shortlist)
const GROUPS = [
  {
    id: 'editing-control',
    title: 'A. Editing Control',
    description: 'Timeline-based editors for precise cuts and multi-track layering.',
    slugs: ['veed-io']
  },
  {
    id: 'stock-voice',
    title: 'B. Stock + Voice',
    description: 'Best for rapid repurposing and high-quality AI narration.',
    slugs: ['fliki', 'zebracat']
  },
  {
    id: 'predictable-pricing',
    title: 'C. Predictable Pricing',
    description: 'Tools with clearer limits or better free tiers.',
    slugs: ['veed-io', 'fliki']
  },
  {
    id: 'avatar-presenters',
    title: 'D. Avatar Presenters',
    description: 'Talking heads for sales, training, and localization.',
    slugs: ['heygen', 'synthesia', 'elai-io']
  }
];

// Helper to check if tool has affiliate link
function hasAffiliate(tool: any): boolean {
  return Boolean(
    tool.affiliate_link || 
    tool.affiliateLink || 
    tool.affiliate_url || 
    tool.affiliateUrl
  );
}

// Helper to check if a claim is valid (no [NEED VERIFICATION])
function isValidClaim(text: string): boolean {
  return !text.includes('[NEED VERIFICATION]') && text.trim().length > 0;
}

// Helper to clean claim (remove verification tags if any remaining, though we filter them out)
function cleanClaim(text: string): string {
  return text.replace(/\[NEED VERIFICATION.*?\]/g, '').trim();
}

// Helper to filter evidence links (only internal, max 3, deduplicated)
function filterEvidenceLinks(sources: { url: string }[]): string[] {
  const links = new Set<string>();
  sources.forEach(s => {
    const url = s.url;
    if (url && url.startsWith('/') && url !== '' && url !== '#') {
      links.add(url);
    }
  });
  return Array.from(links).slice(0, 3);
}

export default async function AlternativesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);

  if (!tool) notFound();

  // 1. If NOT InVideo, fallback to original simple list
  if (slug !== 'invideo') {
    // Fallback to original logic for other tools
    const tools = getAllTools();
    const alternativesWithTags = findBestAlternatives(tool, tools, 3);

    return (
      <section className="w-full bg-slate-50 py-16">
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-12 lg:px-24">
          <main className="max-w-3xl mx-auto space-y-12">
            <div className="text-center">
              <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
                Top 3 Alternatives to {tool.name} You Should Try
              </h1>
              <p className="text-xl text-gray-600">
                 Is {tool.name} too expensive or hard to use? Check out these top competitors.
              </p>
            </div>
            {/* Simple list rendering (kept from previous implementation) */}
            <div className="space-y-8">
               {alternativesWithTags.map(({ tool: alt, sharedTags }) => {
                 // Pick the first matching tag to display as the reason
                 const bestTag = sharedTags.length > 0 ? sharedTags[0] : null;
                 
                 return (
                   <div key={alt.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                      <div className="p-6 md:p-8 flex-1">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden ring-1 ring-slate-200">
                              {/* Simple Image Fallback */}
                              <span className="text-slate-700 font-semibold">{alt.name?.slice(0, 1) ?? '?'}</span>
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-gray-900">{alt.name}</h2>
                              <div className="text-sm text-gray-500">{alt.starting_price}</div>
                            </div>
                         </div>
                         <p className="text-gray-600 mb-6">
                           {alt.short_description}
                         </p>
                         {bestTag && (
                           <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6">
                             <p className="text-sm text-yellow-800 font-medium">
                               <strong>Best for {bestTag}:</strong> {alt.name} shares the same {bestTag.toLowerCase()} capabilities as {tool.name}.
                             </p>
                           </div>
                         )}
                         <CTAButton affiliateLink={alt.affiliate_link} hasFreeTrial={alt.has_free_trial} />
                      </div>
                   </div>
                 );
               })}
            </div>
          </main>
        </div>
      </section>
    );
  }

  // 2. Prepare Data for InVideo Alternatives
  // Merge evidence sources
  const evidenceMap = new Map<string, any>();
  
  // Add from JSON
  (alternativesEvidenceData as any[]).forEach(e => {
    evidenceMap.set(e.tool, e);
  });
  
  // Add from TS (Fliki)
  Object.values(alternativesEvidenceTS).forEach(e => {
    evidenceMap.set(e.tool, e);
  });

  // Construct Groups (only from shortlist + hasAffiliate filter)
  const groupData: AlternativeGroup[] = GROUPS.map(group => {
    const toolsInGroup = group.slugs
      .filter(slug => INVideo_SHORTLIST.includes(slug)) // Only from shortlist
      .map(s => {
        const t = getTool(s);
        if (!t || !hasAffiliate(t)) return null; // Must have affiliate link

        const evidence = evidenceMap.get(s);
        
        // Build card data (base from tool)
        const cardData: AlternativeTool = {
          id: t.id,
          slug: t.slug,
          name: t.name,
          logoUrl: t.logo_url,
          startingPrice: t.starting_price || 'Free Trial',
          affiliateLink: t.affiliate_link || '',
          hasFreeTrial: t.has_free_trial,
          bestFor: [],
          pickThisIf: null,
          whySwitch: [],
          tradeOff: null,
          pricingSignals: {},
          evidenceLinks: []
        };

        // Merge evidence if available
        if (evidence) {
          // Best For
          cardData.bestFor = (evidence.bestFor || evidence.best_for || [])
            .filter((tag: string) => isValidClaim(tag))
            .map((tag: string) => cleanClaim(tag))
            .slice(0, 3);
          
          // Fallback to tool.best_for if evidence missing
          if (cardData.bestFor.length === 0 && t.best_for) {
            cardData.bestFor = t.best_for.split(/[,&]/).map((s: string) => s.trim()).slice(0, 3);
          }

          // Why Switch (filter and clean)
          const validWhySwitch = (evidence.whySwitch || evidence.why_switch || [])
            .filter((item: any) => isValidClaim(item.claim))
            .map((item: any) => cleanClaim(item.claim));
            
          // Pick This If = first valid whySwitch
          if (validWhySwitch.length > 0) {
            cardData.pickThisIf = validWhySwitch[0];
            // Why Switch list = from 2nd item onwards, max 2 items
            cardData.whySwitch = validWhySwitch.slice(1, 3);
          }

          // Trade-off (filter and clean)
          const validTradeOffs = (evidence.tradeoffs || evidence.trade_offs || [])
            .filter((item: any) => isValidClaim(item.claim))
            .map((item: any) => cleanClaim(item.claim));
          if (validTradeOffs.length > 0) {
            cardData.tradeOff = validTradeOffs[0];
          }

          // Pricing Signals (only valid claims)
          if (evidence.pricingSignals || evidence.pricing_signals) {
            const signals = evidence.pricingSignals || evidence.pricing_signals;
            if (signals.freePlan && isValidClaim(signals.freePlan.claim)) {
              cardData.pricingSignals.freePlan = cleanClaim(signals.freePlan.claim);
            }
            if (signals.watermark && isValidClaim(signals.watermark.claim)) {
              cardData.pricingSignals.watermark = cleanClaim(signals.watermark.claim);
            }
            if (signals.exportQuality && isValidClaim(signals.exportQuality.claim)) {
              cardData.pricingSignals.exportQuality = cleanClaim(signals.exportQuality.claim);
            }
            if (signals.refundCancel && isValidClaim(signals.refundCancel.claim)) {
              cardData.pricingSignals.refundCancel = cleanClaim(signals.refundCancel.claim);
            }
          }

          // Evidence Links (collect from all sources, filter internal only, dedupe, max 3)
          const allSources: { url: string }[] = [];
          [...(evidence.whySwitch || evidence.why_switch || []), ...(evidence.tradeoffs || evidence.trade_offs || [])].forEach((item: any) => {
            if (item.sources && Array.isArray(item.sources)) {
              item.sources.forEach((s: any) => {
                if (s.url && isValidClaim(s.url)) { // Also check url itself for [NEED VERIFICATION]
                  allSources.push({ url: s.url });
                }
              });
            }
          });
          cardData.evidenceLinks = filterEvidenceLinks(allSources);
        } else {
          // Fallback content if no evidence found (but still require affiliate)
          cardData.bestFor = t.best_for?.split(/[,&]/).map((s: string) => s.trim()).slice(0, 3) || [];
          cardData.pickThisIf = t.short_description;
          cardData.whySwitch = (t.pros || []).slice(0, 2);
          cardData.tradeOff = t.cons?.[0] || null;
        }

        return cardData;
      })
      .filter((t): t is AlternativeTool => t !== null);

    return {
      id: group.id,
      title: group.title,
      description: group.description,
      tools: toolsInGroup
    };
  }).filter(g => g.tools.length > 0);

  return (
    <div className="w-full bg-slate-50 min-h-screen">
      <Suspense fallback={<div className="p-8 text-center">Loading alternatives...</div>}>
        <AlternativesClient groups={groupData} />
      </Suspense>
    </div>
  );
}
