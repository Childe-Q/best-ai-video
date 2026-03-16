'use client';

import Link from 'next/link';
import { track } from '@/lib/features/track';
import { FeatureToolCardDisplay } from '@/types/featurePage';

interface ToolCardProps {
  tool: FeatureToolCardDisplay;
  featureSlug: string;
  groupTitle: string;
  position: number;
  policyLabel?: string;
}

function hasDisplayValue(value?: string | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

type ToolCardCta =
  | { kind: 'internal'; href: string; label: 'View review' }
  | { kind: 'external'; href: string; label: 'Visit official site' }
  | { kind: 'coming_soon'; label: 'Review coming soon' };

function resolveToolCardCta(tool: FeatureToolCardDisplay): ToolCardCta {
  if (tool.hasReviewPage && hasDisplayValue(tool.reviewUrl)) {
    return {
      kind: 'internal',
      href: tool.reviewUrl,
      label: 'View review',
    };
  }

  if (hasDisplayValue(tool.officialUrl)) {
    return {
      kind: 'external',
      href: tool.officialUrl,
      label: 'Visit official site',
    };
  }

  return {
    kind: 'coming_soon',
    label: 'Review coming soon',
  };
}

export default function ToolCard({
  tool,
  featureSlug,
  groupTitle,
  position,
  policyLabel = 'Policy',
}: ToolCardProps) {
  const cta = resolveToolCardCta(tool);

  const trackToolCardClick = () => {
    track('click_tool_card', {
      tool_slug: tool.toolSlug,
      position,
      group_title: groupTitle,
      feature_slug: featureSlug,
    });
  };

  return (
    <article
      className="group flex h-full flex-col rounded-2xl border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_#000] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000]"
    >
      <div className="mb-5 flex items-start gap-4">
        {hasDisplayValue(tool.resolvedLogoUrl) ? (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white p-2">
            <img
              src={tool.resolvedLogoUrl}
              alt={`${tool.displayName} logo`}
              className="h-full w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : (
          <div
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50"
          >
            <div className="grid grid-cols-2 gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            </div>
          </div>
        )}
        <div className="min-w-0 flex-1">
          {cta.kind === 'internal' ? (
            <Link
              href={cta.href}
              onClick={trackToolCardClick}
              className="inline-block text-xl font-bold leading-tight text-gray-900 transition-colors group-hover:text-indigo-600"
            >
              {tool.displayName}
            </Link>
          ) : cta.kind === 'external' ? (
            <a
              href={cta.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                track('click_outbound', {
                  tool_slug: tool.toolSlug,
                  destination_url: cta.href,
                  position,
                  group_title: groupTitle,
                  feature_slug: featureSlug,
                });
              }}
              className="inline-block text-xl font-bold leading-tight text-gray-900 transition-colors group-hover:text-indigo-600"
            >
              {tool.displayName}
            </a>
          ) : (
            <h3 className="text-xl font-bold leading-tight text-gray-900 transition-colors group-hover:text-indigo-600">
              {tool.displayName}
            </h3>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Why it stands out here</p>
          <p className="mt-2 text-base font-medium leading-7 text-gray-900">{tool.reasonLine1}</p>
          {hasDisplayValue(tool.reasonLine2) && (
            <p className="mt-2 text-sm leading-6 text-gray-600">{tool.reasonLine2}</p>
          )}
        </div>

        <dl className="space-y-4">
          {hasDisplayValue(tool.pricingStartAt) && (
            <div className="border-t border-gray-100 pt-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Pricing</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-800">{tool.pricingStartAt}</dd>
            </div>
          )}

          {hasDisplayValue(tool.watermarkPolicy) && (
            <div className="border-t border-gray-100 pt-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{policyLabel}</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-800">{tool.watermarkPolicy}</dd>
            </div>
          )}

          {hasDisplayValue(tool.bestFor) && (
            <div className="border-t border-gray-100 pt-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Best fit in this route</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-800">{tool.bestFor}</dd>
            </div>
          )}

          {hasDisplayValue(tool.mainTradeoff) && (
            <div className="border-t border-gray-100 pt-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Watch out for</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-800">{tool.mainTradeoff}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        {cta.kind === 'internal' && (
          <Link
            href={cta.href}
            onClick={trackToolCardClick}
            className="inline-flex items-center justify-center rounded-xl border-2 border-black bg-[#FFF16A] px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-[3px_3px_0px_0px_#000] transition-all duration-200 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000]"
          >
            {cta.label}
          </Link>
        )}

        {cta.kind === 'external' && (
          <a
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              track('click_outbound', {
                tool_slug: tool.toolSlug,
                destination_url: cta.href,
                position,
                group_title: groupTitle,
                feature_slug: featureSlug,
              });
            }}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
          >
            {cta.label}
          </a>
        )}

        {cta.kind === 'coming_soon' && (
          <span
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-500"
          >
            {cta.label}
          </span>
        )}

        {hasDisplayValue(tool.outboundUrl) && cta.kind !== 'external' && (
          <a
            href={tool.outboundUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              track('click_outbound', {
                tool_slug: tool.toolSlug,
                destination_url: tool.outboundUrl,
                position,
                group_title: groupTitle,
                feature_slug: featureSlug,
              });
            }}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
          >
            Visit website
          </a>
        )}
      </div>
    </article>
  );
}
