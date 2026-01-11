#!/usr/bin/env tsx

/**
 * Convert VEED.IO pricing JSON to tools.json pricing_plans format
 */

import * as fs from 'fs';
import * as path from 'path';

interface VeedPlan {
  name: string;
  badge: string | null;
  pricing: {
    type: string;
    amount?: number;
    currency?: string;
    period?: string;
    unit?: string;
    billing_options?: string[];
    price_variants?: Array<{
      billing: string;
      amount: number;
      currency: string;
      period: string;
      unit: string;
      note: string;
      annual_total?: {
        amount: number;
        currency: string;
        period: string;
        note: string;
      };
    }>;
    label?: string;
    description?: string;
  };
  included_summary: string[];
  cta: {
    label: string;
  };
}

interface VeedComparisonTable {
  feature_groups: Array<{
    group: string;
    rows: Array<{
      feature: string;
      note?: string;
      values_by_plan: Record<string, string | boolean | number>;
    }>;
  }>;
}

interface VeedData {
  plans: VeedPlan[];
  comparison_table: VeedComparisonTable;
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
  comparisonTable: VeedComparisonTable,
  planName: string
): string[] {
  const features: string[] = [];
  const seen = new Set<string>();
  const planNameLower = planName.toLowerCase();
  const planKey = slugifyPlanName(planName);

  const allRows: Array<{ feature: string; note?: string; values_by_plan: Record<string, string | boolean | number> }> = [];
  
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
        valueStr !== '0'
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

function convertVeedPlan(plan: VeedPlan, comparisonTable: VeedComparisonTable): PricingPlan {
  const id = slugifyPlanName(plan.name);
  const featureItems: Array<{ icon?: string; text: string; badge?: string }> = [];

  // Merge included_summary and comparison_table features
  const summaryFeatures = plan.included_summary || [];
  const comparisonFeatures = extractFeaturesFromComparisonTable(comparisonTable, plan.name);

  // For Free plan, add default features if needed
  if (plan.name === 'Free' && summaryFeatures.length === 0) {
    summaryFeatures.push(
      '2GB storage',
      '1GB upload file size',
      '720p export quality',
      '2 video/day in Gen-AI Studio',
      '2 min/mo auto subtitles',
      'Limited stock audio & video'
    );
  }

  // Combine and deduplicate
  // Prioritize summary features (more detailed), then add comparison features that don't duplicate
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
    
    // Skip if a similar feature already exists (e.g., "Export quality: 1080p" vs "Full HD 1080p Exports")
    const isDuplicate = Array.from(seen).some(existing => {
      const existingLower = existing.toLowerCase();
      // Check if they refer to the same thing
      if (lowerKey.includes('export quality') && existingLower.includes('1080p') && lowerKey.includes('1080p')) return true;
      if (lowerKey.includes('storage') && existingLower.includes('storage')) return true;
      if (lowerKey.includes('gen-ai studio') && existingLower.includes('gen-ai studio')) return true;
      if (lowerKey.includes('upload file') && existingLower.includes('upload')) return true;
      return false;
    });
    
    if (!isDuplicate) {
      featureItems.push({ text: normalized, icon: 'check' });
      seen.add(lowerKey);
    }
  }

  // Ensure minimum features
  const minFeatures = plan.name === 'Free' ? 4 : 6;
  if (featureItems.length < minFeatures) {
    console.warn(`⚠️  Plan "${plan.name}" has only ${featureItems.length} features (minimum: ${minFeatures})`);
  }

  // Handle pricing
  let price: PricingPlan['price'] | undefined = undefined;
  let unitPriceNote: string | undefined;
  let billingNote: string | undefined;

  if (plan.pricing.type === 'free') {
    price = {
      monthly: {
        amount: 0,
        currency: 'USD',
        period: 'month'
      }
    };
  } else if (plan.pricing.type === 'subscription' && plan.pricing.price_variants) {
    const monthlyVariant = plan.pricing.price_variants.find(
      v => v.note.includes('Billed Monthly') || v.note.includes('Pay monthly')
    );
    const yearlyVariant = plan.pricing.price_variants.find(
      v => v.note.includes('Billed Yearly')
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
        billingNote = `Billed annually ($${annualTotal}/yr)`;
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
  } else if (plan.pricing.type === 'custom' && plan.pricing.label === 'Custom pricing') {
    // Enterprise plan
    price = {
      monthly: {
        amount: 0,
        currency: 'USD',
        period: 'month'
      }
    };
    unitPriceNote = 'Custom pricing';
    billingNote = 'Tailored to your needs';
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
  const veedJsonPath = path.join(process.cwd(), 'src', 'data', 'pricing', 'veed-io.json');
  const toolsJsonPath = path.join(process.cwd(), 'src', 'data', 'tools.json');

  // Read Veed JSON
  if (!fs.existsSync(veedJsonPath)) {
    console.error(`❌ Veed JSON file not found: ${veedJsonPath}`);
    console.log('💡 Please create the file with the provided Veed JSON data.');
    process.exit(1);
  }

  const veedData: VeedData = JSON.parse(fs.readFileSync(veedJsonPath, 'utf-8'));

  // Read tools.json
  const toolsData = JSON.parse(fs.readFileSync(toolsJsonPath, 'utf-8'));
  const veedTool = toolsData.find((t: any) => t.slug === 'veed-io');

  if (!veedTool) {
    console.error('❌ Veed-io tool not found in tools.json');
    process.exit(1);
  }

  // Convert plans
  console.log('🔄 Converting VEED.IO pricing plans...\n');
  const pricingPlans = veedData.plans.map(plan => convertVeedPlan(plan, veedData.comparison_table));

  // Update tools.json
  veedTool.pricing_plans = pricingPlans;

  // Write back
  fs.writeFileSync(toolsJsonPath, JSON.stringify(toolsData, null, 2), 'utf-8');

  console.log('✅ Successfully updated tools.json with VEED.IO pricing plans:\n');
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

  console.log('📝 Run validation: pnpm validate:tools -- --slugs veed-io');
}

try {
  main();
} catch (error: unknown) {
  console.error('❌ Error:', error);
  process.exit(1);
}
