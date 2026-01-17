'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import CTAButton from '@/components/CTAButton';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  DocumentTextIcon, 
  XMarkIcon,
  CurrencyDollarIcon,
  VideoCameraIcon,
  NoSymbolIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/solid';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

export type AlternativeTool = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  startingPrice: string;
  affiliateLink: string;
  hasFreeTrial: boolean;
  bestFor: string[];
  pickThisIf: string | null;
  whySwitch: string[];
  tradeOff: string | null;
  pricingSignals: {
    freePlan?: string;
    watermark?: string;
    exportQuality?: string;
    refundCancel?: string;
  };
  evidenceLinks: string[];
};

export type AlternativeGroup = {
  id: string;
  title: string;
  description: string;
  tools: AlternativeTool[];
};

type FilterState = {
  showAvailableOnly: boolean; // User-friendly: show tools you can try now
  hasAffiliate: boolean; // Debug only: internal affiliate link filter
  hasFreeTrial: boolean;
  hasFreePlan: boolean;
  noWatermark: boolean;
  has4KExport: boolean;
};

export default function AlternativesClient({ groups }: { groups: AlternativeGroup[] }) {
  const searchParams = useSearchParams();
  const isDebugMode = searchParams.get('debug') === '1';
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [navTop, setNavTop] = useState('4rem');
  
  const [activeTab, setActiveTab] = useState(groups[0]?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    showAvailableOnly: true, // Default enabled: only show tools with affiliate link or clickable CTA
    hasAffiliate: true, // Debug only: internal filter
    hasFreeTrial: false,
    hasFreePlan: false,
    noWatermark: false,
    has4KExport: false,
  });
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [evidenceModal, setEvidenceModal] = useState<{ isOpen: boolean; links: string[]; toolName: string } | null>(null);

  // Calculate nav top position based on search bar height
  useEffect(() => {
    const updateNavTop = () => {
      if (searchBarRef.current) {
        const height = searchBarRef.current.getBoundingClientRect().height;
        setNavTop(`${height + 16}px`); // height + top-4 (1rem = 16px)
      }
    };
    updateNavTop();
    window.addEventListener('resize', updateNavTop);
    return () => window.removeEventListener('resize', updateNavTop);
  }, [filters, searchQuery]);

  // Toggle card expansion
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

  // Filter tools based on search and filters
  const filterTool = (tool: AlternativeTool): boolean => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = tool.name.toLowerCase().includes(query);
      const matchesTags = tool.bestFor.some(tag => tag.toLowerCase().includes(query));
      if (!matchesName && !matchesTags) return false;
    }

    // Filter: Show available tools only (user-friendly: tools with affiliate link or clickable CTA)
    // This is the default business logic: only show tools you can actually try
    if (filters.showAvailableOnly && !tool.affiliateLink) return false;

    // Debug filter: Has affiliate link (only shown in debug mode)
    if (isDebugMode && filters.hasAffiliate && !tool.affiliateLink) return false;

    // Filter: Has free trial
    if (filters.hasFreeTrial && !tool.hasFreeTrial) return false;

    // Filter: Has free plan
    if (filters.hasFreePlan && !tool.pricingSignals.freePlan) return false;

    // Filter: No watermark (check if watermark claim exists and indicates no watermark)
    if (filters.noWatermark) {
      const watermark = tool.pricingSignals.watermark?.toLowerCase() || '';
      const hasNoWatermark = watermark.includes('no watermark') || 
                             watermark.includes('remove watermark') || 
                             watermark.includes('watermark removal') ||
                             watermark.includes('paid removes watermark');
      if (!hasNoWatermark) return false;
    }

    // Filter: 4K export
    if (filters.has4KExport) {
      const exportQuality = tool.pricingSignals.exportQuality?.toLowerCase() || '';
      if (!exportQuality.includes('4k')) return false;
    }

    return true;
  };

  // Filter groups and tools
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
    const navEl = document.getElementById('sticky-nav');
    const searchBar = searchBarRef.current;
    if (el && navEl) {
      // Get dynamic heights of both sticky bars
      const navHeight = navEl.getBoundingClientRect().height;
      const searchBarHeight = searchBar ? searchBar.getBoundingClientRect().height : 0;
      const totalOffset = navHeight + searchBarHeight + 20; // Extra spacing
      
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
      {/* Search and Filters Bar */}
      <div ref={searchBarRef} className="sticky top-4 z-50 bg-[#FAF7F0] border-b-2 border-black shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-2">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by tool name or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-lg bg-white font-medium text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F6D200]"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {/* User-friendly filter: Show available tools only */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showAvailableOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, showAvailableOnly: e.target.checked }))}
                className="w-4 h-4 border-2 border-black rounded accent-[#F6D200]"
              />
              <span className="text-sm font-bold text-black">Show tools you can try now</span>
            </label>
            
            {/* Debug mode: Internal affiliate link filter */}
            {isDebugMode && (
              <label className="flex items-center gap-2 cursor-pointer opacity-60">
                <input
                  type="checkbox"
                  checked={filters.hasAffiliate}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasAffiliate: e.target.checked }))}
                  className="w-4 h-4 border-2 border-black rounded accent-[#F6D200]"
                />
                <span className="text-sm font-bold text-black">[DEBUG] Has affiliate link</span>
              </label>
            )}
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasFreeTrial}
                onChange={(e) => setFilters(prev => ({ ...prev, hasFreeTrial: e.target.checked }))}
                className="w-4 h-4 border-2 border-black rounded accent-[#F6D200]"
              />
              <span className="text-sm font-bold text-black">Has free trial</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasFreePlan}
                onChange={(e) => setFilters(prev => ({ ...prev, hasFreePlan: e.target.checked }))}
                className="w-4 h-4 border-2 border-black rounded accent-[#F6D200]"
              />
              <span className="text-sm font-bold text-black">Free plan</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.noWatermark}
                onChange={(e) => setFilters(prev => ({ ...prev, noWatermark: e.target.checked }))}
                className="w-4 h-4 border-2 border-black rounded accent-[#F6D200]"
              />
              <span className="text-sm font-bold text-black">No watermark</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.has4KExport}
                onChange={(e) => setFilters(prev => ({ ...prev, has4KExport: e.target.checked }))}
                className="w-4 h-4 border-2 border-black rounded accent-[#F6D200]"
              />
              <span className="text-sm font-bold text-black">4K export</span>
            </label>
          </div>
        </div>
      </div>

      {/* Sticky Decision Map */}
      <div id="sticky-nav" className="sticky z-40 bg-[#FAF7F0]/95 backdrop-blur-md border-b-2 border-black py-2 px-4 shadow-sm" style={{ top: navTop }}>
        <div className="max-w-6xl mx-auto flex overflow-x-auto gap-3 pb-1 scrollbar-hide">
          {filteredGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => scrollToSection(group.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full font-bold text-sm border-2 transition-all duration-200 ${
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

      <div className="max-w-6xl mx-auto px-4 pt-4 pb-8 space-y-16">
        {filteredGroups.map((group) => (
          <section key={group.id} id={group.id} className="scroll-mt-[140px]">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-black uppercase tracking-tight mb-2">
                {group.title}
              </h2>
              <p className="text-lg text-gray-600 font-medium">
                {group.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {group.tools.map((tool) => {
                const cardId = `${group.id}-${tool.slug}`;
                const isExpanded = expandedCards.has(cardId);
                const hasDetails = tool.whySwitch.length > 1 || tool.tradeOff || 
                                  Object.keys(tool.pricingSignals).length > 0 || 
                                  tool.evidenceLinks.length > 0;

                return (
                  <div 
                    key={cardId} 
                    className="bg-white border-2 border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all duration-200 flex flex-col h-full"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-14 w-14 shrink-0 rounded-lg bg-gray-50 border border-black flex items-center justify-center p-2 overflow-hidden">
                        {tool.logoUrl ? (
                          <Image
                            src={tool.logoUrl}
                            alt={`${tool.name} logo`}
                            width={48}
                            height={48}
                            className="h-full w-full object-contain"
                            unoptimized
                          />
                        ) : (
                          <span className="text-xl font-black">{tool.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-black leading-none mb-1">{tool.name}</h3>
                        <p className="text-sm font-bold text-gray-500">{tool.startingPrice}</p>
                      </div>
                    </div>

                    {/* Best For Chips */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {tool.bestFor.slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-neutral-100 border-2 border-black rounded-md text-xs font-semibold text-black hover:bg-neutral-200 transition-colors">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Pick This If */}
                    {tool.pickThisIf && (
                      <div className="bg-[#F6D200]/20 border-l-4 border-[#F6D200] p-3 mb-4">
                        <p className="text-sm font-bold text-black leading-tight">
                          Pick this if: <span className="font-normal">{tool.pickThisIf}</span>
                        </p>
                      </div>
                    )}

                    {/* Why Switch - First Item Only (Default) */}
                    {tool.whySwitch.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-start gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 font-medium leading-snug">{tool.whySwitch[0]}</span>
                        </div>
                      </div>
                    )}

                    {/* CTA Button */}
                    <div className="mt-auto mb-4">
                      <CTAButton 
                        affiliateLink={tool.affiliateLink} 
                        hasFreeTrial={tool.hasFreeTrial} 
                        text={tool.hasFreeTrial ? "Start free trial" : "Visit website"}
                        className="w-full"
                      />
                    </div>

                    {/* Show Details Toggle */}
                    {hasDetails && (
                      <button
                        onClick={() => toggleCard(cardId)}
                        className="w-full py-2 px-4 border-2 border-black rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm font-bold text-black flex items-center justify-center gap-2"
                      >
                        {isExpanded ? (
                          <>
                            <span>Hide details</span>
                            <ChevronUpIcon className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <span>Show details</span>
                            <ChevronDownIcon className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}

                    {/* Expanded Details */}
                    {isExpanded && hasDetails && (
                      <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200 space-y-4">
                        {/* Why Switch - Additional Items */}
                        {tool.whySwitch.length > 1 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-black text-black mb-2">More reasons to switch:</h4>
                            {tool.whySwitch.slice(1).map((reason, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircleIcon className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700 font-medium leading-snug">{reason}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Limitations */}
                        {tool.tradeOff && (
                          <div className="flex items-start gap-2">
                            <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-black text-black mb-1">Limitations:</h4>
                              <span className="text-sm text-gray-600 font-medium leading-snug">{tool.tradeOff}</span>
                            </div>
                          </div>
                        )}

                        {/* Pricing Signals */}
                        {(tool.pricingSignals.freePlan || tool.pricingSignals.watermark || tool.pricingSignals.exportQuality || tool.pricingSignals.refundCancel) && (
                          <div>
                            <h4 className="text-sm font-black text-black mb-2">Pricing details:</h4>
                            <div className="grid grid-cols-1 gap-2 text-xs font-medium text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                              {tool.pricingSignals.freePlan && (
                                <div className="flex items-center gap-2">
                                  <CurrencyDollarIcon className="w-4 h-4" />
                                  <span>{tool.pricingSignals.freePlan}</span>
                                </div>
                              )}
                              {tool.pricingSignals.watermark && (
                                <div className="flex items-center gap-2">
                                  <NoSymbolIcon className="w-4 h-4" />
                                  <span>{tool.pricingSignals.watermark}</span>
                                </div>
                              )}
                              {tool.pricingSignals.exportQuality && (
                                <div className="flex items-center gap-2">
                                  <VideoCameraIcon className="w-4 h-4" />
                                  <span>{tool.pricingSignals.exportQuality}</span>
                                </div>
                              )}
                              {tool.pricingSignals.refundCancel && (
                                <div className="flex items-center gap-2">
                                  <ArrowPathIcon className="w-4 h-4" />
                                  <span>{tool.pricingSignals.refundCancel}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Evidence Links */}
                        {tool.evidenceLinks.length > 0 && (
                          <div>
                            <h4 className="text-sm font-black text-black mb-2">Evidence:</h4>
                            <button
                              onClick={() => setEvidenceModal({ isOpen: true, links: tool.evidenceLinks, toolName: tool.name })}
                              className="w-full p-3 rounded-lg border-2 border-black bg-white hover:bg-gray-50 transition-colors text-sm font-bold text-black flex items-center justify-center gap-2"
                            >
                              <DocumentTextIcon className="w-5 h-5" />
                              <span>View evidence links ({tool.evidenceLinks.length})</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
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
