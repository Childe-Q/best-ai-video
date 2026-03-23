import '@/lib/optionalServerOnly';

import { getCanonicalVsSlug, getVsComparisonWithStatus, listVsSlugs } from '@/data/vs';
import { getAllToolContentSlugs, loadToolContent } from '@/lib/loadToolContent';
import { getAllTools, getTool } from '@/lib/getTool';
import {
  buildToolAlternativesLongformData,
  buildTopicAlternativesLongformData,
  getTopicAlternativesSlugs,
} from '@/lib/alternatives/buildLongformData';
import { isFeaturePageThinBySlug } from '@/lib/features/isFeaturePageThin';
import { getFeaturePageSlugs, readFeaturePageData } from '@/lib/features/readFeaturePageData';
import { isReviewPageThin } from '@/lib/reviews/isReviewPageThin';
import { isComparisonReady } from '@/lib/vsComparisonReady';

export type PageKind =
  | 'tool'
  | 'toolAlternatives'
  | 'toolFeatures'
  | 'toolReviews'
  | 'feature'
  | 'vs'
  | 'alternativesTopic'
  | 'hub';

export type ReadinessReason =
  | 'manual_review_pending'
  | 'thin_features'
  | 'thin_reviews'
  | 'alternatives_content_gap'
  | 'missing_editorial_pack'
  | 'placeholder_signal'
  | 'not_found';

export type ReadinessResult = {
  kind: PageKind;
  slug: string;
  href: string;
  ready: boolean;
  reasons: ReadinessReason[];
  notes?: string[];
};

type SyncPageKind = Exclude<PageKind, 'toolAlternatives'>;

type PromoteSafeLinkInput = {
  kind: PageKind;
  slug: string;
  href?: string;
};

type InventoryEntry = {
  kind: PageKind;
  slug: string;
};

const HUB_ROUTES = [
  { slug: 'home', href: '/' },
  { slug: 'features', href: '/features' },
  { slug: 'alternatives', href: '/alternatives' },
  { slug: 'vs', href: '/vs' },
] as const;

const readinessCache = new Map<string, Promise<ReadinessResult>>();

function pushReason(
  reasons: ReadinessReason[],
  notes: string[],
  reason: ReadinessReason,
  note?: string | null,
) {
  if (!reasons.includes(reason)) {
    reasons.push(reason);
  }
  const cleaned = note?.trim();
  if (cleaned && !notes.includes(cleaned)) {
    notes.push(cleaned);
  }
}

function buildHref(kind: PageKind, slug: string): string {
  switch (kind) {
    case 'tool':
      return `/tool/${slug}`;
    case 'toolAlternatives':
      return `/tool/${slug}/alternatives`;
    case 'toolFeatures':
      return `/tool/${slug}/features`;
    case 'toolReviews':
      return `/tool/${slug}/reviews`;
    case 'feature':
      return `/features/${slug}`;
    case 'vs':
      return `/vs/${getCanonicalVsSlug(slug) ?? slug}`;
    case 'alternativesTopic':
      return `/alternatives/topic/${slug}`;
    case 'hub': {
      const hub = HUB_ROUTES.find((route) => route.slug === slug);
      return hub?.href ?? '/';
    }
  }
}

function hasToolOverviewPack(slug: string): boolean {
  return getAllToolContentSlugs().includes(slug);
}

function hasToolOverviewPlaceholders(slug: string): boolean {
  const content = loadToolContent(slug);
  if (!content) return false;
  const serialized = JSON.stringify(content);
  return /\[NEED VERIFICATION\]|\bTBD\b|placeholder/i.test(serialized);
}

function getToolOverviewPackNotes(slug: string): string[] {
  const content = loadToolContent(slug);
  if (!content) return ['Missing content pack: content/tools/<slug>.json'];

  const missingFields: string[] = [];
  if (!content.overview?.tldr) missingFields.push('overview.tldr');
  if (!content.overview?.miniTest) missingFields.push('overview.miniTest');
  if ((content.overview?.useCases?.length ?? 0) < 2) missingFields.push('overview.useCases>=2');
  if ((content.pros?.length ?? 0) < 2) missingFields.push('pros>=2');
  if ((content.cons?.length ?? 0) < 2) missingFields.push('cons>=2');
  if (Object.keys(content.sources ?? {}).length === 0) missingFields.push('sources');

  return missingFields.map((field) => `Missing minimum overview pack requirement: ${field}`);
}

export function getPageReadinessSync(kind: SyncPageKind, slug: string): ReadinessResult {
  const href = buildHref(kind, slug);
  const reasons: ReadinessReason[] = [];
  const notes: string[] = [];

  if (kind === 'hub') {
    return { kind, slug, href, ready: true, reasons: [] };
  }

  switch (kind) {
    case 'tool': {
      const tool = getTool(slug);
      if (!tool) {
        pushReason(reasons, notes, 'not_found', 'Tool slug is not present in tools.json.');
        break;
      }

      if (!hasToolOverviewPack(slug)) {
        pushReason(reasons, notes, 'missing_editorial_pack', 'Missing content pack: content/tools/<slug>.json');
      }

      for (const note of getToolOverviewPackNotes(slug)) {
        pushReason(reasons, notes, 'missing_editorial_pack', note);
      }

      if (hasToolOverviewPlaceholders(slug)) {
        pushReason(reasons, notes, 'placeholder_signal', 'Content pack still contains placeholder / verification markers.');
      }
      break;
    }
    case 'toolFeatures': {
      const tool = getTool(slug);
      if (!tool) {
        pushReason(reasons, notes, 'not_found', 'Tool slug is not present in tools.json.');
        break;
      }
      if (isFeaturePageThinBySlug(tool, slug)) {
        pushReason(reasons, notes, 'thin_features', 'Tool features page is thin per existing noindex gate.');
      }
      break;
    }
    case 'toolReviews': {
      const tool = getTool(slug);
      if (!tool) {
        pushReason(reasons, notes, 'not_found', 'Tool slug is not present in tools.json.');
        break;
      }
      const content = loadToolContent(slug);
      if (isReviewPageThin(tool, content)) {
        pushReason(reasons, notes, 'thin_reviews', 'Tool reviews page is thin per existing noindex gate.');
      }
      break;
    }
    case 'feature': {
      const pageData = readFeaturePageData(slug);
      if (!pageData) {
        pushReason(reasons, notes, 'not_found', 'Feature page data could not be read.');
        break;
      }
      if (!pageData.hero || pageData.groups.length === 0) {
        pushReason(reasons, notes, 'missing_editorial_pack', 'Feature page is missing hero or groups data.');
      }
      if (pageData.meta.needsManualReview) {
        pushReason(reasons, notes, 'manual_review_pending', 'Feature page is still flagged with needsManualReview.');
      }
      break;
    }
    case 'vs': {
      const load = getVsComparisonWithStatus(slug);
      if (!load.comparison) {
        pushReason(reasons, notes, 'not_found', 'VS comparison could not be resolved.');
        break;
      }
      if (!isComparisonReady(load.comparison)) {
        pushReason(reasons, notes, 'missing_editorial_pack', load.reason ?? 'VS comparison did not pass isComparisonReady.');
      }
      break;
    }
    case 'alternativesTopic': {
      const data = buildTopicAlternativesLongformData(slug);
      if (!data) {
        pushReason(reasons, notes, 'not_found', 'Topic alternatives page could not be built.');
        break;
      }
      if (!data.contentReady) {
        pushReason(
          reasons,
          notes,
          'alternatives_content_gap',
          data.contentGapReason ?? 'Topic alternatives page is still below the readiness threshold.',
        );
      }
      break;
    }
  }

  return {
    kind,
    slug,
    href,
    ready: reasons.length === 0,
    reasons,
    ...(notes.length > 0 ? { notes } : {}),
  };
}

async function computeAsyncReadiness(kind: PageKind, slug: string): Promise<ReadinessResult> {
  if (kind !== 'toolAlternatives') {
    return getPageReadinessSync(kind as SyncPageKind, slug);
  }

  const href = buildHref(kind, slug);
  const reasons: ReadinessReason[] = [];
  const notes: string[] = [];
  const tool = getTool(slug);

  if (!tool) {
    pushReason(reasons, notes, 'not_found', 'Tool slug is not present in tools.json.');
  } else {
    const data = await buildToolAlternativesLongformData(slug);
    if (!data) {
      pushReason(reasons, notes, 'not_found', 'Tool alternatives page could not be built.');
    } else if (!data.contentReady) {
      pushReason(
        reasons,
        notes,
        'alternatives_content_gap',
        data.contentGapReason ?? 'Tool alternatives page is still below the readiness threshold.',
      );
    }
  }

  return {
    kind,
    slug,
    href,
    ready: reasons.length === 0,
    reasons,
    ...(notes.length > 0 ? { notes } : {}),
  };
}

export async function getPageReadiness(kind: PageKind, slug: string): Promise<ReadinessResult> {
  const cacheKey = `${kind}:${slug}`;
  const existing = readinessCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const pending = computeAsyncReadiness(kind, slug);
  readinessCache.set(cacheKey, pending);
  return pending;
}

export async function filterPromoteSafeLinks<T extends PromoteSafeLinkInput>(items: T[]): Promise<T[]> {
  const readiness = await Promise.all(items.map((item) => getPageReadiness(item.kind, item.slug)));
  return items.filter((item, index) => readiness[index]?.ready);
}

function getReadinessInventoryEntries(): InventoryEntry[] {
  const toolSlugs = getAllTools().map((tool) => tool.slug);
  const entries: InventoryEntry[] = [
    ...HUB_ROUTES.map((route) => ({ kind: 'hub' as const, slug: route.slug })),
    ...toolSlugs.map((slug) => ({ kind: 'tool' as const, slug })),
    ...toolSlugs.map((slug) => ({ kind: 'toolAlternatives' as const, slug })),
    ...toolSlugs.map((slug) => ({ kind: 'toolFeatures' as const, slug })),
    ...toolSlugs.map((slug) => ({ kind: 'toolReviews' as const, slug })),
    ...getFeaturePageSlugs().map((slug) => ({ kind: 'feature' as const, slug })),
    ...listVsSlugs().map((slug) => ({ kind: 'vs' as const, slug })),
    ...getTopicAlternativesSlugs().map((slug) => ({ kind: 'alternativesTopic' as const, slug })),
  ];

  return entries;
}

export async function getReadinessInventory(): Promise<ReadinessResult[]> {
  const entries = getReadinessInventoryEntries();
  return Promise.all(entries.map((entry) => getPageReadiness(entry.kind, entry.slug)));
}

export async function listPromoteSafePages(): Promise<ReadinessResult[]> {
  const inventory = await getReadinessInventory();
  return inventory.filter((item) => item.ready);
}
