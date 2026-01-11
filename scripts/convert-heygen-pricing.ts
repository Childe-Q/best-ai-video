#!/usr/bin/env tsx

/**
 * Convert HeyGen pricing JSON to tools.json pricing_plans format
 */

import * as fs from 'fs';
import * as path from 'path';

interface HeyGenPlan {
  name: string;
  pricing: {
    monthly?: {
      amount: number;
      currency: string;
      period: string;
      unit?: string;
    };
    yearly?: {
      amount: number;
      currency: string;
      period: string;
      unit?: string;
    };
  };
  unitPriceNote?: string;
  features_included: string[];
  limits?: Array<{
    label: string;
    value: string;
    period: string | null;
    raw?: string;
  }>;
  badges: string[];
  notes?: string[];
  raw_evidence?: {
    price?: string;
    annual_note_from_faq?: string;
  };
}

interface HeyGenData {
  plans: HeyGenPlan[];
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

function extractYearlyPriceFromNotes(notes: string[] | undefined, monthlyAmount: number): number | undefined {
  if (!notes) return undefined;
  
  // Look for annual equivalent notes
  for (const note of notes) {
    // Pattern: "$24/month if you pay annually" or "$24/month" or "Annual equivalent: $24/month"
    const match = note.match(/\$(\d+)\/month/i);
    if (match) {
      const yearlyAmount = parseInt(match[1], 10);
      if (yearlyAmount < monthlyAmount) {
        return yearlyAmount;
      }
    }
    
    // Pattern: "$30/seat/month if you pay annually"
    const seatMatch = note.match(/\$(\d+)\/seat\/month/i);
    if (seatMatch) {
      const yearlyAmount = parseInt(seatMatch[1], 10);
      if (yearlyAmount < monthlyAmount) {
        return yearlyAmount;
      }
    }
  }
  
  return undefined;
}

function calculateAnnualTotal(monthlyAmount: number, yearlyAmount: number): number {
  return yearlyAmount * 12;
}

function convertHeyGenPlan(plan: HeyGenPlan): PricingPlan {
  const id = slugifyPlanName(plan.name);
  const featureItems: Array<{ icon?: string; text: string; badge?: string }> = [];

  // Merge features_included and limits
  const summaryFeatures = plan.features_included || [];
  const limitFeatures: string[] = [];
  
  if (plan.limits) {
    for (const limit of plan.limits) {
      // Skip redundant limits that are already in features_included
      const limitText = limit.raw || `${limit.label}: ${limit.value}`;
      const isDuplicate = summaryFeatures.some(f => 
        f.toLowerCase().includes(limit.label.toLowerCase()) ||
        f.toLowerCase().includes(limit.value.toLowerCase())
      );
      if (!isDuplicate && limit.label !== 'Price per seat') {
        limitFeatures.push(limitText);
      }
    }
  }

  // Combine and deduplicate
  const seen = new Set<string>();
  
  // First, add summary features
  for (const feature of summaryFeatures) {
    const normalized = feature.trim();
    if (!normalized || normalized === 'Everything in Free, plus:' || normalized === 'Everything in Creator, plus:') continue;
    const lowerKey = normalized.toLowerCase();
    if (!seen.has(lowerKey)) {
      featureItems.push({ text: normalized, icon: 'check' });
      seen.add(lowerKey);
    }
  }
  
  // Then add limit features that don't duplicate
  for (const feature of limitFeatures) {
    const normalized = feature.trim();
    if (!normalized) continue;
    const lowerKey = normalized.toLowerCase();
    
    // Skip if exact match exists
    if (seen.has(lowerKey)) continue;
    
    // Skip if a similar feature already exists
    const isDuplicate = Array.from(seen).some(existing => {
      const existingLower = existing.toLowerCase();
      if (lowerKey.includes('duration') && existingLower.includes('duration')) return true;
      if (lowerKey.includes('resolution') && existingLower.includes('resolution')) return true;
      if (lowerKey.includes('seats') && existingLower.includes('seat')) return true;
      return false;
    });
    
    if (!isDuplicate) {
      featureItems.push({ text: normalized, icon: 'check' });
      seen.add(lowerKey);
    }
  }

  // For Enterprise plan, add default features if empty
  if (plan.name === 'Enterprise' && featureItems.length === 0) {
    featureItems.push(
      { text: 'Unlimited videos', icon: 'check' },
      { text: 'Custom video minutes', icon: 'check' },
      { text: 'Unlimited Custom Video Avatars', icon: 'check' },
      { text: 'Unlimited Custom Interactive Avatars', icon: 'check' },
      { text: 'Unlimited Photo Avatars', icon: 'check' },
      { text: 'Unlimited voice clones', icon: 'check' },
      { text: '4K video export', icon: 'check' },
      { text: 'Fastest video processing', icon: 'check' },
      { text: 'Workspace collaboration', icon: 'check' },
      { text: 'Dedicated support', icon: 'check' }
    );
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

  if (plan.pricing.monthly) {
    const monthlyAmount = plan.pricing.monthly.amount;
    const yearlyAmount = extractYearlyPriceFromNotes(plan.notes, monthlyAmount);
    
    if (yearlyAmount !== undefined) {
      price = {
        monthly: {
          amount: monthlyAmount,
          currency: plan.pricing.monthly.currency || 'USD',
          period: plan.pricing.monthly.period || 'month'
        },
        yearly: {
          amount: yearlyAmount,
          currency: plan.pricing.monthly.currency || 'USD',
          period: plan.pricing.monthly.period || 'month'
        }
      };
      
      const annualTotal = calculateAnnualTotal(monthlyAmount, yearlyAmount);
      const savePercent = plan.notes?.some(n => n.includes('Save 22%')) ? '22%' : '';
      const saveText = savePercent ? `, save ${savePercent}` : '';
      billingNote = `Billed annually ($${annualTotal}/yr${saveText})`;
    } else {
      price = {
        monthly: {
          amount: monthlyAmount,
          currency: plan.pricing.monthly.currency || 'USD',
          period: plan.pricing.monthly.period || 'month'
        }
      };
    }
  } else if (plan.unitPriceNote) {
    // Enterprise plan
    price = {
      monthly: {
        amount: 0,
        currency: 'USD',
        period: 'month'
      }
    };
    unitPriceNote = plan.unitPriceNote;
    billingNote = 'Custom pricing';
  }

  const result: PricingPlan = {
    name: plan.name,
    id,
    price: price || 'Free',
    featureItems: featureItems.slice(0, 10), // Max 10 features
    ctaText: plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'
  };

  if (unitPriceNote) {
    result.unitPriceNote = unitPriceNote;
  }
  if (billingNote) {
    result.billingNote = billingNote;
  }
  if (plan.badges && plan.badges.length > 0) {
    result.ribbonText = plan.badges[0];
  }

  return result;
}

function main() {
  const heygenJsonPath = path.join(process.cwd(), 'src', 'data', 'pricing', 'heygen.json');
  const toolsJsonPath = path.join(process.cwd(), 'src', 'data', 'tools.json');

  // Read HeyGen JSON
  if (!fs.existsSync(heygenJsonPath)) {
    console.error(`❌ HeyGen JSON file not found: ${heygenJsonPath}`);
    console.log('💡 Please create the file with the provided HeyGen JSON data.');
    process.exit(1);
  }

  const heygenData: HeyGenData = JSON.parse(fs.readFileSync(heygenJsonPath, 'utf-8'));

  // Read tools.json
  const toolsData = JSON.parse(fs.readFileSync(toolsJsonPath, 'utf-8'));
  const heygenTool = toolsData.find((t: any) => t.slug === 'heygen');

  if (!heygenTool) {
    console.error('❌ HeyGen tool not found in tools.json');
    process.exit(1);
  }

  // Convert plans
  console.log('🔄 Converting HeyGen pricing plans...\n');
  const pricingPlans = heygenData.plans.map(plan => convertHeyGenPlan(plan));

  // Update tools.json
  heygenTool.pricing_plans = pricingPlans;

  // Write back
  fs.writeFileSync(toolsJsonPath, JSON.stringify(toolsData, null, 2), 'utf-8');

  console.log('✅ Successfully updated tools.json with HeyGen pricing plans:\n');
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

  console.log('📝 Run validation: pnpm validate:tools -- --slugs heygen');
}

try {
  main();
} catch (error: unknown) {
  console.error('❌ Error:', error);
  process.exit(1);
}
