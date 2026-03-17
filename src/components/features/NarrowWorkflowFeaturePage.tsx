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
      'Use this page only if the job starts with an existing asset and the outcome is a new format: article to video, script to video, webinar to clips, or podcast to shorts. If the real work is timeline control, transcript cleanup, caption polishing, or post-production on an existing edit, leave for the editors page instead of forcing a conversion workflow to answer an editing problem.',
    keyAxes: ['source format', 'conversion path', 'transcript extraction', 'reuse at scale', 'workflow fit'],
    fitCards: [
      {
        title: 'Stay here if you are converting existing content into video',
        summary:
          'This is the right route when the asset already exists and the job is to turn it into another format: article to video, script to video, webinar to shorts, or podcast to clips.',
        href: '#written-source-to-video',
        label: 'Go to the shortlist',
      },
      {
        title: 'Leave for editors if post-production is the real job',
        summary:
          'If you already have footage assembled and need timeline edits, transcript cleanup, captions, or tighter polish, use the editors page. Repurposing is for source-to-output conversion, not post-production depth.',
        href: '/features/ai-video-editors',
        label: 'Go to editors',
      },
      {
        title: 'Leave for text-to-video if you are starting from a blank prompt',
        summary:
          'If there is no article, recording, or source transcript to work from, repurposing is the wrong first page. Start with text-to-video instead of forcing a conversion workflow.',
        href: '/features/text-to-video-ai-tools',
        label: 'Go to text-to-video',
      },
    ],
    decisionFrameCards: [
      {
        title: 'Source format first',
        summary:
          'Decide whether the starting asset is written content or a recording before anything else. Written-source conversion and recorded-source clipping are different workflows, and the wrong bucket wastes time fast.',
      },
      {
        title: 'Conversion workflow versus post-production',
        summary:
          'Use this page when the real job is converting source material into another format. If the material is already assembled and you mainly need editing control, transcript cleanup, or polish, an editor is usually the better route.',
      },
      {
        title: 'Transcript extraction and reuse at scale',
        summary:
          'For webinars, podcasts, and interviews, the tool has to surface usable moments quickly and consistently. For articles and scripts, it has to package written input into video without turning the process back into manual editing.',
      },
    ],
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
            href: '/features/best-ai-video-generators',
            label: 'Free of the source-material constraint?',
            note: 'Go back to the broader generators shortlist if conversion from existing material is no longer the main constraint.',
          },
        ],
      },
    },
    faqItems: [
      {
        question: 'Do I actually need repurposing, or an AI editor instead?',
        answer:
          'Use repurposing when the workflow begins with source material that needs to become a new format: article to video, webinar to clips, podcast to shorts. Use an AI editor when the footage already exists and the real job is timeline control, transcript cleanup, captions, reframing, or post-production polish.',
      },
      {
        question: 'Should I start with written-source conversion or recorded-source clipping?',
        answer:
          'Start with written-source conversion when the asset is text. Start with recorded-source clipping when the asset is a webinar, interview, live stream, or podcast. The source format should decide the first bucket, not pricing or brand familiarity.',
      },
      {
        question: 'When does transcript extraction become the deciding factor?',
        answer:
          'Transcript extraction matters most when the source is spoken content and the workflow depends on finding usable moments fast. If the source is a webinar, podcast, or interview, weak transcription usually destroys the efficiency of repurposing at scale.',
      },
      {
        question: 'Which tools are strongest for blog or script conversion versus clipping recordings?',
        answer:
          'Start with Pictory or Lumen5 when the asset is written content that needs scenes, stock media, and voiceover packaging. Start with Opus Clip or Munch when the job is pulling short moments from a long recording.',
      },
      {
        question: 'When should I leave this page and move to direct comparison or a broader shortlist?',
        answer:
          'Leave this page once source-material conversion is no longer the main constraint. If you need deeper editing control, an on-screen presenter, or net-new scene generation, a neighboring workflow page will usually be more useful than staying here.',
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
      'Use this page only if the work is external-facing marketing video: campaign variants, localized ads, product demos, or branded storytelling where governance and commercial posture matter early. If the real job is organic social speed, broad generator discovery, or generic avatar exploration, exit early.',
    keyAxes: ['brand governance', 'localization depth', 'variant scale', 'commercial posture', 'workflow fit'],
    fitCards: [
      {
        title: 'Stay here if you are making campaign or branded marketing assets',
        summary:
          'This is the right route when brand consistency, localization, client-facing quality, or campaign variants matter more than hobbyist creation speed.',
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
        title: 'Leave for the broader generators shortlist if you are still choosing the lane',
        summary:
          'If you have not yet decided between cinematic generation, avatar workflows, and other broad routes, this page is too downstream. Start from the broader shortlist first.',
        href: '/features/best-ai-video-generators',
        label: 'Go to the broader shortlist',
      },
    ],
    decisionFrameCards: [
      {
        title: 'Governance first',
        summary:
          'Check whether brand kits, approvals, and output consistency matter before anything else. If they do not, this page may be too marketing-specific for the real workflow.',
      },
      {
        title: 'Variant scale versus hero quality',
        summary:
          'Marketing workflows split quickly between producing many personalized variants and making fewer, more cinematic brand pieces. Pick the lane before you compare tools.',
      },
      {
        title: 'Localization depth',
        summary:
          'If multilingual campaigns, translation, or regional versions matter, that usually reshapes the shortlist more than price does. Treat localization as a first filter, not a nice-to-have.',
      },
    ],
    sectionOverrides: {
      'Personalization and variants': {
        chooseWhen:
          'Choose this shortlist when the job is producing many campaign versions, localized variants, or personalized outreach assets from a repeatable template or avatar-led workflow.',
        disappoints:
          'Leave this route if the real job is a hero ad, cinematic brand narrative, or any workflow where visual polish matters more than scale and repeatability. It is also the wrong lane if organic social speed is the real constraint.',
        contextualExits: [
          {
            href: '/features/ai-video-for-marketing#generative-brand-storytelling',
            label: 'Actually making hero creative?',
            note: 'Jump to the brand storytelling route if cinematic quality and brand narrative matter more than variant scale.',
          },
          {
            href: '/features/ai-avatar-video-generators',
            label: 'Need the broader avatar market?',
            note: 'Use the avatar page if presenter technology is the main decision and marketing context is secondary.',
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
          'Choose this shortlist when the output needs to feel like branded creative: hero ads, polished launches, or narrative marketing assets where visual fidelity matters more than batch automation.',
        disappoints:
          'Leave this route if you need dozens of localized variants, campaign personalization, or a tightly governed template workflow. It is also the wrong lane if you are still at broad generator discovery rather than a marketing-specific decision.',
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
      'Use this page only if the workflow starts with footage, audio, or a transcript that needs post-production help: timeline work, transcript cleanup, captions, reframing, clip trimming, or polish. If the real job is converting articles, webinars, podcasts, or content libraries into new formats, leave for repurposing instead of forcing an editor page to answer a conversion problem.',
    keyAxes: ['editing interface', 'timeline control', 'transcript cleanup', 'post-production speed', 'workflow fit'],
    fitCards: [
      {
        title: 'Stay here if you need AI-assisted editing on existing material',
        summary:
          'This is the right route when you already have footage or audio and the job is cutting, captioning, reframing, cleaning, or packaging that material faster.',
        href: '#timeline-and-transcript-post-production',
        label: 'Go to the shortlist',
      },
      {
        title: 'Leave for text-to-video if you need scenes generated from scratch',
        summary:
          'If the workflow begins from a prompt instead of existing footage, editors are the wrong first page. Start with text-to-video or the broader generator shortlist.',
        href: '/features/text-to-video-ai-tools',
        label: 'Go to text-to-video',
      },
      {
        title: 'Leave for repurposing if source conversion matters more than editing depth',
        summary:
          'If the real job is turning blogs, webinars, podcasts, or long-form recordings into other formats with minimal manual editing, repurposing is usually the better first route.',
        href: '/features/content-repurposing-ai-tools',
        label: 'Go to repurposing',
      },
    ],
    decisionFrameCards: [
      {
        title: 'Editing paradigm first',
        summary:
          'Decide whether you need timeline precision, transcript-first editing, or fast clip extraction. Those are different workflows, and the wrong interface usually kills adoption faster than pricing.',
      },
      {
        title: 'Post-production depth versus conversion workflow',
        summary:
          'This page is for shaping footage that already exists. If the real job is taking source material and turning it into new formats at scale, use repurposing instead of stretching an editor into a conversion platform.',
      },
      {
        title: 'Long-form control versus short-form speed',
        summary:
          'Some tools win because they help you shape full episodes, interviews, and talking-head content. Others win because they package social-ready clips quickly. Pick the post-production job before the tool.',
      },
    ],
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
            href: '/features/ai-video-for-social-media',
            label: 'Actually optimizing for social publishing?',
            note: 'Use the social workflow page if hooks, templates, and vertical output cadence are the real first filters.',
          },
          {
            href: '/features/content-repurposing-ai-tools',
            label: 'Working from source content instead?',
            note: 'Go there if the main job is converting webinars, podcasts, or articles into new formats rather than editing finished footage.',
          },
        ],
      },
    },
    faqItems: [
      {
        question: 'Do I actually need an AI editor, or a repurposing tool instead?',
        answer:
          'Use this page when you already have footage, audio, or a transcript and the job is editing it faster. Use repurposing when the real job is turning articles, webinars, podcasts, or long-form recordings into new video formats with minimal manual editing.',
      },
      {
        question: 'Should I start with deeper post-production tools or faster clip editing tools?',
        answer:
          'Start with deeper post-production tools when you need longer-form control, transcript editing, or precise post-production. Start with faster clip editing tools when speed, highlight extraction, and short-form packaging are the real priorities.',
      },
      {
        question: 'When is repurposing a better route than this page?',
        answer:
          'Repurposing is the better route when the job starts with an article, webinar, podcast, or other source content that needs to become a new format with minimal manual editing. This page is for editing workflows, not source-to-output conversion decisions.',
      },
      {
        question: 'What matters most here: interface style, timeline control, or turnaround speed?',
        answer:
          'Start with interface style, because the wrong editing paradigm creates friction immediately. Then check whether timeline control or turnaround speed is the bigger constraint for the actual post-production workflow you run most often.',
      },
      {
        question: 'When should I leave this page for a narrower adjacent workflow?',
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
            <p className="mt-4 max-w-4xl text-sm font-semibold uppercase tracking-[0.12em] text-gray-600">
              Use this page if the workflow is already mostly clear and you want the shortest path to the shortlist.
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

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Fit check</p>
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
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Exit options</p>
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
              <h2 className="mt-3 text-3xl font-bold text-gray-900">Keep going only if the fit still holds</h2>
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
