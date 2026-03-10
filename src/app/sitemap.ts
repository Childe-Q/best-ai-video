import { MetadataRoute } from 'next';
import toolsData from '@/data/tools.json';
import { Tool } from '@/types/tool';
import { getFeaturePageSlugs } from '@/lib/features/readFeaturePageData';
import { listVsSlugs } from '@/data/vs';

const tools: Tool[] = toolsData as Tool[];

// Change this to your actual domain
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://best-ai-video.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

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
    url: `${BASE_URL}/vs`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  });

  // 5. Features Hub Page
  pushRoute({
    url: `${BASE_URL}/features`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  });

  // 6. Feature Category Pages (only real routable slugs)
  getFeaturePageSlugs().forEach((slug) => {
    pushRoute({
      url: `${BASE_URL}/features/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  // 3. Programmatic Pages for each tool
  tools.forEach((tool) => {
    // Overview Page
    pushRoute({
      url: `${BASE_URL}/tool/${tool.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    // Pricing Page
    pushRoute({
      url: `${BASE_URL}/tool/${tool.slug}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    // Alternatives Page
    pushRoute({
      url: `${BASE_URL}/tool/${tool.slug}/alternatives`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  // 4. Comparison Pages (VS pages) - canonical slugs only
  listVsSlugs().forEach((slug) => {
    pushRoute({
      url: `${BASE_URL}/vs/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  });

  return routes;
}
