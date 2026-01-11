#!/usr/bin/env node

/**
 * Validate pricing JSON files
 * 
 * Checks:
 * 1. Valid JSON syntax
 * 2. Plans contain name + pricing
 * 3. Pricing structure consistency (period/currency/seat/price_variants)
 * 4. Output validation report
 * 5. Auto-fix fixable issues
 */

import * as fs from 'fs';
import * as path from 'path';

interface PriceVariant {
  billing: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  period: string;
  unit?: string;
  note?: string;
  annual_total?: {
    amount: number;
    currency: string;
    period: string;
    note?: string;
  };
  discounted?: boolean;
  original_amount?: number;
}

interface Pricing {
  type: 'free' | 'subscription' | 'custom';
  amount?: number;
  currency?: string;
  period?: string;
  unit?: string;
  label?: string;
  description?: string;
  billing_options?: string[];
  price_variants?: PriceVariant[];
  seats_included?: number;
}

interface Plan {
  name: string;
  badge?: string | null;
  pricing: Pricing;
  included_summary?: string[];
  cta?: {
    label: string;
    alt_labels?: string[];
  };
}

interface PricingData {
  tool: string;
  page_title?: string;
  plans: Plan[];
  comparison_table?: any;
  add_ons?: any;
  faq?: any;
  data_quality_notes?: string[];
}

interface ValidationIssue {
  file: string;
  severity: 'error' | 'warning';
  field?: string;
  message: string;
  fixable: boolean;
  fix?: () => any;
}

function normalizePricing(pricing: any): Pricing {
  if (!pricing || typeof pricing !== 'object') {
    return {
      type: 'custom',
      label: 'Custom pricing',
      description: 'Pricing information not available',
    };
  }

  const normalized: Pricing = {
    type: pricing.type || 'subscription',
  };

  // Handle free plans
  if (pricing.type === 'free' || pricing.amount === 0) {
    normalized.type = 'free';
    normalized.amount = 0;
    normalized.currency = pricing.currency || 'USD';
    normalized.period = pricing.period || 'month';
    normalized.unit = pricing.unit || 'account';
    return normalized;
  }

  // Handle custom pricing
  if (pricing.type === 'custom' || pricing.label || pricing.description) {
    normalized.type = 'custom';
    normalized.label = pricing.label || pricing.unitPriceNote || 'Custom pricing';
    normalized.description = pricing.description || '';
    return normalized;
  }

  // Handle subscription with price_variants
  if (pricing.price_variants && Array.isArray(pricing.price_variants)) {
    normalized.type = 'subscription';
    normalized.billing_options = pricing.billing_options || ['Monthly', 'Yearly'];
    normalized.unit = pricing.unit || 'account';
    normalized.price_variants = pricing.price_variants.map((variant: any) => ({
      billing: variant.billing || (variant.note?.toLowerCase().includes('yearly') ? 'yearly' : 'monthly'),
      amount: variant.amount,
      currency: variant.currency || 'USD',
      period: variant.period || 'month',
      unit: variant.unit || pricing.unit || 'account',
      note: variant.note,
      annual_total: variant.annual_total,
      discounted: variant.discounted,
      original_amount: variant.original_amount,
    }));
    normalized.seats_included = pricing.seats_included;
    return normalized;
  }

  // Handle simple monthly/yearly pricing
  if (pricing.monthly || pricing.yearly) {
    normalized.type = 'subscription';
    normalized.billing_options = [];
    normalized.unit = pricing.unit || 'account';
    normalized.price_variants = [];

    if (pricing.monthly) {
      const monthly = Array.isArray(pricing.monthly) ? pricing.monthly[0] : pricing.monthly;
      normalized.billing_options.push('Monthly');
      normalized.price_variants!.push({
        billing: 'monthly',
        amount: monthly.amount,
        currency: monthly.currency || 'USD',
        period: monthly.period || 'month',
        unit: monthly.unit || pricing.unit || 'account',
        note: monthly.context || monthly.note,
      });
    }

    if (pricing.yearly || pricing.yearly_effective_monthly) {
      const yearly = pricing.yearly_effective_monthly || pricing.yearly;
      const yearlyData = Array.isArray(yearly) ? yearly[0] : yearly;
      normalized.billing_options.push('Yearly');
      normalized.price_variants!.push({
        billing: 'yearly',
        amount: yearlyData.amount,
        currency: yearlyData.currency || 'USD',
        period: yearlyData.period || 'month',
        unit: yearlyData.unit || pricing.unit || 'account',
        note: yearlyData.context || yearlyData.note || 'Billed yearly',
        annual_total: pricing.yearly_total || {
          amount: yearlyData.amount * 12,
          currency: yearlyData.currency || 'USD',
          period: 'year',
        },
      });
    }

    normalized.seats_included = pricing.seats_included;
    return normalized;
  }

  // Fallback: try to extract from existing structure
  normalized.type = 'subscription';
  normalized.amount = pricing.amount;
  normalized.currency = pricing.currency || 'USD';
  normalized.period = pricing.period || 'month';
  normalized.unit = pricing.unit || 'account';
  return normalized;
}

function validatePlan(plan: any, planIndex: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check name
  if (!plan.name || typeof plan.name !== 'string') {
    issues.push({
      file: '',
      severity: 'error',
      field: `plans[${planIndex}].name`,
      message: 'Missing or invalid plan name',
      fixable: false,
    });
  }

  // Check pricing
  if (!plan.pricing) {
    issues.push({
      file: '',
      severity: 'error',
      field: `plans[${planIndex}].pricing`,
      message: 'Missing pricing field',
      fixable: false,
    });
    return issues;
  }

  // Validate pricing structure
  const pricing = plan.pricing;
  
  if (!pricing.type && !pricing.amount && !pricing.price_variants && !pricing.monthly) {
    issues.push({
      file: '',
      severity: 'error',
      field: `plans[${planIndex}].pricing`,
      message: 'Pricing structure is incomplete (missing type, amount, price_variants, or monthly)',
      fixable: false,
    });
  }

  // Check price_variants structure if present
  if (pricing.price_variants && Array.isArray(pricing.price_variants)) {
    pricing.price_variants.forEach((variant: any, vIndex: number) => {
      if (!variant.amount && variant.amount !== 0) {
        issues.push({
          file: '',
          severity: 'error',
          field: `plans[${planIndex}].pricing.price_variants[${vIndex}].amount`,
          message: 'Missing amount in price_variant',
          fixable: false,
        });
      }
      if (!variant.currency) {
        issues.push({
          file: '',
          severity: 'warning',
          field: `plans[${planIndex}].pricing.price_variants[${vIndex}].currency`,
          message: 'Missing currency, defaulting to USD',
          fixable: true,
          fix: () => ({ currency: 'USD' }),
        });
      }
      if (!variant.period) {
        issues.push({
          file: '',
          severity: 'warning',
          field: `plans[${planIndex}].pricing.price_variants[${vIndex}].period`,
          message: 'Missing period, defaulting to month',
          fixable: true,
          fix: () => ({ period: 'month' }),
        });
      }
    });
  }

  return issues;
}

function validateFile(filePath: string): {
  valid: boolean;
  data: PricingData | null;
  issues: ValidationIssue[];
  fixed: boolean;
  fixedData: PricingData | null;
} {
  const issues: ValidationIssue[] = [];
  let data: PricingData | null = null;
  let fixedData: PricingData | null = null;
  let fixed = false;

  // 1. Check if file exists and is valid JSON
  if (!fs.existsSync(filePath)) {
    return {
      valid: false,
      data: null,
      issues: [{
        file: filePath,
        severity: 'error',
        message: 'File does not exist',
        fixable: false,
      }],
      fixed: false,
      fixedData: null,
    };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    data = JSON.parse(content);
  } catch (error: any) {
    return {
      valid: false,
      data: null,
      issues: [{
        file: filePath,
        severity: 'error',
        message: `Invalid JSON: ${error.message}`,
        fixable: false,
      }],
      fixed: false,
      fixedData: null,
    };
  }

  // 2. Check required top-level fields
  if (!data) {
    return { valid: false, data: null, issues, fixed: false, fixedData: null };
  }

  if (!data.tool) {
    issues.push({
      file: filePath,
      severity: 'error',
      field: 'tool',
      message: 'Missing tool name',
      fixable: false,
    });
  }

  if (!data.plans || !Array.isArray(data.plans)) {
    issues.push({
      file: filePath,
      severity: 'error',
      field: 'plans',
      message: 'Missing or invalid plans array',
      fixable: false,
    });
    return { valid: false, data, issues, fixed: false, fixedData: null };
  }

  // 3. Validate each plan
  const planIssues: ValidationIssue[] = [];
  const fixedPlans: Plan[] = [];

  data.plans.forEach((plan: any, index: number) => {
    const planIssuesForPlan = validatePlan(plan, index);
    planIssuesForPlan.forEach(issue => {
      issue.file = filePath;
      planIssues.push(issue);
    });

    // Normalize pricing
    const normalizedPlan: Plan = {
      name: plan.name,
      badge: plan.badge !== undefined ? plan.badge : null,
      pricing: normalizePricing(plan.pricing),
      included_summary: plan.included_summary || plan.features_included || [],
      cta: plan.cta || { label: 'Get started' },
    };

    // Check if normalization changed anything
    const originalPricingStr = JSON.stringify(plan.pricing);
    const normalizedPricingStr = JSON.stringify(normalizedPlan.pricing);
    if (originalPricingStr !== normalizedPricingStr) {
      fixed = true;
    }

    fixedPlans.push(normalizedPlan);
  });

  issues.push(...planIssues);

  // 4. Create fixed data
  if (fixed || planIssues.some(i => i.fixable)) {
    fixedData = {
      ...data,
      plans: fixedPlans,
    };
  }

  return {
    valid: issues.filter(i => i.severity === 'error').length === 0,
    data,
    issues,
    fixed: fixed || planIssues.some(i => i.fixable),
    fixedData: fixedData || data,
  };
}

function main() {
  const pricingDir = path.join(process.cwd(), 'src', 'data', 'pricing');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(pricingDir)) {
    console.log(`📁 Creating directory: ${pricingDir}`);
    fs.mkdirSync(pricingDir, { recursive: true });
  }

  const files = fs.readdirSync(pricingDir)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(pricingDir, f));

  if (files.length === 0) {
    console.log(`⚠ No JSON files found in ${pricingDir}`);
    console.log(`\n💡 Tip: Create pricing JSON files like elai-io.json, zebracat.json, etc.`);
    return;
  }

  console.log(`🔍 Validating ${files.length} pricing JSON file(s)...\n`);

  const results = files.map(file => validateFile(file));
  const allIssues: ValidationIssue[] = [];
  const filesToFix: Array<{ path: string; data: PricingData }> = [];

  results.forEach((result, index) => {
    const fileName = path.basename(files[index]);
    allIssues.push(...result.issues);

    if (result.fixed && result.fixedData) {
      filesToFix.push({
        path: files[index],
        data: result.fixedData,
      });
    }
  });

  // Print report
  console.log('='.repeat(100));
  console.log('📊 VALIDATION REPORT');
  console.log('='.repeat(100));
  console.log(
    `${'File'.padEnd(30)} | ${'Valid'.padEnd(6)} | ${'Errors'.padEnd(6)} | ${'Warnings'.padEnd(8)} | ${'Fixed'.padEnd(6)}`
  );
  console.log('-'.repeat(100));

  results.forEach((result, index) => {
    const fileName = path.basename(files[index]);
    const errors = result.issues.filter(i => i.severity === 'error').length;
    const warnings = result.issues.filter(i => i.severity === 'warning').length;
    const validStr = result.valid ? '✓ YES' : '✗ NO';
    const fixedStr = result.fixed ? '✓ YES' : '✗ NO';

    console.log(
      `${fileName.padEnd(30)} | ${validStr.padEnd(6)} | ${String(errors).padEnd(6)} | ${String(warnings).padEnd(8)} | ${fixedStr.padEnd(6)}`
    );

    // Print issues
    if (result.issues.length > 0) {
      result.issues.forEach(issue => {
        const icon = issue.severity === 'error' ? '❌' : '⚠️';
        const fieldStr = issue.field ? ` [${issue.field}]` : '';
        console.log(`  ${icon} ${issue.message}${fieldStr}`);
      });
    }
  });

  console.log('='.repeat(100));
  console.log(`\n📈 Summary:`);
  console.log(`  Total files: ${files.length}`);
  console.log(`  Valid: ${results.filter(r => r.valid).length}`);
  console.log(`  Invalid: ${results.filter(r => !r.valid).length}`);
  console.log(`  Total errors: ${allIssues.filter(i => i.severity === 'error').length}`);
  console.log(`  Total warnings: ${allIssues.filter(i => i.severity === 'warning').length}`);
  console.log(`  Files to fix: ${filesToFix.length}`);

  // Auto-fix files
  if (filesToFix.length > 0) {
    console.log(`\n🔧 Auto-fixing ${filesToFix.length} file(s)...`);
    
    filesToFix.forEach(({ path: filePath, data }) => {
      const backupPath = filePath + '.backup';
      const originalContent = fs.readFileSync(filePath, 'utf-8');
      
      // Create backup
      fs.writeFileSync(backupPath, originalContent);
      console.log(`  ✓ Backup created: ${path.basename(backupPath)}`);
      
      // Write fixed data
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
      console.log(`  ✓ Fixed: ${path.basename(filePath)}`);
      
      // Show diff summary
      const original = JSON.parse(originalContent);
      const fixed = data;
      
      console.log(`  📋 Changes:`);
      fixed.plans.forEach((plan: Plan, index: number) => {
        const origPlan = original.plans[index];
        if (origPlan && JSON.stringify(origPlan.pricing) !== JSON.stringify(plan.pricing)) {
          console.log(`    - ${plan.name}: Pricing structure normalized`);
        }
      });
    });
    
    console.log(`\n✅ Auto-fix complete!`);
  }

  // Exit with error code if there are errors
  const hasErrors = allIssues.some(i => i.severity === 'error');
  process.exit(hasErrors ? 1 : 0);
}

try {
  main();
} catch (error: unknown) {
  console.error('Error:', error);
  process.exit(1);
}
