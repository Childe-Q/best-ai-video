'use client';

import Link from 'next/link';
import { Tool } from '@/types/tool';
import EditorialScoreSimple from './EditorialScoreSimple';
import { EXTERNAL_TOOL_TAGS } from '@/data/externalToolTags';
import { getEditorialHomeTags } from '@/data/home/editorialTags';
import { getPricingDisplay, getToolPricingSummary } from '@/lib/pricing/display';

interface ToolCardProps {
  tool: Tool;
}

// Helper function to get pricing tag and color
function getPricingTag(tool: Tool): { label: string; color: string } {
  const summary = getToolPricingSummary(tool);

  if (summary.verification === 'unverified') {
    return { label: 'Pricing unverified', color: 'bg-black/[0.04] text-black/60' };
  }

  if (summary.verification === 'trusted') {
    return { label: 'Trusted pricing', color: 'bg-black/[0.04] text-black/60' };
  }

  if (summary.status === 'custom' || summary.status === 'enterprise') {
    return { label: 'Custom pricing', color: 'bg-black/[0.04] text-black/60' };
  }

  if (summary.status === 'free') {
    return { label: 'Free', color: 'bg-black/[0.04] text-black/60' };
  }

  return { label: 'Paid', color: 'bg-black/[0.04] text-black/60' };
}


function getHomeTags(tool: Tool): string[] {
  const ext = EXTERNAL_TOOL_TAGS[tool.slug] ?? [];
  const extClean = [...new Set(ext.map((t) => t.trim()).filter(Boolean))];
  const editorialTags = getEditorialHomeTags(tool.slug);
  const editorialLabels = editorialTags.map((t) => t.label.trim()).filter(Boolean);
  const combined = [...extClean];

  for (const label of editorialLabels) {
    if (combined.length >= 2) break;
    if (!combined.includes(label)) {
      combined.push(label);
    }
  }

  return combined.slice(0, 2);
}

function isCoreTag(label: string): boolean {
  const coreKeywords = ['Avatar', 'Editor', 'Generator'];
  return coreKeywords.some((keyword) => label.includes(keyword));
}

export default function ToolCard({ tool }: ToolCardProps) {
  const pricingTag = getPricingTag(tool);
  const homeTags = getHomeTags(tool);
  const pricingDisplay = getPricingDisplay(tool);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-black/10 bg-white px-5 py-5 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-black/16 hover:bg-[#FFFEFB] hover:shadow-[0_16px_34px_rgba(0,0,0,0.06)]">
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="absolute inset-x-0 top-0 h-16 bg-[linear-gradient(180deg,rgba(246,210,0,0.14),transparent)]" />
        <div className="absolute inset-y-0 left-0 w-px bg-[linear-gradient(180deg,transparent,rgba(184,245,0,0.45),transparent)]" />
      </div>
      <div className="flex flex-1 flex-col">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-black/6 bg-[#FAF8F2] transition-all duration-200 group-hover:border-black/10 group-hover:bg-white">
              <img
                src={tool.logo_url}
                alt={tool.name}
                className="h-9 w-9 object-contain"
              />
            </div>
            <div className="min-w-0">
              <Link href={`/tool/${tool.slug}`} className="block">
                <h3 className="truncate text-lg font-black tracking-tight text-gray-900 transition-colors group-hover:text-black/70">
                  {tool.name}
                </h3>
              </Link>
              <EditorialScoreSimple score={tool.rating} />
            </div>
          </div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${pricingTag.color}`}>
            {pricingTag.label}
          </span>
        </div>

        <p className="mb-4 line-clamp-2 text-sm leading-6 text-gray-600 transition-colors duration-200 group-hover:text-gray-700">
          {tool.short_description}
        </p>

        {homeTags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {homeTags.map((tag, idx) => {
              const isCore = isCoreTag(tag);
              const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium';
              const coreClasses = isCore 
                ? 'bg-[#F7F4EC] text-black/75'
                : 'bg-black/[0.04] text-black/55';
              
              return (
                <span
                  key={`${tag}-${idx}`}
                  className={`${baseClasses} ${coreClasses}`}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-black/8 pt-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/35">Starting from</p>
            <p className="mt-1 truncate text-sm font-semibold text-gray-900">{pricingDisplay.displayText}</p>
            {pricingDisplay.hintText && pricingDisplay.verification !== 'unverified' && (
              <p className="mt-1 truncate text-[11px] font-medium text-gray-500">{pricingDisplay.hintText}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/tool/${tool.slug}`}
              className="group/link inline-flex items-center text-sm font-medium text-black/55 transition-colors no-underline hover:text-black"
            >
              <span>Review</span>
              <span className="ml-1.5 transition-transform duration-200 group-hover/link:translate-x-0.5">→</span>
            </Link>
            <Link
              href={tool.affiliate_link || '#'}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center rounded-full border border-black/10 bg-[#FAF8F2] px-3 py-2 text-xs font-semibold text-black/75 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-black/16 hover:bg-[#F6D200] hover:text-black"
            >
              Visit site
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
