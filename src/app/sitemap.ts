import { MetadataRoute } from 'next';
import toolsData from '@/data/tools.json';
import { Tool } from '@/types/tool';
import { categories } from '@/data/categories';

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
  routes.push({
    url: `${BASE_URL}/vs`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  });

  // 5. Features Hub Page
  routes.push({
    url: `${BASE_URL}/features`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  });

  // 6. Feature Category Pages (Spoke Pages)
  categories.forEach((category) => {
    routes.push({
      url: `${BASE_URL}/features/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
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

  // 4. Comparison Pages (VS pages) - Only for tools with overlapping tags (>2 shared tags)
  // This prevents thin content and focuses on meaningful comparisons
  const comparisonPairs = new Set<string>();
  
  for (let i = 0; i < tools.length; i++) {
    for (let j = i + 1; j < tools.length; j++) {
      const toolA = tools[i];
      const toolB = tools[j];
      
      // Calculate shared tags
      const sharedTags = toolA.tags.filter((tag) => toolB.tags.includes(tag));
      
      // Only create comparison if tools share more than 2 tags (meaningful comparison)
      // OR if both are in top 10 most popular tools (by rating)
      const topTools = [...tools]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10)
        .map((t) => t.slug);
      
      const isTopToolPair = topTools.includes(toolA.slug) && topTools.includes(toolB.slug);
      
      if (sharedTags.length > 2 || isTopToolPair) {
        // Create slug: toolA-slug-vs-toolB-slug
        const slugA = toolA.slug;
        const slugB = toolB.slug;
        const comparisonSlug = `${slugA}-vs-${slugB}`;
        
        // Avoid duplicates (A vs B is same as B vs A)
        if (!comparisonPairs.has(comparisonSlug) && !comparisonPairs.has(`${slugB}-vs-${slugA}`)) {
          comparisonPairs.add(comparisonSlug);
          
          routes.push({
            url: `${BASE_URL}/vs/${comparisonSlug}`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
          });
        }
      }
    }
  }

  return routes;
}

