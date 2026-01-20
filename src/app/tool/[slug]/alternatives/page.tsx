import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getTool, getAllTools } from '@/lib/getTool';
import { getSEOCurrentYear } from '@/lib/utils';
import { generateSmartFAQs } from '@/lib/generateSmartFAQs';
import { loadToolContent } from '@/lib/loadToolContent';
import AlternativesClient from './AlternativesClient';
import { canonicalAlternativesConfigs } from '@/data/alternatives/canonical';
import { alternativesEvidence, ToolAlternativeEvidence } from '@/data/evidence/alternatives';
import { mergeCanonicalAndEvidence } from '@/lib/alternatives/mergeCanonicalAndEvidence';
import { AlternativeGroupWithEvidence } from '@/types/alternatives';
import AlternativesErrorBoundary from '@/components/alternatives/AlternativesErrorBoundary';

export async function generateStaticParams() {
  const { getAllTools } = await import('@/lib/getTool');
  const tools = getAllTools();
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  const seoYear = getSEOCurrentYear();

  if (tool) {
    return {
      title: `${tool.name} Alternatives (${seoYear}): Best Replacements by Use Case`,
      description: `Looking for better than ${tool.name}? Compare top alternatives based on cost control, output quality, workflow speed, and control features.`,
    };
  }

  return {};
}

export default async function AlternativesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  
  if (!tool) {
    notFound();
  }

  const allTools = getAllTools();
  
  // Check if we have canonical config for this tool
  const canonicalConfig = canonicalAlternativesConfigs[slug];
  
  let groups: AlternativeGroupWithEvidence[];
  
  if (canonicalConfig) {
    // Use canonical + evidence merge
    const evidenceMap = new Map<string, any>();
    Object.entries(alternativesEvidence).forEach(([toolSlug, rawEvidence]: [string, ToolAlternativeEvidence]) => {
      // Convert ToolAlternativeEvidence to ToolEvidence (no evidenceLinks extraction)
      evidenceMap.set(toolSlug, {
        toolSlug,
        pickThisIf: rawEvidence.whySwitch?.[0]?.claim,
        extraReason: rawEvidence.whySwitch?.[1]?.claim,
        limitations: rawEvidence.tradeoffs?.[0]?.claim,
        bestFor: rawEvidence.bestFor
      });
    });
    
    groups = mergeCanonicalAndEvidence(canonicalConfig, evidenceMap, allTools);
    
  } else {
    // Fallback to old buildAlternativeGroups (for tools without canonical config)
    const { buildAlternativeGroups } = await import('@/lib/buildAlternativesData');
    const { getAlternativesShortlist } = await import('@/lib/alternatives/getAlternativesShortlist');
    const toolShortlist = getAlternativesShortlist(slug, allTools, 10);
    const oldGroups = buildAlternativeGroups(tool, allTools, toolShortlist);
    // Convert old format to new format
    groups = oldGroups.map(g => ({
      id: g.id,
      title: g.title,
      description: g.description,
      tools: g.tools.map(t => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        logoUrl: t.logoUrl,
        startingPrice: t.startingPrice,
        rating: t.rating,
        affiliateLink: t.affiliateLink,
        hasFreeTrial: t.hasFreeTrial,
        pickThisIf: t.whySwitch[0],
        extraReason: t.whySwitch[1],
        limitations: t.tradeOff || undefined,
        pricingSignals: t.pricingSignals,
        bestFor: t.bestFor
      }))
    }));
  }

  // Generate FAQs
  const content = loadToolContent(slug);
  const rawFaqs = [
    ...(content?.reviews?.faqs || []),
    ...(tool.content?.reviews?.faqs || []),
    ...(tool.faqs || [])
  ];

  const smartFAQs = generateSmartFAQs({
    tool,
    content,
    rawFaqs,
    slug
  });

  const faqs = smartFAQs.slice(0, 8).map(faq => ({
    question: faq.question,
    answer: faq.answer
  }));

  // Render within the tool layout (provided by layout.tsx)
  return (
    <AlternativesErrorBoundary>
      <Suspense fallback={<div className="p-8 text-center">Loading alternatives...</div>}>
        <AlternativesClient 
          groups={groups} 
          toolName={tool.name} 
          faqs={faqs}
          currentSlug={slug}
          allTools={allTools}
        />
      </Suspense>
    </AlternativesErrorBoundary>
  );
}
