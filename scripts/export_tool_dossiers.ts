#!/usr/bin/env node

/**
 * Export tool dossiers from local site pages
 * 
 * Usage:
 *   pnpm exec tsx scripts/export_tool_dossiers.ts
 * 
 * This script fetches pages from localhost:3000 and extracts clean text
 * for generating alternativesEvidence.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = '/tmp/dossiers';

// Tool slugs to export
const SLUGS = [
  'veed-io',
  'heygen',
  'fliki',
  'synthesia',
  'pika',
  'zebracat',
  'elai-io'
];

interface PageData {
  url: string;
  text: string;
}

interface ToolDossier {
  slug: string;
  pages: {
    overview: PageData;
    pricing: PageData;
    features: PageData;
    reviews?: PageData;
  };
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }
}

/**
 * Fetch HTML from a URL
 */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`❌ Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error(`❌ Error fetching ${url}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Clean HTML: remove scripts, styles, nav, footer, keep only main content
 */
function cleanHtml(html: string): string {
  const $ = cheerio.load(html);
  
  // Remove unwanted elements
  $('script, style, nav, footer, header, aside, .header, .footer, .nav, .navigation').remove();
  
  // Find main content area (prioritize <main>, then fallback to body)
  let $main = $('main');
  if ($main.length === 0) {
    $main = $('body');
  }
  
  // Extract text from headings, paragraphs, lists, tables, and links
  const textParts: string[] = [];
  const links: string[] = [];
  
  // Extract headings
  $main.find('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      textParts.push(text);
    }
  });
  
  // Extract paragraphs
  $main.find('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      textParts.push(text);
    }
  });
  
  // Extract list items
  $main.find('li').each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      textParts.push(text);
    }
  });
  
  // Extract table content
  $main.find('table').each((_, table) => {
    const rows: string[] = [];
    $(table).find('tr').each((_, tr) => {
      const cells: string[] = [];
      $(tr).find('td, th').each((_, cell) => {
        const text = $(cell).text().trim();
        if (text) {
          cells.push(text);
        }
      });
      if (cells.length > 0) {
        rows.push(cells.join(' | '));
      }
    });
    if (rows.length > 0) {
      textParts.push(rows.join('\n'));
    }
  });
  
  // Extract internal links (relative paths) - deduplicate
  const linkSet = new Set<string>();
  $main.find('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && href.startsWith('/')) {
      linkSet.add(href);
    }
  });
  
  // Combine text and links
  const cleanText = textParts.join('\n\n');
  const linksArray = Array.from(linkSet).sort();
  const linksText = linksArray.length > 0 ? `\n\n[Internal links: ${linksArray.join(', ')}]` : '';
  
  return cleanText + linksText;
}

/**
 * Fetch and process a single page
 */
async function fetchPageData(slug: string, pageType: 'overview' | 'pricing' | 'features' | 'reviews'): Promise<PageData | null> {
  const pathMap: Record<string, string> = {
    overview: `/tool/${slug}`,
    pricing: `/tool/${slug}/pricing`,
    features: `/tool/${slug}/features`,
    reviews: `/tool/${slug}/reviews`
  };
  
  const url = `${BASE_URL}${pathMap[pageType]}`;
  console.log(`  Fetching ${pageType}... ${url}`);
  
  const html = await fetchPage(url);
  if (!html) {
    return null;
  }
  
  const text = cleanHtml(html);
  return { url, text };
}

/**
 * Export dossier for a single tool
 */
async function exportToolDossier(slug: string): Promise<ToolDossier | null> {
  console.log(`\n📦 Exporting dossier for: ${slug}`);
  
  const overview = await fetchPageData(slug, 'overview');
  if (!overview) {
    console.error(`❌ Failed to fetch overview for ${slug}`);
    return null;
  }
  
  const pricing = await fetchPageData(slug, 'pricing');
  if (!pricing) {
    console.error(`❌ Failed to fetch pricing for ${slug}`);
    return null;
  }
  
  const features = await fetchPageData(slug, 'features');
  if (!features) {
    console.error(`❌ Failed to fetch features for ${slug}`);
    return null;
  }
  
  const reviews = await fetchPageData(slug, 'reviews');
  // Reviews is optional, don't fail if missing
  
  const dossier: ToolDossier = {
    slug,
    pages: {
      overview,
      pricing,
      features,
      ...(reviews && { reviews })
    }
  };
  
  return dossier;
}

/**
 * Save dossier to file
 */
function saveDossier(dossier: ToolDossier): void {
  const filePath = path.join(OUTPUT_DIR, `${dossier.slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(dossier, null, 2), 'utf-8');
  console.log(`✅ Saved: ${filePath}`);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log(`🚀 Starting tool dossier export from ${BASE_URL}`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  console.log(`📋 Tools to export: ${SLUGS.join(', ')}\n`);
  
  ensureOutputDir();
  
  const allDossiers: ToolDossier[] = [];
  
  for (const slug of SLUGS) {
    const dossier = await exportToolDossier(slug);
    if (dossier) {
      saveDossier(dossier);
      allDossiers.push(dossier);
    } else {
      console.error(`⚠️  Skipping ${slug} due to errors`);
    }
  }
  
  // Save combined file
  const allFilePath = path.join(OUTPUT_DIR, 'all.json');
  fs.writeFileSync(allFilePath, JSON.stringify(allDossiers, null, 2), 'utf-8');
  console.log(`\n✅ Saved combined file: ${allFilePath}`);
  console.log(`\n✨ Export complete! ${allDossiers.length}/${SLUGS.length} tools exported.`);
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
