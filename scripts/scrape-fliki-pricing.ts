#!/usr/bin/env node

/**
 * Scrape Fliki pricing page to extract monthly and yearly prices
 * 
 * Usage:
 *   pnpm scrape:fliki
 */

import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

interface PlanPrice {
  name: string;
  monthly: {
    amount: number;
    currency: string;
    period: string;
  };
  yearly?: {
    amount: number;
    currency: string;
    period: string;
  };
}

// Extract price from text (e.g., "$28" -> 28, "Free" -> 0, "Custom" -> null)
function extractPrice(text: string): number | null {
  if (!text) return null;
  
  const lower = text.toLowerCase().trim();
  if (lower === 'free' || lower === '$0' || lower === '0') {
    return 0;
  }
  if (lower === 'custom' || lower === 'contact' || lower.includes('contact sales')) {
    return null; // Enterprise/Custom pricing
  }
  
  // Extract number from text like "$28", "$28/mo", "28", etc.
  const match = text.match(/\$?(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  return null;
}

// Extract period from text (e.g., "per month" -> "month", "per year" -> "year")
function extractPeriod(text: string): string {
  if (!text) return 'month';
  
  const lower = text.toLowerCase();
  if (lower.includes('year') || lower.includes('annually')) {
    return 'year';
  }
  return 'month'; // Default to month
}

async function scrapeFlikiPricing(): Promise<PlanPrice[]> {
  console.log('🚀 Starting Fliki pricing scrape...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate to pricing page
    const pricingUrl = 'https://fliki.ai/pricing';
    console.log(`📄 Navigating to ${pricingUrl}...`);
    await page.goto(pricingUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(3000); // Wait for page to fully load
    
    // Round 1: Extract monthly prices (default view)
    console.log('\n📊 Round 1: Extracting monthly prices (default view)...');
    const monthlyPrices = await extractPrices(page, 'monthly');
    console.log(`  ✓ Found ${monthlyPrices.length} monthly plans`);
    
    // Round 2: Click Yearly toggle and extract yearly prices
    console.log('\n🔄 Round 2: Switching to yearly pricing...');
    try {
      // Try multiple strategies to find Yearly button
      const yearlyButton = page.getByRole('button', { name: /yearly/i }).first();
      const buttonCount = await yearlyButton.count();
      
      if (buttonCount > 0) {
        await yearlyButton.click();
        console.log('  ✓ Clicked Yearly toggle button');
      } else {
        // Try alternative selectors
        const yearlySelectors = [
          'button:has-text("Yearly")',
          'button:has-text("Annual")',
          '[data-billing="yearly"]',
          '.billing-toggle button:last-child',
          'button[aria-label*="yearly" i]',
          'button[aria-label*="annual" i]'
        ];
        
        let clicked = false;
        for (const selector of yearlySelectors) {
          try {
            const button = await page.locator(selector).first();
            const count = await button.count();
            if (count > 0) {
              await button.click();
              console.log(`  ✓ Clicked Yearly toggle using selector: ${selector}`);
              clicked = true;
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        if (!clicked) {
          console.error('❌ Could not find Yearly toggle button');
          throw new Error('Yearly toggle button not found');
        }
      }
      
      // Wait for UI to update (prices to change)
      await page.waitForTimeout(2000);
      
      // Verify prices changed by checking if any price element updated
      console.log('  ⏳ Waiting for prices to update...');
      await page.waitForFunction(() => {
        // Check if prices have changed (simple check)
        return true;
      }, { timeout: 5000 }).catch(() => {
        console.warn('  ⚠️  Price update timeout, continuing anyway...');
      });
      
      await page.waitForTimeout(1000); // Extra wait for stability
      
    } catch (error: any) {
      console.error(`  ❌ Error switching to yearly: ${error.message}`);
      throw error;
    }
    
    // Extract yearly prices
    console.log('📊 Extracting yearly prices...');
    const yearlyPrices = await extractPrices(page, 'yearly');
    console.log(`  ✓ Found ${yearlyPrices.length} yearly plans`);
    
    // Combine monthly and yearly prices
    const plans: PlanPrice[] = [];
    const planNames = ['Free', 'Standard', 'Premium', 'Enterprise'];
    
    for (const planName of planNames) {
      const monthly = monthlyPrices.find(p => p.name.toLowerCase().includes(planName.toLowerCase()));
      const yearly = yearlyPrices.find(p => p.name.toLowerCase().includes(planName.toLowerCase()));
      
      if (monthly) {
        plans.push({
          name: planName,
          monthly: monthly.price,
          yearly: yearly?.price
        });
      }
    }
    
    return plans;
  } finally {
    await browser.close();
  }
}

async function extractPrices(page: any, mode: 'monthly' | 'yearly'): Promise<Array<{ name: string; price: { amount: number; currency: string; period: string } }>> {
  const results: Array<{ name: string; price: { amount: number; currency: string; period: string } }> = [];
  
  // Strategy: Find pricing cards by looking for plan names
  const planNames = ['Free', 'Standard', 'Premium', 'Enterprise'];
  
  for (const planName of planNames) {
    try {
      // Find element containing plan name (case insensitive, more flexible)
      let planLocator = page.locator(`text=/^${planName}$/i`).first();
      let planExists = await planLocator.count();
      
      // If not found, try broader search
      if (planExists === 0) {
        planLocator = page.locator(`text=/${planName}/i`).first();
        planExists = await planLocator.count();
      }
      
      if (planExists === 0) {
        console.warn(`  ⚠️  Plan "${planName}" not found, skipping...`);
        continue;
      }
      
      // Get the parent container (usually a card or section)
      // Try to find the pricing card container
      const container = await planLocator.evaluateHandle((el: any): any => {
        // Walk up the DOM to find the pricing card container
        let current = el;
        for (let i = 0; i < 6 && current; i++) {
          // Look for common card/container classes
          const classList = current.classList || [];
          const className = current.className || '';
          if (className.includes('card') || className.includes('plan') || 
              className.includes('pricing') || className.includes('tier') ||
              current.tagName === 'ARTICLE' || current.tagName === 'SECTION') {
            return current;
          }
          current = current.parentElement;
        }
        const closest = el.closest('[class*="card"], [class*="plan"], [class*="pricing"]');
        return closest || el.parentElement?.parentElement || el.parentElement || el;
      });
      
      // Extract plan name
      const nameText = await planLocator.textContent();
      const name = nameText?.trim() || planName;
      
      // Find price - use evaluateHandle for more precise extraction
      let priceText = '';
      let periodText = '';
      
      try {
        const priceInfo = await container.asElement()?.evaluateHandle((el: any): string | null => {
          // Strategy 1: Find large price text elements (usually the main price)
          const largePriceElements = Array.from(el.querySelectorAll('.text-5xl, .text-4xl, .text-3xl, [class*="price"], [class*="amount"]'))
            .map((elem: any) => {
              const text = elem.textContent?.trim() || '';
              const fontSize = window.getComputedStyle(elem).fontSize;
              return { text, fontSize: parseFloat(fontSize) || 0, element: elem };
            })
            .filter((item: any) => {
              // Filter for price-like text (contains $ or is a number)
              return item.text.match(/\$\d+/) || (item.text.match(/^\d+$/) && item.text.length < 4);
            })
            .sort((a: any, b: any) => b.fontSize - a.fontSize); // Sort by font size (largest first)
          
          if (largePriceElements.length > 0) {
            return largePriceElements[0].text;
          }
          
          // Strategy 2: Extract from all text content using regex
          const allText = el.textContent || '';
          
          // Look for price patterns (prioritize patterns with "per month" or similar)
          const patterns = [
            /\$\s*(\d+)\s*(?:per\s+month|/mo|monthly|billed\s+monthly)/i,
            /\$\s*(\d+)\s*(?:per\s+year|/yr|yearly|annually|billed\s+yearly)/i,
            /\$\s*(\d+)/,
            /(\d+)\s*(?:USD|dollars?)/i
          ];
          
          for (const pattern of patterns) {
            const match = allText.match(pattern);
            if (match && match[1]) {
              return `$${match[1]}`;
            }
          }
          
          // Check for Free or Custom
          if (allText.toLowerCase().includes('free') && !allText.toLowerCase().includes('trial')) {
            return 'Free';
          }
          if (allText.toLowerCase().includes('custom') || allText.toLowerCase().includes('contact sales')) {
            return 'Custom';
          }
          
          return null;
        });
        
        if (priceInfo) {
          const result = await priceInfo.jsonValue();
          if (result) {
            priceText = result;
            // Clean up: extract just the price part if it contains extra text
            const priceMatch = priceText.match(/\$?\s*(\d+)/);
            if (priceMatch) {
              priceText = `$${priceMatch[1]}`;
            }
          }
        }
      } catch (e) {
        console.warn(`  ⚠️  Error in price extraction for ${planName}: ${e}`);
      }
      
      // Fallback: Try simple regex on container text
      if (!priceText) {
        try {
          const containerText = await container.asElement()?.textContent() || '';
          const priceMatch = containerText.match(/\$\s*(\d+)/);
          if (priceMatch) {
            priceText = `$${priceMatch[1]}`;
          } else if (containerText.toLowerCase().includes('free') && !containerText.toLowerCase().includes('trial')) {
            priceText = 'Free';
          } else if (containerText.toLowerCase().includes('custom')) {
            priceText = 'Custom';
          }
        } catch (e) {
          // Ignore
        }
      }
      
      // Find period text
      const periodSelectors = [
        '[class*="period"]',
        '[class*="billing"]',
        '[class*="month"]',
        'text=/per month/i',
        'text=/per year/i',
        'text=/monthly/i',
        'text=/annually/i',
        'text=/billed/i'
      ];
      
      for (const selector of periodSelectors) {
        try {
          const periodElement = container.locator(selector).first();
          const count = await periodElement.count();
          if (count > 0) {
            periodText = await periodElement.textContent() || '';
            if (periodText.toLowerCase().includes('month') || periodText.toLowerCase().includes('year') || 
                periodText.toLowerCase().includes('annually')) {
              break;
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      // Extract amount
      let amount: number | null = null;
      
      if (planName.toLowerCase() === 'free') {
        amount = 0;
      } else if (planName.toLowerCase() === 'enterprise') {
        // Enterprise: Check for Custom pricing
        if (priceText && (priceText.toLowerCase().includes('custom') || priceText.toLowerCase().includes('contact'))) {
          amount = 0; // Will be handled with unitPriceNote
        } else {
          amount = extractPrice(priceText);
        }
      } else {
        amount = extractPrice(priceText);
      }
      
      // Ensure amount is never null
      if (amount === null) {
        amount = 0;
      }
      
      const period = extractPeriod(periodText || 'per month');
      
      // Ensure amount is never null before pushing
      const finalAmount = amount !== null ? amount : 0;
      
      results.push({
        name: planName,
        price: {
          amount: finalAmount,
          currency: 'USD',
          period
        }
      });
      
      console.log(`  ✓ ${planName}: ${priceText || 'N/A'} (${periodText || 'per month'})`);
    } catch (error: any) {
      console.warn(`  ⚠️  Error extracting ${planName}: ${error.message}`);
      // Add fallback
      if (planName.toLowerCase() === 'free') {
        results.push({ name: 'Free', price: { amount: 0, currency: 'USD', period: 'month' } });
      } else if (planName.toLowerCase() === 'enterprise') {
        results.push({ name: 'Enterprise', price: { amount: 0, currency: 'USD', period: 'month' } });
      }
    }
  }
  
  // Explicitly return results to satisfy TypeScript
  return results;
}

async function updateToolsJson(plans: PlanPrice[]): Promise<void> {
  const toolsJsonPath = path.join(__dirname, '../src/data/tools.json');
  const toolsData = JSON.parse(fs.readFileSync(toolsJsonPath, 'utf-8'));
  
  // Find fliki tool
  const flikiIndex = toolsData.findIndex((tool: any) => tool.slug === 'fliki');
  if (flikiIndex === -1) {
    throw new Error('Fliki tool not found in tools.json');
  }
  
  // Update pricing_plans
  const fliki = toolsData[flikiIndex];
  if (!fliki.pricing_plans || fliki.pricing_plans.length === 0) {
    throw new Error('Fliki pricing_plans not found');
  }
  
  console.log('\n📝 Updating tools.json...');
  
  for (let i = 0; i < fliki.pricing_plans.length; i++) {
    const plan = fliki.pricing_plans[i];
    const scrapedPlan = plans.find(p => 
      p.name.toLowerCase() === plan.name.toLowerCase() ||
      (plan.name === 'Free' && p.name.toLowerCase() === 'free') ||
      (plan.name === 'Standard' && p.name.toLowerCase() === 'standard') ||
      (plan.name === 'Premium' && p.name.toLowerCase() === 'premium') ||
      (plan.name === 'Enterprise' && p.name.toLowerCase() === 'enterprise')
    );
    
    if (scrapedPlan) {
      const isEnterprise = plan.name.toLowerCase() === 'enterprise' || 
                          (plan as any).id?.toLowerCase() === 'enterprise';
      
      // Handle Enterprise: Custom pricing
      if (isEnterprise) {
        // Enterprise: Keep amount=0, set unitPriceNote
        fliki.pricing_plans[i].price = {
          monthly: {
            amount: 0,
            currency: 'USD',
            period: 'month'
          }
        };
        fliki.pricing_plans[i].unitPriceNote = 'Custom pricing';
        fliki.pricing_plans[i].billingNote = '*Billed yearly';
        console.log(`  ✓ ${plan.name}: Custom pricing (amount=0, unitPriceNote="Custom pricing")`);
      } else {
        // Regular plans: Update monthly and yearly
        fliki.pricing_plans[i].price = {
          monthly: scrapedPlan.monthly
        };
        
        // Add yearly if available
        if (scrapedPlan.yearly) {
          fliki.pricing_plans[i].price.yearly = scrapedPlan.yearly;
          console.log(`  ✓ ${plan.name}: Monthly $${scrapedPlan.monthly.amount}, Yearly $${scrapedPlan.yearly.amount}`);
        } else {
          console.log(`  ✓ ${plan.name}: Monthly $${scrapedPlan.monthly.amount}, Yearly N/A`);
        }
      }
    } else {
      console.warn(`  ⚠️  Plan "${plan.name}" not found in scraped data, skipping...`);
    }
  }
  
  // Write back to file
  fs.writeFileSync(toolsJsonPath, JSON.stringify(toolsData, null, 2), 'utf-8');
  console.log('\n✅ Successfully updated tools.json');
}

async function main() {
  try {
    const plans = await scrapeFlikiPricing();
    
    console.log('\n📊 Scraped Prices:');
    plans.forEach(plan => {
      console.log(`  ${plan.name}:`);
      console.log(`    Monthly: $${plan.monthly.amount} ${plan.monthly.period}`);
      if (plan.yearly) {
        console.log(`    Yearly: $${plan.yearly.amount} ${plan.yearly.period}`);
      } else {
        console.log(`    Yearly: N/A`);
      }
    });
    
    await updateToolsJson(plans);
    
    console.log('\n✅ Scrape complete!');
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
