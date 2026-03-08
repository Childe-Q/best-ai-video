import { VsComparison, VsDiffRow } from '@/types/vs';

export type VsRowSources = {
  a: string[];
  b: string[];
};

export type VsSourceEvidenceItem = {
  url: string;
  domain: string;
  sourceType: 'pricing' | 'documentation';
  summary: string;
};

export function isPricingSourceUrl(url: string): boolean {
  return /\/pricing\/?($|[?#])/i.test(url);
}

function ensureHttps(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value.replace(/^\/+/, '')}`;
}

export function normalizeSourceUrl(raw: string): string | null {
  const trimmed = raw.trim().replace(/[\s,]+$/g, '');
  if (!trimmed) return null;

  const candidate = ensureHttps(trimmed);
  try {
    const parsed = new URL(candidate);
    if (!/^https?:$/i.test(parsed.protocol)) return null;
    return parsed.toString().replace(/,+$/g, '');
  } catch {
    return null;
  }
}

export function normalizeSourceUrlList(value: unknown): string[] {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value
          .split(/[\n,]/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const normalized = rawItems
    .map((item) => (typeof item === 'string' ? normalizeSourceUrl(item) : null))
    .filter((item): item is string => Boolean(item));

  return Array.from(new Set(normalized));
}

export function normalizeRowSources(row?: Partial<VsDiffRow> | null): VsRowSources {
  if (!row) {
    return { a: [], b: [] };
  }

  if (row.sources) {
    return {
      a: normalizeSourceUrlList(row.sources.a).slice(0, 2),
      b: normalizeSourceUrlList(row.sources.b).slice(0, 2),
    };
  }

  const fallbackUrls = normalizeSourceUrlList(row.sourceUrl).slice(0, 2);
  if (fallbackUrls.length >= 2) {
    return {
      a: [fallbackUrls[0]],
      b: [fallbackUrls[1]],
    };
  }

  if (fallbackUrls.length === 1) {
    return {
      a: [fallbackUrls[0]],
      b: [],
    };
  }

  return { a: [], b: [] };
}

export function getSourceDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function summarizeByRowLabel(rowLabel: string, url: string): string {
  const normalizedLabel = rowLabel.toLowerCase();
  const normalizedUrl = url.toLowerCase();

  if (normalizedLabel.includes('pricing') || normalizedLabel.includes('free plan')) {
    return 'Official pricing page used to verify plan entry point or free-tier availability.';
  }
  if (normalizedLabel.includes('api')) {
    return 'Official docs or feature page used to verify API availability and plan gating.';
  }
  if (normalizedLabel.includes('language') || normalizedLabel.includes('dubbing')) {
    return 'Official docs or help content used to verify language, dubbing, or voice coverage.';
  }
  if (normalizedLabel.includes('template')) {
    return 'Official template gallery or feature page used to verify reusable layouts and presets.';
  }
  if (normalizedLabel.includes('workflow') || normalizedLabel.includes('speed')) {
    return 'Official product or help documentation used to verify workflow shape and iteration speed.';
  }
  if (normalizedLabel.includes('output')) {
    return 'Official feature page used to verify output type and delivery format.';
  }
  if (normalizedLabel.includes('best for')) {
    return 'Official positioning or feature copy used to verify the primary use case fit.';
  }
  if (normalizedLabel.includes('use case')) {
    return 'Official feature, help, or positioning copy used to verify the primary use case fit.';
  }
  if (normalizedLabel.includes('avatar realism')) {
    return 'Official avatar feature or product copy used to verify avatar style, realism, or presenter model.';
  }
  if (normalizedLabel.includes('editing model') || normalizedLabel.includes('video workflow')) {
    return 'Official workflow or feature copy used to verify how the tool moves from script or assets to finished video.';
  }
  if (normalizedLabel.includes('localization pipeline')) {
    return 'Official language or help documentation used to verify multilingual delivery and localization workflow.';
  }
  if (normalizedLabel.includes('governance') || normalizedLabel.includes('deployment posture')) {
    return 'Official enterprise, security, or feature documentation used to verify workspace, rollout, or deployment posture.';
  }
  if (normalizedLabel.includes('input model') || normalizedLabel.includes('content setup')) {
    return 'Official feature documentation used to verify whether the workflow starts from avatars, slides, recordings, or uploaded assets.';
  }
  if (normalizedUrl.includes('/pricing')) {
    return 'Official pricing page used as a primary verification source.';
  }
  if (normalizedUrl.includes('/help') || normalizedUrl.includes('/faq') || normalizedUrl.includes('/docs')) {
    return 'Official help or documentation page used as a primary verification source.';
  }
  if (normalizedUrl.includes('/feature') || normalizedUrl.includes('/tools') || normalizedUrl.includes('/template')) {
    return 'Official feature or template page used as a primary verification source.';
  }
  return 'Official product page used as a primary verification source.';
}

export function buildSourceEvidenceItems(urls: string[], rowLabel: string): VsSourceEvidenceItem[] {
  return normalizeSourceUrlList(urls)
    .slice(0, 2)
    .map((url) => ({
      url,
      domain: getSourceDomain(url),
      sourceType: isPricingSourceUrl(url) ? 'pricing' : 'documentation',
      summary: summarizeByRowLabel(rowLabel, url),
    }));
}

export function collectComparisonSourceUrls(comparison: VsComparison): string[] {
  const urls: string[] = [];

  for (const row of [...comparison.matrixRows, ...comparison.keyDiffs]) {
    const sources = normalizeRowSources(row);
    urls.push(...sources.a, ...sources.b);
  }

  return Array.from(new Set(urls));
}
