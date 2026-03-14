/**
 * Shared OG image data types.
 *
 * Every page-type adapter (VS, tool, features …) converts its domain data
 * into one of these structures so layouts only deal with display concerns.
 */

export interface BaseOgData {
  brandName: string;
  siteUrl: string;
  year: string;
}

export type ComparisonOgVariant =
  | 'default'
  | 'hero'
  | 'header'
  | 'a'
  | 'b'
  | 'c';

/** Two-entity comparison — used by /vs/[slug] */
export interface ComparisonOgData extends BaseOgData {
  toolAName: string;
  toolBName: string;
  toolALogo: string | null;
  toolBLogo: string | null;
}

/** Single entity — suitable for /tool/[slug], /features/[slug], /alternatives/[slug] */
export interface SingleEntityOgData extends BaseOgData {
  name: string;
  logoUrl: string | null;
  tagline?: string;
  badge?: string;
}

/** Generic collection — for hub / category pages */
export interface CollectionOgData extends BaseOgData {
  heading: string;
  subheading?: string;
  itemCount?: number;
}
