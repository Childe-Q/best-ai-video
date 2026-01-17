# InVideo 内容工程化方案 - 执行总结

## 任务 2：最小改动方案

### 方案选择
**在 `Tool` 类型中添加 `content` 字段，在 `tools.json` 中为每个 tool 添加结构化内容数据。**

### 为什么这样改最省时间、最好扩展？

1. **最小侵入性**：
   - 只修改 2 个文件：`src/types/tool.ts`（类型定义）和 `src/data/tools.json`（数据）
   - 页面组件保持向后兼容：如果 `content` 字段不存在，自动回退到原有逻辑

2. **数据驱动，易于维护**：
   - 所有内容集中在 JSON 文件中，无需修改代码即可更新内容
   - 支持占位符标注（如 `[NEED_SOURCE]`），方便后续验证和填充

3. **扩展到 8 个 money tools 只需复制粘贴**：
   - 复制 InVideo 的 `content` 结构
   - 替换占位符为实际数据
   - 无需修改任何代码文件

4. **SEO 友好**：
   - 所有内容在 SSR 时渲染，确保搜索引擎抓取
   - 结构化数据便于后续添加 Schema.org 标记

---

## 任务 3：Content Pack 转译成站内可落地模板

### Overview 页模块（按顺序）

#### 1. TL;DR（3 句话）
```json
"tldr": {
  "bestFor": "Content creators needing faceless YouTube videos...",
  "notFor": "Professional filmmakers requiring... (Source: [OFFICIAL_PRICING])",
  "why": "InVideo AI stands out by integrating... (Source: [OFFICIAL_FEATURES])"
}
```

#### 2. Mini Test
```json
"miniTest": {
  "prompt": "Create a 30-second vertical video...",
  "generationTime": "[NEED_TEST: e.g., 2 mins 15 secs]",
  "footageMatch": "[NEED_TEST: e.g., 8/10 clips were relevant]",
  "subtitleAccuracy": "[NEED_TEST: e.g., 100% accurate]",
  "verdict": "Ideally suited for [User Type]..."
}
```

#### 3. Output
- 已有 `video_url` 字段支持 YouTube embed
- 无视频时显示 "Sample output coming soon"

#### 4. Use Cases（3 卡 + 每卡 1 个站内链接）
```json
"useCases": [
  {
    "title": "YouTube Automation (Faceless Channels)",
    "why": "Converts a single topic prompt...",
    "linkHref": "/vs/invideo-vs-pictory",
    "linkText": "Compare with alternatives →"
  }
]
```

#### 5. Pros & Cons
- 已存在：`tool.pros` 和 `tool.cons` 数组

#### 6. FAQ（8 个）
- 已存在：`tool.faqs` 数组（Reviews 页使用）

### Pricing 页：Pricing Snapshot

```json
"pricing": {
  "snapshot": {
    "plans": [
      {
        "name": "Free",
        "bullets": [
          "Watermarks: [Yes/No] (Source: [UI_EXPORT_POPUP])",
          "Export Limit: [NEED_SOURCE: e.g., 10 mins/week] (Source: [OFFICIAL_PRICING])"
        ]
      }
    ],
    "note": "Check official pricing for most up-to-date plans and features"
  }
}
```

### Features / Reviews / Alternatives 页（MVP 结构）

- **Features**：使用现有 `tool.features` 和 `tool.featureCards`
- **Reviews**：使用现有 `tool.user_sentiment` 和 `tool.faqs`
- **Alternatives**：使用现有 `findBestAlternatives()` 算法

---

## 任务 4：数据 Schema（JSON）

### 完整 Schema 定义

已添加到 `src/types/tool.ts`：

```typescript
content?: {
  overview?: {
    tldr?: {
      bestFor: string;
      notFor: string;
      why: string;
    };
    miniTest?: {
      prompt: string;
      generationTime?: string;
      footageMatch?: string;
      subtitleAccuracy?: string;
      verdict?: string;
    };
    useCases?: Array<{
      title: string;
      why: string;
      linkHref: string;
      linkText?: string;
    }>;
  };
  pricing?: {
    snapshot?: {
      plans: Array<{
        name: string;
        bullets: string[];
      }>;
      note?: string;
    };
  };
  features?: {
    keyFeatures?: string[];
    detailedFeatures?: Array<{
      title: string;
      description: string;
      icon?: string;
      href?: string;
    }>;
  };
  reviews?: {
    userSentiment?: string;
    faqs?: FAQ[];
  };
  alternatives?: {
    topAlternatives?: Array<{
      toolSlug: string;
      why: string;
      linkHref?: string;
    }>;
  };
  sources?: Record<string, {
    type: string;
    howToVerify: string;
    suggestedQuery?: string;
  }>;
};
```

### InVideo 示例数据

已添加到 `src/data/tools.json` 中 InVideo 条目，包含：
- `content.overview.tldr`
- `content.overview.miniTest`
- `content.overview.useCases`
- `content.pricing.snapshot`
- `content.sources`

---

## 任务 5：代码 Diff（逐文件）

### 文件 1：`src/types/tool.ts`
**变更**：在 `Tool` 类型末尾添加 `content?` 字段定义（约 60 行）

### 文件 2：`src/data/tools.json`
**变更**：在 InVideo 条目末尾（`featureCards` 之后）添加 `content` 对象（约 100 行）

### 文件 3：`src/app/tool/[slug]/page.tsx`
**变更**：
- TL;DR Section：添加条件渲染，优先使用 `tool.content?.overview?.tldr`，否则回退到原有逻辑
- Mini Test Section：添加条件渲染，优先使用 `tool.content?.overview?.miniTest`
- Use Cases Section：添加条件渲染，优先使用 `tool.content?.overview?.useCases`，否则使用硬编码的 3 个用例

### 文件 4：`src/app/tool/[slug]/pricing/page.tsx`
**变更**：
- Pricing Snapshot Section：添加条件渲染，优先使用 `tool.content?.pricing?.snapshot`，否则使用硬编码的 3 档占位符

### 向后兼容性
- 所有页面组件都支持 `content` 字段不存在的情况
- 如果 `content` 字段缺失，自动回退到原有硬编码逻辑
- 不会导致 404 或渲染错误

---

## 任务 6：扩展到 8 个 Money Tools 的复用流程

### 最短 Checklist

#### 步骤 1：复制 InVideo 的 content 结构（5 分钟）
1. 打开 `src/data/tools.json`
2. 找到目标 tool（如 `heygen`）
3. 复制 InVideo 的整个 `content` 对象
4. 粘贴到目标 tool 的 `featureCards` 之后

#### 步骤 2：填充 TL;DR（10 分钟）
- 替换 `bestFor`：基于 `tool.best_for` 和官网定位
- 替换 `notFor`：基于 `tool.cons` 和竞品对比
- 替换 `why`：基于 `tool.pros` 和差异化点

#### 步骤 3：填充 Mini Test（15 分钟）
- 保持 `prompt` 不变（或根据 tool 特性调整）
- 如果已测试：替换 `generationTime`, `footageMatch`, `subtitleAccuracy`, `verdict`
- 如果未测试：保持 `[NEED_TEST]` 占位符

#### 步骤 4：填充 Use Cases（10 分钟）
- 替换 3 个用例的 `title` 和 `why`
- 更新 `linkHref` 为正确的 VS 链接或 features 链接（如 `/vs/heygen-vs-synthesia`）

#### 步骤 5：填充 Pricing Snapshot（15 分钟）
- 根据 `tool.pricing_plans` 确定 3 档名称（通常是 Free / Starter / Pro 或类似）
- 为每档填写 3-5 条 `bullets`，使用占位符：
  - `[EXPORT_RESOLUTION]` - 需要从官方定价页验证
  - `[WATERMARK]` - 需要从 UI 或帮助中心验证
  - `[CREDITS_PER_MONTH]` - 需要从官方定价页验证
  - `[COMMERCIAL_LICENSE` - 需要从服务条款验证

#### 步骤 6：更新 Sources（5 分钟）
- 更新 `sources` 对象中的 URL 和查询建议
- 确保每个 source key 对应正确的验证方法

### 每个 Tool 的“最低采集动作”

#### 必须采集（30 分钟/工具）：
1. **2 张 UI 截图**：
   - Export 弹窗（显示水印/分辨率限制）
   - Pricing 页面（显示当前价格和限制）

2. **3 个限制字段**：
   - Free 计划的导出限制（分钟数/次数）
   - 水印政策（Yes/No）
   - 商业使用许可（需要付费计划？）

3. **3 条用户吐槽**：
   - Reddit 搜索：`site:reddit.com "[Tool Name]" complaint`
   - G2/Capterra 3 星评论
   - Trustpilot 负面反馈

#### 可选采集（如果时间允许）：
- 运行 Mini Test（实际测试 prompt）
- 对比竞品定价页
- 阅读服务条款的 License 章节

### 批量处理建议

1. **先填所有 TL;DR**（8 个 tools × 10 分钟 = 80 分钟）
2. **再填所有 Pricing Snapshot**（8 个 tools × 15 分钟 = 120 分钟）
3. **最后填 Use Cases**（8 个 tools × 10 分钟 = 80 分钟）
4. **Mini Test 可以后续补充**（先保持占位符）

**总时间估算**：8 个 tools × 45 分钟 = 6 小时（不含实际测试）

---

## 后续验证流程

### Source Tag 验证清单

每个 `(Source: [TAG])` 都需要验证：

1. **OFFICIAL_PRICING**：
   - 访问 `[tool].io/pricing`
   - 截图定价表
   - 记录限制数字

2. **UI_EXPORT_POPUP**：
   - 注册免费账号
   - 点击 Export 按钮
   - 截图弹窗

3. **HELP_CENTER**：
   - 搜索 `help.[tool].io`
   - 查找 "Commercial rights" 或 "Refund policy"
   - 记录关键信息

4. **TERMS**：
   - 访问 `[tool].io/terms`
   - 搜索 "License" 章节
   - 记录版权归属

5. **REDDIT**：
   - 使用 `suggestedQuery` 搜索
   - 记录 3 条真实用户吐槽
   - 更新 Pros/Cons 列表

---

## 文件清单

### 已修改文件：
1. `src/types/tool.ts` - 添加 `content` 类型定义
2. `src/data/tools.json` - 为 InVideo 添加 `content` 数据
3. `src/app/tool/[slug]/page.tsx` - 更新 Overview 页渲染逻辑
4. `src/app/tool/[slug]/pricing/page.tsx` - 更新 Pricing 页渲染逻辑

### 无需修改文件（已支持）：
- `src/app/tool/[slug]/features/page.tsx` - 使用现有 `tool.features`
- `src/app/tool/[slug]/reviews/page.tsx` - 使用现有 `tool.faqs`
- `src/app/tool/[slug]/alternatives/page.tsx` - 使用现有算法

---

## 测试建议

1. **验证 InVideo 页面**：
   - 访问 `/tool/invideo` - 检查 TL;DR, Mini Test, Use Cases 是否正确渲染
   - 访问 `/tool/invideo/pricing` - 检查 Pricing Snapshot 是否正确渲染

2. **验证向后兼容性**：
   - 访问其他 tool（如 `/tool/heygen`）- 应该回退到原有硬编码逻辑，不报错

3. **验证 TypeScript**：
   - 运行 `pnpm build` - 确保类型检查通过

---

## 下一步行动

1. ✅ 已完成：InVideo 的 content 数据结构
2. ⏳ 待执行：为其他 7 个 money tools 填充 content 数据
3. ⏳ 待执行：验证所有 source tags
4. ⏳ 待执行：运行实际 Mini Test（可选）
