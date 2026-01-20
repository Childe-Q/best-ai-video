import { categories } from '@/data/categories';

// 人工权威标签映射（Editorial Tags）
// 每个工具固定 2 个标签（最多 3 个），基于外部权威来源（G2, Futurepedia）验证
export const editorialTags: Record<string, string[]> = {
  // 根据 G2 + Futurepedia 数据验证
  'invideo': ['Editor', 'Repurposing'], // G2: Video Editing + Content Repurposing
  'heygen': ['Avatar', 'Professional'], // G2: AI Video Generators, Futurepedia: Avatars
  'fliki': ['Text-to-Video', 'Repurposing'], // G2: AI Video Generators, Futurepedia: Text to Video
  'veed-io': ['Editor'], // G2: Video Editing, Futurepedia: Video Editing
  'zebracat': ['Text-to-Video', 'Social Media'], // G2: AI Video Generators, Futurepedia: Social Media
  'synthesia': ['Avatar', 'Professional'], // G2: AI Video Generators + Video Editing, Futurepedia: Avatars
  'elai-io': ['Avatar'], // G2: AI Video Generators, Futurepedia: Avatars
  'pika': ['Text-to-Video'], // G2: AI Video Generators, Futurepedia: Text to Video
  'descript': ['Editor'], // G2: Video Editing, Futurepedia: Video Editing
  'opus-clip': ['Repurposing', 'Social Media'], // G2: Content Repurposing, Futurepedia: Social Media
  'runway': ['Editor', 'Text-to-Video'], // G2: Video Editing + AI Video Generators, Futurepedia: Text to Video
  'pictory': ['Editor', 'Text-to-Video'], // G2: Video Editing, Futurepedia: Text to Video
  'colossyan': ['Avatar', 'Text-to-Video'], // G2: AI Video Generators, Futurepedia: Avatars + Text to Video
  'd-id': ['Avatar'], // G2: AI Video Generators, Futurepedia: Avatars
  'deepbrain-ai': ['Avatar'], // G2: AI Video Generators, Futurepedia: Avatars
  'synthesys': ['Avatar'], // G2: AI Video Generators, Futurepedia: Avatars
  'flexclip': ['Editor'], // G2: Video Editing, Futurepedia: Video Editing
  'lumen5': ['Editor', 'Social Media'], // G2: Video Editing, Futurepedia: Social Media
  'steve-ai': ['Text-to-Video'], // G2: AI Video Generators, Futurepedia: Video Generators
  'sora': ['Text-to-Video'], // 基于产品定位（OpenAI Sora）
};

// 标签 label -> features slug 映射（只包含站内已有的 features 页面）
const LABEL_TO_FEATURE_SLUG: Record<string, string> = {
  'Text-to-Video': 'best-ai-video-generators',
  'Avatar': 'ai-avatar-video-generators',
  'Editor': 'ai-video-editors',
  'Repurposing': 'content-repurposing-ai-tools',
  'Social Media': 'ai-video-for-social-media',
  'Professional': 'professional-ai-video-tools',
  'Marketing': 'ai-video-for-marketing',
  'Budget-Friendly': 'budget-friendly-ai-video-tools',
};

// 获取所有存在的 features 页面 slug
const EXISTING_FEATURE_SLUGS = new Set(categories.map(cat => cat.slug));

export interface EditorialHomeTag {
  label: string;
  href?: string; // 只有当对应 features 页面存在时才设置
}

/**
 * 获取工具的首页编辑标签
 * @param toolSlug 工具 slug
 * @returns 标签数组（1-3 个），如果缺失则返回兜底标签
 */
export function getEditorialHomeTags(toolSlug: string): EditorialHomeTag[] {
  const tags = editorialTags[toolSlug];

  // 如果缺失该工具，返回兜底标签
  if (!tags || tags.length === 0) {
    return [
      {
        label: 'AI Video Tool',
        // 不设置 href（不可点击）
      },
    ];
  }

  // 转换为 EditorialHomeTag，检查是否有对应的 features 页面
  return tags.map(label => {
    const featureSlug = LABEL_TO_FEATURE_SLUG[label];
    const homeTag: EditorialHomeTag = {
      label,
    };

    // 只有当 featureSlug 存在且对应 features 页面存在时才添加 href
    if (featureSlug && EXISTING_FEATURE_SLUGS.has(featureSlug)) {
      homeTag.href = `/features/${featureSlug}`;
    }
    // 注意：即使没有 href，也要返回标签（不可点击的 chip）

    return homeTag;
  });
}
