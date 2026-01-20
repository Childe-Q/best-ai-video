'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CTAButton from '@/components/CTAButton';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { AlternativeTool, AlternativeToolWithEvidence } from './types';

interface AlternativeToolCardV2Props {
  tool: AlternativeTool | AlternativeToolWithEvidence;
  cardId: string;
  isExpanded: boolean;
  onToggle: () => void;
  currentSlug?: string;
}

export default function AlternativeToolCardV2({
  tool,
  cardId,
  isExpanded,
  onToggle,
  currentSlug
}: AlternativeToolCardV2Props) {
  // Normalize tool data
  const normalizedTool = 'whySwitch' in tool ? {
    ...tool,
    pickThisIf: tool.whySwitch[0],
    limitations: tool.tradeOff || ('limitations' in tool ? (tool as any).limitations : undefined) as string | undefined
  } : {
    ...tool,
    limitations: ('limitations' in tool ? (tool as any).limitations : undefined) as string | undefined
  };

  const hasTradeOff = !!normalizedTool.limitations;
  const bestForTags = normalizedTool.bestFor?.slice(0, 4) || []; // Limit to 3-4 tags

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a, button')) {
      return;
    }
    window.location.href = `/tool/${normalizedTool.slug}`;
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200 flex flex-col h-full min-h-0 cursor-pointer group"
    >
      {/* Header: Logo + Name + Rating + Price */}
      <div className="flex items-start gap-4 mb-5">
        <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center p-2 overflow-hidden">
          {normalizedTool.logoUrl ? (
            <Image
              src={normalizedTool.logoUrl}
              alt={`${normalizedTool.name} logo`}
              width={40}
              height={40}
              className="h-full w-full object-contain"
              unoptimized
            />
          ) : (
            <span className="text-lg font-semibold text-gray-400">{normalizedTool.name.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
            {normalizedTool.name}
          </h3>
          <div className="flex items-center gap-3 text-sm">
            {normalizedTool.rating && (
              <div className="flex items-center gap-1">
                <span className="font-semibold text-gray-900">{normalizedTool.rating}</span>
                <span className="text-gray-400">/5</span>
              </div>
            )}
            {normalizedTool.startingPrice && (
              <>
                {normalizedTool.rating && <span className="text-gray-300">•</span>}
                <span className="text-gray-600">{normalizedTool.startingPrice}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Best for tags (3-4 chips) */}
      {bestForTags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {bestForTags.map((tag, i) => (
              <span key={i} className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-700 rounded-md text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pick this if */}
      {normalizedTool.pickThisIf && (
        <div className="mb-4 bg-blue-50 border-l-2 border-blue-400 pl-3 py-2 rounded-r-sm">
          <p className="text-sm text-gray-800 leading-relaxed">
            <span className="font-semibold text-gray-900">Pick this if:</span> {normalizedTool.pickThisIf}
          </p>
        </div>
      )}

      {/* Trade-off */}
      {hasTradeOff && (
        <div className="mb-4 flex-shrink-0">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold text-gray-900">Trade-off:</span> {normalizedTool.limitations}
            </p>
          </div>
        </div>
      )}

      {/* CTA Area - Fixed at bottom */}
      <div className="mt-auto pt-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
            onClick={(e) => e.stopPropagation()}
            className="block w-full py-2.5 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 hover:border-gray-400 transition-all text-sm font-medium text-gray-700 text-center"
          >
            Visit website
          </Link>
        )}
      </div>
    </div>
  );
}
