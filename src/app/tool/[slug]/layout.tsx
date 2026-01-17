import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { getTool } from '@/lib/getTool';
import Breadcrumbs from '@/components/Breadcrumbs';
import ToolLogo from '@/components/ToolLogo';
import VerdictCard from '@/components/VerdictCard';
import CTAButton from '@/components/CTAButton';
import ToolTabs from '@/components/ToolTabs';
import { CheckBadgeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { LinkIcon, BookmarkIcon } from '@heroicons/react/24/outline';

interface ToolLayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function ToolLayout({ children, params }: ToolLayoutProps) {
  const { slug } = await params;
  const tool = getTool(slug);

  if (!tool) notFound();

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans">
      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 1. Breadcrumbs Row */}
        <div className="mb-6">
          <Breadcrumbs toolName={tool.name} toolSlug={tool.slug} />
        </div>

        {/* 2. THE GRID ROW - Left card, Key facts, and Verdict card in CSS Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px] lg:grid-rows-[auto_1fr] lg:items-stretch mb-8">
          {/* Left Column: Hero (Row 1, Col 1) */}
          <div className="lg:col-start-1 lg:row-start-1 flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 flex-1">
              <div className="flex flex-col md:flex-row gap-3 items-start">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-xl shadow-sm bg-white border border-gray-100 p-3 flex items-center justify-center">
                    <ToolLogo 
                      logoUrl={tool.logo_url} 
                      toolName={tool.name} 
                      size="lg" 
                      withContainer={false}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Title and Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {tool.name}
                      </h1>
                    </div>

                    {/* Rating and Reviews */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {tool.rating && (
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => {
                            const filled = tool.rating! - i;
                            const fillPercentage = Math.max(0, Math.min(100, filled * 100));
                            return (
                              <span key={i} className="relative inline-block text-lg" style={{ width: '1em', height: '1em' }}>
                                {/* Empty star background */}
                                <span className="absolute inset-0 text-gray-300">★</span>
                                {/* Filled star overlay */}
                                {fillPercentage > 0 && (
                                  <span 
                                    className="absolute inset-0 text-orange-500"
                                    style={{ 
                                      clipPath: `inset(0 ${100 - fillPercentage}% 0 0)`,
                                      WebkitClipPath: `inset(0 ${100 - fillPercentage}% 0 0)`
                                    }}
                                  >
                                    ★
                                  </span>
                                )}
                              </span>
                            );
                          })}
                          <span className="ml-1 text-sm text-gray-600">{tool.rating.toFixed(1)}</span>
                        </div>
                      )}
                      {tool.review_count && tool.review_count > 0 ? (
                        <span className="text-sm text-gray-600">{tool.review_count} user reviews</span>
                      ) : tool.rating ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Our score</span>
                          <span className="text-[10px] text-gray-400 leading-tight mt-0.5">Based on public docs + user feedback. Some limits vary by account.</span>
                        </div>
                      ) : null}
                      {tool.is_verified && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          <CheckBadgeIcon className="w-4 h-4" />
                          Verified
                        </div>
                      )}
                    </div>

                    {/* Main Headline / Tagline */}
                    <p className="text-base text-gray-600 mb-2">
                      {tool.tagline}
                    </p>

                    {/* AI Categories */}
                    {tool.categories && tool.categories.length > 0 && (
                      <div className="mb-2">
                        <div className="flex flex-wrap gap-2">
                          {tool.categories.map((category, idx) => (
                            <Link
                              key={idx}
                              href={`/?category=${encodeURIComponent(category)}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium"
                            >
                              {category}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pricing Model, Starting Price, and Active Deal */}
                    <div className="mb-2">
                      {/* 2-Column Grid for Pricing Info */}
                      {(tool.pricing_model || tool.starting_price) && (
                        <div className="grid grid-cols-2 gap-2 mb-1.5">
                          {tool.pricing_model && (
                            <div>
                              <div className="text-xs text-gray-500 uppercase mb-1">Pricing</div>
                              <div className="text-sm font-semibold text-gray-900">{tool.pricing_model}</div>
                            </div>
                          )}
                          {tool.starting_price && (
                            <div>
                              <div className="text-xs text-gray-500 uppercase mb-1">Starting</div>
                              <div className="text-sm font-semibold text-gray-900">{tool.starting_price}</div>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Active Deal - Full Width Highlighted */}
                      {tool.deal && (
                        <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium">
                          {tool.deal}
                        </div>
                      )}
                    </div>

                    {/* Follow Icons */}
                    {tool.social_links && (tool.social_links.twitter || tool.social_links.linkedin || tool.social_links.youtube || tool.social_links.instagram) && (
                      <div className="mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 font-medium mr-1">Follow:</span>
                          {tool.social_links.twitter && (
                            <a
                              href={tool.social_links.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-blue-500 transition-colors"
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
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              aria-label="LinkedIn"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                              </svg>
                            </a>
                          )}
                          {tool.social_links.youtube && (
                            <a
                              href={tool.social_links.youtube}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-red-600 transition-colors"
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
                              className="text-gray-400 hover:text-pink-600 transition-colors"
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

                    {/* Highlights */}
                    {(tool.highlights && tool.highlights.length > 0) || (tool.features && tool.features.length > 0) ? (
                      <div className="mb-2">
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Highlights</div>
                        <div className="flex flex-wrap gap-2">
                          {(tool.highlights && tool.highlights.length > 0
                            ? tool.highlights
                            : tool.features!.slice(0, 4)
                          ).map((item, idx) => (
                            <span
                              key={idx}
                              className="bg-gray-50 text-gray-700 text-xs px-2.5 py-1 rounded-md border border-gray-100"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                </div>
              </div>
            </div>
            {/* Footer Buttons (Pinned to bottom) */}
            <div className="p-4 pt-0 mt-auto flex gap-3">
              <CTAButton 
                affiliateLink={tool.affiliate_link}
                text={tool.deal ? 'Get the deal' : 'Visit Website'}
                size="md"
                className="flex-1"
              />
              <button
                className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                aria-label="Bookmark"
              >
                <BookmarkIcon className="w-4 h-4" />
                Bookmark
              </button>
            </div>
          </div>

          {/* Key Facts Block (Row 2, Col 1) */}
          {tool.key_facts && tool.key_facts.length > 0 && (
            <div className="lg:col-start-1 lg:row-start-2 h-full">
              <div className="bg-gray-50/30 border border-gray-200/60 rounded-md shadow-sm p-2.5 h-full flex flex-col">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Key Facts</h3>
                <ul className="space-y-1">
                  {tool.key_facts.map((fact, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-600 leading-tight">
                      <span className="text-indigo-500 font-bold shrink-0 mt-0.5">•</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Right Column: Verdict (Col 2, Spans both rows) */}
          {/* Removed shadow-sm and overflow-hidden to prevent shadow clipping/overlay issues */}
          <div className="lg:col-start-2 lg:row-span-2 flex flex-col h-full bg-slate-50 border border-slate-200 rounded-xl">
            <div className="p-4 flex-1">
              <VerdictCard
                reviewContent={tool.review_content || ''}
                affiliateLink={tool.affiliate_link}
                hasFreeTrial={tool.has_free_trial}
                rating={tool.rating}
                toolName={tool.name}
                bestFor={tool.best_for}
                startingPrice={tool.starting_price}
                embedded={true}
                verdictData={tool.content?.reviews?.verdict}
              />
            </div>
            {/* Footer CTA (Pinned to bottom) */}
            <div className="p-4 pt-0 mt-auto">
              <CTAButton affiliateLink={tool.affiliate_link} hasFreeTrial={tool.has_free_trial} className="w-full" />
            </div>
          </div>
        </div>
        {/* End of Grid Row */}

        {/* Tabs Navigation */}
        <ToolTabs slug={tool.slug} />

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
