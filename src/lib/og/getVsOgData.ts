/**
 * VS-page data adapter for OG images.
 *
 * Converts a raw slug into the minimal ComparisonOgData that the
 * OG layout needs. Intentionally does NOT load the full VsComparison
 * payload — only name + logo from the lightweight tools index.
 */

import { parseVsSlug } from '@/data/vs';
import { getTool } from '@/lib/getTool';
import { getSEOCurrentYear } from '@/lib/utils';
import { resolveLogoUrl, BRAND_NAME, SITE_DOMAIN } from './theme';
import type { ComparisonOgData } from './types';

function toTitleCase(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getVsOgData(slug: string): ComparisonOgData | null {
  const parsed = parseVsSlug(slug);
  if (!parsed) return null;

  const toolA = getTool(parsed.slugA);
  const toolB = getTool(parsed.slugB);

  return {
    toolAName: toolA?.name ?? toTitleCase(parsed.slugA),
    toolBName: toolB?.name ?? toTitleCase(parsed.slugB),
    toolALogo: resolveLogoUrl(toolA?.logo_url),
    toolBLogo: resolveLogoUrl(toolB?.logo_url),
    year: String(getSEOCurrentYear()),
    brandName: BRAND_NAME,
    siteUrl: SITE_DOMAIN,
  };
}
