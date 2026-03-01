'use client';

import { useState, useEffect } from 'react';
import { AlternativeGroup, AlternativeGroupWithEvidence } from '@/components/alternatives/types';
import AlternativesReasonGroup from '@/components/alternatives/AlternativesReasonGroup';
import FAQAccordion from '@/components/FAQAccordion';

interface AlternativesClientProps {
  groups: AlternativeGroup[] | AlternativeGroupWithEvidence[];
  toolName: string;
  faqs?: Array<{ question: string; answer: string }>;
  currentSlug: string;
  evidenceLinks?: string[]; // Evidence sources for proof functionality
}

export default function AlternativesClient({ groups: initialGroups, toolName, faqs = [], currentSlug, evidenceLinks = [] }: AlternativesClientProps) {
  const [activeTab, setActiveTab] = useState(initialGroups[0]?.id);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const groups = initialGroups;

  const getDisplayTools = (group: AlternativeGroup | AlternativeGroupWithEvidence) => {
    const orderedTools = ('bestMatch' in group && group.bestMatch !== undefined)
      ? [...(group.deals || []), ...(group.bestMatch || [])]
      : (group.tools || []);

    const getSafeText = (value?: string | null) => {
      if (!value) return undefined;
      if (value.includes('[NEED VERIFICATION]')) return undefined;
      return value.trim() || undefined;
    };

    const getTradeOff = (tool: AlternativeGroup['tools'][number] | AlternativeGroupWithEvidence['tools'][number]) => {
      if ('tradeOff' in tool) return getSafeText(tool.tradeOff || undefined);
      return getSafeText((tool as any).limitations);
    };

    const getBestFor = (tool: AlternativeGroup['tools'][number] | AlternativeGroupWithEvidence['tools'][number]) =>
      getSafeText(tool.bestFor?.[0]);

    const getContentScore = (tool: AlternativeGroup['tools'][number] | AlternativeGroupWithEvidence['tools'][number]) => {
      const bestFor = getBestFor(tool);
      const tradeOff = getTradeOff(tool);
      return (bestFor ? 1 : 0) + (tradeOff ? 1 : 0);
    };

    const isAffiliate = (tool: AlternativeGroup['tools'][number] | AlternativeGroupWithEvidence['tools'][number]) =>
      Boolean((tool as any).affiliateUrl || tool.affiliateLink);

    const scored = orderedTools
      .map((tool, index) => ({ tool, index, contentScore: getContentScore(tool) }))
      .filter(({ contentScore }) => contentScore >= 1);

    scored.sort((a, b) => {
      if (b.contentScore !== a.contentScore) return b.contentScore - a.contentScore;
      const aAffiliate = isAffiliate(a.tool);
      const bAffiliate = isAffiliate(b.tool);
      if (aAffiliate !== bAffiliate) return aAffiliate ? -1 : 1;
      return a.index - b.index;
    });

    return scored.map(({ tool }) => tool).slice(0, 4);
  };

  const preparedGroups = groups
    .map(group => ({ group, displayTools: getDisplayTools(group) }))
    .filter(({ displayTools }) => displayTools.length >= 2);

  // Ensure activeTab is valid when groups change
  useEffect(() => {
    if (preparedGroups.length > 0 && !preparedGroups.find(({ group }) => group.id === activeTab)) {
      setActiveTab(preparedGroups[0].group.id);
    }
  }, [preparedGroups, activeTab]);

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

  // Filter out groups with insufficient displayable tools
  const validGroups = preparedGroups;

  // Get active group data
  const activeGroupData = validGroups.find(({ group }) => group.id === activeTab);

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
              {validGroups.map(({ group }) => (
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
          {activeGroupData?.group.description && (
            <div className="tabHint mt-4 flex items-start gap-2 rounded-xl border border-black/5 bg-white/60 px-4 py-3 text-sm text-black/60">
              <span className="shrink-0">ℹ︎</span>
              <p className="flex-1">{activeGroupData.group.description}</p>
            </div>
          )}
        </div>
      </section>

      {/* Content Section */}
      <div className="max-w-5xl mx-auto px-6 md:px-8 pt-8 pb-20 space-y-12">
        {/* Tools Grid */}
        {activeGroupData && (
          <AlternativesReasonGroup
            key={activeGroupData.group.id}
            group={activeGroupData.group}
            displayTools={activeGroupData.displayTools}
            expandedCards={expandedCards}
            onToggleCard={toggleCard}
            currentSlug={currentSlug}
          />
        )}

        {!activeGroupData && (
          <section className="rounded-xl border border-black/5 bg-white/70 px-5 py-4 text-sm text-black/60">
            No curated alternatives yet.
          </section>
        )}

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
