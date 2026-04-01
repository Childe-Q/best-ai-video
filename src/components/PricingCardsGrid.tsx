'use client';

import { useState } from 'react';
import { PricingPlan, ComparisonTable } from '@/types/tool';
import PricingCard from './PricingCard';
import CTAButton from './CTAButton';
import { isExplicitContactSalesPlan, isExplicitFreePlan } from '@/lib/pricing/display';
import { getPlanReactKey } from '@/lib/pricing/planKey';
import { getPricingCardCtaLabel, getPricingCardCtaVariant } from '@/lib/pricing/cta';

interface PricingCardsGridProps {
  plans: PricingPlan[];
  affiliateLink: string;
  hasFreeTrial: boolean;
  toolSlug?: string;
  comparisonTable?: ComparisonTable;
  externalBilling?: 'monthly' | 'yearly';
}

function getIsPopular(plan: PricingPlan, index: number): boolean {
  const badgeText = (plan as any).ribbonText || plan.badge || '';
  return (
    badgeText.includes('Popular') ||
    badgeText.includes('Best Value') ||
    plan.name.includes('Standard') ||
    index === 1
  );
}

function isSecondaryEnterprisePlan(plan: PricingPlan): boolean {
  return isExplicitContactSalesPlan(plan);
}

function getGridClassForCount(count: number): string {
  if (count <= 1) return 'grid grid-cols-1 gap-6';
  if (count === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-6';
  if (count === 3) return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6';
  return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6';
}

type PricingLayout =
  | { type: 'single'; rows: PricingPlan[][]; secondary: PricingPlan[] }
  | { type: 'split'; rows: PricingPlan[][]; secondary: PricingPlan[] };

function buildPricingLayout(plans: PricingPlan[]): PricingLayout {
  if (plans.length <= 4) {
    return { type: 'single', rows: [plans], secondary: [] };
  }

  if (plans.length === 5) {
    const enterprisePlan = plans.find(isSecondaryEnterprisePlan);
    if (enterprisePlan) {
      return {
        type: 'split',
        rows: [plans.filter((plan) => plan !== enterprisePlan)],
        secondary: [enterprisePlan],
      };
    }

    return {
      type: 'split',
      rows: [plans.slice(0, 4)],
      secondary: [plans[4]].filter(Boolean) as PricingPlan[],
    };
  }

  return {
    type: 'split',
    rows: [plans.slice(0, 3), plans.slice(3)],
    secondary: [],
  };
}

function renderPlanRow(
  row: PricingPlan[],
  plans: PricingPlan[],
  affiliateLink: string,
  hasFreeTrial: boolean,
  billing: 'monthly' | 'yearly',
  toolSlug: string | undefined,
  comparisonTable: ComparisonTable | undefined,
  rowIndex: number,
) {
  const isTwoCardRow = row.length === 2;
  const containerClass = isTwoCardRow
    ? 'mx-auto grid w-full max-w-3xl grid-cols-1 md:grid-cols-2 gap-6'
    : getGridClassForCount(row.length);

  return (
    <div key={`row-${rowIndex}`} className={containerClass}>
      {row.map((plan, index) => {
        const originalIndex = plans.indexOf(plan);
        return (
          <PricingCard
            key={getPlanReactKey(plan, originalIndex >= 0 ? originalIndex : rowIndex * 10 + index, `pricing-row-${rowIndex}`)}
            plan={plan}
            isPopular={getIsPopular(plan, originalIndex)}
            affiliateLink={affiliateLink}
            isAnnual={billing === 'yearly'}
            hasFreeTrial={hasFreeTrial}
            previousPlanName={index > 0 ? row[index - 1]?.name : undefined}
            toolSlug={toolSlug}
            comparisonTable={comparisonTable}
          />
        );
      })}
    </div>
  );
}

function getFeatureRows(plan: PricingPlan): string[] {
  const featureItems = plan.featureItems?.map((item) => item.text).filter(Boolean) || [];
  const features = plan.features?.filter(Boolean) || [];
  return [...featureItems, ...features].filter(Boolean).slice(0, 3);
}

function normalizeSecondaryText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeSecondaryText(text: string): string[] {
  return normalizeSecondaryText(text)
    .split(' ')
    .filter(Boolean)
    .filter((token) => !['and', 'the', 'for', 'with', 'your', 'plan'].includes(token));
}

function isSubsetTokens(a: string[], b: string[]): boolean {
  return a.length > 0 && a.every((token) => b.includes(token));
}

function isGenericCustomMessage(text: string): boolean {
  const normalized = normalizeSecondaryText(text);
  return (
    normalized === 'custom' ||
    normalized === 'custom pricing' ||
    normalized === 'contact sales' ||
    normalized === 'contact us' ||
    normalized === 'let s talk' ||
    normalized === 'lets talk'
  );
}

function dedupeSecondaryLines(lines: string[]): string[] {
  const cleaned = lines
    .map((line) => line.trim())
    .filter(Boolean);

  const deduped: string[] = [];

  for (const line of cleaned) {
    const lineTokens = tokenizeSecondaryText(line);
    const existingIndex = deduped.findIndex((existing) => {
      const existingTokens = tokenizeSecondaryText(existing);
      return (
        normalizeSecondaryText(existing) === normalizeSecondaryText(line) ||
        isSubsetTokens(existingTokens, lineTokens) ||
        isSubsetTokens(lineTokens, existingTokens)
      );
    });

    if (existingIndex === -1) {
      deduped.push(line);
      continue;
    }

    const existing = deduped[existingIndex];
    const existingTokens = tokenizeSecondaryText(existing);
    if (lineTokens.length > existingTokens.length) {
      deduped[existingIndex] = line;
    }
  }

  return deduped;
}

function getEnterpriseThemes(plan: PricingPlan): {
  hasScale: boolean;
  hasControl: boolean;
  hasGovernance: boolean;
  hasSupport: boolean;
} {
  const text = [
    plan.description,
    ...(plan.highlights || []),
    ...(plan.featureItems?.map((item) => item.text) || []),
    ...(plan.features || []),
    plan.unitPriceNote,
    plan.billingNote,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return {
    hasScale:
      /custom|volume|usage|credits|minutes|seats|workspace|scale|rollout|team/.test(text),
    hasControl:
      /admin|workspace|roles|permissions|team|manager|centralized|seat/.test(text),
    hasGovernance:
      /security|governance|compliance|sso|saml|scim|audit|procurement|invoice/.test(text),
    hasSupport:
      /support|onboarding|dedicated|success|account manager|invoice|api|sla/.test(text),
  };
}

function getEnterprisePositioning(plan: PricingPlan): string {
  const themes = getEnterpriseThemes(plan);
  if (themes.hasGovernance && themes.hasSupport) {
    return 'For scaled rollout, governance, and dedicated support.';
  }
  if (themes.hasControl && themes.hasSupport) {
    return 'For scale, admin control, and rollout support.';
  }
  if (themes.hasGovernance) {
    return 'For larger teams that need control and governance.';
  }
  return 'For larger teams that need scale, control, and support.';
}

function getEnterprisePricingNote(plan: PricingPlan): string {
  const themes = getEnterpriseThemes(plan);
  if (themes.hasGovernance && themes.hasSupport) {
    return 'Talk to sales for custom volume, admin controls, security review, and rollout support.';
  }
  if (themes.hasControl) {
    return 'Talk to sales for custom volume, admin controls, and team rollout support.';
  }
  return 'Talk to sales for custom volume, onboarding, and centralized team setup.';
}

function scoreEnterpriseBullet(text: string): number {
  const normalized = normalizeSecondaryText(text);
  if (!normalized) return -100;

  let score = 0;

  if (/custom|volume|usage|credits|minutes|api/.test(normalized)) score += 6;
  if (/team|workspace|admin|roles|permissions|seat|manager/.test(normalized)) score += 7;
  if (/security|sso|saml|scim|compliance|governance|audit|centralized/.test(normalized)) score += 8;
  if (/support|onboarding|dedicated|success|invoice|sla/.test(normalized)) score += 7;

  if (/4k|1080p|templates|avatars|voices|watermark|exports|stock|subtitle/.test(normalized)) score -= 5;
  if (/everything in|all features|most popular|best value/.test(normalized)) score -= 10;
  if (isGenericCustomMessage(text)) score -= 10;

  return score;
}

function getEnterpriseSummaryBullets(plan: PricingPlan): string[] {
  const candidates = dedupeSecondaryLines(
    [
      ...(plan.highlights || []),
      ...(plan.featureItems?.map((item) => item.text) || []),
      ...(plan.features || []),
    ].filter(Boolean) as string[],
  )
    .filter((line) => !isGenericCustomMessage(line))
    .map((line) => ({ line, score: scoreEnterpriseBullet(line) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.line.length - a.line.length);

  const selected: string[] = [];
  for (const candidate of candidates) {
    const duplicate = selected.some((existing) => {
      const existingTokens = tokenizeSecondaryText(existing);
      const candidateTokens = tokenizeSecondaryText(candidate.line);
      return (
        isSubsetTokens(existingTokens, candidateTokens) ||
        isSubsetTokens(candidateTokens, existingTokens)
      );
    });

    if (!duplicate) {
      selected.push(candidate.line);
    }

    if (selected.length === 4) break;
  }

  return selected.slice(0, 4);
}

function getUniqueLines(lines: Array<string | null | undefined>): string[] {
  const filtered = lines.filter((item): item is string => Boolean(item?.trim()));
  return filtered.filter((line, index) => filtered.indexOf(line) === index);
}

function getPlanPriceSummary(plan: PricingPlan, billing: 'monthly' | 'yearly'): {
  eyebrow: string;
  price: string;
  unit: string;
  notes: string[];
} {
  const isContactSales = isExplicitContactSalesPlan(plan);
  const isFreePlan = isExplicitFreePlan(plan);
  const price = plan.price;
  const notes = getUniqueLines([
    billing === 'yearly' ? plan.yearlyBillingLabel : plan.monthlyBillingLabel,
    billing === 'yearly' ? plan.yearlyTotalPrice && `Yearly total: ${plan.yearlyTotalPrice}` : null,
    billing === 'yearly' ? plan.annualNote : null,
    plan.unitPriceNote,
    plan.billingNote,
  ]);

  if (isContactSales) {
    return {
      eyebrow: 'Custom route',
      price: 'Custom pricing',
      unit: '',
      notes,
    };
  }

  if (isFreePlan) {
    return {
      eyebrow: 'Free access',
      price: 'Free',
      unit: '',
      notes,
    };
  }

  const explicitPrice = billing === 'yearly'
    ? plan.yearlyPriceDisplay || plan.monthlyPriceDisplay
    : plan.monthlyPriceDisplay || plan.yearlyPriceDisplay;
  const explicitUnit = billing === 'yearly'
    ? plan.yearlyDisplayUnit || plan.monthlyDisplayUnit
    : plan.monthlyDisplayUnit || plan.yearlyDisplayUnit;

  if (explicitPrice) {
    return {
      eyebrow: billing === 'yearly' ? 'Yearly billing' : 'Monthly billing',
      price: explicitPrice,
      unit: explicitUnit || '',
      notes,
    };
  }

  if (typeof price === 'string') {
    return {
      eyebrow: 'Pricing',
      price,
      unit: '',
      notes,
    };
  }

  if (price && typeof price === 'object') {
    if ('monthly' in price) {
      const candidate = billing === 'yearly' && price.yearly ? price.yearly : price.monthly;
      if (typeof candidate === 'object' && candidate && 'amount' in candidate) {
        return {
          eyebrow: billing === 'yearly' ? 'Yearly billing' : 'Monthly billing',
          price: candidate.amount === 0 ? 'Free' : `$${candidate.amount}`,
          unit: candidate.amount === 0 ? '' : candidate.period === 'year' ? '/yr' : '/mo',
          notes,
        };
      }
      if (typeof candidate === 'string') {
        return {
          eyebrow: billing === 'yearly' ? 'Yearly billing' : 'Monthly billing',
          price: candidate,
          unit: '',
          notes,
        };
      }
    }

    if ('amount' in price) {
      return {
        eyebrow: price.period === 'year' ? 'Yearly billing' : 'Monthly billing',
        price: price.amount === 0 ? 'Free' : `$${price.amount}`,
        unit: price.amount === 0 ? '' : price.period === 'year' ? '/yr' : '/mo',
        notes,
      };
    }
  }

  return {
    eyebrow: 'Pricing',
    price: 'Contact sales',
    unit: '',
    notes,
  };
}

function renderSecondaryPlan(
  plan: PricingPlan,
  affiliateLink: string,
  hasFreeTrial: boolean,
  billing: 'monthly' | 'yearly',
) {
  const summary = getPlanPriceSummary(plan, billing);
  const featureRows = dedupeSecondaryLines(
    getFeatureRows(plan).filter((line) => !isGenericCustomMessage(line)),
  ).slice(0, 4);
  const isContactSales = isExplicitContactSalesPlan(plan);
  const secondaryNotes = dedupeSecondaryLines(
    summary.notes.filter((line) => {
      const normalized = normalizeSecondaryText(line);
      if (!normalized) return false;
      if (isGenericCustomMessage(line)) return false;
      if (normalizeSecondaryText(summary.price) === normalized) return false;
      if (plan.ctaText && normalizeSecondaryText(plan.ctaText) === normalized) return false;
      return true;
    }),
  ).slice(0, 2);
  const ctaText = getPricingCardCtaLabel(plan);
  const ctaVariant = getPricingCardCtaVariant(plan);

  if (isContactSales) {
    const enterpriseBullets = getEnterpriseSummaryBullets(plan);
    const enterprisePositioning = getEnterprisePositioning(plan);
    const enterprisePricingNote = getEnterprisePricingNote(plan);

    return (
      <div className="rounded-[28px] border-2 border-black bg-[#F7F7F3] p-6 shadow-[6px_6px_0px_0px_#111111] md:p-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-start">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
              Secondary pricing option
            </p>
            <div className="mt-3">
              <h3 className="text-3xl font-black tracking-tight text-black">{plan.name}</h3>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-gray-600">
                {enterprisePositioning}
              </p>
            </div>

            <div className="mt-6 border-t border-black/10 pt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">Pricing</p>
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <span className="text-4xl font-black leading-none tracking-tight text-black">{summary.price}</span>
              </div>
              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-gray-600">
                {enterprisePricingNote}
              </p>
            </div>
          </div>

          <div className="flex h-full flex-col justify-between rounded-2xl border border-black/10 bg-white px-5 py-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">
                Enterprise highlights
              </p>
              {enterpriseBullets.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {enterpriseBullets.map((feature) => (
                    <li key={feature} className="text-sm font-medium leading-6 text-gray-700">
                      {feature}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm font-medium leading-6 text-gray-600">
                  Use this route for custom volume, team controls, procurement, and rollout support.
                </p>
              )}
            </div>

            <div className="mt-6 border-t border-black/10 pt-5">
              <CTAButton
                affiliateLink={affiliateLink}
                hasFreeTrial={hasFreeTrial}
                text="Contact Sales"
                variant="primary"
                size="lg"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border-2 border-black bg-[#F7F7F3] p-6 shadow-[6px_6px_0px_0px_#111111] md:p-7">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-start">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
            Secondary pricing option
          </p>
          <div className="mt-3">
            <h3 className="text-3xl font-black tracking-tight text-black">{plan.name}</h3>
            {plan.description && (
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-gray-600">{plan.description}</p>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-black/10 bg-white px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">{summary.eyebrow}</p>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <span className="text-4xl font-black leading-none tracking-tight text-black">{summary.price}</span>
              {summary.unit && (
                <span className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">{summary.unit}</span>
              )}
            </div>
            {secondaryNotes.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {secondaryNotes.map((line, index) => (
                  <p key={`${plan.name}-secondary-note-${index}-${line}`} className="text-xs font-medium leading-5 text-gray-500">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex h-full flex-col justify-between rounded-2xl border border-black/10 bg-white px-5 py-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">
              {isContactSales ? 'Best for larger teams' : 'Plan summary'}
            </p>
            {featureRows.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {featureRows.map((feature) => (
                  <li key={feature} className="text-sm font-medium leading-6 text-gray-700">
                    {feature}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm font-medium leading-6 text-gray-600">
                {isContactSales
                  ? 'Use this route for custom seats, procurement, security reviews, or negotiated volume.'
                  : 'Additional plan details are available after opening the pricing flow.'}
              </p>
            )}
          </div>

          <div className="mt-6 border-t border-black/10 pt-5">
            <CTAButton
              affiliateLink={affiliateLink}
              hasFreeTrial={hasFreeTrial}
              text={ctaText}
              variant={ctaVariant}
              size="lg"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingCardsGrid({
  plans,
  affiliateLink,
  hasFreeTrial,
  toolSlug,
  comparisonTable,
  externalBilling,
}: PricingCardsGridProps) {
  const [internalBilling, setInternalBilling] = useState<'monthly' | 'yearly'>('monthly');
  const billing = externalBilling !== undefined ? externalBilling : internalBilling;
  const sortedPlans = [...plans];
  const layout = buildPricingLayout(sortedPlans);

  const hasYearlyPricing = plans.some((plan) => {
    if (!plan.price || typeof plan.price !== 'object' || plan.price === null) return false;
    if ('monthly' in plan.price) {
      return 'yearly' in plan.price && plan.price.yearly !== undefined && plan.price.yearly !== null;
    }
    return false;
  });

  if (!plans || plans.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 text-center">
        <p className="text-gray-500">Pricing information coming soon.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {hasYearlyPricing && externalBilling === undefined && (
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setInternalBilling('monthly')}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition-all duration-200 ${
                billing === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInternalBilling('yearly')}
              className={`relative rounded-full px-6 py-2 text-sm font-semibold transition-all duration-200 ${
                billing === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs font-normal text-green-600">⚡ 40% off</span>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {layout.rows.map((row, rowIndex) =>
          renderPlanRow(
            row,
            sortedPlans,
            affiliateLink,
            hasFreeTrial,
            billing,
            toolSlug,
            comparisonTable,
            rowIndex,
          ),
        )}

        {layout.secondary.length > 0 && (
          <div className="pt-1">
            {layout.secondary.map((plan, index) => {
              const originalIndex = sortedPlans.indexOf(plan);
              return (
                <div
                  key={getPlanReactKey(
                    plan,
                    originalIndex >= 0 ? originalIndex : index,
                    'pricing-secondary',
                  )}
                >
                  {renderSecondaryPlan(plan, affiliateLink, hasFreeTrial, billing)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
