import { MetadataRoute } from 'next';
import toolsData from '@/data/tools.json';
import { Tool } from '@/types/tool';

const tools: Tool[] = toolsData as Tool[];

// Change this to your actual domain
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://best-ai-video.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [];

  // 1. Homepage
  routes.push({
    url: `${BASE_URL}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  });

  // 2. Static Pages
  routes.push({
    url: `${BASE_URL}/about`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  });
  routes.push({
    url: `${BASE_URL}/privacy`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  });
  routes.push({
    url: `${BASE_URL}/terms`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  });

  // 3. Programmatic Pages for each tool
  tools.forEach((tool) => {
    // Overview Page
    routes.push({
      url: `${BASE_URL}/tool/${tool.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    // Pricing Page
    routes.push({
      url: `${BASE_URL}/tool/${tool.slug}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    // Alternatives Page
    routes.push({
      url: `${BASE_URL}/tool/${tool.slug}/alternatives`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  return routes;
}

