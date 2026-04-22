import { MetadataRoute } from 'next';
import { getAllTools } from '@/lib/toolData';
import { getIndexableFeaturePageSlugs } from '@/lib/features/indexability';
import { listVsSlugs, getVsComparisonWithStatus } from '@/data/vs';
import {
  getTopicAlternativesSlugs,
  buildTopicAlternativesLongformData,
  buildToolAlternativesLongformData,
  isAlternativesPageThin,
} from '@/lib/alternatives/buildLongformData';
import { isFeaturePageThin } from '@/lib/features/isFeaturePageThin';
import { isReviewPageThin } from '@/lib/reviews/isReviewPageThin';
import { isComparisonReady } from '@/lib/vsComparisonReady';
import { getPricingPageExposure } from '@/lib/pricing/indexability';

// Change this to your actual domain
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://best-ai-video.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();
  const tools = getAllTools();

  const pushRoute = (route: MetadataRoute.Sitemap[number]) => {
    if (seen.has(route.url)) {
      return;
    }
    seen.add(route.url);
    routes.push(route);
  };

  // 1. Homepage
  pushRoute({
    url: `${BASE_URL}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  });

  // 2. Static Pages
  pushRoute({
    url: `${BASE_URL}/about`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  });
  pushRoute({
    url: `${BASE_URL}/privacy`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  });
  pushRoute({
    url: `${BASE_URL}/terms`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  });
  pushRoute({
    url: `${BASE_URL}/methodology`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  });
  pushRoute({
    url: `${BASE_URL}/vs`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  });

  // 3. Alternatives Hub Page
  pushRoute({
    url: `${BASE_URL}/alternatives`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  });

  // 4. Features Hub Page
  pushRoute({
    url: `${BASE_URL}/features`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  });

  // 5. Feature Category Pages (only real routable slugs)
  getIndexableFeaturePageSlugs().forEach((slug) => {
    pushRoute({
      url: `${BASE_URL}/features/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  // 6. Programmatic Pages for each tool
  for (const tool of tools) {
    // Overview Page
    pushRoute({
      url: `${BASE_URL}/tool/${tool.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    // Pricing Page
    const pricingExposure = getPricingPageExposure(tool.slug, tool);
    if (pricingExposure.indexable) {
      pushRoute({
        url: `${BASE_URL}/tool/${tool.slug}/pricing`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    // Alternatives Page — only include if page is not thin (matches page-level noindex logic)
    const altData = await buildToolAlternativesLongformData(tool.slug);
    if (!isAlternativesPageThin(altData)) {
      pushRoute({
        url: `${BASE_URL}/tool/${tool.slug}/alternatives`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    // Features Page — only include if page is not thin (matches page-level noindex logic)
    if (!isFeaturePageThin(tool, tool.content)) {
      pushRoute({
        url: `${BASE_URL}/tool/${tool.slug}/features`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }

    // Reviews Page — only include if page is not thin (matches page-level noindex logic)
    if (!isReviewPageThin(tool, tool.content)) {
      pushRoute({
        url: `${BASE_URL}/tool/${tool.slug}/reviews`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  // 7. Comparison Pages (VS pages) - canonical slugs only, exclude "in progress" comparisons
  listVsSlugs().forEach((slug) => {
    const { comparison } = getVsComparisonWithStatus(slug);
    
    if (isComparisonReady(comparison)) {
      pushRoute({
        url: `${BASE_URL}/vs/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  });

  // 8. Topic Alternatives Pages - only include non-thin pages
  getTopicAlternativesSlugs().forEach((slug) => {
    const data = buildTopicAlternativesLongformData(slug);
    if (data && !isAlternativesPageThin(data)) {
      pushRoute({
        url: `${BASE_URL}/alternatives/topic/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  });

  return routes;
}
