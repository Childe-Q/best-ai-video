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
    normalizedTool.evidenceLinks.length > 0 || 
    normalizedTool.pricingSignals.freePlan || 
    normalizedTool.pricingSignals.watermark || 
    normalizedTool.pricingSignals.exportQuality || 
    normalizedTool.pricingSignals.refundCancel;

  return (
    <div
      className="bg-white border-2 border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all duration-200 flex flex-col h-full"
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
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-black text-black leading-none">{normalizedTool.name}</h3>
            {isTryNowTool(normalizedTool.slug) && (
              <span className="px-2 py-0.5 bg-[#F6D200] border border-black rounded text-xs font-bold text-black">
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
          <p className="text-sm font-bold text-gray-500">{normalizedTool.startingPrice}</p>
        </div>
      </div>

      {/* Tags (Best for) - Rounded pill style, multi-line */}
      {normalizedTool.bestFor.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
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

      {/* Pick this if: Core reason */}
      {normalizedTool.whySwitch.length > 0 && (
        <div className="mb-3 bg-[#F6D200]/20 border-l-4 border-black pl-4 py-2 rounded-r">
          <p className="text-sm font-bold text-black leading-snug">
            <span className="font-black">Pick this if:</span> {normalizedTool.whySwitch[0]}
          </p>
        </div>
      )}

      {/* Highlight bullet (second whySwitch claim) */}
      {normalizedTool.whySwitch.length > 1 && (
        <div className="mb-4 flex items-start gap-2">
          <CheckCircleIcon className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <span className="text-sm text-gray-700 font-medium leading-snug">
            {normalizedTool.whySwitch[1]}
          </span>
        </div>
      )}

      {/* CTA Area - Vertical Stack */}
      <div className="mt-auto pt-4 space-y-2">
        {/* Primary CTA Button - Full Width */}
        {isTryNowTool(normalizedTool.slug) && normalizedTool.affiliateLink ? (
          <CTAButton
            affiliateLink={normalizedTool.affiliateLink}
            hasFreeTrial={normalizedTool.hasFreeTrial}
            text={normalizedTool.hasFreeTrial ? "START FREE TRIAL" : "VISIT WEBSITE"}
            className="w-full"
          />
        ) : (
          <Link
            href={`/tool/${normalizedTool.slug}`}
            className="block text-sm text-gray-600 hover:text-gray-900 underline text-center"
          >
            Visit official site
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
              <p className="text-sm text-gray-600 font-medium leading-snug">
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
                  <div className="flex items-start gap-2 text-xs font-medium text-gray-600">
                    <CurrencyDollarIcon className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{normalizedTool.pricingSignals.freePlan}</span>
                  </div>
                )}
                {normalizedTool.pricingSignals.watermark && (
                  <div className="flex items-start gap-2 text-xs font-medium text-gray-600">
                    <NoSymbolIcon className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{normalizedTool.pricingSignals.watermark}</span>
                  </div>
                )}
                {normalizedTool.pricingSignals.exportQuality && (
                  <div className="flex items-start gap-2 text-xs font-medium text-gray-600">
                    <VideoCameraIcon className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{normalizedTool.pricingSignals.exportQuality}</span>
                  </div>
                )}
                {normalizedTool.pricingSignals.refundCancel && (
                  <div className="flex items-start gap-2 text-xs font-medium text-gray-600">
                    <ArrowPathIcon className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{normalizedTool.pricingSignals.refundCancel}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Evidence Links */}
          {normalizedTool.evidenceLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-black text-black mb-2">Evidence:</h4>
              <button
                onClick={() => onShowEvidence(normalizedTool.evidenceLinks, normalizedTool.name)}
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
