import {
  FeaturePageModules,
  FeaturePageType,
  FeaturePageVariant,
} from '@/types/featurePage';

const FEATURE_PAGE_TYPE_BY_SLUG: Record<string, FeaturePageType> = {
  'best-ai-video-generators': 'broad-chooser',
  'ai-avatar-video-generators': 'broad-chooser',
  'text-to-video-ai-tools': 'narrow-workflow',
  'content-repurposing-ai-tools': 'narrow-workflow',
  'enterprise-ai-video-solutions': 'business-procurement',
  'ai-video-editors': 'narrow-workflow',
  'ai-video-for-social-media': 'narrow-workflow',
  'ai-video-for-youtube': 'narrow-workflow',
  'ai-video-for-marketing': 'narrow-workflow',
  'free-ai-video-no-watermark': 'policy-threshold',
  'budget-friendly-ai-video-tools': 'policy-threshold',
  'fast-ai-video-generators': 'policy-threshold',
  'professional-ai-video-tools': 'business-procurement',
  'ai-video-generators-comparison': 'comparison',
  'viral-ai-video-generators': 'narrow-workflow',
};

const FEATURE_PAGE_MODULES_BY_TYPE: Record<FeaturePageType, FeaturePageModules> = {
  'broad-chooser': {
    atGlance: 'full',
    routeSplit: 'full',
    faqDensity: 'medium',
    furtherReading: 'light',
    primarySurface: 'cards',
  },
  'narrow-workflow': {
    atGlance: 'hidden',
    routeSplit: 'compact',
    faqDensity: 'light',
    furtherReading: 'light',
    primarySurface: 'cards',
  },
  comparison: {
    // Keep current comparison pages visually stable until the comparison template lands.
    atGlance: 'full',
    routeSplit: 'full',
    faqDensity: 'medium',
    furtherReading: 'light',
    primarySurface: 'table',
  },
  'policy-threshold': {
    // Keep current policy pages visually stable until the policy template lands.
    atGlance: 'full',
    routeSplit: 'full',
    faqDensity: 'medium',
    furtherReading: 'light',
    primarySurface: 'bucket-summary',
  },
  'business-procurement': {
    atGlance: 'hidden',
    routeSplit: 'compact',
    faqDensity: 'medium',
    furtherReading: 'light',
    primarySurface: 'checklist-matrix',
  },
};

export function getFeaturePageType(slug: string): FeaturePageType {
  return FEATURE_PAGE_TYPE_BY_SLUG[slug] ?? 'narrow-workflow';
}

export function getFeaturePageVariant(pageType: FeaturePageType): FeaturePageVariant {
  if (pageType === 'comparison') {
    return 'comparison';
  }

  if (pageType === 'policy-threshold') {
    return 'policy';
  }

  if (pageType === 'business-procurement') {
    return 'business';
  }

  return 'general';
}

export function getFeaturePageModules(pageType: FeaturePageType): FeaturePageModules {
  return FEATURE_PAGE_MODULES_BY_TYPE[pageType];
}
