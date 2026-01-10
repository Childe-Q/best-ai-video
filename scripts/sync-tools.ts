#!/usr/bin/env node

/**
 * Sync tools: Fetch, clean, cache, and export HTML content
 * 
 * Usage:
 *   pnpm sync:tools -- --slug fliki
 *   pnpm sync:tools -- --slug fliki --type pricing
 *   pnpm sync:tools -- --slug fliki --force
 */

import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { hashUrl, cachePath, saveHtml, loadHtml, cacheExists } from './cache';
import { fetchStatic, fetchDynamic } from './fetchers';

interface ToolSource {
  slug: string;
  official_urls: {
    pricing?: { url: string; mode: 'static' | 'dynamic' };
    features?: { url: string; mode: 'static' | 'dynamic' };
    terms?: { url: string; mode: 'static' | 'dynamic' };
    help?: { url: string; mode: 'static' | 'dynamic' };
  };
}

interface CleanSummary {
  slug: string;
  type: string;
  sourceUrl: string;
  mode: 'static' | 'dynamic';
  htmlPath: string;
  textPath: string;
  textLength: number;
  truncated: boolean;
  createdAt: string;
}

const MAX_TEXT_LENGTH = 50000;

/**
 * Load sources configuration
 */
function loadSources(): ToolSource[] {
  const sourcesFile = path.join(__dirname, '../src/data/sources/tools.sources.json');
  
  try {
    const content = fs.readFileSync(sourcesFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading sources file: ${error}`);
    process.exit(1);
  }
}

/**
 * Clean HTML and extract text content
 */
function cleanHtml(html: string): { text: string; truncated: boolean } {
  const $ = cheerio.load(html);
  
  // Remove unwanted elements
  $('script, style, nav, footer, header, svg, iframe, noscript, form, button').remove();
  $('[class*="nav"], [class*="footer"], [class*="header"], [class*="menu"]').remove();
  $('[id*="nav"], [id*="footer"], [id*="header"], [id*="menu"]').remove();
  
  // Try to find main content area
  let content: any = null;
  
  const selectors = ['main', 'article', '[role="main"]', '.content', '.main-content', '#content'];
  for (const selector of selectors) {
    const found = $(selector).first();
    if (found.length > 0) {
      content = found;
      break;
    }
  }
  
  // Fallback to body
  if (!content || content.length === 0) {
    content = $('body');
  }
  
  // Extract text
  let text = content.text() || '';
  
  // Compress whitespace: replace multiple newlines with max 2
  text = text.replace(/\n{3,}/g, '\n\n');
  
  // Trim
  text = text.trim();
  
  // Truncate if needed
  let truncated = false;
  if (text.length > MAX_TEXT_LENGTH) {
    text = text.substring(0, MAX_TEXT_LENGTH);
    text += '\n\n[Content truncated due to length limit]';
    truncated = true;
  }
  
  return { text, truncated };
}

/**
 * Get text file path
 */
function textPath(slug: string, type: string, urlHash: string): string {
  const htmlPath = cachePath(slug, type, urlHash);
  return htmlPath.replace('.html', '.txt');
}

/**
 * Get summary JSON path
 */
function summaryPath(slug: string, type: string): string {
  const cacheDir = path.join(__dirname, 'cache', slug);
  return path.join(cacheDir, `${type}-clean.json`);
}

/**
 * Save cleaned text
 */
function saveText(slug: string, type: string, urlHash: string, text: string): void {
  const filePath = textPath(slug, type, urlHash);
  const dir = path.dirname(filePath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, text, 'utf-8');
}

/**
 * Save summary JSON
 */
function saveSummary(slug: string, type: string, summary: CleanSummary): void {
  const filePath = summaryPath(slug, type);
  const dir = path.dirname(filePath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, JSON.stringify(summary, null, 2), 'utf-8');
}

/**
 * Process a single URL
 */
async function processUrl(
  slug: string,
  type: string,
  url: string,
  mode: 'static' | 'dynamic',
  force: boolean
): Promise<CleanSummary> {
  const urlHash = hashUrl(url);
  const htmlCachePath = cachePath(slug, type, urlHash);
  const textCachePath = textPath(slug, type, urlHash);
  
  let html: string;
  let cacheHit = false;
  const startTime = Date.now();
  
  // Check cache
  if (!force && cacheExists(slug, type, urlHash)) {
    html = loadHtml(slug, type, urlHash)!;
    cacheHit = true;
    console.log(`  ✓ Cache hit: ${type}`);
  } else {
    // Fetch content
    console.log(`  → Fetching ${mode} content from: ${url}`);
    
    if (mode === 'static') {
      html = await fetchStatic(url);
    } else {
      html = await fetchDynamic(url);
    }
    
    // Save HTML cache
    saveHtml(slug, type, urlHash, html);
  }
  
  // Clean HTML
  const { text, truncated } = cleanHtml(html);
  
  // Save cleaned text
  saveText(slug, type, urlHash, text);
  
  const duration = Date.now() - startTime;
  const sizeKB = (html.length / 1024).toFixed(2);
  const textSizeKB = (text.length / 1024).toFixed(2);
  
  console.log(`  ${cacheHit ? '✓' : '→'} ${cacheHit ? 'Cached' : 'Fetched'} in ${duration}ms`);
  console.log(`    HTML: ${htmlCachePath} (${sizeKB}KB)`);
  console.log(`    Text: ${textCachePath} (${textSizeKB}KB${truncated ? ', truncated' : ''})`);
  
  // Create summary
  const summary: CleanSummary = {
    slug,
    type,
    sourceUrl: url,
    mode,
    htmlPath: htmlCachePath,
    textPath: textCachePath,
    textLength: text.length,
    truncated,
    createdAt: new Date().toISOString(),
  };
  
  // Save summary
  saveSummary(slug, type, summary);
  
  return summary;
}

/**
 * Parse CLI arguments
 */
function parseArgs(): { slug: string; type?: string; force: boolean; onlyFetch: boolean } {
  const args = process.argv.slice(2);
  let slug: string | null = null;
  let type: string | undefined = undefined;
  let force = false;
  let onlyFetch = true; // Default is onlyFetch
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slug' && i + 1 < args.length) {
      slug = args[i + 1];
      i++;
    } else if (args[i] === '--type' && i + 1 < args.length) {
      type = args[i + 1];
      i++;
    } else if (args[i] === '--force') {
      force = true;
    } else if (args[i] === '--onlyFetch') {
      onlyFetch = true;
    }
  }
  
  if (!slug) {
    console.error('Usage: pnpm sync:tools -- --slug <slug> [--type <pricing|features|terms|help>] [--force] [--onlyFetch]');
    process.exit(1);
  }
  
  if (type) {
    const validTypes = ['pricing', 'features', 'terms', 'help'];
    if (!validTypes.includes(type)) {
      console.error(`Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`);
      process.exit(1);
    }
  }
  
  return { slug, type, force, onlyFetch };
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Sync Tools: Fetch, Clean, Cache, Export\n');
  
  const { slug, type, force, onlyFetch } = parseArgs();
  
  if (!onlyFetch) {
    console.log('Note: --onlyFetch is default. LLM extraction is not implemented.');
  }
  
  const sources = loadSources();
  const toolSource = sources.find(s => s.slug === slug);
  
  if (!toolSource) {
    console.error(`Tool source not found for slug: ${slug}`);
    process.exit(1);
  }
  
  // Determine which types to process
  const typesToProcess = type 
    ? [type as keyof typeof toolSource.official_urls]
    : (['pricing', 'features', 'terms', 'help'] as const);
  
  const summaries: CleanSummary[] = [];
  
  // Process each URL
  for (const typeKey of typesToProcess) {
    const urlConfig = toolSource.official_urls[typeKey];
    if (!urlConfig) {
      console.log(`  ⚠ No URL configured for ${slug}.${typeKey}`);
      continue;
    }
    
    console.log(`\n📦 Processing ${typeKey}...`);
    
    try {
      const summary = await processUrl(
        slug,
        typeKey,
        urlConfig.url,
        urlConfig.mode,
        force
      );
      summaries.push(summary);
    } catch (error: any) {
      console.error(`  ✗ Failed: ${error.message}`);
    }
  }
  
  // Print summary
  console.log('\n✅ Summary:');
  summaries.forEach(summary => {
    const summaryFilePath = summaryPath(summary.slug, summary.type);
    console.log(`  ${summary.type}: ${summaryFilePath}`);
  });
  
  console.log('\n✓ Sync complete!');
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
