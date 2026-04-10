'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DocumentTextIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import AlternativeToolCardV2 from '@/components/alternatives/AlternativeToolCardV2';
import { AlternativeTool } from '@/components/alternatives/types';
import { getToolByNameOrSlug } from '@/lib/alternatives/mapToolNameToSlug';
import { getPricingDetails } from '@/lib/alternatives/getPricingDetails';
import { getToolCardPricingDisplay } from '@/lib/pricing/cardDisplay';

type FilterState = {
  hasFreeTrial: boolean;
  hasFreePlan: boolean;
  noWatermark: boolean;
  has4KExport: boolean;
};

type DossierSource = {
  url: string;
  type: string;
  quote?: string;
};

type DossierClaim = {
  claim: string;
  sources: DossierSource[];
};

type DossierAlternative = {
  toolName: string;
  bestFor: string[];
  whySwitch: DossierClaim[];
  tradeoffs: DossierClaim[];
};

type DossierReasonGroup = {
  reasonTag: string;
  reasonTitle: string;
  reasonSummary: string;
  alternatives: DossierAlternative[];
};

export interface LegacyDossierAlternativesData {
  tool: string;
  collectedAt: string;
  switchReasonGroups: DossierReasonGroup[];
}

interface LegacyDossierAlternativesClientProps {
  data: LegacyDossierAlternativesData;
}

function slugifyReason(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-');
}

function buildPricingSignals(slug?: string): AlternativeTool['pricingSignals'] {
  const pricingSignals: AlternativeTool['pricingSignals'] = {};
  const pricingBullets = slug ? getPricingDetails(slug) : [];

  if (pricingBullets.length > 0) {
    pricingSignals.freePlan = pricingBullets[0] || undefined;
    pricingSignals.watermark = pricingBullets[1] || undefined;
    pricingSignals.exportQuality = pricingBullets[2] || undefined;
    pricingSignals.refundCancel = pricingBullets[3] || undefined;
  }

  return pricingSignals;
}

function convertToAlternativeTool(alt: DossierAlternative, groupId: string): AlternativeTool {
  const tool = getToolByNameOrSlug(alt.toolName);
  const evidenceLinks = new Set<string>();

  [...(alt.whySwitch || []), ...(alt.tradeoffs || [])].forEach((item) => {
    item.sources?.forEach((source) => {
      if (source.url) {
        evidenceLinks.add(source.url);
      }
    });
  });

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
      whySwitch: alt.whySwitch?.map((item) => item.claim) || [],
      tradeOff: alt.tradeoffs?.[0]?.claim || null,
      pricingSignals: buildPricingSignals(),
      evidenceLinks: Array.from(evidenceLinks).slice(0, 3),
    };
  }

  return {
    id: `${groupId}-${tool.slug}`,
    slug: tool.slug,
    name: tool.name,
    logoUrl: tool.logo_url || '',
    startingPrice: getToolCardPricingDisplay(tool).displayText,
    rating: tool.rating,
    affiliateLink: tool.affiliate_link || '',
    hasFreeTrial: tool.has_free_trial || false,
    bestFor: alt.bestFor || [],
    whySwitch: alt.whySwitch?.map((item) => item.claim) || [],
    tradeOff: alt.tradeoffs?.[0]?.claim || null,
    pricingSignals: buildPricingSignals(tool.slug),
    evidenceLinks: Array.from(evidenceLinks).slice(0, 3),
  };
}

export default function LegacyDossierAlternativesClient({
  data,
}: LegacyDossierAlternativesClientProps) {
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [evidenceModal, setEvidenceModal] = useState<{ isOpen: boolean; links: string[]; toolName: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(slugifyReason(data.switchReasonGroups[0]?.reasonTag || ''));
  const [filters, setFilters] = useState<FilterState>({
    hasFreeTrial: false,
    hasFreePlan: false,
    noWatermark: false,
    has4KExport: false,
  });

  const filterTool = (tool: AlternativeTool): boolean => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = tool.name.toLowerCase().includes(query);
      const matchesTags = tool.bestFor.some((tag) => tag.toLowerCase().includes(query));
      if (!matchesName && !matchesTags) {
        return false;
      }
    }

    if (filters.hasFreeTrial && !tool.hasFreeTrial) return false;
    if (filters.hasFreePlan && !tool.pricingSignals.freePlan) return false;

    if (filters.noWatermark) {
      const watermark = tool.pricingSignals.watermark?.toLowerCase() || '';
      const hasNoWatermark =
        watermark.includes('no watermark') ||
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

  const filteredGroups = useMemo(() => {
    return data.switchReasonGroups
      .map((group) => {
        const groupId = slugifyReason(group.reasonTag);
        const alternatives = group.alternatives
          .map((alt) => convertToAlternativeTool(alt, groupId))
          .filter((tool) => filterTool(tool));

        return {
          ...group,
          id: groupId,
          alternatives,
        };
      })
      .filter((group) => group.alternatives.length > 0);
  }, [data.switchReasonGroups, searchQuery, filters]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-100px 0px -50% 0px' }
    );

    filteredGroups.forEach((group) => {
      const el = document.getElementById(group.id);
      if (el) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [filteredGroups]);

  const toggleCard = (cardId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    const searchBar = searchBarRef.current;
    if (el && searchBar) {
      const searchBarHeight = searchBar.getBoundingClientRect().height;
      const totalOffset = searchBarHeight + 20;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const offsetPosition = elementRect - bodyRect - totalOffset;

      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      setActiveTab(id);
    }
  };

  return (
    <div className="w-full">
      <div className="border-b-2 border-black bg-[#FAF7F0] py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="mb-4 text-4xl font-black uppercase tracking-tight text-black md:text-5xl">
            {data.tool} Alternatives (2026): Best Replacements by Use Case
          </h1>
          <p className="max-w-3xl text-lg font-medium leading-relaxed text-gray-700">
            Based on testing and user feedback. Different account limits may vary. We compare alternatives by cost
            control, output quality, workflow speed, and control features.
          </p>
        </div>
      </div>

      <div ref={searchBarRef} className="sticky top-4 z-50">
        <div className="mx-auto max-w-6xl space-y-4 rounded-xl border-2 border-black bg-[#FAF7F0] p-4 shadow-[4px_4px_0px_0px_#000]">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tool name or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border-2 border-black bg-white py-2.5 pl-10 pr-4 font-medium text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F6D200]"
            />
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              <label className="flex h-9 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.hasFreeTrial}
                  onChange={(e) => setFilters((prev) => ({ ...prev, hasFreeTrial: e.target.checked }))}
                  className="h-4 w-4 rounded border-2 border-black accent-[#F6D200]"
                />
                <span className="text-sm font-bold text-black">Has free trial</span>
              </label>
              <label className="flex h-9 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.hasFreePlan}
                  onChange={(e) => setFilters((prev) => ({ ...prev, hasFreePlan: e.target.checked }))}
                  className="h-4 w-4 rounded border-2 border-black accent-[#F6D200]"
                />
                <span className="text-sm font-bold text-black">Free plan</span>
              </label>
              <label className="flex h-9 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.noWatermark}
                  onChange={(e) => setFilters((prev) => ({ ...prev, noWatermark: e.target.checked }))}
                  className="h-4 w-4 rounded border-2 border-black accent-[#F6D200]"
                />
                <span className="text-sm font-bold text-black">No watermark</span>
              </label>
              <label className="flex h-9 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.has4KExport}
                  onChange={(e) => setFilters((prev) => ({ ...prev, has4KExport: e.target.checked }))}
                  className="h-4 w-4 rounded border-2 border-black accent-[#F6D200]"
                />
                <span className="text-sm font-bold text-black">4K export</span>
              </label>
            </div>

            <p className="max-w-[320px] text-xs leading-relaxed text-gray-600">
              Some links are affiliate links. They don&apos;t increase your cost and help support the site. Toggle
              filters to see all tools.
            </p>
          </div>

          <div className="scrollbar-hide flex flex-wrap gap-2.5 overflow-x-auto pb-1">
            {filteredGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => scrollToSection(group.id)}
                className={`h-9 whitespace-nowrap rounded-full border-2 px-4 py-2 text-sm font-bold transition-all duration-200 ${
                  activeTab === group.id
                    ? 'border-black bg-[#F6D200] text-black shadow-[2px_2px_0px_0px_#000]'
                    : 'border-black/20 bg-white text-gray-500 hover:border-black hover:text-black'
                }`}
              >
                {group.reasonTitle}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-16 px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        {filteredGroups.map((group) => (
          <section key={group.id} id={group.id} className="scroll-mt-[140px]">
            <div className="mb-8">
              <h2 className="mb-2 text-3xl font-black uppercase tracking-tight text-black">{group.reasonTitle}</h2>
              <p className="text-lg font-medium text-gray-600">{group.reasonSummary}</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {group.alternatives.map((tool) => {
                const cardId = `${group.id}-${tool.slug}`;
                return (
                  <AlternativeToolCardV2
                    key={cardId}
                    tool={tool}
                    cardId={cardId}
                    isExpanded={expandedCards.has(cardId)}
                    onToggle={() => toggleCard(cardId)}
                    onShowEvidence={(links, toolName) => setEvidenceModal({ isOpen: true, links, toolName })}
                    detailMode="full"
                  />
                );
              })}
            </div>
          </section>
        ))}
      </main>

      {evidenceModal?.isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border-2 border-black bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-black text-black">Evidence Links for {evidenceModal.toolName}</h3>
              <button onClick={() => setEvidenceModal(null)} className="text-gray-500 hover:text-gray-900">
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {evidenceModal.links.map((link, index) => (
                <a
                  key={`${evidenceModal.toolName}-${index}`}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border-2 border-gray-200 p-3 transition-colors hover:border-black"
                >
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                    <span className="break-all text-sm font-medium text-gray-700">{link}</span>
                    <ArrowTopRightOnSquareIcon className="ml-auto h-4 w-4 text-gray-400" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
