/**
 * Fetchers for static and dynamic content
 */

interface FetchOptions {
  timeout?: number;
  retries?: number;
}

const DEFAULT_TIMEOUT = 15000; // 15 seconds
const DEFAULT_RETRIES = 2;

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch static content using fetch API
 */
export async function fetchStatic(url: string, opts: FetchOptions = {}): Promise<string> {
  const timeout = opts.timeout || DEFAULT_TIMEOUT;
  const maxRetries = opts.retries || DEFAULT_RETRIES;
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      return html;
    } catch (error: any) {
      lastError = error;
      
      if (attempt < maxRetries) {
        // Exponential backoff: 500ms, 1500ms
        const delay = 500 * Math.pow(3, attempt);
        console.log(`  ⚠ Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Failed to fetch');
}

/**
 * Fetch dynamic content using Playwright
 */
export async function fetchDynamic(url: string, opts: FetchOptions = {}): Promise<string> {
  const maxRetries = opts.retries || DEFAULT_RETRIES;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let browser: any = null;
    
    try {
      // Dynamic import to avoid requiring playwright at build time
      const { chromium } = await import('playwright');
      
      const startTime = Date.now();
      console.log(`  → Fetching dynamic content from ${url}... (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 45000,
      });
      
      // Additional wait for late-loading content
      await page.waitForTimeout(800);
      
      const html = await page.content();
      const duration = Date.now() - startTime;
      
      console.log(`  ✓ Successfully fetched in ${duration}ms`);
      
      return html;
    } catch (error: any) {
      lastError = error;
      console.error(`  ✗ Fetch failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 500ms, 1500ms
        const delay = 500 * Math.pow(3, attempt);
        console.log(`  ⚠ Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await sleep(delay);
      }
    } finally {
      // Always close browser
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error(`  ⚠ Error closing browser: ${closeError}`);
        }
      }
    }
  }

  throw lastError || new Error('Failed to fetch dynamic content');
}
