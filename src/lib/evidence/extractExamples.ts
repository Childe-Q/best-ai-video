/**
 * Example Extractor
 *
 * Extracts examples/use cases/templates from scraped page content.
 * Outputs structured examples with title, scenario, input, output, etc.
 */

import * as cheerio from 'cheerio';
import type { EvidenceExample } from '../../data/evidence/schema';

// ============================================================================
// Configuration
// ============================================================================

const EXAMPLE_KEYWORDS = [
  'example', 'use case', 'use-case', 'template', 'showcase', 'gallery',
  'demo', 'sample', 'how to', 'tutorial', 'walkthrough', 'case study',
  'prompt', 'before after', 'before & after', 'transformation'
];

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.mkv'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Normalize string for deduplication
 */
function normalizeForDedupe(text: string): string {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if text contains example keywords
 */
function containsExampleKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return EXAMPLE_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

/**
 * Extract numeric values with units
 */
function extractNumbersWithUnits(text: string): string[] {
  const matches: string[] = [];

  // 4K, 1080p, 720p
  const resolutionMatch = text.match(/\b(4K|1080p|720p|480p|2160p)\b/gi);
  if (resolutionMatch) {
    matches.push(...resolutionMatch);
  }

  // Duration (e.g., "30 seconds", "2 minutes")
  const durationMatch = text.match(/\b(\d+)\s*(second|sec|minute|min|hour|hr)s?\b/gi);
  if (durationMatch) {
    matches.push(...durationMatch);
  }

  // FPS (e.g., "24fps", "60 fps")
  const fpsMatch = text.match(/\b(\d+)\s*fps\b/gi);
  if (fpsMatch) {
    matches.push(...fpsMatch);
  }

  return Array.from(new Set(matches));
}

/**
 * Calculate confidence score based on completeness
 */
function calculateConfidence(example: Partial<EvidenceExample>): 'high' | 'medium' | 'low' {
  let score = 0;

  if (example.title) score += 1;
  if (example.scenario) score += 1;
  if (example.input?.prompt) score += 2;
  if (example.output?.asset?.videoUrl || example.output?.asset?.imageUrl) score += 2;
  if (example.notes && example.notes.length > 0) score += 1;
  if (example.snippet && example.snippet.length > 50) score += 1;

  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

// ============================================================================
// Media Extraction
// ============================================================================

/**
 * Extract media URLs from HTML
 */
function extractMediaUrls(html: string, baseUrl: string): {
  videos: string[];
  images: string[];
} {
  const $ = cheerio.load(html);
  const videos: string[] = [];
  const images: string[] = [];

  // Video sources
  $('video source[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (src) videos.push(src.startsWith('http') ? src : new URL(src, baseUrl).href);
  });

  // Video links (a tags with video extensions)
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && VIDEO_EXTENSIONS.some(ext => href.toLowerCase().endsWith(ext))) {
      videos.push(href.startsWith('http') ? href : new URL(href, baseUrl).href);
    }
  });

  // Images - be more selective to avoid logos/icons
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt') || '';
    const width = $(el).attr('width');

    // Skip small images (likely icons) and data URLs
    if (src && !src.includes('data:image')) {
      // Skip very small images (likely icons/logos)
      const isLikelyIcon = src.includes('icon') || src.includes('logo') || src.includes('favicon');

      // Also check if it's in a navigation/header context by looking at parent
      const $el = $(el);
      const parent = $el.parent();

      // Skip if parent is nav, header, footer, or has class indicating UI element
      const parentClass = parent.attr('class') || '';
      const isUiElement = /nav|header|footer|button|icon|logo/i.test(parentClass);

      if (src && !isLikelyIcon && !isUiElement) {
        images.push(src.startsWith('http') ? src : new URL(src, baseUrl).href);
      }
    }
  });

  // Video thumbnails/poster
  $('video[poster]').each((_, el) => {
    const poster = $(el).attr('poster');
    if (poster) images.push(poster.startsWith('http') ? poster : new URL(poster, baseUrl).href);
  });

  return {
    videos: Array.from(new Set(videos)),
    images: Array.from(new Set(images))
  };
}

// ============================================================================
// Main Extraction Functions
// ============================================================================

/**
 * Extract examples from structured HTML elements
 * Works with various page structures (cards, grids, lists)
 */
function extractFromStructuredHtml(html: string, sourceUrl: string): EvidenceExample[] {
  const $ = cheerio.load(html);
  const examples: EvidenceExample[] = [];
  const seenKeys = new Set<string>();

  // Try multiple selectors for different page structures

  // 1. Look for article or section elements with example-related content
  $('article, section, main, [role="article"]').each((_, container) => {
    const $container = $(container);
    const containerText = $container.text();

    if (!containsExampleKeywords(containerText)) return;
    if (containerText.length < 100 || containerText.length > 5000) return;

    // Try to find a title within this container
    const title = $container.find('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="heading"]').first().text().trim();

    // Look for description/paragraphs
    const description = $container.find('p, [class*="description"], [class*="text"], [class*="caption"]').first().text().trim();

    // Look for media within container
    const containerHtml = $container.html() || '';
    const media = extractMediaUrls(containerHtml, sourceUrl);

    // Extract numbers as notes
    const notes = extractNumbersWithUnits(containerText);

    if (title || description) {
      const example: EvidenceExample = {
        title: title || 'Example',
        scenario: description || containerText.substring(0, 150).trim(),
        input: undefined,
        output: media.videos.length > 0 || media.images.length > 0
          ? {
              asset: {
                videoUrl: media.videos[0],
                imageUrl: media.images[0],
                posterUrl: media.images.find(u => u.includes('poster') || u.includes('thumb'))
              }
            }
          : undefined,
        notes: notes.length > 0 ? notes : undefined,
        sourceUrl,
        snippet: containerText.substring(0, 300),
        capturedAt: new Date().toISOString(),
        confidence: calculateConfidence({
          title,
          scenario: description,
          output: media.videos.length > 0 || media.images.length > 0
            ? { asset: { videoUrl: media.videos[0], imageUrl: media.images[0] } }
            : undefined,
          notes,
          snippet: containerText
        })
      };

      // Deduplicate
      const key = normalizeForDedupe(example.title + example.scenario);
      if (!seenKeys.has(key) && key.length > 10) {
        seenKeys.add(key);
        examples.push(example);
      }
    }
  });

  // 2. If no structured containers found, parse text content
  if (examples.length === 0) {
    const paragraphs = html.replace(/<[^>]+>/g, '\n').split(/\n+/);

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!containsExampleKeywords(trimmed)) continue;
      if (trimmed.length < 50 || trimmed.length > 1000) continue;

      // Try to extract structured example from text
      // Pattern: Title followed by description
      const lines = trimmed.split(/\n/).filter(l => l.trim().length > 0);

      for (const line of lines) {
        const titleMatch = line.match(/^([A-Z][^.!?\n]{10,80}[.!?]?)/);
        if (titleMatch) {
          const title = titleMatch[1].trim();
          const rest = line.substring(title.length).trim();

          // Extract numbers as notes
          const notes = extractNumbersWithUnits(line);

          const example: EvidenceExample = {
            title,
            scenario: rest || 'Use case example',
            notes: notes.length > 0 ? notes : undefined,
            sourceUrl,
            snippet: line.substring(0, 300),
            capturedAt: new Date().toISOString(),
            confidence: 'medium'
          };

          const key = normalizeForDedupe(example.title + example.scenario);
          if (!seenKeys.has(key) && key.length > 10) {
            seenKeys.add(key);
            examples.push(example);
          }
          break;
        }
      }
    }
  }

  return examples;
}

/**
 * Extract examples from text content
 */
function extractFromText(text: string, sourceUrl: string): EvidenceExample[] {
  const examples: EvidenceExample[] = [];
  const seenKeys = new Set<string>();

  // Split text into paragraphs/sections
  const sections = text.split(/\n\n+/);

  for (const section of sections) {
    const trimmed = section.trim();
    if (!containsExampleKeywords(trimmed)) continue;
    if (trimmed.length < 50 || trimmed.length > 2000) continue;

    // Try to find a title (first line, often short and capitalized)
    const lines = trimmed.split(/\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) continue;

    const firstLine = lines[0];
    const titleMatch = firstLine.match(/^([A-Z][^.!?\n]{5,60}[.!?]?)$/);

    let title = titleMatch ? titleMatch[1] : firstLine.substring(0, 50);
    let scenario = '';

    // If first line looks like a title, use remaining as scenario
    if (titleMatch && lines.length > 1) {
      scenario = lines.slice(1).join(' ').substring(0, 200);
    } else {
      scenario = trimmed.substring(0, 200);
    }

    // Extract notes (numbers with units)
    const notes = extractNumbersWithUnits(trimmed);

    const example: EvidenceExample = {
      title,
      scenario,
      notes: notes.length > 0 ? notes : undefined,
      sourceUrl,
      snippet: trimmed.substring(0, 300),
      capturedAt: new Date().toISOString(),
      confidence: 'low'
    };

    const key = normalizeForDedupe(example.title + example.scenario);
    if (!seenKeys.has(key) && key.length > 10) {
      seenKeys.add(key);
      examples.push(example);
    }
  }

  return examples;
}

/**
 * Prioritize and limit examples
 */
export function prioritizeExamples(examples: EvidenceExample[], maxCount: number = 8): EvidenceExample[] {
  const scored = examples.map((ex) => {
    let priority = 0;

    // Has meaningful title
    if (ex.title && ex.title.length > 10 && ex.title.length < 100) priority += 2;

    // Has scenario
    if (ex.scenario && ex.scenario.length > 20) priority += 2;

    // Has prompt
    if (ex.input?.prompt) priority += 3;

    // Has output asset
    if (ex.output?.asset?.videoUrl || ex.output?.asset?.imageUrl) priority += 3;

    // Has notes with numbers
    if (ex.notes && ex.notes.length > 0) priority += 2;

    // Confidence
    if (ex.confidence === 'high') priority += 2;
    else if (ex.confidence === 'medium') priority += 1;

    // Snippet length (not too short)
    if (ex.snippet && ex.snippet.length > 100) priority += 1;

    // Add stable ordering
    const orderKey = `${ex.sourceUrl}-${ex.title}`;

    return { example: ex, priority, orderKey };
  });

  // Sort by priority, then stable key
  scored.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.orderKey.localeCompare(b.orderKey);
  });

  return scored.slice(0, maxCount).map(s => s.example);
}

/**
 * Main extraction function
 */
export function extractExamples(
  text: string,
  html: string,
  sourceUrl: string,
  options: { minExamples?: number; maxExamples?: number } = {}
): EvidenceExample[] {
  const { minExamples = 1, maxExamples = 8 } = options;

  // Try extracting from structured HTML first
  let examples = extractFromStructuredHtml(html, sourceUrl);

  // If no results, try text-based extraction
  if (examples.length === 0) {
    examples = extractFromText(text, sourceUrl);
  }

  // Deduplicate by normalized key
  const seen = new Set<string>();
  examples = examples.filter(ex => {
    const key = normalizeForDedupe(ex.title + (ex.scenario || ''));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Prioritize and limit
  examples = prioritizeExamples(examples, maxExamples);

  if (examples.length < minExamples) {
    console.log(`    ⚠ Only found ${examples.length} examples (wanted ${minExamples})`);
  } else {
    console.log(`    ✓ Extracted ${examples.length} examples`);
  }

  return examples;
}
