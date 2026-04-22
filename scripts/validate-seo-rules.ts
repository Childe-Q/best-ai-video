#!/usr/bin/env node

import type { Metadata } from 'next';
import sitemap from '@/app/sitemap';
import { metadata as aboutMetadata } from '@/app/about/page';
import { generateMetadata as alternativesHubGenerateMetadata } from '@/app/alternatives/page';
import { generateMetadata as featureGenerateMetadata } from '@/app/features/[slug]/page';
import { generateMetadata as featuresHubGenerateMetadata } from '@/app/features/page';
import { metadata as methodologyMetadata } from '@/app/methodology/page';
import { generateMetadata as homeGenerateMetadata } from '@/app/page';
import { metadata as pricingCardsIndexMetadata } from '@/app/pricing-cards/page';
import { generateMetadata as pricingCardsDetailGenerateMetadata } from '@/app/pricing-cards/[slug]/page';
import { metadata as privacyMetadata } from '@/app/privacy/page';
import { metadata as termsMetadata } from '@/app/terms/page';
import { generateMetadata as pricingGenerateMetadata } from '@/app/tool/[slug]/pricing/page';
import { metadata as vsIndexMetadata } from '@/app/vs/page';
import { getIndexableFeaturePageSlugs, isFeaturePageIndexable } from '@/lib/features/indexability';
import { getFeaturePageSlugs } from '@/lib/features/readFeaturePageData';
import { getCanonicalPricingStaticParams } from '@/lib/pricingCards';
import { getPricingPageExposure } from '@/lib/pricing/indexability';
import { getAllTools } from '@/lib/toolData';

type RobotsObject = Exclude<NonNullable<Metadata['robots']>, string>;

function fail(message: string): never {
  throw new Error(message);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    fail(message);
  }
}

function extractCanonical(metadata: Metadata): string | null {
  const alternates = metadata.alternates;
  if (!alternates || typeof alternates !== 'object') {
    return null;
  }

  const canonical = 'canonical' in alternates ? alternates.canonical : null;
  return typeof canonical === 'string' ? canonical : null;
}

function extractRobots(metadata: Metadata): RobotsObject | null {
  const robots = metadata.robots;
  if (!robots || typeof robots !== 'object' || Array.isArray(robots)) {
    return null;
  }

  return robots;
}

function isNoIndexFollow(metadata: Metadata): boolean {
  const robots = extractRobots(metadata);
  return robots?.index === false && robots?.follow === true;
}

function isNoIndexNoFollow(metadata: Metadata): boolean {
  const robots = extractRobots(metadata);
  return robots?.index === false && robots?.follow === false;
}

async function withMutedConsole<T>(fn: () => Promise<T>): Promise<T> {
  const original = {
    log: console.log,
    info: console.info,
    warn: console.warn,
  };

  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};

  try {
    return await fn();
  } finally {
    console.log = original.log;
    console.info = original.info;
    console.warn = original.warn;
  }
}

async function validatePricingExposureRules() {
  const routes = await withMutedConsole(() => sitemap());
  const sitemapUrls = new Set(routes.map((route) => route.url));
  const baseUrl = 'https://best-ai-video.com';

  for (const tool of getAllTools()) {
    const exposure = getPricingPageExposure(tool.slug, tool);
    const metadata = await pricingGenerateMetadata({ params: Promise.resolve({ slug: tool.slug }) });
    const canonical = extractCanonical(metadata);
    const expectedUrl = `${baseUrl}/tool/${tool.slug}/pricing`;

    assert(canonical === `/tool/${tool.slug}/pricing`, `Pricing canonical mismatch for ${tool.slug}: ${canonical ?? 'missing'}`);

    if (exposure.indexable) {
      assert(!isNoIndexFollow(metadata), `Pricing page should stay indexable for ${tool.slug} but metadata is noindex.`);
      assert(sitemapUrls.has(expectedUrl), `Pricing page missing from sitemap for ${tool.slug}.`);
    } else {
      assert(isNoIndexFollow(metadata), `Pricing page should be noindex,follow for ${tool.slug}.`);
      assert(!sitemapUrls.has(expectedUrl), `Pricing page should be excluded from sitemap for ${tool.slug}.`);
    }
  }
}

async function validateFeatureExposureRules() {
  const routes = await withMutedConsole(() => sitemap());
  const sitemapUrls = new Set(routes.map((route) => route.url));
  const baseUrl = 'https://best-ai-video.com';
  const allSlugs = getFeaturePageSlugs();
  const indexableSlugs = new Set(getIndexableFeaturePageSlugs());

  for (const slug of allSlugs) {
    const metadata = await featureGenerateMetadata({ params: Promise.resolve({ slug }) });
    const canonical = extractCanonical(metadata);
    const expectedUrl = `${baseUrl}/features/${slug}`;
    const indexable = isFeaturePageIndexable(slug);

    assert(canonical === `/features/${slug}`, `Feature canonical mismatch for ${slug}: ${canonical ?? 'missing'}`);
    assert(indexableSlugs.has(slug) === indexable, `Feature indexability helper mismatch for ${slug}.`);

    if (indexable) {
      assert(!isNoIndexFollow(metadata), `Feature page should stay indexable for ${slug} but metadata is noindex.`);
      assert(sitemapUrls.has(expectedUrl), `Feature page missing from sitemap for ${slug}.`);
    } else {
      assert(isNoIndexFollow(metadata), `Feature page should be noindex,follow for ${slug}.`);
      assert(!sitemapUrls.has(expectedUrl), `Feature page should be excluded from sitemap for ${slug}.`);
    }
  }
}

async function validatePricingCardsRules() {
  assert(isNoIndexNoFollow(pricingCardsIndexMetadata), 'Pricing cards index should be noindex,nofollow.');

  for (const params of getCanonicalPricingStaticParams()) {
    const metadata = await pricingCardsDetailGenerateMetadata({ params: Promise.resolve(params) });
    assert(isNoIndexNoFollow(metadata), `Pricing cards detail should be noindex,nofollow for ${params.slug}.`);
  }
}

async function validateCanonicalRules() {
  const homeMetadata = homeGenerateMetadata();
  const featuresHubMetadata = featuresHubGenerateMetadata();
  const alternativesHubMetadata = await alternativesHubGenerateMetadata();

  assert(extractCanonical(homeMetadata) === 'https://best-ai-video.com/', 'Homepage canonical is missing or changed.');
  assert(extractCanonical(featuresHubMetadata) === '/features', 'Features hub canonical is missing or changed.');
  assert(extractCanonical(alternativesHubMetadata) === '/alternatives', 'Alternatives hub canonical is missing or changed.');
  assert(extractCanonical(vsIndexMetadata) === 'https://best-ai-video.com/vs', 'VS index canonical is missing or changed.');
  assert(extractCanonical(methodologyMetadata) === 'https://best-ai-video.com/methodology', 'Methodology canonical is missing or changed.');
  assert(extractCanonical(aboutMetadata) === 'https://best-ai-video.com/about', 'About canonical is missing or changed.');
  assert(extractCanonical(privacyMetadata) === 'https://best-ai-video.com/privacy', 'Privacy canonical is missing or changed.');
  assert(extractCanonical(termsMetadata) === 'https://best-ai-video.com/terms', 'Terms canonical is missing or changed.');

  for (const tool of getAllTools()) {
    const pricingMetadata = await pricingGenerateMetadata({ params: Promise.resolve({ slug: tool.slug }) });
    assert(extractCanonical(pricingMetadata) === `/tool/${tool.slug}/pricing`, `Pricing canonical is missing for ${tool.slug}.`);
  }

  for (const slug of getFeaturePageSlugs()) {
    const metadata = await featureGenerateMetadata({ params: Promise.resolve({ slug }) });
    assert(extractCanonical(metadata) === `/features/${slug}`, `Feature canonical is missing for ${slug}.`);
  }
}

async function main() {
  await validatePricingExposureRules();
  await validateFeatureExposureRules();
  await validatePricingCardsRules();
  await validateCanonicalRules();

  const noindexPricingSlugs = getAllTools()
    .filter((tool) => !getPricingPageExposure(tool.slug, tool).indexable)
    .map((tool) => tool.slug);

  const nonIndexableFeatureSlugs = getFeaturePageSlugs().filter((slug) => !isFeaturePageIndexable(slug));

  console.log('SEO rule validation passed.');
  console.log(`- Pricing pages forced noindex: ${noindexPricingSlugs.length > 0 ? noindexPricingSlugs.join(', ') : 'none'}`);
  console.log(`- Non-indexable feature pages: ${nonIndexableFeatureSlugs.length > 0 ? nonIndexableFeatureSlugs.join(', ') : 'none'}`);
  console.log(`- Pricing cards detail routes checked: ${getCanonicalPricingStaticParams().length}`);
}

main().catch((error) => {
  console.error('SEO rule validation failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
