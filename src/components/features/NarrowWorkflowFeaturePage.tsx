'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import FeatureNextSteps from '@/components/features/FeatureNextSteps';
import ToolCard from '@/components/features/ToolCard';
import FeaturesFAQ from '@/components/features/FeaturesFAQ';
import { resolvePromoteSafeFeatureHref } from '@/components/features/filterPromoteSafeFeatureHrefs';
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
  promoteSafeFeatureHrefs?: string[];
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
  decisionLead?: string;
  shortlistLead?: string;
  faqLead?: string;
  sectionOverrides: Record<string, WorkflowSectionOverride>;
  faqItems: FeatureFaqItem[];
};

type ReadingGroup = {
  title: string;
  items: FeatureRecommendedReadingLink[];
};

const narrowWorkflowPrimaryReadingTypes = new Set<FeatureRecommendedReadingLink['linkType']>([
  'tool',
  'vs',
  'tool_alternatives',
]);

const SAFE_FEATURE_HUB_EXIT = {
  href: '/features',
  label: 'Browse feature hub',
  note: 'Return to the feature hub to continue through promote-safe routes only.',
} as const;

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

function buildRecommendedGroups(
  featureSlug: string,
  recommendedReadingLinks: FeatureRecommendedReadingLink[],
): ReadingGroup[] {
  const primaryGroups = readingOrder
    .filter((linkType) => narrowWorkflowPrimaryReadingTypes.has(linkType))
    .map((linkType) => ({
      title: getRecommendedSectionTitle(linkType),
      items: recommendedReadingLinks.filter((item) => item.linkType === linkType).slice(0, 2),
    }))
    .filter((group) => group.items.length > 0);

  if (primaryGroups.length > 0) {
    return primaryGroups;
  }

  if (featureSlug === 'content-repurposing-ai-tools') {
    return [];
  }

  return readingOrder
    .filter((linkType) => linkType === 'guide')
    .map((linkType) => ({
      title: getRecommendedSectionTitle(linkType),
      items: recommendedReadingLinks.filter((item) => item.linkType === linkType).slice(0, 1),
    }))
    .filter((group) => group.items.length > 0);
}

const readingOrder: FeatureRecommendedReadingLink['linkType'][] = ['tool', 'vs', 'tool_alternatives', 'guide'];

const narrowWorkflowOverrides: Partial<Record<string, NarrowWorkflowOverride>> = {
  'text-to-video-ai-tools': {
    fitHeading: 'Stay here only if the job starts from a prompt or script',
    fitSummary:
      'Use this page only when the input is a blank prompt, loose script, or narration brief and the footage has to be generated from scratch. If you already have source material to convert or need a presenter on screen, this is the wrong first route.',
    keyAxes: ['prompt adherence', 'clip length', 'commercial rights', 'scene quality', 'workflow fit'],
    fitCards: [
      {
        title: 'Prompt or script in -> stay here',
        summary:
          'Stay when the output is net-new footage: cinematic B-roll, concept scenes, product visuals, or short clips that do not start from an article, webinar, podcast, or recorded timeline.',
        href: '#cinematic-text-to-video',
        label: 'Go to the shortlist',
      },
      {
        title: 'Existing source in -> leave for repurposing',
        summary:
          'If you are converting articles, webinars, podcasts, or long-form footage into video, text-to-video is the wrong first page. Start with the repurposing workflow instead.',
        href: '/features/content-repurposing-ai-tools',
        label: 'Go to repurposing',
      },
      {
        title: 'Presenter needed -> leave for avatars',
        summary:
          'If the output needs a presenter, lip-sync, or multilingual on-screen delivery, text-to-video is usually the wrong workflow. Start with avatar tools instead.',
        href: '/features/ai-avatar-video-generators',
        label: 'Go to avatar tools',
      },
    ],
    decisionFrameCards: [
      {
        title: 'Input signal',
        summary:
          'Blank prompt or script: stay. Existing article, webinar, podcast, or footage: leave for repurposing or editing.',
      },
      {
        title: 'Output signal',
        summary:
          'Need scenes, motion, or visual concepts: stay. Need a visible speaker carrying the message: leave for avatar tools.',
      },
      {
        title: 'Compare first',
        summary:
          'Once the route is right, compare prompt adherence, usable clip length, and commercial posture before you compare price.',
      },
    ],
    decisionLead:
      'This page only has one real lane. These checks are here to confirm that the workflow is still prompt-first before you read the tools like a generic generator list.',
    shortlistLead:
      'Once prompt-first generation is clearly the job, the page should narrow quickly. This shortlist is here to compare scene-generation options, not to reopen the route decision.',
    faqLead:
      'If you are still here after the shortlist, the remaining questions are usually about whether text-to-video still holds as the route or whether it is time to move sideways into comparison or an adjacent workflow.',
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
        question: 'I have a prompt or a script. Is this still the right page?',
        answer:
          'Yes, if that prompt or script is being used to generate net-new scenes from scratch. No, if it is really supporting an existing recording, article, webinar, or presenter-led workflow.',
      },
      {
        question: 'What if I already have a blog, webinar, or podcast?',
        answer:
          'Use text-to-video only when the output begins from a prompt and the footage has to be generated from scratch. If you already have an article, webinar, podcast, or long-form recording, repurposing is usually the better first route.',
      },
      {
        question: 'Should I use avatar tools instead if someone needs to speak on screen?',
        answer:
          'Use text-to-video when scenes, B-roll, or visual storytelling are carrying the message. Use avatar tools when a speaker, lip-sync, or multilingual presenter format is doing the real work.',
      },
      {
        question: 'What should I compare first once I know this is the right route?',
        answer:
          'Start with prompt adherence, because a cheaper model is still a bad fit if it cannot reliably follow the scene you asked for. Then check clip length, then cost. Rights and production posture should enter before you commit to a real workflow.',
      },
      {
        question: 'Which tools make the most sense for flagship scenes versus lighter experiments?',
        answer:
          'Start with Sora or Runway when scene quality and control matter most. Start with Kling when you care more about faster, high-energy output and want a lighter entry point for experiments.',
      },
      {
        question: 'When should I leave this page for direct comparison?',
        answer:
          'Move to direct comparison once you are no longer deciding whether text-to-video is the right workflow. If you are already comparing model-to-model tradeoffs, this page has done its job and the comparison page becomes more useful.',
      },
    ],
  },
  'content-repurposing-ai-tools': {
    fitHeading: 'Stay here only if the workflow starts with content you already have',
    fitSummary:
      'Use this page only if the job starts with an existing asset and the outcome is a new format: article to video, script to video, webinar to clips, or podcast to shorts. If the real work is shaping an existing edit with timeline control, transcript cleanup, captions, or polish, leave for the editors page instead.',
    keyAxes: ['source format', 'conversion path', 'transcript extraction', 'reuse at scale', 'workflow fit'],
    fitCards: [
      {
        title: 'Blog, script, webinar, or podcast in -> stay here',
        summary:
          'This is the right route when the asset already exists and the job is to turn it into another format: article to video, script to video, webinar to shorts, or podcast to clips.',
        href: '#written-source-to-video',
        label: 'Go to the shortlist',
      },
      {
        title: 'Assembled footage in -> leave for editors',
        summary:
          'If you already have footage assembled and need timeline edits, transcript cleanup, captions, or tighter polish, use the editors page. Repurposing is for source-to-output conversion, not post-production depth.',
        href: '/features/ai-video-editors',
        label: 'Go to editors',
      },
      {
        title: 'No source asset yet -> leave for text-to-video',
        summary:
          'If there is no article, recording, or source transcript to work from, repurposing is the wrong first page. Start with text-to-video instead of forcing a conversion workflow.',
        href: '/features/text-to-video-ai-tools',
        label: 'Go to text-to-video',
      },
    ],
    decisionFrameCards: [
      {
        title: 'Source asset',
        summary:
          'Text, article, or script: start with written-source conversion. Webinar, podcast, live stream, or interview: start with recorded-source clipping.',
      },
      {
        title: 'Conversion versus editing',
        summary:
          'Stay when the job is converting one source format into another. Leave when the footage already has editorial shape and mainly needs cleanup, cuts, captions, or polish.',
      },
      {
        title: 'Scale signal',
        summary:
          'Stay here if the job is repeatable reuse: pulling moments from long recordings or packaging written assets into video without rebuilding each piece manually.',
      },
    ],
    decisionLead:
      'Start with the asset, not the brand. The first call is written source versus recording, then whether the real job is conversion or post-production.',
    shortlistLead:
      'These two routes exist to narrow the conversion workflow quickly. They should feel like source-based choices, not like two generic tool buckets.',
    sectionOverrides: {
      'Written source to video': {
        chooseWhen:
          'Choose this shortlist when the source asset is written content that needs to become video: blog posts, scripts, articles, or documents that should turn into publishable output without building everything manually in an editor.',
        disappoints:
          'Leave this route if the real source is a webinar, podcast, live stream, or other long-form recording that needs clipping. It is also the wrong lane if you already have an assembled timeline and mainly need editing, cleanup, or post-production control.',
        contextualExits: [
          {
            href: '/features/content-repurposing-ai-tools#recorded-source-to-short-clips',
            label: 'Actually starting from recordings?',
            note: 'Jump to the recorded-source route if the asset is a webinar, podcast, or interview instead of written text.',
          },
          {
            href: '/features/ai-video-editors',
            label: 'Already in post-production?',
            note: 'Use the editors page if the material already exists as footage and the job is polishing, trimming, captioning, or timeline cleanup.',
          },
          {
            href: '/features/text-to-video-ai-tools',
            label: 'No source asset yet?',
            note: 'Use text-to-video if the project starts from a prompt rather than an existing article or script.',
          },
        ],
      },
      'Recorded source to short clips': {
        chooseWhen:
          'Choose this shortlist when the source asset is an existing recording and the job is to turn it into publishable short clips without doing deep manual editing on every timeline.',
        disappoints:
          'Leave this route if you are starting from text, scripts, or documents. It is also the wrong lane if the real work is transcript cleanup, cut-by-cut polishing, or post-production on footage that already has an editorial shape.',
        contextualExits: [
          {
            href: '/features/content-repurposing-ai-tools#written-source-to-video',
            label: 'Actually converting written content?',
            note: 'Jump back if the asset is text, not a long recording.',
          },
          {
            href: '/features/ai-video-editors',
            label: 'Need editing depth instead?',
            note: 'Use the editors page if transcript cleanup, timeline control, or post-production polish matters more than automated clip extraction.',
          },
          {
            href: '/features/text-to-video-ai-tools',
            label: 'Actually starting from a blank prompt?',
            note: 'Go to text-to-video if there is no recording to clip and the job is net-new scene generation.',
          },
        ],
      },
    },
    faqItems: [
      {
        question: 'I have blog posts or scripts. Is this the right route?',
        answer:
          'Yes. Written-source conversion belongs here when the job is turning articles, scripts, or documents into video without rebuilding everything manually in an editor.',
      },
      {
        question: 'I have webinars, podcasts, or recordings. Is this repurposing or editing?',
        answer:
          'It is repurposing if the job is converting that source into clips or another publishable format. It is editing if you already have a cut or assembled footage and mainly need cleanup, trimming, captions, or deeper post-production control.',
      },
      {
        question: 'Should I start with written-source conversion or recorded-source clipping?',
        answer:
          'Start with written-source conversion when the asset is text. Start with recorded-source clipping when the asset is a webinar, interview, live stream, or podcast. The source format should decide the first bucket, not pricing or brand familiarity.',
      },
      {
        question: 'Are repurposing tools the same as AI editors?',
        answer:
          'No. Repurposing tools are for source-to-output conversion. AI editors are for shaping footage that already exists. The overlap is real, but the first question is still whether you are converting a source asset or polishing an edit.',
      },
      {
        question: 'What matters most for podcast or webinar repurposing?',
        answer:
          'Transcript extraction matters most when the source is spoken content and the workflow depends on finding usable moments fast. If the source is a webinar, podcast, or interview, weak transcription usually destroys the efficiency of repurposing at scale.',
      },
      {
        question: 'When should I leave this page?',
        answer:
          'Leave this page once source-material conversion is no longer the main constraint. If you need deeper editing control, an on-screen presenter, or net-new scene generation, a neighboring workflow page will usually be more useful than staying here.',
      },
    ],
  },
  'viral-ai-video-generators': {
    fitHeading: 'Stay here only if viral performance is the real workflow constraint',
    fitSummary:
      'Use this page only if the job is optimizing for hook strength, clip selection, trend fit, or short-form performance rather than just creating videos quickly. If you mainly need generic social publishing, source conversion without virality scoring, or broad generator discovery, leave early instead of treating “viral” as a default label for any short-form tool.',
    keyAxes: ['virality scoring', 'trend fit', 'caption style', 'clip selection logic', 'workflow fit'],
    fitCards: [
      {
        title: 'Stay here if the real job is maximizing short-form performance',
        summary:
          'This is the right route when the workflow is built around hooks, virality scoring, trend-led ideation, or extracting clips most likely to perform on Shorts, Reels, or TikTok.',
        href: '#repurposing-and-clipping',
        label: 'Go to the shortlist',
      },
      {
        title: 'Leave for repurposing if conversion matters more than virality',
        summary:
          'If the real job is turning webinars, podcasts, articles, or recordings into new formats without a strong virality layer, the repurposing page is the better first route.',
        href: '/features/content-repurposing-ai-tools',
        label: 'Go to repurposing',
      },
      {
        title: 'Leave for social workflows if you mainly need publishing speed',
        summary:
          'If hooks, captions, and templates matter but the page does not need trend intelligence or virality scoring, the social workflow page is usually the cleaner frame.',
        href: '/features/ai-video-for-social-media',
        label: 'Go to social media',
      },
    ],
    decisionFrameCards: [
      {
        title: 'Clip scoring versus content planning',
        summary:
          'Start by deciding whether the workflow begins with existing footage that needs to be scored and clipped, or with trend signals that tell you what to make next. Those are different viral jobs.',
      },
      {
        title: 'Virality layer versus generic short-form output',
        summary:
          'This page is only worth using if the tool adds a real viral lens: hook scoring, trend signals, algorithmic clip selection, or caption styles that change how the content is shaped.',
      },
      {
        title: 'Trend fit versus editing depth',
        summary:
          'If the main decision is manual editing quality or a broader repurposing workflow, this page is already too narrow. Stay only if performance-oriented automation is the reason the shortlist exists.',
      },
    ],
    sectionOverrides: {
      'Repurposing and clipping': {
        chooseWhen:
          'Choose this shortlist when you already have long-form footage and the job is to find the moments most likely to perform, package them for vertical platforms, and move faster than a normal repurposing workflow would allow.',
        disappoints:
          'Leave this route if the main need is general source conversion, transcript cleanup, or post-production control rather than virality scoring and short-form performance optimization.',
        contextualExits: [
          {
            href: '/features/viral-ai-video-generators#trend-led-creation',
            label: 'Actually starting from trend ideation?',
            note: 'Jump to the trend-led route if the workflow begins with what to make next rather than with footage you already have.',
          },
          {
            href: '/features/content-repurposing-ai-tools',
            label: 'Need broader repurposing instead?',
            note: 'Use the repurposing page if source conversion is the real frame and virality scoring is only a secondary nice-to-have.',
          },
          {
            href: '/features/ai-video-editors',
            label: 'Need editing depth instead?',
            note: 'Use the editors page if timeline control, transcript cleanup, or post-production polish matters more than viral clip selection.',
          },
        ],
      },
      'Trend-led creation': {
        chooseWhen:
          'Choose this shortlist when the workflow starts with trend intelligence, hook planning, or deciding what short-form content to make next rather than with existing footage to clip.',
        disappoints:
          'Leave this route if you already have source material and mainly need extraction, reframing, captions, and clip packaging. It is also the wrong lane if you just need faster social publishing without a real trend-analysis layer.',
        contextualExits: [
          {
            href: '/features/viral-ai-video-generators#repurposing-and-clipping',
            label: 'Actually starting from recorded footage?',
            note: 'Jump back if the real workflow starts with podcasts, webinars, demos, or long-form videos that need clipping.',
          },
          {
            href: '/features/ai-video-for-social-media',
            label: 'Need social-native output instead?',
            note: 'Use the social workflow page if template speed, captions, and publishing cadence matter more than predictive trend signals.',
          },
          {
            href: '/features/best-ai-video-generators',
            label: 'Still too early for a viral-only frame?',
            note: 'Go back to the broader shortlist if virality is still just one consideration rather than the reason the workflow exists.',
          },
        ],
      },
    },
    faqItems: [
      {
        question: 'Do I actually need a viral-content page, or just repurposing tools?',
        answer:
          'Use this page when virality scoring, trend fit, hook strength, or performance-oriented clip selection are the main reasons the workflow exists. Use the repurposing page when the real job is simply converting source material into new formats.',
      },
      {
        question: 'Should I start with repurposing and clipping or trend-led creation?',
        answer:
          'Start with repurposing and clipping when you already have long-form footage. Start with trend-led creation when the workflow begins with deciding what to make next based on trend signals and short-form opportunity.',
      },
      {
        question: 'What matters most here: virality scoring, captions, or trend intelligence?',
        answer:
          'Start with the feature that actually changes your workflow. If you already have footage, virality scoring and clip selection usually matter first. If you are planning content from scratch, trend intelligence matters first. Caption style becomes important once the right lane is already clear.',
      },
      {
        question: 'When is the social-media page a better route than this one?',
        answer:
          'Use the social-media page when the real job is publishing social-native content quickly with strong hooks, captions, and templates, but not necessarily with a predictive virality layer. Stay here only if viral optimization is the main filter.',
      },
      {
        question: 'When should I leave this page and go back to a broader shortlist?',
        answer:
          'Leave this page once virality stops being the main reason the shortlist exists. If the workflow becomes more about general generation, source conversion, or editing depth, an adjacent page or the broader shortlist becomes more useful.',
      },
    ],
  },
  'ai-video-for-youtube': {
    fitHeading: 'Stay here only if YouTube is the real workflow constraint',
    fitSummary:
      'Use this page only if the job is building a YouTube-first publishing system: recurring uploads, faceless channel cadence, long-form adjacency, or a YouTube-specific host format. If the real constraint is vertical speed, hooks, captions, or fast social posting, exit early instead of treating YouTube and social media as the same workflow.',
    keyAxes: ['channel automation', 'voice and cloning', 'long-form support', 'publishing cadence', 'workflow fit'],
    fitCards: [
      {
        title: 'Stay here if you need a YouTube-first publishing workflow',
        summary:
          'This is the right route when the output is built around faceless channels, recurring uploads, Shorts programs that still belong to a channel system, or YouTube-specific host formats.',
        href: '#youtube-channel-systems',
        label: 'Go to the shortlist',
      },
      {
        title: 'Leave for social media if vertical speed matters more than YouTube depth',
        summary:
          'If the real job is high-volume TikTok, Reels, or Shorts output driven by templates, captions, hooks, and social pacing, the social media workflow is the better first page.',
        href: '/features/ai-video-for-social-media',
        label: 'Go to social media',
      },
      {
        title: 'Leave for avatar tools if presenter delivery is the whole job',
        summary:
          'If you already know the real requirement is a realistic spokesperson, multilingual presenter, or custom avatar library, the broader avatar page is a better starting point than a YouTube-specific workflow page.',
        href: '/features/ai-avatar-video-generators',
        label: 'Go to avatar tools',
      },
    ],
    decisionFrameCards: [
      {
        title: 'Pipeline depth first',
        summary:
          'Decide whether you need script-to-publish automation or just one missing piece like the host. A tool that only solves avatars is very different from one that automates scripts, visuals, subtitles, and export.',
      },
      {
        title: 'Voice and publishing cadence',
        summary:
          'For faceless channels, audio quality and output volume matter early. If voice cloning, credits, or minute limits break your publishing rhythm, the rest of the page matters less.',
      },
      {
        title: 'Long-form versus presenter-led output',
        summary:
          'YouTube workflows split between channel systems that keep a publishing cadence alive and host-layer tools that mainly solve delivery. Confirm which job you are actually doing before reading tool-by-tool details.',
      },
    ],
    sectionOverrides: {
      'YouTube channel systems': {
        chooseWhen:
          'Choose this shortlist when you want the closest thing to a YouTube publishing system: AI scripting, voiceover, visuals, subtitles, and repeatable output for faceless channels, episodic formats, or Shorts that still live inside a broader channel cadence.',
        disappoints:
          'Leave this route if you mainly need social-native vertical speed, a recurring on-screen presenter, or generic tool discovery. It is the wrong lane if YouTube is not actually the publishing system driving the decision.',
        contextualExits: [
          {
            href: '/features/ai-video-for-youtube#youtube-host-layer',
            label: 'Actually need an on-screen host?',
            note: 'Jump to the host layer if recurring delivery format matters more than the full publishing system.',
          },
          {
            href: '/features/ai-video-for-social-media',
            label: 'Publishing vertical social first?',
            note: 'Use the social workflow page if hooks, captions, and fast vertical posting matter more than channel cadence.',
          },
          {
            href: '/features/ai-video-generators-comparison',
            label: 'Already comparing generators head-to-head?',
            note: 'Move there once you are no longer deciding whether a YouTube workflow page is the right frame.',
          },
        ],
      },
      'YouTube host layer': {
        chooseWhen:
          'Choose this shortlist when YouTube still matters, but the real differentiator is a recurring host: a faceless presenter, multilingual spokesperson, or avatar-led explainer tied to a channel identity.',
        disappoints:
          'Leave this route if you need a full channel system from script to publish, or if the host is not the real bottleneck. It is also the wrong lane if you are really choosing a broader avatar platform or a social-native presenter format.',
        contextualExits: [
          {
            href: '/features/ai-video-for-youtube#youtube-channel-systems',
            label: 'Need the full pipeline instead?',
            note: 'Jump back to channel systems if scripting, visuals, and publishing throughput matter more than the presenter layer.',
          },
          {
            href: '/features/ai-avatar-video-generators',
            label: 'Need the broader avatar shortlist?',
            note: 'Use the avatar chooser if YouTube is no longer the main frame and you want the wider presenter landscape.',
          },
          {
            href: '/features/best-ai-video-generators',
            label: 'Not actually YouTube-first?',
            note: 'Go back to the broader generators shortlist if channel-specific workflow is no longer the main constraint.',
          },
        ],
      },
    },
    faqItems: [
      {
        question: 'Do I actually need a YouTube workflow page, or a broader generators shortlist?',
        answer:
          'Use this page when YouTube publishing is the real job: recurring uploads, long-form adjacency, faceless channel production, or recurring YouTube hosts. If you are still choosing between broad routes, the broader generators shortlist is the better first page.',
      },
      {
        question: 'Should I start with channel automation tools or avatar support tools?',
        answer:
          'Start with channel automation if the real bottleneck is scripting, visuals, voiceover, and repeatable publishing. Start with avatar support if you already know the missing piece is the host or presenter layer.',
      },
      {
        question: 'What matters most for faceless YouTube workflows: voice quality, credits, or automation depth?',
        answer:
          'Start with automation depth, because a tool that cannot carry enough of the pipeline will still create manual work. Then check voice quality and cloning, then minute or credit limits against your publishing cadence.',
      },
      {
        question: 'When is a YouTube-specific workflow better than the social media page?',
        answer:
          'Use this page when the workflow is built around recurring YouTube output, channel cadence, faceless pipeline depth, or longer-form adjacency. Use the social media page when vertical speed, hooks, caption styles, templates, and fast short-form publishing are the real constraints.',
      },
      {
        question: 'When should I stop using this page and move to direct comparison?',
        answer:
          'Move to direct comparison once you are no longer deciding whether a YouTube-first workflow is the right frame. If the workflow is already clear and you are comparing generators head-to-head, the comparison page becomes more useful.',
      },
    ],
  },
  'ai-video-for-social-media': {
    fitHeading: 'Stay here only if short-form social output is the real workflow',
    fitSummary:
      'Use this page only if the real job is social-native output: fast vertical publishing, hooks, captions, templates, and rapid posting for TikTok, Reels, Shorts, or similar feeds. If you need a YouTube-first publishing system, broader generator discovery, or a workflow defined by existing source material, exit early instead of treating social tools as a general video category.',
    keyAxes: ['native 9:16', 'caption speed', 'publishing volume', 'turnaround time', 'workflow fit'],
    fitCards: [
      {
        title: 'Stay here if you need high-volume social-first output',
        summary:
          'This is the right route when the job is repeatable vertical content with hooks, captions, templates, clip velocity, or quick prompt-driven publishing for social feeds.',
        href: '#vertical-templates-and-clip-velocity',
        label: 'Go to the shortlist',
      },
      {
        title: 'Leave for repurposing if source material is the main constraint',
        summary:
          'If you already have webinars, podcasts, interviews, or articles and the real job is converting them into clips, the repurposing workflow is the better first page.',
        href: '/features/content-repurposing-ai-tools',
        label: 'Go to repurposing',
      },
      {
        title: 'Leave for YouTube if channel depth matters more than vertical speed',
        summary:
          'If you are building a faceless YouTube channel or care more about recurring upload cadence and channel depth than social hooks and template velocity, the YouTube workflow page is the better fit.',
        href: '/features/ai-video-for-youtube',
        label: 'Go to YouTube workflows',
      },
    ],
    decisionFrameCards: [
      {
        title: 'Social-first speed',
        summary:
          'Confirm that turnaround time, template reuse, and fast publishing are the real constraints. If not, this page is probably too feed-specific for what you actually need.',
      },
      {
        title: 'Prompt creation versus repurposing',
        summary:
          'Some tools are strongest when you need net-new vertical output, while others are only good because they turn long recordings into clips. Decide which job you are really doing first.',
      },
      {
        title: 'Presenter format versus clip workflow',
        summary:
          'Social workflows split quickly between clip velocity tools and presenter-led output. If the recurring on-screen host matters more than hooks, captions, and effects, do not read both lanes as if they are interchangeable.',
      },
    ],
    sectionOverrides: {
      'Vertical templates and clip velocity': {
        chooseWhen:
          'Choose this shortlist when the priority is repeatable short-form output: fast hooks, dynamic captions, templates, AI reframing, and a quick path from idea or source clip to publishable social posts.',
        disappoints:
          'Leave this route if the real job is a YouTube-first publishing system, a recurring avatar presenter, or a workflow defined primarily by existing long-form source material rather than social-native speed.',
        contextualExits: [
          {
            href: '/features/ai-video-for-social-media#presenter-led-social-output',
            label: 'Actually need a presenter-led format?',
            note: 'Jump to presenter-led social output if a spokesperson or talking-head format matters more than clip velocity.',
          },
          {
            href: '/features/content-repurposing-ai-tools',
            label: 'Starting from podcasts or webinars?',
            note: 'Use repurposing if the workflow is really about converting existing long-form material into clips.',
          },
          {
            href: '/features/ai-video-for-youtube',
            label: 'Need a YouTube-first pipeline instead?',
            note: 'Switch there if channel automation, long-form adjacency, and recurring upload cadence matter more than social-native speed.',
          },
        ],
      },
      'Presenter-led social output': {
        chooseWhen:
          'Choose this shortlist when the output still needs to feel social-native, but the content format is a recurring presenter or avatar rather than clip velocity, templates, or visual hooks built around raw footage.',
        disappoints:
          'Leave this route if no presenter is needed, or if the real job is clip velocity, text-to-video social generation, or broader avatar discovery outside a social-first context.',
        contextualExits: [
          {
            href: '/features/ai-video-for-social-media#vertical-templates-and-clip-velocity',
            label: 'Need clip throughput instead?',
            note: 'Jump back to the clip-velocity route if captions, hooks, and short-form volume matter more than the presenter layer.',
          },
          {
            href: '/features/ai-avatar-video-generators',
            label: 'Need the broader avatar shortlist?',
            note: 'Use the broader avatar page if social media is no longer the main frame for the decision.',
          },
          {
            href: '/features/ai-video-for-marketing',
            label: 'Running paid campaigns instead of organic social?',
            note: 'Switch there if brand governance and campaign localization matter more than social-native speed.',
          },
        ],
      },
    },
    faqItems: [
      {
        question: 'Do I actually need a social media workflow page, or a broader generator page?',
        answer:
          'Use this page when the real job is fast vertical publishing for TikTok, Reels, or Shorts, with social-native hooks, captions, and template velocity. If you are still choosing between general generator categories, the broader generators page is a better first step.',
      },
      {
        question: 'Should I start with template and clip workflows or avatar-led social tools?',
        answer:
          'Start with template and clip workflows when speed, captions, hooks, and throughput matter most. Start with avatar-led social tools when the content format itself depends on a recurring presenter or spokesperson.',
      },
      {
        question: 'When is repurposing a better route than this page?',
        answer:
          'Repurposing is the better route when the workflow starts with existing webinars, podcasts, interviews, or articles and conversion quality matters more than social-native creation features.',
      },
      {
        question: 'What matters most on this page: native 9:16 support, caption templates, or speed?',
        answer:
          'Start with native vertical support and usable caption styles, because they define whether the output feels social-native at all. Then check speed and throughput, since social workflows usually break on template velocity and publishing cadence before they break on edge-case features.',
      },
      {
        question: 'When should I leave this page for YouTube or the broader avatar shortlist?',
        answer:
          'Leave for YouTube when recurring upload cadence, long-form adjacency, or faceless channel automation is the real job. Leave for the broader avatar shortlist when social media is no longer the main frame and you are really comparing presenter platforms.',
      },
    ],
  },
  'ai-video-for-marketing': {
    fitHeading: 'Stay here only if campaign output and brand control are the real constraints',
    fitSummary:
      'Use this page only if the work is external-facing marketing video: campaign variants, localized ads, product demos, or branded storytelling where governance, approvals, and commercial use matter early. If the real job is picking a presenter format, comparing avatar studios, or solving speaker-led delivery before campaign workflow, leave for the avatar page instead of treating every spokesperson tool as a marketing decision.',
    keyAxes: ['brand governance', 'localization depth', 'variant scale', 'commercial posture', 'workflow fit'],
    fitCards: [
      {
        title: 'Stay here if you are making campaign or branded marketing assets',
        summary:
          'This is the right route when brand consistency, localization, client-facing quality, or campaign variants matter more than presenter format or hobbyist creation speed.',
        href: '#personalization-and-variants',
        label: 'Go to the shortlist',
      },
      {
        title: 'Leave for social media if speed matters more than governance',
        summary:
          'If the real bottleneck is rapid TikTok, Reels, or Shorts output rather than campaign control, approvals, and localization, the social workflow page is the better first stop.',
        href: '/features/ai-video-for-social-media',
        label: 'Go to social media',
      },
      {
        title: 'Leave for avatar tools if presenter format is the main decision',
        summary:
          'If the real question is which avatar platform gives you the right talking-head delivery, lip-sync, or language coverage, use the avatar page first. Marketing context alone is not enough if presenter format is the real filter.',
        href: '/features/ai-avatar-video-generators',
        label: 'Go to avatar tools',
      },
    ],
    decisionFrameCards: [
      {
        title: 'Governance first',
        summary:
          'Check whether brand kits, approvals, localization review, and output consistency matter before anything else. If they do not, this page may be too marketing-specific for the real workflow.',
      },
      {
        title: 'Variant scale versus hero quality',
        summary:
          'Marketing workflows split quickly between producing many personalized variants and making fewer, more cinematic brand pieces. Pick the lane before you compare tools.',
      },
      {
        title: 'Localization depth',
        summary:
          'If multilingual campaigns, translation, or regional versions matter, that usually reshapes the shortlist more than price does. Treat localization as a campaign workflow filter, not as a generic avatar feature check.',
      },
    ],
    sectionOverrides: {
      'Personalization and variants': {
        chooseWhen:
          'Choose this shortlist when the job is producing many campaign versions, localized variants, or personalized outreach assets from a repeatable commercial workflow. Use it when campaign throughput and brand consistency matter more than comparing presenter formats.',
        disappoints:
          'Leave this route if the real job is a hero ad, cinematic brand narrative, or any workflow where visual polish matters more than scale and repeatability. It is also the wrong lane if the main decision is simply which avatar presenter looks or sounds best.',
        contextualExits: [
          {
            href: '/features/ai-video-for-marketing#generative-brand-storytelling',
            label: 'Actually making hero creative?',
            note: 'Jump to the brand storytelling route if cinematic quality and brand narrative matter more than variant scale.',
          },
          {
            href: '/features/ai-avatar-video-generators',
            label: 'Need the broader avatar market?',
            note: 'Use the avatar page if talking-head delivery, lip-sync, or avatar format is the main decision and campaign workflow is secondary.',
          },
          {
            href: '/features/ai-video-for-social-media',
            label: 'Publishing organic social instead?',
            note: 'Switch there if speed, hooks, and short-form cadence matter more than marketing governance.',
          },
        ],
      },
      'Generative brand storytelling': {
        chooseWhen:
          'Choose this shortlist when the output needs to feel like branded creative: hero ads, polished launches, or narrative marketing assets where visual fidelity and commercial polish matter more than batch automation or talking-head delivery.',
        disappoints:
          'Leave this route if you need dozens of localized variants, campaign personalization, or a tightly governed template workflow. It is also the wrong lane if a presenter-led avatar is carrying the message more than the creative treatment itself.',
        contextualExits: [
          {
            href: '/features/ai-video-for-marketing#personalization-and-variants',
            label: 'Need more variants and localization?',
            note: 'Jump back to the personalization route if repeatability and campaign scale matter more than cinematic polish.',
          },
          {
            href: '/features/best-ai-video-generators',
            label: 'Still choosing the broad lane?',
            note: 'Go back to the broader generators shortlist if marketing-specific governance is not the real first filter.',
          },
          {
            href: '/features/ai-video-generators-comparison',
            label: 'Ready for direct generator tradeoffs?',
            note: 'Move there once the workflow is set and you are comparing tools head-to-head.',
          },
        ],
      },
    },
    faqItems: [
      {
        question: 'Do I actually need a marketing workflow page, or a broader generators shortlist?',
        answer:
          'Use this page when the real constraints are brand governance, campaign localization, variant scale, or commercial posture. If you are still choosing between general generator routes, the broader shortlist is the better first page.',
      },
      {
        question: 'When is the avatar page a better route than this one?',
        answer:
          'Use the avatar page when the real decision is presenter format: talking-head delivery, lip-sync quality, speaker realism, or avatar workflow fit. Stay here when campaign output, localization, approvals, and commercial use case are the real first filters.',
      },
      {
        question: 'Should I start with personalization and variants or generative brand storytelling?',
        answer:
          'Start with personalization and variants when scale, localization, and repeatable campaign output matter most. Start with generative brand storytelling when you need fewer but higher-fidelity branded assets.',
      },
      {
        question: 'What matters first here: brand governance, localization, or visual polish?',
        answer:
          'Start with governance if multiple teammates or clients are involved, because poor brand control creates downstream problems fast. Then check localization if campaigns are multilingual. Visual polish comes next once the workflow constraints are clear.',
      },
      {
        question: 'When is the social media page a better route than this one?',
        answer:
          'The social media page is better when fast vertical publishing, hooks, captions, and organic posting cadence matter more than governance, localization, and campaign control.',
      },
      {
        question: 'When should I stop using this page and move to direct comparison?',
        answer:
          'Move to direct comparison once you are no longer deciding whether the decision is really about marketing workflow. If the lane is already clear and you are comparing generators tool-to-tool, the comparison page is more useful.',
      },
    ],
  },
  'ai-video-editors': {
    fitHeading: 'Stay here only if editing existing footage is the real job',
    fitSummary:
      'Use this page only if the workflow starts with footage, audio, or a transcript that needs post-production help: timeline work, transcript cleanup, captions, reframing, clip trimming, or polish. If the real job is converting source material into a new format or generating scenes from scratch, leave early.',
    keyAxes: ['editing interface', 'timeline control', 'transcript cleanup', 'post-production speed', 'workflow fit'],
    fitCards: [
      {
        title: 'Footage, audio, or transcript already exists -> stay here',
        summary:
          'This is the right route when you already have footage or audio and the job is cutting, captioning, reframing, cleaning, or packaging that material faster.',
        href: '#timeline-and-transcript-post-production',
        label: 'Go to the shortlist',
      },
      {
        title: 'Need net-new scenes -> leave for text-to-video',
        summary:
          'If the workflow begins from a prompt instead of existing footage, editors are the wrong first page. Start with text-to-video or the broader generator shortlist.',
        href: '/features/text-to-video-ai-tools',
        label: 'Go to text-to-video',
      },
      {
        title: 'Need source conversion -> leave for repurposing',
        summary:
          'If the real job is turning blogs, webinars, podcasts, or long-form recordings into other formats with minimal manual editing, repurposing is usually the better first route.',
        href: '/features/content-repurposing-ai-tools',
        label: 'Go to repurposing',
      },
    ],
    decisionFrameCards: [
      {
        title: 'Route signal',
        summary:
          'Stay only if the asset already exists and the job is post-production. Leave if you still need source conversion or prompt-led generation.',
      },
      {
        title: 'Interface fit',
        summary:
          'Transcript-first editing, timeline control, and fast clip packaging are different jobs. The wrong editing paradigm usually breaks the workflow faster than pricing does.',
      },
      {
        title: 'Depth versus speed',
        summary:
          'Choose between longer-form narrative control and faster clip packaging before you compare tools. This split is about editing posture, not just product popularity.',
      },
    ],
    decisionLead:
      'This page is for post-production. The first question is not which editor is best, but whether editing is actually the workflow or just a symptom of a different route.',
    shortlistLead:
      'The split below is about editing posture: deeper narrative cleanup versus faster clip packaging once the footage already exists.',
    sectionOverrides: {
      'Timeline and transcript post-production': {
        chooseWhen:
          'Choose this shortlist when you need deeper editorial control on footage that already exists: transcript-first editing, timeline precision, audio cleanup, and longer-form post-production rather than source conversion.',
        disappoints:
          'Leave this route if the real job is fast clip packaging, social template velocity, or turning source material like blogs, webinars, and podcasts into new formats. It is also the wrong lane if you need generation from scratch.',
        contextualExits: [
          {
            href: '/features/ai-video-editors#fast-clip-editing-and-packaging',
            label: 'Actually need faster clip output?',
            note: 'Jump to the clip-focused route if turnaround and social packaging matter more than deep editorial control.',
          },
          {
            href: '/features/content-repurposing-ai-tools',
            label: 'Starting from source material instead?',
            note: 'Use repurposing if the workflow is really about converting articles, webinars, podcasts, or recordings into new formats.',
          },
          {
            href: '/features/text-to-video-ai-tools',
            label: 'Need net-new scenes instead?',
            note: 'Switch there if the project starts from prompts rather than recorded footage or transcripts.',
          },
        ],
      },
      'Fast clip editing and packaging': {
        chooseWhen:
          'Choose this shortlist when the priority is faster post-production on footage that already exists: pulling highlights, adding captions, reframing, and packaging social-ready clips without using a heavy editing suite.',
        disappoints:
          'Leave this route if you need transcript-level narrative editing, frame-level control, or longer-form post-production depth. It is also the wrong lane if your real problem is source-to-format conversion rather than editing output that already exists.',
        contextualExits: [
          {
            href: '/features/ai-video-editors#timeline-and-transcript-post-production',
            label: 'Need deeper editing control?',
            note: 'Jump back to the deeper post-production route if transcript workflows, audio cleanup, and long-form polish matter more than speed.',
          },
          {
            href: '/features/content-repurposing-ai-tools',
            label: 'Working from source content instead?',
            note: 'Go there if the main job is converting webinars, podcasts, or articles into new formats rather than editing finished footage.',
          },
          {
            href: '/features/text-to-video-ai-tools',
            label: 'Need generation instead?',
            note: 'Go to text-to-video if there is no usable footage yet and the output has to be generated from scratch.',
          },
        ],
      },
    },
    faqItems: [
      {
        question: 'I already have a webinar or podcast. Do I need an editor or a repurposing tool?',
        answer:
          'Use this page when you already have footage, audio, or a transcript and the job is editing it faster. Use repurposing when the real job is turning articles, webinars, podcasts, or long-form recordings into new video formats with minimal manual editing.',
      },
      {
        question: 'When is text-to-video the better route than this page?',
        answer:
          'Text-to-video is the better route when the project starts from a prompt or script and needs net-new scenes. This page only makes sense once footage, audio, or a transcript already exists.',
      },
      {
        question: 'Should I start with transcript-first editing or fast clip packaging?',
        answer:
          'Start with deeper post-production tools when you need longer-form control, transcript editing, or precise post-production. Start with faster clip editing tools when speed, highlight extraction, and short-form packaging are the real priorities.',
      },
      {
        question: 'What should I compare first once I know I need an AI editor?',
        answer:
          'Start with interface style, because the wrong editing paradigm creates friction immediately. Then check whether timeline control or turnaround speed is the bigger constraint for the actual post-production workflow you run most often.',
      },
      {
        question: 'When does this page stop being the right frame?',
        answer:
          'Leave for text-to-video if you need net-new generation, for repurposing if source conversion is the real job, or for the social workflow page if short-form publishing speed matters more than editing depth.',
      },
    ],
  },
};

export default function NarrowWorkflowFeaturePage({
  featureSlug,
  pageData,
  groups,
  recommendedReadingLinks,
  promoteSafeFeatureHrefs,
}: NarrowWorkflowFeaturePageProps) {
  const override = narrowWorkflowOverrides[pageData.slug];
  const promoteSafeFeatureHrefSet = new Set(promoteSafeFeatureHrefs ?? []);

  useEffect(() => {
    track('page_view', {
      page_type: 'feature_narrow_workflow',
      feature_slug: featureSlug,
    });
  }, [featureSlug]);

  if (!override) {
    return null;
  }

  const safeOverride = {
    ...override,
    fitCards: override.fitCards.map((card) => {
      const resolved = resolvePromoteSafeFeatureHref(card.href, promoteSafeFeatureHrefSet, SAFE_FEATURE_HUB_EXIT.href);

      return resolved.usedFallback
        ? {
            ...card,
            href: SAFE_FEATURE_HUB_EXIT.href,
            label: SAFE_FEATURE_HUB_EXIT.label,
          }
        : {
            ...card,
            href: resolved.href ?? card.href,
          };
    }),
    sectionOverrides: Object.fromEntries(
      Object.entries(override.sectionOverrides).map(([sectionTitle, sectionOverride]) => [
        sectionTitle,
        {
          ...sectionOverride,
          contextualExits: sectionOverride.contextualExits.map((item) => {
            const resolved = resolvePromoteSafeFeatureHref(item.href, promoteSafeFeatureHrefSet, SAFE_FEATURE_HUB_EXIT.href);

            return resolved.usedFallback
              ? {
                  ...item,
                  href: SAFE_FEATURE_HUB_EXIT.href,
                  label: SAFE_FEATURE_HUB_EXIT.label,
                  note: SAFE_FEATURE_HUB_EXIT.note,
                }
              : {
                  ...item,
                  href: resolved.href ?? item.href,
                };
          }),
        },
      ])
    ) as Record<string, WorkflowSectionOverride>,
  };

  const recommendedGroups = buildRecommendedGroups(featureSlug, recommendedReadingLinks);

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
            <p className="mt-4 max-w-4xl text-sm font-semibold uppercase tracking-[0.12em] text-gray-600">
              Use this page if the route is mostly clear and the next job is getting to a shortlist fast.
            </p>
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

      <main
        className={`mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 ${
          groups.length === 1 ? 'space-y-10' : 'space-y-12'
        }`}
      >
        <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Fit check</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">{safeOverride.fitHeading}</h2>
            <p className="mt-4 text-base leading-8 text-gray-600">{safeOverride.fitSummary}</p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {safeOverride.fitCards.map((card) => (
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Route checks</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Use these checks before you over-read the page</h2>
            {safeOverride.decisionLead ? (
              <p className="mt-4 text-base leading-8 text-gray-600">{safeOverride.decisionLead}</p>
            ) : null}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {safeOverride.decisionFrameCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">{card.title}</p>
                <p className="mt-3 text-sm leading-7 text-gray-700">{card.summary}</p>
              </div>
            ))}
          </div>
        </section>

        {groups.map((group) => {
          const sectionOverride = safeOverride.sectionOverrides[group.groupTitle];

          return (
            <section key={group.groupTitle} id={group.groupTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')} className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Main shortlist</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">{group.groupTitle}</h2>
              {safeOverride.shortlistLead ? (
                <p className="mt-4 max-w-3xl text-base leading-8 text-gray-600">{safeOverride.shortlistLead}</p>
              ) : null}
              {group.groupSummary ? (
                <p className={`${safeOverride.shortlistLead ? 'mt-3' : 'mt-4'} max-w-3xl text-base leading-8 text-gray-600`}>
                  {group.groupSummary}
                </p>
              ) : null}

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Use this shortlist when</p>
                  <p className="mt-2 text-sm leading-7 text-gray-700">{sectionOverride?.chooseWhen}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Leave this route if...</p>
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
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">If this route stops fitting</p>
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

        {safeOverride.faqItems.length > 0 && (
          <section className="rounded-3xl border border-black/10 bg-[#F3F1EA] p-8 shadow-sm sm:p-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">FAQ</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">Questions that usually decide whether the route still fits</h2>
              {safeOverride.faqLead ? <p className="mt-4 text-base leading-8 text-gray-600">{safeOverride.faqLead}</p> : null}
            </div>

            <div className="mt-8">
              <FeaturesFAQ items={safeOverride.faqItems} />
            </div>
          </section>
        )}

        {recommendedGroups.length > 0 && (
          <FeatureNextSteps
            featureSlug={featureSlug}
            title="Keep going only if the fit still holds"
            intro="These are follow-on paths for people who have already confirmed the workflow. They should not pull attention away from the main shortlist above."
            groups={recommendedGroups}
          />
        )}
      </main>
    </div>
  );
}
