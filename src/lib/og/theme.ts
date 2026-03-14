/**
 * Shared OG visual tokens — tuned to the current site UI, not the older
 * poster-like neo-brutal treatment.
 */

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export const BRAND_NAME = 'Best AI Video Tools';
export const SITE_DOMAIN = 'best-ai-video.com';

export const siteBg = '#FAF7F0';
export const siteSurface = '#FFFFFF';
export const siteSurfaceMuted = '#F8F5EE';
export const siteSurfaceSoft = '#FCFAF5';
export const siteBlack = '#111111';
export const siteGray = '#667085';
export const siteGrayLight = '#98A2B3';
export const siteBorder = 'rgba(17,17,17,0.09)';
export const siteBorderStrong = 'rgba(17,17,17,0.15)';
export const siteLogoBg = '#FAF8F2';
export const siteChipBg = '#F4EFE4';
export const siteChipText = '#5A533E';
export const siteAccent = '#D6C6A0';
export const siteAccentSoft = '#E8DEC8';
export const siteShadow = '0 18px 42px rgba(17,17,17,0.07)';
export const siteShadowSoft = '0 10px 24px rgba(17,17,17,0.05)';
export const ogFont = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

/** Resolve a potentially relative logo path to an absolute URL. */
export function resolveLogoUrl(logoPath: string | undefined | null): string | null {
  if (!logoPath) return null;
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://best-ai-video.com';
  return logoPath.startsWith('http') ? logoPath : `${base}${logoPath}`;
}

/** Shrink font size when text exceeds safe character count. */
export function adaptiveFontSize(
  text: string,
  max: number,
  min: number,
  safeChars: number,
): number {
  if (text.length <= safeChars) return max;
  const ratio = safeChars / text.length;
  return Math.max(min, Math.round(max * ratio));
}

/** Comparison titles need a little more room than generic text. */
export function comparisonFontSize(
  left: string,
  right: string,
  max: number,
  min: number,
  safeChars: number,
): number {
  return adaptiveFontSize(`${left} vs ${right}`, max, min, safeChars);
}
