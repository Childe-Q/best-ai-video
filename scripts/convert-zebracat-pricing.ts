#!/usr/bin/env tsx

/**
 * Convert Zebracat pricing JSON to tools.json pricing_plans format
 */

import * as fs from 'fs';
import * as path from 'path';

interface ZebracatPlan {
  name: string;
  badge: string | null;
  pricing: {
    type: string;
    billing_options?: string[];
    price_variants?: Array<{
      billing: string;
      amount: number;
      currency: string;
      period: string;
      note?: string;
      annual_total?: {
        amount: number;
        currency: string;
        note: string;
      };
    }>;
    label?: string;
    description?: string;
    base_monthly?: {
      amount: number;
      currency: string;
      period: string;
      note: string;
    };
  };
  included_summary: string[];
  cta: {
    label: string;
  };
}

interface ZebracatComparisonTable {
  feature_groups: Array<{
    group: string;
    rows: Array<{
      feature: string;
      values_by_plan: Record<string, string | boolean | number>;
    }>;
  }>;
}

interface ZebracatData {
  plans: ZebracatPlan[];
  comparison_table: ZebracatComparisonTable;
}

interface PricingPlan {
  name: string;
  id: string;
  price: {
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
  } | string;
  unitPriceNote?: string;
  billingNote?: string;
  ctaText?: string;
  ribbonText?: string;
  featureItems: Array<{
    icon?: string;
    text: string;
    badge?: string;
  }>;
}

function slugifyPlanName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function extractFeaturesFromComparisonTable(
  comparisonTable: ZebracatComparisonTable,
  planName: string
): string[] {
  const features: string[] = [];
  const seen = new Set<string>();
  const planNameLower = planName.toLowerCase();
  const planKey = slugifyPlanName(planName);

  const allRows: Array<{ feature: string; values_by_plan: Record<string, string | boolean | number> }> = [];
  
  if (comparisonTable.feature_groups) {
    comparisonTable.feature_groups.forEach(group => {
      if (group.rows) {
        allRows.push(...group.rows);
      }
    });
  }

  for (const row of allRows) {
    const featureLabel = row.feature;
    if (!featureLabel) continue;

    const valuesByPlan = row.values_by_plan;
    if (!valuesByPlan) continue;

    let planValue: string | boolean | number | undefined;
    
    const keysToTry = [planKey, planNameLower, planName].filter(Boolean) as string[];

    for (const key of keysToTry) {
      if (key in valuesByPlan) {
        planValue = valuesByPlan[key];
        break;
      }
    }

    if (planValue === undefined) {
      const matchingKey = Object.keys(valuesByPlan).find(
        k => k.toLowerCase() === planKey || k.toLowerCase() === planNameLower
      );
      if (matchingKey) {
        planValue = valuesByPlan[matchingKey];
      }
    }

    if (planValue === undefined || planValue === null) continue;
    
    if (planValue === true) {
      if (!seen.has(featureLabel)) {
        features.push(featureLabel);
        seen.add(featureLabel);
      }
    } else if (typeof planValue === 'string' || typeof planValue === 'number') {
      const valueStr = String(planValue).trim();
      if (
        valueStr &&
        valueStr !== '-' &&
        valueStr !== '—' &&
        valueStr.toLowerCase() !== 'no' &&
        valueStr.toLowerCase() !== 'false' &&
        valueStr.toLowerCase() !== 'n/a' &&
        valueStr !== '0' &&
        !valueStr.toLowerCase().includes('custom') &&
        !valueStr.toLowerCase().includes('not included')
      ) {
        const featureText = valueStr === 'true' || valueStr === 'yes'
          ? featureLabel
          : `${featureLabel}: ${valueStr}`;
        
        if (!seen.has(featureText)) {
          features.push(featureText);
          seen.add(featureText);
        }
      }
    }
  }

  return features;
}

function convertZebracatPlan(plan: ZebracatPlan, comparisonTable: ZebracatComparisonTable): PricingPlan {
  const id = slugifyPlanName(plan.name);
  const featureItems: Array<{ icon?: string; text: string; badge?: string }> = [];

  // Merge included_summary and comparison_table features
  const summaryFeatures = plan.included_summary || [];
  const comparisonFeatures = extractFeaturesFromComparisonTable(comparisonTable, plan.name);

  // Combine and deduplicate
  const seen = new Set<string>();
  
  // First, add summary features
  for (const feature of summaryFeatures) {
    const normalized = feature.trim();
    if (!normalized) continue;
    const lowerKey = normalized.toLowerCase();
    if (!seen.has(lowerKey)) {
      featureItems.push({ text: normalized, icon: 'check' });
      seen.add(lowerKey);
    }
  }
  
  // Then add comparison features that don't duplicate
  for (const feature of comparisonFeatures) {
    const normalized = feature.trim();
    if (!normalized) continue;
    const lowerKey = normalized.toLowerCase();
    
    // Skip if exact match exists
    if (seen.has(lowerKey)) continue;
    
    // Skip if a similar feature already exists
    const isDuplicate = Array.from(seen).some(existing => {
      const existingLower = existing.toLowerCase();
      if (lowerKey.includes('videos per month') && existingLower.includes('videos/month')) return true;
      if (lowerKey.includes('credits') && existingLower.includes('credits')) return true;
      if (lowerKey.includes('brand kit') && existingLower.includes('brand kit')) return true;
      if (lowerKey.includes('avatar') && existingLower.includes('avatar')) {
        const numMatch1 = lowerKey.match(/\d+/);
        const numMatch2 = existingLower.match(/\d+/);
        if (numMatch1 && numMatch2 && numMatch1[0] === numMatch2[0]) return true;
      }
      return false;
    });
    
    if (!isDuplicate) {
      featureItems.push({ text: normalized, icon: 'check' });
      seen.add(lowerKey);
    }
  }

  // Ensure minimum features (all plans are paid, so minimum 6)
  const minFeatures = 6;
  if (featureItems.length < minFeatures) {
    console.warn(`⚠️  Plan "${plan.name}" has only ${featureItems.length} features (minimum: ${minFeatures})`);
  }

  // Handle pricing
  let price: PricingPlan['price'] | undefined = undefined;
  let unitPriceNote: string | undefined;
  let billingNote: string | undefined;

  if (plan.pricing.type === 'subscription' && plan.pricing.price_variants) {
    const monthlyVariant = plan.pricing.price_variants.find(
      v => !v.note || !v.note.includes('Billed yearly')
    );
    const yearlyVariant = plan.pricing.price_variants.find(
      v => v.note && v.note.includes('Billed yearly')
    );

    if (monthlyVariant && yearlyVariant) {
      price = {
        monthly: {
          amount: monthlyVariant.amount,
          currency: monthlyVariant.currency || 'USD',
          period: monthlyVariant.period || 'month'
        },
        yearly: {
          amount: yearlyVariant.amount,
          currency: yearlyVariant.currency || 'USD',
          period: yearlyVariant.period || 'month'
        }
      };

      if (yearlyVariant.annual_total) {
        const annualTotal = yearlyVariant.annual_total.amount;
        const savePercent = yearlyVariant.annual_total.note.match(/Save (\d+)%/) || [];
        const saveText = savePercent[1] ? `, save ${savePercent[1]}%` : '';
        billingNote = `Billed annually ($${annualTotal}/yr${saveText})`;
      }
    } else if (monthlyVariant) {
      price = {
        monthly: {
          amount: monthlyVariant.amount,
          currency: monthlyVariant.currency || 'USD',
          period: monthlyVariant.period || 'month'
        }
      };
    }
  } else if (plan.pricing.type === 'custom' && plan.pricing.base_monthly) {
    // Enterprise plan with base price
    price = {
      monthly: {
        amount: plan.pricing.base_monthly.amount,
        currency: plan.pricing.base_monthly.currency || 'USD',
        period: plan.pricing.base_monthly.period || 'month'
      }
    };
    unitPriceNote = plan.pricing.label || 'Custom pricing';
    billingNote = plan.pricing.description || 'Starting from';
  } else if (plan.pricing.type === 'custom') {
    // Enterprise plan without base price
    price = {
      monthly: {
        amount: 0,
        currency: 'USD',
        period: 'month'
      }
    };
    unitPriceNote = 'Custom pricing';
    billingNote = plan.pricing.description || plan.pricing.label || 'Custom pricing';
  }

  const result: PricingPlan = {
    name: plan.name,
    id,
    price: price || 'Free',
    featureItems: featureItems.slice(0, 10), // Max 10 features
    ctaText: plan.cta?.label
  };

  if (unitPriceNote) {
    result.unitPriceNote = unitPriceNote;
  }
  if (billingNote) {
    result.billingNote = billingNote;
  }
  if (plan.badge) {
    result.ribbonText = plan.badge;
  }

  return result;
}

function main() {
  const zebracatJsonPath = path.join(process.cwd(), 'src', 'data', 'pricing', 'zebracat.json');
  const toolsJsonPath = path.join(process.cwd(), 'src', 'data', 'tools.json');

  // Read Zebracat JSON
  if (!fs.existsSync(zebracatJsonPath)) {
    console.error(`❌ Zebracat JSON file not found: ${zebracatJsonPath}`);
    console.log('💡 Please create the file with the provided Zebracat JSON data.');
    process.exit(1);
  }

  const zebracatData: ZebracatData = JSON.parse(fs.readFileSync(zebracatJsonPath, 'utf-8'));

  // Read tools.json
  const toolsData = JSON.parse(fs.readFileSync(toolsJsonPath, 'utf-8'));
  const zebracatTool = toolsData.find((t: any) => t.slug === 'zebracat');

  if (!zebracatTool) {
    console.error('❌ Zebracat tool not found in tools.json');
    process.exit(1);
  }

  // Convert plans
  console.log('🔄 Converting Zebracat pricing plans...\n');
  const pricingPlans = zebracatData.plans.map(plan => convertZebracatPlan(plan, zebracatData.comparison_table));

  // Update tools.json
  zebracatTool.pricing_plans = pricingPlans;

  // Write back
  fs.writeFileSync(toolsJsonPath, JSON.stringify(toolsData, null, 2), 'utf-8');

  console.log('✅ Successfully updated tools.json with Zebracat pricing plans:\n');
  pricingPlans.forEach((plan, idx) => {
    console.log(`${idx + 1}. ${plan.name} (id: ${plan.id})`);
    console.log(`   Price: ${typeof plan.price === 'object' ? `$${plan.price.monthly.amount}/mo` : plan.price}`);
    if (typeof plan.price === 'object' && plan.price.yearly) {
      console.log(`   Yearly: $${plan.price.yearly.amount}/mo`);
    }
    console.log(`   Features: ${plan.featureItems.length} items`);
    if (plan.billingNote) {
      console.log(`   Billing: ${plan.billingNote}`);
    }
    if (plan.ribbonText) {
      console.log(`   Badge: ${plan.ribbonText}`);
    }
    console.log('');
  });

  console.log('📝 Run validation: pnpm validate:tools -- --slugs zebracat');
}

try {
  main();
} catch (error: unknown) {
  console.error('❌ Error:', error);
  process.exit(1);
}
