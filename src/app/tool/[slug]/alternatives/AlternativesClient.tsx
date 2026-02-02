'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Tool } from '@/types/tool';
import { AlternativeGroup, AlternativeGroupWithEvidence } from '@/components/alternatives/types';
import AlternativesReasonGroup from '@/components/alternatives/AlternativesReasonGroup';
import FAQAccordion from '@/components/FAQAccordion';
import ComingSoonToolCard from '@/components/alternatives/ComingSoonToolCard';
import { getAlternativesShortlist } from '@/lib/alternatives/getAlternativesShortlist';
import { buildAlternativeGroups } from '@/lib/buildAlternativesData';
import { COMING_SOON_TOOL_DATA, isComingSoonTool } from '@/lib/alternatives/getComingSoonTools';
import { getTool } from '@/lib/getTool';

interface AlternativesClientProps {
  groups: AlternativeGroup[] | AlternativeGroupWithEvidence[];
  toolName: string;
  faqs?: Array<{ question: string; answer: string }>;
  currentSlug: string;
  allTools: Tool[];
  evidenceLinks?: string[]; // Evidence sources for proof functionality
}

export default function AlternativesClient({ groups: initialGroups, toolName, faqs = [], currentSlug, allTools, evidenceLinks = [] }: AlternativesClientProps) {
  const [activeTab, setActiveTab] = useState(initialGroups[0]?.id);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Groups are static since we removed filters
  const groups = useMemo(() => {
    const currentTool = allTools.find(t => t.slug === currentSlug);
    if (!currentTool) return initialGroups;

    const shortlist = getAlternativesShortlist(
      currentSlug,
      allTools,
      12, 
      {
        onlyAffiliate: false, // Default to false as toggle is removed
        alwaysInclude: ['runway', 'sora']
      }
    );

    return buildAlternativeGroups(currentTool, allTools, shortlist);
  }, [currentSlug, allTools, initialGroups]);

  // Ensure activeTab is valid when groups change
  useEffect(() => {
    if (groups.length > 0 && !groups.find(g => g.id === activeTab)) {
      setActiveTab(groups[0].id);
    }
  }, [groups, activeTab]);

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  // Filter out empty groups if any (though usually groups are built with tools)
  const validGroups = groups.filter(g => g.tools && g.tools.length > 0);

  // Get active group data
  const activeGroupData = validGroups.find(g => g.id === activeTab);

  return (
    <div className="relative">
      {/* Hero Section: Product-grade header with segmented control */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 pt-12 pb-8">
        <div className="rounded-2xl border border-black/5 bg-white/60 backdrop-blur px-6 py-6 md:px-8 md:py-8">
          {/* Hero Top: Title + Meta + Subtitle */}
          <div className="heroTop">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05] text-black flex-1">
                {toolName} Alternatives (2026): Best Replacements by Use Case
              </h1>
              <span className="ml-3 inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-black/60 whitespace-nowrap shrink-0">
                Updated Jan 2026
              </span>
            </div>
            <p className="mt-3 text-base md:text-lg text-black/60 max-w-[72ch]">
              Ranked alternatives by cost control, output quality, and workflow speed.
            </p>
          </div>

          {/* Tab Row: Segmented pills control */}
          {validGroups.length > 0 && (
            <div className="tabRow mt-6 inline-flex w-full md:w-auto gap-1 rounded-full border border-black/10 bg-white/50 p-1 overflow-x-auto md:overflow-visible">
              {validGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setActiveTab(group.id)}
                  className={`relative flex-1 md:flex-none px-4 py-2 rounded-full text-sm font-semibold tracking-wide transition whitespace-nowrap ${
                    activeTab === group.id
                      ? 'bg-white text-black shadow-[0_1px_0_rgba(0,0,0,0.04)]'
                      : 'text-black/45 hover:text-black'
                  }`}
                >
                  {group.title}
                  {activeTab === group.id && (
                    <span className="absolute -bottom-1 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-yellow-400" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Tab Hint: Info callout for current tab description */}
          {activeGroupData?.description && (
            <div className="tabHint mt-4 flex items-start gap-2 rounded-xl border border-black/5 bg-white/60 px-4 py-3 text-sm text-black/60">
              <span className="shrink-0">ℹ︎</span>
              <p className="flex-1">{activeGroupData.description}</p>
            </div>
          )}
        </div>
      </section>

      {/* Content Section */}
      <div className="max-w-5xl mx-auto px-6 md:px-8 pt-8 pb-20 space-y-12">
        {/* Tools Grid */}
        {activeGroupData && (
          <AlternativesReasonGroup
            key={activeGroupData.id}
            group={activeGroupData}
            expandedCards={expandedCards}
            onToggleCard={toggleCard}
            currentSlug={currentSlug}
          />
        )}

        {/* Coming Soon Tools Section */}
        {(() => {
          const comingSoonTools = Object.values(COMING_SOON_TOOL_DATA).filter(
            (tool) => !getTool(tool.slug) && isComingSoonTool(tool.slug)
          );
          
          if (comingSoonTools.length === 0) return null;
          
          return (
            <section className="mt-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Coming Soon
              </h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                These top-tier tools are not yet in our database. Request them to be added.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {comingSoonTools.map((tool) => (
                  <ComingSoonToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          );
        })()}

        {/* Evidence Sources Section - For proof functionality */}
        {evidenceLinks.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Evidence Sources
            </h2>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Facts and claims on this page are backed by evidence from the following sources:
            </p>
            <div className="flex flex-wrap gap-2">
              {evidenceLinks.map((link, idx) => {
                // Extract domain from URL for cleaner display
                let label = link;
                try {
                  const urlObj = new URL(link);
                  label = urlObj.hostname.replace('www.', '');
                } catch {
                  // Use as-is if not a valid URL
                }

                return (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <FAQAccordion faqs={faqs.slice(0, 8)} />
          </section>
        )}
      </div>
    </div>
  );
}
