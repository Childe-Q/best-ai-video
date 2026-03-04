import Link from 'next/link';
import { getTool } from '@/lib/getTool';
import { parseVsSlug } from '@/data/vs';

interface VsComingSoonProps {
  slug: string;
  toolASlug?: string | null;
  toolBSlug?: string | null;
  recommendedSlugs: string[];
  updateMonthLabel: string;
}

function toTitleCase(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getToolName(slug?: string | null): string {
  if (!slug) return 'Tool A';
  const tool = getTool(slug);
  return tool?.name ?? toTitleCase(slug);
}

function getComparisonLabel(slug: string): string {
  const parsed = parseVsSlug(slug);
  if (!parsed) {
    return toTitleCase(slug);
  }
  return `${getToolName(parsed.slugA)} vs ${getToolName(parsed.slugB)}`;
}

export default function VsComingSoon({
  slug,
  toolASlug,
  toolBSlug,
  recommendedSlugs,
  updateMonthLabel,
}: VsComingSoonProps) {
  const hasParsedTools = Boolean(toolASlug && toolBSlug);
  const toolAName = getToolName(toolASlug);
  const toolBName = getToolName(toolBSlug);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-gray-200 bg-white p-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            {hasParsedTools
              ? `${toolAName} vs ${toolBName} — Comparison coming soon`
              : 'AI video tools — Comparison coming soon'}
          </h1>
          <p className="mt-3 text-sm text-gray-700">
            We are preparing this comparison and plan to update it in {updateMonthLabel}.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Link
              href={toolASlug ? `/tool/${toolASlug}` : '/vs'}
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 hover:border-indigo-400"
            >
              {toolAName} full review
            </Link>
            <Link
              href={toolBSlug ? `/tool/${toolBSlug}` : '/vs'}
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 hover:border-indigo-400"
            >
              {toolBName} full review
            </Link>
            <Link
              href="/vs"
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              Compare hub: /vs
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-8">
          <h2 className="text-xl font-bold text-gray-900">Recommended comparisons</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {recommendedSlugs.slice(0, 6).map((item) => (
              <Link
                key={`${slug}-${item}`}
                href={`/vs/${item}`}
                className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-indigo-700 hover:border-indigo-400"
              >
                {getComparisonLabel(item)} →
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-8">
          <h2 className="text-xl font-bold text-gray-900">Explore alternatives</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href={toolASlug ? `/tool/${toolASlug}/alternatives` : '/vs'}
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 hover:border-indigo-400"
            >
              {toolAName} alternatives
            </Link>
            <Link
              href={toolBSlug ? `/tool/${toolBSlug}/alternatives` : '/vs'}
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 hover:border-indigo-400"
            >
              {toolBName} alternatives
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
