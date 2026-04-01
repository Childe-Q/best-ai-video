import fs from 'fs';
import path from 'path';
import type {
  CanonicalPricingIndex,
  CanonicalPricingIndexEntry,
  CanonicalPricingTool,
} from '@/types/pricingCards';

const PRICING_CARDS_DIR = path.join(process.cwd(), '..', 'information', 'data', 'pricing-cards');
const PRICING_CARDS_INDEX_PATH = path.join(PRICING_CARDS_DIR, 'index.json');
const SITE_TO_CANONICAL_SLUG_MAP: Record<string, string> = {
  'deepbrain-ai': 'aistudios-com',
  invideo: 'invideo-io',
  fliki: 'fliki-ai',
  zebracat: 'zebracat-ai',
  pika: 'pika-art',
  'opus-clip': 'opus-pro',
  runway: 'runwayml-com',
  pictory: 'pictory-ai',
  synthesys: 'synthesys-io',
};

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

export function getCanonicalPricingIndex(): CanonicalPricingIndex {
  return readJsonFile<CanonicalPricingIndex>(PRICING_CARDS_INDEX_PATH);
}

export function getCanonicalPricingTools(): CanonicalPricingIndexEntry[] {
  return getCanonicalPricingIndex().tools;
}

export function getCanonicalPricingTool(slug: string): CanonicalPricingTool | null {
  const index = getCanonicalPricingIndex();
  const entry = index.tools.find((tool) => tool.slug === slug);

  if (!entry) {
    return null;
  }

  const filePath = path.join(PRICING_CARDS_DIR, entry.dataFile);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return readJsonFile<CanonicalPricingTool>(filePath);
}

export function resolveCanonicalPricingSlug(siteSlug: string): string {
  return SITE_TO_CANONICAL_SLUG_MAP[siteSlug] ?? siteSlug;
}

export function getCanonicalPricingToolForSiteSlug(siteSlug: string): CanonicalPricingTool | null {
  return getCanonicalPricingTool(resolveCanonicalPricingSlug(siteSlug));
}

export function hasCanonicalPricingToolForSiteSlug(siteSlug: string): boolean {
  return Boolean(getCanonicalPricingToolForSiteSlug(siteSlug));
}

export function getCanonicalPricingStaticParams(): Array<{ slug: string }> {
  return getCanonicalPricingTools().map((tool) => ({ slug: tool.slug }));
}

export function isCanonicalMissingValue(value: string | null | undefined): boolean {
  return !value || value === 'not_found' || value === 'yearly_total_not_found';
}

export function getCanonicalDisplayValue(
  value: string | null | undefined,
  fallback: string,
): string {
  return isCanonicalMissingValue(value) ? fallback : value!;
}
