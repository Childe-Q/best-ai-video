import { notFound } from 'next/navigation';
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

  return {
    title: `${tool.name} Plans & Pricing ${seoYear}`,
    description: `Choose a plan that fits best for ${tool.name}. Compare pricing, features, and find the perfect plan for your needs.`,
    alternates: {
      canonical: `/tool/${slug}/pricing`,
    },
  };
}

export default async function PricingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const toolEntry = getToolBySlug(slug);
  const tool = toolEntry?.tool;
  const pricingContent = toolEntry?.pricing ?? null;
  const comparisonTable = toolEntry?.comparisonTable ?? null;

  if (!tool) notFound();

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
  );
}
