import { notFound } from 'next/navigation';
import { getTool, getAllTools } from '@/lib/getTool';
import ToolPricingTemplate from '@/components/pricing/ToolPricingTemplate';
import { getSEOCurrentYear, getStartingPrice } from '@/lib/utils';
import { ComparisonTable } from '@/types/tool';
import { deriveUsageNotes } from '@/lib/pricing/deriveUsageNotes';
import { generatePricingSnapshot } from '@/lib/generatePricingSnapshot';
import { generateVerdictText } from '@/lib/pricing/generateVerdictText';
import * as fs from 'fs';
import * as path from 'path';

// Helper function to get official pricing URL from sources
function getOfficialPricingUrl(slug: string): string | null {
  try {
    const projectRoot = process.cwd();
    const sourcesPath = path.join(projectRoot, 'src', 'data', 'sources', 'tools.sources.json');
    if (fs.existsSync(sourcesPath)) {
      const sourcesData = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));
      const toolSource = sourcesData.find((s: any) => s.slug === slug);
      if (toolSource?.official_urls?.pricing?.url) {
        return toolSource.official_urls.pricing.url;
      }
    }
  } catch (error) {
    // Silently fail
  }
  return null;
}

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
  const tool = getTool(slug);
  if (!tool) return {};

  const seoYear = getSEOCurrentYear();

  return {
    title: `${tool.name} Plans & Pricing ${seoYear}`,
    description: `Choose a plan that fits best for ${tool.name}. Compare pricing, features, and find the perfect plan for your needs.`,
  };
}

export default async function PricingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);

  if (!tool) notFound();

  const seoYear = getSEOCurrentYear();
  const pricingPlans = tool.pricing_plans || [];

  // Get comparison_table: first from tool, then fallback to pricing JSON file
  let comparisonTable: ComparisonTable | undefined = tool.comparison_table;

  // If not in tool, try to load from pricing JSON file
  if (!comparisonTable) {
    try {
      // In Next.js, we need to resolve from the project root
      const projectRoot = process.cwd();
      const pricingJsonPath = path.join(projectRoot, 'src', 'data', 'pricing', `${slug}.json`);

      if (fs.existsSync(pricingJsonPath)) {
        const pricingData = JSON.parse(fs.readFileSync(pricingJsonPath, 'utf-8'));
        if (pricingData.comparison_table) {
          comparisonTable = pricingData.comparison_table;
        }
      }
    } catch (error) {
      // Silently fail if pricing JSON doesn't exist or is invalid
      // console.warn(`[PricingPage] Could not load comparison_table from pricing JSON for ${slug}:`, error);
    }
  }

  // Get official pricing URL and last updated date
  const officialPricingUrl = getOfficialPricingUrl(slug);
  const lastUpdated = getLastUpdatedDate();

  // Generate pricing snapshot (for snapshot text used in usage notes)
  const snapshotData = generatePricingSnapshot(pricingPlans);
  const snapshotText = snapshotData.plans.map(p => p.bullets.join(' ')).join(' ');

  // Pre-compute usage notes on server side to avoid hydration mismatch
  // This ensures SSR and CSR render the same content
  // IMPORTANT: All logic must be deterministic (no random, no Date, no window checks)
  const usageNotes = deriveUsageNotes(
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
  const generatedVerdictText = generateVerdictText(
    {
      key_facts: tool.key_facts,
      highlights: tool.highlights,
      best_for: tool.best_for
    },
    pricingPlans,
    tool.name,
    slug, // Pass slug for deterministic style selection
    snapshotData.plans.map(p => p.bullets).flat(), // Pass snapshot bullets
    comparisonTable // Pass comparison table for contrast features
  );

  // Use the new template for all tools (including InVideo for consistency)
  return (
    <ToolPricingTemplate
      toolName={tool.name}
      toolSlug={slug}
      pricingPlans={pricingPlans}
      comparisonTable={comparisonTable}
      pricingSnapshot={tool.content?.pricing?.snapshot}
      creditUsage={tool.content?.pricing?.creditUsage}
      planPicker={tool.content?.pricing?.planPicker}
      verdict={tool.content?.pricing?.verdict}
      toolData={{
        key_facts: tool.key_facts,
        highlights: tool.highlights,
        best_for: tool.best_for
      }}
      usageNotes={usageNotes} // Pre-computed on server
      verdictText={generatedVerdictText} // Pre-computed on server
      lastUpdated={lastUpdated}
      officialPricingUrl={officialPricingUrl}
      affiliateLink={tool.affiliate_link}
      hasFreeTrial={tool.has_free_trial}
      startingPrice={getStartingPrice(tool)}
    />
  );
}

