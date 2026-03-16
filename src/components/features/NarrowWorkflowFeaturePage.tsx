'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import ToolCard from '@/components/features/ToolCard';
import FeaturesFAQ from '@/components/features/FeaturesFAQ';
import { track } from '@/lib/features/track';
import {
  FeatureFaqItem,
  FeatureGroupDisplay,
  FeaturePageData,
  FeatureRecommendedReadingLink,
} from '@/types/featurePage';

interface NarrowWorkflowFeaturePageProps {
  featureSlug: string;
  pageData: FeaturePageData;
  groups: FeatureGroupDisplay[];
  recommendedReadingLinks: FeatureRecommendedReadingLink[];
}

type FitCheckCard = {
  title: string;
  summary: string;
  href: string;
  label: string;
};

type DecisionFrameCard = {
  title: string;
  summary: string;
};

type WorkflowSectionOverride = {
  chooseWhen: string;
  disappoints: string;
  contextualExits: Array<{
    href: string;
    label: string;
    note: string;
  }>;
};

type NarrowWorkflowOverride = {
  fitHeading: string;
  fitSummary: string;
  keyAxes: string[];
  fitCards: FitCheckCard[];
  decisionFrameCards: DecisionFrameCard[];
  sectionOverrides: Record<string, WorkflowSectionOverride>;
  faqItems: FeatureFaqItem[];
};

type ReadingGroup = {
  title: string;
  items: FeatureRecommendedReadingLink[];
};

function getRecommendedSectionTitle(linkType: FeatureRecommendedReadingLink['linkType']): string {
  switch (linkType) {
    case 'tool':
      return 'Related reviews';
    case 'tool_alternatives':
      return 'Related alternatives';
    case 'vs':
      return 'Related comparisons';
    case 'guide':
      return 'Related guides';
    default:
      return 'Related';
  }
}

const readingOrder: FeatureRecommendedReadingLink['linkType'][] = ['tool', 'tool_alternatives', 'vs', 'guide'];

const narrowWorkflowOverrides: Partial<Record<string, NarrowWorkflowOverride>> = {
  'text-to-video-ai-tools': {
    fitHeading: 'Stay here only if the workflow really starts from a prompt',
    fitSummary:
      'Use this page only if you already know the workflow starts from a prompt and the output should be generated from scratch. If you already have source material, need a presenter, or want a broader discovery page, you should exit early.',
    keyAxes: ['prompt adherence', 'clip length', 'commercial rights', 'scene quality', 'workflow fit'],
    fitCards: [
      {
        title: 'Stay here if you need net-new scene generation',
        summary:
          'This is the right route when the job is prompt-driven footage: cinematic B-roll, concept scenes, product visuals, or short clips that do not start from an existing recording.',
        href: '#cinematic-text-to-video',
        label: 'Go to the shortlist',
      },
      {
        title: 'Leave for repurposing if you already have source material',
        summary:
          'If you are converting articles, webinars, podcasts, or long-form footage into video, text-to-video is the wrong first page. Start with the repurposing workflow instead.',
        href: '/features/content-repurposing-ai-tools',
        label: 'Go to repurposing',
      },
      {
        title: 'Leave for avatars if a speaker matters more than scenes',
        summary:
          'If the output needs a presenter, lip-sync, or multilingual on-screen delivery, text-to-video is usually the wrong workflow. Start with avatar tools instead.',
        href: '/features/ai-avatar-video-generators',
        label: 'Go to avatar tools',
      },
    ],
    decisionFrameCards: [
      {
        title: 'Prompt adherence',
        summary:
          'Start by asking whether the model actually follows scene instructions or drifts. If prompt control is weak, the rest of the comparison usually does not matter.',
      },
      {
        title: 'Clip length and usable output',
        summary:
          'A model that looks impressive in demos may still fail if each generation is too short for your real workflow. Check usable clip length before price.',
      },
      {
        title: 'Commercial readiness',
        summary:
          'Rights, watermarks, and production posture matter early here. A model can be visually strong and still be the wrong first choice for paid work.',
      },
    ],
    sectionOverrides: {
      'Cinematic text-to-video': {
        chooseWhen:
          'Choose this shortlist when the footage must be generated from scratch and the priority is scene quality, motion control, or prompt-driven output rather than converting existing content or putting a presenter on screen.',
        disappoints:
          'Leave this route if you actually need article-to-video conversion, clipping from long-form recordings, or a talking-head avatar workflow. Text-to-video is the wrong lane once source material or presenter delivery becomes the real job.',
        contextualExits: [
          {
            href: '/features/content-repurposing-ai-tools',
            label: 'Already have source material?',
            note: 'Go there if the workflow starts with a blog, webinar, podcast, or existing footage.',
          },
          {
            href: '/features/ai-avatar-video-generators',
            label: 'Need a presenter instead?',
            note: 'Use the avatar guide if message delivery matters more than scene generation.',
          },
          {
            href: '/features/ai-video-generators-comparison',
            label: 'Ready for head-to-head model comparison?',
            note: 'Move there once you are comparing generator-to-generator tradeoffs instead of workflow fit.',
          },
        ],
      },
    },
    faqItems: [
      {
        question: 'Do I actually need text-to-video, or is repurposing a better route?',
        answer:
          'Use text-to-video only when the output begins from a prompt and the footage has to be generated from scratch. If you already have an article, webinar, podcast, or long-form recording, repurposing is usually the better first route.',
      },
      {
        question: 'When is text-to-video better than avatar tools?',
        answer:
          'Use text-to-video when scenes, B-roll, or visual storytelling are carrying the message. Use avatar tools when a speaker, lip-sync, or multilingual presenter format is doing the real work.',
      },
      {
        question: 'What matters most: prompt adherence, clip length, or generation cost?',
        answer:
          'Start with prompt adherence, because a cheaper model is still a bad fit if it cannot reliably follow the scene you asked for. Then check clip length, then cost. Rights and production posture should enter before you commit to a real workflow.',
      },
      {
        question: 'Which tools are strongest for scene generation versus quick experiments?',
        answer:
          'Start with Sora or Runway when scene quality and control matter most. Start with Kling when you care more about faster, high-energy output and want a lighter entry point for experiments.',
      },
      {
        question: 'When should I stop using this page and move to direct comparison?',
        answer:
          'Move to direct comparison once you are no longer deciding whether text-to-video is the right workflow. If you are already comparing model-to-model tradeoffs, this page has done its job and the comparison page becomes more useful.',
      },
    ],
  },
  'content-repurposing-ai-tools': {
    fitHeading: 'Stay here only if the workflow starts with content you already have',
    fitSummary:
      'Use this page only if the job starts with an existing asset: a blog post, script, webinar, podcast, interview, or long-form recording. If you are generating scenes from scratch or need a presenter-led delivery format first, exit early instead of over-reading repurposing tools.',
    keyAxes: ['source format', 'transcript editing', 'automation quality', 'commercial use', 'workflow fit'],
    fitCards: [
      {
        title: 'Stay here if you are converting existing content into video',
        summary:
          'This is the right route when the asset already exists and the job is to turn it into another format: article to video, script to video, webinar to shorts, or podcast to clips.',
        href: '#article-and-script-conversion',
        label: 'Go to the shortlist',
      },
      {
        title: 'Leave for text-to-video if you are starting from a blank prompt',
        summary:
          'If there is no article, recording, or source transcript to work from, repurposing is the wrong first page. Start with text-to-video instead of forcing a conversion workflow.',
        href: '/features/text-to-video-ai-tools',
        label: 'Go to text-to-video',
      },
      {
        title: 'Leave for avatars if presenter delivery matters more than source conversion',
        summary:
          'If the real job is a talking-head explainer, training presenter, or multilingual spokesperson format, avatar tools are usually the better first route than repurposing software.',
        href: '/features/ai-avatar-video-generators',
        label: 'Go to avatar tools',
      },
    ],
    decisionFrameCards: [
      {
        title: 'Source format first',
        summary:
          'Decide whether the starting asset is text or long-form audio/video before anything else. Article-to-video and long-form clipping are different workflows, and the wrong bucket wastes time fast.',
      },
      {
        title: 'Transcript editing and clip extraction',
        summary:
          'For podcasts, webinars, and interviews, transcript quality matters early. If the tool cannot reliably cut, caption, and surface usable moments, the rest of the feature list matters less.',
      },
      {
        title: 'Automation quality versus output control',
        summary:
          'Some tools win on fast stock-media assembly from text, while others win on finding short-form moments inside recordings. Check what kind of automation you actually need before price becomes the first filter.',
      },
    ],
    sectionOverrides: {
      'Article and script conversion': {
        chooseWhen:
          'Choose this shortlist when the source asset is written content: a blog post, script, article, or document that needs to become a video without starting from a blank prompt.',
        disappoints:
          'Leave this route if the real asset is a webinar, podcast, live stream, or other long-form recording that needs clipping. It is also the wrong lane if you actually need net-new scene generation or a presenter-led avatar workflow.',
        contextualExits: [
          {
            href: '/features/content-repurposing-ai-tools#long-form-video-clipping',
            label: 'Actually starting from long-form recordings?',
            note: 'Jump to the clipping route if the source is a webinar, podcast, or interview instead of written text.',
          },
          {
            href: '/features/text-to-video-ai-tools',
            label: 'No source asset yet?',
            note: 'Use text-to-video if the project starts from a prompt rather than an existing article or script.',
          },
          {
            href: '/features/ai-avatar-video-generators',
            label: 'Need a presenter-led format?',
            note: 'Start with avatar tools if delivery, narration, or on-screen spokesperson format matters more than source conversion.',
          },
        ],
      },
      'Long-form video clipping': {
        chooseWhen:
          'Choose this shortlist when the source asset is an existing recording and the job is to pull out publishable clips for short-form channels without manual timeline editing.',
        disappoints:
          'Leave this route if you are starting from text, scripts, or documents. It is also the wrong lane if the job is generating scenes from scratch rather than extracting moments from a real recording.',
        contextualExits: [
          {
            href: '/features/content-repurposing-ai-tools#article-and-script-conversion',
            label: 'Actually converting written content?',
            note: 'Jump back to article and script conversion if the asset is text, not a long recording.',
          },
          {
            href: '/features/text-to-video-ai-tools',
            label: 'Need net-new scenes instead?',
            note: 'Use text-to-video if there is no webinar, podcast, or long-form footage to clip from.',
          },
          {
            href: '/features/best-ai-video-generators',
            label: 'Free of the repurposing constraint?',
            note: 'Go back to the broader generators shortlist if source-material conversion is no longer the main constraint.',
          },
        ],
      },
    },
    faqItems: [
      {
        question: 'Do I actually need repurposing, or is text-to-video a better route?',
        answer:
          'Use repurposing when the workflow begins with something you already have: an article, script, webinar, podcast, or long-form recording. Use text-to-video when the workflow starts from a prompt and the footage needs to be generated from scratch.',
      },
      {
        question: 'Should I start with article-to-video tools or long-form clipping tools?',
        answer:
          'Start with article-to-video tools when the source is text. Start with long-form clipping tools when the source is a recorded webinar, interview, live stream, or podcast. The source format should decide the first bucket, not pricing.',
      },
      {
        question: 'When is transcript-based editing the deciding factor?',
        answer:
          'Transcript-based editing matters most when the source is spoken content. If you are repurposing webinars, podcasts, or interviews, weak transcript editing usually creates more cleanup work than it saves.',
      },
      {
        question: 'Which tools are strongest for blog or script conversion versus clipping recordings?',
        answer:
          'Start with Pictory or Lumen5 when the asset is written content that needs scenes, stock media, and voiceover packaging. Start with Opus Clip or Munch when the job is pulling short moments from a long recording.',
      },
      {
        question: 'When should I leave this page and move to direct comparison or a broader shortlist?',
        answer:
          'Leave this page once you are no longer deciding whether repurposing is the right workflow. If you are comparing generators head-to-head, use the comparison page. If the source-material constraint is no longer the main filter, go back to the broader generators shortlist.',
      },
    ],
  },
};

export default function NarrowWorkflowFeaturePage({
  featureSlug,
  pageData,
  groups,
  recommendedReadingLinks,
}: NarrowWorkflowFeaturePageProps) {
  const override = narrowWorkflowOverrides[pageData.slug];

  useEffect(() => {
    track('page_view', {
      page_type: 'feature_narrow_workflow',
      feature_slug: featureSlug,
    });
  }, [featureSlug]);

  if (!override) {
    return null;
  }

  const recommendedGroups: ReadingGroup[] = readingOrder
    .map((linkType) => ({
      title: getRecommendedSectionTitle(linkType),
      items: recommendedReadingLinks.filter((item) => item.linkType === linkType),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div
      className="min-h-screen bg-[#F9FAFB] pb-24 text-gray-900"
      data-feature-page-type={pageData.meta.pageType}
      data-feature-primary-surface={pageData.meta.modules.primarySurface}
    >
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

          <div className="rounded-[28px] border-2 border-black bg-[#E7F7DA] p-8 shadow-[8px_8px_0px_0px_#000] sm:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-700">Workflow guide</p>
              <span className="rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700">
                Stay only if this is the right route
              </span>
            </div>

            <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              {pageData.hero.h1}
            </h1>
            <p className="mt-5 max-w-4xl text-lg leading-8 text-gray-700">{pageData.hero.subheadline}</p>

            <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="rounded-2xl border border-black/15 bg-white/85 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Scope and rule</p>
                <p className="mt-3 text-sm leading-7 text-gray-800">{pageData.meta.primaryClassificationRule}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {pageData.hero.definitionBullets.map((bullet) => (
                    <span
                      key={bullet}
                      className="rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700"
                    >
                      {bullet}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-black/15 bg-white/85 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">What matters most</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {override.keyAxes.map((axis) => (
                    <span
                      key={axis}
                      className="rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700"
                    >
                      {axis}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Is this the right route?</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">{override.fitHeading}</h2>
            <p className="mt-4 text-base leading-8 text-gray-600">{override.fitSummary}</p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {override.fitCards.map((card) => (
              <article key={card.title} className="rounded-2xl border border-gray-200 bg-[#FCFBF7] p-5">
                <h3 className="text-xl font-bold text-gray-900">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-700">{card.summary}</p>
                <div className="mt-4">
                  <Link href={card.href} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                    {card.label}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Before you shortlist</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Use these checks before you over-read the page</h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {override.decisionFrameCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">{card.title}</p>
                <p className="mt-3 text-sm leading-7 text-gray-700">{card.summary}</p>
              </div>
            ))}
          </div>
        </section>

        {groups.map((group) => {
          const sectionOverride = override.sectionOverrides[group.groupTitle];

          return (
            <section key={group.groupTitle} id={group.groupTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')} className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Main shortlist</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">{group.groupTitle}</h2>
              {group.groupSummary ? (
                <p className="mt-4 max-w-3xl text-base leading-8 text-gray-600">{group.groupSummary}</p>
              ) : null}

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Use this shortlist when</p>
                  <p className="mt-2 text-sm leading-7 text-gray-700">{sectionOverride?.chooseWhen}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Exit this route when</p>
                  <p className="mt-2 text-sm leading-7 text-gray-700">{sectionOverride?.disappoints}</p>
                </div>
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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

              {sectionOverride?.contextualExits?.length ? (
                <div className="mt-8 border-t border-gray-200 pt-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Contextual exits</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {sectionOverride.contextualExits.map((item) => (
                      <Link
                        key={`${group.groupTitle}-${item.href}`}
                        href={item.href}
                        onClick={() =>
                          track('click_internal_link', {
                            link_type: 'guide',
                            destination_slug: item.href.replace(/^\/+/, ''),
                            feature_slug: featureSlug,
                          })
                        }
                        className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-3 space-y-2">
                    {sectionOverride.contextualExits.map((item) => (
                      <p key={`${group.groupTitle}-${item.note}`} className="text-sm text-gray-500">
                        {item.note}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}

        {override.faqItems.length > 0 && (
          <section className="rounded-3xl border border-black/10 bg-[#F3F1EA] p-8 shadow-sm sm:p-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">FAQ</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">Questions that usually decide whether this workflow is right</h2>
            </div>

            <div className="mt-8">
              <FeaturesFAQ items={override.faqItems} />
            </div>
          </section>
        )}

        {recommendedGroups.length > 0 && (
          <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Further reading</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">Keep going only if this workflow still fits</h2>
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-2">
              {recommendedGroups.map((group) => (
                <div key={group.title}>
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
                        className="rounded-full border border-gray-200 bg-[#F9FAFB] px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                      >
                        {item.label}
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
