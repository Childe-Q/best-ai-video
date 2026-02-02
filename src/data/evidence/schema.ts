/**
 * Evidence Schema for Tool Information
 *
 * This schema defines structured evidence extracted from official tool pages.
 * All sources use EXTERNAL URLs (actual scraped URLs) for traceability.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * A source reference with extracted facts
 */
export type EvidenceSource = {
  url: string; // EXTERNAL URL (e.g., "https://heygen.com/pricing")
  facts: string[];
};

/**
 * Evidence theme categories
 */
export type EvidenceTheme =
  | 'workflow'        // 流程/工作流相关
  | 'editing'         // 编辑功能
  | 'stock'           // 库存资源（音乐/图片/视频）
  | 'voice'           // 语音/TTS/声纹
  | 'export'          // 导出质量/格式/分辨率
  | 'avatar'          // AI 头像
  | 'team'            // 团队协作
  | 'usage'           // 使用限制（分钟数/credits/次数）
  | 'pricing'         // 价格/计费
  | 'licensing'       // 授权/商用/版权
  | 'models'          // AI 模型支持
  | 'integrations'    // 集成/API/平台
  | 'security'        // 安全/SSO/SCORM
  | 'support'         // 支持/帮助
  | 'general';        // 通用信息

/**
 * A nugget is a short evidence statement extracted from page content
 */
export type EvidenceNugget = {
  text: string;              // The evidence statement (20-160 chars)
  theme: EvidenceTheme;      // Category
  sourceUrl: string;         // Source page URL (required)
  sourceType: string;        // Source page type: pricing/features/help/faq/terms/docs/templates/use-cases
  capturedAt: string;        // ISO timestamp
  hasNumber: boolean;        // Whether text contains numbers/units
  keywords: string[];        // Extracted keywords from the nugget
  confidence: 'high' | 'medium' | 'low';
};

/**
 * Example/use case extracted from tool pages
 */
export type EvidenceExample = {
  title: string;                    // Example title/headline
  scenario: string;                 // Use case or scenario description
  input?: {                         // Input requirements/parameters
    prompt?: string;                // Text prompt used
    steps?: string[];               // Step-by-step instructions
    params?: Record<string, string>;
  };
  output?: {                        // Output artifacts
    asset?: {
      videoUrl?: string;
      imageUrl?: string;
      posterUrl?: string;
    };
  };
  notes?: string[];                 // Additional notes (4K, 1080p, duration, fps, etc.)
  sourceUrl: string;                // Source page URL (required)
  snippet: string;                  // Original snippet from page (required)
  capturedAt: string;
  confidence: 'high' | 'medium' | 'low';
};

/**
 * Model support claims (e.g., Veo, Sora)
 * Only records when explicitly stated on official pages
 */
export type ModelClaim = {
  models_supported?: string[];      // e.g., ["Veo 3", "Sora"] - only if explicitly stated
  sources: EvidenceSource[];        // Evidence sources backing the claim
};

/**
 * Specs and limits extracted from documentation
 */
export type SpecsLimits = {
  nuggets: EvidenceNugget[];        // Reuse nuggets structure for specs
};

/**
 * Complete tool evidence structure
 */
export type ToolEvidence = {
  slug: string;
  lastUpdated: string;

  // Three main evidence buckets
  nuggets: EvidenceNugget[];        // General evidence (usage, export, licensing, etc.)
  examples: EvidenceExample[];      // Use case examples
  modelClaims: ModelClaim;          // AI model support claims
  specsLimits?: SpecsLimits;        // Technical specs and limits (optional, reuse nuggets)

  // Source tracking
  sources: {
    pricing?: string;
    features?: string;
    help?: string;
    faq?: string;
    terms?: string;
    docs?: string;
    examples?: string[];
    [key: string]: string | string[] | undefined;
  };

  // Metadata
  metadata: {
    totalNuggets: number;
    themesCovered: EvidenceTheme[];
    hasModelClaims: boolean;
    hasExamples: boolean;
    minConfidence: 'high' | 'medium' | 'low';
  };
};

/**
 * Evidence data keyed by tool slug
 */
export type EvidenceData = Record<string, ToolEvidence>;

// ============================================================================
// Constants for Extraction
// ============================================================================

/**
 * Keywords that indicate a nugget contains valuable information
 */
export const NUGGET_KEYWORDS: Record<EvidenceTheme, string[]> = {
  workflow: ['workflow', 'process', 'step', 'create', 'generate', 'make', 'produce', 'transform'],
  editing: ['edit', 'trim', 'crop', 'cut', 'split', 'merge', 'add', 'remove', 'timeline'],
  stock: ['stock', 'library', 'media', 'asset', ' footage', 'image', 'music', 'audio', '素材'],
  voice: ['voice', 'speech', 'tts', 'audio', 'narration', 'dubbing', '配音', '语音'],
  export: ['export', 'render', 'download', 'format', 'resolution', 'quality', '4k', '1080p', '720p', 'fps'],
  avatar: ['avatar', 'character', 'person', 'presenter', '主播', '虚拟人'],
  team: ['team', 'collaborat', 'share', 'comment', 'review', 'approve', 'workspace'],
  usage: ['minute', 'credit', 'limit', 'quota', 'cap', 'per month', 'per year', 'per video', '次', '分钟'],
  pricing: ['price', 'cost', '$', 'dollar', '€', 'eur', 'plan', 'tier', 'subscription', '付费', '价格'],
  licensing: ['license', 'commercial', 'right', 'copyright', 'royalty', 'permission', '授权', '商用'],
  models: ['model', 'veo', 'sora', 'runway', 'kling', 'hailuo', 'generat', 'ai video'],
  integrations: ['api', 'integration', 'plugin', 'embed', 'share', 'publish', 'export to'],
  security: ['security', 'sso', 'scorm', 'enterprise', 'private', 'secure', '加密', '安全'],
  support: ['support', 'help', 'tutorial', 'docs', 'documentation', 'guide', '客服'],
  general: [] // Catch-all, matched by other criteria
};

/**
 * Value patterns to extract from nuggets
 */
export const VALUE_PATTERNS = {
  resolution: /\b(4K|1080p|720p|480p|2160p|1920x1080|1280x720)\b/gi,
  duration: /\b(\d+(?:\.\d+)?)\s*(second|sec|minute|min|hour|hr)s?\b/gi,
  fps: /\b(\d+)\s*fps\b/gi,
  credits: /\b(\d+(?:,\d{3})*(?:\.\d+)?)\s*(credits?|credits)\b/gi,
  minutes: /\b(\d+(?:\.\d+)?)\s*(minutes?|mins?)\b/gi,
  languages: /\b(\d+)\s*(languages?|languages?)\b/gi,
  percentage: /\b(\d+(?:\.\d+)?)\s*%/gi,
  price: /\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:\/|\s)(month|mo|year|yr|hour|day)/gi,
};
