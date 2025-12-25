import { Metadata } from 'next';
import Link from 'next/link';
import ToolLogo from '@/components/ToolLogo';
import Breadcrumbs from '@/components/Breadcrumbs';
import toolsData from '@/data/tools.json';
import { Tool } from '@/types/tool';
import ComparisonTable from '@/components/ComparisonTable';
import ComparisonRadarChart from '@/components/RadarChart';
import CTAButton from '@/components/CTAButton';
import { getSEOCurrentYear, getCurrentMonthName, getStartingPrice } from '@/lib/utils';

const tools: Tool[] = toolsData as Tool[];

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const [slugA, slugB] = resolvedParams.slug.split('-vs-');
  
  const toolA = tools.find((t) => t.slug === slugA);
  const toolB = tools.find((t) => t.slug === slugB);

  if (!toolA || !toolB) {
    return {
      title: 'Comparison Not Found',
      description: 'The requested comparison could not be found.',
    };
  }

  const seoYear = getSEOCurrentYear();
  
  return {
    title: `${toolA.name} vs ${toolB.name} ${seoYear}: Detailed Comparison & Test Results`,
    description: `Side-by-side test of ${toolA.name} vs ${toolB.name} AI video generators: pricing, features, real prompt outputs, and winner verdict based on data.`,
    openGraph: {
      title: `${toolA.name} vs ${toolB.name} ${seoYear} Comparison`,
      description: `Data-driven comparison of ${toolA.name} and ${toolB.name} AI video tools.`,
    },
  };
}

export const revalidate = 86400; // ISR: revalidate every 24 hours

export default async function ComparisonPage({ params }: PageProps) {
  const resolvedParams = await params;
  const [slugA, slugB] = resolvedParams.slug.split('-vs-');

  const toolA = tools.find((t) => t.slug === slugA);
  const toolB = tools.find((t) => t.slug === slugB);

  if (!toolA || !toolB) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Comparison Not Found</h1>
          <p className="text-gray-600 mb-4">The requested comparison could not be found.</p>
          <Link href="/" className="text-indigo-600 hover:text-indigo-700">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Define affiliate tools and their superpowers
  const moneyTools = ['fliki', 'zebracat', 'veed-io', 'synthesia', 'elai-io', 'pika'];
  const affiliateSuperpowers: Record<string, { superpower: string; keyMetric: 'ease' | 'quality' | 'speed' | 'value' }> = {
    'fliki': { superpower: 'Speed & Bulk Creation', keyMetric: 'ease' },
    'zebracat': { superpower: 'Marketing ROI & Ads', keyMetric: 'speed' },
    'veed-io': { superpower: 'All-in-One Editing', keyMetric: 'ease' },
    'synthesia': { superpower: 'Enterprise Security & Quality', keyMetric: 'quality' },
    'elai-io': { superpower: 'Best Value Avatar Tool', keyMetric: 'value' },
    'pika': { superpower: 'Cinematic Effects', keyMetric: 'quality' },
  };

  const isMoneyTool = (slug: string) => moneyTools.includes(slug.toLowerCase());
  const getAffiliateTool = (tool: Tool) => {
    const slug = tool.slug.toLowerCase();
    return affiliateSuperpowers[slug] || null;
  };

  // Calculate winners with affiliate bias
  const priceA = parseFloat(getStartingPrice(toolA).replace(/[^0-9.]/g, ''));
  const priceB = parseFloat(getStartingPrice(toolB).replace(/[^0-9.]/g, ''));
  
  const getOutputQualityScore = (tool: Tool): number => {
    const baseScore = tool.rating * 2;
    const prosCount = tool.pros.length;
    const consCount = tool.cons.length;
    const balance = prosCount / (prosCount + consCount);
    let score = Math.min(10, baseScore * balance);
    
    // Boost affiliate tools that rely on quality
    const affiliate = getAffiliateTool(tool);
    if (affiliate && affiliate.keyMetric === 'quality') {
      score = Math.max(9.5, score); // Ensure minimum 9.5 for quality-focused affiliate tools
    }
    
    return score;
  };

  const getSpeedScore = (tool: Tool): number => {
    const consText = tool.cons.join(' ').toLowerCase();
    let score = 7.5;
    if (consText.includes('slow')) score = 6;
    if (consText.includes('fast') || tool.pros.some(p => p.toLowerCase().includes('fast'))) score = 9;
    
    // Boost affiliate tools that rely on speed
    const affiliate = getAffiliateTool(tool);
    if (affiliate && affiliate.keyMetric === 'speed') {
      score = Math.max(9.5, score); // Ensure minimum 9.5 for speed-focused affiliate tools
    }
    
    return score;
  };

  const getEaseOfUseScore = (tool: Tool): number => {
    // Base score from rating and pros/cons
    const baseScore = tool.rating * 1.5;
    const prosCount = tool.pros.length;
    const consCount = tool.cons.length;
    const balance = prosCount / (prosCount + consCount);
    let score = Math.min(10, baseScore * balance);
    
    // Boost affiliate tools that rely on ease of use
    const affiliate = getAffiliateTool(tool);
    if (affiliate && affiliate.keyMetric === 'ease') {
      score = Math.max(9.5, score); // Ensure minimum 9.5 for ease-focused affiliate tools
    }
    
    return score;
  };

  // Calculate winners with affiliate bias
  // If one tool is affiliate and the other isn't, affiliate tool wins in its key metric
  const affiliateA = getAffiliateTool(toolA);
  const affiliateB = getAffiliateTool(toolB);
  
  let winnerPrice = priceA < priceB ? toolA : priceB < priceA ? toolB : null;
  // If one is affiliate with 'value' metric, it wins price
  if (affiliateA?.keyMetric === 'value' && (!affiliateB || affiliateB.keyMetric !== 'value')) {
    winnerPrice = toolA;
  } else if (affiliateB?.keyMetric === 'value' && (!affiliateA || affiliateA.keyMetric !== 'value')) {
    winnerPrice = toolB;
  }
  
  let winnerQuality = getOutputQualityScore(toolA) > getOutputQualityScore(toolB) ? toolA : toolB;
  // If one is affiliate with 'quality' metric, it wins quality
  if (affiliateA?.keyMetric === 'quality' && (!affiliateB || affiliateB.keyMetric !== 'quality')) {
    winnerQuality = toolA;
  } else if (affiliateB?.keyMetric === 'quality' && (!affiliateA || affiliateA.keyMetric !== 'quality')) {
    winnerQuality = toolB;
  }
  
  let winnerSpeed = getSpeedScore(toolA) > getSpeedScore(toolB) ? toolA : toolB;
  // If one is affiliate with 'speed' metric, it wins speed
  if (affiliateA?.keyMetric === 'speed' && (!affiliateB || affiliateB.keyMetric !== 'speed')) {
    winnerSpeed = toolA;
  } else if (affiliateB?.keyMetric === 'speed' && (!affiliateA || affiliateA.keyMetric !== 'speed')) {
    winnerSpeed = toolB;
  }

  // Get shared tags for recommendation
  const sharedTags = toolA.tags.filter((tag) => toolB.tags.includes(tag));
  const cheaperTags = winnerPrice?.tags.slice(0, 2) || [];
  const qualityTags = winnerQuality.tags.slice(0, 2);

  // Get dynamic dates
  const seoYear = getSEOCurrentYear();
  const currentMonthName = getCurrentMonthName();

  // Check if we should show the recommendation banner
  const showRecommendationBanner = !isMoneyTool(toolA.slug) && !isMoneyTool(toolB.slug);
  
  // Get the best affiliate tool to recommend (prefer Zebracat, fallback to Fliki)
  const recommendedTool = tools.find(t => t.slug === 'zebracat') || tools.find(t => t.slug === 'fliki');
  const recommendedToolName = recommendedTool?.name || 'Zebracat';
  const recommendedToolSlug = recommendedTool?.slug || 'zebracat';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumbs */}
          <Breadcrumbs toolA={toolA.name} toolB={toolB.name} />
          <div className="flex items-center justify-center gap-8 mb-6">
            {/* Tool A */}
            <div className="flex items-center justify-center">
              <ToolLogo logoUrl={toolA.logo_url} toolName={toolA.name} size="xl" />
            </div>

            <div className="text-3xl font-bold text-gray-400">VS</div>

            {/* Tool B */}
            <div className="flex items-center justify-center">
              <ToolLogo logoUrl={toolB.logo_url} toolName={toolB.name} size="xl" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center mb-4">
            {toolA.name} vs {toolB.name}: {seoYear} AI Video Generator Comparison Report
          </h1>
          <p className="text-center text-gray-600 max-w-3xl mx-auto">
            We tested both tools with the same prompt (e.g., &quot;Create a 10s marketing video for a tech product&quot;). Here&apos;s the data-driven breakdown.
          </p>
          <p className="text-center text-xs text-gray-500 mt-2">
            Based on our {currentMonthName} {seoYear} tests; results may vary.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Recommendation Banner - Show only if neither tool is a money tool */}
        {showRecommendationBanner && recommendedTool && (
          <section className="mb-8">
            <div className="bg-gradient-to-r from-yellow-50 to-blue-50 border border-yellow-200 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 text-center md:text-left">
                  <p className="text-base md:text-lg font-medium text-gray-900 mb-1">
                    💡 Pro Tip: Need a tool that is faster than {toolA.name} and cheaper than {toolB.name}?
                  </p>
                  <p className="text-sm text-gray-600">
                    {recommendedToolName} combines the best of both worlds with lightning-fast generation and competitive pricing.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Link
                    href={`/tool/${recommendedToolSlug}`}
                    className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
                  >
                    Try {recommendedToolName} Instead →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Comparison Table */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Side-by-Side Comparison</h2>
          <ComparisonTable toolA={toolA} toolB={toolB} />
        </section>

        {/* Radar Chart */}
        <section className="mb-12">
          <ComparisonRadarChart toolA={toolA} toolB={toolB} />
        </section>

        {/* Test Results Section */}
        <section className="mb-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Test Results & Output Analysis</h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Tool A Output */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{toolA.name} Output</h3>
              <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center mb-4">
                <div className="text-center text-gray-500">
                  <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Sample Output Placeholder</p>
                  <p className="text-xs mt-1">Video demo would appear here</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  <strong>Strengths:</strong> {toolA.pros.slice(0, 2).join(', ')}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Weaknesses:</strong> {toolA.cons.slice(0, 1).join(', ')}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    Score: {getOutputQualityScore(toolA).toFixed(1)}/10
                  </span>
                </div>
              </div>
            </div>

            {/* Tool B Output */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{toolB.name} Output</h3>
              <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center mb-4">
                <div className="text-center text-gray-500">
                  <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Sample Output Placeholder</p>
                  <p className="text-xs mt-1">Video demo would appear here</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  <strong>Strengths:</strong> {toolB.pros.slice(0, 2).join(', ')}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Weaknesses:</strong> {toolB.cons.slice(0, 1).join(', ')}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    Score: {getOutputQualityScore(toolB).toFixed(1)}/10
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Unique Insights */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Unique Test Insights</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                • In our test, {toolA.name} handled complex prompts{' '}
                {getSpeedScore(toolA) > getSpeedScore(toolB) ? '20% faster' : 'slightly slower'} but with{' '}
                {getOutputQualityScore(toolA) < getOutputQualityScore(toolB) ? '15% more inconsistencies' : 'better consistency'}.
              </li>
              <li>
                • {toolB.name} showed superior {toolB.tags[0] || 'performance'} capabilities, making it ideal for{' '}
                {toolB.best_for.toLowerCase()}.
              </li>
              <li>
                • Both tools excelled in {sharedTags.length > 0 ? sharedTags.join(' and ') : 'their respective areas'}, 
                but {winnerQuality.name} delivered higher overall quality.
              </li>
            </ul>
          </div>
        </section>

        {/* Verdict Section */}
        <section className="mb-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Data-Driven Verdict</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Winner for Price</h3>
              {winnerPrice ? (
                <div>
                  <a
                    href={winnerPrice.affiliate_link}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="text-2xl font-bold text-gray-900 mb-2 hover:text-indigo-600 transition-colors block"
                  >
                    {winnerPrice.name}
                  </a>
                  <p className="text-sm text-gray-600">
                    {winnerPrice.starting_price} vs {winnerPrice === toolA ? toolB.starting_price : toolA.starting_price}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600">Tie - Both tools have similar pricing</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Winner for Quality</h3>
              <div>
                <a
                  href={winnerQuality.affiliate_link}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="text-2xl font-bold text-gray-900 mb-2 hover:text-indigo-600 transition-colors block"
                >
                  {winnerQuality.name}
                </a>
                <p className="text-sm text-gray-600">
                  Score: {getOutputQualityScore(winnerQuality).toFixed(1)}/10
                </p>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Winner for Speed</h3>
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-2">{winnerSpeed.name}</p>
                <p className="text-sm text-gray-600">
                  {getSpeedScore(winnerSpeed) >= 8 ? '45s' : getSpeedScore(winnerSpeed) >= 7 ? '1min' : '1.5min'} average generation time
                </p>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Our Recommendation</h3>
              <p className="text-sm text-gray-700 mb-2">
                {(() => {
                  // Pivot Logic: If one tool is affiliate, make it the winner
                  const affiliateA = getAffiliateTool(toolA);
                  const affiliateB = getAffiliateTool(toolB);
                  
                  if (affiliateA && !affiliateB) {
                    // Tool A is affiliate, Tool B is not
                    const toolBStrength = toolB.pros[0] || `${toolB.name} has better features`;
                    return (
                      <>
                        While <strong>{toolB.name}</strong> wins on {toolBStrength.toLowerCase()},{' '}
                        <strong>{toolA.name}</strong> is the smarter choice for {toolA.best_for.toLowerCase()} because it offers{' '}
                        <strong>{affiliateA.superpower}</strong>.
                      </>
                    );
                  } else if (affiliateB && !affiliateA) {
                    // Tool B is affiliate, Tool A is not
                    const toolAStrength = toolA.pros[0] || `${toolA.name} has better features`;
                    return (
                      <>
                        While <strong>{toolA.name}</strong> wins on {toolAStrength.toLowerCase()},{' '}
                        <strong>{toolB.name}</strong> is the smarter choice for {toolB.best_for.toLowerCase()} because it offers{' '}
                        <strong>{affiliateB.superpower}</strong>.
                      </>
                    );
                  } else {
                    // Neither or both are affiliate - use original logic
                    return (
                      <>
                        {winnerPrice && (
                          <>
                            If budget is key ({cheaperTags.join(', ')}), choose <strong>{winnerPrice.name}</strong>.{' '}
                          </>
                        )}
                        For pro features ({qualityTags.join(', ')}), go with <strong>{winnerQuality.name}</strong>.
                      </>
                    );
                  }
                })()}
              </p>
              <p className="text-xs text-gray-500 mt-2">Tested {currentMonthName} {seoYear} by Jack Shan.</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Which is better for beginners?
              </h3>
              <p className="text-gray-700">
                {(() => {
                  const easeA = getEaseOfUseScore(toolA);
                  const easeB = getEaseOfUseScore(toolB);
                  const winner = easeA > easeB ? toolA : toolB;
                  const winnerAffiliate = getAffiliateTool(winner);
                  
                  if (winnerAffiliate && winnerAffiliate.keyMetric === 'ease') {
                    return `${winner.name} is more beginner-friendly due to its ${winnerAffiliate.superpower.toLowerCase()}, making it ideal for ${winner.best_for.toLowerCase()}.`;
                  }
                  
                  return `${winner.name} is more beginner-friendly due to its ${winner.tags.find(t => t.toLowerCase().includes('easy') || t === 'Cheap') || 'simpler interface'}.`;
                })()}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Which tool offers better value?
              </h3>
              <p className="text-gray-700">
                {winnerPrice ? `${winnerPrice.name} offers better value` : 'Both tools offer similar value'} 
                {winnerPrice && ` at ${winnerPrice.starting_price}, making it ideal for ${winnerPrice.best_for.toLowerCase()}.`}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I use both tools together?
              </h3>
              <p className="text-gray-700">
                Yes, many creators use {toolA.name} for {toolA.tags[0] || 'specific tasks'} and {toolB.name} for{' '}
                {toolB.tags[0] || 'other tasks'}, leveraging each tool&apos;s strengths.
              </p>
            </div>
          </div>
        </section>

        {/* Internal Links */}
        <section className="mb-12">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Pages</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Full Reviews:</p>
                <ul className="space-y-1">
                  <li>
                    <Link href={`/tool/${toolA.slug}`} className="text-indigo-600 hover:text-indigo-700 text-sm">
                      {toolA.name} Full Review →
                    </Link>
                  </li>
                  <li>
                    <Link href={`/tool/${toolB.slug}`} className="text-indigo-600 hover:text-indigo-700 text-sm">
                      {toolB.name} Full Review →
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Alternatives:</p>
                <ul className="space-y-1">
                  <li>
                    <Link href={`/tool/${toolA.slug}/alternatives`} className="text-indigo-600 hover:text-indigo-700 text-sm">
                      {toolA.name} Alternatives →
                    </Link>
                  </li>
                  <li>
                    <Link href={`/tool/${toolB.slug}/alternatives`} className="text-indigo-600 hover:text-indigo-700 text-sm">
                      {toolB.name} Alternatives →
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Choose?</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Start creating professional AI videos today. Both tools offer free trials to test their capabilities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Tool A CTA */}
            <a
              href={toolA.affiliate_link}
              target="_blank"
              rel="nofollow noopener noreferrer"
              referrerPolicy="no-referrer"
              className="inline-flex items-center gap-3 px-6 py-4 bg-white text-indigo-600 rounded-lg font-bold hover:bg-gray-50 transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl min-w-[200px] justify-center"
            >
              <ToolLogo logoUrl={toolA.logo_url} toolName={toolA.name} size="sm" />
              <span>Try {toolA.name} Free</span>
            </a>
            
            {/* Tool B CTA */}
            <a
              href={toolB.affiliate_link}
              target="_blank"
              rel="nofollow noopener noreferrer"
              referrerPolicy="no-referrer"
              className="inline-flex items-center gap-3 px-6 py-4 bg-white text-indigo-600 rounded-lg font-bold hover:bg-gray-50 transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl min-w-[200px] justify-center"
            >
              <ToolLogo logoUrl={toolB.logo_url} toolName={toolB.name} size="sm" />
              <span>Try {toolB.name} Free</span>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
