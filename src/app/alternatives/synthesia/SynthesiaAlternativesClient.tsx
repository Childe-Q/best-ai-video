'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { DocumentTextIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import AlternativeToolCard from '@/components/alternatives/AlternativeToolCard';
import { AlternativeTool } from '@/components/alternatives/types';
import { getToolByNameOrSlug } from '@/lib/alternatives/mapToolNameToSlug';
import { getPricingDetails } from '@/lib/alternatives/getPricingDetails';

type FilterState = {
  hasFreeTrial: boolean;
  hasFreePlan: boolean;
  noWatermark: boolean;
  has4KExport: boolean;
};

interface SynthesiaAlternativesData {
  tool: string;
  collectedAt: string;
  switchReasonGroups: Array<{
    reasonTag: string;
    reasonTitle: string;
    reasonSummary: string;
    alternatives: Array<{
      toolName: string;
      bestFor: string[];
      whySwitch: Array<{
        claim: string;
        sources: Array<{
          url: string;
          type: string;
          quote?: string;
        }>;
      }>;
      tradeoffs: Array<{
        claim: string;
        sources: Array<{
          url: string;
          type: string;
          quote?: string;
        }>;
      }>;
    }>;
  }>;
}

interface SynthesiaAlternativesClientProps {
  data: SynthesiaAlternativesData;
}

export default function SynthesiaAlternativesClient({ data }: SynthesiaAlternativesClientProps) {
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [evidenceModal, setEvidenceModal] = useState<{ isOpen: boolean; links: string[]; toolName: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(data.switchReasonGroups[0]?.reasonTag.toLowerCase().replace(/\s+/g, '-') || '');
  const [filters, setFilters] = useState<FilterState>({
    hasFreeTrial: false,
    hasFreePlan: false,
    noWatermark: false,
    has4KExport: false,
  });

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

  const showEvidence = (links: string[], toolName: string) => {
    setEvidenceModal({ isOpen: true, links, toolName });
  };

  // Filter tools based on search and filters
  const filterTool = (tool: AlternativeTool): boolean => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = tool.name.toLowerCase().includes(query);
      const matchesTags = tool.bestFor.some((tag: string) => tag.toLowerCase().includes(query));
      if (!matchesName && !matchesTags) return false;
    }

    if (filters.hasFreeTrial && !tool.hasFreeTrial) return false;
    if (filters.hasFreePlan && !tool.pricingSignals.freePlan) return false;

    if (filters.noWatermark) {
      const watermark = tool.pricingSignals.watermark?.toLowerCase() || '';
      const hasNoWatermark = watermark.includes('no watermark') ||
        watermark.includes('remove watermark') ||
        watermark.includes('watermark removal') ||
        watermark.includes('paid removes watermark');
      if (!hasNoWatermark) return false;
    }

    if (filters.has4KExport) {
      const exportQuality = tool.pricingSignals.exportQuality?.toLowerCase() || '';
      if (!exportQuality.includes('4k')) return false;
    }

    return true;
  };

  // Convert dossier alternative to AlternativeTool format
  const convertToAlternativeTool = (
    alt: SynthesiaAlternativesData['switchReasonGroups'][0]['alternatives'][0],
    groupId: string
  ): AlternativeTool | null => {
    const tool = getToolByNameOrSlug(alt.toolName);
    
    // Extract evidence links (dedupe URLs)
    const evidenceLinks = new Set<string>();
    [...(alt.whySwitch || []), ...(alt.tradeoffs || [])].forEach(item => {
      item.sources?.forEach(source => {
        if (source.url && source.url.startsWith('/')) {
          evidenceLinks.add(source.url);
        } else if (source.url) {
          evidenceLinks.add(source.url);
        }
      });
    });

    // Get pricing details from站内数据源
    const pricingBullets = tool ? getPricingDetails(tool.slug) : [];
    
    // Build pricingSignals from bullets
    const pricingSignals: AlternativeTool['pricingSignals'] = {};
    if (pricingBullets.length > 0) {
      pricingSignals.freePlan = pricingBullets[0] || undefined;
      pricingSignals.watermark = pricingBullets[1] || undefined;
      pricingSignals.exportQuality = pricingBullets[2] || undefined;
      pricingSignals.refundCancel = pricingBullets[3] || undefined;
    }

    // If tool not found, create a minimal card with text only
    if (!tool) {
      return {
        id: `${groupId}-${alt.toolName.toLowerCase().replace(/\s+/g, '-')}`,
        slug: alt.toolName.toLowerCase().replace(/\s+/g, '-'),
        name: alt.toolName,
        logoUrl: '',
        startingPrice: 'Price not available',
        rating: undefined,
        affiliateLink: '',
        hasFreeTrial: false,
        bestFor: alt.bestFor || [],
        whySwitch: alt.whySwitch?.map(w => w.claim) || [],
        tradeOff: alt.tradeoffs?.[0]?.claim || null,
        pricingSignals,
        evidenceLinks: Array.from(evidenceLinks).slice(0, 3),
      };
    }

    return {
      id: `${groupId}-${tool.slug}`,
      slug: tool.slug,
      name: tool.name,
      logoUrl: tool.logo_url || '',
      startingPrice: tool.starting_price || 'Free Trial',
      rating: tool.rating,
      affiliateLink: tool.affiliate_link || '',
      hasFreeTrial: tool.has_free_trial || false,
      bestFor: alt.bestFor || [],
      whySwitch: alt.whySwitch?.map(w => w.claim) || [],
      tradeOff: alt.tradeoffs?.[0]?.claim || null,
      pricingSignals,
      evidenceLinks: Array.from(evidenceLinks).slice(0, 3),
    };
  };

  // Filter groups and tools
  const filteredGroups = useMemo(() => {
    return data.switchReasonGroups.map(group => {
      const groupId = group.reasonTag.toLowerCase().replace(/\s+/g, '-');
      const alternatives = group.alternatives
        .map(alt => convertToAlternativeTool(alt, groupId))
        .filter((tool): tool is AlternativeTool => tool !== null && filterTool(tool));

      return {
        ...group,
        id: groupId,
        alternatives,
      };
    }).filter(group => group.alternatives.length > 0);
  }, [data.switchReasonGroups, searchQuery, filters]);

  // Scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setActiveTab(id);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-100px 0px -50% 0px' }
    );

    filteredGroups.forEach((g) => {
      const el = document.getElementById(g.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [filteredGroups]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    const searchBar = searchBarRef.current;
    if (el && searchBar) {
      const searchBarHeight = searchBar.getBoundingClientRect().height;
      const totalOffset = searchBarHeight + 20;

      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - totalOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveTab(id);
    }
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="bg-[#FAF7F0] border-b-2 border-black py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-black text-black uppercase tracking-tight mb-4">
            Synthesia Alternatives (2026): Best Replacements by Use Case
          </h1>
          <p className="text-lg text-gray-700 font-medium leading-relaxed max-w-3xl">
            Based on testing and user feedback. Different account limits may vary. We compare alternatives by cost control, output quality, workflow speed, and control features.
          </p>
        </div>
      </div>

      {/* Filter Bar Card - Unified Container */}
      <div ref={searchBarRef} className="sticky top-4 z-50">
        <div className="max-w-6xl mx-auto bg-[#FAF7F0] border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_#000] p-4 space-y-4">
          {/* Row 1: Search Input (Full Width) */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tool name or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-black rounded-full bg-white font-medium text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F6D200]"
            />
          </div>

          {/* Row 2: Checkboxes (Left) + Disclosure (Right) */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer h-9">
                <input
                  type="checkbox"
                  checked={filters.hasFreeTrial}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasFreeTrial: e.target.checked }))}
                  className="w-4 h-4 border-2 border-black rounded accent-[#F6D200]"
                />
                <span className="text-sm font-bold text-black">Has free trial</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer h-9">
                <input
                  type="checkbox"
                  checked={filters.hasFreePlan}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasFreePlan: e.target.checked }))}
                  className="w-4 h-4 border-2 border-black rounded accent-[#F6D200]"
                />
                <span className="text-sm font-bold text-black">Free plan</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer h-9">
                <input
                  type="checkbox"
                  checked={filters.noWatermark}
                  onChange={(e) => setFilters(prev => ({ ...prev, noWatermark: e.target.checked }))}
                  className="w-4 h-4 border-2 border-black rounded accent-[#F6D200]"
                />
                <span className="text-sm font-bold text-black">No watermark</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer h-9">
                <input
                  type="checkbox"
                  checked={filters.has4KExport}
                  onChange={(e) => setFilters(prev => ({ ...prev, has4KExport: e.target.checked }))}
                  className="w-4 h-4 border-2 border-black rounded accent-[#F6D200]"
                />
                <span className="text-sm font-bold text-black">4K export</span>
              </label>
            </div>
            
            {/* Disclosure (Right) */}
            <p className="text-xs text-gray-600 leading-relaxed max-w-[320px]">
              Some links are affiliate links. They don't increase your cost and help support the site. Toggle filters to see all tools.
            </p>
          </div>

          {/* Row 3: Tabs (Pill Style) */}
          <div className="flex flex-wrap gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
            {filteredGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => scrollToSection(group.id)}
                className={`whitespace-nowrap px-4 py-2 h-9 rounded-full font-bold text-sm border-2 transition-all duration-200 ${
                  activeTab === group.id
                    ? 'bg-[#F6D200] border-black text-black shadow-[2px_2px_0px_0px_#000]'
                    : 'bg-white border-black/20 text-gray-500 hover:border-black hover:text-black'
                }`}
              >
                {group.reasonTitle}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 space-y-16">
        {filteredGroups.map((group) => {
          const groupId = group.id;
          
          return (
            <section key={groupId} id={groupId} className="scroll-mt-[140px]">
              <div className="mb-8">
                <h2 className="text-3xl font-black text-black uppercase tracking-tight mb-2">
                  {group.reasonTitle}
                </h2>
                <p className="text-lg text-gray-600 font-medium">
                  {group.reasonSummary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {group.alternatives.map((altTool) => {
                  const cardId = `${groupId}-${altTool.slug}`;
                  const isExpanded = expandedCards.has(cardId);

                  return (
                    <AlternativeToolCard
                      key={cardId}
                      tool={altTool}
                      cardId={cardId}
                      isExpanded={isExpanded}
                      onToggle={() => toggleCard(cardId)}
                      onShowEvidence={(links, toolName) => showEvidence(links, toolName)}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      {/* Evidence Modal */}
      {evidenceModal && evidenceModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border-2 border-black p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-black">
                Evidence Links for {evidenceModal.toolName}
              </h3>
              <button
                onClick={() => setEvidenceModal(null)}
                className="text-gray-500 hover:text-gray-900"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {evidenceModal.links.map((link, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 border-2 border-gray-200 rounded-lg hover:border-black transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 break-all">{link}</span>
                    <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400 ml-auto" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
