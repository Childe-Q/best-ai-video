'use client';

import Link from 'next/link';
import { track } from '@/lib/features/track';
import { FeatureRecommendedReadingLink } from '@/types/featurePage';

type FeatureNextStepsGroup = {
  title: string;
  items: FeatureRecommendedReadingLink[];
};

interface FeatureNextStepsProps {
  featureSlug: string;
  title: string;
  intro: string;
  groups: FeatureNextStepsGroup[];
}

export default function FeatureNextSteps({
  featureSlug,
  title,
  intro,
  groups,
}: FeatureNextStepsProps) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-black/8 bg-white px-6 py-7 shadow-sm sm:px-8 sm:py-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Next steps</p>
        <h2 className="mt-3 text-3xl font-bold text-gray-900">{title}</h2>
        <p className="mt-4 text-base leading-8 text-gray-600">{intro}</p>
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        {groups.map((group) => (
          <div key={group.title} className="rounded-[1.5rem] border border-gray-200 bg-[#F9FAFB] px-5 py-5">
            <h3 className="text-lg font-bold text-gray-900">{group.title}</h3>
            <div className="mt-4 flex flex-wrap gap-3">
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
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
