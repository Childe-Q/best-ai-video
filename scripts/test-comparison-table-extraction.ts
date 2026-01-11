#!/usr/bin/env node

/**
 * Test comparison_table feature extraction
 */

import * as fs from 'fs';
import * as path from 'path';
import { ComparisonTable } from '../src/types/tool';

function slugifyPlanName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractFeaturesFromComparisonTable(
  comparisonTable: ComparisonTable | undefined,
  planName: string,
  planId?: string
): Array<{ icon?: string; text: string; badge?: string }> {
  if (!comparisonTable) return [];

  const planKey = planId 
    ? planId.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    : slugifyPlanName(planName);
  
  const planNameLower = planName.toLowerCase();
  
  const features: string[] = [];
  const seen = new Set<string>();

  const allRows: Array<{ feature: string; label?: string; values_by_plan?: Record<string, string | boolean | number> }> = [];
  
  if (comparisonTable.feature_groups) {
    comparisonTable.feature_groups.forEach(group => {
      if (group.rows) {
        allRows.push(...group.rows);
      }
    });
  } else if (comparisonTable.rows) {
    allRows.push(...comparisonTable.rows);
  }

  console.log(`\n  Plan: "${planName}" (id: ${planId || 'none'}, key: "${planKey}")`);
  console.log(`  Total rows: ${allRows.length}`);

  for (const row of allRows) {
    const featureLabel = row.label || row.feature;
    if (!featureLabel) continue;

    const valuesByPlan = row.values_by_plan;
    if (!valuesByPlan) continue;

    let planValue: string | boolean | number | undefined;
    
    const keysToTry = [
      planKey,
      planNameLower,
      planName,
      planId?.toLowerCase(),
    ].filter(Boolean) as string[];

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
      const featureText = featureLabel;
      if (!seen.has(featureText)) {
        features.push(featureText);
        seen.add(featureText);
        console.log(`    ✓ ${featureText} (boolean true)`);
      }
    }
    else if (typeof planValue === 'string' || typeof planValue === 'number') {
      const valueStr = String(planValue).trim();
      if (
        valueStr &&
        valueStr !== '-' &&
        valueStr !== '—' &&
        valueStr.toLowerCase() !== 'no' &&
        valueStr.toLowerCase() !== 'false' &&
        valueStr.toLowerCase() !== 'n/a'
      ) {
        const featureText = valueStr === 'true' || valueStr === 'yes'
          ? featureLabel
          : `${featureLabel}: ${valueStr}`;
        
        if (!seen.has(featureText)) {
          features.push(featureText);
          seen.add(featureText);
          console.log(`    ✓ ${featureText} (value: ${valueStr})`);
        }
      }
    }

    if (features.length >= 6) break;
  }

  return features.map(text => ({ text }));
}

function main() {
  const slug = process.argv[2] || 'heygen';
  const pricingJsonPath = path.join(process.cwd(), 'src', 'data', 'pricing', `${slug}.json`);
  
  if (!fs.existsSync(pricingJsonPath)) {
    console.error(`❌ Pricing JSON file not found: ${pricingJsonPath}`);
    process.exit(1);
  }

  const pricingData = JSON.parse(fs.readFileSync(pricingJsonPath, 'utf-8'));
  const comparisonTable = pricingData.comparison_table;
  
  if (!comparisonTable) {
    console.error(`❌ No comparison_table found in ${slug}.json`);
    process.exit(1);
  }

  console.log(`\n🔍 Testing comparison_table extraction for ${slug}`);
  console.log(`📄 File: ${pricingJsonPath}`);
  console.log(`📊 Plans in JSON: ${pricingData.plans?.map((p: any) => p.name).join(', ')}`);

  if (comparisonTable.feature_groups) {
    console.log(`\n📋 Feature groups: ${comparisonTable.feature_groups.length}`);
    comparisonTable.feature_groups.forEach((group: any, idx: number) => {
      console.log(`  Group ${idx + 1}: "${group.group}" (${group.rows?.length || 0} rows)`);
    });
  }

  // Test extraction for each plan
  if (pricingData.plans) {
    pricingData.plans.forEach((plan: any) => {
      const features = extractFeaturesFromComparisonTable(
        comparisonTable,
        plan.name,
        plan.id
      );
      console.log(`\n✅ Extracted ${features.length} features for "${plan.name}":`);
      features.forEach((f, idx) => {
        console.log(`  ${idx + 1}. ${f.text}`);
      });
    });
  }
}

try {
  main();
} catch (error: unknown) {
  console.error('Error:', error);
  process.exit(1);
}
