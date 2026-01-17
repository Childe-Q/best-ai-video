import { notFound } from 'next/navigation';
import { getTool, getAllTools } from '@/lib/getTool';
import PricingCardsGrid from '@/components/PricingCardsGrid';
import CTAButton from '@/components/CTAButton';
import DisclosurePopover from '@/components/DisclosurePopover';
import DisclosureSection from '@/components/DisclosureSection';
import { getSEOCurrentYear, hasFreePlan, getStartingPrice } from '@/lib/utils';
import { ComparisonTable } from '@/types/tool';
import * as fs from 'fs';
import * as path from 'path';

// Helper function to get official pricing URL from sources
function getOfficialPricingUrl(slug: string): string | null {
  try {
    const projectRoot = process.cwd();
    const sourcesPath = path.join(projectRoot, 'src', 'data', 'sources', 'tools.sources.json');
    if (fs.existsSync(sourcesPath)) {
      const sourcesData = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));
      const toolSource = sourcesData.find((s: any) => s.slug === slug);
      if (toolSource?.official_urls?.pricing?.url) {
        return toolSource.official_urls.pricing.url;
      }
    }
  } catch (error) {
    // Silently fail
  }
  return null;
}

// Helper function to get last updated date (use current date for now)
function getLastUpdatedDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

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
    title: `${tool.name} Plans & Pricing ${seoYear}`,
    description: `Choose a plan that fits best for ${tool.name}. Compare pricing, features, and find the perfect plan for your needs.`,
  };
}

export default async function PricingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);

  if (!tool) notFound();

  const seoYear = getSEOCurrentYear();
  const pricingPlans = tool.pricing_plans || [];
  
  // Get comparison_table: first from tool, then fallback to pricing JSON file
  let comparisonTable: ComparisonTable | undefined = tool.comparison_table;
  
  // If not in tool, try to load from pricing JSON file
  if (!comparisonTable) {
    try {
      // In Next.js, we need to resolve from the project root
      const projectRoot = process.cwd();
      const pricingJsonPath = path.join(projectRoot, 'src', 'data', 'pricing', `${slug}.json`);
      
      if (fs.existsSync(pricingJsonPath)) {
        const pricingData = JSON.parse(fs.readFileSync(pricingJsonPath, 'utf-8'));
        if (pricingData.comparison_table) {
          comparisonTable = pricingData.comparison_table;
        }
      }
    } catch (error) {
      // Silently fail if pricing JSON doesn't exist or is invalid
      // console.warn(`[PricingPage] Could not load comparison_table from pricing JSON for ${slug}:`, error);
    }
  }

  // Layout: invideo uses compact layout, others use default
  const isInVideo = slug === 'invideo';
  const containerClass = isInVideo 
    ? 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
    : 'w-full max-w-[1600px] mx-auto px-4 md:px-12 lg:px-24';

  // Get official pricing URL and last updated date
  const officialPricingUrl = getOfficialPricingUrl(slug);
  const lastUpdated = getLastUpdatedDate();

  return (
    <section className="w-full bg-slate-50 py-16">
      <div className={containerClass}>
        <main className="py-8">
        
        {/* 1. Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            {tool.name} Plans & Pricing
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Compare plans, understand credit usage, and find the right tier for your production volume.
          </p>
          
          {/* Trust Bar: Last updated + Source + Disclosure */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
            <span>Last updated: {lastUpdated}</span>
            {officialPricingUrl && (
              <>
                <span>•</span>
                <span>
                  Source:{' '}
                  <a 
                    href={officialPricingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Official pricing page
                  </a>
                </span>
              </>
            )}
            <span>•</span>
            <DisclosurePopover />
          </div>
        </div>

        {/* 2. Pricing Snapshot */}
        {tool.content?.pricing?.snapshot ? (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing Snapshot</h2>
            <div className={`grid grid-cols-1 ${tool.content.pricing.snapshot.plans.length === 2 ? 'md:grid-cols-2' : tool.content.pricing.snapshot.plans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4 mb-4`}>
              {tool.content.pricing.snapshot.plans.map((plan, idx) => (
                <div 
                  key={idx} 
                  className={`border ${idx === 1 ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200'} rounded-lg p-4`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {plan.bullets.map((bullet, bulletIdx) => (
                      <li key={bulletIdx} className="list-disc list-inside">{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {tool.content.pricing.snapshot.note && (
              <p className="text-xs text-gray-500 text-center">
                {tool.content.pricing.snapshot.note}
              </p>
            )}
          </div>
        ) : pricingPlans.length > 0 && (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing Snapshot</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Free</h3>
                <p className="text-sm text-gray-600">Limited video minutes and exports with watermark</p>
              </div>
              <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50/30">
                <h3 className="font-semibold text-gray-900 mb-2">Starter</h3>
                <p className="text-sm text-gray-600">Higher limits, no watermark, basic AI features</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Pro</h3>
                <p className="text-sm text-gray-600">Advanced features, more credits, priority support</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Check official pricing for most up-to-date plans and features
            </p>
          </div>
        )}

        {/* 2a. How credits/minutes get used */}
        {tool.content?.pricing?.creditUsage && (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{tool.content.pricing.creditUsage.title}</h2>
            <ul className="text-sm text-gray-700 space-y-2">
              {tool.content.pricing.creditUsage.bullets.map((bullet: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 2b. Plan picker */}
        {tool.content?.pricing?.planPicker && (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{tool.content.pricing.planPicker.title}</h2>
            <ul className="text-sm text-gray-700 space-y-2">
              {tool.content.pricing.planPicker.bullets.map((bullet: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. Pricing Cards Grid */}
        <div className="mb-0">
          {pricingPlans.length > 0 ? (
            <PricingCardsGrid 
              plans={pricingPlans} 
              affiliateLink={tool.affiliate_link}
              hasFreeTrial={tool.has_free_trial}
              toolSlug={slug}
              comparisonTable={comparisonTable}
            />
          ) : (
            <div className="bg-white rounded-xl p-8 text-center mb-12">
              <p className="text-gray-500">Pricing information coming soon.</p>
            </div>
          )}
        </div>

        {/* Elegant Spacing - Pure Whitespace (connected but airy feel) */}
        {pricingPlans.length > 0 && (
          <div className={pricingPlans.length > 3 ? "mt-16" : "mt-16"}></div>
        )}

        {/* 4. Free vs Paid Plan Comparison Table */}
        {pricingPlans.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">Free vs Paid Plan</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-4xl mx-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-blue-50/50 border-b border-gray-200">
                    <th className="p-6 text-sm font-bold text-gray-500 w-1/3">Feature</th>
                    <th className="p-6 text-sm font-bold text-gray-900 w-1/3 border-l border-gray-200">Free</th>
                    <th className="p-6 text-sm font-bold text-indigo-600 w-1/3 border-l border-gray-200 bg-indigo-50/30">Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-6 text-sm text-gray-700 font-medium">Watermark</td>
                    <td className="p-6 text-sm text-gray-900 font-medium border-l border-gray-100">Yes</td>
                    <td className="p-6 text-sm text-indigo-600 font-bold border-l border-gray-100 bg-indigo-50/10">No</td>
                  </tr>
                  <tr>
                    <td className="p-6 text-sm text-gray-700 font-medium">Export Quality</td>
                    <td className="p-6 text-sm text-gray-900 font-medium border-l border-gray-100">Up to 1080p, watermarked (varies by account; older docs mention 720p)</td>
                    <td className="p-6 text-sm text-indigo-600 font-bold border-l border-gray-100 bg-indigo-50/10">1080p / 4K</td>
                  </tr>
                  <tr>
                    <td className="p-6 text-sm text-gray-700 font-medium">Weekly Limits</td>
                    <td className="p-6 text-sm text-gray-900 font-medium border-l border-gray-100">Up to 10 mins/week and 4 exports/week (limits can vary by account/region)</td>
                    <td className="p-6 text-sm text-indigo-600 font-bold border-l border-gray-100 bg-indigo-50/10">Higher limits based on plan</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 5. Verdict / Recommendation */}
        <section className="bg-indigo-50 rounded-xl p-8 border border-indigo-100 text-center max-w-4xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
            {tool.content?.pricing?.verdict?.title?.replace('{price}', getStartingPrice(tool)) || `Is ${tool.name} worth ${getStartingPrice(tool)}?`}
          </h2>
          <p className="text-gray-700 mb-6 leading-relaxed text-base md:text-lg">
            {tool.content?.pricing?.verdict?.text || `If you need to produce videos regularly and want to avoid manual asset sourcing, the time savings can justify the cost. The Free plan works for testing, but watermarks and limits make it unsuitable for publishing. Start with monthly billing to test your actual usage before committing to annual plans.`}
          </p>
          <CTAButton affiliateLink={tool.affiliate_link} hasFreeTrial={tool.has_free_trial} />
        </section>

        {/* 6. Disclosure Section */}
        <DisclosureSection />

        {/* 7. Footer Note */}
        <div className="text-center text-sm text-gray-500 mt-8">
          *Prices subject to change. Check official site for most up-to-date pricing.
        </div>

        </main>
      </div>
    </section>
  );
}

