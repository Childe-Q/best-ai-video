'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { DocumentTextIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Tool } from '@/types/tool';
import { AlternativeGroup, AlternativeGroupWithEvidence } from '@/components/alternatives/types';
import AlternativesReasonGroup from '@/components/alternatives/AlternativesReasonGroup';
import FAQAccordion from '@/components/FAQAccordion';
import { getAlternativesShortlist } from '@/lib/alternatives/getAlternativesShortlist';
import { buildAlternativeGroups } from '@/lib/buildAlternativesData';

type FilterState = {
  showAvailableOnly: boolean;
  hasAffiliate: boolean;
  hasFreeTrial: boolean;
  hasFreePlan: boolean;
  noWatermark: boolean;
  has4KExport: boolean;
};

interface AlternativesClientProps {
  groups: AlternativeGroup[] | AlternativeGroupWithEvidence[];
  toolName: string;
  faqs?: Array<{ question: string; answer: string }>;
  currentSlug: string;
  allTools: Tool[];
}

export default function AlternativesClient({ groups: initialGroups, toolName, faqs = [], currentSlug, allTools }: AlternativesClientProps) {
  const searchParams = useSearchParams();
  const isDebugMode = searchParams.get('debug') === '1';
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [navTop, setNavTop] = useState('4rem');

  const [activeTab, setActiveTab] = useState(initialGroups[0]?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyShowAffiliate, setOnlyShowAffiliate] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    showAvailableOnly: false, // Changed default to false
    hasAffiliate: false, // Changed default to false
    hasFreeTrial: false,
    hasFreePlan: false,
    noWatermark: false,
    has4KExport: false,
  });
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [evidenceModal, setEvidenceModal] = useState<{ isOpen: boolean; links: string[]; toolName: string } | null>(null);

  // Recalculate groups when onlyShowAffiliate changes
  const groups = useMemo(() => {
    const currentTool = allTools.find(t => t.slug === currentSlug);
    if (!currentTool) return initialGroups;

    const shortlist = getAlternativesShortlist(
      currentSlug,
      allTools,
      12, // Increase to ensure diversity
      {
        onlyAffiliate: onlyShowAffiliate,
        alwaysInclude: ['runway', 'sora']
      }
    );

    return buildAlternativeGroups(currentTool, allTools, shortlist);
  }, [currentSlug, allTools, onlyShowAffiliate]);

  // Calculate nav top position (no longer needed since tabs are in the same container)
  useEffect(() => {
    const updateNavTop = () => {
      if (searchBarRef.current) {
        const height = searchBarRef.current.getBoundingClientRect().height;
        setNavTop(`${height + 16}px`);
      }
    };
    updateNavTop();
    window.addEventListener('resize', updateNavTop);
    return () => window.removeEventListener('resize', updateNavTop);
  }, [filters, searchQuery]);

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

  const filterTool = (tool: any): boolean => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = tool.name.toLowerCase().includes(query);
      const matchesTags = tool.bestFor.some((tag: string) => tag.toLowerCase().includes(query));
      if (!matchesName && !matchesTags) return false;
    }

    // Note: onlyShowAffiliate filtering is handled at shortlist level, not here
    if (isDebugMode && filters.hasAffiliate && !tool.affiliateLink) return false;
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

  const filteredGroups = useMemo(() => {
    return groups.map(group => ({
      ...group,
      tools: group.tools.filter(filterTool)
    })).filter(group => group.tools.length > 0);
  }, [groups, searchQuery, filters]);

  // Scroll spy
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
    <div className="relative">
      {/* Hero Section */}
      <div className="bg-[#FAF7F0] border-b-2 border-black py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-black text-black uppercase tracking-tight mb-4">
            {toolName} Alternatives (2026): Best Replacements by Use Case
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
                  checked={onlyShowAffiliate}
                  onChange={(e) => setOnlyShowAffiliate(e.target.checked)}
                  className="w-4 h-4 border-2 border-black rounded accent-[#F6D200]"
                />
                <span className="text-sm font-bold text-black">Only show tools I can try now</span>
              </label>

              {isDebugMode && (
                <label className="flex items-center gap-2 cursor-pointer opacity-60 h-9">
                  <input
                    type="checkbox"
                    checked={filters.hasAffiliate}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasAffiliate: e.target.checked }))}
                    className="w-4 h-4 border-2 border-black rounded accent-[#F6D200]"
                  />
                  <span className="text-sm font-bold text-black">[DEBUG] Has affiliate link</span>
                </label>
              )}

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
          <div id="sticky-nav" className="flex flex-wrap gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
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
                {group.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-4 pb-8 space-y-16">
        {filteredGroups.map((group) => (
          <AlternativesReasonGroup
            key={group.id}
            group={group}
            expandedCards={expandedCards}
            onToggleCard={toggleCard}
            onShowEvidence={(links, toolName) => setEvidenceModal({ isOpen: true, links, toolName })}
          />
        ))}

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border-2 border-black p-8">
            <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-6">
              Frequently Asked Questions
            </h2>
            <FAQAccordion faqs={faqs.slice(0, 8)} />
          </section>
        )}
      </div>

      {/* Evidence Modal */}
      {evidenceModal && evidenceModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEvidenceModal(null)}>
          <div className="bg-white border-2 border-black rounded-xl p-6 max-w-md w-full shadow-[8px_8px_0px_0px_#000] relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setEvidenceModal(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-black text-black mb-4 flex items-center gap-2">
              <DocumentTextIcon className="w-6 h-6" />
              Evidence for {evidenceModal.toolName}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Claims are verified against these internal pages:
            </p>
            <div className="space-y-2">
              {evidenceModal.links.map((link, i) => (
                <Link
                  key={i}
                  href={link}
                  className="block p-3 rounded-lg border border-gray-200 hover:border-black hover:bg-gray-50 transition-all text-sm font-bold text-indigo-600 flex items-center justify-between group"
                >
                  <span className="truncate">{link}</span>
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
