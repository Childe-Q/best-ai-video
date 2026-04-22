import { Tool } from '@/types/tool';
import { getToolCardPricingDisplay } from '@/lib/pricing/cardDisplay';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://best-ai-video.com';

/* ------------------------------------------------------------------ */
/*  Organization + WebSite (root layout)                               */
/* ------------------------------------------------------------------ */

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Best AI Video Tools',
    url: BASE_URL,
    logo: `${BASE_URL}/opengraph-image.png`,
    sameAs: [],
  };
}

export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Best AI Video Tools',
    url: BASE_URL,
  };
}

/* ------------------------------------------------------------------ */
/*  SoftwareApplication (tool overview page)                           */
/* ------------------------------------------------------------------ */

export function buildSoftwareApplicationJsonLd(tool: Tool) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    url: `${BASE_URL}/tool/${tool.slug}`,
    applicationCategory: 'MultimediaApplication',
    description: tool.short_description || tool.tagline,
  };

  // Logo
  if (tool.logo_url) {
    schema.image = tool.logo_url;
  }

  // Offers — based on candidate logic for exact/legacy accepted
  const cardDisplay = getToolCardPricingDisplay(tool);
  if ((cardDisplay.source === 'candidate-exact' || cardDisplay.source === 'legacy-accepted') && cardDisplay.displayText) {
    const priceMatch = cardDisplay.displayText.match(/\$([\d.]+)/);
    if (priceMatch) {
      schema.offers = {
        '@type': 'Offer',
        price: priceMatch[1],
        priceCurrency: 'USD',
      };
    }
  }

  // Aggregate Rating — only if rating exists and is meaningful
  if (tool.rating && tool.rating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: tool.rating.toFixed(1),
      bestRating: '10',
      worstRating: '1',
      ...(tool.review_count && tool.review_count > 0
        ? { reviewCount: tool.review_count }
        : { ratingCount: 1 }),
    };
  }

  // Operating system
  schema.operatingSystem = 'Web-based';

  return schema;
}

/* ------------------------------------------------------------------ */
/*  BreadcrumbList                                                     */
/* ------------------------------------------------------------------ */

export type BreadcrumbItem = {
  name: string;
  href?: string; // omit for last item (current page)
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type PageLinkItem = {
  name: string;
  href: string;
};

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => {
      const element: Record<string, unknown> = {
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
      };
      if (item.href) {
        element.item = item.href.startsWith('http')
          ? item.href
          : `${BASE_URL}${item.href}`;
      }
      return element;
    }),
  };
}

/* ------------------------------------------------------------------ */
/*  FAQPage                                                            */
/* ------------------------------------------------------------------ */

export function buildFaqJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/* ------------------------------------------------------------------ */
/*  WebPage / CollectionPage                                           */
/* ------------------------------------------------------------------ */

function toAbsoluteUrl(href: string): string {
  return href.startsWith('http') ? href : `${BASE_URL}${href}`;
}

export function buildWebPageJsonLd({
  name,
  description,
  href,
}: {
  name: string;
  description: string;
  href: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url: toAbsoluteUrl(href),
  };
}

export function buildCollectionPageJsonLd({
  name,
  description,
  href,
  items = [],
}: {
  name: string;
  description: string;
  href: string;
  items?: PageLinkItem[];
}) {
  return {
    ...buildWebPageJsonLd({ name, description, href }),
    '@type': 'CollectionPage',
    ...(items.length > 0
      ? {
          hasPart: items.map((item) => ({
            '@type': 'WebPage',
            name: item.name,
            url: toAbsoluteUrl(item.href),
          })),
        }
      : {}),
  };
}

/* ------------------------------------------------------------------ */
/*  Shared renderer component                                          */
/* ------------------------------------------------------------------ */

/**
 * Renders one or more JSON-LD objects as <script> tags.
 * Accepts a single schema or an array.
 */
export function jsonLdScriptTag(schema: Record<string, unknown> | Record<string, unknown>[]) {
  const schemas = Array.isArray(schema) ? schema : [schema];
  return schemas.map((s, i) => ({
    __html: JSON.stringify(s),
    key: `jsonld-${i}`,
  }));
}
