'use client';

import { PricingPlan } from '@/types/tool';
import { isExplicitContactSalesPlan, isExplicitFreePlan } from '@/lib/pricing/display';
import { extractBestFor } from '@/lib/pricing/extractPlanFields';

interface PricingEssentialsProps {
  pricingPlans: PricingPlan[];
  startingPrice: string;
  hasFreeTrial: boolean;
  toolName: string;
  toolSlug: string;
  toolData?: {
    key_facts?: string[];
    highlights?: string[];
    best_for?: string;
  };
  snapshotPlans?: Array<{ name: string; bullets: string[] }>;
}

type ToolPricingClass = 'avatar' | 'editor' | 'generative' | 'default';

function collectPlanText(plan: PricingPlan): string {
  return [
    plan.description,
    plan.tagline,
    plan.unitPriceNote,
    plan.billingNote,
    ...(plan.highlights || []),
    ...(plan.features || []),
    ...(plan.detailed_features || []),
    ...(plan.featureItems?.map((item) => item.text) || []),
  ]
    .filter(Boolean)
    .join(' ');
}

function cleanBullets(plan: PricingPlan): string[] {
  return Array.from(
    new Set(
      [
        ...(plan.highlights || []),
        ...(plan.featureItems?.map((item) => item.text) || []),
        ...(plan.features || []),
      ]
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((item) => {
          const lower = item.toLowerCase();
          return (
            !lower.includes('plan features') &&
            !lower.includes('everything in') &&
            !lower.includes('includes:') &&
            !lower.includes('what you get')
          );
        })
    )
  );
}

function pickFirstMatch(texts: string[], patterns: RegExp[]): string | null {
  for (const text of texts) {
    for (const pattern of patterns) {
      if (pattern.test(text)) return text;
    }
  }
  return null;
}

function classifyTool(toolSlug: string): ToolPricingClass {
  const avatarSlugs = new Set(['heygen', 'synthesia', 'deepbrain-ai', 'elai-io', 'd-id']);
  const editorSlugs = new Set(['veed-io', 'descript', 'opus-clip', 'pictory', 'lumen5', 'flexclip']);
  const generativeSlugs = new Set(['runway', 'pika', 'invideo', 'zebracat', 'synthesys']);

  if (avatarSlugs.has(toolSlug)) return 'avatar';
  if (editorSlugs.has(toolSlug)) return 'editor';
  if (generativeSlugs.has(toolSlug)) return 'generative';
  return 'default';
}

function summarizeUpgradeChange(plan: PricingPlan): string | null {
  const bullets = cleanBullets(plan);
  const priorityPatterns = [
    /\b(credits?|video minutes?|videos?\s+per\s+month|unlimited videos?)\b/i,
    /\b(1080p|4k|720p|export)\b/i,
    /\b(voice cloning|api access|sso|scim|workspace|team|brand kit|watermark)\b/i,
  ];

  return pickFirstMatch(bullets, priorityPatterns) || bullets[0] || null;
}

function summarizeChangeForClass(plan: PricingPlan, kind: ToolPricingClass): string | null {
  const bullets = cleanBullets(plan);

  const patternsByClass: Record<ToolPricingClass, RegExp[]> = {
    avatar: [
      /\b(videos?\s+up\s+to|minutes?|custom (digital twin|video avatar|interactive avatar)|voice cloning|translation|workspace|team|4k|1080p)\b/i,
      /\b(sso|scim|security|customer success|enterprise)\b/i,
    ],
    editor: [
      /\b(export|1080p|4k|storage|brand kit|subtitles?|translations?|stock|workspace|team)\b/i,
      /\b(repurpose|clip|social|caption|auto subtitles?)\b/i,
    ],
    generative: [
      /\b(credits?|minutes?|generations?|model|gen-4|watermark|concurrent|workspace|api)\b/i,
      /\b(unlimited|usage|burn|export)\b/i,
    ],
    default: [
      /\b(credits?|minutes?|export|workspace|team|api|watermark|storage)\b/i,
    ],
  };

  return pickFirstMatch(bullets, patternsByClass[kind]) || summarizeUpgradeChange(plan);
}

function buildVerdict(
  kind: ToolPricingClass,
  toolName: string,
  entryPlan: PricingPlan | null,
  freePlan: PricingPlan | undefined,
  bestFor?: string
): string {
  const entryName = entryPlan?.name || 'the first paid plan';

  switch (kind) {
    case 'avatar':
      return freePlan
        ? `${toolName} is a stage-based buy: stay on free until longer videos, localization, or client delivery become regular, then move into ${entryName}.`
        : `${toolName} is a stage-based buy: move up only when your avatar workflow needs more duration, localization, or team review.`;
    case 'editor':
      return `${toolName} is mostly a workflow-ceiling buy: pay for the tier that clears your export, storage, and collaboration bottleneck, not the longest feature list.`;
    case 'generative':
      return `${toolName} is mainly a usage-volatility buy: start with the cheapest tier that unlocks the models you need, then move up only when credit burn is consistently real.`;
    default:
      return `${toolName} is mostly a fit decision: choose the tier that matches your real workflow, not just the lowest visible price${bestFor ? ` for ${bestFor}` : ''}.`;
  }
}

function buildChooserLine(
  kind: ToolPricingClass,
  planName: string,
  change: string | null,
  bestFor: string | null,
  fallback: string | null
): string {
  const fit = bestFor?.replace(/\.$/, '');
  const unlock = (change || fallback || '').replace(/\.$/, '');

  switch (kind) {
    case 'avatar':
      return `${planName}: pick it when ${fit ? fit.toLowerCase() : 'your workflow is moving past solo testing'}${unlock ? ` and you need ${unlock.toLowerCase()}` : ''}.`;
    case 'editor':
      return `${planName}: use it when ${fit ? fit.toLowerCase() : 'your workflow is getting heavier'}${unlock ? ` and ${unlock.toLowerCase()} is the real bottleneck` : ''}.`;
    case 'generative':
      return `${planName}: move here when ${fit ? fit.toLowerCase() : 'you have steady generation volume'}${unlock ? ` and ${unlock.toLowerCase()} will actually be used` : ''}.`;
    default:
      return `${planName}: choose it when ${fit ? fit.toLowerCase() : 'the extra usage or access will be used regularly'}${unlock ? ` and you need ${unlock.toLowerCase()}` : ''}.`;
  }
}

function summarizeBeforeYouPay(
  kind: ToolPricingClass,
  freePlan: PricingPlan | undefined,
  paidPlans: PricingPlan[],
  enterprisePlan: PricingPlan | undefined,
  hasFreeTrial: boolean
): string[] {
  const notes: string[] = [];
  const freeText = freePlan ? collectPlanText(freePlan) : '';
  const allPaidText = paidPlans.map((plan) => collectPlanText(plan)).join(' ');

  if (freePlan) {
    notes.push(hasFreeTrial ? 'There is a low-risk free/trial-style entry, so validate workflow before paying annually.' : 'There is a free entry plan, so you can validate output before moving into paid usage.');
  }

  if (/\bwatermark\b/i.test(freeText) && !/\b(no\s+watermark|watermark\s+removal|remove\s+watermark|watermark-free)\b/i.test(freeText)) {
    notes.push('Free entry may still be a proof-of-concept tier if watermark or export limits block real publishing.');
  }

  if (/\b(api\s+access|rest\s+api|api\s+integration)\b/i.test(allPaidText)) {
    const apiPlan = paidPlans.find((plan) => /\b(api\s+access|rest\s+api|api\s+integration)\b/i.test(collectPlanText(plan)));
    if (apiPlan) notes.push(`API access is not universal across the ladder. Treat ${apiPlan.name} as the real API entry point unless the live page says otherwise.`);
  }

  const storagePlan = paidPlans.find((plan) => /\b\d+\s*(gb|tb)\s*storage\b/i.test(collectPlanText(plan)));
  if (storagePlan) {
    notes.push(`Storage and usage caps still matter on self-serve tiers, so match the plan to your real monthly volume instead of just the headline start price.`);
  }

  if (enterprisePlan) {
    notes.push('Enterprise is usually about admin, security, or rollout control, not just a slightly bigger creator tier.');
  }

  if (kind === 'avatar') {
    notes.push('Do not upgrade early just for “more avatars” if your real blocker is still script quality, translation QA, or approval workflow.');
  }

  if (kind === 'editor') {
    notes.push('The wrong plan usually shows up as export friction or storage pressure first, not as a missing checkbox on the feature list.');
  }

  if (kind === 'generative') {
    notes.push('Generative plans are easiest to overbuy when usage is bursty. If your volume swings a lot, monthly flexibility usually matters more than the biggest credit bucket.');
  }

  return Array.from(new Set(notes)).slice(0, 4);
}

export default function PricingEssentials({
  pricingPlans,
  startingPrice,
  hasFreeTrial,
  toolName,
  toolSlug,
  toolData,
  snapshotPlans,
}: PricingEssentialsProps) {
  if (!pricingPlans || pricingPlans.length === 0) return null;

  const pricingClass = classifyTool(toolSlug);
  const freePlan = pricingPlans.find((plan) => isExplicitFreePlan(plan));
  const paidPlans = pricingPlans.filter((plan) => !isExplicitFreePlan(plan) && !isExplicitContactSalesPlan(plan));
  const entryPlan = paidPlans[0] || null;
  const enterprisePlan = pricingPlans.find((plan) => isExplicitContactSalesPlan(plan));
  const chooserItems = paidPlans
    .slice(0, 3)
    .map((plan) => {
      const bestFor = extractBestFor(
        plan.name,
        plan,
        toolData ? { best_for: toolData.best_for } : null,
        snapshotPlans
      );
      const bullets = cleanBullets(plan).slice(0, 2);

      return {
        text: buildChooserLine(
          pricingClass,
          plan.name,
          summarizeChangeForClass(plan, pricingClass),
          bestFor,
          bullets[0] || null
        ),
      };
    })
    .slice(0, 3);

  const beforeYouPay = summarizeBeforeYouPay(
    pricingClass,
    freePlan,
    pricingPlans.filter((plan) => !isExplicitFreePlan(plan) && !isExplicitContactSalesPlan(plan)),
    enterprisePlan,
    hasFreeTrial
  ).slice(0, 2);

  const verdict = buildVerdict(pricingClass, toolName, entryPlan, freePlan, toolData?.best_for);

  return (
    <div className="mb-16 bg-white rounded-2xl border-2 border-gray-200 p-6 md:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pricing guidance</h2>
      </div>

      <div className="space-y-5">
        <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">Pricing verdict</p>
          <p className="text-sm font-medium text-gray-900 leading-6">{verdict}</p>
          <p className="mt-3 text-sm text-gray-600">
            {freePlan
              ? `There is a free entry point, and paid pricing currently starts at ${startingPrice}.`
              : `Paid pricing currently starts at ${startingPrice}.`}
          </p>
        </section>

        {chooserItems.length > 0 && (
          <section className="rounded-xl border border-gray-200 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-3">Plan chooser</p>
            <ul className="space-y-2">
              {chooserItems.map((item, index) => (
                <li key={`${toolName}-chooser-${index}`} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {beforeYouPay.length > 0 && (
          <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700 mb-3">Before you pay</p>
            <ul className="space-y-2">
              {beforeYouPay.map((note, index) => (
                <li key={`${toolName}-before-${index}`} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
