#!/usr/bin/env node

/**
 * Sync tools: Fetch, clean, cache HTML content for multiple tools
 * 
 * Usage:
 *   pnpm sync:tools -- --slug fliki
 *   pnpm sync:tools -- --slug fliki --type pricing
 *   pnpm sync:tools -- --slug fliki --force
 *   pnpm sync:tools -- --slugs invideo,heygen,veed-io
 *   pnpm sync:tools -- --all --skip fliki
 *   pnpm sync:tools -- --all --onlyFetch --concurrency 1 --skip fliki
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
 * Process invideo pricing with two rounds (monthly + yearly)
 */
async function processInVideoPricing(
  slug: string,
  url: string,
  mode: 'static' | 'dynamic',
  force: boolean
): Promise<CleanSummary[]> {
  const summaries: CleanSummary[] = [];
  
  if (mode !== 'dynamic') {
    console.log(`  ⚠ invideo pricing requires dynamic mode, skipping`);
    return summaries;
  }
  
  // Import playwright for dynamic fetching
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate to pricing page
    console.log(`  → Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(2000);
    
    // Round 1: Monthly pricing
    console.log(`  → Round 1: Fetching Monthly pricing...`);
    
    // Try to click Monthly button if exists
    const monthlySelectors = [
      'button:has-text("Monthly")',
      '[role="tab"]:has-text("Monthly")',
      'button[aria-label*="Monthly" i]',
      '[data-billing="monthly"]',
    ];
    
    let monthlyClicked = false;
    for (const selector of monthlySelectors) {
      try {
        const button = await page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          monthlyClicked = true;
          await page.waitForTimeout(2000);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!monthlyClicked) {
      console.log(`  ⚠ Monthly toggle not found, assuming default is monthly`);
    }
    
    // Wait for prices to stabilize
    await page.waitForFunction(() => {
      const text = document.body?.innerText || '';
      return /\$\d+/.test(text);
    }, { timeout: 10000 }).catch(() => {});
    
    const monthlyHtml = await page.content();
    const monthlyUrlHash = hashUrl(url + '-monthly');
    const monthlyType = 'pricing-monthly';
    
    // Check cache
    let monthlyCacheHit = false;
    if (!force && cacheExists(slug, monthlyType, monthlyUrlHash)) {
      monthlyCacheHit = true;
      console.log(`  ✓ Cache hit: ${monthlyType}`);
    } else {
      saveHtml(slug, monthlyType, monthlyUrlHash, monthlyHtml);
    }
    
    const { text: monthlyText, truncated: monthlyTruncated } = cleanHtml(monthlyHtml);
    saveText(slug, monthlyType, monthlyUrlHash, monthlyText);
    
    const monthlySummary: CleanSummary = {
      slug,
      type: monthlyType,
      sourceUrl: url,
      mode,
      htmlPath: cachePath(slug, monthlyType, monthlyUrlHash),
      textPath: textPath(slug, monthlyType, monthlyUrlHash),
      textLength: monthlyText.length,
      truncated: monthlyTruncated,
      createdAt: new Date().toISOString(),
    };
    saveSummary(slug, monthlyType, monthlySummary);
    summaries.push(monthlySummary);
    
    const monthlyStartTime = Date.now();
    const monthlySizeKB = (monthlyHtml.length / 1024).toFixed(2);
    const monthlyTextSizeKB = (monthlyText.length / 1024).toFixed(2);
    const monthlyDuration = Date.now() - monthlyStartTime;
    console.log(`  ${monthlyCacheHit ? '✓' : '→'} ${monthlyCacheHit ? 'Cached' : 'Fetched'} Monthly in ${monthlyDuration}ms`);
    console.log(`    HTML: ${monthlySummary.htmlPath} (${monthlySizeKB}KB)`);
    console.log(`    Text: ${monthlySummary.textPath} (${monthlyTextSizeKB}KB, ${monthlyText.length} chars${monthlyTruncated ? ', truncated' : ''})`);
    
    // Round 2: Yearly pricing
    console.log(`  → Round 2: Fetching Yearly pricing...`);
    
    // Click Yearly button
    const yearlySelectors = [
      'button:has-text("Yearly")',
      'button:has-text("Annual")',
      '[role="tab"]:has-text("Yearly")',
      '[role="tab"]:has-text("Annual")',
      'button[aria-label*="Yearly" i]',
      'button[aria-label*="Annual" i]',
      '[data-billing="yearly"]',
      '[data-billing="annual"]',
    ];
    
    let yearlyClicked = false;
    for (const selector of yearlySelectors) {
      try {
        const button = await page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          yearlyClicked = true;
          await page.waitForTimeout(2000);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!yearlyClicked) {
      console.log(`  ⚠ Yearly toggle not found, trying alternative methods`);
    }
    
    // Wait for prices to change (check for "billed yearly" text or price changes)
    await page.waitForFunction(() => {
      const text = document.body?.innerText?.toLowerCase() || '';
      return text.includes('billed yearly') || text.includes('billed annually');
    }, { timeout: 10000 }).catch(() => {});
    
    // Additional wait for UI to update
    await page.waitForTimeout(2000);
    
    const yearlyStartTime = Date.now();
    const yearlyHtml = await page.content();
    const yearlyUrlHash = hashUrl(url + '-yearly');
    const yearlyType = 'pricing-yearly';
    
    // Check cache
    let yearlyCacheHit = false;
    if (!force && cacheExists(slug, yearlyType, yearlyUrlHash)) {
      yearlyCacheHit = true;
      console.log(`  ✓ Cache hit: ${yearlyType}`);
    } else {
      saveHtml(slug, yearlyType, yearlyUrlHash, yearlyHtml);
    }
    
    const { text: yearlyText, truncated: yearlyTruncated } = cleanHtml(yearlyHtml);
    saveText(slug, yearlyType, yearlyUrlHash, yearlyText);
    
    const yearlySummary: CleanSummary = {
      slug,
      type: yearlyType,
      sourceUrl: url,
      mode,
      htmlPath: cachePath(slug, yearlyType, yearlyUrlHash),
      textPath: textPath(slug, yearlyType, yearlyUrlHash),
      textLength: yearlyText.length,
      truncated: yearlyTruncated,
      createdAt: new Date().toISOString(),
    };
    saveSummary(slug, yearlyType, yearlySummary);
    summaries.push(yearlySummary);
    
    const yearlySizeKB = (yearlyHtml.length / 1024).toFixed(2);
    const yearlyTextSizeKB = (yearlyText.length / 1024).toFixed(2);
    const yearlyDuration = Date.now() - yearlyStartTime;
    console.log(`  ${yearlyCacheHit ? '✓' : '→'} ${yearlyCacheHit ? 'Cached' : 'Fetched'} Yearly in ${yearlyDuration}ms`);
    console.log(`    HTML: ${yearlySummary.htmlPath} (${yearlySizeKB}KB)`);
    console.log(`    Text: ${yearlySummary.textPath} (${yearlyTextSizeKB}KB, ${yearlyText.length} chars${yearlyTruncated ? ', truncated' : ''})`);
    
    // Verify prices are different
    const monthlyPrices = monthlyText.match(/\$(\d+)/g) || [];
    const yearlyPrices = yearlyText.match(/\$(\d+)/g) || [];
    if (monthlyPrices.length > 0 && yearlyPrices.length > 0) {
      const monthlyFirstStr = monthlyPrices[0];
      const yearlyFirstStr = yearlyPrices[0];
      if (monthlyFirstStr && yearlyFirstStr) {
        const monthlyFirst = parseInt(monthlyFirstStr.replace('$', ''), 10);
        const yearlyFirst = parseInt(yearlyFirstStr.replace('$', ''), 10);
        if (monthlyFirst === yearlyFirst) {
          console.warn(`  ⚠ Warning: Monthly and yearly prices appear identical (${monthlyFirst}). Check if toggle worked.`);
        } else {
          console.log(`  ✓ Price difference detected: Monthly $${monthlyFirst} vs Yearly $${yearlyFirst}`);
        }
      }
    }
    
  } catch (error: any) {
    console.error(`  ✗ Failed: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  return summaries;
}

/**
 * Set billing mode (monthly or yearly) with multiple fallback strategies
 */
async function setBilling(
  page: any,
  mode: 'monthly' | 'yearly',
  debug: boolean = false
): Promise<boolean> {
  const isMonthly = mode === 'monthly';
  const searchText = isMonthly ? /monthly/i : /yearly|annual/i;
  const waitKeywords = isMonthly 
    ? ['billed monthly', 'pay monthly']
    : ['billed yearly', 'billed annually', '$144', 'pay yearly', 'pay annually'];
  
  // Strategy 1: getByRole button
  try {
    const button = await page.getByRole('button', { name: searchText }).first();
    if (await button.isVisible({ timeout: 2000 })) {
      await button.click();
      await page.waitForTimeout(800);
      const success = await page.waitForFunction(
        (keywords: string[]) => {
          const bodyText = document.body?.innerText?.toLowerCase() || '';
          return keywords.some(keyword => bodyText.includes(keyword.toLowerCase()));
        },
        waitKeywords,
        { timeout: 15000 }
      ).catch(() => null);
      if (success) {
        if (debug) console.log(`    ✓ Strategy 1 (getByRole button) succeeded`);
        return true;
      }
    }
  } catch (e) {
    // Continue to next strategy
  }
  
  // Strategy 2: getByRole tab
  try {
    const tab = await page.getByRole('tab', { name: searchText }).first();
    if (await tab.isVisible({ timeout: 2000 })) {
      await tab.click();
      await page.waitForTimeout(800);
      const success = await page.waitForFunction(
        (keywords: string[]) => {
          const bodyText = document.body?.innerText?.toLowerCase() || '';
          return keywords.some(keyword => bodyText.includes(keyword.toLowerCase()));
        },
        waitKeywords,
        { timeout: 15000 }
      ).catch(() => null);
      if (success) {
        if (debug) console.log(`    ✓ Strategy 2 (getByRole tab) succeeded`);
        return true;
      }
    }
  } catch (e) {
    // Continue to next strategy
  }
  
  // Strategy 3: locator with text
  const textSelectors = isMonthly
    ? ['button:has-text("Monthly")', 'button:has-text("Pay monthly")']
    : ['button:has-text("Yearly")', 'button:has-text("Annual")', 'button:has-text("Pay yearly")', 'button:has-text("Pay annually")'];
  
  for (const selector of textSelectors) {
    try {
      const button = await page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 })) {
        await button.click();
        await page.waitForTimeout(800);
        const success = await page.waitForFunction(
          (keywords: string[]) => {
            const bodyText = document.body?.innerText?.toLowerCase() || '';
            return keywords.some(keyword => bodyText.includes(keyword.toLowerCase()));
          },
          waitKeywords,
          { timeout: 15000 }
        ).catch(() => null);
        if (success) {
          if (debug) console.log(`    ✓ Strategy 3 (locator: ${selector}) succeeded`);
          return true;
        }
      }
    } catch (e) {
      // Continue to next selector
    }
  }
  
  // Strategy 4: checkbox/switch with label
  try {
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    for (const checkbox of checkboxes) {
      try {
        const label = await checkbox.locator('..').locator('label').first();
        const labelText = await label.textContent();
        if (labelText && searchText.test(labelText)) {
          const isChecked = await checkbox.isChecked();
          const shouldBeChecked = !isMonthly; // Yearly should be checked
          
          if (isChecked !== shouldBeChecked) {
            await label.click();
            await page.waitForTimeout(800);
            const success = await page.waitForFunction(
              (keywords: string[]) => {
                const bodyText = document.body?.innerText?.toLowerCase() || '';
                return keywords.some(keyword => bodyText.includes(keyword.toLowerCase()));
              },
              waitKeywords,
              { timeout: 15000 }
            ).catch(() => null);
            if (success) {
              if (debug) console.log(`    ✓ Strategy 4 (checkbox/label) succeeded`);
              return true;
            }
          }
        }
      } catch (e) {
        // Continue to next checkbox
      }
    }
  } catch (e) {
    // Continue
  }
  
  return false;
}

/**
 * Process veed-io pricing with two rounds (monthly + yearly)
 * Uses domcontentloaded + waitForSelector instead of networkidle
 */
async function processVeedIoPricing(
  slug: string,
  url: string,
  mode: 'static' | 'dynamic',
  force: boolean,
  debug: boolean = false
): Promise<CleanSummary[]> {
  const summaries: CleanSummary[] = [];
  
  if (mode !== 'dynamic') {
    console.log(`  ⚠ veed-io pricing requires dynamic mode, skipping`);
    return summaries;
  }
  
  // Import playwright for dynamic fetching
  const { chromium } = require('playwright');
  const timeout = debug ? 60000 : 90000;
  const browser = await chromium.launch({ headless: !debug });
  const page = await browser.newPage();
  
  // Ensure cache directory exists for screenshots
  const cacheDir = path.join(process.cwd(), 'scripts', 'cache', slug);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  
  try {
    // Navigate to pricing page
    console.log(`  → Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    
    // Wait for pricing content to appear (Lite/Pro or "per editor"/"billed yearly")
    console.log(`  → Waiting for pricing content...`);
    try {
      await page.waitForSelector('text=/Lite|Pro|per editor|billed yearly/i', { timeout: 15000 });
    } catch (e) {
      console.log(`  ⚠ Pricing content selector not found, waiting for any pricing-related text...`);
      await page.waitForFunction(() => {
        const text = document.body?.innerText || '';
        return /Lite|Pro|per editor|billed yearly/i.test(text);
      }, { timeout: 15000 }).catch(() => {});
    }
    
    await page.waitForTimeout(1000);
    
    // Round 1: Monthly pricing
    console.log(`  → Round 1: Fetching Monthly pricing...`);
    
    // Set billing to monthly using multi-strategy approach
    const monthlySuccess = await setBilling(page, 'monthly', debug);
    
    // Wait for "billed monthly" or "pay monthly" indicator
    let monthlyIndicatorFound = false;
    try {
      await page.waitForFunction(() => {
        const text = document.body?.innerText?.toLowerCase() || '';
        return text.includes('billed monthly') || text.includes('pay monthly');
      }, { timeout: 15000 });
      monthlyIndicatorFound = true;
      if (debug) console.log(`    ✓ Monthly indicator found`);
    } catch (e) {
      console.warn(`  ⚠ Monthly indicator not found within 15s`);
      // Save screenshot for debugging
      await page.screenshot({ path: path.join(cacheDir, 'debug-monthly.png'), fullPage: true });
      console.log(`    📸 Screenshot saved: scripts/cache/${slug}/debug-monthly.png`);
    }
    
    // View self-check: verify we got monthly view
    const monthlyBodyText = (await page.textContent('body'))?.slice(0, 4000) ?? '';
    const hasBilledMonthly = /billed monthly/i.test(monthlyBodyText);
    const hasBilledYearly = /billed yearly/i.test(monthlyBodyText);
    const hasYearlyPrice = /\$144/i.test(monthlyBodyText);
    
    console.log(`    📊 Monthly view check:`);
    console.log(`      - Contains "billed monthly": ${hasBilledMonthly ? '✓' : '✗'}`);
    console.log(`      - Contains "billed yearly": ${hasBilledYearly ? '✓' : '✗'}`);
    console.log(`      - Contains "$144": ${hasYearlyPrice ? '✓' : '✗'}`);
    
    if (!hasBilledMonthly && (hasBilledYearly || hasYearlyPrice)) {
      console.warn(`  \x1b[31m⚠ WARNING: Monthly round appears to have captured yearly view!\x1b[0m`);
    }
    
    const monthlyHtml = await page.content();
    const monthlyUrlHash = hashUrl(url + '-monthly');
    const monthlyType = 'pricing-monthly';
    
    // Check cache
    let monthlyCacheHit = false;
    if (!force && cacheExists(slug, monthlyType, monthlyUrlHash)) {
      monthlyCacheHit = true;
      console.log(`  ✓ Cache hit: ${monthlyType}`);
    } else {
      saveHtml(slug, monthlyType, monthlyUrlHash, monthlyHtml);
    }
    
    const { text: monthlyText, truncated: monthlyTruncated } = cleanHtml(monthlyHtml);
    saveText(slug, monthlyType, monthlyUrlHash, monthlyText);
    
    const monthlySummary: CleanSummary = {
      slug,
      type: monthlyType,
      sourceUrl: url,
      mode,
      htmlPath: cachePath(slug, monthlyType, monthlyUrlHash),
      textPath: textPath(slug, monthlyType, monthlyUrlHash),
      textLength: monthlyText.length,
      truncated: monthlyTruncated,
      createdAt: new Date().toISOString(),
    };
    saveSummary(slug, monthlyType, monthlySummary);
    summaries.push(monthlySummary);
    
    const monthlyStartTime = Date.now();
    const monthlySizeKB = (monthlyHtml.length / 1024).toFixed(2);
    const monthlyTextSizeKB = (monthlyText.length / 1024).toFixed(2);
    const monthlyDuration = Date.now() - monthlyStartTime;
    console.log(`  ${monthlyCacheHit ? '✓' : '→'} ${monthlyCacheHit ? 'Cached' : 'Fetched'} Monthly in ${monthlyDuration}ms`);
    console.log(`    HTML: ${monthlySummary.htmlPath} (${monthlySizeKB}KB)`);
    console.log(`    Text: ${monthlySummary.textPath} (${monthlyTextSizeKB}KB, ${monthlyText.length} chars${monthlyTruncated ? ', truncated' : ''})`);
    
    // Round 2: Yearly pricing
    console.log(`  → Round 2: Fetching Yearly pricing...`);
    
    // Set billing to yearly using multi-strategy approach
    const yearlySuccess = await setBilling(page, 'yearly', debug);
    
    // Wait for "billed yearly" or "pay yearly/annually" or "$144/year" indicator
    let yearlyIndicatorFound = false;
    try {
      await page.waitForFunction(() => {
        const text = document.body?.innerText?.toLowerCase() || '';
        return text.includes('billed yearly') || 
               text.includes('billed annually') || 
               text.includes('pay yearly') ||
               text.includes('pay annually') ||
               /\$144/i.test(text);
      }, { timeout: 15000 });
      yearlyIndicatorFound = true;
      if (debug) console.log(`    ✓ Yearly indicator found`);
    } catch (e) {
      console.warn(`  ⚠ Yearly indicator not found within 15s`);
      // Save screenshot for debugging
      await page.screenshot({ path: path.join(cacheDir, 'debug-yearly.png'), fullPage: true });
      console.log(`    📸 Screenshot saved: scripts/cache/${slug}/debug-yearly.png`);
    }
    
    // View self-check: verify we got yearly view
    const yearlyBodyText = (await page.textContent('body'))?.slice(0, 4000) ?? '';
    const hasBilledYearly2 = /billed yearly/i.test(yearlyBodyText);
    const hasYearlyPrice2 = /\$144/i.test(yearlyBodyText);
    
    console.log(`    📊 Yearly view check:`);
    console.log(`      - Contains "billed yearly": ${hasBilledYearly2 ? '✓' : '✗'}`);
    console.log(`      - Contains "$144": ${hasYearlyPrice2 ? '✓' : '✗'}`);
    
    if (!hasBilledYearly2 && !hasYearlyPrice2) {
      console.warn(`  \x1b[31m⚠ WARNING: Yearly round may not have captured yearly view!\x1b[0m`);
    }
    
    // Cross-check: both rounds should not have the same view
    const monthlyHasYearly = /billed yearly/i.test(monthlyBodyText) || /\$144/i.test(monthlyBodyText);
    const yearlyHasYearly = /billed yearly/i.test(yearlyBodyText) || /\$144/i.test(yearlyBodyText);
    
    if (monthlyHasYearly && yearlyHasYearly) {
      console.warn(`  \x1b[31m⚠ WARNING: Both rounds appear to have captured yearly view! Toggle may have failed.\x1b[0m`);
    } else if (!monthlyHasYearly && !yearlyHasYearly) {
      console.warn(`  \x1b[31m⚠ WARNING: Neither round appears to have captured yearly view! Check toggle logic.\x1b[0m`);
    }
    
    const yearlyStartTime = Date.now();
    const yearlyHtml = await page.content();
    const yearlyUrlHash = hashUrl(url + '-yearly');
    const yearlyType = 'pricing-yearly';
    
    // Check cache
    let yearlyCacheHit = false;
    if (!force && cacheExists(slug, yearlyType, yearlyUrlHash)) {
      yearlyCacheHit = true;
      console.log(`  ✓ Cache hit: ${yearlyType}`);
    } else {
      saveHtml(slug, yearlyType, yearlyUrlHash, yearlyHtml);
    }
    
    const { text: yearlyText, truncated: yearlyTruncated } = cleanHtml(yearlyHtml);
    saveText(slug, yearlyType, yearlyUrlHash, yearlyText);
    
    const yearlySummary: CleanSummary = {
      slug,
      type: yearlyType,
      sourceUrl: url,
      mode,
      htmlPath: cachePath(slug, yearlyType, yearlyUrlHash),
      textPath: textPath(slug, yearlyType, yearlyUrlHash),
      textLength: yearlyText.length,
      truncated: yearlyTruncated,
      createdAt: new Date().toISOString(),
    };
    saveSummary(slug, yearlyType, yearlySummary);
    summaries.push(yearlySummary);
    
    const yearlySizeKB = (yearlyHtml.length / 1024).toFixed(2);
    const yearlyTextSizeKB = (yearlyText.length / 1024).toFixed(2);
    const yearlyDuration = Date.now() - yearlyStartTime;
    console.log(`  ${yearlyCacheHit ? '✓' : '→'} ${yearlyCacheHit ? 'Cached' : 'Fetched'} Yearly in ${yearlyDuration}ms`);
    console.log(`    HTML: ${yearlySummary.htmlPath} (${yearlySizeKB}KB)`);
    console.log(`    Text: ${yearlySummary.textPath} (${yearlyTextSizeKB}KB, ${yearlyText.length} chars${yearlyTruncated ? ', truncated' : ''})`);
    
    // Verify prices are different
    const monthlyPrices = monthlyText.match(/\$(\d+)/g) || [];
    const yearlyPrices = yearlyText.match(/\$(\d+)/g) || [];
    if (monthlyPrices.length > 0 && yearlyPrices.length > 0) {
      const monthlyFirstStr = monthlyPrices[0];
      const yearlyFirstStr = yearlyPrices[0];
      if (monthlyFirstStr && yearlyFirstStr) {
        const monthlyFirst = parseInt(monthlyFirstStr.replace('$', ''), 10);
        const yearlyFirst = parseInt(yearlyFirstStr.replace('$', ''), 10);
        if (monthlyFirst === yearlyFirst) {
          console.warn(`  ⚠ Warning: Monthly and yearly prices appear identical (${monthlyFirst}). Check if toggle worked.`);
        } else {
          console.log(`  ✓ Price difference detected: Monthly $${monthlyFirst} vs Yearly $${yearlyFirst}`);
        }
      }
    }
    
  } catch (error: any) {
    console.error(`  ✗ Failed: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  return summaries;
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
): Promise<CleanSummary | null> {
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
    
    try {
      if (mode === 'static') {
        html = await fetchStatic(url);
      } else {
        html = await fetchDynamic(url, { slug, type });
      }
      
      // Save HTML cache
      saveHtml(slug, type, urlHash, html);
    } catch (error: any) {
      console.error(`  ✗ Fetch failed: ${error.message}`);
      return null;
    }
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
  console.log(`    Text: ${textCachePath} (${textSizeKB}KB, ${text.length} chars${truncated ? ', truncated' : ''})`);
  
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
 * Process a single tool
 */
async function processTool(
  toolSource: ToolSource,
  types: string[],
  force: boolean,
  debug: boolean = false
): Promise<{ slug: string; success: boolean; summaries: CleanSummary[] }> {
  const { slug } = toolSource;
  const summaries: CleanSummary[] = [];
  
  console.log(`\n📦 Processing ${slug}...`);
  
  for (const type of types) {
    const urlConfig = toolSource.official_urls[type as keyof typeof toolSource.official_urls];
    if (!urlConfig || !urlConfig.url || urlConfig.url.trim() === '') {
      console.error(`  ❌ Missing ${type} URL for ${slug}. Please configure official_urls.${type}.url in tools.sources.json`);
      continue;
    }
    
    console.log(`\n  Processing ${type}...`);
    
    try {
      // Special handling for invideo pricing: two rounds (monthly + yearly)
      if (slug === 'invideo' && type === 'pricing') {
        const invideoSummaries = await processInVideoPricing(
          slug,
          urlConfig.url,
          urlConfig.mode,
          force
        );
        summaries.push(...invideoSummaries);
      } else if (slug === 'veed-io' && type === 'pricing') {
        // Special handling for veed-io pricing: two rounds (monthly + yearly)
        const veedIoSummaries = await processVeedIoPricing(
          slug,
          urlConfig.url,
          urlConfig.mode,
          force,
          debug
        );
        summaries.push(...veedIoSummaries);
      } else {
        // Normal processing for other tools/types
        const summary = await processUrl(
          slug,
          type,
          urlConfig.url,
          urlConfig.mode,
          force
        );
        
        if (summary) {
          summaries.push(summary);
        }
      }
    } catch (error: any) {
      console.error(`  ✗ Failed: ${error.message}`);
    }
  }
  
  return {
    slug,
    success: summaries.length > 0,
    summaries,
  };
}

/**
 * Process tools with concurrency control
 */
async function processToolsConcurrently(
  toolSources: ToolSource[],
  types: string[],
  force: boolean,
  concurrency: number,
  debug: boolean = false
): Promise<Array<{ slug: string; success: boolean; summaries: CleanSummary[] }>> {
  const results: Array<{ slug: string; success: boolean; summaries: CleanSummary[] }> = [];
  
  for (let i = 0; i < toolSources.length; i += concurrency) {
    const batch = toolSources.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(tool => processTool(tool, types, force, debug))
    );
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Parse CLI arguments
 */
function parseArgs(): {
  slug?: string;
  slugs?: string[];
  all?: boolean;
  type?: string;
  force: boolean;
  onlyFetch: boolean;
  concurrency: number;
  skip?: string[];
  debug?: boolean;
} {
  const args = process.argv.slice(2);
  let slug: string | undefined = undefined;
  let slugs: string[] | undefined = undefined;
  let all = false;
  let type: string | undefined = undefined;
  let force = false;
  let onlyFetch = true; // Default is onlyFetch
  let concurrency = 1;
  let skip: string[] = [];
  let debug = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slug' && i + 1 < args.length) {
      slug = args[i + 1];
      i++;
    } else if (args[i] === '--slugs' && i + 1 < args.length) {
      slugs = args[i + 1].split(',').map(s => s.trim());
      i++;
    } else if (args[i] === '--all') {
      all = true;
    } else if (args[i] === '--type' && i + 1 < args.length) {
      type = args[i + 1];
      i++;
    } else if (args[i] === '--force') {
      force = true;
    } else if (args[i] === '--onlyFetch') {
      onlyFetch = true;
    } else if (args[i] === '--concurrency' && i + 1 < args.length) {
      concurrency = parseInt(args[i + 1], 10) || 1;
      i++;
    } else if (args[i] === '--skip' && i + 1 < args.length) {
      skip = args[i + 1].split(',').map(s => s.trim());
      i++;
    } else if (args[i] === '--debug') {
      debug = true;
    }
  }
  
  if (type) {
    const validTypes = ['pricing', 'features', 'terms', 'help'];
    if (!validTypes.includes(type)) {
      console.error(`Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`);
      process.exit(1);
    }
  }
  
  return { slug, slugs, all, type, force, onlyFetch, concurrency, skip, debug };
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Sync Tools: Batch Fetch, Clean, Cache\n');
  
  const { slug, slugs, all, type, force, onlyFetch, concurrency, skip, debug } = parseArgs();
  
  if (!onlyFetch) {
    console.log('Note: --onlyFetch is default. LLM extraction is not implemented.');
  }
  
  const sources = loadSources();
  
  // Determine which tools to process
  let toolSources: ToolSource[] = [];
  
  if (slug) {
    // Single slug mode
    const toolSource = sources.find(s => s.slug === slug);
    if (!toolSource) {
      console.error(`Tool source not found for slug: ${slug}`);
      process.exit(1);
    }
    toolSources = [toolSource];
  } else if (slugs && slugs.length > 0) {
    // Multiple slugs mode
    toolSources = sources.filter(s => slugs.includes(s.slug));
    if (toolSources.length !== slugs.length) {
      const found = toolSources.map(s => s.slug);
      const missing = slugs.filter(s => !found.includes(s));
      console.warn(`⚠ Warning: Some slugs not found: ${missing.join(', ')}`);
    }
  } else if (all) {
    // All tools mode
    toolSources = sources;
  } else {
    console.error('Usage:');
    console.error('  pnpm sync:tools -- --slug <slug> [--type <pricing|features>] [--force]');
    console.error('  pnpm sync:tools -- --slugs <slug1,slug2,...> [--type <pricing|features>] [--force]');
    console.error('  pnpm sync:tools -- --all [--skip <slug1,slug2>] [--type <pricing|features>] [--concurrency <n>] [--force]');
    process.exit(1);
  }
  
  // Apply skip filter
  if (skip && skip.length > 0) {
    toolSources = toolSources.filter(s => !skip.includes(s.slug));
    console.log(`\n⏭ Skipping: ${skip.join(', ')}`);
  }
  
  console.log(`\n📋 Processing ${toolSources.length} tool(s): ${toolSources.map(s => s.slug).join(', ')}`);
  console.log(`⚙️  Concurrency: ${concurrency}`);
  console.log(`🔄 Force refetch: ${force ? 'Yes' : 'No (using cache if available)'}`);
  
  // Determine which types to process
  const typesToProcess = type 
    ? [type]
    : ['pricing', 'features']; // Default to pricing and features
  
  console.log(`📄 Types: ${typesToProcess.join(', ')}\n`);
  
  // Process tools
  const results = await processToolsConcurrently(
    toolSources,
    typesToProcess,
    force,
    concurrency,
    debug || false
  );
  
  if (debug) {
    console.log(`\n🐛 Debug mode: Screenshots saved to scripts/cache/<slug>/debug-*.png`);
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Summary:');
  console.log('='.repeat(60));
  
  const successList: string[] = [];
  const failList: string[] = [];
  
  for (const result of results) {
    if (result.success) {
      successList.push(result.slug);
      console.log(`\n✓ ${result.slug}:`);
      result.summaries.forEach(summary => {
        console.log(`  ${summary.type}: ${summary.textLength} chars`);
        console.log(`    ${summary.textPath}`);
      });
    } else {
      failList.push(result.slug);
      console.log(`\n✗ ${result.slug}: Failed`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${results.length} tools`);
  console.log(`✓ Success: ${successList.length} (${successList.join(', ')})`);
  if (failList.length > 0) {
    console.log(`✗ Failed: ${failList.length} (${failList.join(', ')})`);
  }
  console.log('='.repeat(60));
  
  console.log('\n✓ Sync complete!');
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
