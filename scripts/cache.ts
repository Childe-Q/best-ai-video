/**
 * Cache utilities for HTML content
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

const CACHE_BASE_DIR = path.join(__dirname, 'cache');

/**
 * Page snapshot with metadata
 */
export interface PageSnapshot {
  rawHtml: string;
  text: string;
  sourceUrl: string;
  fetchedAt: string;
  extractedTextLen: number;
  renderMode: 'fetch' | 'playwright';
  description?: string;
}

/**
 * Ensure directory exists
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Generate short hash from URL (first 12 characters)
 */
export function hashUrl(url: string): string {
  const hash = createHash('sha256').update(url).digest('hex');
  return hash.substring(0, 12);
}

/**
 * Get cache file path
 */
export function cachePath(slug: string, type: string, urlHash: string): string {
  const dir = path.join(CACHE_BASE_DIR, slug);
  return path.join(dir, `${type}-${urlHash}.html`);
}

/**
 * Get snapshot file path
 */
export function snapshotPath(slug: string, type: string, urlHash: string): string {
  const dir = path.join(CACHE_BASE_DIR, slug);
  return path.join(dir, `${type}-${urlHash}.snapshot.json`);
}

/**
 * Save HTML to cache
 */
export function saveHtml(slug: string, type: string, urlHash: string, html: string): void {
  const filePath = cachePath(slug, type, urlHash);
  const dir = path.dirname(filePath);

  ensureDir(dir);
  fs.writeFileSync(filePath, html, 'utf-8');
}

/**
 * Load HTML from cache
 * Returns HTML string if exists, null otherwise
 */
export function loadHtml(slug: string, type: string, urlHash: string): string | null {
  const filePath = cachePath(slug, type, urlHash);

  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }

  return null;
}

/**
 * Check if cache exists
 */
export function cacheExists(slug: string, type: string, urlHash: string): boolean {
  const filePath = cachePath(slug, type, urlHash);
  return fs.existsSync(filePath);
}

/**
 * Save page snapshot with metadata
 */
export function saveSnapshot(slug: string, type: string, urlHash: string, snapshot: PageSnapshot): void {
  const filePath = snapshotPath(slug, type, urlHash);
  const dir = path.dirname(filePath);

  ensureDir(dir);
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
}

/**
 * Load page snapshot
 * Returns snapshot if exists, null otherwise
 */
export function loadSnapshot(slug: string, type: string, urlHash: string): PageSnapshot | null {
  const filePath = snapshotPath(slug, type, urlHash);

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as PageSnapshot;
  }

  return null;
}

/**
 * List all snapshots for a slug
 */
export function listSnapshots(slug: string): Array<{ type: string; urlHash: string; path: string }> {
  const slugDir = path.join(CACHE_BASE_DIR, slug);
  const results: Array<{ type: string; urlHash: string; path: string }> = [];

  if (!fs.existsSync(slugDir)) {
    return results;
  }

  const files = fs.readdirSync(slugDir);
  for (const file of files) {
    if (file.endsWith('.snapshot.json')) {
      // Parse type and urlHash from filename: type-urlHash.snapshot.json
      const match = file.match(/^(.+)-([a-f0-9]{12})\.snapshot\.json$/);
      if (match) {
        results.push({
          type: match[1],
          urlHash: match[2],
          path: path.join(slugDir, file)
        });
      }
    }
  }

  return results;
}

/**
 * Get all cache files for a slug
 */
export function listCacheFiles(slug: string): Array<{ type: string; urlHash: string; path: string }> {
  const slugDir = path.join(CACHE_BASE_DIR, slug);
  const results: Array<{ type: string; urlHash: string; path: string }> = [];

  if (!fs.existsSync(slugDir)) {
    return results;
  }

  const files = fs.readdirSync(slugDir);
  for (const file of files) {
    if (file.endsWith('.html') && !file.endsWith('.fail.html')) {
      // Parse type and urlHash from filename: type-urlHash.html
      const match = file.match(/^(.+)-([a-f0-9]{12})\.html$/);
      if (match) {
        results.push({
          type: match[1],
          urlHash: match[2],
          path: path.join(slugDir, file)
        });
      }
    }
  }

  return results;
}
