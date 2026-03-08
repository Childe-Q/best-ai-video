'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import ToolCard from '@/components/features/ToolCard';
import { track } from '@/lib/features/track';
import { FeatureGroupDisplay, FeaturePageData, FeatureRecommendedReadingLink } from '@/types/featurePage';

interface FeatureHubPageProps {
  featureSlug: string;
  pageData: FeaturePageData;
  groups: FeatureGroupDisplay[];
  recommendedReadingLinks: FeatureRecommendedReadingLink[];
}

function getRecommendedSectionTitle(linkType: FeatureRecommendedReadingLink['linkType']): string {
  switch (linkType) {
    case 'tool':
      return 'Related tool reviews';
    case 'tool_alternatives':
      return 'Related alternatives';
    case 'vs':
      return 'Compare similar tools';
    case 'guide':
      return 'Related guides';
    default:
      return 'Related';
  }
}

const recommendedReadingOrder: FeatureRecommendedReadingLink['linkType'][] = ['tool', 'tool_alternatives', 'vs', 'guide'];

export default function FeatureHubPage({
  featureSlug,
  pageData,
  groups,
  recommendedReadingLinks,
}: FeatureHubPageProps) {
  const recommendedGroups = recommendedReadingOrder
    .map((linkType) => ({
      linkType,
      title: getRecommendedSectionTitle(linkType),
      items: recommendedReadingLinks.filter((item) => item.linkType === linkType),
    }))
    .filter((group) => group.items.length > 0);

  useEffect(() => {
    track('page_view', {
      page_type: 'feature_hub',
      feature_slug: featureSlug,
    });
  }, [featureSlug]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-600">
              <li>
                <Link href="/" className="transition-colors hover:text-gray-900">
                  Home
                </Link>
              </li>
              <li className="text-gray-400">→</li>
              <li>
                <Link href="/features" className="transition-colors hover:text-gray-900">
                  Features
                </Link>
              </li>
              <li className="text-gray-400">→</li>
              <li className="font-medium text-gray-900">{pageData.hero.h1}</li>
            </ol>
          </nav>

          <div className="rounded-[28px] border-2 border-black bg-[#D9F99D] p-8 shadow-[8px_8px_0px_0px_#000] sm:p-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-gray-700">Feature hub</p>
            <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              {pageData.hero.h1}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-700">{pageData.hero.subheadline}</p>

            {pageData.hero.definitionBullets.length > 0 && (
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {pageData.hero.definitionBullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="rounded-2xl border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000]"
                  >
                    <p className="text-sm font-medium leading-6 text-gray-800">{bullet}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        {pageData.howToChoose?.criteria?.length ? (
          <section className="rounded-3xl border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_#000] sm:p-10">
            <div className="mb-8 flex items-center gap-4">
              <h2 className="text-3xl font-bold text-gray-900">How to choose</h2>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {pageData.howToChoose.criteria.map((criterion) => (
                <div
                  key={criterion.title}
                  className="rounded-2xl border border-gray-200 bg-[#FFF7D6] p-5"
                >
                  <h3 className="text-lg font-bold text-gray-900">{criterion.title}</h3>
                  {criterion.desc && (
                    <p className="mt-3 text-sm leading-6 text-gray-700">{criterion.desc}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {groups.map((group) => (
          <section key={group.groupTitle} className="space-y-6">
            <div className="flex items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{group.groupTitle}</h2>
              </div>
            </div>

            {group.groupSummary && (
              <p className="max-w-3xl text-base leading-7 text-gray-600">{group.groupSummary}</p>
            )}

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {group.tools.map((tool, index) => (
                <ToolCard
                  key={`${group.groupTitle}-${tool.toolSlug}`}
                  tool={tool}
                  featureSlug={featureSlug}
                  groupTitle={group.groupTitle}
                  position={index + 1}
                />
              ))}
            </div>
          </section>
        ))}

        {recommendedReadingLinks.length > 0 && (
          <section className="rounded-3xl border-2 border-black bg-[#E0F2FE] p-8 shadow-[8px_8px_0px_0px_#000] sm:p-10">
            <div className="mb-8 flex items-center gap-4">
              <h2 className="text-3xl font-bold text-gray-900">Recommended Reading</h2>
              <div className="h-px flex-1 bg-sky-200" />
            </div>

            <div className="space-y-8">
              {recommendedGroups.map((group) => (
                <div key={group.linkType}>
                  <h3 className="mb-4 text-lg font-bold text-gray-900">{group.title}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {group.items.map((item) => (
                      <Link
                        key={`${item.linkType}-${item.destinationSlug}`}
                        href={item.href}
                        onClick={() =>
                          track('click_internal_link', {
                            link_type: item.linkType,
                            destination_slug: item.destinationSlug,
                            feature_slug: featureSlug,
                          })
                        }
                        className="rounded-2xl border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_#000] transition-all duration-200 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000]"
                      >
                        <p className="text-lg font-bold text-gray-900">{item.label}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
