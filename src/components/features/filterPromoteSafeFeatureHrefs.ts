function normalizeFeatureHref(href: string): string {
  return href.split('#')[0];
}

export function isFeatureHref(href: string): boolean {
  return href.startsWith('/features/');
}

export function isPromoteSafeFeatureHref(href: string, promoteSafeFeatureHrefs: Set<string>): boolean {
  if (!isFeatureHref(href)) {
    return true;
  }

  return promoteSafeFeatureHrefs.has(normalizeFeatureHref(href));
}

export function toPromoteSafeFeatureHref(
  href: string,
  promoteSafeFeatureHrefs: Set<string>
): string | null {
  return isPromoteSafeFeatureHref(href, promoteSafeFeatureHrefs) ? href : null;
}

export function resolvePromoteSafeFeatureHref(
  href: string,
  promoteSafeFeatureHrefs: Set<string>,
  fallbackHref: string | null = '/features'
): { href: string | null; usedFallback: boolean } {
  if (!isFeatureHref(href)) {
    return { href, usedFallback: false };
  }

  if (promoteSafeFeatureHrefs.has(normalizeFeatureHref(href))) {
    return { href, usedFallback: false };
  }

  return {
    href: fallbackHref,
    usedFallback: true,
  };
}
