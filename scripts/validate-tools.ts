#!/usr/bin/env node

/**
 * Validate tools.json data quality
 * 
 * Usage:
 *   pnpm validate:tools
 *   pnpm validate:tools -- --slugs slug1,slug2
 */

import * as fs from 'fs';
import * as path from 'path';

interface PricingPlan {
  name: string;
  id?: string;
  tagline?: string;
  price: {
    monthly?: { amount: number; currency?: string; period?: string };
    yearly?: { amount: number; currency?: string; period?: string };
  };
  unitPriceNote?: string;
  billingNote?: string;
  ctaText?: string;
  ctaHref?: string;
  ribbonText?: string;
  featureItems?: Array<{ text: string; badge?: string; icon?: string }>;
}

interface Tool {
  slug: string;
  name: string;
  pricing_plans?: PricingPlan[];
  featureCards?: Array<{ title: string; description?: string; icon?: string }>;
}

function loadTools(): Tool[] {
  const toolsPath = path.join(process.cwd(), 'src', 'data', 'tools.json');
  if (!fs.existsSync(toolsPath)) {
    console.error(`❌ tools.json not found at ${toolsPath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(toolsPath, 'utf-8');
  return JSON.parse(content);
}

function validateTool(tool: Tool): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!tool.slug) {
    errors.push('Missing slug');
  }
  if (!tool.name) {
    errors.push('Missing name');
  }

  // Validate pricing_plans
  if (tool.pricing_plans) {
    if (!Array.isArray(tool.pricing_plans)) {
      errors.push('pricing_plans must be an array');
    } else {
      if (tool.pricing_plans.length === 0) {
        warnings.push('pricing_plans is empty');
      }

      tool.pricing_plans.forEach((plan, index) => {
        if (!plan.name) {
          errors.push(`pricing_plans[${index}]: Missing name`);
        }
        if (!plan.price) {
          errors.push(`pricing_plans[${index}]: Missing price`);
        } else {
          const hasMonthly = plan.price.monthly && plan.price.monthly.amount > 0;
          const hasYearly = plan.price.yearly && plan.price.yearly.amount > 0;
          const hasCustom = plan.unitPriceNote && /custom|contact|let's talk/i.test(plan.unitPriceNote);
          
          if (!hasMonthly && !hasYearly && !hasCustom) {
            warnings.push(`pricing_plans[${index}]: No valid price found`);
          }

          // Check for invalid prices
          if (plan.price.monthly && plan.price.monthly.amount < 0) {
            errors.push(`pricing_plans[${index}]: Invalid monthly amount: ${plan.price.monthly.amount}`);
          }
          if (plan.price.yearly && plan.price.yearly.amount < 0) {
            errors.push(`pricing_plans[${index}]: Invalid yearly amount: ${plan.price.yearly.amount}`);
          }
        }

        // Validate featureItems
        if (plan.featureItems) {
          if (!Array.isArray(plan.featureItems)) {
            errors.push(`pricing_plans[${index}]: featureItems must be an array`);
          } else {
            plan.featureItems.forEach((item, itemIndex) => {
              if (!item.text || item.text.trim().length === 0) {
                errors.push(`pricing_plans[${index}].featureItems[${itemIndex}]: Missing or empty text`);
              }
            });
          }
        }
      });
    }
  } else {
    warnings.push('No pricing_plans found');
  }

  // Validate featureCards
  if (tool.featureCards) {
    if (!Array.isArray(tool.featureCards)) {
      errors.push('featureCards must be an array');
    } else {
      tool.featureCards.forEach((card, index) => {
        if (!card.title || card.title.trim().length === 0) {
          errors.push(`featureCards[${index}]: Missing or empty title`);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function main() {
  const args = process.argv.slice(2);
  let slugs: string[] = [];

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slugs' && args[i + 1]) {
      slugs = args[i + 1].split(',').map(s => s.trim());
      i++;
    }
  }

  console.log('🔍 Validating tools.json...\n');

  const tools = loadTools();
  const toolsToValidate = slugs.length > 0
    ? tools.filter(t => slugs.includes(t.slug))
    : tools;

  if (toolsToValidate.length === 0) {
    console.error(`❌ No tools found${slugs.length > 0 ? ` matching slugs: ${slugs.join(', ')}` : ''}`);
    process.exit(1);
  }

  console.log(`📋 Validating ${toolsToValidate.length} tool(s): ${toolsToValidate.map(t => t.slug).join(', ')}\n`);

  let totalErrors = 0;
  let totalWarnings = 0;
  const results: Array<{
    slug: string;
    valid: boolean;
    errors: string[];
    warnings: string[];
    plansCount: number;
    featureCardsCount: number;
  }> = [];

  for (const tool of toolsToValidate) {
    const validation = validateTool(tool);
    const plansCount = tool.pricing_plans?.length || 0;
    const featureCardsCount = tool.featureCards?.length || 0;

    results.push({
      slug: tool.slug,
      ...validation,
      plansCount,
      featureCardsCount,
    });

    totalErrors += validation.errors.length;
    totalWarnings += validation.warnings.length;
  }

  // Print results
  console.log('='.repeat(100));
  console.log('📊 VALIDATION REPORT');
  console.log('='.repeat(100));
  console.log(
    `${'Slug'.padEnd(20)} | ${'Valid'.padEnd(6)} | ${'Plans'.padEnd(6)} | ${'Features'.padEnd(9)} | ${'Errors'.padEnd(6)} | ${'Warnings'.padEnd(8)}`
  );
  console.log('-'.repeat(100));

  for (const result of results) {
    const validStr = result.valid ? '✓ YES' : '✗ NO';
    const errorsStr = result.errors.length > 0 ? `✗ ${result.errors.length}` : '✓ 0';
    const warningsStr = result.warnings.length > 0 ? `⚠ ${result.warnings.length}` : '✓ 0';

    console.log(
      `${result.slug.padEnd(20)} | ${validStr.padEnd(6)} | ${String(result.plansCount).padEnd(6)} | ${String(result.featureCardsCount).padEnd(9)} | ${errorsStr.padEnd(6)} | ${warningsStr.padEnd(8)}`
    );

    // Print errors and warnings for invalid tools
    if (result.errors.length > 0 || result.warnings.length > 0) {
      if (result.errors.length > 0) {
        console.log(`  ❌ Errors:`);
        result.errors.forEach(err => console.log(`    - ${err}`));
      }
      if (result.warnings.length > 0) {
        console.log(`  ⚠ Warnings:`);
        result.warnings.forEach(warn => console.log(`    - ${warn}`));
      }
      console.log('');
    }
  }

  console.log('='.repeat(100));
  console.log(`\n📈 Summary:`);
  console.log(`  Total tools: ${toolsToValidate.length}`);
  console.log(`  Valid: ${results.filter(r => r.valid).length}`);
  console.log(`  Invalid: ${results.filter(r => !r.valid).length}`);
  console.log(`  Total errors: ${totalErrors}`);
  console.log(`  Total warnings: ${totalWarnings}`);

  if (totalErrors > 0) {
    console.log(`\n❌ Validation failed with ${totalErrors} error(s)`);
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log(`\n⚠ Validation passed with ${totalWarnings} warning(s)`);
    process.exit(0);
  } else {
    console.log(`\n✅ All tools are valid!`);
    process.exit(0);
  }
}

try {
  main();
} catch (error: unknown) {
  console.error('Error:', error);
  process.exit(1);
}
