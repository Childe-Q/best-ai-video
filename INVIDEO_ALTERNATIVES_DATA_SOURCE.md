# InVideo Alternatives 页面数据源定位

## 1. 路由文件

**文件路径**: `src/app/tool/[slug]/alternatives/page.tsx`

**关键代码位置**:
- 第 37-47 行: 主函数，调用 `buildAlternativeGroups()`
- 第 29-35 行: `TOOL_SHORTLISTS` 定义（InVideo 的 shortlist）

## 2. 数据源文件

### 主要数据源

#### A. `src/data/alternativesEvidence.json`
- **用途**: 存储替代工具的证据数据（whySwitch, tradeoffs, bestFor, pricingSignals）
- **索引方式**: 使用 `tool` 字段作为 key（值为 slug）
- **InVideo 相关条目**: ❌ **不存在**（该文件存储的是**其他工具作为 InVideo 替代品**的数据）
- **现有条目**:
  - ✅ `veed-io` (tool: "veed-io")
  - ✅ `heygen` (tool: "heygen")
  - ✅ `synthesia` (tool: "synthesia")
  - ✅ `pictory` (tool: "pictory")
  - ❌ `fliki` (不存在，但在 `alternatives.ts` 中存在)
  - ❌ `zebracat`, `elai-io`, `pika` (不存在)

#### B. `src/data/evidence/alternatives.ts`
- **用途**: TypeScript 格式的替代证据数据（与 JSON 等效）
- **索引方式**: `alternativesEvidence[slug]` (Record<string, ToolAlternativeEvidence>)
- **InVideo 相关条目**: ✅ `fliki` 存在（但 JSON 文件中没有）
- **注意**: `buildAlternativesData.ts` **只读取 JSON 文件**，不读取 TS 文件

#### C. `src/data/tools.json`
- **用途**: 工具基础数据（name, slug, affiliate_link, pros, cons, best_for）
- **索引方式**: `getTool(slug)` - 使用 `slug` 字段匹配
- **InVideo 条目**: ✅ 存在（`slug: "invideo"`）

#### D. `content/tools/invideo.json` (可选)
- **用途**: InVideo 的结构化内容数据
- **索引方式**: `loadToolContent("invideo")` - 使用文件路径
- **InVideo 条目**: ✅ 存在

## 3. 数据索引方式

### alternativesEvidence.json
```json
[
  {
    "tool": "veed-io",  // ← 这是 key，值为 slug
    "bestFor": [...],
    "whySwitch": [...],
    "tradeoffs": [...]
  }
]
```

**索引代码** (`buildAlternativesData.ts:175-178`):
```typescript
const evidenceMap = new Map<string, any>();
(alternativesEvidenceData as any[]).forEach(e => {
  evidenceMap.set(e.tool, e); // ← 使用 e.tool 作为 key
});

// 使用时
const evidence = evidenceMap.get(t.slug); // ← 使用 tool.slug 查找
```

**关键**: 
- 存储时 key = `e.tool` (值为 slug，如 "veed-io")
- 查找时 key = `t.slug` (工具的 slug)
- **必须匹配**才能找到证据数据

## 4. InVideo Alternatives 页面数据流

```
用户访问: /tool/invideo/alternatives
         │
         ▼
src/app/tool/[slug]/alternatives/page.tsx
  - slug = "invideo"
  - tool = getTool("invideo") from tools.json ✅
  - toolShortlist = ['invideo', 'heygen', 'fliki', 'veed-io', ...]
         │
         ▼
buildAlternativeGroups(tool, allTools, toolShortlist)
  (src/lib/buildAlternativesData.ts)
         │
         ├─ 读取 alternativesEvidence.json
         │   evidenceMap.set(e.tool, e)
         │   → Key: "veed-io", "heygen", "synthesia", "pictory"
         │
         ├─ 遍历 4 个 STANDARD_SWITCHING_REASONS
         │
         └─ 对每个 reason，筛选候选工具（从 toolShortlist，排除 invideo）
            → 候选: ['heygen', 'fliki', 'veed-io', 'zebracat', ...]
                 │
                 ▼
            buildAlternativeTool(tool, evidence, "invideo")
                 │
                 ├─ 检查: hasAffiliate(tool) ✅
                 │
                 ├─ 查找证据: evidence = evidenceMap.get(tool.slug)
                 │   - heygen: ✅ 找到 (evidenceMap.get("heygen"))
                 │   - veed-io: ✅ 找到 (evidenceMap.get("veed-io"))
                 │   - synthesia: ✅ 找到 (evidenceMap.get("synthesia"))
                 │   - fliki: ❌ 未找到 (JSON 中没有，但 TS 文件中有)
                 │   - zebracat: ❌ 未找到
                 │   - elai-io: ❌ 未找到
                 │   - pika: ❌ 未找到
                 │
                 └─ 如果 evidence 不存在 → 使用 fallback
                    - bestFor: tool.best_for.split(/[,&]/)
                    - whySwitch: tool.pros.slice(0, 2)
                    - tradeOff: tool.cons[0]
                 │
                 ▼
            AlternativesClient Component
              - 接收 groups (4个 switching reason 分组)
              - 每个分组包含最多 3 个工具卡片
              - 渲染到页面
```

## 5. InVideo 数据条目验证

### ✅ tools.json 中的 InVideo
```json
{
  "slug": "invideo",
  "name": "InVideo",
  "affiliate_link": "https://invideo.sjv.io/...",
  "best_for": "Social Media Marketers & YouTubers",
  "pros": [...],
  "cons": [...]
}
```
**状态**: ✅ 存在且完整

### ❌ alternativesEvidence.json 中的 InVideo
**状态**: ❌ **不存在**（这是正常的，因为该文件存储的是**其他工具作为 InVideo 替代品**的数据）

### ✅ alternativesEvidence.json 中的替代工具
- ✅ `veed-io`: 有完整数据（2 whySwitch, 1 tradeoffs）
- ✅ `heygen`: 有完整数据（2 whySwitch, 1 tradeoffs）
- ✅ `synthesia`: 有完整数据（2 whySwitch, 1 tradeoffs）
- ✅ `pictory`: 有完整数据（2 whySwitch, 1 tradeoffs）
- ❌ `fliki`: **不存在**（但在 `alternatives.ts` 中存在）
- ❌ `zebracat`, `elai-io`, `pika`: 不存在

### ⚠️ 问题发现
**`fliki` 在 `alternatives.ts` 中存在，但 `buildAlternativesData.ts` 只读取 JSON 文件**，导致 fliki 没有证据数据，只能使用 fallback。

## 6. 其他工具不展示的最可能 3 个原因

### 原因 1: 缺少 Affiliate Link（最可能）✅ 已排除
**位置**: `src/lib/buildAlternativesData.ts:63`
```typescript
if (!hasAffiliate(tool)) return null;
```
**验证结果**: ✅ 所有 shortlist 工具都有 affiliate_link

### 原因 2: 不在 Tool Shortlist 中 ✅ 已排除
**位置**: `src/app/tool/[slug]/alternatives/page.tsx:29-35`
```typescript
const TOOL_SHORTLISTS: Record<string, string[]> = {
  invideo: ['invideo', 'heygen', 'fliki', 'veed-io', 'zebracat', 'synthesia', 'elai-io', 'pika'],
};
```
**验证结果**: ✅ 所有工具都在 shortlist 中

### 原因 3: 被过滤条件排除（最可能）⚠️ 需要检查
**位置**: `src/app/tool/[slug]/alternatives/AlternativesClient.tsx:106-144`
```typescript
const filterTool = (tool: AlternativeTool): boolean => {
  // 默认启用: showAvailableOnly = true
  if (filters.showAvailableOnly && !tool.affiliateLink) return false;
  ...
}
```
**验证结果**: ⚠️ 如果工具没有 affiliate link，会被默认过滤器隐藏

**但根据检查，所有工具都有 affiliate_link，所以这个原因也被排除。**

### 实际原因: 缺少 Evidence 数据导致内容不足
**位置**: `src/lib/buildAlternativesData.ts:91-161`
- 如果工具没有 evidence 数据，会使用 fallback（tool.pros/cons）
- 如果 fallback 数据也不足，工具卡片可能内容很少
- **但不会导致工具完全不显示**（只要 hasAffiliate 为 true）

## 7. 渲染链路图

```
┌─────────────────────────────────────────────────────────────┐
│ URL: /tool/invideo/alternatives                             │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ src/app/tool/[slug]/alternatives/page.tsx                   │
│ - params.slug = "invideo"                                    │
│ - tool = getTool("invideo") from tools.json                 │
│ - toolShortlist = ['heygen', 'fliki', 'veed-io', ...]      │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ buildAlternativeGroups(tool, allTools, toolShortlist)       │
│ (src/lib/buildAlternativesData.ts:169)                      │
│                                                              │
│ 1. 读取数据源:                                               │
│    alternativesEvidenceData from                             │
│    '@/data/alternativesEvidence.json'                        │
│    → evidenceMap.set(e.tool, e)                            │
│    → Keys: "veed-io", "heygen", "synthesia", "pictory"     │
│                                                              │
│ 2. 遍历 STANDARD_SWITCHING_REASONS (4个):                   │
│    - cost-control                                            │
│    - output-quality                                           │
│    - workflow-speed                                           │
│    - control-compliance                                       │
│                                                              │
│ 3. 对每个 reason:                                            │
│    - 筛选候选工具（从 toolShortlist，排除 "invideo"）        │
│    - 对每个候选工具调用 buildAlternativeTool()              │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ buildAlternativeTool(tool, evidence, "invideo")            │
│ (src/lib/buildAlternativesData.ts:58)                       │
│                                                              │
│ 数据来源优先级:                                              │
│ 1. evidence (from alternativesEvidence.json)               │
│    - evidence = evidenceMap.get(tool.slug)                  │
│    - 如果找到: 使用 evidence.bestFor, whySwitch, tradeoffs  │
│    - 如果未找到: 使用 fallback                               │
│                                                              │
│ 2. Fallback (tool 数据):                                    │
│    - bestFor: tool.best_for.split(/[,&]/)                  │
│    - whySwitch: tool.pros.slice(0, 2)                      │
│    - tradeOff: tool.cons[0]                                 │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ AlternativesClient Component                                │
│ (src/app/tool/[slug]/alternatives/AlternativesClient.tsx)  │
│                                                              │
│ 接收:                                                        │
│ - groups: AlternativeGroup[] (4个分组)                      │
│ - toolName: "InVideo"                                        │
│ - faqs: FAQ[]                                                │
│                                                              │
│ 渲染:                                                        │
│ - Hero Section                                               │
│ - Search & Filters                                          │
│ - Sticky Navigation (4个 switching reasons)                  │
│ - AlternativesReasonGroup (每个 reason)                     │
│   └─ AlternativeToolCard (每个工具)                         │
│ - FAQ Section                                                │
└─────────────────────────────────────────────────────────────┘
```

## 8. 关键发现

1. **数据索引 key**: `alternativesEvidence.json` 使用 `tool` 字段（值为 slug）作为 key
2. **InVideo 不显示自己**: InVideo alternatives 页面显示的是**其他工具作为替代品**，不是 InVideo 自己的数据
3. **Fliki 数据缺失**: `fliki` 在 `alternatives.ts` 中存在，但 `buildAlternativesData.ts` 只读取 JSON 文件，导致 fliki 没有证据数据
4. **Fallback 机制**: 如果工具没有 evidence 数据，会使用 `tools.json` 中的 `pros`/`cons`/`best_for` 作为 fallback

## 9. 修复建议

如果要让所有工具都有完整的证据数据，需要：
1. 将 `alternatives.ts` 中的 `fliki` 数据迁移到 `alternativesEvidence.json`
2. 或者修改 `buildAlternativesData.ts` 同时读取 JSON 和 TS 文件
3. 为 `zebracat`, `elai-io`, `pika` 添加证据数据到 `alternativesEvidence.json`
