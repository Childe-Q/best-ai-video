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
import { getFeaturePageSlugs, readFeaturePageData } from '@/lib/features/readFeaturePageData';
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

function hasReadableText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasPlaceholderSignal(value: string): boolean {
  return /\b(TBD|placeholder|undefined|N\/A)\b/i.test(value);
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

function validateVisibleFeatureContentRules() {
  for (const slug of getFeaturePageSlugs()) {
    const pageData = readFeaturePageData(slug);
    assert(pageData, `Feature page data should be readable for ${slug}.`);

    assert(hasReadableText(pageData.hero.h1), `Feature hero h1 is empty for ${slug}.`);
    assert(hasReadableText(pageData.hero.subheadline), `Feature hero subheadline is empty for ${slug}.`);

    for (const [index, bullet] of pageData.hero.definitionBullets.entries()) {
      assert(hasReadableText(bullet), `Feature hero bullet ${index} is empty for ${slug}.`);
      assert(!hasPlaceholderSignal(bullet), `Feature hero bullet ${index} has placeholder text for ${slug}.`);
    }

    for (const [index, criterion] of (pageData.howToChoose?.criteria ?? []).entries()) {
      assert(hasReadableText(criterion.title), `Feature checklist card ${index} title is empty for ${slug}.`);
      assert(hasReadableText(criterion.desc), `Feature checklist card ${index} description is empty for ${slug}.`);
      assert(!hasPlaceholderSignal(criterion.title), `Feature checklist card ${index} title has placeholder text for ${slug}.`);
      assert(!hasPlaceholderSignal(criterion.desc), `Feature checklist card ${index} description has placeholder text for ${slug}.`);
    }

    assert(pageData.groups.length > 0, `Feature page has no rendered tool groups for ${slug}.`);
    for (const [groupIndex, group] of pageData.groups.entries()) {
      assert(hasReadableText(group.groupTitle), `Feature tool group ${groupIndex} title is empty for ${slug}.`);
      assert(group.tools.length > 0, `Feature tool group ${group.groupTitle} has no tools for ${slug}.`);

      for (const [toolIndex, tool] of group.tools.entries()) {
        assert(hasReadableText(tool.toolSlug), `Feature tool card ${toolIndex} slug is empty in ${group.groupTitle} for ${slug}.`);
        assert(hasReadableText(tool.reasonLine1), `Feature tool card ${tool.toolSlug} rationale is empty for ${slug}.`);
        assert(!hasPlaceholderSignal(tool.reasonLine1), `Feature tool card ${tool.toolSlug} rationale has placeholder text for ${slug}.`);
      }
    }

    for (const [index, item] of (pageData.faq ?? []).entries()) {
      assert(hasReadableText(item.question), `Feature FAQ ${index} question is empty for ${slug}.`);
      assert(hasReadableText(item.answer), `Feature FAQ ${index} answer is empty for ${slug}.`);
      assert(!hasPlaceholderSignal(item.question), `Feature FAQ ${index} question has placeholder text for ${slug}.`);
      assert(!hasPlaceholderSignal(item.answer), `Feature FAQ ${index} answer has placeholder text for ${slug}.`);
    }

    const recommendedReading = pageData.recommendedReading;
    if (recommendedReading) {
      for (const key of ['tools', 'alternativesPages', 'vsPages', 'guides'] as const) {
        for (const [index, destination] of (recommendedReading[key] ?? []).entries()) {
          assert(hasReadableText(destination), `Feature recommendedReading.${key}[${index}] is empty for ${slug}.`);
          assert(
            !hasPlaceholderSignal(destination),
            `Feature recommendedReading.${key}[${index}] has placeholder text for ${slug}.`
          );
        }
      }
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
  validateVisibleFeatureContentRules();
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
