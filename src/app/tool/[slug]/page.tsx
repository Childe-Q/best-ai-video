import Link from 'next/link';
import { notFound } from 'next/navigation';
import toolsData from '@/data/tools.json';
import { Tool } from '@/types/tool';
import ToolNav from '@/components/ToolNav';
import CTAButton from '@/components/CTAButton';
import PricingSnapshot from '@/components/PricingSnapshot';
import Navbar from '@/components/Navbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import ToolLogo from '@/components/ToolLogo';
import { getSEOCurrentYear, hasFreePlan, getStartingPrice } from '@/lib/utils';
import { 
  BookmarkIcon, 
  CheckBadgeIcon,
  LinkIcon,
  HandThumbUpIcon,
  HandThumbDownIcon
} from '@heroicons/react/24/outline';

const tools: Tool[] = toolsData as Tool[];

function getTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

// Extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
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
  
  // Extract video ID from video_url
  const videoId = tool.video_url ? getYouTubeVideoId(tool.video_url) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans">
      <Navbar />
      
      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs - At the very top */}
        <div className="mb-4">
          <Breadcrumbs toolName={tool.name} toolSlug={tool.slug} />
        </div>
        
        {/* Two-Column Hero Section with Verdict Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-stretch">
          {/* Left Column - Hero Section (Span 2) */}
          <header className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col h-full">
            {/* Top Content Wrapper */}
            <div className="flex flex-row gap-6 flex-1">
              {/* Left: Logo (Fixed Size) */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-xl shadow-sm bg-white border border-gray-100 p-4 flex items-center justify-center">
                  <ToolLogo 
                    logoUrl={tool.logo_url} 
                    toolName={tool.name} 
                    size="lg" 
                    withContainer={false}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Right: Content */}
              <div className="flex-1 min-w-0">

              {/* Title Row */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  {tool.name}
                </h1>
                
                {/* Orange Stars + Review Count */}
                {tool.rating && (
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span 
                        key={i}
                        className={`text-lg ${i < Math.floor(tool.rating) ? 'text-orange-500' : 'text-gray-300'}`}
                      >
                        ★
                      </span>
                    ))}
                    <Link 
                      href="#reviews" 
                      className="ml-2 text-sm text-gray-600 hover:text-indigo-600 hover:underline"
                    >
                      {tool.review_count || 0} user reviews
                    </Link>
                  </div>
                )}

                {/* Verified Badge */}
                {tool.is_verified && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    <CheckBadgeIcon className="w-4 h-4" />
                    Verified
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-lg text-gray-600 mb-4">
                {tool.tagline}
              </p>

              {/* Meta Grid - Vertical List */}
              <div className="space-y-2 mb-6 text-sm">
                {/* AI Categories */}
                {tool.categories && tool.categories.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 font-medium min-w-[120px]">AI Categories:</span>
                    <div className="flex flex-wrap gap-2">
                      {tool.categories.map((category, idx) => (
                        <Link
                          key={idx}
                          href={`/?category=${encodeURIComponent(category)}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {category}
                          {idx < tool.categories!.length - 1 && ','}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing Model */}
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 font-medium min-w-[120px]">Pricing Model:</span>
                  <span className="text-gray-900">
                    {tool.pricing_model}, {tool.starting_price}
                  </span>
                </div>

                {/* Active Deal */}
                {tool.deal && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 font-medium min-w-[120px]">Active Deal:</span>
                    <span className="text-gray-900 font-bold">
                      {tool.deal}
                    </span>
                  </div>
                )}

                {/* Follow - Social Icons */}
                {tool.social_links && (tool.social_links.twitter || tool.social_links.linkedin || tool.social_links.youtube || tool.social_links.instagram) && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 font-medium min-w-[120px]">Follow:</span>
                    <div className="flex items-center gap-3">
                      {tool.social_links.twitter && (
                        <a
                          href={tool.social_links.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-blue-500 transition-colors"
                          aria-label="Twitter"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                        </a>
                      )}
                      {tool.social_links.linkedin && (
                        <a
                          href={tool.social_links.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-blue-600 transition-colors"
                          aria-label="LinkedIn"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                        </a>
                      )}
                      {tool.social_links.youtube && (
                        <a
                          href={tool.social_links.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-red-600 transition-colors"
                          aria-label="YouTube"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                        </a>
                      )}
                      {tool.social_links.instagram && (
                        <a
                          href={tool.social_links.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-pink-600 transition-colors"
                          aria-label="Instagram"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Key Highlights */}
              {tool.features && tool.features.length > 0 && (
                <div className="flex items-start gap-2 mb-6">
                  <span className="text-gray-500 font-medium min-w-[120px] text-sm">Highlights:</span>
                  <div className="flex flex-wrap gap-2">
                    {tool.features.slice(0, 4).map((feature, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Action Buttons - Sticky to Bottom */}
            <div className="flex items-center gap-3 mt-auto">
                {/* Primary Button */}
                <a
                  href={tool.affiliate_link}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                >
                  {tool.deal ? 'Get the deal' : 'Visit Website'}
                  <LinkIcon className="w-4 h-4" />
                </a>

                {/* Secondary Button - Bookmark */}
                <button
                  className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                  aria-label="Bookmark"
                >
                  <BookmarkIcon className="w-4 h-4" />
                  Bookmark
                </button>
            </div>
          </header>

          {/* Right Column - Verdict Card (Span 1) */}
          <div className="lg:col-span-1">
            <div className="bg-indigo-50/50 rounded-xl p-6 border border-indigo-100 h-full flex flex-col">
              {tool.review_content ? (
                <div className="flex-1 mb-6">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide font-medium">Verdict</span>
                  </div>
                  <div 
                    className="prose prose-lg prose-blue max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: tool.review_content }}
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded uppercase tracking-wide">Verdict</span>
                    Is {tool.name} worth it?
                  </h2>
                  <p className="text-lg text-gray-700 leading-loose mb-6 flex-1">
                    <strong>Yes, if you are {tool.best_for}.</strong> It offers excellent value with its {tool.starting_price} starting price. 
                    However, if you need more advanced features, you might want to consider alternatives below.
                  </p>
                </>
              )}
              <CTAButton affiliateLink={tool.affiliate_link} hasFreeTrial={tool.has_free_trial} />
            </div>
          </div>
        </div>

        {/* Two Column Layout - Grid for proper sticky positioning */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column - Main Content (Span 2 columns) */}
          <div className="lg:col-span-2 space-y-8">

            {/* Video Section */}
            {videoId && (
              <div className="my-12">
                <h2 className="text-2xl font-bold mb-6">Watch {tool.name} in Action</h2>
                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                <a 
                  href="#what-is" 
                  className="py-4 px-1 border-b-2 border-indigo-600 text-indigo-600 font-medium text-sm"
                >
                  What is {tool.name}?
                </a>
                <a 
                  href="#reviews" 
                  className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
                >
                  Reviews
                </a>
                <a 
                  href="#alternatives" 
                  className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
                >
                  Alternatives
                </a>
              </nav>
            </div>

            {/* Tab Content: What is [Tool]? */}
            <section id="what-is" className="space-y-8 max-w-3xl">
              {/* Pricing Snapshot - Card Style */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Pricing</h2>
                {tool.pricing_plans && tool.pricing_plans.length > 0 ? (
                  <PricingSnapshot 
                    plans={tool.pricing_plans} 
                    affiliateLink={tool.affiliate_link}
                    toolSlug={tool.slug}
                  />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 text-center">
                      <div className="text-xs font-bold text-gray-400 uppercase mb-1">Starting Price</div>
                      <div className="text-2xl font-bold text-gray-900">{getStartingPrice(tool)}</div>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 text-center">
                      <div className="text-xs font-bold text-gray-400 uppercase mb-1">Free Plan</div>
                      <div className={`text-xl font-bold ${hasFreePlan(tool) ? 'text-green-600' : 'text-gray-900'}`}>
                        {hasFreePlan(tool) ? 'Yes' : 'No'}
                      </div>
                    </div>
                    <div className="col-span-2 md:col-span-1 bg-gray-50 p-5 rounded-xl border border-gray-200 text-center">
                      <div className="text-xs font-bold text-gray-400 uppercase mb-1">Best For</div>
                      <div className="text-sm font-bold text-gray-900">{tool.best_for}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pros & Cons - Card Grid Style */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pros Column */}
                <div className="bg-green-50/50 rounded-xl p-6 border border-green-100">
                  <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                    <HandThumbUpIcon className="w-5 h-5" />
                    Pros
                  </h3>
                  <ul className="space-y-3">
                    {tool.pros.map((pro, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700 text-sm">
                        <span className="text-green-500 font-bold shrink-0">✓</span> {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Cons Column */}
                <div className="bg-red-50/50 rounded-xl p-6 border border-red-100">
                  <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
                    <HandThumbDownIcon className="w-5 h-5" />
                    Cons
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

              {/* Detailed Review - Card Style */}
              {tool.long_review && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">In-Depth Review</h2>
                  <div 
                    className="prose prose-lg prose-blue max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: tool.long_review }}
                  />
                </div>
              )}

              {/* Key Features */}
              {tool.features && tool.features.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tool.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-gray-700">
                        <span className="text-indigo-600 font-bold">•</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Who is Using (Target Audience) */}
              {tool.target_audience_list && tool.target_audience_list.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Who is Using {tool.name}?</h2>
                  <div className="flex flex-wrap gap-2">
                    {tool.target_audience_list.map((audience, idx) => (
                      <span 
                        key={idx}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                      >
                        {audience}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Tab Content: Reviews */}
            <section id="reviews" className="space-y-8 max-w-3xl prose prose-gray">
              {/* What Users Are Saying Section */}
              {tool.user_sentiment && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">📢 What Users Are Saying (Sentiment Summary)</h2>
                  <p className="text-gray-700 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: tool.user_sentiment.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                  <p className="text-xs text-gray-500 italic">Summarized from verified reviews on Product Hunt & G2</p>
                </div>
              )}

              {/* Frequently Asked Questions Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {tool.faqs && tool.faqs.length > 0 ? (
                    tool.faqs.map((faq, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-6 mb-4">
                        <h3 className="font-bold text-gray-900 mb-2">{faq.question}</h3>
                        <p className="text-gray-700 text-sm leading-relaxed">{faq.answer}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No FAQs available yet.</p>
                  )}
                </div>
              </div>
            </section>

            {/* Tab Content: Alternatives */}
            <section id="alternatives" className="max-w-3xl">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Top Alternatives</h2>
                  <Link href={`/tool/${tool.slug}/alternatives`} className="text-indigo-600 font-medium hover:underline text-sm">
                    Compare All →
                  </Link>
                </div>
                <div className="space-y-0">
                  {alternativesWithTags.map(({ tool: alt, sharedTags }, index) => {
                    const bestTag = sharedTags.length > 0 ? sharedTags[0] : null;
                    const isLast = index === alternativesWithTags.length - 1;
                    
                    return (
                      <div 
                        key={alt.id} 
                        className={`flex items-center gap-4 py-4 ${!isLast ? 'border-b border-gray-200' : ''}`}
                      >
                        {/* Left: Logo */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                            <ToolLogo 
                              logoUrl={alt.logo_url} 
                              toolName={alt.name} 
                              size="md" 
                              withContainer={false}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                        
                        {/* Middle: Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link href={`/tool/${alt.slug}`} className="font-bold text-gray-900 hover:text-gray-700 no-underline">
                              {alt.name}
                            </Link>
                            {bestTag && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                                {bestTag}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-1">{alt.short_description}</p>
                        </div>
                        
                        {/* Right: Action Button */}
                        <div className="flex-shrink-0">
                          <Link
                            href={`/tool/${alt.slug}`}
                            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 text-sm font-medium rounded-lg transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Sidebar (Span 1 column) */}
          <aside className="lg:col-span-1">
            {/* The Sticky Wrapper - This is where sticky is applied */}
            <div className="sticky top-24 flex flex-col gap-6">
              {/* Unlock AI Mastery Promo Box */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <h3 className="text-xl font-bold mb-2">Unlock AI Mastery</h3>
                <p className="text-indigo-100 text-sm mb-4">
                  Join thousands of creators mastering AI video tools. Get exclusive tips, tutorials, and early access to new tools.
                </p>
                <button className="w-full bg-white text-indigo-600 font-bold py-3 px-4 rounded-lg hover:bg-indigo-50 transition-colors">
                  Subscribe to Newsletter
                </button>
              </div>

              {/* Related Tools */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Related Tools</h3>
                <div className="space-y-4">
                  {alternativesWithTags.slice(0, 3).map(({ tool: alt }) => (
                    <Link 
                      key={alt.id}
                      href={`/tool/${alt.slug}`}
                      className="block group"
                    >
                      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-white border border-gray-100">
                          <ToolLogo 
                            logoUrl={alt.logo_url} 
                            toolName={alt.name} 
                            size="sm" 
                            withContainer={false}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 group-hover:text-indigo-600 text-sm">
                            {alt.name}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-1">{alt.tagline}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
