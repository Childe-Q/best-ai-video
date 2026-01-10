#!/usr/bin/env node

/**
 * Fetch and cache HTML content from tool sources
 * 
 * Usage:
 *   pnpm exec tsx scripts/fetch-and-cache.ts --slug fliki --type pricing
 *   pnpm exec tsx scripts/fetch-and-cache.ts --slug fliki --type pricing --force
 */

import * as fs from 'fs';
import * as path from 'path';
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
 * Parse CLI arguments
 */
function parseArgs(): { slug: string; type: string; force: boolean } {
  const args = process.argv.slice(2);
  let slug: string | null = null;
  let type: string | null = null;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slug' && i + 1 < args.length) {
      slug = args[i + 1];
      i++;
    } else if (args[i] === '--type' && i + 1 < args.length) {
      type = args[i + 1];
      i++;
    } else if (args[i] === '--force') {
      force = true;
    }
  }

  if (!slug || !type) {
    console.error('Usage: tsx scripts/fetch-and-cache.ts --slug <slug> --type <pricing|features|terms|help> [--force]');
    process.exit(1);
  }

  const validTypes = ['pricing', 'features', 'terms', 'help'];
  if (!validTypes.includes(type)) {
    console.error(`Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  return { slug, type, force };
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Fetch and Cache Tool\n');
  
  const { slug, type, force } = parseArgs();
  const sources = loadSources();
  
  const toolSource = sources.find(s => s.slug === slug);
  if (!toolSource) {
    console.error(`Tool source not found for slug: ${slug}`);
    process.exit(1);
  }

  const urlConfig = toolSource.official_urls[type as keyof typeof toolSource.official_urls];
  if (!urlConfig) {
    console.error(`No URL configuration found for ${slug}.${type}`);
    process.exit(1);
  }

  const { url, mode } = urlConfig;
  const urlHash = hashUrl(url);
  const cacheFile = cachePath(slug, type, urlHash);

  // Check cache
  if (!force && cacheExists(slug, type, urlHash)) {
    console.log(`✓ Cache hit: ${cacheFile}`);
    console.log(`  Use --force to re-fetch`);
    return;
  }

  // Fetch content
  console.log(`Fetching ${mode} content from: ${url}`);
  const startTime = Date.now();

  try {
    let html: string;
    
    if (mode === 'static') {
      html = await fetchStatic(url);
    } else {
      html = await fetchDynamic(url);
    }

    // Save to cache
    saveHtml(slug, type, urlHash, html);
    
    const duration = Date.now() - startTime;
    const sizeKB = (html.length / 1024).toFixed(2);
    
    console.log(`✓ Cached ${sizeKB}KB in ${duration}ms`);
    console.log(`  Cache file: ${cacheFile}`);
  } catch (error: any) {
    console.error(`✗ Failed to fetch: ${error.message}`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
