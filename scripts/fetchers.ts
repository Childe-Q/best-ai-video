/**
 * Fetchers for static and dynamic content
 */

interface FetchOptions {
  timeout?: number;
  retries?: number;
  slug?: string;
  type?: string;
}

interface AutoRenderResult {
  html: string;
  renderMode: 'fetch' | 'playwright';
}

const DEFAULT_TIMEOUT = 15000; // 15 seconds
const DEFAULT_RETRIES = 2;
const MIN_TEXT_LENGTH_THRESHOLD = 1000; // Minimum text length to consider page as non-empty

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
  const { slug, type } = opts;
  let lastError: Error | null = null;
  let lastHtml: string | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let browser: any = null;
    let page: any = null;
    
    try {
      // Dynamic import to avoid requiring playwright at build time
      const { chromium } = await import('playwright');
      const fs = await import('fs');
      const path = await import('path');
      
      const startTime = Date.now();
      console.log(`  → Fetching dynamic content from ${url}... (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      browser = await chromium.launch({ headless: true });
      page = await browser.newPage();
      
      // Performance optimization: block images and fonts
      await page.route("**/*", (route: any) => {
        const rt = route.request().resourceType();
        if (rt === "image" || rt === "font") {
          return route.abort();
        }
        return route.continue();
      });
      
      // Use domcontentloaded instead of networkidle
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 90000,
      });
      
      // Wait for initial content
      await page.waitForTimeout(3000);
      
      // Handle cookie banner (if present)
      try {
        const cookieButton = await page.getByRole('button', { name: /accept|agree|got it/i }).first();
        if (await cookieButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await cookieButton.click();
          await page.waitForTimeout(500);
          console.log(`  ✓ Cookie banner dismissed`);
        }
      } catch (cookieError) {
        // Cookie banner not found or already dismissed, continue
      }
      
      // Wait for page content with keywords (generic pricing page keywords)
      try {
        await page.waitForFunction(() => {
          const t = document.body?.innerText?.toLowerCase() || "";
          return t.includes("pricing") || 
                 t.includes("per month") || 
                 t.includes("billed") || 
                 t.includes("starter") || 
                 t.includes("pro") || 
                 t.includes("business") || 
                 t.includes("$");
        }, { timeout: 30000 });
      } catch (waitError) {
        // Continue even if waitForFunction times out
        console.log(`  ⚠ Keyword wait timeout, continuing...`);
      }
      
      // Scroll to trigger lazy loading
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1000);
      
      const html = await page.content();
      const duration = Date.now() - startTime;
      
      console.log(`  ✓ Successfully fetched in ${duration}ms`);
      
      return html;
    } catch (error: any) {
      lastError = error;
      console.error(`  ✗ Fetch failed: ${error.message}`);
      
      // Save debug files even on failure
      if (page && slug && type) {
        try {
          const fs = await import('fs');
          const path = await import('path');
          const { hashUrl } = await import('./cache');
          
          const urlHash = hashUrl(url);
          const cacheDir = path.join(__dirname, 'cache', slug);
          
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }
          
          const html = await page.content();
          const failHtmlPath = path.join(cacheDir, `${type}-${urlHash}.fail.html`);
          const screenshotPath = path.join(cacheDir, `${type}-${urlHash}.png`);
          
          fs.writeFileSync(failHtmlPath, html, 'utf-8');
          await page.screenshot({ path: screenshotPath, fullPage: true });
          
          console.log(`  📸 Debug files saved: ${failHtmlPath}, ${screenshotPath}`);
          
          // Return HTML even on failure
          lastHtml = html;
        } catch (saveError: any) {
          console.error(`  ⚠ Failed to save debug files: ${saveError.message}`);
        }
      }
      
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

  // Return last HTML if available, even if there was an error
  if (lastHtml) {
    console.log(`  ⚠ Returning partial content despite errors`);
    return lastHtml;
  }

  throw lastError || new Error('Failed to fetch dynamic content');
}

/**
 * Extract text content from HTML (used for shell detection)
 */
function extractTextFromHtml(html: string): string {
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
  if (text.length < MIN_TEXT_LENGTH_THRESHOLD) {
    return true;
  }

  // Check for common JS shell indicators
  const jsShellPatterns = [
    /react-root/i,
    /loading\.\.\./i,
    /spinner/i,
    /\[data-reactroot\]/i,
    /window\.__INITIAL_STATE__/i,
    /<div id="root">/i,
  ];

  for (const pattern of jsShellPatterns) {
    if (pattern.test(html)) {
      return true;
    }
  }

  // Check if main content area is essentially empty
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    const bodyText = bodyMatch[1].replace(/<[^>]+>/g, '').trim();
    if (bodyText.length < 200) {
      return true;
    }
  }

  return false;
}

/**
 * Auto-render fetch: try fetch first, if empty shell detected, use playwright
 */
export async function fetchWithAutoRender(url: string, opts: FetchOptions = {}): Promise<AutoRenderResult> {
  console.log(`  → Attempting fetch (auto mode)...`);

  try {
    const html = await fetchStatic(url, { ...opts, retries: 1 });
    const text = extractTextFromHtml(html);

    if (!isJsShell(text, html)) {
      console.log(`  ✓ Fetch successful, text length: ${text.length} chars`);
      return { html, renderMode: 'fetch' };
    }

    console.log(`  ⚠ Detected JS shell (text: ${text.length} chars), falling back to Playwright`);
  } catch (fetchError: any) {
    console.log(`  ⚠ Fetch failed: ${fetchError.message}, trying Playwright`);
  }

  // Fallback to playwright
  console.log(`  → Fetching with Playwright...`);
  const html = await fetchDynamic(url, opts);
  const text = extractTextFromHtml(html);
  console.log(`  ✓ Playwright successful, text length: ${text.length} chars`);

  return { html, renderMode: 'playwright' };
}
