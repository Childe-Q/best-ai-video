# InVideo Alternatives 页面数据流分析

## 1. 路由文件

**文件路径**: `src/app/tool/[slug]/alternatives/page.tsx`

**关键代码**:
```typescript
export default async function AlternativesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; // slug = "invideo"
  const tool = getTool(slug); // 从 tools.json 获取 InVideo 工具数据
  const allTools = getAllTools();
  const toolShortlist = TOOL_SHORTLISTS[slug] || []; // ['invideo', 'heygen', 'fliki', 'veed-io', ...]
  
  // 构建 alternative groups
  const groups = buildAlternativeGroups(tool, allTools, toolShortlist);
  
  // 生成 FAQ
  const content = loadToolContent(slug); // 从 content/tools/invideo.json
  const smartFAQs = generateSmartFAQs({ tool, content, rawFaqs, slug });
  
  return <AlternativesClient groups={groups} toolName={tool.name} faqs={faqs} />;
}
```

## 2. 数据源

### 主要数据源

1. **工具基础数据**: `src/data/tools.json`
   - **索引方式**: `getTool(slug)` - 使用 `slug` 字段匹配
   - **InVideo 条目**: ✅ 存在（`slug: "invideo"`）

2. **Alternatives 证据数据**: `src/data/alternativesEvidence.json`
   - **索引方式**: `evidenceMap.get(toolSlug)` - 使用 `tool` 字段（值为 slug）
   - **InVideo 条目**: ❌ **不存在**（文件中只有 veed-io, heygen, synthesia, pictory）
   - **其他工具条目**: ✅ 存在（veed-io, heygen, synthesia, pictory 有完整数据）

3. **内容数据（可选）**: `content/tools/{slug}.json`
   - **索引方式**: `loadToolContent(slug)` - 使用文件路径 `content/tools/invideo.json`
   - **InVideo 条目**: ✅ 存在（`content/tools/invideo.json`）

### 数据索引方式

- **tools.json**: 使用 `slug` 字段（如 `"slug": "invideo"`）
- **alternativesEvidence.json**: 使用 `tool` 字段（值为 slug，如 `"tool": "veed-io"`）
- **content/tools/*.json**: 使用文件名（如 `invideo.json`）

## 3. 数据流渲染链路

```
┌─────────────────────────────────────────────────────────────┐
│ /tool/invideo/alternatives (URL)                           │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ src/app/tool/[slug]/alternatives/page.tsx                   │
│ - slug = "invideo"                                           │
│ - tool = getTool("invideo") from tools.json                 │
│ - toolShortlist = ['invideo', 'heygen', 'fliki', ...]      │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ buildAlternativeGroups(tool, allTools, toolShortlist)         │
│ (src/lib/buildAlternativesData.ts)                          │
│                                                              │
│ 1. 读取 alternativesEvidence.json                           │
│    → evidenceMap.set(e.tool, e)                            │
│    → Key: "veed-io", "heygen", "synthesia", "pictory"       │
│                                                              │
│ 2. 遍历 STANDARD_SWITCHING_REASONS (4个)                    │
│    - cost-control                                            │
│    - output-quality                                          │
│    - workflow-speed                                          │
│    - control-compliance                                       │
│                                                              │
│ 3. 对每个 reason，筛选候选工具：                            │
│    - 从 toolShortlist 中筛选（排除 invideo 自己）          │
│    - 候选: ['heygen', 'fliki', 'veed-io', ...]              │
│                                                              │
│ 4. 对每个候选工具调用 buildAlternativeTool():              │
│    - tool = heygen Tool 对象                                │
│    - evidence = evidenceMap.get("heygen")                  │
│      → 从 alternativesEvidence.json 获取                    │
│    - 返回 AlternativeTool 对象                              │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ buildAlternativeTool(tool, evidence, currentToolSlug)       │
│                                                              │
│ 数据来源优先级：                                             │
│ 1. evidence (from alternativesEvidence.json)                │
│    - bestFor: evidence.bestFor                              │
│    - whySwitch: evidence.whySwitch (最多2条)                │
│    - tradeOff: evidence.tradeoffs[0] (1条)                  │
│    - pricingSignals: evidence.pricingSignals                │
│    - evidenceLinks: 从 sources 提取内部链接                 │
│                                                              │
│ 2. Fallback (如果 evidence 不存在):                        │
│    - bestFor: tool.best_for.split(/[,&]/)                   │
│    - whySwitch: tool.pros.slice(0, 2)                        │
│    - tradeOff: tool.cons[0]                                 │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ AlternativesClient Component                                │
│ (src/app/tool/[slug]/alternatives/AlternativesClient.tsx)  │
│                                                              │
│ 接收: groups (AlternativeGroup[])                           │
│ 渲染:                                                         │
│ - Hero Section (标题 + 说明)                                │
│ - Search & Filters                                          │
│ - Sticky Navigation (4个 switching reasons)                 │
│ - AlternativesReasonGroup (每个 reason 分组)                │
│   └─ AlternativeToolCard (每个工具卡片)                     │
│ - FAQ Section                                                │
└─────────────────────────────────────────────────────────────┘
```

## 4. InVideo 数据条目检查

### ✅ tools.json 中的 InVideo 条目
- **位置**: `src/data/tools.json`
- **字段**: `slug: "invideo"`, `name: "InVideo"`, `affiliate_link`, `best_for`, `pros`, `cons`, etc.
- **状态**: ✅ 存在且完整

### ❌ alternativesEvidence.json 中的 InVideo 条目
- **位置**: `src/data/alternativesEvidence.json`
- **状态**: ❌ **不存在**
- **原因**: 该文件存储的是**其他工具作为 InVideo 的替代品**的证据数据，不是 InVideo 自己的数据
- **现有条目**: veed-io, heygen, synthesia, pictory（这些是 InVideo 的替代品）

### ✅ content/tools/invideo.json
- **位置**: `content/tools/invideo.json`
- **状态**: ✅ 存在
- **用途**: 用于生成 FAQ 和其他内容

## 5. 为什么其他工具不展示？最可能的 3 个原因

### 原因 1: 缺少 Affiliate Link（最可能）
**位置**: `src/lib/buildAlternativesData.ts:62-66`
```typescript
export function buildAlternativeTool(...): AlternativeTool | null {
  if (!hasAffiliate(tool)) return null; // ⚠️ 没有 affiliate link 直接返回 null
  ...
}
```
**影响**: 如果工具没有 `affiliate_link`，`buildAlternativeTool` 返回 `null`，该工具不会显示。

**检查方法**: 查看 `tools.json` 中工具的 `affiliate_link` 字段是否存在且非空。

### 原因 2: 不在 Tool Shortlist 中
**位置**: `src/app/tool/[slug]/alternatives/page.tsx:29-35`
```typescript
const TOOL_SHORTLISTS: Record<string, string[]> = {
  invideo: ['invideo', 'heygen', 'fliki', 'veed-io', 'zebracat', 'synthesia', 'elai-io', 'pika'],
  ...
};
```
**影响**: 如果工具不在 `TOOL_SHORTLISTS[slug]` 中，会被过滤掉（除非 shortlist 为空，则显示所有工具）。

**检查方法**: 确认工具的 `slug` 是否在对应工具的 shortlist 中。

### 原因 3: 被过滤条件排除
**位置**: `src/app/tool/[slug]/alternatives/AlternativesClient.tsx:106-144`
```typescript
const filterTool = (tool: AlternativeTool): boolean => {
  // 默认启用: showAvailableOnly = true
  if (filters.showAvailableOnly && !tool.affiliateLink) return false;
  ...
}
```
**影响**: 如果用户启用了 "Show tools you can try now" 过滤器（默认启用），没有 affiliate link 的工具会被隐藏。

**检查方法**: 在 URL 中添加 `?debug=1` 查看 debug 模式，或禁用 "Show tools you can try now" 过滤器。

## 6. 数据验证

### InVideo Alternatives 页面显示的工具
根据 `TOOL_SHORTLISTS.invideo` 和 `alternativesEvidence.json`，应该显示：
- ✅ **veed-io**: 有 evidence 数据 + 有 affiliate link
- ✅ **heygen**: 有 evidence 数据 + 有 affiliate link
- ✅ **synthesia**: 有 evidence 数据 + 有 affiliate link
- ✅ **pictory**: 有 evidence 数据 + 需要检查 affiliate link
- ⚠️ **fliki**: 可能有 evidence（在 alternatives.ts 中） + 需要检查 affiliate link
- ⚠️ **zebracat, elai-io, pika**: 需要检查是否有 evidence 和 affiliate link

### 验证命令
```bash
# 检查 tools.json 中工具的 affiliate_link
grep -A 2 '"slug": "fliki"' src/data/tools.json | grep affiliate_link

# 检查 alternativesEvidence.json 中的工具
grep '"tool":' src/data/alternativesEvidence.json
```

## 7. 总结

**数据流**:
1. `page.tsx` → `buildAlternativeGroups()` → `buildAlternativeTool()`
2. `buildAlternativeTool()` 从 `alternativesEvidence.json` 读取证据（key = `tool` 字段，值为 slug）
3. 如果证据不存在，使用 `tools.json` 中的工具数据作为 fallback
4. 最终渲染到 `AlternativesClient` 组件

**关键发现**:
- InVideo alternatives 页面**不显示 InVideo 自己**，而是显示其他工具作为替代品
- 数据索引使用 `tool.slug`（不是 `tool.name`）
- `alternativesEvidence.json` 中存储的是**替代工具**的证据，不是当前工具的证据
- 没有 affiliate link 的工具会被过滤掉（除非在 debug 模式下）
