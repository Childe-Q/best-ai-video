#!/usr/bin/env tsx
/**
 * Build tool content JSON from dossiers + evidence
 * 
 * Usage:
 *   tsx scripts/build_tool_content.ts <slug> [--dossier <path>] [--evidence <path>]
 * 
 * Input:
 *   - /tmp/dossiers/{slug}.json} (required) - Site dossier with pricing/features/reviews
 *   - /tmp/evidence/{slug}.json (optional) - External evidence from Gemini
 * 
 * Output:
 *   - content/tools/{slug}.json - ToolContent JSON
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ToolContent } from '../src/types/toolContent';

interface Dossier {
  pricing?: {
    plans?: Array<{
      name: string;
      features?: string[];
      restrictions?: string[];
    }>;
  };
  features?: {
    keyFeatures?: string[];
    detailedFeatures?: Array<{
      title: string;
      description: string;
    }>;
  };
  reviews?: {
    faqs?: Array<{
      question: string;
      answer: string;
    }>;
    userSentiment?: string;
  };
  overview?: {
    tldr?: {
      bestFor?: string;
      notFor?: string;
      why?: string;
    };
    useCases?: Array<{
      title: string;
      why: string;
    }>;
  };
}

interface Evidence {
  tldr?: {
    bestFor?: string;
    notFor?: string;
    why?: string;
  };
  miniTest?: {
    prompt?: string;
    checklist?: Array<{
      label: string;
      value: string;
    }>;
  };
  useCases?: Array<{
    title: string;
    why: string;
  }>;
  features?: string[];
  pros?: string[];
  cons?: string[];
  faqs?: Array<{
    question: string;
    answer: string;
    sources?: string[];
  }>;
  sources?: Record<string, {
    type: string;
    howToVerify: string;
    suggestedQuery?: string;
  }>;
}

function filterNeedVerification(text: string): boolean {
  return !text.includes('[NEED VERIFICATION]') && 
         !text.includes('[NEED_TEST') &&
         !text.includes('[NEED_SOURCE]');
}

function truncateText(text: string, maxWords: number = 18): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}

function cleanText(text: string): string {
  return text.trim()
    .replace(/\s+/g, ' ')
    .replace(/\[NEED VERIFICATION\]/gi, '')
    .replace(/\[NEED_TEST[^\]]*\]/gi, '')
    .replace(/\[NEED_SOURCE[^\]]*\]/gi, '');
}

function buildToolContent(slug: string, dossier: Dossier, evidence?: Evidence): ToolContent {
  const content: ToolContent = {};

  // Overview section
  content.overview = {};

  // TL;DR - prefer evidence, fallback to dossier
  if (evidence?.tldr || dossier.overview?.tldr) {
    const tldr = evidence?.tldr || dossier.overview?.tldr;
    if (tldr?.bestFor && filterNeedVerification(tldr.bestFor) &&
        tldr?.notFor && filterNeedVerification(tldr.notFor) &&
        tldr?.why && filterNeedVerification(tldr.why)) {
      content.overview.tldr = {
        bestFor: truncateText(cleanText(tldr.bestFor), 18),
        notFor: truncateText(cleanText(tldr.notFor), 18),
        why: truncateText(cleanText(tldr.why), 18),
      };
    }
  }

  // Mini Test - only from evidence
  if (evidence?.miniTest?.prompt && filterNeedVerification(evidence.miniTest.prompt)) {
    content.overview.miniTest = {
      prompt: cleanText(evidence.miniTest.prompt),
      checklist: evidence.miniTest.checklist
        ?.filter(item => filterNeedVerification(item.value))
        .map(item => ({
          label: item.label,
          value: cleanText(item.value),
        }))
        .slice(0, 6),
    };
  }

  // Use Cases - prefer evidence, fallback to dossier
  const useCases = evidence?.useCases || dossier.overview?.useCases || [];
  if (useCases.length > 0) {
    content.overview.useCases = useCases
      .filter(uc => uc.title && uc.why && filterNeedVerification(uc.why))
      .slice(0, 6)
      .map(uc => ({
        title: truncateText(cleanText(uc.title), 12),
        why: truncateText(cleanText(uc.why), 18),
        linkHref: `/vs/${slug}-vs-alternative`, // Default, can be overridden
        linkText: 'Learn more →',
      }));
  }

  // Features - from dossier only (pricing/features should be from site)
  if (dossier.features?.keyFeatures && dossier.features.keyFeatures.length > 0) {
    content.features = {
      keyFeatures: dossier.features.keyFeatures
        .filter(f => filterNeedVerification(f))
        .slice(0, 10)
        .map(f => truncateText(cleanText(f), 18)),
    };
  } else if (evidence?.features && evidence.features.length > 0) {
    content.features = {
      keyFeatures: evidence.features
        .filter(f => filterNeedVerification(f))
        .slice(0, 10)
        .map(f => truncateText(cleanText(f), 18)),
    };
  }

  // Pros & Cons - from evidence only (hard facts)
  if (evidence?.pros && evidence.pros.length > 0) {
    content.pros = evidence.pros
      .filter(p => filterNeedVerification(p))
      .slice(0, 6)
      .map(p => truncateText(cleanText(p), 18));
  }

  if (evidence?.cons && evidence.cons.length > 0) {
    content.cons = evidence.cons
      .filter(c => filterNeedVerification(c))
      .slice(0, 6)
      .map(c => truncateText(cleanText(c), 18));
  }

  // Reviews - merge dossier + evidence
  if (dossier.reviews || evidence?.faqs) {
    content.reviews = {};

    if (dossier.reviews?.userSentiment && filterNeedVerification(dossier.reviews.userSentiment)) {
      content.reviews.userSentiment = cleanText(dossier.reviews.userSentiment);
    }

    // FAQs - prefer dossier, supplement with evidence
    const dossierFaqs = dossier.reviews?.faqs || [];
    const evidenceFaqs = evidence?.faqs || [];
    const allFaqs = [...dossierFaqs, ...evidenceFaqs]
      .filter(faq => 
        faq.question && 
        faq.answer && 
        filterNeedVerification(faq.answer)
      )
      .slice(0, 8)
      .map(faq => ({
        question: truncateText(cleanText(faq.question), 20),
        answer: truncateText(cleanText(faq.answer), 50),
      }));

    if (allFaqs.length > 0) {
      content.reviews.faqs = allFaqs;
    }
  }

  // Pricing - ONLY from dossier (never from external evidence)
  if (dossier.pricing?.plans && dossier.pricing.plans.length > 0) {
    content.pricing = {
      snapshot: {
        plans: dossier.pricing.plans
          .slice(0, 5)
          .map(plan => ({
            name: plan.name,
            bullets: [
              ...(plan.restrictions || []),
              ...(plan.features || []),
            ]
              .filter(b => filterNeedVerification(b))
              .slice(0, 5)
              .map(b => truncateText(cleanText(b), 18)),
          })),
        note: 'Check official pricing for most up-to-date plans and features',
      },
    };
  }

  // Sources - from evidence only
  if (evidence?.sources && Object.keys(evidence.sources).length > 0) {
    content.sources = evidence.sources;
  }

  // Remove empty sections
  if (Object.keys(content.overview).length === 0) delete content.overview;
  if (content.features && !content.features.keyFeatures?.length) delete content.features;
  if (content.reviews && Object.keys(content.reviews).length === 0) delete content.reviews;
  if (content.pricing && !content.pricing.snapshot?.plans?.length) delete content.pricing;

  return content;
}

function main() {
  const args = process.argv.slice(2);
  const slug = args[0];

  if (!slug) {
    console.error('Usage: tsx scripts/build_tool_content.ts <slug> [--dossier <path>] [--evidence <path>]');
    process.exit(1);
  }

  // Default paths
  const dossierPath = args.includes('--dossier') 
    ? args[args.indexOf('--dossier') + 1]
    : join(process.cwd(), 'tmp', 'dossiers', `${slug}.json`);
  
  const evidencePath = args.includes('--evidence')
    ? args[args.indexOf('--evidence') + 1]
    : join(process.cwd(), 'tmp', 'evidence', `${slug}.json`);

  // Load dossier (required)
  if (!existsSync(dossierPath)) {
    console.error(`Dossier not found: ${dossierPath}`);
    process.exit(1);
  }

  const dossier: Dossier = JSON.parse(readFileSync(dossierPath, 'utf-8'));

  // Load evidence (optional)
  let evidence: Evidence | undefined;
  if (existsSync(evidencePath)) {
    evidence = JSON.parse(readFileSync(evidencePath, 'utf-8'));
  }

  // Build content
  const content = buildToolContent(slug, dossier, evidence);

  // Write output
  const outputPath = join(process.cwd(), 'content', 'tools', `${slug}.json`);
  writeFileSync(outputPath, JSON.stringify(content, null, 2), 'utf-8');

  console.log(`✓ Generated ${outputPath}`);
  console.log(`  Sections: ${Object.keys(content).join(', ')}`);
}

if (require.main === module) {
  main();
}
