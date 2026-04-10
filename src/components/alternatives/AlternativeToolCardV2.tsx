'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CTAButton from '@/components/CTAButton';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  NoSymbolIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/solid';
import { AlternativeTool, AlternativeToolWithEvidence } from './types';

interface AlternativeToolCardV2Props {
  tool: AlternativeTool | AlternativeToolWithEvidence;
  cardId: string;
  isExpanded: boolean;
  onToggle: () => void;
  currentSlug?: string;
  detailMode?: 'compact' | 'full';
  onShowEvidence?: (links: string[], toolName: string) => void;
}

export default function AlternativeToolCardV2({
  tool,
  cardId,
  isExpanded,
  onToggle,
  currentSlug,
  detailMode = 'compact',
  onShowEvidence,
}: AlternativeToolCardV2Props) {
  const getSafeText = (value?: string) => {
    if (!value) return undefined;
    if (value.includes('[NEED VERIFICATION]')) return undefined;
    return value.trim() || undefined;
  };

  // Normalize tool data (no template copy; only evidence/field-backed)
  const normalizedTool = 'whySwitch' in tool ? {
    ...tool,
    affiliateUrl: (tool as any).affiliateUrl || tool.affiliateLink,
    bestFor: (tool.bestFor || []).filter((t) => getSafeText(t)),
    whySwitch: ((tool.whySwitch || []) as string[]).filter((t) => getSafeText(t)),
    evidenceLinks: ((tool.evidenceLinks || []) as string[]).filter(Boolean),
    limitations: getSafeText(tool.tradeOff || ('limitations' in tool ? (tool as any).limitations : undefined) as string | undefined)
  } : {
    ...tool,
    affiliateUrl: (tool as any).affiliateUrl || tool.affiliateLink,
    bestFor: (tool.bestFor || []).filter((t) => getSafeText(t)),
    whySwitch: (((tool as any).whySwitch || []) as string[]).filter((t) => getSafeText(t)),
    evidenceLinks: ((((tool as any).evidenceLinks) || []) as string[]).filter(Boolean),
    limitations: getSafeText(('limitations' in tool ? (tool as any).limitations : undefined) as string | undefined)
  };

  const bestForLine = getSafeText(normalizedTool.bestFor?.[0]);
  const whySwitchPrimary = getSafeText(normalizedTool.whySwitch?.[0]);
  const whySwitchSecondary = getSafeText(normalizedTool.whySwitch?.[1]);
  const tradeOffLine = getSafeText(normalizedTool.limitations);
  const hasPricingSignals = Boolean(
    normalizedTool.pricingSignals.freePlan ||
      normalizedTool.pricingSignals.watermark ||
      normalizedTool.pricingSignals.exportQuality ||
      normalizedTool.pricingSignals.refundCancel
  );
  const hasDetails = detailMode === 'full' && Boolean(tradeOffLine || whySwitchSecondary || hasPricingSignals || normalizedTool.evidenceLinks?.length);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a, button')) {
      return;
    }
    window.location.href = normalizedTool.affiliateUrl || normalizedTool.affiliateLink || `/tool/${normalizedTool.slug}`;
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

      {/* Best for */}
      {detailMode === 'full' && normalizedTool.bestFor.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {normalizedTool.bestFor.slice(0, 3).map((tag) => (
            <span
              key={`${cardId}-${tag}`}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {detailMode !== 'full' && bestForLine && (
        <div className="mb-3">
          <p className="text-sm text-gray-800 leading-relaxed">
            <span className="font-semibold text-gray-900">Best for:</span> {bestForLine}
          </p>
        </div>
      )}

      {detailMode === 'full' && whySwitchPrimary ? (
        <div className="mb-3 rounded-r border-l-4 border-yellow-400 bg-yellow-50/60 py-2 pl-4">
          <p className="text-sm leading-relaxed text-gray-800">
            <span className="font-semibold text-gray-900">Pick this if:</span> {whySwitchPrimary}
          </p>
        </div>
      ) : null}

      {detailMode === 'full' && whySwitchSecondary ? (
        <div className="mb-4 flex items-start gap-2">
          <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <p className="text-sm leading-relaxed text-gray-700">{whySwitchSecondary}</p>
        </div>
      ) : null}

      {tradeOffLine && (
        <div className="mb-4 flex-shrink-0">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold text-gray-900">Trade-off:</span> {tradeOffLine}
            </p>
          </div>
        </div>
      )}

      {/* CTA Area - Fixed at bottom */}
      <div className="mt-auto pt-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {normalizedTool.affiliateUrl || normalizedTool.affiliateLink ? (
          <CTAButton
            affiliateLink={normalizedTool.affiliateUrl || normalizedTool.affiliateLink}
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

        {hasDetails ? (
          <button
            onClick={onToggle}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            {isExpanded ? (
              <>
                <span>Hide details</span>
                <ChevronUpIcon className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Show details</span>
                <ChevronDownIcon className="h-4 w-4" />
              </>
            )}
          </button>
        ) : null}
      </div>

      {hasDetails && isExpanded ? (
        <div className="mt-4 space-y-4 border-t border-dashed border-gray-200 pt-4" onClick={(e) => e.stopPropagation()}>
          {hasPricingSignals ? (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-900">Pricing details</h4>
              <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                {normalizedTool.pricingSignals.freePlan ? (
                  <div className="flex items-start gap-2 text-sm leading-relaxed text-gray-700">
                    <CurrencyDollarIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{normalizedTool.pricingSignals.freePlan}</span>
                  </div>
                ) : null}
                {normalizedTool.pricingSignals.watermark ? (
                  <div className="flex items-start gap-2 text-sm leading-relaxed text-gray-700">
                    <NoSymbolIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{normalizedTool.pricingSignals.watermark}</span>
                  </div>
                ) : null}
                {normalizedTool.pricingSignals.exportQuality ? (
                  <div className="flex items-start gap-2 text-sm leading-relaxed text-gray-700">
                    <VideoCameraIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{normalizedTool.pricingSignals.exportQuality}</span>
                  </div>
                ) : null}
                {normalizedTool.pricingSignals.refundCancel ? (
                  <div className="flex items-start gap-2 text-sm leading-relaxed text-gray-700">
                    <ArrowPathIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{normalizedTool.pricingSignals.refundCancel}</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {normalizedTool.evidenceLinks?.length && onShowEvidence ? (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-900">Evidence</h4>
              <button
                onClick={() => onShowEvidence(normalizedTool.evidenceLinks!, normalizedTool.name)}
                className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
              >
                View evidence links ({normalizedTool.evidenceLinks.length})
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
