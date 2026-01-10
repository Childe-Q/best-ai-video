/**
 * Cache utilities for HTML content
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

const CACHE_BASE_DIR = path.join(__dirname, 'cache');

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
