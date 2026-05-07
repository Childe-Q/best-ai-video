import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllTools, getToolBySlug } from '@/lib/toolData';
import ToolPricingTemplate from '@/components/pricing/ToolPricingTemplate';
import CapturedPricingPage from '@/components/pricing/CapturedPricingPage';
import { getSEOCurrentYear } from '@/lib/utils';
import { deriveUsageNotes } from '@/lib/pricing/deriveUsageNotes';
import { generatePricingSnapshot } from '@/lib/generatePricingSnapshot';
import { generateVerdictText } from '@/lib/pricing/generateVerdictText';
import { getToolPricingSummary } from '@/lib/pricing/display';
import { getToolCardPricingDisplay } from '@/lib/pricing/cardDisplay';
import { getProofPricingPageData } from '@/lib/pricing/proofPages';
import type { PricingVerification } from '@/lib/pricing/display';
import { getCanonicalPricingPageOverride } from '@/lib/pricing/canonicalPricingAdapter';
import { getProductizedPricingPageOverride } from '@/lib/pricing/productPageOverrides';
import { buildCollectionPageJsonLd } from '@/lib/jsonLd';
import { getPricingPageExposure } from '@/lib/pricing/indexability';
import { getToolLifecycleStatus } from '@/lib/toolStatus';

// Helper function to get last updated date (use current date for now)
function getLastUpdatedDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export async function generateStaticParams() {
  const tools = getAllTools();
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug)?.tool;
  if (!tool) return {};

  const seoYear = getSEOCurrentYear();
  const pricingExposure = getPricingPageExposure(slug, tool);
  const lifecycleStatus = getToolLifecycleStatus(slug);

  return {
    title: lifecycleStatus ? `${tool.name} Pricing After Shutdown ${seoYear}` : `${tool.name} Plans & Pricing ${seoYear}`,
    description: lifecycleStatus
      ? `${tool.name} is discontinued. This pricing page is noindexed and preserved only for shutdown context and alternatives routing.`
      : `Choose a plan that fits best for ${tool.name}. Compare pricing, features, and find the perfect plan for your needs.`,
    alternates: {
      canonical: `/tool/${slug}/pricing`,
    },
    ...(pricingExposure.indexable
      ? {}
      : {
          robots: {
            index: false,
            follow: true,
          },
        }),
  };
}

export default async function PricingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const toolEntry = getToolBySlug(slug);
  const tool = toolEntry?.tool;
  const pricingContent = toolEntry?.pricing ?? null;
  const comparisonTable = toolEntry?.comparisonTable ?? null;

  if (!tool) notFound();

  const pricingExposure = getPricingPageExposure(slug, tool);
  const lifecycleStatus = getToolLifecycleStatus(slug);

  if (lifecycleStatus) {
    return (
      <section className="w-full bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-amber-200 bg-white p-8 shadow-sm sm:p-10">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-700">Noindex pricing archive</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900">
              {tool.name} pricing is no longer a live buying path
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-700">{lifecycleStatus.summary}</p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-700">
              The web and app experience has already shut down, and the API sunset is scheduled for September 24, 2026.
              This page stays noindex so legacy pricing does not appear as a current recommendation.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Link
                href={lifecycleStatus.replacementHref}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 no-underline transition-all hover:border-indigo-300 hover:bg-indigo-50"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Replacement set</p>
                <h2 className="mt-2 text-lg font-bold text-slate-900">Compare Sora alternatives</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Use active tools instead of legacy Sora pricing.</p>
              </Link>
              <Link
                href={`/tool/${slug}`}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 no-underline transition-all hover:border-indigo-300 hover:bg-indigo-50"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status context</p>
                <h2 className="mt-2 text-lg font-bold text-slate-900">Read the shutdown note</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Review the discontinued status and API timeline.</p>
              </Link>
              <a
                href={lifecycleStatus.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 no-underline transition-all hover:border-indigo-300 hover:bg-indigo-50"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Official source</p>
                <h2 className="mt-2 text-lg font-bold text-slate-900">OpenAI Help Center</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Confirm export guidance and sunset dates.</p>
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const canonicalPricingOverride = getCanonicalPricingPageOverride(slug, tool);
  const pricingPageOverride = canonicalPricingOverride ?? getProductizedPricingPageOverride(slug, tool);
  const proofPricingData = getProofPricingPageData(slug);
  if (!pricingPageOverride && proofPricingData) {
    return <CapturedPricingPage toolName={tool.name} data={proofPricingData} />;
  }

  const pricingSummary = getToolPricingSummary(tool);
  const pricingDisplay = getToolCardPricingDisplay(tool);
  const effectivePricingVerification =
    pricingPageOverride?.pricingVerification ?? pricingSummary.verification;
  const pricingPlans =
    pricingPageOverride?.pricingPlans ??
    (pricingSummary.verification !== 'unverified' ? tool.pricing_plans || [] : []);

  // Get official pricing URL and last updated date
  const officialPricingUrl = toolEntry?.officialPricingUrl ?? null;
  const lastUpdated = getLastUpdatedDate();
  const pricingSnapshot = pricingPageOverride?.pricingSnapshot ?? pricingContent?.snapshot;
  const creditUsage = pricingPageOverride?.creditUsage ?? pricingContent?.creditUsage;
  const verdict = pricingPageOverride?.verdict ?? toolEntry?.verdict ?? undefined;

  // Generate pricing snapshot (for snapshot text used in usage notes)
  const snapshotData = generatePricingSnapshot(pricingPlans);
  const snapshotText = snapshotData.plans.map(p => p.bullets.join(' ')).join(' ');

  // Pre-compute usage notes on server side to avoid hydration mismatch
  // This ensures SSR and CSR render the same content
  // IMPORTANT: All logic must be deterministic (no random, no Date, no window checks)
  const usageNotes =
    pricingPageOverride?.usageNotes ??
    deriveUsageNotes(
      {
        key_facts: tool.key_facts,
        highlights: tool.highlights,
        category: undefined, // TODO: get from tool if available
        stand_out_metrics: undefined // TODO: get from tool if available
      },
      pricingPlans,
      snapshotText,
      tool.name,
      undefined // No dedupeMap needed on server side (we do local deduplication)
    );

  // Pre-compute verdict text on server side to avoid hydration mismatch
  // Generate from toolData, plans, snapshot, and comparable attributes
  const generatedVerdictText =
    verdict?.text ??
    generateVerdictText(
      {
        key_facts: tool.key_facts,
        highlights: tool.highlights,
        best_for: tool.best_for
      },
      pricingPlans,
      tool.name,
      slug, // Pass slug for deterministic style selection
      snapshotData.plans.map(p => p.bullets).flat(), // Pass snapshot bullets
      comparisonTable ?? undefined // Pass comparison table for contrast features
    );

  // Use the new template for all tools (including InVideo for consistency)
  return (
    <>
      {pricingExposure.indexable ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              buildCollectionPageJsonLd({
                name: `${tool.name} pricing`,
                description: `Pricing plans, billing notes, and plan-selection guidance for ${tool.name}.`,
                href: `/tool/${slug}/pricing`,
                items: pricingPlans.slice(0, 6).map((plan) => ({
                  name: plan.name,
                  href: `/tool/${slug}/pricing`,
                })),
              })
            ),
          }}
        />
      ) : null}
      <ToolPricingTemplate
        toolName={tool.name}
        toolSlug={slug}
        pricingPlans={pricingPlans}
        comparisonTable={comparisonTable ?? undefined}
        pricingSnapshot={pricingSnapshot}
        creditUsage={creditUsage}
        planPicker={pricingContent?.planPicker}
        verdict={verdict}
        toolData={{
          key_facts: tool.key_facts,
          highlights: tool.highlights,
          best_for: tool.best_for
        }}
        usageNotes={usageNotes} // Pre-computed on server
        usageGroups={pricingPageOverride?.usageGroups}
        pricingDetails={pricingPageOverride?.pricingDetails}
        verdictText={generatedVerdictText} // Pre-computed on server
        lastUpdated={lastUpdated}
        officialPricingUrl={officialPricingUrl}
        affiliateLink={tool.affiliate_link}
        hasFreeTrial={
          pricingPageOverride
            ? pricingPageOverride.hasFreeTrial
            : pricingSummary.verification === 'verified'
            ? tool.has_free_trial
            : false
        }
        startingPrice={pricingPageOverride?.startingPrice ?? pricingDisplay.displayText}
        pricingStatusHint={pricingPageOverride?.pricingStatusHint ?? pricingDisplay.hintText}
        pricingVerification={effectivePricingVerification as PricingVerification}
      />
    </>
  );
}
