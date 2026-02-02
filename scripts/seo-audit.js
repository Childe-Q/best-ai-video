#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const projectRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(projectRoot, 'src');

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function safeReadJson(filePath) {
  try {
    if (!fileExists(filePath)) return null;
    return readJson(filePath);
  } catch {
    return null;
  }
}

function sha1(text) {
  return crypto.createHash('sha1').update(text).digest('hex');
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordsFrom(text) {
  if (!text) return [];
  return normalizeText(text).split(' ').filter(Boolean);
}

function flattenStrings(value, out) {
  if (!value) return;
  if (typeof value === 'string') {
    out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => flattenStrings(item, out));
    return;
  }
  if (typeof value === 'object') {
    Object.values(value).forEach((item) => flattenStrings(item, out));
  }
}

function parseCategories(filePath) {
  const raw = readText(filePath);
  const cleaned = raw
    .replace(/export interface[\s\S]*?}\n\n/, '')
    .replace(/export const categories/, 'const categories')
    .replace(/const categories\s*:[^=]+=/, 'const categories =')
    .replace(/export type[\s\S]*?;\n/g, '');
  const fn = new Function(`${cleaned}\nreturn categories;`);
  return fn();
}

function parseCanonicalAlternatives(filePath) {
  const raw = readText(filePath);
  const cleaned = raw
    .replace(/import[^;]+;\n/g, '')
    .replace(/export const canonicalAlternativesConfigs/, 'const canonicalAlternativesConfigs')
    .replace(/const canonicalAlternativesConfigs\s*:[^=]+=/, 'const canonicalAlternativesConfigs =');
  const fn = new Function(`${cleaned}\nreturn canonicalAlternativesConfigs;`);
  return fn();
}

function extractStaticMetadata(filePath) {
  const raw = readText(filePath);
  const titleMatch = raw.match(/title:\s*['"]([^'"]+)['"]/);
  const descMatch = raw.match(/description:\s*['"]([^'"]+)['"]/);
  return {
    title: titleMatch ? titleMatch[1] : null,
    description: descMatch ? descMatch[1] : null,
  };
}

function extractH1(filePath) {
  const raw = readText(filePath);
  const match = raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (!match) return null;
  return normalizeText(match[1]);
}

function extractInternalLinks(filePath) {
  const raw = readText(filePath);
  const links = new Set();
  const regex = /href=\{?['"](\/[^'"\s#]+)[^'"}]*['"]\}?/g;
  let match;
  while ((match = regex.exec(raw))) {
    links.add(match[1]);
  }
  return Array.from(links);
}

function extractInternalLinksFromHtml(html, baseUrl) {
  const links = new Set();
  const regex = /href\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html))) {
    const href = match[1];
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    if (href.startsWith('/')) {
      links.add(href);
      continue;
    }
    try {
      const url = new URL(href, baseUrl);
      const base = new URL(baseUrl);
      if (url.origin === base.origin) {
        links.add(url.pathname + url.search);
      }
    } catch {
      // ignore malformed hrefs
    }
  }
  return Array.from(links);
}

function getSEOYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 11 ? year + 1 : year;
}

function getMetadataBaseUrl() {
  const layoutPath = path.join(srcRoot, 'app', 'layout.tsx');
  if (!fileExists(layoutPath)) return null;
  const raw = readText(layoutPath);
  const match = raw.match(/metadataBase:\s*new URL\(['"]([^'"]+)['"]\)/);
  return match ? match[1] : null;
}

function normalizeUrlForCompare(url) {
  if (!url) return null;
  try {
    const normalized = new URL(url);
    normalized.hash = '';
    if (normalized.pathname !== '/' && normalized.pathname.endsWith('/')) {
      normalized.pathname = normalized.pathname.replace(/\/+$/, '');
    }
    return normalized.toString();
  } catch {
    return url;
  }
}

function parseHtmlMeta(html, baseUrl) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]*>/i);
  let description = null;
  if (descMatch) {
    const contentMatch = descMatch[0].match(/content=["']([^"']+)["']/i);
    if (contentMatch) description = contentMatch[1].trim();
  }
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  let canonical = null;
  if (canonicalMatch) {
    const hrefMatch = canonicalMatch[0].match(/href=["']([^"']+)["']/i);
    if (hrefMatch) {
      try {
        canonical = new URL(hrefMatch[1], baseUrl).toString();
      } catch {
        canonical = hrefMatch[1];
      }
    }
  }
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? normalizeText(h1Match[1]) : null;
  return { title, description, canonical, h1 };
}

async function fetchWithRedirects(url, maxRedirects = 5) {
  const chain = [];
  let currentUrl = url;
  for (let i = 0; i <= maxRedirects; i++) {
    const response = await fetch(currentUrl, { redirect: 'manual' });
    const status = response.status;
    if (status >= 300 && status < 400) {
      const location = response.headers.get('location');
      chain.push({ url: currentUrl, status, location });
      if (!location) {
        return { finalUrl: currentUrl, status, chain, body: null };
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    const body = status === 200 ? await response.text() : null;
    return { finalUrl: currentUrl, status, chain, body };
  }
  return { finalUrl: currentUrl, status: 0, chain, body: null };
}

async function checkLinkStatus(url) {
  try {
    const headResponse = await fetch(url, { method: 'HEAD', redirect: 'manual' });
    if (headResponse.status === 405 || headResponse.status === 403) {
      const getResponse = await fetch(url, { redirect: 'manual' });
      return getResponse.status;
    }
    return headResponse.status;
  } catch {
    return 0;
  }
}

function buildVsComparisons(tools) {
  const moneyTools = ['fliki', 'zebracat', 'veed-io', 'synthesia', 'elai-io', 'pika'];
  const isMoneyTool = (slug) => moneyTools.includes(slug.toLowerCase());
  const hasMoneyTool = (toolA, toolB) => isMoneyTool(toolA.slug) || isMoneyTool(toolB.slug);
  const allTools = [...tools].sort((a, b) => b.rating - a.rating);

  const priorityAPairs = [];
  const seen = new Set();

  for (const moneyTool of tools.filter((t) => isMoneyTool(t.slug))) {
    for (const otherTool of allTools) {
      if (moneyTool.slug === otherTool.slug) continue;
      const slugA = moneyTool.slug < otherTool.slug ? moneyTool.slug : otherTool.slug;
      const slugB = moneyTool.slug < otherTool.slug ? otherTool.slug : moneyTool.slug;
      const slug = `${slugA}-vs-${slugB}`;
      if (!seen.has(slug)) {
        seen.add(slug);
        priorityAPairs.push({
          toolA: slugA === moneyTool.slug ? moneyTool : otherTool,
          toolB: slugB === otherTool.slug ? otherTool : moneyTool,
          slug,
        });
      }
    }
  }

  const priorityBPairs = [];
  const topTools = allTools.slice(0, 15);
  for (let i = 0; i < topTools.length; i++) {
    for (let j = i + 1; j < topTools.length; j++) {
      const toolA = topTools[i];
      const toolB = topTools[j];
      if (hasMoneyTool(toolA, toolB)) continue;
      const sharedTags = toolA.tags.filter((tag) => toolB.tags.includes(tag));
      const slug = `${toolA.slug}-vs-${toolB.slug}`;
      if ((sharedTags.length > 0 || (i < 5 && j < 5)) && !seen.has(slug)) {
        seen.add(slug);
        priorityBPairs.push({ toolA, toolB, slug });
      }
    }
  }

  const allComparisons = [...priorityAPairs, ...priorityBPairs.slice(0, 20)];
  return allComparisons.slice(0, 50);
}

function buildRoutes({ tools, categories, comparisons }) {
  const routes = [];
  routes.push({ url: '/', type: 'home', file: 'src/app/page.tsx' });
  routes.push({ url: '/about', type: 'about', file: 'src/app/about/page.tsx' });
  routes.push({ url: '/terms', type: 'terms', file: 'src/app/terms/page.tsx' });
  routes.push({ url: '/privacy', type: 'privacy', file: 'src/app/privacy/page.tsx' });
  routes.push({ url: '/features', type: 'features-hub', file: 'src/app/features/page.tsx' });
  routes.push({ url: '/vs', type: 'vs-index', file: 'src/app/vs/page.tsx' });
  routes.push({ url: '/out/veed', type: 'out-veed', file: 'src/app/out/veed/page.tsx' });

  categories.forEach((category) => {
    routes.push({
      url: `/features/${category.slug}`,
      type: 'feature-category',
      file: 'src/app/features/[slug]/page.tsx',
      category,
    });
  });

  tools.forEach((tool) => {
    routes.push({ url: `/tool/${tool.slug}`, type: 'tool', file: 'src/app/tool/[slug]/page.tsx', tool });
    routes.push({ url: `/tool/${tool.slug}/alternatives`, type: 'tool-alternatives', file: 'src/app/tool/[slug]/alternatives/page.tsx', tool });
    routes.push({ url: `/tool/${tool.slug}/pricing`, type: 'tool-pricing', file: 'src/app/tool/[slug]/pricing/page.tsx', tool });
    routes.push({ url: `/tool/${tool.slug}/reviews`, type: 'tool-reviews', file: 'src/app/tool/[slug]/reviews/page.tsx', tool });
    routes.push({ url: `/tool/${tool.slug}/features`, type: 'tool-features', file: 'src/app/tool/[slug]/features/page.tsx', tool });
    routes.push({ url: `/alternatives/${tool.slug}`, type: 'alternatives-redirect', file: 'src/app/alternatives/[slug]/page.tsx', tool, redirectTo: `/tool/${tool.slug}/alternatives` });
  });

  comparisons.forEach((comparison) => {
    routes.push({ url: `/vs/${comparison.slug}`, type: 'vs-detail', file: 'src/app/vs/[slug]/page.tsx', comparison });
  });

  routes.sort((a, b) => a.url.localeCompare(b.url));
  return routes;
}

function buildTitleAndDescription(route, context) {
  const seoYear = context.seoYear;
  const toolCount = context.tools.length;
  const displayCount = toolCount >= 10 ? `${toolCount}+` : '';

  switch (route.type) {
    case 'home':
      return {
        title: `${displayCount ? `${displayCount} ` : ''}Best AI Video Generators & Tools ${seoYear} | Free & Paid Reviews`,
        description: `Discover ${displayCount ? `${displayCount} ` : ''}best AI video generators for ${seoYear}. Free plans, no watermark, text-to-video, 4K export. In-depth reviews, pricing comparisons & alternatives for YouTube creators.`,
      };
    case 'about':
    case 'terms':
    case 'privacy':
      return extractStaticMetadata(path.join(projectRoot, route.file));
    case 'features-hub':
      return {
        title: `Explore AI Video Tools by Use Case ${seoYear}`,
        description: 'Discover AI video tools organized by use case. Find the perfect tool for text-to-video, avatars, editing, social media, and more.',
      };
    case 'vs-index':
      return {
        title: `AI Video Tools Comparison | Side-by-Side Comparisons ${seoYear}`,
        description: 'Compare AI video generators side-by-side with data-driven analysis, test results, and performance metrics.',
      };
    case 'out-veed':
      return {
        title: 'Veed.io 50% Off Deal | Best AI Video Tools',
        description: 'Claim the official Veed.io deal via Best AI Video Tools. Copy the secure link or open in a new tab.',
      };
    case 'feature-category':
      if (!route.category) return { title: null, description: null };
      return {
        title: `${route.category.title} | Best AI Video Tools`,
        description: route.category.metaDescription || route.category.description,
      };
    case 'tool':
      return {
        title: `${route.tool.name} Review, Pricing & Best Alternatives (${seoYear})`,
        description: `Is ${route.tool.name} worth it? In-depth review of pricing, features, pros & cons, and top competitors like ${context.firstOtherTool(route.tool)?.name || 'top alternatives'}.`,
      };
    case 'tool-alternatives':
      return {
        title: `${route.tool.name} Alternatives (${seoYear}): Best Replacements by Use Case`,
        description: `Looking for better than ${route.tool.name}? Compare top alternatives based on cost control, output quality, workflow speed, and control features.`,
      };
    case 'tool-pricing':
      return {
        title: `${route.tool.name} Plans & Pricing ${seoYear}`,
        description: `Choose a plan that fits best for ${route.tool.name}. Compare pricing, features, and find the perfect plan for your needs.`,
      };
    case 'tool-reviews':
      return {
        title: `${route.tool.name} Reviews & User Feedback (${seoYear})`,
        description: `Read real user reviews and feedback about ${route.tool.name}. See what users love and what could be improved.`,
      };
    case 'tool-features':
      return {
        title: `${route.tool.name} Features & Capabilities (${seoYear})`,
        description: `Explore all features and capabilities of ${route.tool.name}. See what makes it stand out and who it's best for.`,
      };
    case 'alternatives-redirect':
      return { title: null, description: null };
    case 'vs-detail':
      if (!route.comparison || !route.comparison.toolA || !route.comparison.toolB) {
        return { title: 'Comparison Not Found', description: 'The requested comparison could not be found.' };
      }
      return {
        title: `${route.comparison.toolA.name} vs ${route.comparison.toolB.name} ${seoYear}: Detailed Comparison & Test Results`,
        description: `Side-by-side test of ${route.comparison.toolA.name} vs ${route.comparison.toolB.name} AI video generators: pricing, features, real prompt outputs, and winner verdict based on data.`,
      };
    default:
      return { title: null, description: null };
  }
}

function buildContentText(route, context) {
  const pieces = [];

  if (route.tool) {
    const tool = route.tool;
    flattenStrings(
      {
        name: tool.name,
        tagline: tool.tagline,
        short_description: tool.short_description,
        best_for: tool.best_for,
        highlights: tool.highlights,
        key_facts: tool.key_facts,
        pros: tool.pros,
        cons: tool.cons,
        features: tool.features,
        pricing_plans: tool.pricing_plans,
        long_review: tool.long_review,
        review_content: tool.review_content,
        faqs: tool.faqs,
      },
      pieces
    );

    const contentJson = context.toolContent.get(tool.slug);
    if (contentJson) {
      flattenStrings(contentJson, pieces);
    }

    const pricingJson = context.pricingContent.get(tool.slug);
    if (pricingJson) {
      flattenStrings(pricingJson, pieces);
    }

    const reviewsJson = context.reviewsContent.get(tool.slug);
    if (reviewsJson) {
      flattenStrings(reviewsJson, pieces);
    }
  }

  if (route.category) {
    flattenStrings(route.category, pieces);
    const toolsForCategory = context.tools.filter((tool) => tool.tags?.includes(route.category.tag));
    pieces.push(...toolsForCategory.map((tool) => tool.name));
  }

  if (route.comparison) {
    const { toolA, toolB } = route.comparison;
    flattenStrings(
      {
        toolA: toolA.name,
        toolB: toolB.name,
        tagsA: toolA.tags,
        tagsB: toolB.tags,
        prosA: toolA.pros,
        consA: toolA.cons,
        prosB: toolB.pros,
        consB: toolB.cons,
      },
      pieces
    );
  }

  if (route.type === 'tool-alternatives') {
    const config = context.canonicalAlternatives[route.tool.slug];
    if (config) {
      flattenStrings(config, pieces);
    }
  }

  if (route.type === 'home') {
    pieces.push(...context.tools.map((tool) => tool.name));
  }

  return pieces.join(' ');
}

function hasCanonicalHint(filePath) {
  const raw = readText(filePath);
  return /canonical|alternates/.test(raw);
}

function buildAudit() {
  const tools = readJson(path.join(srcRoot, 'data', 'tools.json'));
  const categories = parseCategories(path.join(srcRoot, 'data', 'categories.ts'));
  const canonicalAlternatives = parseCanonicalAlternatives(path.join(srcRoot, 'data', 'alternatives', 'canonical.ts'));

  const toolContent = new Map();
  const contentDir = path.join(projectRoot, 'content', 'tools');
  if (fileExists(contentDir)) {
    fs.readdirSync(contentDir)
      .filter((file) => file.endsWith('.json'))
      .forEach((file) => {
        const slug = file.replace(/\.json$/, '');
        const data = safeReadJson(path.join(contentDir, file));
        if (data) toolContent.set(slug, data);
      });
  }

  const pricingContent = new Map();
  const pricingDir = path.join(srcRoot, 'data', 'pricing');
  if (fileExists(pricingDir)) {
    fs.readdirSync(pricingDir)
      .filter((file) => file.endsWith('.json'))
      .forEach((file) => {
        const slug = file.replace(/\.json$/, '');
        const data = safeReadJson(path.join(pricingDir, file));
        if (data) pricingContent.set(slug, data);
      });
  }

  const reviewsContent = new Map();
  const reviewsDir = path.join(srcRoot, 'data', 'reviews');
  if (fileExists(reviewsDir)) {
    fs.readdirSync(reviewsDir)
      .filter((file) => file.endsWith('.json'))
      .forEach((file) => {
        const slug = file.replace(/\.json$/, '');
        const data = safeReadJson(path.join(reviewsDir, file));
        if (data) reviewsContent.set(slug, data);
      });
  }

  const comparisons = buildVsComparisons(tools);
  const routes = buildRoutes({ tools, categories, comparisons });
  const seoYear = getSEOYear();

  const context = {
    tools,
    categories,
    seoYear,
    canonicalAlternatives,
    toolContent,
    pricingContent,
    reviewsContent,
    firstOtherTool: (tool) => tools.find((t) => t.id !== tool.id),
  };

  const knownPaths = new Set(routes.map((route) => route.url));
  const toolSlugs = new Set(tools.map((tool) => tool.slug));
  const categorySlugs = new Set(categories.map((category) => category.slug));

  function isKnownInternalRoute(href) {
    if (knownPaths.has(href)) return true;
    if (href === '/' || href.startsWith('/?')) return true;

    const toolMatch = href.match(/^\/tool\/([^/]+)(?:\/(alternatives|pricing|reviews|features))?$/);
    if (toolMatch && toolSlugs.has(toolMatch[1])) return true;

    const alternativesMatch = href.match(/^\/alternatives\/([^/]+)$/);
    if (alternativesMatch && toolSlugs.has(alternativesMatch[1])) return true;

    const featuresMatch = href.match(/^\/features\/([^/]+)$/);
    if (featuresMatch && categorySlugs.has(featuresMatch[1])) return true;

    const vsMatch = href.match(/^\/vs\/([^/]+-vs-[^/]+)$/);
    if (vsMatch) {
      const [slugA, slugB] = vsMatch[1].split('-vs-');
      if (toolSlugs.has(slugA) && toolSlugs.has(slugB)) return true;
    }

    return false;
  }

  const results = routes.map((route) => {
    const meta = buildTitleAndDescription(route, context);
    const filePath = path.join(projectRoot, route.file);
    const h1 = extractH1(filePath);
    const internalLinks = extractInternalLinks(filePath);
    const contentText = buildContentText(route, context);
    const wordCount = wordsFrom(contentText).length;
    const fingerprint = sha1(normalizeText(contentText));
    const hasCanonical = hasCanonicalHint(filePath);

    return {
      url: route.url,
      type: route.type,
      file: route.file,
      title: meta.title,
      description: meta.description,
      h1,
      internalLinks,
      wordCount,
      fingerprint,
      hasCanonical,
      redirectTo: route.redirectTo || null,
      tool: route.tool || null,
      category: route.category || null,
      comparison: route.comparison || null,
    };
  });

  const missingTitle = results.filter((r) => !r.title && r.type !== 'alternatives-redirect');
  const duplicateTitles = new Map();
  results.forEach((r) => {
    if (!r.title) return;
    const list = duplicateTitles.get(r.title) || [];
    list.push(r);
    duplicateTitles.set(r.title, list);
  });
  const duplicateTitleGroups = Array.from(duplicateTitles.entries()).filter(([, list]) => list.length > 1);

  const missingCanonical = results.filter((r) => {
    if (r.type === 'alternatives-redirect') return false;
    return !r.hasCanonical;
  });

  const linkIssues = [];
  results.forEach((r) => {
    const broken = [];
    r.internalLinks.forEach((href) => {
      const normalized = href.split('?')[0].split('#')[0];
      if (normalized === '') return;
      if (normalized.startsWith('/') && !isKnownInternalRoute(normalized)) {
        broken.push(normalized);
      }
    });
    if (broken.length > 0) {
      linkIssues.push({ url: r.url, file: r.file, broken });
    }
  });

  const thinPages = results.filter((r) => {
    if (r.type === 'alternatives-redirect') return false;
    const minWords = r.type.startsWith('tool') ? 200 : 120;
    return r.wordCount < minWords;
  });

  const emptyStates = [];
  results.forEach((r) => {
    if (r.type === 'feature-category' && r.category) {
      const toolsForCategory = tools.filter((tool) => tool.tags?.includes(r.category.tag));
      if (toolsForCategory.length === 0) {
        emptyStates.push({
          url: r.url,
          file: r.file,
          reason: `No tools found for category tag "${r.category.tag}"`,
        });
      }
    }
  });

  const duplicateContent = [];
  const seenPairs = new Set();
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const a = results[i];
      const b = results[j];
      if (a.type !== b.type) continue;
      const key = `${a.url}::${b.url}`;
      if (seenPairs.has(key)) continue;
      const wordsA = new Set(wordsFrom(buildContentText({ ...a, tool: a.tool, category: a.category, comparison: a.comparison }, context)));
      const wordsB = new Set(wordsFrom(buildContentText({ ...b, tool: b.tool, category: b.category, comparison: b.comparison }, context)));
      if (wordsA.size === 0 || wordsB.size === 0) continue;
      const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
      const union = new Set([...wordsA, ...wordsB]).size;
      const similarity = union === 0 ? 0 : intersection / union;
      if (similarity >= 0.92) {
        duplicateContent.push({
          urlA: a.url,
          urlB: b.url,
          type: a.type,
          similarity: Number(similarity.toFixed(2)),
          titleA: a.title,
          titleB: b.title,
        });
      }
    }
  }

  return {
    results,
    missingTitle,
    duplicateTitleGroups,
    missingCanonical,
    linkIssues,
    thinPages,
    emptyStates,
    duplicateContent,
    knownPaths,
    toolSlugs,
    categorySlugs,
  };
}

function formatTable(headers, rows) {
  const lines = [];
  lines.push(`| ${headers.join(' | ')} |`);
  lines.push(`| ${headers.map(() => '---').join(' | ')} |`);
  rows.forEach((row) => {
    lines.push(`| ${row.map((cell) => (cell === null || cell === undefined ? '' : String(cell))).join(' | ')} |`);
  });
  return lines.join('\n');
}

function writeReport(audit, options, live) {
  const baseUrl = options.baseUrl || 'http://localhost:3000';
  const now = new Date().toISOString();
  const total = audit.results.length;

  const lines = [];
  lines.push(`# SEO Audit Report`);
  lines.push('');
  lines.push(`- Generated: ${now}`);
  lines.push(`- Base URL: ${baseUrl}`);
  lines.push(`- Mode: Static analysis (no live rendering)`);
  lines.push(`- Total URLs scanned: ${total}`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push(formatTable(
    ['Metric', 'Count'],
    [
      ['Missing titles', audit.missingTitle.length],
      ['Duplicate titles (groups)', audit.duplicateTitleGroups.length],
      ['Missing canonical', audit.missingCanonical.length],
      ['Broken internal link targets', audit.linkIssues.length],
      ['Thin content pages', audit.thinPages.length],
      ['Empty state risks', audit.emptyStates.length],
      ['Duplicate content risk pairs', audit.duplicateContent.length],
    ]
  ));
  lines.push('');

  lines.push('## Missing Titles');
  lines.push('');
  if (audit.missingTitle.length === 0) {
    lines.push('None found.');
  } else {
    lines.push(formatTable(
      ['URL', 'Type', 'File', 'Likely cause'],
      audit.missingTitle.map((r) => [r.url, r.type, r.file, 'No metadata export or generateMetadata for this route'])
    ));
  }
  lines.push('');

  lines.push('## Duplicate Titles');
  lines.push('');
  if (audit.duplicateTitleGroups.length === 0) {
    lines.push('None found.');
  } else {
    audit.duplicateTitleGroups.forEach(([title, group]) => {
      lines.push(`### ${title}`);
      lines.push(formatTable(
        ['URL', 'Type', 'File'],
        group.map((r) => [r.url, r.type, r.file])
      ));
      lines.push('');
    });
  }

  lines.push('## Missing or Incomplete Canonical');
  lines.push('');
  if (audit.missingCanonical.length === 0) {
    lines.push('None found.');
  } else {
    lines.push(formatTable(
      ['URL', 'Type', 'File', 'Likely cause'],
      audit.missingCanonical.map((r) => [r.url, r.type, r.file, 'No `alternates.canonical` or canonical metadata in route'])
    ));
  }
  lines.push('');

  lines.push('## Broken Internal Links');
  lines.push('');
  if (audit.linkIssues.length === 0) {
    lines.push('None found.');
  } else {
    const rows = [];
    audit.linkIssues.forEach((issue) => {
      issue.broken.forEach((target) => {
        rows.push([issue.url, issue.file, target, 'Target route not found in generated route list']);
      });
    });
    lines.push(formatTable(['Source URL', 'File', 'Broken href', 'Likely cause'], rows));
  }
  lines.push('');

  lines.push('## Thin / Empty Content Risks');
  lines.push('');
  if (audit.thinPages.length === 0 && audit.emptyStates.length === 0) {
    lines.push('None found.');
  } else {
    if (audit.thinPages.length > 0) {
      lines.push('### Low Content Volume');
      lines.push(formatTable(
        ['URL', 'Type', 'File', 'Word count', 'Likely cause'],
        audit.thinPages.map((r) => [r.url, r.type, r.file, r.wordCount, 'Sparse tool/content data or fallback-only sections'])
      ));
      lines.push('');
    }
    if (audit.emptyStates.length > 0) {
      lines.push('### Empty States');
      lines.push(formatTable(
        ['URL', 'File', 'Reason'],
        audit.emptyStates.map((r) => [r.url, r.file, r.reason])
      ));
      lines.push('');
    }
  }

  lines.push('## Duplicate Content Risk');
  lines.push('');
  if (audit.duplicateContent.length === 0) {
    lines.push('None found.');
  } else {
    lines.push(formatTable(
      ['URL A', 'URL B', 'Type', 'Similarity', 'Title A', 'Title B'],
      audit.duplicateContent.map((r) => [r.urlA, r.urlB, r.type, r.similarity, r.titleA || '', r.titleB || ''])
    ));
  }

  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- This report is derived from static analysis of source files and data (no live rendering).');
  lines.push('- Canonical checks are based on source code presence of `alternates.canonical`, not runtime HTML.');
  lines.push('- Internal link checks only include literal href values in page components; links in child components are not included.');
  lines.push('');
  lines.push('## Live Audit');
  lines.push('');
  if (!live) {
    lines.push('Live mode not run. Set `AUDIT_LIVE=1` to enable live fetching.');
  } else {
    lines.push(`- Base URL: ${live.baseUrl}`);
    lines.push(`- Total URLs fetched: ${live.results.length}`);
    lines.push('');
    lines.push('### Live Summary');
    lines.push(formatTable(
      ['Metric', 'Count'],
      [
        ['Non-200 responses', live.non200.length],
        ['Redirect chains', live.redirects.length],
        ['Missing canonical', live.missingCanonical.length],
        ['Canonical mismatch', live.canonicalMismatch.length],
        ['Broken internal links', live.brokenLinks.length],
      ]
    ));
    lines.push('');
    lines.push('### Non-200 Responses');
    lines.push(live.non200.length === 0 ? 'None found.' : formatTable(
      ['URL', 'Final URL', 'Status', 'Redirects'],
      live.non200.map((r) => [r.url, r.finalUrl, r.status, r.redirectChain.length])
    ));
    lines.push('');
    lines.push('### Redirect Chains');
    lines.push(live.redirects.length === 0 ? 'None found.' : formatTable(
      ['URL', 'Final URL', 'Status', 'Redirects'],
      live.redirects.map((r) => [r.url, r.finalUrl, r.status, r.redirectChain.length])
    ));
    lines.push('');
    lines.push('### Canonical Issues');
    if (live.missingCanonical.length === 0 && live.canonicalMismatch.length === 0) {
      lines.push('None found.');
    } else {
      if (live.missingCanonical.length > 0) {
        lines.push('#### Missing Canonical');
        lines.push(formatTable(
          ['URL', 'Final URL', 'Status'],
          live.missingCanonical.map((r) => [r.url, r.finalUrl, r.status])
        ));
        lines.push('');
      }
      if (live.canonicalMismatch.length > 0) {
        lines.push('#### Canonical Mismatch');
        lines.push(formatTable(
          ['URL', 'Final URL', 'Canonical'],
          live.canonicalMismatch.map((r) => [r.url, r.finalUrl, r.canonical])
        ));
        lines.push('');
      }
    }
    lines.push('');
    lines.push('### Broken Internal Links (Live)');
    lines.push(live.brokenLinks.length === 0 ? 'None found.' : formatTable(
      ['Source URL', 'Broken href', 'Status'],
      live.brokenLinks.map((r) => [r.sourceUrl, r.href, r.status])
    ));
  }

  const reportDir = path.join(projectRoot, 'reports');
  if (!fileExists(reportDir)) fs.mkdirSync(reportDir);
  const reportPath = path.join(reportDir, 'seo-audit.md');
  fs.writeFileSync(reportPath, lines.join('\n'));

  return reportPath;
}

async function runLiveAudit(audit, baseUrl) {
  const results = [];
  const non200 = [];
  const redirects = [];
  const missingCanonical = [];
  const canonicalMismatch = [];
  const brokenLinks = [];
  const brokenChecked = new Map();

  for (const route of audit.results) {
    const absoluteUrl = new URL(route.url, baseUrl).toString();
    const response = await fetchWithRedirects(absoluteUrl);
    const meta = response.body ? parseHtmlMeta(response.body, response.finalUrl) : { title: null, description: null, canonical: null, h1: null };
    const internalLinks = response.body ? extractInternalLinksFromHtml(response.body, baseUrl) : [];

    const record = {
      url: route.url,
      finalUrl: response.finalUrl,
      status: response.status,
      redirectChain: response.chain,
      title: meta.title,
      description: meta.description,
      canonical: meta.canonical,
      h1: meta.h1,
      internalLinks,
    };
    results.push(record);

    if (response.status !== 200) non200.push(record);
    if (response.chain.length > 0) redirects.push(record);

    if (!meta.canonical) {
      missingCanonical.push(record);
    } else {
      const canonicalNormalized = normalizeUrlForCompare(meta.canonical);
      const finalNormalized = normalizeUrlForCompare(response.finalUrl);
      if (canonicalNormalized && finalNormalized && canonicalNormalized !== finalNormalized) {
        canonicalMismatch.push(record);
      }
    }

    for (const href of internalLinks) {
      const normalized = href.split('#')[0];
      if (brokenChecked.has(normalized)) {
        if (brokenChecked.get(normalized) !== 200) {
          brokenLinks.push({ sourceUrl: route.url, href: normalized, status: brokenChecked.get(normalized) });
        }
        continue;
      }
      const absoluteLink = new URL(normalized, baseUrl).toString();
      const status = await checkLinkStatus(absoluteLink);
      brokenChecked.set(normalized, status);
      if (status >= 400 || status === 0) {
        brokenLinks.push({ sourceUrl: route.url, href: normalized, status });
      }
    }
  }

  return {
    baseUrl,
    results,
    non200,
    redirects,
    missingCanonical,
    canonicalMismatch,
    brokenLinks,
  };
}

async function main() {
  const metadataBase = getMetadataBaseUrl();
  const staticBaseUrl = metadataBase || 'http://localhost:3000';
  const liveBaseUrl = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
  const audit = buildAudit();
  const live = process.env.AUDIT_LIVE === '1' ? await runLiveAudit(audit, liveBaseUrl) : null;
  const reportPath = writeReport(audit, { baseUrl: staticBaseUrl }, live);
  console.log(`SEO audit report written to ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
