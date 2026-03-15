import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://best-ai-video.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/go/',   // Affiliate redirect routes — no content
        '/api/',  // API endpoints (e.g. /api/visit)
        '/dev/',  // Dev-only routes (e.g. OG image preview)
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
