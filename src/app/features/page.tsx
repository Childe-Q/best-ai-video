import Link from 'next/link';
import { Metadata } from 'next';
import { canonicalizeVsHref } from '@/data/vs';
import { categories } from '@/data/categories';
import { getSEOCurrentYear } from '@/lib/utils';

const seoYear = getSEOCurrentYear();

type QuickRoute = {
  title: string;
  detail: string;
  href: string;
  cta: string;
};

type RouteCard = {
  slug: string;
  shortTitle: string;
  bestFor: string;
  chooseWhen: string;
  nextHref: string;
  nextLabel: string;
  nextNote: string;
  cta: string;
};

type WorkflowSection = {
  title: string;
  intro: string;
  cards: RouteCard[];
};

function stripYear(title: string): string {
  return title.replace(/\s*\(\d{4}\)\s*$/, '').trim();
}

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getFeatureTitle(slug: string, fallback: string): string {
  const category = categories.find((item) => item.slug === slug);
  return category ? stripYear(category.title) : fallback || titleFromSlug(slug);
}

const quickRoutes: QuickRoute[] = [
  {
    title: 'Need a presenter on screen',
    detail:
      'Start here when the video depends on a face, voice, and delivery style, not just stock scenes or automated clip assembly.',
    href: '/features/ai-avatar-video-generators',
    cta: 'See avatar tools',
  },
  {
    title: 'Starting from text or a script',
    detail:
      'Use this route when the source is a prompt, article, or written script and the real question is generation quality and control.',
    href: '/features/text-to-video-ai-tools',
    cta: 'Start with text-to-video',
  },
  {
    title: 'Repurposing existing content',
    detail:
      'Open this path if you already have blogs, webinars, podcasts, interviews, or long videos and need conversion, not blank-page creation.',
    href: '/features/content-repurposing-ai-tools',
    cta: 'Browse repurposing tools',
  },
  {
    title: 'Buying for a team',
    detail:
      'Go here when approvals, localization, admin controls, security, or procurement will shape the tool decision before creative features do.',
    href: '/features/enterprise-ai-video-solutions',
    cta: 'Explore enterprise picks',
  },
];

const workflowSections: WorkflowSection[] = [
  {
    title: 'Create from scratch',
    intro:
      'Choose this cluster when the job starts from a blank page, prompt, or script rather than existing footage. The main decision is whether you need a broad market overview, a direct text-to-video route, or a tighter head-to-head comparison between leading generation models.',
    cards: [
      {
        slug: 'best-ai-video-generators',
        shortTitle: 'Best AI video generators',
        bestFor:
          'A first shortlist when you know you need AI generation but still need to separate cinematic, avatar, and social-first routes.',
        chooseWhen:
          'Choose this when you are still narrowing the field and need a practical overview before committing to one workflow family.',
        nextHref: '/tool/runway',
        nextLabel: 'Then open the Runway review',
        nextNote: 'A strong next click once quality, model breadth, and generation control are part of the decision.',
        cta: 'See top generators',
      },
      {
        slug: 'text-to-video-ai-tools',
        shortTitle: 'Text-to-video tools',
        bestFor:
          'Prompt-first workflows where the real question is scene generation, prompt adherence, realism, and commercial use.',
        chooseWhen:
          'Choose this when the source starts as text and you do not need a presenter, transcript editor, or repurposing pipeline.',
        nextHref: canonicalizeVsHref('/vs/runway-vs-sora'),
        nextLabel: 'Compare Runway vs Sora',
        nextNote: 'A useful next step when you are already deciding between the leading cinematic model routes.',
        cta: 'Start with text-to-video',
      },
      {
        slug: 'ai-video-generators-comparison',
        shortTitle: 'Model comparison',
        bestFor:
          'Specification-level comparison across leading video models when speed, resolution, API posture, and realism matter more than surface features.',
        chooseWhen:
          'Choose this when you are past broad discovery and need to compare the strongest generation models directly.',
        nextHref: canonicalizeVsHref('/vs/runway-vs-sora'),
        nextLabel: 'Go straight to a model matchup',
        nextNote: 'Best once the decision is down to a small number of credible finalists.',
        cta: 'Compare leading options',
      },
    ],
  },
  {
    title: 'Presenter and avatar workflows',
    intro:
      'Start here when the video works because someone is clearly speaking to the viewer. These routes are for training, onboarding, demos, sales messaging, multilingual updates, and any workflow where trust, delivery, and lip-sync matter more than automated scene assembly.',
    cards: [
      {
        slug: 'ai-avatar-video-generators',
        shortTitle: 'Avatar video generators',
        bestFor:
          'Talking-head, spokesperson, and presenter-led workflows where a visible speaker carries the message.',
        chooseWhen:
          'Choose this when the video needs a face and voice on screen rather than a stock-first montage or prompt-generated cinematic scene.',
        nextHref: canonicalizeVsHref('/vs/heygen-vs-synthesia'),
        nextLabel: 'Compare HeyGen vs Synthesia',
        nextNote: 'The right next click when you are deciding between flexible avatar creation and enterprise training stability.',
        cta: 'See avatar tools',
      },
      {
        slug: 'enterprise-ai-video-solutions',
        shortTitle: 'Enterprise avatar platforms',
        bestFor:
          'Team deployments where presenter-led video also has to satisfy API, admin, security, and governance requirements.',
        chooseWhen:
          'Choose this when avatar video is being bought by operations, IT, or procurement instead of a solo creator or campaign owner.',
        nextHref: '/tool/synthesia',
        nextLabel: 'Review Synthesia first',
        nextNote: 'A strong follow-up when enterprise rollout, compliance posture, and structured training matter together.',
        cta: 'Explore enterprise picks',
      },
    ],
  },
  {
    title: 'Repurposing existing content',
    intro:
      'Go this direction when the source material already exists and the job is conversion, cleanup, or repackaging. These routes are for turning articles into narrated videos, webinars into clips, podcasts into social assets, and long-form drafts into publishable edits without rebuilding from scratch.',
    cards: [
      {
        slug: 'content-repurposing-ai-tools',
        shortTitle: 'Repurposing hubs',
        bestFor:
          'Routes built around converting blogs, scripts, webinars, podcasts, and long-form recordings into new video assets.',
        chooseWhen:
          'Choose this when your raw material already exists and the deciding factor is ingestion workflow, not prompt generation.',
        nextHref: '/tool/pictory',
        nextLabel: 'Open the Pictory review',
        nextNote: 'A practical next step when transcript editing and article-to-video conversion are in play.',
        cta: 'Browse repurposing tools',
      },
      {
        slug: 'ai-video-editors',
        shortTitle: 'AI video editors',
        bestFor:
          'Transcript-first or clip-first editing once the content already exists and needs cutting, reframing, captioning, or cleanup.',
        chooseWhen:
          'Choose this when the draft is already there and the buying decision is about editing speed, timeline depth, or short-form extraction.',
        nextHref: '/tool/descript',
        nextLabel: 'Start with Descript',
        nextNote: 'A good next click when text-based editing is likely to save more time than another generator would.',
        cta: 'See AI editors',
      },
    ],
  },
  {
    title: 'Marketing and social publishing',
    intro:
      'Use these routes when output cadence, hooks, campaign variation, or low-friction publishing matter more than a single polished asset. This is the cluster for Shorts, Reels, TikTok, faceless YouTube, ad variants, and creator workflows where repeatability is often the core constraint.',
    cards: [
      {
        slug: 'ai-video-for-social-media',
        shortTitle: 'Social publishing tools',
        bestFor:
          'Daily social output built around captions, templates, stock scenes, and fast turnaround across Shorts, Reels, and TikTok.',
        chooseWhen:
          'Choose this when the destination platform and publishing cadence matter more than deep cinematic control.',
        nextHref: '/tool/invideo',
        nextLabel: 'Open the InVideo review',
        nextNote: 'A useful next step when you want a social-first tool with script-to-video and stock-first production strengths.',
        cta: 'Browse social tools',
      },
      {
        slug: 'ai-video-for-youtube',
        shortTitle: 'YouTube creator workflows',
        bestFor:
          'Faceless channel automation, script-to-video workflows, and YouTube-first publishing where output volume affects the economics.',
        chooseWhen:
          'Choose this when the destination is YouTube and the workflow depends on scripts, narration, automation, or channel-scale production.',
        nextHref: '/tool/invideo',
        nextLabel: 'Start with an InVideo workflow',
        nextNote: 'A natural next click for faceless production and stock-first YouTube drafting.',
        cta: 'See YouTube workflows',
      },
      {
        slug: 'ai-video-for-marketing',
        shortTitle: 'Marketing video tools',
        bestFor:
          'Campaigns, ads, demos, personalization, and localized marketing output where branding and workflow fit matter as much as raw generation.',
        chooseWhen:
          'Choose this when the question is not just how to create a video, but which route fits campaign variation, product storytelling, and team brand controls.',
        nextHref: '/tool/heygen',
        nextLabel: 'Review HeyGen for marketing',
        nextNote: 'A smart next step when localization, avatar-led demos, or personalized outbound are part of the plan.',
        cta: 'Open marketing routes',
      },
      {
        slug: 'viral-ai-video-generators',
        shortTitle: 'Viral and clipping tools',
        bestFor:
          'Virality-oriented workflows that prioritize hooks, clip scoring, trend-led ideation, and fast short-form packaging.',
        chooseWhen:
          'Choose this when the real goal is publishable clip performance, not general-purpose video production.',
        nextHref: '/tool/opus-clip',
        nextLabel: 'Start with Opus Clip',
        nextNote: 'The clearest next click when you need scored clip extraction from long-form source material.',
        cta: 'Explore viral tools',
      },
    ],
  },
  {
    title: 'Business and enterprise buying',
    intro:
      'Start here when the purchase has to work for a team, not just an individual creator. These routes help when procurement, approvals, localization, brand governance, export policy, or admin controls will shape the shortlist before you compare stylistic output.',
    cards: [
      {
        slug: 'professional-ai-video-tools',
        shortTitle: 'Professional video platforms',
        bestFor:
          'Business-grade workflows that need brand governance, structured collaboration, and commercial-ready exports across a team.',
        chooseWhen:
          'Choose this when the tool has to fit repeatable company workflows instead of one-off creator experimentation.',
        nextHref: '/tool/pictory',
        nextLabel: 'Review Pictory for team workflows',
        nextNote: 'A sensible follow-up when repurposing, brand kits, and operational reuse matter more than prompt novelty.',
        cta: 'Browse business-ready tools',
      },
      {
        slug: 'enterprise-ai-video-solutions',
        shortTitle: 'Enterprise buying routes',
        bestFor:
          'Large-team evaluation where API access, admin controls, SSO, security, and procurement posture all matter together.',
        chooseWhen:
          'Choose this when the tool decision includes stakeholders outside marketing or content, especially operations, IT, and learning teams.',
        nextHref: canonicalizeVsHref('/vs/heygen-vs-synthesia'),
        nextLabel: 'Compare top enterprise avatars',
        nextNote: 'Helpful once the enterprise shortlist is down to flexible avatar creation versus structured training deployment.',
        cta: 'Explore enterprise picks',
      },
    ],
  },
  {
    title: 'Free, budget, and low-risk starts',
    intro:
      'Use these routes when the first decision is financial rather than feature-maximal. This is where to start if you are validating free-tier watermark policies, comparing sub-$20 plans, or choosing for speed and experimentation before a larger commitment.',
    cards: [
      {
        slug: 'free-ai-video-no-watermark',
        shortTitle: 'Free tools with usable exports',
        bestFor:
          'Checking which free-tier tools stay clean, which only work under limits, and which still require an upgrade to avoid branding.',
        chooseWhen:
          'Choose this when the first question is whether a free export is actually usable, not whether the tool is the strongest overall.',
        nextHref: '/tool/flexclip',
        nextLabel: 'Open the FlexClip review',
        nextNote: 'A practical next step when you need a low-risk editor with a clean free export path.',
        cta: 'Check free no-watermark tools',
      },
      {
        slug: 'budget-friendly-ai-video-tools',
        shortTitle: 'Budget-friendly paid options',
        bestFor:
          'Low-cost plans that still deliver enough production headroom for regular use without pushing you into enterprise-style pricing.',
        chooseWhen:
          'Choose this when you are willing to pay, but only if the plan is genuinely usable under a real monthly budget ceiling.',
        nextHref: '/tool/runway',
        nextLabel: 'Review Runway on a budget',
        nextNote: 'A useful follow-up when you want stronger generation controls without immediately moving into premium pricing.',
        cta: 'Browse budget options',
      },
      {
        slug: 'fast-ai-video-generators',
        shortTitle: 'Fast-generation routes',
        bestFor:
          'Speed-first generation where queue time, rapid iteration, and concept testing matter more than deep edit control.',
        chooseWhen:
          'Choose this when the primary bottleneck is turnaround and you need clips quickly for testing, publishing, or social iteration.',
        nextHref: '/tool/pika',
        nextLabel: 'Try the Pika route first',
        nextNote: 'A strong next click when fast short-form output matters more than a broad editing suite.',
        cta: 'See fast generators',
      },
    ],
  },
];

const toolReviewLinks = [
  {
    href: '/tool/heygen',
    label: 'HeyGen review',
    note: 'Useful after avatar, marketing, and enterprise routes where presenter-led delivery is still in contention.',
  },
  {
    href: '/tool/invideo',
    label: 'InVideo review',
    note: 'A good next click after social, faceless YouTube, and script-first publishing routes.',
  },
  {
    href: '/tool/pictory',
    label: 'Pictory review',
    note: 'Strong follow-up when repurposing, transcript workflows, or team-ready reuse are part of the decision.',
  },
  {
    href: '/tool/runway',
    label: 'Runway review',
    note: 'Worth opening when the question is generation quality and creative control rather than pure throughput.',
  },
];

const comparisonLinks = [
  {
    href: canonicalizeVsHref('/vs/heygen-vs-synthesia'),
    label: 'HeyGen vs Synthesia',
    note: 'Best when avatar flexibility and enterprise training stability are the two most credible paths left.',
  },
  {
    href: canonicalizeVsHref('/vs/heygen-vs-invideo'),
    label: 'HeyGen vs InVideo',
    note: 'Useful when the real split is presenter-led delivery versus faceless stock-first publishing.',
  },
  {
    href: canonicalizeVsHref('/vs/fliki-vs-pictory'),
    label: 'Fliki vs Pictory',
    note: 'A practical next click for script-first conversion versus deeper repurposing and transcript workflows.',
  },
];

const faqItems = [
  {
    question: 'When should I start with avatar tools instead of text-to-video tools?',
    answer:
      'Start with avatar tools when the video needs a visible speaker and the message depends on delivery, face, and voice. Start with text-to-video when the output is scene generation from prompts and the speaker is not the core format.',
  },
  {
    question: 'What is the best route for faceless YouTube workflows?',
    answer:
      'Usually the YouTube, social, or repurposing routes. Those paths are better for script-to-video drafting, stock-first production, clipping, and repeatable publishing cadence. Move to avatar tools only if the channel format truly needs an on-screen host.',
  },
  {
    question: 'Which route should I use if I already have blogs, webinars, or podcasts?',
    answer:
      'Start with repurposing tools first. They are built to ingest existing articles, transcripts, recordings, and long videos. Generators are the wrong first stop when the source material already exists and just needs conversion.',
  },
  {
    question: 'How should teams choose differently from solo creators?',
    answer:
      'Solo creators can usually optimize first for speed, output style, and cost. Teams need to ask earlier about approvals, localization, admin controls, export policy, and procurement fit. That is where the professional and enterprise routes become more useful than creator-first categories.',
  },
  {
    question: 'When should I use a VS page instead of a category hub?',
    answer:
      'Use a category hub when you are still deciding which workflow family fits the job. Use a VS page only after the route is already clear and the decision is down to two specific tools with real tradeoffs worth comparing directly.',
  },
];

export function generateMetadata(): Metadata {
  return {
    title: `Explore AI Video Tools by Use Case ${seoYear}`,
    description:
      'Choose AI video tools by workflow, not by brand. Start with the right route for avatars, text-to-video, repurposing, social publishing, or enterprise buying.',
    alternates: {
      canonical: '/features',
    },
    openGraph: {
      title: `Explore AI Video Tools by Use Case ${seoYear}`,
      description:
        'A workflow-first hub for choosing the right AI video route before you compare individual tools, reviews, and VS pages.',
      url: '/features',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function FeaturesHubPage() {
  return (
    <div className="min-h-screen bg-[#F8F7F3] pb-20 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Use-case hub</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-900 md:text-5xl">
              Explore AI Video Tools by Use Case
            </h1>
            <p className="mt-5 max-w-4xl text-lg leading-8 text-gray-600">
              Use this hub to narrow the workflow before you compare brands. Different jobs call for different tool
              types: presenter-led delivery, prompt-based generation, repurposing existing content, high-volume social
              publishing, or team-ready buying. Start with the route, then move into the right feature page, tool
              review, or VS page once the decision is smaller.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="mb-14 rounded-3xl border border-black/10 bg-white p-8 shadow-sm lg:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Start Here</p>
            <h2 className="mt-3 text-3xl font-black text-gray-900">Pick a workflow first, then go deeper</h2>
            <p className="mt-4 text-base leading-8 text-gray-600">
              Use the route that matches the job to be done first. That will get you to the right category page faster
              than comparing random tools too early.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            {quickRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="rounded-2xl border border-black/10 bg-[#FCFBF7] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-black/20 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-600">Quick route</p>
                <h3 className="mt-3 text-lg font-black text-gray-900">{route.title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-600">{route.detail}</p>
                <div className="mt-5 inline-flex items-center text-sm font-bold text-gray-900">
                  <span className="border-b border-black/30">{route.cta}</span>
                  <span className="ml-2">→</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-gray-200 pt-5 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">Need a shorter next step?</span>
            <Link href="/features/ai-avatar-video-generators" className="font-medium text-indigo-600 hover:text-indigo-700">
              Need a presenter on screen?
            </Link>
            <Link href="/features/content-repurposing-ai-tools" className="font-medium text-indigo-600 hover:text-indigo-700">
              Starting from existing content?
            </Link>
            <Link href="/features/fast-ai-video-generators" className="font-medium text-indigo-600 hover:text-indigo-700">
              Is speed the main constraint?
            </Link>
            <span className="text-gray-400">|</span>
            <span>Reviews and VS pages are linked again after the FAQ.</span>
          </div>
        </section>

        <div className="space-y-12">
          {workflowSections.map((section) => (
            <section key={section.title} className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm lg:p-10">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Workflow route</p>
                <h2 className="mt-3 text-3xl font-black text-gray-900">{section.title}</h2>
                <p className="mt-4 text-base leading-8 text-gray-600">{section.intro}</p>
              </div>

              <div className="mt-8 space-y-4">
                {section.cards.map((card) => (
                  <article key={`${section.title}-${card.slug}`} className="rounded-2xl border border-gray-200 bg-[#FCFBF7] p-6">
                    <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_260px] xl:items-start">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-600">Category route</p>
                        <h3 className="mt-3 text-2xl font-black text-gray-900">
                          {getFeatureTitle(card.slug, card.shortTitle)}
                        </h3>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Best for</p>
                          <p className="mt-2 text-sm leading-7 text-gray-700">{card.bestFor}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Choose this when</p>
                          <p className="mt-2 text-sm leading-7 text-gray-700">{card.chooseWhen}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-white p-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Next step</p>
                        <Link href={card.nextHref} className="mt-2 block text-base font-bold text-gray-900 hover:text-indigo-600">
                          {card.nextLabel}
                        </Link>
                        <p className="mt-2 text-sm leading-6 text-gray-600">{card.nextNote}</p>
                        <Link
                          href={`/features/${card.slug}`}
                          className="mt-4 inline-flex items-center rounded-full bg-[#F6D200] px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-[#E8C700]"
                        >
                          {card.cta}
                          <span className="ml-2">→</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-14 rounded-3xl border border-black/10 bg-white p-8 shadow-sm lg:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">FAQ</p>
            <h2 className="mt-3 text-3xl font-black text-gray-900">Questions that usually determine the right route</h2>
          </div>
          <div className="mt-8 space-y-4">
            {faqItems.map((item) => (
              <details key={item.question} className="rounded-2xl border border-gray-200 bg-[#FCFBF7] p-5">
                <summary className="cursor-pointer list-none pr-8 text-lg font-bold text-gray-900">
                  {item.question}
                </summary>
                <p className="mt-4 text-sm leading-7 text-gray-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="rounded-2xl border border-dashed border-black/10 bg-white/70 p-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Next-step reviews</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {toolReviewLinks.map((item) => (
                    <Link key={item.href} href={item.href} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Next-step comparisons</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {comparisonLinks.map((item) => (
                    <Link key={item.href} href={item.href} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
