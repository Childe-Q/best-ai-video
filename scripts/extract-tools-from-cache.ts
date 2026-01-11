#!/usr/bin/env node

/**
 * Extract pricing and features from cached txt files and update tools.json
 * 
 * Usage:
 *   pnpm extract:tools -- --slugs veed-io,invideo
 *   pnpm extract:tools -- --all
 *   pnpm extract:tools -- --all --skip fliki
 */

import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';

interface ToolSource {
  slug: string;
  official_urls: {
    pricing?: { url: string; mode: 'static' | 'dynamic' };
    features?: { url: string; mode: 'static' | 'dynamic' };
  };
}

interface PricingPlan {
  id?: string;
  name: string;
  tagline?: string;
  price: {
    monthly: { amount: number; currency: string; period: string };
    yearly?: { amount: number; currency: string; period: string };
  };
  unitPriceNote?: string;
  addonLabel?: string;
  addons?: any[];
  ctaText?: string;
  billingNote?: string;
  ribbonText?: string;
  featureItems?: Array<{ text: string; badge?: string }>;
}

interface FeatureCard {
  title: string;
  description: string;
  icon: string;
}

type PricingGateResult = { passed: boolean; reason?: string };

interface Tool {
  slug: string;
  pricing_plans?: PricingPlan[];
  featureCards?: FeatureCard[];
  [key: string]: any;
}

const ICONS = ['play', 'video', 'film', 'camera', 'mic', 'image', 'sparkles', 'wand', 'zap', 'star'];
const VARIANTS = ['purple', 'indigo', 'blue', 'red'];

/**
 * Default slugs to skip (cash flow tools / benchmark samples)
 * These are skipped by default unless explicitly included via --slugs or --includeFliki
 */
const DEFAULT_SKIP = ['fliki'];

/**
 * Load sources configuration
 */
function loadSources(): ToolSource[] {
  const sourcesFile = path.join(__dirname, '../src/data/sources/tools.sources.json');
  return JSON.parse(fs.readFileSync(sourcesFile, 'utf-8'));
}

/**
 * Load tools.json
 */
function loadTools(): Tool[] {
  const toolsFile = path.join(__dirname, '../src/data/tools.json');
  return JSON.parse(fs.readFileSync(toolsFile, 'utf-8'));
}

/**
 * Save tools.json with backup
 */
function saveTools(tools: Tool[]): void {
  const toolsFile = path.join(__dirname, '../src/data/tools.json');
  const backupFile = path.join(__dirname, '../src/data/tools.backup.json');
  
  // Backup existing file
  if (fs.existsSync(toolsFile)) {
    fs.copyFileSync(toolsFile, backupFile);
    console.log(`  📦 Backup created: tools.backup.json`);
  }
  
  fs.writeFileSync(toolsFile, JSON.stringify(tools, null, 2) + '\n', 'utf-8');
}

/**
 * Get latest cache file for a slug and type
 */
function getLatestCacheFile(slug: string, type: string, extension: string = '.txt'): string | null {
  const cacheDir = path.join(__dirname, 'cache', slug);
  if (!fs.existsSync(cacheDir)) {
    return null;
  }
  
  const files = fs.readdirSync(cacheDir)
    .filter(f => f.startsWith(`${type}-`) && f.endsWith(extension))
    .map(f => path.join(cacheDir, f));
  
  if (files.length === 0) {
    return null;
  }
  
  // Sort by modification time, get latest
  files.sort((a, b) => {
    const statA = fs.statSync(a);
    const statB = fs.statSync(b);
    return statB.mtimeMs - statA.mtimeMs;
  });
  
  return files[0];
}

/**
 * Find section container by keywords (for veed-io, zebracat, etc.)
 * Searches for text nodes containing any keyword, then walks up the DOM tree
 * to find a reasonable container (section/main/div) with text length 2k-50k chars
 */
function findSectionByKeywords($: cheerio.CheerioAPI, keywords: string[]): cheerio.Cheerio<any> | null {
  const keywordPattern = new RegExp(keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
  
  // Find all elements that contain any keyword
  const candidates: Array<{ element: cheerio.Cheerio<any>; score: number }> = [];
  const seenContainers = new Set<string>();
  
  // Strategy 1: Look for semantic containers first (section, main, article)
  $('section, main, article').each((_, el) => {
    const $el = $(el);
    const text = $el.text();
    
    if (keywordPattern.test(text)) {
      const textLength = text.length;
      
      // Check if this container is reasonable (2k-50k chars)
      if (textLength >= 2000 && textLength <= 50000) {
        const matches = (text.match(keywordPattern) || []).length;
        const tagName = $el.prop('tagName')?.toLowerCase() || '';
        const score = matches * 10 + (tagName === 'section' ? 10 : tagName === 'main' ? 5 : 0);
        
        const containerId = $el.attr('id') || $el.attr('class') || '';
        if (!seenContainers.has(containerId)) {
          seenContainers.add(containerId);
          candidates.push({ element: $el, score });
        }
      }
    }
  });
  
  // Strategy 2: If no semantic containers found, search all elements
  if (candidates.length === 0) {
    $('*').each((_, el) => {
      const $el = $(el);
      const text = $el.text();
      
      // Check if this element's text contains any keyword
      if (keywordPattern.test(text)) {
        // Walk up the DOM tree to find a reasonable container
        let $container = $el;
        let depth = 0;
        const maxDepth = 10;
        
        while (depth < maxDepth && $container.length > 0) {
          const containerText = $container.text();
          const textLength = containerText.length;
          
          // Check if this container is reasonable (2k-50k chars)
          if (textLength >= 2000 && textLength <= 50000) {
            // Check if it's a semantic container
            const tagName = $container.prop('tagName')?.toLowerCase();
            if (tagName === 'section' || tagName === 'main' || tagName === 'article' || tagName === 'div') {
              // Count keyword matches in this container
              const matches = (containerText.match(keywordPattern) || []).length;
              const score = matches * 10 + (tagName === 'section' ? 5 : 0);
              
              const containerId = $container.attr('id') || $container.attr('class') || '';
              if (!seenContainers.has(containerId)) {
                seenContainers.add(containerId);
                candidates.push({ element: $container, score });
              }
              break; // Found a good container, stop walking up
            }
          }
          
          // Move to parent
          $container = $container.parent();
          depth++;
        }
      }
    });
  }
  
  if (candidates.length === 0) {
    return null;
  }
  
  // Sort by score, get highest
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].element;
}

/**
 * Find pricing root container in HTML
 */
function findPricingRoot($: cheerio.CheerioAPI): cheerio.Cheerio<any> | null {
  const candidates: Array<{ element: cheerio.Cheerio<any>; score: number }> = [];
  
  // Try different container selectors
  const selectors = ['section', 'main', 'article', 'div'];
  
  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const $el = $(el);
      const text = $el.text();
      
      // Count price hits
      const priceHits = (text.match(/\$\d+|Custom\s+pricing|Contact\s+(sales|us)/gi) || []).length;
      
      // Count plan title hits (h1-h4, excluding generic titles)
      const headings = $el.find('h1, h2, h3, h4');
      let planTitleHits = 0;
      headings.each((_, h) => {
        const headingText = $(h).text().toLowerCase();
        if (!/pricing|plans?|choose|select/i.test(headingText)) {
          planTitleHits++;
        }
      });
      
      // Score: prioritize containers with multiple prices
      if (priceHits >= 2) {
        const score = priceHits * 10 + planTitleHits;
        candidates.push({ element: $el, score });
      }
    });
  }
  
  if (candidates.length === 0) {
    return null;
  }
  
  // Sort by score, get highest
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].element;
}

/**
 * Split pricing root into plan cards
 */
function splitPlanCards($root: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): cheerio.Cheerio<any>[] {
  const cards: cheerio.Cheerio<any>[] = [];
  
  // Try different card selectors (priority order)
  const cardSelectors = [
    '[class*="card"]',
    '[class*="plan"]',
    '[class*="tier"]',
    '[class*="pricing"]',
    'article',
    'li',
    'div[class*="col"]',
  ];
  
  for (const selector of cardSelectors) {
    const found = $root.find(selector);
    if (found.length > 0) {
      found.each((_, el) => {
        const $card = $(el);
        const text = $card.text();
        
        // Check if card has price and title
        const hasPrice = /\$\d+|Custom\s+pricing|Contact\s+(sales|us)|Free|\$0/i.test(text);
        const hasTitle = $card.find('h1, h2, h3, h4').length > 0 || 
                         /^(Free|Plus|Max|Pro|Premium|Basic|Standard|Starter|Lite|Business|Team|Enterprise|Generative)/i.test(text.trim());
        
        if (hasPrice && hasTitle) {
          cards.push($card);
        }
      });
      
      if (cards.length >= 2) {
        break; // Found enough cards with this selector
      }
    }
  }
  
  // Fallback: if no cards found, try text-based splitting
  if (cards.length === 0) {
    const text = $root.text();
    
    // Look for plan patterns: "PlanName" followed by price or "best for"
    // Common plan names (order matters - longer names first)
    const planNames = ['Enterprise', 'Generative', 'Business', 'Standard', 'Starter', 'Premium', 'Free', 'Plus', 'Max', 'Pro', 'Basic', 'Lite', 'Team'];
    const planPattern = new RegExp(`\\b(${planNames.join('|')})\\b`, 'gi');
    
    // Find all plan occurrences with context
    const planMatches: Array<{ name: string; index: number }> = [];
    let match;
    while ((match = planPattern.exec(text)) !== null) {
      const planName = match[1];
      const index = match.index;
      // Check if this looks like a plan (followed by price, "best for", or "Custom")
      const context = text.substring(index, Math.min(index + 300, text.length));
      if (/\$\d+|best\s+for|Custom|custom|Contact/i.test(context)) {
        // Avoid duplicates
        const existing = planMatches.find(m => m.name.toLowerCase() === planName.toLowerCase());
        if (!existing) {
          planMatches.push({ name: planName, index });
        }
      }
    }
    
    // Create virtual cards from plan matches
    if (planMatches.length >= 2) {
      // Sort by index
      planMatches.sort((a, b) => a.index - b.index);
      
      // Create sections for each plan
      for (let i = 0; i < planMatches.length; i++) {
        const start = planMatches[i].index;
        const end = i < planMatches.length - 1 ? planMatches[i + 1].index : Math.min(start + 1500, text.length);
        const sectionText = text.substring(start, end);
        
        // Create a virtual element
        const $virtualCard = $('<div>').text(sectionText);
        cards.push($virtualCard);
      }
    }
  }
  
  return cards;
}

/**
 * Extract plan from a card element
 */
function extractPlanFromCard($card: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): PricingPlan | null {
  const text = $card.text();
  
  // Extract plan name from first heading or text pattern
  let planName = '';
  const headings = $card.find('h1, h2, h3, h4').first();
  if (headings.length > 0) {
    planName = headings.text().trim();
    // Clean: remove "Best value", "Popular", etc.
    planName = planName.replace(/\s*(Best\s+value|Popular|Recommended|Most\s+popular)\s*/i, '').trim();
  }
  
  // If no heading or heading doesn't look like a plan name, try text patterns
  const validPlanNames = ['Free', 'Plus', 'Max', 'Pro', 'Premium', 'Basic', 'Standard', 'Starter', 'Lite', 'Business', 'Team', 'Enterprise', 'Generative'];
  
  if (!planName || planName.length > 30 || !validPlanNames.some(n => planName.toLowerCase().includes(n.toLowerCase()))) {
    // Look for plan name at start of text (common patterns)
    const planNamePatterns = [
      // Start of text: "Plus best for" or "Free $0"
      /^(Free|Plus|Max|Pro|Premium|Basic|Standard|Starter|Lite|Business|Team|Enterprise|Generative)\b/i,
      // After whitespace: " Plus best" or " Free $0"
      /\s+(Free|Plus|Max|Pro|Premium|Basic|Standard|Starter|Lite|Business|Team|Enterprise|Generative)\s+(?:best|for|plan|tier|pricing|\$)/i,
      // Before price: "Plus $28" or "Max $50"
      /\b(Free|Plus|Max|Pro|Premium|Basic|Standard|Starter|Lite|Business|Team|Enterprise|Generative)\s*\$?\d+/i,
      // Before "best for": "Plus best for stock"
      /\b(Free|Plus|Max|Pro|Premium|Basic|Standard|Starter|Lite|Business|Team|Enterprise|Generative)\s+best\s+for/i,
    ];
    
    for (const pattern of planNamePatterns) {
      const match = text.match(pattern);
      if (match) {
        const extracted = match[1] || match[0].split(/\s+/)[0];
        if (validPlanNames.some(n => extracted.toLowerCase() === n.toLowerCase())) {
          planName = extracted;
          break;
        }
      }
    }
  }
  
  // Clean plan name: remove trailing words like "best", "for", etc.
  if (planName) {
    // Extract first word if it's a valid plan name
    const firstWord = planName.split(/\s+/)[0].trim();
    if (validPlanNames.some(n => firstWord.toLowerCase() === n.toLowerCase())) {
      planName = firstWord;
    } else {
      // Try to find plan name in the string
      for (const validName of validPlanNames) {
        if (planName.toLowerCase().includes(validName.toLowerCase())) {
          planName = validName;
          break;
        }
      }
    }
    // Remove common suffixes
    planName = planName.replace(/\s+(best|for|plan|tier|pricing).*$/i, '').trim();
  }
  
  // Final validation: must be a valid plan name
  if (!planName || planName.length < 2 || planName.length > 20) {
    return null;
  }
  
  // Normalize plan name: find matching valid name and use its capitalization
  const matchedName = validPlanNames.find(n => n.toLowerCase() === planName.toLowerCase());
  if (!matchedName) {
    return null;
  }
  planName = matchedName; // Use correct capitalization
  
  const plan: Partial<PricingPlan> = {
    name: planName,
    price: {
      monthly: { amount: 0, currency: 'USD', period: 'month' },
    },
  };
  
  // Check for Custom/Enterprise pricing (must check before price extraction)
  if (planName.toLowerCase() === 'enterprise' || 
      (/Custom\s+pricing|Contact\s+(sales|us)|Let'?s\s+talk/i.test(text) && 
       !/\$\d+/.test(text))) {
    if (plan.price) {
      plan.price.monthly.amount = 0;
    }
    plan.unitPriceNote = 'Custom pricing';
    plan.ctaText = 'Contact Sales';
    plan.billingNote = /billed\s+yearly/i.test(text) ? '*Billed yearly' : undefined;
    return plan as PricingPlan;
  }
  
  // Check for Free plan (must check before price extraction)
  if (planName.toLowerCase() === 'free' || 
      (/\$0/i.test(text) && /free|trial/i.test(text))) {
    if (plan.price) {
      plan.price.monthly.amount = 0;
    }
    plan.ctaText = 'Get Started';
    return plan as PricingPlan;
  }
  
  // Extract prices: look for all $XX patterns
  const priceMatches = text.match(/\$(\d+)/g);
  if (!priceMatches || priceMatches.length === 0) {
    return null; // No price found
  }
  
  // Priority 1: Extract monthly price (first $XX/month or $XX/mo) - this is the most reliable
  // Look for price pattern close to plan name (within first 300 chars to catch "$35/month")
  const planNamePos = text.toLowerCase().indexOf(planName.toLowerCase());
  if (planNamePos >= 0) {
    const searchStart = planNamePos;
    const searchEnd = Math.min(text.length, searchStart + 300);
    const searchText = text.substring(searchStart, searchEnd);
    
    // Try multiple patterns (order matters: most specific first)
    const patterns = [
      /\$(\d+)\/month/i,           // $35/month (no spaces)
      /\$(\d+)\s*\/\s*month/i,     // $35 / month (with spaces)
      /\$(\d+)\/mo/i,              // $35/mo (no spaces)
      /\$(\d+)\s*\/\s*mo/i,        // $35 / mo (with spaces)
      /\$(\d+)\s+per\s+month/i,    // $35 per month
      /\$(\d+)\s+month/i,          // $35 month
    ];
    
    for (const pattern of patterns) {
      const match = searchText.match(pattern);
      if (match && plan.price) {
        plan.price.monthly.amount = parseInt(match[1], 10);
        break;
      }
    }
  }
  
  // Fallback: search entire text if not found near plan name
  if (plan.price && plan.price.monthly.amount === 0) {
    const fallbackPatterns = [
      /\$(\d+)\/month/i,
      /\$(\d+)\s*\/\s*month/i,
      /\$(\d+)\s+per\s+month/i,
    ];
    for (const pattern of fallbackPatterns) {
      const match = text.match(pattern);
      if (match && plan.price) {
        plan.price.monthly.amount = parseInt(match[1], 10);
        break;
      }
    }
  }
  
  // Priority 2: Extract yearly price: "*Billed $XXX yearly" or "billed yearly as $XXX"
  const yearlyMatch = text.match(/\*?\s*Billed\s+\$(\d+)\s+yearly|\*?\s*Billed\s+yearly\s+as\s+\$(\d+)/i);
  if (yearlyMatch && plan.price) {
    const yearlyTotal = parseInt(yearlyMatch[1] || yearlyMatch[2], 10);
    const monthlyFromYearly = Math.round(yearlyTotal / 12);
    
    // If we didn't find monthly price, use calculated from yearly
    if (plan.price.monthly.amount === 0) {
      plan.price.monthly.amount = monthlyFromYearly;
    }
    
    // Set yearly price (monthly equivalent)
    plan.price.yearly = {
      amount: monthlyFromYearly,
      currency: 'USD',
      period: 'month',
    };
    plan.billingNote = '*Billed yearly';
  } else {
    // Priority 3: Check for discount pattern: "$28 $17 per month" (monthly $28, yearly $17/month)
    const discountMatch = text.match(/\$(\d+)\s+\$(\d+)\s+per\s+month/i);
    if (discountMatch && plan.price) {
      const monthlyAmount = parseInt(discountMatch[1], 10);
      const yearlyAmount = parseInt(discountMatch[2], 10);
      plan.price.monthly.amount = monthlyAmount;
      plan.price.yearly = {
        amount: yearlyAmount,
        currency: 'USD',
        period: 'month',
      };
      plan.billingNote = '*Billed yearly';
    } else if (plan.price && plan.price.monthly.amount === 0 && priceMatches.length > 0) {
      // Fallback: use first reasonable price found (but avoid yearly totals like $336, $1200)
      const firstPrice = parseInt(priceMatches[0].replace('$', ''), 10);
      // If price is very high (>200), it's likely a yearly total, skip it
      if (firstPrice <= 200) {
        plan.price.monthly.amount = firstPrice;
      } else {
        // Try to find a smaller price
        for (let i = 1; i < priceMatches.length; i++) {
          const price = parseInt(priceMatches[i].replace('$', ''), 10);
          if (price <= 200) {
            plan.price.monthly.amount = price;
            break;
          }
        }
      }
    }
  }
  
  // Final validation: if we still don't have a monthly price, return null
  if (plan.price?.monthly.amount === 0 && !plan.unitPriceNote) {
    return null;
  }
  
  // Extract features from list items
  const features: Array<{ text: string }> = [];
  $card.find('li').each((_, li) => {
    const featureText = $(li).text().trim();
    // Filter out pricing-related text
    if (featureText.length > 5 && 
        featureText.length < 80 &&
        !/\$|per\s+month|billed|start|get|trial/i.test(featureText)) {
      features.push({ text: featureText });
    }
  });
  
  // Also try to extract from text lines (fallback)
  if (features.length === 0) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    for (const line of lines) {
      if (line.length > 5 && line.length < 80 &&
          !/\$|per\s+month|billed|start|get|trial|plan|pricing/i.test(line) &&
          /^[A-Z]/.test(line)) {
        features.push({ text: line });
        if (features.length >= 8) break;
      }
    }
  }
  
  if (features.length > 0) {
    plan.featureItems = features.slice(0, 8);
  }
  
  // Set CTA
  plan.ctaText = planName.toLowerCase() === 'free' ? 'Get Started' : 'Start Free Trial';
  
  return plan as PricingPlan;
}

/**
 * Dynamically extract plan cards from HTML DOM (no hardcoded plan names)
 */
function extractPlanCardsDynamically($: cheerio.CheerioAPI, $root: cheerio.Cheerio<any>): cheerio.Cheerio<any>[] {
  const cards: cheerio.Cheerio<any>[] = [];
  
  // Strategy 1: Look for common pricing card containers
  const cardSelectors = [
    '[class*="card"][class*="pricing"]',
    '[class*="plan"][class*="card"]',
    '[class*="pricing"][class*="tier"]',
    '[class*="pricing-card"]',
    '[class*="plan-card"]',
    '[data-plan]',
    '[data-tier]',
  ];
  
  for (const selector of cardSelectors) {
    const found = $root.find(selector);
    if (found.length >= 2) {
      found.each((i, el) => {
        cards.push($(el));
      });
      if (cards.length >= 2) {
        console.log(`  ✓ Found ${cards.length} plan cards using selector: ${selector}`);
        return cards;
      }
    }
  }
  
  // Strategy 2: Look for grid/table structures with pricing info
  const gridSelectors = [
    '[class*="grid"] > div',
    '[class*="flex"] > div',
    'table tbody tr',
    '[class*="row"] > div',
  ];
  
  for (const selector of gridSelectors) {
    const found = $root.find(selector);
    if (found.length >= 2) {
      // Filter: must contain price or plan-like content
      const validCards: cheerio.Cheerio<any>[] = [];
      found.each((i, el) => {
        const $el = $(el);
        const text = $el.text();
        // Must have price or plan indicators
        if (/\$\d+|\b(Free|Pro|Plus|Max|Premium|Basic|Standard|Starter|Business|Team|Enterprise|Custom|Contact)\b/i.test(text)) {
          validCards.push($el);
        }
      });
      if (validCards.length >= 2) {
        console.log(`  ✓ Found ${validCards.length} plan cards using grid selector: ${selector}`);
        return validCards;
      }
    }
  }
  
  // Strategy 3: Look for headings followed by price sections
  const headings = $root.find('h1, h2, h3, h4, h5, h6');
  if (headings.length >= 2) {
    const headingCards: cheerio.Cheerio<any>[] = [];
    headings.each((i, el) => {
      const $heading = $(el);
      const headingText = $heading.text().trim();
      // Check if heading looks like a plan name
      if (/^(Free|Pro|Plus|Max|Premium|Basic|Standard|Starter|Business|Team|Enterprise|Lite|Generative|Creator|Advanced)\b/i.test(headingText)) {
        // Find parent container (card-like structure)
        let $container = $heading.parent();
        // Walk up to find a card-like container
        for (let j = 0; j < 5 && $container.length > 0; j++) {
          const containerClass = $container.attr('class') || '';
          if (containerClass.includes('card') || containerClass.includes('plan') || containerClass.includes('pricing') || 
              containerClass.includes('tier') || $container.is('article') || $container.is('section')) {
            headingCards.push($container);
            break;
          }
          $container = $container.parent();
        }
        // Fallback: use heading's next siblings
        if (headingCards.length <= i) {
          const $siblings = $heading.nextUntil('h1, h2, h3, h4, h5, h6');
          if ($siblings.length > 0) {
            const $wrapper = $('<div>');
            $wrapper.append($heading.clone());
            $siblings.each((k, sib) => {
              $wrapper.append($(sib).clone());
            });
            headingCards.push($wrapper);
          }
        }
      }
    });
    if (headingCards.length >= 2) {
      console.log(`  ✓ Found ${headingCards.length} plan cards using heading strategy`);
      return headingCards;
    }
  }
  
  return cards;
}

/**
 * Extract plan name from card element (dynamic, no hardcoded names)
 */
function extractPlanNameFromCard($card: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): string | null {
  const text = $card.text();
  
  // Multi-word plan names (must check before single-word patterns)
  const multiWordPlans = [
    'Super Cat', 'Unlimited Cat', 'Cat Mode',
    'Business Plus', 'Business Pro', 'Team Pro',
    'AI Video', 'Video Pro', 'Video Plus',
  ];
  
  // Strategy 1: Look for heading (h1-h6) with plan-like name
  const headings = $card.find('h1, h2, h3, h4, h5, h6').first();
  if (headings.length > 0) {
    let headingText = headings.text().trim();
    // Clean: remove "Best value", "Popular", etc.
    headingText = headingText.replace(/\s*(Best\s+value|Popular|Recommended|Most\s+popular|🔥|⭐)\s*/gi, '').trim();
    
    // Check for multi-word plan names first
    for (const multiWord of multiWordPlans) {
      if (new RegExp(`\\b${multiWord.replace(/\s+/g, '\\s+')}\\b`, 'i').test(headingText)) {
        // Normalize: "Cat Mode" -> "Standard", "Super Cat" -> "Super Cat", "Unlimited Cat" -> "Unlimited Cat"
        if (multiWord === 'Cat Mode') {
          return 'Standard';
        }
        return multiWord;
      }
    }
    
    // Extract first word if it looks like a plan name
    const firstWord = headingText.split(/\s+/)[0];
    if (/^(Free|Pro|Plus|Max|Premium|Basic|Standard|Starter|Business|Team|Enterprise|Lite|Generative|Creator|Advanced)$/i.test(firstWord)) {
      return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
    }
    // Check if heading contains a plan name
    const planMatch = headingText.match(/\b(Free|Pro|Plus|Max|Premium|Basic|Standard|Starter|Business|Team|Enterprise|Lite|Generative|Creator|Advanced)\b/i);
    if (planMatch) {
      return planMatch[1].charAt(0).toUpperCase() + planMatch[1].slice(1).toLowerCase();
    }
  }
  
  // Strategy 2: Look for multi-word plan names in full text
  for (const multiWord of multiWordPlans) {
    const pattern = new RegExp(`\\b${multiWord.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (pattern.test(text)) {
      if (multiWord === 'Cat Mode') {
        return 'Standard';
      }
      return multiWord;
    }
  }
  
  // Strategy 3: Look for plan name at start of text
  const startPatterns = [
    /^(Free|Pro|Plus|Max|Premium|Basic|Standard|Starter|Business|Team|Enterprise|Lite|Generative|Creator|Advanced)\b/i,
    /^(Free|Pro|Plus|Max|Premium|Basic|Standard|Starter|Business|Team|Enterprise|Lite|Generative|Creator|Advanced)\s+(best|for|plan|tier|pricing)/i,
    /^(Free|Pro|Plus|Max|Premium|Basic|Standard|Starter|Business|Team|Enterprise|Lite|Generative|Creator|Advanced)\s*\$?\d+/i,
  ];
  
  for (const pattern of startPatterns) {
    const match = text.match(pattern);
    if (match) {
      const planName = match[1];
      return planName.charAt(0).toUpperCase() + planName.slice(1).toLowerCase();
    }
  }
  
  // Strategy 4: Look for data attributes
  const dataPlan = $card.attr('data-plan') || $card.attr('data-tier') || $card.attr('data-name');
  if (dataPlan) {
    // Check multi-word plans in data attributes
    for (const multiWord of multiWordPlans) {
      if (new RegExp(`\\b${multiWord.replace(/\s+/g, '\\s+')}\\b`, 'i').test(dataPlan)) {
        if (multiWord === 'Cat Mode') {
          return 'Standard';
        }
        return multiWord;
      }
    }
    const planMatch = dataPlan.match(/\b(Free|Pro|Plus|Max|Premium|Basic|Standard|Starter|Business|Team|Enterprise|Lite|Generative|Creator|Advanced)\b/i);
    if (planMatch) {
      return planMatch[1].charAt(0).toUpperCase() + planMatch[1].slice(1).toLowerCase();
    }
  }
  
  return null;
}

/**
 * Extract pricing plans from pricing HTML (dynamic, no hardcoded plan names)
 */
function extractPricingPlansFromHtml(html: string, slug: string, isYearly: boolean = false): PricingPlan[] {
  const $ = cheerio.load(html);
  
  // Special handling for invideo (keep existing logic for now, will refactor later)
  if (slug === 'invideo') {
    return extractInVideoPlansFromHtml(html, isYearly);
  }
  
  // Special handling for heygen: try __NEXT_DATA__ first, fallback to window-match
  if (slug === 'heygen') {
    return extractHeyGenPlansFromHtml(html, isYearly);
  }
  
  // Special handling for veed-io: try __NEXT_DATA__ first, fallback to section-based extraction
  if (slug === 'veed-io') {
    // Step 1: Try to extract from __NEXT_DATA__
    console.log(`  🔍 Attempting to extract from __NEXT_DATA__...`);
    const nextDataScript = $('#__NEXT_DATA__');
    if (nextDataScript.length > 0) {
      try {
        const nextDataText = nextDataScript.text();
        const nextData = JSON.parse(nextDataText);
        
        // Recursively search for pricing plan data
        const foundPlans = searchPlansInNextData(nextData);
        if (foundPlans.length >= 2) {
          console.log(`  ✓ Found ${foundPlans.length} plans in __NEXT_DATA__`);
          return foundPlans;
        } else {
          console.log(`  ⚠ Found only ${foundPlans.length} plan(s) in __NEXT_DATA__, falling back to section-based extraction`);
        }
      } catch (error) {
        console.log(`  ⚠ Failed to parse __NEXT_DATA__: ${error instanceof Error ? error.message : 'Unknown error'}, falling back to section-based extraction`);
      }
    } else {
      console.log(`  ⚠ __NEXT_DATA__ script not found, falling back to section-based extraction`);
    }
    
    // Step 2: Fallback to section-based extraction
    return extractVeedIoPlansFromHtml(html, isYearly, $);
  }
  
  // Special handling for zebracat: find pricing section by keywords first
  if (slug === 'zebracat') {
    return extractZebracatPlansFromHtml(html, isYearly, $);
  }
  
  // Find pricing root
  const $root = findPricingRoot($);
  if (!$root || $root.length === 0) {
    console.log(`  ⚠ Could not find pricing root container`);
    return [];
  }
  
  // Extract plan cards dynamically (no hardcoded plan names)
  let cards = extractPlanCardsDynamically($, $root);
  
  // If no cards found, try text-based fallback (still dynamic, no hardcoded names)
  if (cards.length === 0) {
    const text = $root.text();
    // Dynamic plan name detection: look for common patterns
    const planPattern = /\b(Free|Pro|Plus|Max|Premium|Basic|Standard|Starter|Business|Team|Enterprise|Lite|Generative|Creator|Advanced)\b/gi;
    
    const planMatches: Array<{ name: string; index: number; context: string }> = [];
    let match;
    const usedIndices = new Set<number>();
    const seenNames = new Set<string>();
    
    while ((match = planPattern.exec(text)) !== null) {
      const planName = match[1];
      const index = match.index;
      
      // Skip if we already used this index (avoid duplicates)
      if (usedIndices.has(index)) continue;
      
      const context = text.substring(index, Math.min(index + 400, text.length));
      
      // Validation: check if this looks like a real plan card
      let isValid = false;
      
      if (planName.toLowerCase() === 'free') {
        // Free plan: must have $0 or "Video mins" or "AI credit" or "Free" indicators
        isValid = /\$0|Video\s+mins|AI\s+credit|free\s+trial|free\s+plan/i.test(context);
      } else if (planName.toLowerCase() === 'enterprise') {
        // Enterprise plan: must have "Custom" or "Contact" or "Custom pricing"
        isValid = /Custom|custom|Contact|contact|Custom\s+pricing/i.test(context);
      } else {
        // Other plans: must have price or "best for" or plan indicators
        isValid = /\$\d+|best\s+for|per\s+month|\/month|\/mo/i.test(context);
      }
      
      if (!isValid) continue;
      
      // Avoid duplicates: same plan name at similar position
      const existing = planMatches.find(m => 
        m.name.toLowerCase() === planName.toLowerCase() && 
        Math.abs(m.index - index) < 50
      );
      if (!existing) {
        planMatches.push({ name: planName, index, context });
        usedIndices.add(index);
        seenNames.add(planName.toLowerCase());
      }
    }
    
    if (planMatches.length >= 2) {
      // Sort by index
      planMatches.sort((a, b) => a.index - b.index);
      
      // Create sections for each plan
      for (let i = 0; i < planMatches.length; i++) {
        const start = planMatches[i].index;
        // Find the end: look for next plan name or reasonable limit
        let end = i < planMatches.length - 1 ? planMatches[i + 1].index : Math.min(start + 2000, text.length);
        
        // Try to find a better end point: look for the next plan name pattern (dynamic)
        const sectionText = text.substring(start, end);
        const nextPlanMatch = sectionText.match(/\b(Free|Pro|Plus|Max|Premium|Basic|Standard|Starter|Business|Team|Enterprise|Lite|Generative|Creator|Advanced)\b/i);
        if (nextPlanMatch && nextPlanMatch.index && nextPlanMatch.index > 50) {
          // Found another plan name in this section, cut before it
          end = start + nextPlanMatch.index;
        }
        
        // Limit section to reasonable size (max 1500 chars)
        const finalEnd = Math.min(end, start + 1500);
        const finalSectionText = text.substring(start, finalEnd);
        
        // Create a virtual element
        const $virtualCard = $('<div>').text(finalSectionText);
        cards.push($virtualCard);
      }
    }
  }
  
  if (cards.length === 0) {
    console.log(`  ⚠ Could not find plan cards`);
    return [];
  }
  
  console.log(`  📋 Found ${cards.length} potential plan cards`);
  
  // Extract plans from cards (dynamic plan name extraction)
  const plans: PricingPlan[] = [];
  const seenNames = new Set<string>();
  
  for (let i = 0; i < cards.length; i++) {
    const $card = cards[i];
    const cardText = $card.text().substring(0, 200);
    
    // Extract plan name dynamically
    const planName = extractPlanNameFromCard($card, $);
    if (!planName) {
      console.log(`    ⚠ Failed to extract plan name from card ${i + 1}: ${cardText.substring(0, 50)}...`);
      continue;
    }
    
    // Skip duplicates
    const nameLower = planName.toLowerCase();
    if (seenNames.has(nameLower)) {
      console.log(`    ⚠ Skipped duplicate: ${planName}`);
      continue;
    }
    seenNames.add(nameLower);
    
    // Extract plan details from card
    const plan = extractPlanFromCardDynamic($card, $, planName, isYearly);
    if (plan) {
      plans.push(plan);
      console.log(`    ✓ Extracted plan: ${plan.name} (${plan.price.monthly.amount > 0 ? '$' + plan.price.monthly.amount : plan.unitPriceNote || 'Free'})`);
    } else {
      console.log(`    ⚠ Failed to extract plan details for ${planName}`);
    }
  }
  
  return plans;
}

/**
 * Extract plan from card element (dynamic, accepts plan name as parameter)
 */
function extractPlanFromCardDynamic($card: cheerio.Cheerio<any>, $: cheerio.CheerioAPI, planName: string, isYearly: boolean = false): PricingPlan | null {
  const text = $card.text();
  
  // Generate plan id from name
  const planId = planName.toLowerCase().replace(/\s+/g, '-');
  
  const plan: Partial<PricingPlan> = {
    id: planId,
    name: planName,
    price: {
      monthly: { amount: 0, currency: 'USD', period: 'month' },
    },
  };
  
  // Check for Custom/Enterprise pricing
  if (planName.toLowerCase() === 'enterprise' || 
      (/Custom\s+pricing|Contact\s+(sales|us)|Let'?s\s+talk/i.test(text) && 
       !/\$\d+/.test(text))) {
    plan.price!.monthly.amount = 0;
    plan.unitPriceNote = 'Custom pricing';
    plan.ctaText = 'Contact Sales';
    plan.billingNote = /billed\s+yearly/i.test(text) ? '*Billed yearly' : undefined;
    return plan as PricingPlan;
  }
  
  // Check for Free plan
  if (planName.toLowerCase() === 'free' || 
      (/\$0/i.test(text) && /free|trial/i.test(text))) {
    plan.price!.monthly.amount = 0;
    plan.ctaText = 'Get Started';
    return plan as PricingPlan;
  }
  
  // Extract prices: support $, €, £ and various formats
  const pricePatterns = [
    // USD: $XX/month, $XX/mo, $XX per month
    /\$(\d+)\/month/i,
    /\$(\d+)\s*\/\s*month/i,
    /\$(\d+)\/mo/i,
    /\$(\d+)\s*\/\s*mo/i,
    /\$(\d+)\s+per\s+month/i,
    // EUR: €XX/month, €XX/mo
    /€(\d+)\/month/i,
    /€(\d+)\s*\/\s*month/i,
    /€(\d+)\/mo/i,
    /€(\d+)\s*\/\s*mo/i,
    /€(\d+)\s+per\s+month/i,
    // GBP: £XX/month, £XX/mo
    /£(\d+)\/month/i,
    /£(\d+)\s*\/\s*month/i,
    /£(\d+)\/mo/i,
    /£(\d+)\s*\/\s*mo/i,
    /£(\d+)\s+per\s+month/i,
    // Generic: XX/month, XX/mo, XX per month (no currency symbol)
    /(\d+)\s*\/\s*month/i,
    /(\d+)\s*\/\s*mo/i,
    /(\d+)\s+per\s+month/i,
    // Billed yearly patterns
    /billed\s+yearly.*?(\d+)/i,
    /(\d+).*?billed\s+yearly/i,
  ];
  
  // Also look for currency symbols without /month
  const currencyMatches = text.match(/(\$|€|£)(\d+)/g);
  
  const amounts: number[] = [];
  for (const pattern of pricePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        // Extract number from match (handle different patterns)
        let numStr = match.replace(/\$|€|£|\/month|\/mo|per\s+month|billed\s+yearly/gi, '').trim();
        // If pattern captured group, use it
        const groupMatch = match.match(/(\d+)/);
        if (groupMatch) {
          numStr = groupMatch[1];
        }
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > 0 && num < 20000) {
          amounts.push(num);
        }
      }
      if (amounts.length > 0) break;
    }
  }
  
  // Fallback: extract all currency prices
  if (amounts.length === 0 && currencyMatches) {
    for (const priceStr of currencyMatches) {
      const num = parseInt(priceStr.replace(/\$|€|£/g, ''), 10);
      if (!isNaN(num) && num >= 10 && num < 10000) {
        amounts.push(num);
      }
    }
  }
  
  const uniqueAmounts = [...new Set(amounts)].sort((a, b) => a - b);
  
  if (uniqueAmounts.length > 0) {
    if (isYearly) {
      // Yearly: take minimum (discount price)
      plan.price!.monthly.amount = uniqueAmounts[0];
    } else {
      // Monthly: take maximum (regular price)
      plan.price!.monthly.amount = uniqueAmounts[uniqueAmounts.length - 1];
    }
  } else {
    return null; // No valid price found
  }
  
  // Extract tagline (subtitle/description)
  const taglineEl = $card.find('[class*="tagline"], [class*="description"], p').first();
  if (taglineEl.length > 0) {
    const taglineText = taglineEl.text().trim();
    if (taglineText.length > 0 && taglineText.length < 100 && !taglineText.includes('$')) {
      plan.tagline = taglineText;
    }
  }
  
  // Extract CTA text
  const ctaEl = $card.find('button, a[class*="button"], [class*="cta"]').first();
  if (ctaEl.length > 0) {
    const ctaText = ctaEl.text().trim();
    if (ctaText.length > 0 && ctaText.length < 50) {
      plan.ctaText = ctaText;
    }
  }
  
  // Extract ribbonText
  if (/Best\s+Value|Popular|Recommended/i.test(text)) {
    plan.ribbonText = text.match(/Best\s+Value/i) ? 'Best Value' : 
                      text.match(/Popular/i) ? 'Popular' : 
                      text.match(/Recommended/i) ? 'Recommended' : undefined;
  }
  
  // Extract billingNote
  const billingMatch = text.match(/\*?Billed\s+(monthly|yearly)/i);
  if (billingMatch) {
    plan.billingNote = `*Billed ${billingMatch[1]}`;
  }
  
  // Extract features from card
  const featureItems = extractFeaturesFromCard($card, $);
  if (featureItems.length >= 4) {
    plan.featureItems = featureItems;
  }
  
  // Set default CTA if not found
  if (!plan.ctaText) {
    plan.ctaText = planName.toLowerCase() === 'free' ? 'Get Started' : 'Start Free Trial';
  }
  
  return plan as PricingPlan;
}

/**
 * Extract features from plan card (dynamic)
 */
function extractFeaturesFromCard($card: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): Array<{ text: string; badge?: string }> {
  const features: Array<{ text: string; badge?: string }> = [];
  const seen = new Set<string>();
  
  // Find feature list container
  let $featureContainer = $card.find('ul, ol, [class*="feature"], [class*="list"]').first();
  if ($featureContainer.length === 0) {
    $featureContainer = $card;
  }
  
  // Find all list items or feature-like elements
  const featureElements = $featureContainer.find('li, [class*="item"] div, [class*="feature"] div');
  
  featureElements.each((i, el) => {
    const $el = $(el);
    let text = $el.text().trim();
    
    // Filter: must be reasonable length
    if (!text || text.length < 5 || text.length > 120) return;
    
    // Skip if it's clearly not a feature
    if (/\$|\*Billed|Get\s+\w+|Contact|Add-ons|per\s+credit|Team\s+Size|Select|Choose/i.test(text)) return;
    
    // Normalize text
    const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();
    if (seen.has(normalized)) return;
    seen.add(normalized);
    
    // Extract badge if present
    let badge: string | undefined = undefined;
    const badgeEl = $el.find('[class*="badge"], [class*="tag"], [class*="pill"], span[class*="chip"]').first();
    if (badgeEl.length > 0) {
      const badgeText = badgeEl.text().trim();
      if (badgeText.length > 0 && badgeText.length < 30) {
        badge = badgeText;
        // Remove badge from main text
        text = text.replace(badgeText, '').trim();
      }
    }
    
    // Check for badge patterns in text
    const badgeMatch = text.match(/(\d+\s+UNLIMITED|\d+\s+DAYS|Unlimited)/i);
    if (badgeMatch && !badge) {
      badge = badgeMatch[1].replace(/\s+/g, ' ').trim().toUpperCase();
      text = text.replace(badgeMatch[0], '').trim();
    }
    
    // Clean up text
    text = text.replace(/\s+/g, ' ').trim();
    if (text.length < 3) return;
    
    // Capitalize first letter
    text = text.charAt(0).toUpperCase() + text.slice(1);
    
    features.push({
      text,
      badge: badge ? badge.toUpperCase() : undefined,
    });
  });
  
  // Post-process: merge badge items
  return mergeBadgeItems(features);
}

/**
 * Specialized extraction for invideo pricing plans
 */
function extractInVideoPlansFromHtml(html: string, isYearly: boolean): PricingPlan[] {
  const $ = cheerio.load(html);
  const text = $('body').text();
  
  const PLAN_NAMES = ['Free', 'Plus', 'Max', 'Generative', 'Team', 'Enterprise'];
  const plans: PricingPlan[] = [];
  
  // Step A: Find all occurrences of each plan name and score them
  const planCandidates: Map<string, Array<{ index: number; score: number; window: string }>> = new Map();
  
  for (const planName of PLAN_NAMES) {
    const candidates: Array<{ index: number; score: number; window: string }> = [];
    
    // Try multiple patterns to find the plan card title
    // Special handling for Free plan
    if (planName.toLowerCase() === 'free') {
      // Look for "Free$0" or "Free" followed by "Video mins" or "AI credit"
      const freePattern1 = /Free\$0/i;
      const freePattern2 = /Free[^A-Z]*Video\s+mins/i;
      const freePattern3 = /Free[^A-Z]*AI\s+credit/i;
      
      let freeMatch = freePattern1.exec(text) || freePattern2.exec(text) || freePattern3.exec(text);
      if (freeMatch) {
        const index = freeMatch.index;
        const windowStart = index;
        const windowEnd = Math.min(text.length, index + 800);
        const window = text.substring(windowStart, windowEnd);
        candidates.push({ index, score: 20, window });
      }
    }
    
    // Pattern 1: "PlanNamebest for" (no space, common in compressed HTML)
    const pattern1 = new RegExp(`${planName}(best\\s+for|Best\\s+for)`, 'i');
    let match1 = pattern1.exec(text);
    if (match1) {
      const index = match1.index;
      const windowStart = index;
      const windowEnd = Math.min(text.length, index + 800);
      const window = text.substring(windowStart, windowEnd);
      candidates.push({ index, score: 25, window }); // High score for "PlanNamebest for"
    }
    
    // Pattern 2: "PlanName best for" (with space)
    const pattern2 = new RegExp(`${planName}\\s+best\\s+for`, 'i');
    let match2 = pattern2.exec(text);
    if (match2) {
      const index = match2.index;
      const windowStart = index;
      const windowEnd = Math.min(text.length, index + 800);
      const window = text.substring(windowStart, windowEnd);
      candidates.push({ index, score: 25, window }); // High score for "PlanName best for"
    }
    
    // Pattern 3: "PlanName" followed by price within 100 chars
    const pattern3 = new RegExp(`\\b${planName}\\b`, 'g');
    let match3;
    while ((match3 = pattern3.exec(text)) !== null) {
      const index = match3.index;
      const afterPlan = text.substring(index, Math.min(index + 150, text.length));
      
      // Skip if this is a billing note
      if (/\*Billed/i.test(afterPlan) && !/\$(\d+)\/month/i.test(afterPlan)) {
        continue; // Skip billing notes
      }
      
      // Check if followed by price
      if (/\$(\d+)\/month/i.test(afterPlan)) {
        const windowStart = index;
        const windowEnd = Math.min(text.length, index + 800);
        const window = text.substring(windowStart, windowEnd);
        candidates.push({ index, score: 20, window }); // High score for plan name + price
      }
    }
    
    // Pattern 4: Fallback - any "PlanName" with price nearby
    const pattern4 = new RegExp(`\\b${planName}\\b`, 'g');
    let match4;
    while ((match4 = pattern4.exec(text)) !== null) {
      const index = match4.index;
      const windowStart = index;
      const windowEnd = Math.min(text.length, index + 800);
      const window = text.substring(windowStart, windowEnd);
      
      // Skip if this is a billing note
      const afterPlan = window.substring(0, 100);
      if (/\*Billed/i.test(afterPlan) && !/\$(\d+)\/month/i.test(afterPlan)) {
        continue; // Skip billing notes
      }
      
      // Score based on content
      let score = 0;
      if (/\$(\d+)\/month/i.test(window.substring(0, 300))) {
        score += 15;
      } else if (/\$\d+/.test(window.substring(0, 300))) {
        score += 5;
      }
      
      if (planName.toLowerCase() === 'free' && /\$0|Video\s+mins|AI\s+credit/i.test(window)) {
        score += 5;
      } else if (planName.toLowerCase() === 'enterprise' && /Custom|custom|Contact|contact/i.test(window)) {
        score += 5;
      }
      
      if (score > 0) {
        candidates.push({ index, score, window });
      }
    }
    
    if (candidates.length > 0) {
      // Remove duplicates (same index)
      const uniqueCandidates = candidates.filter((c, i, arr) => 
        arr.findIndex(cc => cc.index === c.index) === i
      );
      // Sort by score descending, take the best one
      uniqueCandidates.sort((a, b) => b.score - a.score);
      planCandidates.set(planName, uniqueCandidates);
    }
  }
  
  // Step B: Select best index for each plan and create sections
  const selectedIndices: Array<{ name: string; index: number }> = [];
  
  for (const planName of PLAN_NAMES) {
    const candidates = planCandidates.get(planName);
    if (candidates && candidates.length > 0) {
      const best = candidates[0];
      selectedIndices.push({ name: planName, index: best.index });
      
      console.log(`    📍 ${planName}: selected index ${best.index}, score ${best.score}, window preview: ${best.window.substring(0, 100)}...`);
    }
  }
  
  // Sort by index
  selectedIndices.sort((a, b) => a.index - b.index);
  
  // Step C: Create sections and extract prices
  for (let i = 0; i < selectedIndices.length; i++) {
    const current = selectedIndices[i];
    const next = i < selectedIndices.length - 1 ? selectedIndices[i + 1] : null;
    
    let sectionStart = current.index;
    // Look backwards to find the actual start of the plan card (might be "Plusbest" not "Plus")
    // Check if there's text before the plan name that should be included
    const lookBackStart = Math.max(0, sectionStart - 50);
    const lookBackText = text.substring(lookBackStart, sectionStart + 100);
    
    // If we see "best for" or similar before the plan name, include it
    const bestForMatch = lookBackText.match(/(best\s+for\s+[^A-Z]*)([A-Z][a-z]+)/i);
    if (bestForMatch && bestForMatch[2] === current.name) {
      const adjustedStart = lookBackStart + lookBackText.indexOf(bestForMatch[1]);
      if (adjustedStart < sectionStart) {
        sectionStart = adjustedStart;
      }
    }
    
    // Extend section to include price information (look ahead up to 1500 chars)
    const searchEnd = Math.min(sectionStart + 1500, text.length);
    let sectionEnd = next ? Math.min(next.index, searchEnd) : searchEnd;
    
    // Ensure section doesn't contain next plan name
    let section = text.substring(sectionStart, sectionEnd);
    if (next) {
      const nextPlanInSection = section.indexOf(next.name);
      if (nextPlanInSection > 0 && nextPlanInSection < section.length) {
        sectionEnd = sectionStart + nextPlanInSection;
        section = text.substring(sectionStart, sectionEnd);
      }
    }
    
    // Extract all price amounts from section (look for $XX/month or $XX patterns)
    // Priority: look for prices near the plan name (first 500 chars)
    // But also check if plan name is followed directly by price (e.g., "Plusbest for stock video$35/month")
    const planNameInSection = section.indexOf(current.name);
    const priceSearchStart = planNameInSection >= 0 ? planNameInSection : 0;
    const priceSearchArea = section.substring(priceSearchStart, Math.min(priceSearchStart + 500, section.length));
    
    const pricePatterns = [
      /\$(\d+)\/month/i,           // $35/month (no space)
      /\$(\d+)\s*\/\s*month/i,     // $35 / month (with space)
      /\$(\d+)\s+per\s+month/i,    // $35 per month
      /\$(\d+)\s*\/\s*mo/i,        // $35/mo
    ];
    
    const amounts: number[] = [];
    let foundPricePattern = false;
    
    for (const pattern of pricePatterns) {
      const matches = priceSearchArea.match(pattern);
      if (matches) {
        for (const match of matches) {
          const num = parseInt(match.replace(/\$|\/month|\/mo|per\s+month/gi, '').trim(), 10);
          if (!isNaN(num) && num > 0 && num < 20000) { // Reasonable price range
            amounts.push(num);
            foundPricePattern = true;
          }
        }
        if (amounts.length > 0) break; // Found prices, stop trying other patterns
      }
    }
    
    // Fallback: if no /month pattern found, extract all prices from search area
    // But filter out very small numbers (like $1, $2 which are per-credit prices)
    if (!foundPricePattern) {
      const allPrices = priceSearchArea.match(/\$(\d+)/g) || [];
      for (const priceStr of allPrices) {
        const num = parseInt(priceStr.replace('$', ''), 10);
        // Filter: exclude very small numbers (< 10) which are likely per-credit prices
        // and very large numbers (> 10000) which are likely yearly totals
        if (!isNaN(num) && num >= 10 && num < 10000) {
          amounts.push(num);
        }
      }
    }
    
    // Remove duplicates and sort
    const uniqueAmounts = [...new Set(amounts)].sort((a, b) => a - b);
    
    // Determine price based on isYearly flag
    let amount = 0;
    if (current.name.toLowerCase() === 'free') {
      amount = 0;
    } else if (current.name.toLowerCase() === 'enterprise') {
      if (/Custom|custom|Contact|contact/i.test(section)) {
        amount = 0;
      } else if (uniqueAmounts.length > 0) {
        amount = isYearly ? uniqueAmounts[0] : uniqueAmounts[uniqueAmounts.length - 1];
      }
    } else {
      if (uniqueAmounts.length > 0) {
        if (isYearly) {
          // Yearly: take minimum (discount price, usually the first reasonable price)
          // Filter out very large numbers (like yearly totals)
          const reasonablePrices = uniqueAmounts.filter(a => a <= 1000);
          amount = reasonablePrices.length > 0 ? reasonablePrices[0] : uniqueAmounts[0];
        } else {
          // Monthly: take maximum (regular price)
          amount = uniqueAmounts[uniqueAmounts.length - 1];
        }
      }
    }
    
    // Debug output
    console.log(`    💰 ${current.name}: amounts=[${uniqueAmounts.join(', ')}], final=${amount} (${isYearly ? 'yearly' : 'monthly'}), section preview: ${section.substring(0, 200)}...`);
    
    const plan: PricingPlan = {
      name: current.name,
      price: {
        monthly: { amount: 0, currency: 'USD', period: 'month' },
      },
    };
    
    if (current.name.toLowerCase() === 'enterprise' && /Custom|custom|Contact|contact/i.test(section)) {
      plan.price.monthly.amount = 0;
      plan.unitPriceNote = 'Custom pricing';
      plan.ctaText = 'Contact Sales';
      plan.billingNote = '*Billed yearly';
    } else if (current.name.toLowerCase() === 'free') {
      plan.price.monthly.amount = 0;
      plan.ctaText = 'Get Started';
    } else {
      plan.price.monthly.amount = amount;
      plan.ctaText = 'Start Free Trial';
    }
    
    // Extract features: try HTML DOM first, fallback to text
    let featureItems: Array<{ text: string; badge?: string }> = [];
    
    // Try extracting from HTML DOM (for invideo)
    try {
      const planCard = findPlanCardInHtml($, current.name);
      if (planCard && planCard.length > 0) {
        featureItems = extractInVideoFeaturesFromHtml(planCard, $, current.name);
        if (featureItems.length >= 4) {
          console.log(`    ✓ Extracted ${featureItems.length} features from HTML DOM for ${current.name}`);
        }
      }
    } catch (error) {
      // Fallback to text extraction
    }
    
    // Fallback to text extraction if HTML extraction failed or didn't get enough features
    if (featureItems.length < 4) {
      const textFeatures = extractInVideoFeaturesFromSection(section, current.name);
      if (textFeatures.length >= 4) {
        featureItems = textFeatures;
        console.log(`    ✓ Extracted ${featureItems.length} features from text for ${current.name}`);
      }
    }
    
    // Post-process: merge badge items and clean up
    if (featureItems.length > 0) {
      featureItems = mergeBadgeItems(featureItems);
    }
    
    if (featureItems.length >= 8) {
      plan.featureItems = featureItems;
      const badgeCount = featureItems.filter(f => f.badge).length;
      console.log(`    ✓ Final: ${featureItems.length} features, ${badgeCount} with badges for ${current.name}`);
    } else {
      console.log(`    ⚠ Only ${featureItems.length} features extracted for ${current.name} (need >= 8)`);
    }
    
    // Extract billingNote
    const billingMatch = section.match(/\*Billed\s+(monthly|yearly)[^A-Z]*/i);
    if (billingMatch) {
      plan.billingNote = billingMatch[0].trim();
    }
    
    // Extract ribbonText (Best Value)
    if (/Best\s+Value/i.test(section)) {
      plan.ribbonText = 'Best Value';
    }
    
    plans.push(plan);
  }
  
  return plans;
}

/**
 * Extract HeyGen pricing plans from HTML (priority: __NEXT_DATA__, fallback: window-match)
 */
function extractHeyGenPlansFromHtml(html: string, isYearly: boolean = false): PricingPlan[] {
  const $ = cheerio.load(html);
  const plans: PricingPlan[] = [];
  
  // Step 1: Try to extract from __NEXT_DATA__ or Next.js stream scripts
  console.log(`  🔍 Attempting to extract from __NEXT_DATA__ or Next.js stream scripts...`);
  
  // Try __NEXT_DATA__ script first
  const nextDataScript = $('#__NEXT_DATA__');
  if (nextDataScript.length > 0) {
    try {
      const nextDataText = nextDataScript.text();
      const nextData = JSON.parse(nextDataText);
      
      // Recursively search for pricing plan data
      const foundPlans = searchPlansInNextData(nextData);
      if (foundPlans.length >= 2) {
        console.log(`  ✓ Found ${foundPlans.length} plans in __NEXT_DATA__`);
        return foundPlans;
      } else {
        console.log(`  ⚠ Found only ${foundPlans.length} plan(s) in __NEXT_DATA__, trying stream scripts...`);
      }
    } catch (error) {
      console.log(`  ⚠ Failed to parse __NEXT_DATA__: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Try Next.js stream scripts (self.__next_f.push)
  const streamScripts = $('script[type="text/javascript"]').filter((_, el) => {
    const text = $(el).text();
    return text.includes('self.__next_f.push') && text.includes('pricing');
  });
  
  if (streamScripts.length > 0) {
    console.log(`  🔍 Found ${streamScripts.length} Next.js stream script(s), searching for pricing data...`);
    const allPlans: PricingPlan[] = [];
    
    streamScripts.each((_, el) => {
      const scriptText = $(el).text();
      // Try to extract JSON-like data from stream scripts
      // Pattern: self.__next_f.push([1,"...JSON-like string..."])
      const jsonMatches = scriptText.match(/self\.__next_f\.push\(\[1,"([^"]+)"\]\)/g);
      if (jsonMatches) {
        for (const match of jsonMatches) {
          try {
            // Extract the JSON string (may be escaped)
            const jsonStr = match.match(/"([^"]+)"/)?.[1];
            if (jsonStr) {
              // Try to parse as JSON (may need unescaping)
              const unescaped = jsonStr.replace(/\\"/g, '"').replace(/\\n/g, '\n');
              // Look for plan-like data in the string
              if (/starter|creator|business|enterprise|free|\$\d+|\/month/i.test(unescaped)) {
                const plans = searchPlansInNextData(unescaped);
                allPlans.push(...plans);
              }
            }
          } catch (e) {
            // Continue to next match
          }
        }
      }
    });
    
    if (allPlans.length >= 2) {
      // Remove duplicates
      const uniquePlans = Array.from(new Map(allPlans.map(p => [p.name.toLowerCase(), p])).values());
      if (uniquePlans.length >= 2) {
        console.log(`  ✓ Found ${uniquePlans.length} plans in Next.js stream scripts`);
        return uniquePlans;
      }
    }
  }
  
  console.log(`  ⚠ Could not extract plans from JSON data, falling back to window-match`);
  
  // Step 2: Fallback to window-match (similar to invideo)
  console.log(`  🔍 Falling back to window-match extraction...`);
  const text = $('body').text();
  
  // HeyGen plan names
  const PLAN_NAMES = ['Free', 'Starter', 'Creator', 'Business', 'Enterprise'];
  const planCandidates: Map<string, Array<{ index: number; score: number; window: string }>> = new Map();
  
  for (const planName of PLAN_NAMES) {
    const candidates: Array<{ index: number; score: number; window: string }> = [];
    
    // Pattern 1: "PlanName" followed by price within 200 chars
    const pattern1 = new RegExp(`\\b${planName}\\b`, 'gi');
    let match1;
    while ((match1 = pattern1.exec(text)) !== null) {
      const index = match1.index;
      const afterPlan = text.substring(index, Math.min(index + 400, text.length));
      
      // Check if followed by price or plan indicators
      let score = 0;
      if (/\$(\d+)\/month|\$(\d+)\s*\/\s*month|\$(\d+)\s+per\s+month/i.test(afterPlan)) {
        score += 20;
      } else if (/\$\d+/.test(afterPlan)) {
        score += 10;
      }
      
      if (planName.toLowerCase() === 'free' && /\$0|free\s+plan|free\s+trial/i.test(afterPlan)) {
        score += 15;
      } else if (planName.toLowerCase() === 'enterprise' && /Custom|custom|Contact|contact/i.test(afterPlan)) {
        score += 15;
      } else if (/best\s+for|per\s+month|monthly|yearly/i.test(afterPlan)) {
        score += 5;
      }
      
      if (score > 0) {
        const windowStart = index;
        const windowEnd = Math.min(text.length, index + 800);
        const window = text.substring(windowStart, windowEnd);
        candidates.push({ index, score, window });
      }
    }
    
    if (candidates.length > 0) {
      // Remove duplicates and sort by score
      const uniqueCandidates = candidates.filter((c, i, arr) => 
        arr.findIndex(cc => Math.abs(cc.index - c.index) < 50) === i
      );
      uniqueCandidates.sort((a, b) => b.score - a.score);
      planCandidates.set(planName, uniqueCandidates);
    }
  }
  
  // Select best candidate for each plan
  const selectedIndices: Array<{ name: string; index: number; window: string }> = [];
  
  for (const planName of PLAN_NAMES) {
    const candidates = planCandidates.get(planName);
    if (candidates && candidates.length > 0) {
      const best = candidates[0];
      selectedIndices.push({ name: planName, index: best.index, window: best.window });
      console.log(`    📍 ${planName}: index ${best.index}, score ${best.score}, preview: ${best.window.substring(0, 120)}...`);
    }
  }
  
  // Sort by index and extract plans
  selectedIndices.sort((a, b) => a.index - b.index);
  
  for (let i = 0; i < selectedIndices.length; i++) {
    const current = selectedIndices[i];
    const next = i < selectedIndices.length - 1 ? selectedIndices[i + 1] : null;
    
    let sectionStart = current.index;
    let sectionEnd = next ? Math.min(next.index, sectionStart + 1500) : Math.min(sectionStart + 1500, text.length);
    let section = text.substring(sectionStart, sectionEnd);
    
    // Ensure section doesn't contain next plan name
    if (next) {
      const nextPlanInSection = section.indexOf(next.name);
      if (nextPlanInSection > 0 && nextPlanInSection < section.length) {
        sectionEnd = sectionStart + nextPlanInSection;
        section = text.substring(sectionStart, sectionEnd);
      }
    }
    
    const plan = extractPlanFromWindow(section, current.name, isYearly);
    if (plan) {
      plans.push(plan);
      console.log(`    ✓ Extracted plan: ${plan.name} (${plan.price.monthly.amount > 0 ? '$' + plan.price.monthly.amount : plan.unitPriceNote || 'Free'})`);
    }
  }
  
  return plans;
}

/**
 * Recursively search for pricing plans in __NEXT_DATA__ JSON object or string
 */
function searchPlansInNextData(obj: any, path: string = ''): PricingPlan[] {
  const plans: PricingPlan[] = [];
  
  // If input is a string, try to parse it as JSON
  if (typeof obj === 'string') {
    try {
      obj = JSON.parse(obj);
    } catch (e) {
      // If parsing fails, try to extract JSON-like objects from the string
      const jsonMatches = obj.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
      if (jsonMatches) {
        for (const match of jsonMatches) {
          try {
            const parsed = JSON.parse(match);
            plans.push(...searchPlansInNextData(parsed, path));
          } catch (e2) {
            // Continue
          }
        }
      }
      return plans;
    }
  }
  
  if (!obj || typeof obj !== 'object') {
    return plans;
  }
  
  // Check if current object/array contains plan-like data
  const objStr = JSON.stringify(obj).toLowerCase();
  const hasPlanKeywords = /starter|creator|business|enterprise|free|lite|pro|pricing|plan|tier/i.test(objStr);
  const hasPriceKeywords = /\$|\d+\s*\/\s*month|per\s+month|monthly|yearly/i.test(objStr);
  
  if (hasPlanKeywords && hasPriceKeywords) {
    // Try to extract plans from this object
    const extracted = extractPlansFromNextDataNode(obj);
    if (extracted.length > 0) {
      plans.push(...extracted);
    }
  }
  
  // Recursively search arrays and objects
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      plans.push(...searchPlansInNextData(obj[i], `${path}[${i}]`));
    }
  } else {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        plans.push(...searchPlansInNextData(obj[key], path ? `${path}.${key}` : key));
      }
    }
  }
  
  return plans;
}

/**
 * Extract plans from a __NEXT_DATA__ node that contains plan-like data
 */
function extractPlansFromNextDataNode(node: any): PricingPlan[] {
  const plans: PricingPlan[] = [];
  
  // Common plan name patterns (support multiple tools)
  const planNames = ['Free', 'Starter', 'Creator', 'Business', 'Enterprise', 'Lite', 'Pro', 'Basic', 'Standard', 'Premium', 'Plus', 'Max', 'Generative', 'Team', 'Super Cat', 'Unlimited Cat', 'Cat Mode'];
  
  // If node is an array, process each item
  if (Array.isArray(node)) {
    for (const item of node) {
      const extracted = extractPlansFromNextDataNode(item);
      plans.push(...extracted);
    }
    return plans;
  }
  
  // If node is an object, try to extract plan data
  if (typeof node === 'object' && node !== null) {
    // Look for plan name in various fields
    let planName: string | null = null;
    const nameFields = ['name', 'title', 'planName', 'tier', 'plan'];
    for (const field of nameFields) {
      if (node[field] && typeof node[field] === 'string') {
        const value = node[field].trim();
        const matchedName = planNames.find(n => value.toLowerCase().includes(n.toLowerCase()));
        if (matchedName) {
          planName = matchedName;
          break;
        }
      }
    }
    
    // If no plan name found, check if object structure suggests it's a plan
    if (!planName) {
      const keys = Object.keys(node);
      const hasPriceField = keys.some(k => /price|cost|amount|monthly|yearly/i.test(k));
      const hasPlanField = keys.some(k => /plan|tier|name|title/i.test(k));
      
      if (hasPriceField && hasPlanField) {
        // Try to infer plan name from context
        const nameValue = node.name || node.title || node.plan || node.tier;
        if (nameValue && typeof nameValue === 'string') {
          const matchedName = planNames.find(n => nameValue.toLowerCase().includes(n.toLowerCase()));
          if (matchedName) {
            planName = matchedName;
          }
        }
      }
    }
    
    if (planName) {
      const plan: Partial<PricingPlan> = {
        name: planName,
        price: {
          monthly: { amount: 0, currency: 'USD', period: 'month' },
        },
      };
      
      // Extract price
      const priceFields = ['price', 'monthlyPrice', 'yearlyPrice', 'amount', 'cost'];
      for (const field of priceFields) {
        if (node[field] !== undefined) {
          const priceValue = node[field];
          if (typeof priceValue === 'number' && priceValue >= 0) {
            plan.price!.monthly.amount = priceValue;
            break;
          } else if (typeof priceValue === 'string') {
            const priceMatch = priceValue.match(/\$?(\d+)/);
            if (priceMatch) {
              plan.price!.monthly.amount = parseInt(priceMatch[1], 10);
              break;
            }
          }
        }
      }
      
      // Extract CTA
      const ctaFields = ['cta', 'buttonText', 'ctaText', 'action'];
      for (const field of ctaFields) {
        if (node[field] && typeof node[field] === 'string') {
          plan.ctaText = node[field].trim();
          break;
        }
      }
      
      // Extract features
      const featureFields = ['features', 'featureItems', 'benefits', 'includes'];
      for (const field of featureFields) {
        if (Array.isArray(node[field])) {
          const features = node[field]
            .filter((f: any) => typeof f === 'string' || (typeof f === 'object' && f.text))
            .map((f: any) => ({
              text: typeof f === 'string' ? f : f.text || '',
              badge: typeof f === 'object' ? f.badge : undefined,
            }))
            .filter((f: { text: string }) => f.text.length >= 3 && f.text.length < 120);
          
          if (features.length >= 4) {
            plan.featureItems = features;
          }
          break;
        }
      }
      
      // Handle Enterprise/Custom pricing
      if (planName.toLowerCase() === 'enterprise' || 
          (plan.price!.monthly.amount === 0 && /custom|contact/i.test(JSON.stringify(node)))) {
        plan.price!.monthly.amount = 0;
        plan.unitPriceNote = 'Custom pricing';
        plan.ctaText = plan.ctaText || 'Contact Sales';
      }
      
      // Handle Free plan
      if (planName.toLowerCase() === 'free') {
        plan.price!.monthly.amount = 0;
        plan.ctaText = plan.ctaText || 'Get Started';
      }
      
      plans.push(plan as PricingPlan);
    }
  }
  
  return plans;
}

/**
 * Extract plan from window text (fallback for HeyGen)
 */
function extractPlanFromWindow(window: string, planName: string, isYearly: boolean): PricingPlan | null {
  const plan: Partial<PricingPlan> = {
    name: planName,
    price: {
      monthly: { amount: 0, currency: 'USD', period: 'month' },
    },
  };
  
  // Handle Enterprise/Custom pricing
  if (planName.toLowerCase() === 'enterprise' || 
      (/Custom\s+pricing|Contact\s+(sales|us)|Let'?s\s+talk/i.test(window) && !/\$\d+/.test(window))) {
    plan.price!.monthly.amount = 0;
    plan.unitPriceNote = 'Custom pricing';
    plan.ctaText = 'Contact Sales';
    plan.billingNote = /billed\s+yearly/i.test(window) ? '*Billed yearly' : undefined;
    return plan as PricingPlan;
  }
  
  // Handle Free plan
  if (planName.toLowerCase() === 'free' || (/\$0/i.test(window) && /free|trial/i.test(window))) {
    plan.price!.monthly.amount = 0;
    plan.ctaText = 'Get Started';
    return plan as PricingPlan;
  }
  
  // Extract prices: support $xx, xx/mo, per month, billed yearly
  const pricePatterns = [
    /\$(\d+)\/month/i,
    /\$(\d+)\s*\/\s*month/i,
    /\$(\d+)\/mo/i,
    /\$(\d+)\s*\/\s*mo/i,
    /\$(\d+)\s+per\s+month/i,
    /(\d+)\s*\/\s*mo/i,
    /(\d+)\s+per\s+month/i,
    /\$(\d+)/i,
  ];
  
  const amounts: number[] = [];
  for (const pattern of pricePatterns) {
    const matches = window.match(pattern);
    if (matches) {
      const num = parseInt(matches[1] || matches[0].replace(/\$|\/month|\/mo|per\s+month/gi, '').trim(), 10);
      if (!isNaN(num) && num > 0 && num < 20000) {
        amounts.push(num);
      }
    }
  }
  
  const uniqueAmounts = [...new Set(amounts)].sort((a, b) => a - b);
  
  if (uniqueAmounts.length > 0) {
    plan.price!.monthly.amount = isYearly ? uniqueAmounts[0] : uniqueAmounts[uniqueAmounts.length - 1];
  } else {
    return null; // No valid price found
  }
  
  // Extract billingNote
  if (/billed\s+yearly/i.test(window)) {
    plan.billingNote = '*Billed yearly';
  }
  
  // Extract CTA
  const ctaMatch = window.match(/(Get\s+Started|Start\s+Free\s+Trial|Contact\s+Sales|Sign\s+Up)/i);
  if (ctaMatch) {
    plan.ctaText = ctaMatch[1];
  } else {
    plan.ctaText = planName.toLowerCase() === 'free' ? 'Get Started' : 'Start Free Trial';
  }
  
  return plan as PricingPlan;
}

/**
 * Extract Veed.io pricing plans from HTML (find pricing section first, then extract cards)
 */
function extractVeedIoPlansFromHtml(html: string, isYearly: boolean, $: cheerio.CheerioAPI): PricingPlan[] {
  console.log(`  🔍 Finding pricing section by keywords...`);
  
  // Find pricing section by keywords
  const keywords = ['per editor', 'billed yearly', 'Lite', 'Pro', 'Enterprise'];
  let $section = findSectionByKeywords($, keywords);
  
  // If section found but doesn't contain plan names, try searching the whole page
  if ($section && $section.length > 0) {
    const sectionText = $section.text();
    if (!sectionText.includes('Lite') && !sectionText.includes('Pro') && !sectionText.includes('Enterprise')) {
      console.log(`  ⚠ Found section but it doesn't contain plan names, searching whole page...`);
      $section = null;
    }
  }
  
  // If no section found or section doesn't contain plan names, use whole page
  if (!$section || $section.length === 0) {
    console.log(`  ⚠ Using whole page for extraction...`);
    $section = $('body');
  }
  
  console.log(`  ✓ Using section (${$section.text().length} chars)`);
  
  // Extract plan cards from the section
  const cards: cheerio.Cheerio<any>[] = [];
  const seenCards = new Set<string>();
  
  // Strategy 1: Try specific selectors for plan cards
  const cardSelectors = [
    '[class*="card"][class*="pricing"]',
    '[class*="plan"][class*="card"]',
    '[class*="pricing"] [class*="card"]',
    '[class*="plan"]',
    'div[class*="col"]',
    'article',
    'div[class*="tier"]',
    'div[class*="pricing-card"]',
    'div[class*="plan-card"]',
    '[data-plan]',
    '[data-tier]',
  ];
  
  for (const selector of cardSelectors) {
    const found = $section.find(selector);
    console.log(`    Trying selector "${selector}": found ${found.length} elements`);
    
    if (found.length >= 2) {
      found.each((_, el) => {
        const $card = $(el);
        const text = $card.text();
        
        // Filter: exclude cards containing AI model names
        if (/Minimax|Kling|Sora/i.test(text)) {
          return;
        }
        
        // Check if card has price and plan name
        const hasPrice = /\$\d+|€\d+|£\d+|Custom\s+pricing|Contact\s+(sales|us)|Free|\$0/i.test(text);
        const hasPlanName = /\b(Free|Lite|Pro|Enterprise|Basic|Business)\b/i.test(text);
        
        // For veed-io, prioritize Lite/Pro/Enterprise plans with correct prices
        const isVeedPlan = /\b(Lite|Pro|Enterprise)\b/i.test(text);
        const hasVeedPrice = /\$?24|\$?55|Custom|Let'?s\s+Talk/i.test(text);
        
        if (hasPrice && hasPlanName && (isVeedPlan || hasVeedPrice)) {
          // Avoid duplicates by checking card text signature (use plan name + price)
          const planMatch = text.match(/\b(Free|Lite|Pro|Enterprise|Basic|Business)\b/i);
          const priceMatch = text.match(/\$(\d+)|€(\d+)|£(\d+)|Custom\s+pricing/i);
          const planName = planMatch ? planMatch[1].toLowerCase() : '';
          const priceStr = priceMatch ? (priceMatch[1] || priceMatch[2] || priceMatch[3] || 'custom') : '';
          const cardSignature = `${planName}-${priceStr}`;
          
          if (!seenCards.has(cardSignature)) {
            seenCards.add(cardSignature);
            cards.push($card);
            console.log(`      ✓ Added card: ${planName} (${priceStr})`);
          }
        }
      });
      
      // Check unique plan names
      const uniquePlanNames = new Set<string>();
      cards.forEach(card => {
        const text = card.text();
        const planMatch = text.match(/\b(Free|Lite|Pro|Enterprise|Basic|Business)\b/i);
        if (planMatch) {
          uniquePlanNames.add(planMatch[1].toLowerCase());
        }
      });
      
      if (uniquePlanNames.size >= 2) {
        console.log(`  ✓ Found ${cards.length} plan cards (${uniquePlanNames.size} unique plans) using selector: ${selector}`);
        break;
      }
    }
  }
  
  // Strategy 2: Look for cards near buttons/CTAs
  if (cards.length < 2) {
    const buttons = $section.find('button, a[class*="button"], [class*="cta"], a[href*="pricing"]');
    buttons.each((_, btn) => {
      const $btn = $(btn);
      const $card = $btn.closest('[class*="card"], [class*="plan"], [class*="tier"], div, article');
      if ($card.length > 0) {
        const text = $card.text();
        
        // Filter: exclude AI models
        if (/Minimax|Kling|Sora/i.test(text)) {
          return;
        }
        
        const hasPrice = /\$\d+|Custom\s+pricing|Free|\$0/i.test(text);
        const hasPlanName = /\b(Free|Lite|Pro|Enterprise|Basic|Business)\b/i.test(text);
        
        if (hasPrice && hasPlanName) {
          // Avoid duplicates
          const cardSignature = text.substring(0, 150).replace(/\s+/g, ' ').toLowerCase();
          if (!seenCards.has(cardSignature)) {
            seenCards.add(cardSignature);
            cards.push($card);
          }
        }
      }
    });
  }
  
  // Strategy 3: Text-based extraction if still no cards found
  if (cards.length < 2) {
    console.log(`  ⚠ Trying text-based extraction as fallback...`);
    const sectionText = $section.text();
    console.log(`    Section text length: ${sectionText.length}`);
    console.log(`    Contains "Lite": ${sectionText.includes('Lite')}`);
    console.log(`    Contains "Pro": ${sectionText.includes('Pro')}`);
    console.log(`    Contains "Enterprise": ${sectionText.includes('Enterprise')}`);
    console.log(`    Contains "24": ${sectionText.includes('24')}`);
    console.log(`    Contains "55": ${sectionText.includes('55')}`);
    console.log(`    Contains "per editor": ${sectionText.includes('per editor')}`);
    
    // Pattern 1: Look for plan names followed by prices (e.g., "Lite $24", "Pro $55", "24 / Month per editor")
    const planPricePatterns = [
      /\b(Lite)\b[^$]*\$?(\d+)[^$]*\/\s*(?:Month|mo)[^$]*per\s+editor/i,
      /\b(Pro)\b[^$]*\$?(\d+)[^$]*\/\s*(?:Month|mo)[^$]*per\s+editor/i,
      /\b(Lite)\b[^$]*\$?(\d+)[^$]*\/\s*(?:Month|mo)/i,
      /\b(Pro)\b[^$]*\$?(\d+)[^$]*\/\s*(?:Month|mo)/i,
      /\b(Enterprise)\b[^$]*(?:Custom|Let'?s\s+Talk|Contact)/i,
    ];
    
    for (const pattern of planPricePatterns) {
      const match = sectionText.match(pattern);
      if (match) {
        const planName = match[1];
        // Find the element containing this plan name
        const $elements = $section.find('*').filter((_, el) => {
          const $el = $(el);
          const text = $el.text();
          return text.includes(planName) && pattern.test(text);
        });
        
        if ($elements.length > 0) {
          // Find the parent container (card-like structure)
          let $card = $elements.first();
          // Walk up to find a card-like container
          for (let i = 0; i < 5 && $card.length > 0; i++) {
            const cardText = $card.text();
            const cardClass = $card.attr('class') || '';
            // Check if this looks like a plan card
            if ((cardClass.includes('card') || cardClass.includes('plan') || cardClass.includes('tier') || 
                 $card.is('article') || $card.is('section')) && 
                /\$\d+|Custom|Let'?s\s+Talk/i.test(cardText)) {
              const cardSignature = cardText.substring(0, 150).replace(/\s+/g, ' ').toLowerCase();
              if (!seenCards.has(cardSignature)) {
                seenCards.add(cardSignature);
                cards.push($card);
                console.log(`      ✓ Found plan card via text pattern: ${planName}`);
                break;
              }
            }
            $card = $card.parent();
          }
        }
      }
    }
    
    // Pattern 2: Look for specific price patterns (e.g., "$24 / Month per editor", "$55 / Month per editor", "24 / Month per editor")
    if (cards.length < 2) {
      const pricePatterns = [
        /\$?24[^$]*\/\s*(?:Month|mo)[^$]*per\s+editor/i,
        /\$?55[^$]*\/\s*(?:Month|mo)[^$]*per\s+editor/i,
        /\$?24[^$]*\/\s*(?:Month|mo)/i,
        /\$?55[^$]*\/\s*(?:Month|mo)/i,
      ];
      
      for (const pricePattern of pricePatterns) {
        const match = sectionText.match(pricePattern);
        if (match) {
          // Find the element containing this price
          const $elements = $section.find('*').filter((_, el) => {
            const $el = $(el);
            return pricePattern.test($el.text());
          });
          
          if ($elements.length > 0) {
            let $card = $elements.first();
            // Walk up to find a card-like container
            for (let i = 0; i < 5 && $card.length > 0; i++) {
              const cardText = $card.text();
              const cardClass = $card.attr('class') || '';
              if ((cardClass.includes('card') || cardClass.includes('plan') || cardClass.includes('tier') || 
                   $card.is('article') || $card.is('section')) && 
                  /\b(Lite|Pro|Enterprise)\b/i.test(cardText)) {
                const cardSignature = cardText.substring(0, 150).replace(/\s+/g, ' ').toLowerCase();
                if (!seenCards.has(cardSignature)) {
                  seenCards.add(cardSignature);
                  cards.push($card);
                  console.log(`      ✓ Found plan card via price pattern: ${cardText.substring(0, 50)}...`);
                  break;
                }
              }
              $card = $card.parent();
            }
          }
        }
      }
    }
  }
  
  if (cards.length === 0) {
    console.log(`  ⚠ Could not find plan cards in pricing section`);
    return [];
  }
  
  console.log(`  📋 Found ${cards.length} plan cards (after filtering)`);
  
  // Extract plans from cards
  const plans: PricingPlan[] = [];
  const seenNames = new Set<string>();
  
  for (let i = 0; i < cards.length; i++) {
    const $card = cards[i];
    const planName = extractPlanNameFromCard($card, $);
    
    if (!planName) {
      console.log(`    ⚠ Failed to extract plan name from card ${i + 1}`);
      continue;
    }
    
    const nameLower = planName.toLowerCase();
    if (seenNames.has(nameLower)) {
      console.log(`    ⚠ Skipped duplicate: ${planName}`);
      continue;
    }
    seenNames.add(nameLower);
    
    const plan = extractPlanFromCardDynamic($card, $, planName, isYearly);
    if (plan) {
      plans.push(plan);
      console.log(`    ✓ Extracted plan: ${plan.name} (${plan.price.monthly.amount > 0 ? '$' + plan.price.monthly.amount : plan.unitPriceNote || 'Free'})`);
    }
  }
  
  return plans;
}

/**
 * Extract Zebracat pricing plans from HTML (find pricing section first, then extract cards)
 */
function extractZebracatPlansFromHtml(html: string, isYearly: boolean, $: cheerio.CheerioAPI): PricingPlan[] {
  console.log(`  🔍 Finding pricing section by keywords...`);
  
  // Find pricing section by keywords (wide to narrow)
  const keywords = ['Pricing', 'Plans', 'Compare', 'Subscribe'];
  const $section = findSectionByKeywords($, keywords);
  
  if (!$section || $section.length === 0) {
    console.log(`  ⚠ Could not find pricing section with keywords: ${keywords.join(', ')}`);
    return [];
  }
  
  console.log(`  ✓ Found pricing section (${$section.text().length} chars)`);
  
  // Extract plan cards from the section
  const cards: cheerio.Cheerio<any>[] = [];
  const seenCards = new Set<string>();
  
  // Strategy 1: Try specific selectors for plan cards
  const cardSelectors = [
    '[class*="card"][class*="pricing"]',
    '[class*="plan"][class*="card"]',
    '[class*="pricing"] [class*="card"]',
    '[class*="plan"]',
    'div[class*="col"]',
    'article',
    'div[class*="tier"]',
    '[class*="test-tab-content-item"]', // Zebracat specific
  ];
  
  for (const selector of cardSelectors) {
    const found = $section.find(selector);
    if (found.length >= 2) {
      found.each((_, el) => {
        const $card = $(el);
        const text = $card.text();
        
        // Filter: exclude cards containing non-plan content
        if (/Custom\s+Avatar|Custom\s+AI\s+Styles/i.test(text)) {
          return;
        }
        
        // Check if card has price and plan name
        const hasPrice = /\$\d+|€\d+|£\d+|Custom\s+pricing|Contact\s+(sales|us)|Free|\$0/i.test(text);
        const hasPlanName = /\b(Free|Standard|Cat\s+Mode|Super\s+Cat|Unlimited\s+Cat|Enterprise)\b/i.test(text);
        
        if (hasPrice && hasPlanName) {
          // Avoid duplicates by checking card text signature (use plan name + price as signature)
          // Extract plan name and price for signature
          const planMatch = text.match(/\b(Free|Standard|Cat\s+Mode|Super\s+Cat|Unlimited\s+Cat|Enterprise)\b/i);
          const priceMatch = text.match(/\$(\d+)|€(\d+)|£(\d+)|Custom\s+pricing/i);
          const planName = planMatch ? planMatch[1].toLowerCase() : '';
          const priceStr = priceMatch ? (priceMatch[1] || priceMatch[2] || priceMatch[3] || 'custom') : '';
          const cardSignature = `${planName}-${priceStr}`;
          
          if (!seenCards.has(cardSignature)) {
            seenCards.add(cardSignature);
            cards.push($card);
          }
        }
      });
      
      // Continue to next selector only if we haven't found enough unique plans
      // Check unique plan names in cards
      const uniquePlanNames = new Set<string>();
      cards.forEach(card => {
        const text = card.text();
        const planMatch = text.match(/\b(Free|Standard|Cat\s+Mode|Super\s+Cat|Unlimited\s+Cat|Enterprise)\b/i);
        if (planMatch) {
          uniquePlanNames.add(planMatch[1].toLowerCase());
        }
      });
      
      if (uniquePlanNames.size >= 2) {
        console.log(`  ✓ Found ${cards.length} plan cards (${uniquePlanNames.size} unique plans) using selector: ${selector}`);
        break;
      }
    }
  }
  
  // Strategy 2: Look for cards near buttons/CTAs
  if (cards.length < 2) {
    const buttons = $section.find('button, a[class*="button"], [class*="cta"], a[href*="pricing"], a[href*="login"]');
    buttons.each((_, btn) => {
      const $btn = $(btn);
      const $card = $btn.closest('[class*="card"], [class*="plan"], [class*="tier"], div, article');
      if ($card.length > 0) {
        const text = $card.text();
        
        // Filter: exclude non-plan content
        if (/Custom\s+Avatar|Custom\s+AI\s+Styles/i.test(text)) {
          return;
        }
        
        const hasPrice = /\$\d+|€\d+|£\d+|Custom\s+pricing|Free|\$0/i.test(text);
        const hasPlanName = /\b(Free|Standard|Cat\s+Mode|Super\s+Cat|Unlimited\s+Cat|Enterprise)\b/i.test(text);
        
        if (hasPrice && hasPlanName) {
          // Avoid duplicates
          const cardSignature = text.substring(0, 150).replace(/\s+/g, ' ').toLowerCase();
          if (!seenCards.has(cardSignature)) {
            seenCards.add(cardSignature);
            cards.push($card);
          }
        }
      }
    });
  }
  
  // Strategy 3: Text-based extraction if still no cards found
  if (cards.length < 2) {
    console.log(`  ⚠ Trying text-based extraction as fallback...`);
    const sectionText = $section.text();
    const planNames = ['Free', 'Standard', 'Cat Mode', 'Super Cat', 'Unlimited Cat', 'Enterprise'];
    
    for (const planName of planNames) {
      const planPattern = new RegExp(`\\b${planName.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      let match;
      while ((match = planPattern.exec(sectionText)) !== null) {
        const index = match.index;
        const context = sectionText.substring(Math.max(0, index - 200), Math.min(sectionText.length, index + 400));
        
        // Check if this context has price
        if (/\$\d+|€\d+|£\d+|Custom\s+pricing|Free|\$0/i.test(context)) {
          // Find the containing element
          const $elements = $section.find('*').filter((_, el) => {
            const $el = $(el);
            return $el.text().includes(planName) && /\$\d+|€\d+|£\d+|Custom\s+pricing|Free|\$0/i.test($el.text());
          });
          
          if ($elements.length > 0) {
            const $card = $elements.first();
            const cardSignature = $card.text().substring(0, 150).replace(/\s+/g, ' ').toLowerCase();
            if (!seenCards.has(cardSignature)) {
              seenCards.add(cardSignature);
              cards.push($card);
              break; // Found one card for this plan, move to next
            }
          }
        }
      }
    }
  }
  
  if (cards.length === 0) {
    console.log(`  ⚠ Could not find plan cards in pricing section`);
    return [];
  }
  
  console.log(`  📋 Found ${cards.length} plan cards (after filtering)`);
  
  // Extract plans from cards
  const plans: PricingPlan[] = [];
  const seenNames = new Set<string>();
  
  for (let i = 0; i < cards.length; i++) {
    const $card = cards[i];
    const text = $card.text();
    
    // Debug: print card preview
    const cardPreview = text.substring(0, 200).replace(/\s+/g, ' ');
    console.log(`    📄 Card ${i + 1} preview: ${cardPreview}...`);
    
    // Extract plan name (support "Cat Mode", "Super Cat", etc.)
    let planName: string | null = null;
    
    // Try headings first (look for plan name in title/heading)
    const headings = $card.find('h1, h2, h3, h4, p[class*="title"]').first();
    if (headings.length > 0) {
      const headingText = headings.text().trim();
      console.log(`      Heading text: ${headingText.substring(0, 100)}`);
      // Match longer names first to avoid partial matches
      const planPatterns = [
        /\b(Unlimited\s+Cat)\b/i,
        /\b(Super\s+Cat)\b/i,
        /\b(Cat\s+Mode)\b/i,
        /\b(Enterprise)\b/i,
        /\b(Free)\b/i,
        /\b(Standard)\b/i,
      ];
      
      for (const pattern of planPatterns) {
        const match = headingText.match(pattern);
        if (match) {
          planName = match[1];
          console.log(`      ✓ Found plan name in heading: ${planName}`);
          break;
        }
      }
    }
    
    // Fallback: extract from text (match longer names first)
    if (!planName) {
      const planPatterns = [
        /\b(Unlimited\s+Cat)\b/i,
        /\b(Super\s+Cat)\b/i,
        /\b(Cat\s+Mode)\b/i,
        /\b(Enterprise)\b/i,
        /\b(Free)\b/i,
        /\b(Standard)\b/i,
      ];
      
      for (const pattern of planPatterns) {
        const match = text.match(pattern);
        if (match) {
          planName = match[1];
          console.log(`      ✓ Found plan name in text: ${planName}`);
          break;
        }
      }
    }
    
    if (!planName) {
      console.log(`    ⚠ Failed to extract plan name from card ${i + 1}, text preview: ${text.substring(0, 150)}...`);
      continue;
    }
    
    // Normalize plan name (keep original names, don't map "Cat Mode" to "Standard")
    // Only normalize spacing
    planName = planName.replace(/\s+/g, ' ').trim();
    
    // Map "Cat Mode" to "Standard" only if explicitly needed
    // But for now, keep original names
    const normalizedName = planName.toLowerCase();
    if (seenNames.has(normalizedName)) {
      console.log(`    ⚠ Skipped duplicate: ${planName} (already seen, card ${i + 1})`);
      continue;
    }
    seenNames.add(normalizedName);
    
    const plan = extractPlanFromCardDynamic($card, $, planName, isYearly);
    if (plan) {
      plans.push(plan);
      console.log(`    ✓ Extracted plan: ${plan.name} (${plan.price.monthly.amount > 0 ? '$' + plan.price.monthly.amount : plan.unitPriceNote || 'Free'})`);
    } else {
      console.log(`    ⚠ Failed to extract plan details for: ${planName}`);
    }
  }
  
  return plans;
}

/**
 * Find plan card in HTML DOM
 */
function findPlanCardInHtml($: any, planName: string): any {
  // Try multiple selectors to find the plan card
  const selectors = [
    `[class*="card"]:contains("${planName}")`,
    `[class*="plan"]:contains("${planName}")`,
    `[class*="pricing"]:contains("${planName}")`,
    `div:contains("${planName}best for")`,
    `div:contains("${planName} best for")`,
  ];
  
  for (const selector of selectors) {
    try {
      const cards = $(selector).filter((i: number, el: any) => {
        const text = $(el).text();
        return text.includes(planName) && 
               (text.includes('$') || text.includes('Credits') || text.includes('Video mins'));
      });
      if (cards.length > 0) {
        return cards.first();
      }
    } catch (e) {
      // Continue to next selector
    }
  }
  
  return null;
}

/**
 * Extract features from invideo plan card HTML DOM
 */
function extractInVideoFeaturesFromHtml($card: any, $: any, planName: string): Array<{ text: string; badge?: string }> {
  const features: Array<{ text: string; badge?: string }> = [];
  const seen = new Set<string>();
  
  // Find feature list container - look for common patterns
  let $featureContainer = $card.find('[class*="feature"], [class*="list"], ul, ol').first();
  
  // If no container found, use the card itself but filter more strictly
  if ($featureContainer.length === 0) {
    $featureContainer = $card;
  }
  
  // Find all list items or divs that look like features
  const featureElements = $featureContainer.find('li, [class*="item"] div, [class*="feature"] div');
  
  // If no list items found, try to find text nodes that match feature patterns
  if (featureElements.length === 0) {
    // Fallback: extract from text patterns (will be handled by text extraction)
    return [];
  }
  
  featureElements.each((i: number, el: any) => {
    const $el = $(el);
    const text = $el.text().trim();
    
    // Filter: must be reasonable length and not contain pricing/CTA text
    if (!text || text.length < 5 || text.length > 120) return;
    
    // Skip if it's clearly not a feature (price, CTA, billing note, etc.)
    if (/\$|\*Billed|Get\s+\w+|Contact|Add-ons|per\s+credit|Team\s+Size/i.test(text)) return;
    
    // Must look like a feature (starts with number or capital letter, contains common feature words)
    if (!/^\d+|^[A-Z]/.test(text) || !/(Credits|Video|mins|iStock|UGC|generative|clones|users|storage|exports|generations|avatar|Exports)/i.test(text)) {
      return;
    }
    
    // Normalize text
    const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();
    if (seen.has(normalized)) return;
    
    seen.add(normalized);
    
    // Extract badge: look for "365 UNLIMITED" or similar
    let badge: string | undefined = undefined;
    
    // Check if the element itself contains badge text
    const badgeMatch = text.match(/(\d+\s+UNLIMITED|\d+\s+DAYS)/i);
    if (badgeMatch) {
      badge = badgeMatch[1].replace(/\s+/g, ' ').trim();
    }
    
    // Check child elements for badge (span, div with badge-like classes)
    if (!badge) {
      const badgeEl = $el.find('span, div, [class*="badge"], [class*="tag"], [class*="pill"]').filter((i: number, s: any) => {
        const badgeText = $(s).text().trim();
        return /365\s*UNLIMITED|\d+\s*UNLIMITED/i.test(badgeText) && badgeText.length < 20;
      }).first();
      
      if (badgeEl.length > 0) {
        const badgeText = badgeEl.text().trim();
        const badgeMatch2 = badgeText.match(/(\d+\s+UNLIMITED|\d+\s+DAYS)/i);
        if (badgeMatch2) {
          badge = badgeMatch2[1].replace(/\s+/g, ' ').trim();
        }
      }
    }
    
    // Check next sibling for badge (sometimes badge is in a separate element)
    if (!badge && $el.next().length > 0) {
      const nextText = $el.next().text().trim();
      const nextBadgeMatch = nextText.match(/^(\d+\s+UNLIMITED|\d+\s+DAYS)$/i);
      if (nextBadgeMatch) {
        badge = nextBadgeMatch[1].replace(/\s+/g, ' ').trim();
      }
    }
    
    // Remove badge from text if it's embedded
    let featureText = text.replace(/\s*\d+\s+UNLIMITED\s*/gi, ' ').replace(/\s+/g, ' ').trim();
    
    // Capitalize first letter
    if (featureText.length > 0) {
      featureText = featureText.charAt(0).toUpperCase() + featureText.slice(1);
    }
    
    // Skip if text is too short after badge removal
    if (featureText.length < 3) return;
    
    features.push({
      text: featureText,
      badge: badge,
    });
  });
  
  // Limit to reasonable number (8-12 features)
  return features.slice(0, 12);
}

/**
 * Merge badge items: if a feature item is just a badge (e.g., "365 UNLIMITED"), merge it with previous feature
 */
function mergeBadgeItems(features: Array<{ text: string; badge?: string }>): Array<{ text: string; badge?: string }> {
  const merged: Array<{ text: string; badge?: string }> = [];
  
  for (let i = 0; i < features.length; i++) {
    const current = features[i];
    const normalizedText = current.text.replace(/\s+/g, ' ').trim().toLowerCase();
    
    // Check if current item is just a badge (e.g., "365 UNLIMITED" or "UNLIMITED")
    const isBadgeOnly = /^\s*(\d+\s*)?UNLIMITED\s*$/i.test(current.text) || 
                        /^\s*365\s*UNLIMITED\s*$/i.test(current.text) ||
                        /^\s*\d+\s+UNLIMITED\s*$/i.test(current.text);
    
    if (isBadgeOnly && merged.length > 0) {
      // Merge badge with previous feature
      const prevFeature = merged[merged.length - 1];
      if (!prevFeature.badge) {
        // Extract the badge text (normalize to "365 UNLIMITED" format)
        const badgeMatch = current.text.match(/(\d+\s+UNLIMITED|\d+\s*UNLIMITED)/i);
        if (badgeMatch) {
          prevFeature.badge = badgeMatch[1].replace(/\s+/g, ' ').trim().toUpperCase();
        } else if (/UNLIMITED/i.test(current.text)) {
          prevFeature.badge = '365 UNLIMITED'; // Default badge
        }
      }
      // Skip adding this badge-only item
      continue;
    }
    
    // Check if text ends with badge and extract it
    const badgeAtEnd = current.text.match(/\s+(\d+\s+UNLIMITED|\d+\s*UNLIMITED)\s*$/i);
    if (badgeAtEnd && !current.badge) {
      const extractedBadge = badgeAtEnd[1].replace(/\s+/g, ' ').trim().toUpperCase();
      const cleanedText = current.text.replace(/\s+\d+\s*UNLIMITED\s*$/i, '').replace(/\s+/g, ' ').trim();
      
      if (cleanedText.length >= 3) {
        merged.push({
          text: cleanedText.charAt(0).toUpperCase() + cleanedText.slice(1),
          badge: extractedBadge,
        });
        continue;
      }
    }
    
    // Check if text contains badge in the middle and extract it
    const badgeInMiddle = current.text.match(/(\d+\s+UNLIMITED|\d+\s*UNLIMITED)/i);
    if (badgeInMiddle && !current.badge) {
      const extractedBadge = badgeInMiddle[1].replace(/\s+/g, ' ').trim().toUpperCase();
      const cleanedText = current.text.replace(/\d+\s*UNLIMITED/gi, '').replace(/\s+/g, ' ').trim();
      
      if (cleanedText.length >= 3) {
        merged.push({
          text: cleanedText.charAt(0).toUpperCase() + cleanedText.slice(1),
          badge: extractedBadge,
        });
        continue;
      }
    }
    
    // Normalize text
    const normalizedFeatureText = current.text.replace(/\s+/g, ' ').trim();
    if (normalizedFeatureText.length >= 3) {
      merged.push({
        text: normalizedFeatureText.charAt(0).toUpperCase() + normalizedFeatureText.slice(1),
        badge: current.badge ? current.badge.replace(/\s+/g, ' ').trim().toUpperCase() : undefined,
      });
    }
  }
  
  return merged;
}

/**
 * Extract features from invideo plan section text
 */
function extractInVideoFeaturesFromSection(section: string, planName: string): Array<{ text: string; badge?: string }> {
  const features: Array<{ text: string; badge?: string }> = [];
  const seen = new Set<string>();
  
  // Pattern 1: Extract features with badge pattern: "feature365 UNLIMITED" or "feature 365 UNLIMITED"
  // First, try to match features that have badge immediately attached
  const featureWithBadgePattern = /(\d+\s+(?:Credits?|Video\s+mins?|iStock|UGC\s+product\s+asset\s+ads?|secs?\s+of\s+generative\s+video|express\s+clones?|users?|GB\s+storage|TB\s+storage|mins?\s+of\s+generative\s+videos?|seat)|(?:Unlimited\s+exports?|Image\s+generations?))(\d+\s*UNLIMITED)/gi;
  let matchWithBadge;
  while ((matchWithBadge = featureWithBadgePattern.exec(section)) !== null) {
    const featurePart = matchWithBadge[1]?.trim();
    const badgePart = matchWithBadge[2]?.trim();
    
    if (featurePart && featurePart.length >= 3 && featurePart.length < 100) {
      const normalized = featurePart.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        
        // Skip if it's part of a price or billing note
        if (/\$|\*Billed|Get\s+\w+|Contact|Add-ons|per\s+credit/i.test(featurePart)) continue;
        
        const badge = badgePart ? badgePart.replace(/\s+/g, ' ').trim().toUpperCase() : undefined;
        let featureText = featurePart.replace(/\s+/g, ' ').trim();
        
        if (featureText.length > 0) {
          featureText = featureText.charAt(0).toUpperCase() + featureText.slice(1);
        }
        
        features.push({
          text: featureText,
          badge: badge,
        });
      }
    }
  }
  
  // Pattern 2: Extract features without badge (fallback for features that don't have badge)
  const featurePatterns = [
    /(\d+\s+(?:Credits?|Video\s+mins?|iStock|UGC\s+product\s+asset\s+ads?|secs?\s+of\s+generative\s+video|express\s+clones?|users?|GB\s+storage|TB\s+storage|mins?\s+of\s+generative\s+videos?|seat))/gi,
    /(Unlimited\s+exports?|Image\s+generations?|No\s+access\s+to\s+generative\s+features?|Video\s+mins\s+and\s+\d+\s+AI\s+credit)/gi,
  ];
  
  for (const pattern of featurePatterns) {
    let match;
    while ((match = pattern.exec(section)) !== null) {
      const fullMatch = match[0];
      const normalized = fullMatch.toLowerCase().trim();
      
      // Skip if already added (from Pattern 1)
      if (seen.has(normalized)) continue;
      if (fullMatch.length < 3 || fullMatch.length > 100) continue;
      
      // Skip if it's part of a price or billing note
      if (/\$|\*Billed|Get\s+\w+|Contact|Add-ons|per\s+credit/i.test(fullMatch)) continue;
      
      seen.add(normalized);
      
      // Check if badge appears immediately after this feature (within next 30 chars, no space or with space)
      let badge: string | undefined = undefined;
      const afterFeature = section.substring(match.index + match[0].length, match.index + match[0].length + 30);
      const afterBadgeMatch = afterFeature.match(/^(\d+\s*UNLIMITED|\s+\d+\s*UNLIMITED)/i);
      if (afterBadgeMatch) {
        badge = afterBadgeMatch[1].replace(/\s+/g, ' ').trim().toUpperCase();
      }
      
      // Clean up the feature text
      let featureText = fullMatch.replace(/\s+/g, ' ').trim();
      
      // Capitalize first letter
      if (featureText.length > 0) {
        featureText = featureText.charAt(0).toUpperCase() + featureText.slice(1);
      }
      
      features.push({
        text: featureText,
        badge: badge,
      });
    }
  }
  
  // Pattern 3: Extract specific feature patterns for Free plan
  if (planName.toLowerCase() === 'free') {
    const freePatterns = [
      /(\d+\s+Video\s+mins\s+and\s+\d+\s+AI\s+credit\s+per\s+week)/i,
      /(\d+\s+Express\s+avatar)/i,
      /(\d+\s+Exports\s+per\s+week)/i,
      /(No\s+access\s+to\s+generative\s+features?)/i,
    ];
    
    for (const pattern of freePatterns) {
      const match = section.match(pattern);
      if (match) {
        const normalized = match[1].toLowerCase();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          features.push({
            text: match[1].charAt(0).toUpperCase() + match[1].slice(1),
          });
        }
      }
    }
  }
  
  // Pattern 4: Extract storage and user features
  const storagePattern = /(\d+\s*(GB|TB)\s+storage)/i;
  const storageMatch = section.match(storagePattern);
  if (storageMatch) {
    const normalized = storageMatch[1].toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      const cleanText = storageMatch[1].replace(/\s+/g, ' ').trim();
      features.push({
        text: cleanText.charAt(0).toUpperCase() + cleanText.slice(1),
      });
    }
  }
  
  const userPattern = /(\d+\s+users?|\d+\s+seat)/i;
  const userMatch = section.match(userPattern);
  if (userMatch) {
    const normalized = userMatch[1].toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      const cleanText = userMatch[1].replace(/\s+/g, ' ').trim();
      features.push({
        text: cleanText.charAt(0).toUpperCase() + cleanText.slice(1),
      });
    }
  }
  
  // Pattern 5: Extract Enterprise features from JSON-like structure
  if (planName.toLowerCase() === 'enterprise') {
    // Try to extract from JSON structure: "feature":[{"highlightedText":"...","plainText":"..."}]
    const jsonMatch = section.match(/feature["\s]*:[\s]*\[(.*?)\]/i);
    if (jsonMatch) {
      const featureArray = jsonMatch[1];
      const featureMatches = featureArray.match(/\{"highlightedText":"([^"]*)","plainText":"([^"]*)"\}/g);
      if (featureMatches) {
        for (const match of featureMatches) {
          const textMatch = match.match(/"plainText":"([^"]*)"/);
          if (textMatch) {
            let featureText = textMatch[1].replace(/\s+/g, ' ').trim();
            let cleanFeatureText = featureText.replace(/\s+/g, ' ').trim();
            if (cleanFeatureText.length > 3 && cleanFeatureText.length < 80) {
              const normalized = cleanFeatureText.toLowerCase();
              if (!seen.has(normalized)) {
                seen.add(normalized);
                features.push({
                  text: cleanFeatureText.charAt(0).toUpperCase() + cleanFeatureText.slice(1),
                });
              }
            }
          }
        }
      }
    }
    
    // Fallback: Extract common Enterprise features
    const enterpriseKeywords = [
      'Custom solutions',
      'Advanced security',
      'Flexible pricing',
      'Tailor-made templates',
      'Unlimited',
      'Dedicated support',
      'Custom integrations',
    ];
    
    for (const keyword of enterpriseKeywords) {
      if (section.toLowerCase().includes(keyword.toLowerCase())) {
          const normalized = keyword.toLowerCase();
          if (!seen.has(normalized)) {
            seen.add(normalized);
            // Normalize whitespace
            const cleanKeyword = keyword.replace(/\s+/g, ' ').trim();
            features.push({
              text: cleanKeyword,
            });
          }
      }
    }
  }
  
  // Post-process: merge badge items
  const mergedFeatures = mergeBadgeItems(features);
  
  // Limit to 8-12 features
  return mergedFeatures.slice(0, 12);
}

/**
 * Merge monthly and yearly plans by name
 */
function mergeMonthlyYearlyPlans(monthlyPlans: PricingPlan[], yearlyPlans: PricingPlan[]): PricingPlan[] {
  const merged: PricingPlan[] = [];
  const planMap = new Map<string, PricingPlan>();
  
  // First, add all monthly plans
  for (const plan of monthlyPlans) {
    const key = plan.name.toLowerCase();
    planMap.set(key, { ...plan });
  }
  
  // Then, merge yearly prices
  for (const yearlyPlan of yearlyPlans) {
    const key = yearlyPlan.name.toLowerCase();
    const monthlyPlan = planMap.get(key);
    
    if (monthlyPlan) {
      // Merge: keep monthly price, add yearly price
      monthlyPlan.price.yearly = yearlyPlan.price.monthly; // yearly plan's monthly is the yearly monthly equivalent
      monthlyPlan.billingNote = yearlyPlan.billingNote || '*Billed yearly';
      
      // If yearly plan has unitPriceNote (Custom pricing), use it
      if (yearlyPlan.unitPriceNote) {
        monthlyPlan.unitPriceNote = yearlyPlan.unitPriceNote;
        monthlyPlan.price.monthly.amount = 0;
        monthlyPlan.price.yearly = undefined;
      }
      
      // Merge features: prefer the one with more items, or monthly if equal
      if (yearlyPlan.featureItems && yearlyPlan.featureItems.length >= 4) {
        if (!monthlyPlan.featureItems || monthlyPlan.featureItems.length < 4) {
          monthlyPlan.featureItems = yearlyPlan.featureItems;
        } else if (yearlyPlan.featureItems.length > monthlyPlan.featureItems.length) {
          monthlyPlan.featureItems = yearlyPlan.featureItems;
        }
      }
    } else {
      // Yearly-only plan (shouldn't happen, but handle it)
      const mergedPlan = { ...yearlyPlan };
      mergedPlan.price.yearly = yearlyPlan.price.monthly;
      mergedPlan.price.monthly = { amount: 0, currency: 'USD', period: 'month' };
      planMap.set(key, mergedPlan);
    }
  }
  
  // Convert map to array
  for (const plan of planMap.values()) {
    merged.push(plan);
  }
  
  return merged;
}

/**
 * Extract pricing plans from pricing text (legacy, fallback)
 */
function extractPricingPlans(text: string): PricingPlan[] {
  // This is now a fallback - try to extract from HTML if available
  return [];
}

/**
 * Extract section of text related to a plan
 */
function extractPlanSection(text: string, planName: string): string | null {
  const planNameLower = planName.toLowerCase();
  
  // Find all occurrences of the plan name
  const indices: number[] = [];
  let index = text.toLowerCase().indexOf(planNameLower);
  while (index !== -1) {
    indices.push(index);
    index = text.toLowerCase().indexOf(planNameLower, index + 1);
  }
  
  if (indices.length === 0) {
    return null;
  }
  
  // Get the best context (look for one with price information nearby)
  for (const idx of indices) {
    const start = Math.max(0, idx - 150);
    const end = Math.min(text.length, idx + 500);
    const section = text.substring(start, end);
    
    // Prefer sections with price information
    if (/\$\d+/.test(section) || /billed|pricing|custom/i.test(section)) {
      return section;
    }
  }
  
  // Fallback to first occurrence
  const idx = indices[0];
  const start = Math.max(0, idx - 100);
  const end = Math.min(text.length, idx + 400);
  return text.substring(start, end);
}

/**
 * Parse plan section to extract pricing
 */
function parsePlanSection(planName: string, section: string): PricingPlan | null {
  const plan: Partial<PricingPlan> = {
    name: planName,
    price: {
      monthly: { amount: 0, currency: 'USD', period: 'month' },
    },
  };
  
  // Check for Custom/Enterprise pricing (only if no price found)
  const hasPrice = /\$\d+/.test(section);
  if (!hasPrice && (planName.toLowerCase() === 'enterprise' || 
      /custom\s+pricing|contact\s+(sales|us)|let'?s\s+talk/i.test(section))) {
    plan.price!.monthly.amount = 0;
    plan.unitPriceNote = 'Custom pricing';
    plan.ctaText = 'Contact Sales';
    plan.billingNote = section.match(/billed\s+yearly/i) ? '*Billed yearly' : undefined;
    
    return plan as PricingPlan;
  }
  
  // Check for Free plan
  if (planName.toLowerCase() === 'free' || /\$0|free/i.test(section)) {
    plan.price!.monthly.amount = 0;
    plan.ctaText = 'Get Started';
    return plan as PricingPlan;
  }
  
  // Extract monthly price: "$12/ Month" or "$12/mo" or "$12 per month" or "$12/ Month per editor"
  const monthlyMatch = section.match(/\$(\d+)\s*(?:\/|\s*per\s+)?(?:month|mo)/i);
  if (monthlyMatch) {
    plan.price!.monthly.amount = parseInt(monthlyMatch[1], 10);
  }
  
  // Extract yearly price: "billed yearly as $144" or "$17 per month" (when monthly is higher)
  const yearlyMatch = section.match(/billed\s+yearly\s+as\s+\$(\d+)/i);
  if (yearlyMatch) {
    const yearlyTotal = parseInt(yearlyMatch[1], 10);
    const monthlyFromYearly = Math.round(yearlyTotal / 12);
    
    // If we found a monthly price, use it; otherwise calculate from yearly
    if (plan.price!.monthly.amount === 0) {
      plan.price!.monthly.amount = monthlyFromYearly;
    }
    
    plan.price!.yearly = {
      amount: monthlyFromYearly,
      currency: 'USD',
      period: 'month',
    };
    plan.billingNote = '*Billed yearly';
  } else {
    // Check for discount pattern: "$28 $17 per month"
    const discountMatch = section.match(/\$(\d+)\s+\$(\d+)\s+per\s+month/i);
    if (discountMatch) {
      const monthlyAmount = parseInt(discountMatch[1], 10);
      const yearlyAmount = parseInt(discountMatch[2], 10);
      plan.price!.monthly.amount = monthlyAmount;
      plan.price!.yearly = {
        amount: yearlyAmount,
        currency: 'USD',
        period: 'month',
      };
      plan.billingNote = '*Billed yearly';
    }
  }
  
  // Set CTA text
  plan.ctaText = planName.toLowerCase() === 'free' ? 'Get Started' : 'Start Free Trial';
  
  // Extract features (simple list items)
  const features: Array<{ text: string }> = [];
  const featureMatches = section.match(/([A-Z][^.!?]{10,80})/g);
  if (featureMatches) {
    for (const match of featureMatches.slice(0, 8)) {
      const cleanFeature = match.trim();
      if (cleanFeature.length > 10 && cleanFeature.length < 80) {
        features.push({ text: cleanFeature });
      }
    }
  }
  
  if (features.length > 0) {
    plan.featureItems = features;
  }
  
  return plan as PricingPlan;
}

/**
 * Extract feature cards from features text
 */
function extractFeatureCards(text: string): FeatureCard[] {
  const cards: FeatureCard[] = [];
  const seen = new Set<string>();
  
  // Split concatenated tool names (pattern: CapitalWordCapitalWord)
  // First, try to split by common patterns
  const splitPatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,5})(?=[A-Z][a-z]|$)/g, // "Add Audio to Video" followed by capital
    /(AI\s+[A-Z][a-zA-Z\s]{5,40})/g, // "AI Video Generator"
    /([A-Z][a-z]+\s+(?:Video|Audio|Image|Text|Speech|Editor|Generator|Tool|Maker|Converter|Cutter|Joiner|Splitter|Remover|Enhancer|Translator|Transcription|Dubbing|Subtitles|Voice|Photo)[\sA-Za-z]{0,30})/g,
  ];
  
  const candidates: string[] = [];
  
  // Extract from split patterns
  for (const pattern of splitPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const clean = match.trim();
        if (clean.length >= 8 && clean.length <= 60) {
          const words = clean.split(/\s+/);
          if (words.length >= 2 && words.length <= 6) {
            // Skip if it's clearly not a feature name
            if (!/^(Popular|All|View|Trusted|Frequently|Do you|What|How|Is there|Can I|VEED|Online|Trusted by|Here's what)/i.test(clean)) {
              candidates.push(clean);
            }
          }
        }
      }
    }
  }
  
  // Also try splitting by lines
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 0);
  for (const line of lines) {
    if (line.length >= 8 && line.length <= 60) {
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 6 && /^[A-Z]/.test(line) && !/[.!?]$/.test(line)) {
        if (!/^(Popular|All|View|Trusted|Frequently|Do you|What|How|Is there|Can I|VEED|Online|Trusted by)/i.test(line)) {
          candidates.push(line);
        }
      }
    }
  }
  
  // Process candidates
  for (const candidate of candidates) {
    const normalized = candidate.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }
    
    seen.add(normalized);
    
    const words = candidate.split(/\s+/);
    
    // Filter out candidates that are too long
    if (words.length > 6 || candidate.length > 50) {
      continue;
    }
    
    // Create title (first 6 words max)
    const titleWords = words.slice(0, Math.min(6, words.length));
    const title = titleWords.join(' ');
    
    // Create description (use the title + a simple description)
    const description = title + '.';
    
    cards.push({
      title,
      description,
      icon: ICONS[cards.length % ICONS.length],
    });
    
    if (cards.length >= 10) {
      break;
    }
  }
  
  return cards;
}

/**
 * Quality gate for pricing plans
 */
function checkPricingQualityGate(plans: PricingPlan[]): PricingGateResult {
  if (plans.length < 2) {
    return { passed: false, reason: `Need >= 2 plans, found ${plans.length}` };
  }
  
  // Check: non-free plans must have at least one with valid price
  const nonFreePlans = plans.filter(p => p.name.toLowerCase() !== 'free');
  const validPrices = nonFreePlans.filter(p => 
    p.price.monthly.amount > 0 || p.unitPriceNote === 'Custom pricing'
  );
  
  if (validPrices.length === 0) {
    return { passed: false, reason: 'No valid prices found in non-free plans' };
  }
  
  return { passed: true };
}

/**
 * Quality gate for features
 */
function checkFeaturesQualityGate(plan: PricingPlan): PricingGateResult {
  if (!plan.featureItems || plan.featureItems.length < 4) {
    return { passed: false, reason: `Need >= 4 features, found ${plan.featureItems?.length || 0}` };
  }
  return { passed: true };
}

/**
 * Process a single tool
 */
async function processTool(slug: string, sources: ToolSource[], tools: Tool[], frozenSlugs: Set<string> = new Set(), dryRun: boolean = false): Promise<{
  updated: boolean;
  report: {
    slug: string;
    plansCount: number;
    hasYearly: boolean;
    featureStats: { min: number; avg: number; max: number };
    pricingGatePassed: boolean;
    featuresGatePassed: boolean;
    written: boolean;
    writtenPricing: boolean;
    writtenFeatures: boolean;
    writtenCards: boolean;
    frozen: boolean;
  };
}> {
  const isFrozen = frozenSlugs.has(slug);
  console.log(`\n📦 Processing ${slug}...`);
  
  if (isFrozen) {
    console.log(`  🧊 FROZEN: This tool will be processed but not written to tools.json`);
  }
  
  const toolIndex = tools.findIndex(t => t.slug === slug);
  if (toolIndex === -1) {
    console.log(`  ⚠ Tool not found in tools.json`);
    return {
      updated: false,
      report: {
        slug,
        plansCount: 0,
        hasYearly: false,
        featureStats: { min: 0, avg: 0, max: 0 },
        pricingGatePassed: false,
        featuresGatePassed: false,
        written: false,
        writtenPricing: false,
        writtenFeatures: false,
        writtenCards: false,
        frozen: isFrozen,
      },
    };
  }
  
  const tool = tools[toolIndex];
  const source = sources.find(s => s.slug === slug);
  if (!source) {
    console.log(`  ⚠ Source not found`);
    return {
      updated: false,
      report: {
        slug,
        plansCount: 0,
        hasYearly: false,
        featureStats: { min: 0, avg: 0, max: 0 },
        pricingGatePassed: false,
        featuresGatePassed: false,
        written: false,
        writtenPricing: false,
        writtenFeatures: false,
        writtenCards: false,
        frozen: isFrozen,
      },
    };
  }
  
  let writtenPricing = false;
  let writtenFeatures = false;
  let writtenCards = false;
  let extractedPlans: PricingPlan[] = [];
  let pricingGate: PricingGateResult = { passed: false, reason: 'No pricing data' };
  
  // Extract pricing plans
  if (source.official_urls.pricing) {
    let plans: PricingPlan[] = [];
    
    // Special handling for invideo and veed-io: merge monthly + yearly
    if (slug === 'invideo' || slug === 'veed-io') {
      const monthlyHtmlFile = getLatestCacheFile(slug, 'pricing-monthly', '.html');
      const yearlyHtmlFile = getLatestCacheFile(slug, 'pricing-yearly', '.html');
      
      if (monthlyHtmlFile && yearlyHtmlFile) {
        console.log(`  📄 Reading pricing HTML: ${path.basename(monthlyHtmlFile)} + ${path.basename(yearlyHtmlFile)}`);
        const monthlyHtml = fs.readFileSync(monthlyHtmlFile, 'utf-8');
        const yearlyHtml = fs.readFileSync(yearlyHtmlFile, 'utf-8');
        
        const monthlyPlans = extractPricingPlansFromHtml(monthlyHtml, slug, false);
        const yearlyPlans = extractPricingPlansFromHtml(yearlyHtml, slug, true);
        
        // Merge plans by name
        plans = mergeMonthlyYearlyPlans(monthlyPlans, yearlyPlans);
      } else {
        console.log(`  ⚠ ${slug} requires both pricing-monthly and pricing-yearly cache files`);
        if (!monthlyHtmlFile) console.log(`    Missing: pricing-monthly`);
        if (!yearlyHtmlFile) console.log(`    Missing: pricing-yearly`);
      }
    } else {
      // Normal extraction for other tools
      const pricingHtmlFile = getLatestCacheFile(slug, 'pricing', '.html');
      
      if (pricingHtmlFile) {
        console.log(`  📄 Reading pricing HTML: ${path.basename(pricingHtmlFile)}`);
        const pricingHtml = fs.readFileSync(pricingHtmlFile, 'utf-8');
        plans = extractPricingPlansFromHtml(pricingHtml, slug);
      } else {
        // Fallback to txt
        const pricingFile = getLatestCacheFile(slug, 'pricing', '.txt');
        if (pricingFile) {
          console.log(`  📄 Reading pricing TXT: ${path.basename(pricingFile)}`);
          const pricingText = fs.readFileSync(pricingFile, 'utf-8');
          plans = extractPricingPlans(pricingText);
        } else {
          console.log(`  ⚠ No pricing cache file found`);
        }
      }
    }
    
    extractedPlans = plans;
    
    // Quality gate: pricing
    pricingGate = checkPricingQualityGate(plans);
    console.log(`  📊 Detected plans: ${plans.map(p => p.name).join(', ')}`);
    console.log(`  📊 Pricing gate: ${pricingGate.passed ? '✓ PASSED' : '✗ FAILED'} ${pricingGate.reason || ''}`);
    
    // CRITICAL: Only update pricing_plans if pricing gate passed
    // writePricing: controls whether to write pricing_plans at all
    // writePlanFeatures: controls whether to write featureItems within plans
    const shouldWritePricing = pricingGate.passed;
    let shouldWritePlanFeatures = false;
    
    if (shouldWritePricing) {
      // Quality gate: features (per plan)
      const existingPlans = tool.pricing_plans || [];
      const plansToUpdate: PricingPlan[] = [];
      let hasAnyFeatureUpdate = false;
      
      for (const extractedPlan of plans) {
        const featuresGate = checkFeaturesQualityGate(extractedPlan);
        
        // Find existing plan with same name
        const existingPlan = existingPlans.find(p => p.name.toLowerCase() === extractedPlan.name.toLowerCase());
        
        if (featuresGate.passed) {
          // Features passed: update plan with features
          plansToUpdate.push(extractedPlan);
          hasAnyFeatureUpdate = true;
          shouldWritePlanFeatures = true;
          console.log(`    ✓ ${extractedPlan.name}: ${extractedPlan.featureItems?.length || 0} features (will update)`);
        } else if (existingPlan && existingPlan.featureItems && existingPlan.featureItems.length >= 4) {
          // Features failed but existing plan has features: keep existing features, update price only
          const updatedPlan = { ...extractedPlan };
          updatedPlan.featureItems = existingPlan.featureItems;
          plansToUpdate.push(updatedPlan);
          // Don't set writePlanFeatures = true here, we're keeping old features
          console.log(`    ⚠ ${extractedPlan.name}: ${extractedPlan.featureItems?.length || 0} features (keeping existing ${existingPlan.featureItems.length}, updating price only)`);
        } else {
          // Features failed and no existing: update price only, no features
          const priceOnlyPlan = { ...extractedPlan };
          delete priceOnlyPlan.featureItems; // Remove featureItems to ensure we only update price
          plansToUpdate.push(priceOnlyPlan);
          // Don't set writePlanFeatures = true here, we're not writing features
          console.log(`    ⚠ ${extractedPlan.name}: ${extractedPlan.featureItems?.length || 0} features (will update price only, no features)`);
        }
      }
      
      // Only update if not frozen and not dry run
      if (!isFrozen && !dryRun) {
        if (shouldWritePricing) {
          tool.pricing_plans = plansToUpdate;
          writtenPricing = true;
        }
        if (shouldWritePlanFeatures) {
          writtenFeatures = hasAnyFeatureUpdate;
        }
      }
      
      console.log(`  ✓ Extracted ${plans.length} pricing plans (quality check passed)`);
      if (isFrozen) {
        console.log(`  🧊 FROZEN: Plans extracted but will not be written to tools.json`);
      } else if (dryRun) {
        console.log(`  🔍 DRY RUN: Plans extracted but will not be written to tools.json`);
      }
    } else {
      console.log(`  ⚠ Quality check failed: ${pricingGate.reason} - pricing_plans will NOT be updated`);
    }
  }
  
  // Extract feature cards (independent of pricing gate)
  // writeFeatureCards: controls whether to write featureCards (need >= 4 cards)
  let writeFeatureCards = false;
  if (source.official_urls.features) {
    const featuresFile = getLatestCacheFile(slug, 'features');
    if (featuresFile) {
      console.log(`  📄 Reading features: ${path.basename(featuresFile)}`);
      const featuresText = fs.readFileSync(featuresFile, 'utf-8');
      const cards = extractFeatureCards(featuresText);
      
      if (cards.length >= 4) {
        writeFeatureCards = true;
        console.log(`  ✓ Extracted ${cards.length} feature cards`);
        // Only update if not frozen and not dry run
        if (!isFrozen && !dryRun) {
          tool.featureCards = cards;
          writtenCards = true;
        }
        if (isFrozen) {
          console.log(`  🧊 FROZEN: Feature cards extracted but will not be written to tools.json`);
        } else if (dryRun) {
          console.log(`  🔍 DRY RUN: Feature cards extracted but will not be written to tools.json`);
        }
      } else {
        console.log(`  ⚠ Only ${cards.length} feature card(s) found, skipping update (need >= 4)`);
      }
    } else {
      console.log(`  ⚠ No features cache file found`);
    }
  }
  
  // Generate report
  const hasYearly = extractedPlans.some(p => p.price.yearly !== undefined);
  const featureCounts = extractedPlans.map(p => p.featureItems?.length || 0);
  const featureStats = {
    min: featureCounts.length > 0 ? Math.min(...featureCounts) : 0,
    avg: featureCounts.length > 0 ? Math.round(featureCounts.reduce((a, b) => a + b, 0) / featureCounts.length) : 0,
    max: featureCounts.length > 0 ? Math.max(...featureCounts) : 0,
  };
  
  const featuresGatePassed = extractedPlans.every(p => checkFeaturesQualityGate(p).passed);
  
  // Only write to tools.json if not frozen and not dry run
  const shouldWrite = (writtenPricing || writtenFeatures || writtenCards) && !isFrozen && !dryRun;
  if (shouldWrite) {
    tools[toolIndex] = tool;
  }
  
  // Written field: show what was actually written (not just if anything was written)
  const written = shouldWrite && (writtenPricing || writtenFeatures || writtenCards);
  
  return {
    updated: shouldWrite,
    report: {
      slug,
      plansCount: extractedPlans.length,
      hasYearly,
      featureStats,
      pricingGatePassed: pricingGate.passed,
      featuresGatePassed,
      written,
      writtenPricing,
      writtenFeatures,
      writtenCards,
      frozen: isFrozen,
    },
  };
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  let slugs: string[] = [];
  let skipSlugs: string[] = [];
  let freezeSlugs: string[] = [];
  let includeFliki = false;
  let dryRun = false;
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slugs' && args[i + 1]) {
      slugs = args[i + 1].split(',').map(s => s.trim());
      i++;
    } else if (args[i] === '--all') {
      const sources = loadSources();
      slugs = sources.map(s => s.slug);
    } else if (args[i] === '--skip' && args[i + 1]) {
      skipSlugs = args[i + 1].split(',').map(s => s.trim());
      i++;
    } else if (args[i] === '--freeze' && args[i + 1]) {
      freezeSlugs = args[i + 1].split(',').map(s => s.trim());
      i++;
    } else if (args[i] === '--includeFliki') {
      includeFliki = true;
    } else if (args[i] === '--dryRun') {
      dryRun = true;
    }
  }
  
  // Also check environment variable FREEZE_SLUGS
  if (process.env.FREEZE_SLUGS) {
    const envFreezeSlugs = process.env.FREEZE_SLUGS.split(',').map(s => s.trim()).filter(s => s.length > 0);
    freezeSlugs = [...new Set([...freezeSlugs, ...envFreezeSlugs])]; // Merge and deduplicate
  }
  
  if (slugs.length === 0) {
    console.error('Usage: pnpm extract:tools -- --slugs slug1,slug2 | --all [--skip slug1,slug2] [--freeze slug1,slug2] [--includeFliki] [--dryRun]');
    process.exit(1);
  }
  
  if (dryRun) {
    console.log(`🔍 DRY RUN MODE: Will extract and validate but NOT write to tools.json\n`);
  }
  
  // Check if fliki is explicitly included in --slugs
  const hasFlikiInSlugs = slugs.some(s => s.toLowerCase() === 'fliki');
  
  // Apply default skip: skip fliki unless explicitly included via --slugs or --includeFliki
  if (!hasFlikiInSlugs && !includeFliki) {
    // Add default skip slugs that are not already in skipSlugs
    for (const defaultSkipSlug of DEFAULT_SKIP) {
      if (!skipSlugs.includes(defaultSkipSlug) && !slugs.includes(defaultSkipSlug)) {
        skipSlugs.push(defaultSkipSlug);
      }
    }
  }
  
  // Filter out skipped slugs
  slugs = slugs.filter(s => !skipSlugs.includes(s));
  
  // Create frozen slugs set
  const frozenSlugsSet = new Set(freezeSlugs.map(s => s.toLowerCase()));
  
  console.log(`🚀 Extract Tools from Cache\n`);
  console.log(`📋 Processing ${slugs.length} tool(s): ${slugs.join(', ')}`);
  if (skipSlugs.length > 0) {
    const defaultSkipped = skipSlugs.filter(s => DEFAULT_SKIP.includes(s));
    const userSkipped = skipSlugs.filter(s => !DEFAULT_SKIP.includes(s));
    if (defaultSkipped.length > 0) {
      console.log(`⏭ Skipping (default): ${defaultSkipped.join(', ')}`);
    }
    if (userSkipped.length > 0) {
      console.log(`⏭ Skipping (user): ${userSkipped.join(', ')}`);
    }
  }
  if (freezeSlugs.length > 0) {
    console.log(`🧊 Freezing: ${freezeSlugs.join(', ')} (will process but not write to tools.json)`);
  }
  
  const sources = loadSources();
  const tools = loadTools();
  
  let updatedCount = 0;
  const reports: Array<{
    slug: string;
    plansCount: number;
    hasYearly: boolean;
    featureStats: { min: number; avg: number; max: number };
    pricingGatePassed: boolean;
    featuresGatePassed: boolean;
    written: boolean;
    writtenPricing: boolean;
    writtenFeatures: boolean;
    writtenCards: boolean;
    frozen: boolean;
  }> = [];
  
  for (const slug of slugs) {
    try {
      const result = await processTool(slug, sources, tools, frozenSlugsSet, dryRun);
      if (result.updated) {
        updatedCount++;
      }
      reports.push(result.report);
    } catch (error) {
      console.error(`  ❌ Error processing ${slug}:`, error);
      reports.push({
        slug,
        plansCount: 0,
        hasYearly: false,
        featureStats: { min: 0, avg: 0, max: 0 },
        pricingGatePassed: false,
        featuresGatePassed: false,
        written: false,
        writtenPricing: false,
        writtenFeatures: false,
        writtenCards: false,
        frozen: frozenSlugsSet.has(slug.toLowerCase()),
      });
    }
  }
  
  if (dryRun) {
    console.log(`\n🔍 DRY RUN: No changes written to tools.json`);
  } else if (updatedCount > 0) {
    saveTools(tools);
    console.log(`\n✅ Updated ${updatedCount} tool(s) in tools.json`);
  } else {
    console.log(`\n⚠ No tools were updated`);
  }
  
  // Print report table
  console.log(`\n${'='.repeat(140)}`);
  console.log(`📊 EXTRACTION REPORT`);
  console.log(`${'='.repeat(140)}`);
  console.log(
    `${'Slug'.padEnd(20)} | ${'Plans'.padEnd(6)} | ${'Yearly'.padEnd(7)} | ${'Features (min/avg/max)'.padEnd(20)} | ${'Pricing Gate'.padEnd(13)} | ${'Features Gate'.padEnd(14)} | ${'Written'.padEnd(8)} | ${'WrittenP'.padEnd(9)} | ${'WrittenF'.padEnd(9)} | ${'WrittenC'.padEnd(9)} | ${'Frozen'.padEnd(7)}`
  );
  console.log(`${'-'.repeat(140)}`);
  
  for (const report of reports) {
    const featuresStr = `${report.featureStats.min}/${report.featureStats.avg}/${report.featureStats.max}`;
    const pricingGateStr = report.pricingGatePassed ? '✓ PASS' : '✗ FAIL';
    const featuresGateStr = report.featuresGatePassed ? '✓ PASS' : '✗ FAIL';
    const writtenStr = report.written ? '✓ YES' : '✗ NO';
    const writtenPStr = report.writtenPricing ? '✓ YES' : '✗ NO';
    const writtenFStr = report.writtenFeatures ? '✓ YES' : '✗ NO';
    const writtenCStr = report.writtenCards ? '✓ YES' : '✗ NO';
    const frozenStr = report.frozen ? '✓ YES' : '✗ NO';
    
    console.log(
      `${report.slug.padEnd(20)} | ${String(report.plansCount).padEnd(6)} | ${(report.hasYearly ? 'YES' : 'NO').padEnd(7)} | ${featuresStr.padEnd(20)} | ${pricingGateStr.padEnd(13)} | ${featuresGateStr.padEnd(14)} | ${writtenStr.padEnd(8)} | ${writtenPStr.padEnd(9)} | ${writtenFStr.padEnd(9)} | ${writtenCStr.padEnd(9)} | ${frozenStr.padEnd(7)}`
    );
  }
  
  console.log(`${'='.repeat(140)}\n`);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
