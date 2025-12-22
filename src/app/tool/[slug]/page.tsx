import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import toolsData from '@/data/tools.json';
import { Tool } from '@/types/tool';
import ToolNav from '@/components/ToolNav';
import CTAButton from '@/components/CTAButton';
import PricingTable from '@/components/PricingTable';
import PricingSnapshot from '@/components/PricingSnapshot';
import Navbar from '@/components/Navbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import ToolLogo from '@/components/ToolLogo';
import { getSEOCurrentYear, hasFreePlan, getStartingPrice } from '@/lib/utils';

const tools: Tool[] = toolsData as Tool[];

function getTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

// Weighted Matching System: Find alternatives based on shared tags
// Priority: Always show Fliki, Zebracat, or Veed if they match the category
function findBestAlternatives(currentTool: Tool, allTools: Tool[], count: number = 3) {
  // Define affiliate tools (money tools) to prioritize
  const affiliateTools = ['fliki', 'zebracat', 'veed-io'];
  
  // Filter out the current tool
  const candidates = allTools.filter((t) => t.id !== currentTool.id);
  
  // Step 1: Find affiliate tools that match the category (have shared tags)
  const affiliateMatches: Array<{ tool: Tool; sharedTags: string[]; score: number }> = [];
  
  for (const affiliateSlug of affiliateTools) {
    const affiliateTool = candidates.find((t) => t.slug === affiliateSlug);
    if (affiliateTool) {
      const sharedTags = affiliateTool.tags.filter((tag) => currentTool.tags.includes(tag));
      // Even if they share 0 tags, we still want to show them (force them in)
      // But prioritize those with shared tags
      affiliateMatches.push({
        tool: affiliateTool,
        sharedTags,
        score: sharedTags.length + 10, // Add 10 to ensure they rank higher
      });
    }
  }
  
  // Sort affiliate matches by score (highest first)
  affiliateMatches.sort((a, b) => b.score - a.score);
  
  // Step 2: Get other candidates (excluding affiliate tools)
  const otherCandidates = candidates.filter(
    (t) => !affiliateTools.includes(t.slug.toLowerCase())
  );
  
  // Calculate shared tags for other candidates
  const otherScored = otherCandidates.map((candidate) => {
    const sharedTags = candidate.tags.filter((tag) => currentTool.tags.includes(tag));
    return {
      tool: candidate,
      sharedTags,
      score: sharedTags.length,
    };
  });
  
  // Sort other candidates by number of shared tags (highest first)
  otherScored.sort((a, b) => b.score - a.score);
  
  // Step 3: Combine results - affiliate tools first, then others
  // Always prioritize affiliate tools, even if they have 0 shared tags
  const allAlternatives = [
    ...affiliateMatches.map((item) => ({
      tool: item.tool,
      sharedTags: item.sharedTags,
    })),
    ...otherScored.map((item) => ({
      tool: item.tool,
      sharedTags: item.sharedTags,
    })),
  ];
  
  // Return top N alternatives (affiliate tools will be first)
  return allAlternatives.slice(0, count);
}

export async function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};

  const seoYear = getSEOCurrentYear();

  return {
    title: `${tool.name} Review, Pricing & Best Alternatives (${seoYear})`,
    description: `Is ${tool.name} worth it? In-depth review of pricing, features, pros & cons, and top competitors like ${tools.find(t => t.id !== tool.id)?.name}.`,
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);

  if (!tool) notFound();

  // Use weighted matching to find top 3 alternatives
  const alternativesWithTags = findBestAlternatives(tool, tools, 3);
  const seoYear = getSEOCurrentYear();

      return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
          <Navbar />
          
          {/* Main Content - Centered */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumbs */}
            <Breadcrumbs toolName={tool.name} toolSlug={tool.slug} />
      
            {/* 1. Hero Section */}
            <header className="bg-gray-50 border-b border-gray-200 py-12 md:py-20 rounded-lg mb-8">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6 flex justify-center">
            <ToolLogo logoUrl={tool.logo_url} toolName={tool.name} size="xl" withContainer={true} />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
            {tool.name} Review, Pricing & Best Alternatives ({seoYear})
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {tool.tagline}
          </p>
              </div>
            </header>

            <ToolNav toolSlug={tool.slug} />

            <main className="max-w-3xl mx-auto space-y-16">

        {/* 2. Quick Verdict */}
        <section className="bg-indigo-50/50 rounded-2xl p-8 border border-indigo-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded uppercase tracking-wide">Verdict</span>
            Is {tool.name} worth it?
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            <strong>Yes, if you are {tool.best_for}.</strong> It offers excellent value with its {tool.starting_price} starting price. 
            However, if you need more advanced features, you might want to consider alternatives below.
          </p>
          <CTAButton affiliateLink={`/go/${tool.slug}`} hasFreeTrial={tool.has_free_trial} />
        </section>

        {/* 3. Pricing Snapshot */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing</h2>
          
          {/* Compact Pricing Snapshot Table */}
          {tool.pricing_plans && tool.pricing_plans.length > 0 ? (
            <PricingSnapshot 
              plans={tool.pricing_plans} 
              affiliateLink={`/go/${tool.slug}`}
              toolSlug={tool.slug}
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-center">
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Starting Price</div>
                <div className="text-2xl font-bold text-gray-900">{getStartingPrice(tool)}</div>
                <div className="text-xs text-gray-500">per month</div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-center">
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Free Plan</div>
                <div className={`text-xl font-bold ${hasFreePlan(tool) ? 'text-green-600' : 'text-gray-900'}`}>
                  {hasFreePlan(tool) ? 'Yes' : 'No'}
                </div>
                <div className="text-xs text-gray-500">{hasFreePlan(tool) ? 'Forever free' : 'Paid only'}</div>
              </div>
              <div className="col-span-2 md:col-span-1 bg-gray-50 p-5 rounded-xl border border-gray-200 text-center flex flex-col justify-center items-center">
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Best For</div>
                <div className="text-sm font-bold text-gray-900 leading-tight">{tool.best_for}</div>
              </div>
            </div>
          )}
        </section>

        {/* 4. Pros & Cons */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Pros & Cons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-bold text-green-700 uppercase mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Pros
              </h3>
              <ul className="space-y-3">
                {tool.pros.map((pro, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-700 text-sm">
                    <span className="text-green-500 font-bold shrink-0">✓</span> {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-700 uppercase mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Cons
              </h3>
               <ul className="space-y-3">
                {tool.cons.map((con, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-700 text-sm">
                    <span className="text-red-500 font-bold shrink-0">✕</span> {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 4.5. Detailed Review with Logo */}
        {tool.long_review && (
          <section className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
              {tool.logo_url && (
                <div className="flex-shrink-0">
                  {tool.logo_url.endsWith('.svg') ? (
                    <div className="h-24 w-24 flex items-center justify-center">
                      <img 
                        src={tool.logo_url} 
                        alt={`${tool.name} Logo`}
                        className="h-full w-full max-h-24 max-w-24 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="relative h-24 w-24">
                      <Image
                        src={tool.logo_url}
                        alt={`${tool.name} Logo`}
                        fill
                        className="object-contain"
                        sizes="96px"
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">In-Depth Review</h2>
                <div 
                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: tool.long_review }}
                />
              </div>
            </div>
          </section>
        )}

        {/* 5. Best Alternatives */}
        <section>
           <div className="flex items-center justify-between mb-8">
             <h2 className="text-2xl font-bold text-gray-900">Top Alternatives</h2>
             <Link href={`/tool/${tool.slug}/alternatives`} className="text-indigo-600 font-medium hover:underline text-sm">
               Compare All Competitors →
             </Link>
          </div>
          <div className="space-y-6">
            {alternativesWithTags.map(({ tool: alt, sharedTags }) => {
              // Pick the first matching tag to display as the reason
              const bestTag = sharedTags.length > 0 ? sharedTags[0] : null;
              
              return (
                <div key={alt.id} className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                  <div className="h-14 w-14 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500 font-bold text-xl shrink-0">
                    {alt.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{alt.name}</h3>
                      {bestTag && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">
                          Best for {bestTag}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">Best for: <span className="text-gray-700 font-medium">{alt.best_for}</span></div>
                    <p className="text-sm text-gray-600 line-clamp-1">{alt.short_description}</p>
                  </div>
                  <CTAButton affiliateLink={`/go/${alt.slug}`} hasFreeTrial={alt.has_free_trial} size="sm" className="w-full md:w-auto" />
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. Bottom CTA */}
        <section className="bg-gray-900 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to try {tool.name}?</h2>
          <p className="text-gray-300 mb-8 max-w-lg mx-auto">
            Get started with {tool.name} today. {tool.has_free_trial ? 'Start your free trial now.' : 'Check the latest deal.'}
          </p>
          <CTAButton affiliateLink={`/go/${tool.slug}`} hasFreeTrial={tool.has_free_trial} size="lg" />
        </section>

            </main>
          </div>
        </div>
      );
    }
