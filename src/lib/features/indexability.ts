import { getFeaturePageSlugs, readFeaturePageData } from '@/lib/features/readFeaturePageData';

export function isFeaturePageIndexable(slug: string): boolean {
  const pageData = readFeaturePageData(slug);
  if (!pageData) {
    return false;
  }

  return Boolean(pageData.hero) && pageData.groups.length > 0 && pageData.meta.needsManualReview !== true;
}

export function getIndexableFeaturePageSlugs(): string[] {
  return getFeaturePageSlugs().filter((slug) => isFeaturePageIndexable(slug));
}
