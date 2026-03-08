import toolsSourceData from '@/data/sources/tools.sources.json';
import { normalizeSourceUrl, normalizeSourceUrlList, VsRowSources } from '@/lib/vsSources';
import { VsDiffRow } from '@/types/vs';

type ToolSourceEntry = {
  slug: string;
  sources?: {
    pricing?: { url?: string };
    features?: { url?: string };
    help?: { url?: string };
    faq?: { url?: string };
    terms?: { url?: string };
    examples?: Array<{ url?: string }>;
  };
};

const sourceIndex = new Map<string, ToolSourceEntry>(
  ((toolsSourceData as ToolSourceEntry[]) ?? []).map((entry) => [entry.slug, entry]),
);

const TOOL_SOURCE_ALIAS_MAP: Record<string, string> = {
  'heygen-ai': 'heygen',
  'heygen.com': 'heygen',
  'fliki-ai': 'fliki',
  'fliki.ai': 'fliki',
};

function normalizeToolSourceSlug(slug: string): string {
  const normalized = (slug || '').trim().toLowerCase();
  return TOOL_SOURCE_ALIAS_MAP[normalized] ?? normalized;
}

function pickUrl(value?: string): string[] {
  const normalized = value ? normalizeSourceUrl(value) : null;
  return normalized ? [normalized] : [];
}

export function getToolPrimarySources(slug: string): {
  home: string[];
  pricing: string[];
  docs: string[];
  help: string[];
  faq: string[];
  examples: string[];
} {
  const entry = sourceIndex.get(normalizeToolSourceSlug(slug));
  const examples = (entry?.sources?.examples ?? [])
    .map((item) => pickUrl(item.url)[0])
    .filter((item): item is string => Boolean(item))
    .slice(0, 2);
  const docs = pickUrl(entry?.sources?.features?.url);
  const help = pickUrl(entry?.sources?.help?.url);
  const faq = pickUrl(entry?.sources?.faq?.url);
  const pricing = pickUrl(entry?.sources?.pricing?.url);
  const homeSeed = docs[0] ?? help[0] ?? faq[0] ?? pricing[0] ?? examples[0];
  const home = homeSeed
    ? [
        new URL('/', homeSeed).toString(),
      ]
    : [];

  return {
    home,
    pricing,
    docs,
    help,
    faq,
    examples,
  };
}

export function getStrictPricingSources(slug: string): string[] {
  return getToolPrimarySources(slug).pricing.slice(0, 2);
}

function isStrictApiUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    const hostname = parsed.hostname.toLowerCase();
    return (
      /\/api(\/|$)/.test(pathname) ||
      /\/developers?(\/|$)/.test(pathname) ||
      /\/docs(\/|$)/.test(pathname) ||
      /\/platform(\/|$)/.test(pathname) ||
      /\/enterprise(\/|$)/.test(pathname) ||
      hostname.startsWith('platform.')
    );
  } catch {
    return false;
  }
}

export function getStrictApiSources(slug: string): string[] {
  const primary = getToolPrimarySources(slug);
  return dedupe([...primary.docs, ...primary.help, ...primary.faq, ...primary.examples])
    .filter((url) => isStrictApiUrl(url))
    .slice(0, 2);
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function collectToolFallbackSources(slug: string): string[] {
  const primary = getToolPrimarySources(slug);
  return dedupe([...primary.docs, ...primary.help, ...primary.faq, ...primary.examples, ...primary.pricing, ...primary.home]).slice(0, 2);
}

export function getToolSourceDomains(slug: string): string[] {
  return collectToolFallbackSources(slug)
    .map((url) => {
      try {
        return new URL(url).hostname.replace(/^www\./, '');
      } catch {
        return '';
      }
    })
    .filter(Boolean);
}

function getFallbackSourcesByType(slug: string, type: 'pricing' | 'docs' | 'help' | 'examples'): string[] {
  const primary = getToolPrimarySources(slug);
  const typed =
    type === 'pricing'
      ? primary.pricing
      : type === 'help'
        ? primary.help
        : type === 'examples'
          ? primary.examples
          : primary.docs;

  if (typed.length > 0) return typed.slice(0, 2);

  const merged = dedupe([...primary.docs, ...primary.help, ...primary.faq, ...primary.examples]).slice(0, 2);
  if (merged.length > 0) return merged;
  if (primary.pricing.length > 0) return primary.pricing.slice(0, 2);
  return primary.home.slice(0, 2);
}

export function buildPreferredRowSources(
  slugA: string,
  slugB: string,
  type: 'pricing' | 'docs' | 'help' | 'examples',
): VsRowSources {
  return {
    a: getFallbackSourcesByType(slugA, type).slice(),
    b: getFallbackSourcesByType(slugB, type).slice(),
  };
}

function matchUrlToTool(url: string, slug: string): boolean {
  const domain = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  })();
  if (!domain) return false;
  return getToolSourceDomains(slug).some((candidate) => domain === candidate || domain.includes(candidate) || candidate.includes(domain));
}

export function resolveRowSourcesForTools(
  row: Partial<VsDiffRow> | null | undefined,
  slugA: string,
  slugB: string,
): VsRowSources {
  if (row?.sources) {
    return {
      a: normalizeSourceUrlList(row.sources.a).slice(0, 2),
      b: normalizeSourceUrlList(row.sources.b).slice(0, 2),
    };
  }

  const fallbackA = collectToolFallbackSources(slugA);
  const fallbackB = collectToolFallbackSources(slugB);
  const urls = normalizeSourceUrlList(row?.sourceUrl).slice(0, 2);
  const resolved: VsRowSources = { a: [], b: [] };

  for (const url of urls) {
    const matchesA = matchUrlToTool(url, slugA);
    const matchesB = matchUrlToTool(url, slugB);
    if (matchesA && !matchesB) {
      resolved.a.push(url);
      continue;
    }
    if (matchesB && !matchesA) {
      resolved.b.push(url);
      continue;
    }
  }

  if (resolved.a.length === 0 && urls[0]) {
    resolved.a = matchUrlToTool(urls[0], slugA) ? [urls[0]] : fallbackA.slice(0, 2);
  }
  if (resolved.b.length === 0) {
    const matchedBUrl = urls.find((url) => matchUrlToTool(url, slugB));
    resolved.b = matchedBUrl ? [matchedBUrl] : fallbackB.slice(0, 2);
  }
  if (resolved.a.length === 0) {
    const matchedAUrl = urls.find((url) => matchUrlToTool(url, slugA));
    resolved.a = matchedAUrl ? [matchedAUrl] : fallbackA.slice(0, 2);
  }

  return {
    a: dedupe(resolved.a).slice(0, 2).map((item) => item),
    b: dedupe(resolved.b).slice(0, 2).map((item) => item),
  };
}
