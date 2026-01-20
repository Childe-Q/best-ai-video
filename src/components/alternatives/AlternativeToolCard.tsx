'use client';

import Image from 'next/image';
import Link from 'next/link';
import CTAButton from '@/components/CTAButton';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CurrencyDollarIcon,
  NoSymbolIcon,
  VideoCameraIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid';
import { AlternativeTool, AlternativeToolWithEvidence } from './types';
import { isTryNowTool } from '@/lib/alternatives/affiliateWhitelist';

interface AlternativeToolCardProps {
  tool: AlternativeTool | AlternativeToolWithEvidence;
  cardId: string;
  isExpanded: boolean; // Kept for compatibility but not used
  onToggle: () => void; // Kept for compatibility but not used
  onShowEvidence: (links: string[], toolName: string) => void; // Kept for compatibility but not used
}

export default function AlternativeToolCard({
  tool,
  cardId,
  isExpanded,
  onToggle,
  onShowEvidence
}: AlternativeToolCardProps) {
  // Normalize tool data (handle both old and new formats)
  const normalizedTool = 'whySwitch' in tool ? tool : {
    ...tool,
    whySwitch: [tool.pickThisIf, tool.extraReason].filter(Boolean) as string[],
    tradeOff: tool.limitations || null
  };

  // Check if card has details to show (for toggle button)
  // Details include: Limitations (tradeOff), Pricing details, or Evidence links
  const hasDetails = normalizedTool.tradeOff || 
    (normalizedTool.evidenceLinks && normalizedTool.evidenceLinks.length > 0) || 
    normalizedTool.pricingSignals.freePlan || 
    normalizedTool.pricingSignals.watermark || 
    normalizedTool.pricingSignals.exportQuality || 
    normalizedTool.pricingSignals.refundCancel;

  return (
    <div
      className="bg-white border-2 border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all duration-200 flex flex-col h-full min-h-0"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="h-14 w-14 shrink-0 rounded-lg bg-gray-50 border border-black flex items-center justify-center p-2 overflow-hidden">
          {normalizedTool.logoUrl ? (
            <Image
              src={normalizedTool.logoUrl}
              alt={`${normalizedTool.name} logo`}
              width={48}
              height={48}
              className="h-full w-full object-contain"
              unoptimized
            />
          ) : (
            <span className="text-xl font-black">{normalizedTool.name.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-black text-black leading-none line-clamp-2">{normalizedTool.name}</h3>
            {isTryNowTool(normalizedTool.slug) && (
              <span className="px-2 py-0.5 bg-[#F6D200] border border-black rounded text-xs font-bold text-black shrink-0">
                Try now
              </span>
            )}
          </div>
          {normalizedTool.rating && (
            <div className="flex items-center gap-1 mb-1">
              <span className="text-sm font-bold text-gray-700">{normalizedTool.rating}</span>
              <span className="text-xs text-gray-500">rating</span>
            </div>
          )}
          <p className="text-sm font-bold text-gray-500 line-clamp-1">{normalizedTool.startingPrice}</p>
        </div>
      </div>

      {/* Tags (Best for) - Rounded pill style, multi-line */}
      {normalizedTool.bestFor.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 flex-shrink-0">
          {normalizedTool.bestFor.map((tag, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-white border-2 border-black rounded-full text-xs font-semibold text-black"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Pick this if: Core reason - Clamp to 2-3 lines */}
      {normalizedTool.whySwitch.length > 0 && (
        <div className="mb-3 bg-[#F6D200]/20 border-l-4 border-black pl-4 py-2 rounded-r flex-shrink-0">
          <p className="text-base font-semibold text-black leading-[1.65] line-clamp-3">
            <span className="font-bold">Pick this if:</span> {normalizedTool.whySwitch[0]}
          </p>
        </div>
      )}

      {/* Highlight bullet (second whySwitch claim) - Clamp to 2 lines */}
      {normalizedTool.whySwitch.length > 1 && (
        <div className="mb-4 flex items-start gap-2 flex-shrink-0">
          <CheckCircleIcon className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <span className="text-base text-gray-700 font-semibold leading-[1.65] line-clamp-2">
            {normalizedTool.whySwitch[1]}
          </span>
        </div>
      )}

      {/* CTA Area - Vertical Stack - Fixed at bottom */}
      <div className="mt-auto pt-4 space-y-2 flex-shrink-0">
        {/* Primary CTA Button - Full Width */}
        {/* Use neutral CTA text for all tools */}
        {normalizedTool.affiliateLink ? (
          <CTAButton
            affiliateLink={normalizedTool.affiliateLink}
            hasFreeTrial={normalizedTool.hasFreeTrial}
            text={normalizedTool.hasFreeTrial ? "Try now" : "Visit website"}
            className="w-full"
          />
        ) : (
          <Link
            href={`/tool/${normalizedTool.slug}`}
            className="block w-full py-3 px-4 border-2 border-black rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm font-bold text-black text-center"
          >
            Visit website
          </Link>
        )}

        {/* Show/Hide Details Toggle - Full Width */}
        {hasDetails && (
          <button
            onClick={onToggle}
            className="w-full py-2 px-4 border-2 border-black rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm font-bold text-black flex items-center justify-center gap-2"
          >
            {isExpanded ? (
              <>
                <span>HIDE DETAILS</span>
                <ChevronUpIcon className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>SHOW DETAILS</span>
                <ChevronDownIcon className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && hasDetails && (
        <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200 space-y-4">
          {/* Limitations */}
          {normalizedTool.tradeOff && (
            <div>
              <h4 className="text-sm font-black text-black mb-2 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                <span>Limitations:</span>
              </h4>
              <p className="text-base text-gray-600 font-semibold leading-[1.65]">
                {normalizedTool.tradeOff}
              </p>
            </div>
          )}

          {/* Pricing Details */}
          {(normalizedTool.pricingSignals.freePlan || normalizedTool.pricingSignals.watermark ||
            normalizedTool.pricingSignals.exportQuality || normalizedTool.pricingSignals.refundCancel) && (
            <div>
              <h4 className="text-sm font-black text-black mb-2">Pricing details:</h4>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                {normalizedTool.pricingSignals.freePlan && (
                  <div className="flex items-start gap-2 text-base font-semibold text-gray-600 leading-[1.65]">
                    <CurrencyDollarIcon className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{normalizedTool.pricingSignals.freePlan}</span>
                  </div>
                )}
                {normalizedTool.pricingSignals.watermark && (
                  <div className="flex items-start gap-2 text-base font-semibold text-gray-600 leading-[1.65]">
                    <NoSymbolIcon className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{normalizedTool.pricingSignals.watermark}</span>
                  </div>
                )}
                {normalizedTool.pricingSignals.exportQuality && (
                  <div className="flex items-start gap-2 text-base font-semibold text-gray-600 leading-[1.65]">
                    <VideoCameraIcon className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{normalizedTool.pricingSignals.exportQuality}</span>
                  </div>
                )}
                {normalizedTool.pricingSignals.refundCancel && (
                  <div className="flex items-start gap-2 text-base font-semibold text-gray-600 leading-[1.65]">
                    <ArrowPathIcon className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{normalizedTool.pricingSignals.refundCancel}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Evidence Links */}
          {normalizedTool.evidenceLinks && normalizedTool.evidenceLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-black text-black mb-2">Evidence:</h4>
              <button
                onClick={() => onShowEvidence(normalizedTool.evidenceLinks!, normalizedTool.name)}
                className="w-full p-3 rounded-lg border-2 border-black bg-white hover:bg-gray-50 transition-colors text-sm font-bold text-black flex items-center justify-center gap-2"
              >
                <span>VIEW EVIDENCE LINKS ({normalizedTool.evidenceLinks.length})</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
