#!/usr/bin/env tsx

/**
 * Convert Pika pricing JSON to tools.json pricing_plans format
 */

import * as fs from 'fs';
import * as path from 'path';

interface PikaPlan {
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
      discounted?: boolean;
      original_amount?: number;
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

interface PikaComparisonTable {
  feature_groups: Array<{
    group: string;
    rows: Array<{
      feature: string;
      values_by_plan: Record<string, string | boolean | number>;
    }>;
  }>;
}

interface PikaData {
  plans: PikaPlan[];
  comparison_table: PikaComparisonTable;
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
  comparisonTable: PikaComparisonTable,
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

function convertPikaPlan(plan: PikaPlan, comparisonTable: PikaComparisonTable): PricingPlan {
  const id = slugifyPlanName(plan.name);
  const featureItems: Array<{ icon?: string; text: string; badge?: string }> = [];

  // Merge included_summary and comparison_table features
  const summaryFeatures = plan.included_summary || [];
  const comparisonFeatures = extractFeaturesFromComparisonTable(comparisonTable, plan.name);

  // For Free plan, add default features if needed
  if (plan.name === 'Free' && summaryFeatures.length === 0) {
    summaryFeatures.push(
      '0 monthly video credits',
      'Limited model access',
      'Watermarked videos',
      'Standard processing speed'
    );
  }

  // Combine and deduplicate
  const allFeatures = [...summaryFeatures, ...comparisonFeatures];
  const seen = new Set<string>();

  for (const feature of allFeatures) {
    const normalized = feature.trim();
    if (!normalized) continue;
    
    // Skip if already seen (case-insensitive)
    const lowerKey = normalized.toLowerCase();
    if (seen.has(lowerKey)) continue;
    
    // Skip redundant features (e.g., "Monthly video credits: 80" when we already have "80 monthly video credits")
    const isRedundant = seen.has(lowerKey.replace(/^monthly video credits:\s*/i, '').replace(/\s*monthly video credits$/i, ''));
    if (isRedundant) continue;
    
    // Prefer shorter, more concise features
    const existingSimilar = Array.from(seen).find(s => {
      const sLower = s.toLowerCase();
      const fLower = lowerKey;
      // Check if one contains the other
      return (sLower.includes(fLower) || fLower.includes(sLower)) && Math.abs(sLower.length - fLower.length) > 5;
    });
    if (existingSimilar && normalized.length > existingSimilar.length) {
      continue; // Skip longer version if shorter exists
    }
    
    featureItems.push({ text: normalized, icon: 'check' });
    seen.add(lowerKey);
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
      v => v.note.includes('Pay monthly') || v.note.includes('Original price')
    );
    const yearlyVariant = plan.pricing.price_variants.find(
      v => v.note.includes('Billed yearly')
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

      // Handle Standard LIMITED OFFER
      if (plan.name === 'Standard' && yearlyVariant.discounted && yearlyVariant.original_amount) {
        const annualTotal = yearlyVariant.annual_total?.amount || yearlyVariant.amount * 12;
        billingNote = `Limited offer: $${yearlyVariant.original_amount} → $${yearlyVariant.amount} (billed yearly, $${annualTotal}/yr)`;
      } else if (yearlyVariant.annual_total) {
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
  } else if (plan.pricing.type === 'subscription' && plan.pricing.label === 'Contact for pricing') {
    // Fancy plan
    price = {
      monthly: {
        amount: 0,
        currency: 'USD',
        period: 'month'
      }
    };
    unitPriceNote = 'Contact for pricing';
    billingNote = 'Price not visible';
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
  const pikaJsonPath = path.join(process.cwd(), 'src', 'data', 'pricing', 'pika.json');
  const toolsJsonPath = path.join(process.cwd(), 'src', 'data', 'tools.json');

  // Read Pika JSON
  if (!fs.existsSync(pikaJsonPath)) {
    console.error(`❌ Pika JSON file not found: ${pikaJsonPath}`);
    console.log('💡 Please create the file with the provided Pika JSON data.');
    process.exit(1);
  }

  const pikaData: PikaData = JSON.parse(fs.readFileSync(pikaJsonPath, 'utf-8'));

  // Read tools.json
  const toolsData = JSON.parse(fs.readFileSync(toolsJsonPath, 'utf-8'));
  const pikaTool = toolsData.find((t: any) => t.slug === 'pika');

  if (!pikaTool) {
    console.error('❌ Pika tool not found in tools.json');
    process.exit(1);
  }

  // Convert plans
  console.log('🔄 Converting Pika pricing plans...\n');
  const pricingPlans = pikaData.plans.map(plan => convertPikaPlan(plan, pikaData.comparison_table));

  // Update tools.json
  pikaTool.pricing_plans = pricingPlans;

  // Write back
  fs.writeFileSync(toolsJsonPath, JSON.stringify(toolsData, null, 2), 'utf-8');

  console.log('✅ Successfully updated tools.json with Pika pricing plans:\n');
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
    console.log('');
  });

  console.log('📝 Run validation: pnpm validate:tools -- --slugs pika');
}

try {
  main();
} catch (error: unknown) {
  console.error('❌ Error:', error);
  process.exit(1);
}
