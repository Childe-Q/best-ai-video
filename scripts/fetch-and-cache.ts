#!/usr/bin/env node

/**
 * Fetch and cache HTML content from tool sources
 *
 * Usage:
 *   pnpm exec tsx scripts/fetch-and-cache.ts --slug fliki --type pricing
 *   pnpm exec tsx scripts/fetch-and-cache.ts --slug fliki --type pricing --force
 *   pnpm exec tsx scripts/fetch-and-cache.ts --slug fliki --type examples --render=auto
 *   pnpm exec tsx scripts/fetch-and-cache.ts --slug fliki --type examples --render=playwright
 */

import * as fs from 'fs';
import * as path from 'path';
import { hashUrl, cachePath, saveHtml, loadHtml, cacheExists, saveSnapshot, PageSnapshot } from './cache';
import { fetchStatic, fetchDynamic, fetchWithAutoRender } from './fetchers';

interface ToolSource {
  slug: string;
  sources: {
    pricing?: { url: string; mode: 'static' | 'dynamic' };
    features?: { url: string; mode: 'static' | 'dynamic' };
    help?: { url: string; mode: 'static' | 'dynamic' };
    faq?: { url: string; mode: 'static' | 'dynamic' };
    terms?: { url: string; mode: 'static' | 'dynamic' };
    changelog?: { url: string; mode: 'static' | 'dynamic' };
    examples?: Array<{ url: string; mode: 'static' | 'dynamic'; description?: string }>;
  };
}

type RenderMode = 'auto' | 'fetch' | 'playwright';

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
function parseArgs(): { slug: string; type: string; force: boolean; render: RenderMode } {
  const args = process.argv.slice(2);
  let slug: string | null = null;
  let type: string | null = null;
  let force = false;
  let render: RenderMode = 'auto';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slug' && i + 1 < args.length) {
      slug = args[i + 1];
      i++;
    } else if (args[i] === '--type' && i + 1 < args.length) {
      type = args[i + 1];
      i++;
    } else if (args[i] === '--force') {
      force = true;
    } else if (args[i] === '--render' && i + 1 < args.length) {
      const renderArg = args[i + 1];
      if (['auto', 'fetch', 'playwright'].includes(renderArg)) {
        render = renderArg as RenderMode;
      } else {
        console.error(`Invalid render mode: ${renderArg}. Must be one of: auto, fetch, playwright`);
        process.exit(1);
      }
      i++;
    }
  }

  if (!slug || !type) {
    console.error('Usage: tsx scripts/fetch-and-cache.ts --slug <slug> --type <pricing|features|help|faq|terms|changelog|examples> [--force] [--render=auto|fetch|playwright]');
    process.exit(1);
  }

  return { slug, type, force, render };
}

/**
 * Extract text content from HTML
 */
function extractTextFromHtml(html: string): string {
  // Simple text extraction - remove script and style tags
  const withoutScripts = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  const withoutStyles = withoutScripts.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  const withoutTags = withoutStyles.replace(/<[^>]+>/g, ' ');
  const normalizeSpaces = withoutTags.replace(/\s+/g, ' ').trim();

  return normalizeSpaces;
}

/**
 * Check if page appears to be a JS shell (minimal content after fetch)
 */
function isJsShell(text: string, html: string): boolean {
  // Very short text content
  if (text.length < 500) {
    return true;
  }

  // Check for common JS shell indicators
  const jsShellPatterns = [
    /react-root/i,
    /loading\.\.\./i,
    /spinner/i,
    /\[data-reactroot\]/i,
    /window\.__INITIAL_STATE__/i,
  ];

  for (const pattern of jsShellPatterns) {
    if (pattern.test(html)) {
      return true;
    }

    // Check if main content area is essentially empty
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      const bodyText = bodyMatch[1].replace(/<[^>]+>/g, '').trim();
      if (bodyText.length < 100) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Determine render mode based on config and CLI args
 */
function getEffectiveMode(configMode: 'static' | 'dynamic', render: RenderMode): 'static' | 'dynamic' | 'playwright' {
  if (render === 'fetch') {
    return 'static';
  } else if (render === 'playwright') {
    return 'playwright';
  } else if (render === 'auto') {
    return configMode;
  }
  return configMode;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Fetch and Cache Tool\n');

  const { slug, type, force, render } = parseArgs();
  const sources = loadSources();

  const toolSource = sources.find(s => s.slug === slug);
  if (!toolSource) {
    console.error(`Tool source not found for slug: ${slug}`);
    process.exit(1);
  }

  // Handle examples type (array of URLs)
  if (type === 'examples') {
    const examplesConfig = toolSource.sources.examples;
    if (!examplesConfig || examplesConfig.length === 0) {
      console.error(`No examples URLs configured for ${slug}`);
      process.exit(1);
    }

    console.log(`Found ${examplesConfig.length} examples URLs for ${slug}\n`);

    for (let i = 0; i < examplesConfig.length; i++) {
      const exampleConfig = examplesConfig[i];
      const exampleIndex = i + 1;
      const urlHash = hashUrl(exampleConfig.url);
      const cacheFile = cachePath(slug, `examples-${exampleIndex}`, urlHash);

      if (!force && cacheExists(slug, `examples-${exampleIndex}`, urlHash)) {
        console.log(`✓ [${exampleIndex}/${examplesConfig.length}] Cache hit: ${exampleConfig.url}`);
        continue;
      }

      console.log(`\n--- Example ${exampleIndex}/${examplesConfig.length} ---`);
      console.log(`URL: ${exampleConfig.url}`);
      console.log(`mode: ${exampleConfig.mode}, Render: ${render}`);

      try {
        const effectiveMode = getEffectiveMode(exampleConfig.mode, render);
        let html: string;
        let renderMode: 'fetch' | 'playwright' = 'fetch';

        if (effectiveMode === 'playwright') {
          html = await fetchDynamic(exampleConfig.url, { slug, type: `examples-${exampleIndex}` });
          renderMode = 'playwright';
        } else if (effectiveMode === 'dynamic') {
          // Auto mode with dynamic config - try fetch first, then playwright if needed
          const result = await fetchWithAutoRender(exampleConfig.url, { slug, type: `examples-${exampleIndex}` });
          html = result.html;
          renderMode = result.renderMode;
        } else {
          html = await fetchStatic(exampleConfig.url);
        }

        const text = extractTextFromHtml(html);
        const extractedTextLen = text.length;

        // Save HTML to cache
        saveHtml(slug, `examples-${exampleIndex}`, urlHash, html);

        // Save snapshot with metadata
        const snapshot: PageSnapshot = {
          rawHtml: html,
          text: text,
          sourceUrl: exampleConfig.url,
          fetchedAt: new Date().toISOString(),
          extractedTextLen: extractedTextLen,
          renderMode: renderMode,
          description: exampleConfig.description
        };
        saveSnapshot(slug, `examples-${exampleIndex}`, urlHash, snapshot);

        const sizeKB = (html.length / 1024).toFixed(2);
        console.log(`✓ Cached ${sizeKB}KB, text length: ${extractedTextLen} chars, mode: ${renderMode}`);
      } catch (error: any) {
        console.error(`✗ Failed: ${error.message}`);
        // Continue with next example
      }
    }

    return;
  }

  // Handle single URL types
  const urlConfig = toolSource.sources[type as keyof typeof toolSource.sources];
  if (!urlConfig || !(urlConfig as any).url) {
    console.error(`No URL configuration found for ${slug}.${type}`);
    console.error(`Available types: pricing, features, help, faq, terms, changelog, examples`);
    process.exit(1);
  }

  const config = urlConfig as { url: string; mode: 'static' | 'dynamic' };
  const { url, mode } = config;
  const urlHash = hashUrl(url);
  const cacheFile = cachePath(slug, type, urlHash);

  // Check cache
  if (!force && cacheExists(slug, type, urlHash)) {
    console.log(`✓ Cache hit: ${cacheFile}`);
    console.log(`  Use --force to re-fetch`);
    return;
  }

  // Determine effective mode
  const effectiveMode = getEffectiveMode(mode, render);
  console.log(`Fetching ${mode} content from: ${url}`);
  console.log(`Effective render mode: ${effectiveMode}`);
  const startTime = Date.now();

  try {
    let html: string;
    let renderMode: 'fetch' | 'playwright' = 'fetch';

    if (effectiveMode === 'playwright') {
      html = await fetchDynamic(url, { slug, type });
      renderMode = 'playwright';
    } else if (effectiveMode === 'dynamic') {
      // Auto mode with dynamic config - try fetch first, then playwright if needed
      const result = await fetchWithAutoRender(url, { slug, type });
      html = result.html;
      renderMode = result.renderMode;
    } else {
      html = await fetchStatic(url);
    }

    const text = extractTextFromHtml(html);
    const extractedTextLen = text.length;

    // Save to cache
    saveHtml(slug, type, urlHash, html);

    // Save snapshot with metadata
    const snapshot: PageSnapshot = {
      rawHtml: html,
      text: text,
      sourceUrl: url,
      fetchedAt: new Date().toISOString(),
      extractedTextLen: extractedTextLen,
      renderMode: renderMode
    };
    saveSnapshot(slug, type, urlHash, snapshot);

    const duration = Date.now() - startTime;
    const sizeKB = (html.length / 1024).toFixed(2);

    console.log(`✓ Cached ${sizeKB}KB in ${duration}ms`);
    console.log(`  Text length: ${extractedTextLen} chars, mode: ${renderMode}`);
    console.log(`  Cache file: ${cacheFile}`);

    // Warn if text is too short
    if (extractedTextLen < 500) {
      console.log(`  ⚠ Warning: Extracted text is very short (${extractedTextLen} chars). Consider using --render=playwright`);
    }
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
