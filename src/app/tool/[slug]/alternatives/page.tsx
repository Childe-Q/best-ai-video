import Link from 'next/link';
import { notFound } from 'next/navigation';
import toolsData from '@/data/tools.json';
import { Tool } from '@/types/tool';
import CTAButton from '@/components/CTAButton';
import ToolNav from '@/components/ToolNav';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getSEOCurrentYear } from '@/lib/utils';

const tools: Tool[] = toolsData as Tool[];

function getTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
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
    title: `Top 3 ${tool.name} Alternatives & Competitors (${seoYear})`,
    description: `Looking for better than ${tool.name}? Here are the 3 best alternatives for features, pricing, and ease of use.`,
  };
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

export default async function AlternativesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);

  if (!tool) notFound();

  // Use weighted matching to find top 3 alternatives
  const alternativesWithTags = findBestAlternatives(tool, tools, 3);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Main Content - Centered */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs toolName={tool.name} toolSlug={tool.slug} currentPage="Alternatives" />

        <ToolNav toolSlug={tool.slug} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        
        {/* 1. Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
            Top 3 Alternatives to {tool.name} You Should Try
          </h1>
          <p className="text-xl text-gray-600">
             Is {tool.name} too expensive or hard to use? Check out these top competitors.
          </p>
        </div>

        {/* 2. Alternatives List */}
        <div className="space-y-8">
           {alternativesWithTags.map(({ tool: alt, sharedTags }) => {
             // Pick the first matching tag to display as the reason
             const bestTag = sharedTags.length > 0 ? sharedTags[0] : null;
             
             return (
               <div key={alt.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                  <div className="p-6 md:p-8 flex-1">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="h-14 w-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0">
                          {alt.name.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{alt.name}</h2>
                          <div className="text-sm text-gray-500">{alt.starting_price}</div>
                        </div>
                     </div>
                     <p className="text-gray-600 mb-6">
                       {alt.short_description}
                     </p>
                     
                     {/* 3. Why Section with Shared Tag Badge */}
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

        {/* Bottom Section */}
        <div className="text-center pt-8 border-t border-gray-200">
           <h3 className="text-lg font-bold text-gray-900 mb-4">Still not sure?</h3>
           <p className="text-gray-600 mb-6">
             Stick with the market leader if you want stability.
           </p>
           <Link href={`/tool/${tool.slug}`} className="text-indigo-600 font-bold hover:underline">
             Read full {tool.name} Review →
           </Link>
        </div>

      </main>
      </div>
    </div>
  );
}

