import Link from 'next/link';
import { Tool } from '@/types/tool';
import { ToolContent } from '@/types/toolContent';
import { getSEOCurrentYear } from '@/lib/utils';
import { getRelatedLinks } from '@/lib/getRelatedLinks';
import { loadToolContent } from '@/lib/loadToolContent';
import CTAButton from '@/components/CTAButton';

interface ToolFeaturesPageTemplateProps {
  tool: Tool;
  slug: string;
}

interface FeaturesPageData {
  bestForTags: string[];
  keyCapabilities: Array<{ title: string; desc?: string }>;
  deepDives?: Array<{ title: string; summary?: string; bullets: string[] }>;
  additionalUtilities?: Array<{ title: string; description: string }>;
  additionalDetails?: {
    exportFormats?: string[];
    languages?: string;
    integrations?: string[];
    teamFeatures?: string[];
  };
  sources?: Array<{ label: string; url: string }>;
}

export default function ToolFeaturesPageTemplate({ tool, slug }: ToolFeaturesPageTemplateProps) {
  const seoYear = getSEOCurrentYear();
  
  // Load content JSON if available
  const content = loadToolContent(slug);
  
  // Generate H1 title
  const h1Title = `${tool.name} Features (${seoYear})`;
  
  // Generate subtitle
  const subtitle = tool.tagline || 
    (tool.categories && tool.categories.length > 0 
      ? `${tool.categories[0]} tool for ${tool.best_for?.toLowerCase() || 'content creators'}`
      : `Everything you need to know about ${tool.name}'s capabilities.`);
  
  // Generate highlights chips (3-5 items)
  const highlights = generateHighlights(tool, content);
  
  // Build structured features page data
  const featuresData = buildFeaturesPageData(tool, content, slug);
  
  // Get related links
  const relatedLinks = getRelatedLinks(slug);

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24 font-sans">
      {/* Hero Section */}
      <header className="bg-white border-b border-gray-200 pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-3">
            {h1Title}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6 leading-relaxed">
            {subtitle}
          </p>
          
          {/* Highlights Chips */}
          {highlights.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {highlights.map((highlight, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                >
                  {highlight}
                </span>
              ))}
            </div>
          )}
          
          {/* Anchor link to deep dives */}
          {featuresData.deepDives && featuresData.deepDives.length > 0 && (
            <a 
              href="#feature-deep-dives" 
              className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors"
            >
              Jump to deep dives ↓
            </a>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* 1. Who it's best for */}
        {featuresData.bestForTags.length > 0 && (
          <section className="bg-white rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all duration-200 p-8 sm:p-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Who it's best for</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {featuresData.bestForTags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white text-slate-900 border border-gray-300 shadow-sm hover:bg-indigo-50 hover:border-indigo-300 hover:text-slate-900 transition-colors duration-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 2. Key Capabilities */}
        {featuresData.keyCapabilities.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Key Capabilities</h2>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {featuresData.keyCapabilities.map((capability, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start p-4 bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] transition-all duration-200 group"
                >
                  <div className="flex-shrink-0 h-2 w-2 rounded-full bg-indigo-500 mr-3 mt-1.5 group-hover:scale-125 transition-transform"></div>
                  <div className="flex-1 min-w-0">
                    <span className="text-base font-semibold text-gray-700 block leading-[1.65]">{capability.title}</span>
                    {capability.desc && (
                      <span className="text-base text-gray-600 mt-2 block leading-[1.65]">{capability.desc}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. Feature Deep Dives */}
        {featuresData.deepDives && featuresData.deepDives.length > 0 && (
          <section id="feature-deep-dives">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Feature Deep Dives</h2>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuresData.deepDives.map((dive, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all duration-200 p-6 md:p-8 flex flex-col h-full"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{dive.title}</h3>
                  {dive.summary && (
                    <p className="text-base text-gray-600 mb-6 leading-[1.65] border-b border-gray-100 pb-4">
                      {dive.summary}
                    </p>
                  )}
                  <ul className="space-y-3 flex-1">
                    {dive.bullets.map((bullet, bIdx) => {
                      const isVerificationNeeded = bullet.includes('[NEED VERIFICATION]');
                      const cleanBullet = bullet.replace('[NEED VERIFICATION]', '').trim();
                      
                      return (
                        <li key={bIdx} className="text-base text-gray-700 leading-[1.65] flex items-start gap-2.5">
                          <span className="text-indigo-500 mt-1.5 font-bold text-sm">●</span>
                          <span className="font-semibold">
                            {cleanBullet}
                            {isVerificationNeeded && (
                              <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wide">
                                Verification needed
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Additional Utilities */}
        {featuresData.additionalUtilities && featuresData.additionalUtilities.length > 0 && (
          <section>
            <details className="group bg-white rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all duration-200 overflow-hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-gray-50 transition-colors">
                <span className="text-xl font-bold text-gray-900">Additional Utilities</span>
                <span className="text-sm text-gray-500 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="px-6 pb-6 pt-0 border-t border-gray-100 mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
                  {featuresData.additionalUtilities.map((util, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition-all duration-200">
                      <h4 className="font-semibold text-gray-900 text-base mb-2 leading-[1.65]">{util.title}</h4>
                      <p className="text-base text-gray-600 line-clamp-2 leading-[1.65]">{util.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </section>
        )}

        {/* 5. Additional Details */}
        {featuresData.additionalDetails && (
          ((featuresData.additionalDetails.exportFormats && featuresData.additionalDetails.exportFormats.length > 0) ||
           featuresData.additionalDetails.languages ||
           (featuresData.additionalDetails.integrations && featuresData.additionalDetails.integrations.length > 0) ||
           (featuresData.additionalDetails.teamFeatures && featuresData.additionalDetails.teamFeatures.length > 0)) && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Additional Details</h2>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuresData.additionalDetails.exportFormats && featuresData.additionalDetails.exportFormats.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Export Formats</h3>
                    <div className="flex flex-wrap gap-2">
                      {featuresData.additionalDetails.exportFormats.map((format, idx) => (
                        <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200">
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {featuresData.additionalDetails.languages && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Languages</h3>
                    <p className="text-sm text-gray-600">
                      Supports {featuresData.additionalDetails.languages} languages
                    </p>
                  </div>
                )}
                
                {featuresData.additionalDetails.integrations && featuresData.additionalDetails.integrations.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Integrations</h3>
                    <div className="flex flex-wrap gap-2">
                      {featuresData.additionalDetails.integrations.map((integration, idx) => (
                        <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200">
                          {integration}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {featuresData.additionalDetails.teamFeatures && featuresData.additionalDetails.teamFeatures.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Team Features</h3>
                    <ul className="space-y-2">
                      {featuresData.additionalDetails.teamFeatures.map((feature, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-indigo-500 mt-1">•</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )
        )}

        {/* 6. Sources / Methodology */}
        {featuresData.sources && featuresData.sources.length > 0 && (
          <section>
            <details className="group bg-white rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all duration-200 overflow-hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-gray-50 transition-colors">
                <span className="text-lg font-bold text-gray-900">Sources / Methodology</span>
                <span className="text-sm text-gray-500 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="px-6 pb-6 pt-0 border-t border-gray-100 mt-0">
                <ul className="space-y-2 pt-6">
                  {featuresData.sources.map((source, idx) => (
                    <li key={idx} className="text-sm text-gray-600">
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 hover:opacity-80 transition-colors"
                      >
                        {source.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </section>
        )}

        {/* Internal Links */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Learn More</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href={`/tool/${slug}/pricing`}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 transition-colors"
            >
              Pricing →
            </Link>
            <Link 
              href={`/tool/${slug}/reviews`}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 transition-colors"
            >
              Reviews →
            </Link>
            {relatedLinks.comparisons && relatedLinks.comparisons.length > 0 && (
              <>
                {relatedLinks.comparisons.slice(0, 2).map((comp, idx) => (
                  <Link
                    key={idx}
                    href={comp.href}
                    className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 transition-colors"
                  >
                    {comp.title} →
                  </Link>
                ))}
              </>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <CTAButton 
            affiliateLink={tool.affiliate_link} 
            hasFreeTrial={tool.has_free_trial}
            text="Get Started"
            size="lg"
          />
        </section>
      </main>
    </div>
  );
}

// Helper functions

function buildFeaturesPageData(tool: Tool, content: ToolContent | null, slug: string): FeaturesPageData {
  return {
    bestForTags: generateBestForTags(tool, content, slug),
    keyCapabilities: generateKeyCapabilities(tool, content),
    deepDives: generateDeepDives(tool, content),
    additionalUtilities: generateAdditionalUtilities(tool, content),
    additionalDetails: generateAdditionalDetails(tool, content),
    sources: generateSources(tool, content)
  };
}

function generateBestForTags(tool: Tool, content: ToolContent | null, slug: string): string[] {
  // Priority 1: InVideo-specific (hardcoded)
  if (slug === 'invideo') {
    return [
      'Faceless YouTube Shorts creators',
      'Social media managers (high volume)',
      'Small marketing teams (ads & promos)'
    ];
  }
  
  // Priority 2: content.reviews.verdict.bestFor (array of tags)
  if (content?.reviews?.verdict?.bestFor) {
    if (Array.isArray(content.reviews.verdict.bestFor)) {
      return content.reviews.verdict.bestFor;
    } else if (typeof content.reviews.verdict.bestFor === 'string') {
      return [content.reviews.verdict.bestFor];
    }
  }
  
  // Priority 3: content.overview.tldr.bestFor (single string, extract tags if possible)
  if (content?.overview?.tldr?.bestFor) {
    // Try to extract tags from the string (e.g., "creators, teams, marketers")
    const tags = content.overview.tldr.bestFor
      .split(/[,&]/)
      .map(t => t.trim())
      .filter(t => t.length > 0 && t.length < 50); // Filter out long sentences
    if (tags.length > 0 && tags.every(t => t.length < 30)) {
      return tags;
    }
  }
  
  // Priority 4: tool.categories (as tags)
  if (tool.categories && tool.categories.length > 0) {
    return tool.categories.slice(0, 3);
  }
  
  // Priority 5: tool.tags (filter out generic/descriptive ones)
  if (tool.tags && tool.tags.length > 0) {
    const validTags = tool.tags.filter(tag => {
      const lower = tag.toLowerCase();
      // Exclude generic/descriptive tags - must be short, no "&", no descriptive words
      return !lower.includes('&') && 
             !lower.includes('outreach') &&
             !lower.includes('l&d') &&
             tag.length < 30 &&
             tag.length > 0;
    });
    if (validTags.length > 0) {
      return validTags.slice(0, 3);
    }
  }
  
  // Priority 6: tool.target_audience_list (only if it's tags, not sentences)
  if (tool.target_audience_list && tool.target_audience_list.length > 0) {
    // Check if they look like tags (short, no "&", no long descriptions, no descriptive words)
    const tagLike = tool.target_audience_list.filter(aud => {
      const lower = aud.toLowerCase();
      return aud.length < 30 && 
             aud.length > 0 &&
             !aud.includes('&') && 
             !lower.includes('outreach') &&
             !lower.includes('l&d') &&
             !lower.includes('teams') &&
             !lower.includes('and');
    });
    if (tagLike.length > 0) {
      return tagLike.slice(0, 3);
    }
  }
  
  // Priority 7: tool.best_for (ONLY if it's a short tag, not a descriptive sentence)
  // Reject if contains "&", "and", "outreach", "L&D", or is too long
  if (tool.best_for) {
    const lower = tool.best_for.toLowerCase();
    const isDescriptive = tool.best_for.includes('&') || 
                         lower.includes('outreach') ||
                         lower.includes('l&d') ||
                         lower.includes(' and ') ||
                         tool.best_for.length >= 30;
    
    if (!isDescriptive && tool.best_for.length > 0) {
      return [tool.best_for];
    }
  }
  
  // If nothing found, return empty array (don't show the section)
  return [];
}

function generateKeyCapabilities(tool: Tool, content: ToolContent | null): Array<{ title: string; desc?: string }> {
  const capabilities: Array<{ title: string; desc?: string }> = [];
  
  // Priority 1: content.features.keyFeatures
  if (content?.features?.keyFeatures && content.features.keyFeatures.length > 0) {
    content.features.keyFeatures.forEach(feature => {
      capabilities.push({ title: feature });
    });
  }
  
  // Priority 2: content.features.detailedFeatures (map to keyCapabilities)
  if (capabilities.length < 6 && content?.features?.detailedFeatures && content.features.detailedFeatures.length > 0) {
    content.features.detailedFeatures.forEach(feature => {
      if (!capabilities.find(c => c.title === feature.title)) {
        capabilities.push({
          title: feature.title,
          desc: feature.description
        });
      }
    });
  }
  
  // Priority 3: tool.features
  if (capabilities.length < 6 && tool.features && tool.features.length > 0) {
    tool.features.forEach(feature => {
      if (!capabilities.find(c => c.title === feature)) {
        capabilities.push({ title: feature });
      }
    });
  }
  
  // Priority 4: tool.featureCards (map to keyCapabilities)
  if (capabilities.length < 6 && tool.featureCards && tool.featureCards.length > 0) {
    tool.featureCards.forEach(card => {
      if (!capabilities.find(c => c.title === card.title)) {
        capabilities.push({
          title: card.title,
          desc: card.description
        });
      }
    });
  }
  
  return capabilities.slice(0, 10);
}

function generateDeepDives(tool: Tool, content: ToolContent | null): Array<{ title: string; summary?: string; bullets: string[] }> | undefined {
  if (tool.feature_groups && tool.feature_groups.length > 0) {
    return tool.feature_groups.map(group => ({
      title: group.title,
      summary: group.summary,
      bullets: group.bullets || []
    }));
  }
  
  return undefined;
}

function generateAdditionalUtilities(tool: Tool, content: ToolContent | null): Array<{ title: string; description: string }> | undefined {
  // Only show if feature_groups exists (to avoid duplication)
  if (tool.feature_groups && tool.featureCards && tool.featureCards.length > 0) {
    return tool.featureCards.map(card => ({
      title: card.title,
      description: card.description || ''
    }));
  }
  
  return undefined;
}

function generateAdditionalDetails(tool: Tool, content: ToolContent | null): {
  exportFormats?: string[];
  languages?: string;
  integrations?: string[];
  teamFeatures?: string[];
} | undefined {
  const exportFormats = extractExportFormats(tool, content);
  const languages = extractLanguages(tool, content);
  const integrations = extractIntegrations(tool, content);
  const teamFeatures = extractTeamFeatures(tool, content);
  
  // Only return if at least one field has data
  if (exportFormats.length > 0 || languages || integrations.length > 0 || teamFeatures.length > 0) {
    return {
      exportFormats: exportFormats.length > 0 ? exportFormats : undefined,
      languages,
      integrations: integrations.length > 0 ? integrations : undefined,
      teamFeatures: teamFeatures.length > 0 ? teamFeatures : undefined
    };
  }
  
  return undefined;
}

function generateSources(tool: Tool, content: ToolContent | null): Array<{ label: string; url: string }> | undefined {
  if (content?.sources) {
    return Object.entries(content.sources).map(([key, source]) => ({
      label: key,
      url: `https://${key}` // Construct URL from source key
    }));
  }
  
  return undefined;
}

function generateHighlights(tool: Tool, content: ToolContent | null): string[] {
  const highlights: string[] = [];
  
  // Priority 1: Use tool.highlights if available
  if (tool.highlights && tool.highlights.length > 0) {
    highlights.push(...tool.highlights.slice(0, 5));
  }
  
  // Priority 2: Use content.features.keyFeatures if available
  if (highlights.length < 5 && content?.features?.keyFeatures && content.features.keyFeatures.length > 0) {
    const contentHighlights = content.features.keyFeatures
      .filter((f: string) => !highlights.includes(f))
      .slice(0, 5 - highlights.length)
      .map((f: string) => f.length > 30 ? f.substring(0, 30) + '...' : f);
    highlights.push(...contentHighlights);
  }
  
  // Priority 3: Extract from tool.features if needed
  if (highlights.length < 3 && tool.features && tool.features.length > 0) {
    const featureHighlights = tool.features
      .filter(f => !highlights.includes(f))
      .slice(0, 5 - highlights.length)
      .map(f => f.length > 30 ? f.substring(0, 30) + '...' : f);
    highlights.push(...featureHighlights);
  }
  
  // Priority 4: Extract from tags if still needed
  if (highlights.length < 3 && tool.tags && tool.tags.length > 0) {
    const tagHighlights = tool.tags
      .filter(t => !highlights.includes(t))
      .slice(0, 3 - highlights.length);
    highlights.push(...tagHighlights);
  }
  
  // Ensure at least 3 items (use generic if needed)
  while (highlights.length < 3) {
    highlights.push(`Feature ${highlights.length + 1}`);
  }
  
  return highlights.slice(0, 5);
}

function extractExportFormats(tool: Tool, content: ToolContent | null): string[] {
  const formats: string[] = [];
  const allText = [
    ...(tool.features || []),
    ...(tool.featureCards || []).map(c => `${c.title} ${c.description}`),
    ...(tool.feature_groups || []).flatMap(g => g.bullets || []),
    ...(content?.features?.keyFeatures || [])
  ].join(' ').toLowerCase();
  
  const formatMatches = allText.match(/(mp4|mov|avi|webm|gif|wav|mp3|srt|vtt|xliff)/gi);
  if (formatMatches) {
    formats.push(...Array.from(new Set(formatMatches.map(f => f.toUpperCase()))));
  }
  
  return formats;
}

function extractLanguages(tool: Tool, content: ToolContent | null): string | undefined {
  const allText = [
    ...(tool.features || []),
    ...(tool.featureCards || []).map(c => `${c.title} ${c.description}`),
    ...(tool.feature_groups || []).flatMap(g => g.bullets || []),
    ...(content?.features?.keyFeatures || [])
  ].join(' ').toLowerCase();
  
  const langMatch = allText.match(/(\d+)\s*(languages?|lang)/i);
  if (langMatch) {
    return langMatch[1];
  }
  
  return undefined;
}

function extractIntegrations(tool: Tool, content: ToolContent | null): string[] {
  const integrations: string[] = [];
  const allText = [
    ...(tool.features || []),
    ...(tool.featureCards || []).map(c => `${c.title} ${c.description}`),
    ...(tool.feature_groups || []).flatMap(g => g.bullets || []),
    ...(content?.features?.keyFeatures || [])
  ].join(' ').toLowerCase();
  
  // Common integrations
  const commonIntegrations = ['api', 'zapier', 'slack', 'google drive', 'dropbox', 'youtube', 'vimeo'];
  commonIntegrations.forEach(integration => {
    if (allText.includes(integration)) {
      integrations.push(integration.charAt(0).toUpperCase() + integration.slice(1));
    }
  });
  
  return integrations;
}

function extractTeamFeatures(tool: Tool, content: ToolContent | null): string[] {
  const features: string[] = [];
  const allText = [
    ...(tool.features || []),
    ...(tool.featureCards || []).map(c => `${c.title} ${c.description}`),
    ...(tool.feature_groups || []).flatMap(g => g.bullets || []),
    ...(content?.features?.keyFeatures || [])
  ].join(' ').toLowerCase();
  
  if (allText.includes('team') || allText.includes('collaboration') || allText.includes('users')) {
    if (allText.includes('multiple users') || allText.includes('team members')) {
      features.push('Multiple users/team members');
    }
    if (allText.includes('collaboration')) {
      features.push('Real-time collaboration');
    }
    if (allText.includes('workspace') || allText.includes('workspaces')) {
      features.push('Workspace management');
    }
  }
  
  return features;
}
