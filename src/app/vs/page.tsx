import Link from 'next/link';
import { getSEOCurrentYear } from '@/lib/utils';
import {
  getComparisonLibraryCards,
  getGroupedVsCards,
  getPrimaryStartingPointCards,
  listVsIndexCards,
  VS_INDEX_TRACK_GUIDES,
  VsIndexCard,
} from '@/lib/vsIndex';

const seoYear = getSEOCurrentYear();

export const metadata = {
  title: `AI Video Tool Comparisons | Side-by-Side Comparisons ${seoYear}`,
  description:
    'Find the right AI video tool comparison for your buying situation. Source-backed head-to-head pages with structured decision tables and explainable scoring.',
  alternates: {
    canonical: 'https://best-ai-video.com/vs',
  },
};

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/40">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-black text-gray-900 md:text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-black/52">{description}</p>
    </div>
  );
}

function StartingPointCard({ comparison }: { comparison: VsIndexCard }) {
  return (
    <Link
      href={`/vs/${comparison.slug}`}
      className="group flex h-full flex-col rounded-[1.4rem] border border-black/8 bg-white px-6 py-5 no-underline transition-all duration-200 ease-out hover:-translate-y-1 hover:border-black/14 hover:shadow-[0_12px_28px_rgba(0,0,0,0.04)]"
    >
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/38">
        {comparison.intentLabel}
      </p>
      <h3 className="mt-3 text-xl font-black leading-tight text-gray-900 transition-colors duration-200 group-hover:text-black/70">
        {comparison.comparisonName}
      </h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-black/58">{comparison.decisionLine}</p>
      {comparison.startingPointReason ? (
        <p className="mt-4 max-w-md text-[13px] leading-6 text-black/42">
          {comparison.startingPointReason}
        </p>
      ) : null}
      <span className="mt-auto inline-flex items-center pt-5 text-sm font-bold text-black">
        <span className="border-b border-black/25 transition-colors duration-200 group-hover:border-black">
          Open comparison
        </span>
        <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
      </span>
    </Link>
  );
}

function WorkflowLinkCard({ comparison }: { comparison: VsIndexCard }) {
  return (
    <Link
      href={`/vs/${comparison.slug}`}
      className="group block rounded-xl px-3 py-3 no-underline transition-colors duration-200 hover:bg-black/[0.025]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="text-[15px] font-bold text-gray-900 transition-colors duration-200 group-hover:text-black/70">
            {comparison.comparisonName}
          </h4>
          <p className="mt-2 text-sm leading-6 text-black/47">{comparison.decisionLine}</p>
        </div>
        <span className="pt-1 text-sm font-semibold text-black/24 transition-colors duration-200 group-hover:text-black/50">
          &rarr;
        </span>
      </div>
    </Link>
  );
}

export default function VSIndexPage() {
  const comparisons = listVsIndexCards();
  const startingPoints = getPrimaryStartingPointCards(comparisons);
  const workflowGroups = getGroupedVsCards(comparisons);
  const comparisonLibrary = getComparisonLibraryCards(comparisons);

  return (
    <div className="min-h-screen bg-[#FCFBF7] pb-16">
      <header className="relative overflow-hidden border-b border-black/10 bg-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top_right,_rgba(184,245,0,0.10),_transparent_48%),radial-gradient(circle_at_12%_24%,_rgba(246,210,0,0.08),_transparent_34%)]" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-black/10 bg-white/90 px-4 py-2 text-xs font-bold tracking-[0.16em] text-black/70 backdrop-blur">
              COMPARISON HUB
            </span>

            <h1 className="mt-5 text-4xl font-black tracking-[-0.02em] text-gray-900 md:text-5xl lg:text-6xl">
              Find the right AI video
              <span className="block">head-to-head to open next</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-gray-600 md:text-lg">
              Use `/vs` to compare AI video tools after the workflow is clear. This page is here to
              move you into the right two-tool decision, not make you browse a loose stack of
              unrelated matchups.
            </p>
          </div>

          <div className="mt-8 border-t border-black/8 pt-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/35">Use this page when</p>
                <p className="mt-2 text-sm leading-6 text-black/55">
                  The workflow is already clear and the next job is one direct AI video software
                  comparison between credible tools.
                </p>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/35">If you are not there yet</p>
                <p className="mt-2 text-sm leading-6 text-black/55">
                  Start with{' '}
                  <Link href="/features" className="font-semibold text-black no-underline hover:text-black/65">
                    feature pages
                  </Link>{' '}
                  if the workflow is still fuzzy. If the pair is already obvious, jump straight to
                  the{' '}
                  <a href="#comparison-library" className="font-semibold text-black no-underline hover:text-black/65">
                    library
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <section className="mb-16">
          <SectionIntro
            eyebrow="Choose the track"
            title="Which comparison track fits the buying situation?"
            description="Pick the lane that changes the buying criteria first. If the lane is wrong, the comparison will be wrong too."
          />

          <div className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2">
            <div className="max-w-xl">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/38">
                Avatar comparisons
              </p>
              <p className="mt-2 text-sm leading-6 text-black/52">{VS_INDEX_TRACK_GUIDES.avatar.useWhen}</p>
              <p className="mt-2 text-[13px] leading-6 text-black/38">
                {VS_INDEX_TRACK_GUIDES.avatar.notFor}
              </p>
            </div>
            <div className="max-w-xl">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/38">
                Editing comparisons
              </p>
              <p className="mt-2 text-sm leading-6 text-black/52">{VS_INDEX_TRACK_GUIDES.editor.useWhen}</p>
              <p className="mt-2 text-[13px] leading-6 text-black/38">
                {VS_INDEX_TRACK_GUIDES.editor.notFor}
              </p>
            </div>
            <div className="max-w-xl">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/38">
                Text-to-video comparisons
              </p>
              <p className="mt-2 text-sm leading-6 text-black/52">{VS_INDEX_TRACK_GUIDES.text.useWhen}</p>
              <p className="mt-2 text-[13px] leading-6 text-black/38">
                {VS_INDEX_TRACK_GUIDES.text.notFor}
              </p>
            </div>
            <div className="max-w-xl">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/38">
                Repurposing comparisons
              </p>
              <p className="mt-2 text-sm leading-6 text-black/52">{VS_INDEX_TRACK_GUIDES.repurpose.useWhen}</p>
              <p className="mt-2 text-[13px] leading-6 text-black/38">
                {VS_INDEX_TRACK_GUIDES.repurpose.notFor}
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-3xl text-[13px] leading-6 text-black/38">
            If none fits cleanly, go back to{' '}
            <Link href="/features" className="font-semibold text-black/55 no-underline hover:text-black/70">
              feature selection
            </Link>
            . If one fits, the starting points below become much more useful.
          </p>
        </section>

        <section id="starting-points" className="mb-14">
          <SectionIntro
            eyebrow="Best starting points"
            title="Start with these comparisons"
            description="These four are the best AI video comparisons to open first when the track is clear. Each works as a reliable first stop for one workflow family."
          />

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {startingPoints.map((comparison) => (
              <StartingPointCard key={comparison.slug} comparison={comparison} />
            ))}
          </div>
        </section>

        <section id="browse-by-workflow" className="mb-12 border-t border-black/6 pt-10">
          <SectionIntro
            eyebrow="Browse by workflow"
            title="Keep browsing only inside the right track"
            description="Use these lists only when the track is already right and the remaining question is which head-to-head to open next."
          />

          <div className="mt-8 grid gap-x-10 gap-y-12 xl:grid-cols-2">
            {workflowGroups.map((group) => (
              <section
                key={group.intent}
                id={group.anchorId}
                className="pb-1"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="max-w-xl">
                    <h3 className="text-lg font-black text-gray-900">{group.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-black/50">{group.helper}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-1.5">
                  {group.items.map((comparison) => (
                    <WorkflowLinkCard key={comparison.slug} comparison={comparison} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section id="comparison-library" className="border-t border-black/6 pt-10">
          <SectionIntro
            eyebrow="Library"
            title="All comparisons"
            description="Index of all live AI video tool comparisons. Best when the pair is already clear and you only need the right route."
          />

          <div className="mt-8 grid gap-x-8 gap-y-1 md:grid-cols-2 xl:grid-cols-3">
            {comparisonLibrary.map((comparison) => (
              <Link
                key={comparison.slug}
                href={`/vs/${comparison.slug}`}
                className="group flex items-center justify-between gap-4 rounded-lg px-2 py-3 no-underline transition-colors duration-200 hover:bg-black/[0.025]"
              >
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold text-gray-900 transition-colors duration-200 group-hover:text-black/70">
                    {comparison.comparisonName}
                  </h3>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-black/35">
                    {comparison.intentLabel}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-black/22 transition-colors duration-200 group-hover:text-black/48">
                  &rarr;
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 border-t border-black/6 pt-10">
          <SectionIntro
            eyebrow="FAQ"
            title="Quick answers before you open a comparison"
            description="Short answers to the search questions that usually show up before someone chooses a vs page."
          />

          <div className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2">
            <div className="max-w-xl">
              <h3 className="text-[15px] font-bold text-gray-900">
                When should I use a vs page instead of a feature page?
              </h3>
              <p className="mt-2 text-sm leading-6 text-black/52">
                Use a vs page when the workflow is already fixed and you need one direct AI video
                software comparison between two credible tools. Use a feature page when you are
                still deciding what kind of tool the job needs.
              </p>
            </div>
            <div className="max-w-xl">
              <h3 className="text-[15px] font-bold text-gray-900">
                Should I compare tools before choosing the workflow?
              </h3>
              <p className="mt-2 text-sm leading-6 text-black/52">
                Usually no. Most low-value AI video tool comparisons happen because the workflow is
                still mixed up. Narrow the workflow first, then compare AI video tools inside that
                lane.
              </p>
            </div>
            <div className="max-w-xl">
              <h3 className="text-[15px] font-bold text-gray-900">
                What is the difference between avatar and text-to-video comparisons?
              </h3>
              <p className="mt-2 text-sm leading-6 text-black/52">
                Avatar comparisons are about presenter-led delivery. Text-to-video comparisons are
                about generating net-new scenes from prompts, scripts, or narration. They solve
                different buying questions, so they should not share the same shortlist.
              </p>
            </div>
            <div className="max-w-xl">
              <h3 className="text-[15px] font-bold text-gray-900">
                What if I already know the pair?
              </h3>
              <p className="mt-2 text-sm leading-6 text-black/52">
                Go straight to the library. It is the fastest route when the pair is already clear
                and you just need the right AI video tool comparison page.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
