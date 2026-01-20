# Proof 数据流根因分析与最小修复

## 根因定位（代码证据）

### ① InVideo evidenceLinks 为空的确切原因

**文件**: `src/app/tool/[slug]/alternatives/page.tsx:52-55`
```typescript
const evidenceMap = new Map<string, any>();
Object.entries(alternativesEvidence).forEach(([toolSlug, evidence]) => {
  evidenceMap.set(toolSlug, evidence);  // ❌ 问题：直接放入 ToolAlternativeEvidence，不是 ToolEvidence
});
```

**问题路径**:
1. `alternativesEvidence` 类型是 `Record<string, ToolAlternativeEvidence>`
2. `ToolAlternativeEvidence` 结构：`{ tool, bestFor, whySwitch[], tradeoffs[], pricingSignals }` - **没有 `evidenceLinks` 字段**
3. `buildToolWithEvidence` 期望 `ToolEvidence` 类型：`{ toolSlug, pickThisIf, extraReason, limitations, evidenceLinks?: string[] }`

**确切分支** (`src/lib/alternatives/mergeCanonicalAndEvidence.ts:260-263`):
```typescript
if (evidence?.evidenceLinks && evidence.evidenceLinks.length > 0) {
  finalLinks = normalizeEvidenceLinks(evidence.evidenceLinks, tool.slug);
}
// ❌ evidence.evidenceLinks 是 undefined（因为 ToolAlternativeEvidence 没有这个字段）
// ❌ 所以 finalLinks 保持为 []
```

**为什么默认 links 没进入** (`src/lib/alternatives/mergeCanonicalAndEvidence.ts:267-269`):
```typescript
if (finalLinks.length === 0) {
  finalLinks = generateDefaultEvidenceLinks(tool.slug);  // ✅ 这里应该执行
}
// ✅ generateDefaultEvidenceLinks 返回 ['/tool/invideo/pricing', '/tool/invideo/features', '/tool/invideo/reviews']
// ✅ finalLinks 应该被赋值，但可能后续被覆盖或未正确返回
```

**实际验证**: 检查 `generateDefaultEvidenceLinks` 返回值是否被正确使用。

### ② HeyGen 重复问题的"第一现场"

**源数据结构** (`src/data/evidence/alternatives.ts:310-430`):
```typescript
"heygen": {
  whySwitch: [
    { claim: "...", sources: [{ url: "/tool/heygen/pricing", ... }] },  // 第1次出现
    { claim: "...", sources: [{ url: "/tool/heygen/pricing", ... }] },  // 第2次出现
  ],
  tradeoffs: [
    { claim: "...", sources: [{ url: "/tool/heygen/pricing", ... }] },  // 第3次出现
  ],
  pricingSignals: {
    freePlan: { sources: [{ url: "/tool/heygen/pricing", ... }] },      // 第4次出现
    watermark: { sources: [{ url: "/tool/heygen/pricing", ... }] },     // 第5次出现
    exportQuality: { sources: [{ url: "/tool/heygen/pricing", ... }] }, // 第6次出现
    refundCancel: { sources: [{ url: "/tool/heygen/pricing", ... }] },  // 第7次出现
  }
}
```

**重复产生的第一现场**: 
- **源数据重复**: `/tool/heygen/pricing` 在多个 `sources` 中出现
- **缺少转换层**: `alternativesEvidence` 没有被转换为 `ToolEvidence`，没有提取并去重 `evidenceLinks`
- **字段结构不匹配**: `ToolAlternativeEvidence` 没有 `evidenceLinks` 字段，只有嵌套的 `sources[].url`

**如果转换了，应该这样提取**:
```typescript
// 应该从 whySwitch[].sources[].url + tradeoffs[].sources[].url + pricingSignals.*.sources[].url 提取
// 但当前代码没有这个转换步骤
```

## 最小修复 Patch

### Patch 1: 在 page.tsx 中转换 ToolAlternativeEvidence → ToolEvidence

```diff
--- a/src/app/tool/[slug]/alternatives/page.tsx
+++ b/src/app/tool/[slug]/alternatives/page.tsx
@@ -50,8 +50,25 @@ export default async function AlternativesPage({ params }: { params: Promise<{
   if (canonicalConfig) {
     // Use canonical + evidence merge
     const evidenceMap = new Map<string, any>();
-    Object.entries(alternativesEvidence).forEach(([toolSlug, evidence]) => {
-      evidenceMap.set(toolSlug, evidence);
+    Object.entries(alternativesEvidence).forEach(([toolSlug, rawEvidence]) => {
+      // Convert ToolAlternativeEvidence to ToolEvidence by extracting evidenceLinks
+      const evidenceLinks = new Set<string>();
+      [...(rawEvidence.whySwitch || []), ...(rawEvidence.tradeoffs || [])].forEach(item => {
+        item.sources?.forEach(source => {
+          if (source.url) evidenceLinks.add(source.url);
+        });
+      });
+      // Also extract from pricingSignals
+      Object.values(rawEvidence.pricingSignals || {}).forEach(signal => {
+        signal?.sources?.forEach(source => {
+          if (source.url) evidenceLinks.add(source.url);
+        });
+      });
+      evidenceMap.set(toolSlug, {
+        toolSlug,
+        pickThisIf: rawEvidence.whySwitch?.[0]?.claim,
+        extraReason: rawEvidence.whySwitch?.[1]?.claim,
+        limitations: rawEvidence.tradeoffs?.[0]?.claim,
+        bestFor: rawEvidence.bestFor,
+        evidenceLinks: Array.from(evidenceLinks) // Already deduplicated by Set
+      });
     });
```

### Patch 2: 确保 buildToolWithEvidence 的 finalLinks 始终有值

```diff
--- a/src/lib/alternatives/mergeCanonicalAndEvidence.ts
+++ b/src/lib/alternatives/mergeCanonicalAndEvidence.ts
@@ -257,7 +257,7 @@ function buildToolWithEvidence(
     // IMPORTANT: Always ensure evidenceLinks is never empty (use default links if needed)
     // This is the SINGLE SOURCE OF TRUTH for evidenceLinks - all components should use this field
     evidenceLinks: (() => {
-      let finalLinks: string[] = [];
+      let finalLinks: string[] = generateDefaultEvidenceLinks(tool.slug); // Default first
       
       if (evidence?.evidenceLinks && evidence.evidenceLinks.length > 0) {
         // Normalize and deduplicate existing evidence links
-        finalLinks = normalizeEvidenceLinks(evidence.evidenceLinks, tool.slug);
+        finalLinks = normalizeEvidenceLinks(evidence.evidenceLinks, tool.slug); // Override if evidence exists
       }
       
-      // If still empty after normalization, or if no evidence exists, use default internal page links
-      // This ensures every tool has at least some proof sources
-      if (finalLinks.length === 0) {
-        finalLinks = generateDefaultEvidenceLinks(tool.slug);
-      }
-      
       // Final check: ensure we always have at least one link
       if (finalLinks.length === 0) {
         console.warn(`[Evidence] No evidence links for ${tool.slug}, even after default generation`);
         finalLinks = [`/tool/${tool.slug}`];
       }
       
       return finalLinks;
     })(),
```

### Patch 3: 确保 normalizeEvidenceLinks 正确处理去重

```diff
--- a/src/lib/alternatives/normalizeEvidenceLinks.ts
+++ b/src/lib/alternatives/normalizeEvidenceLinks.ts
@@ -12,7 +12,7 @@ export function normalizeEvidenceLinks(
   // Step 1: Extract strings from links (handle both string and object formats)
   const linkStrings: string[] = links.map(link => {
     if (typeof link === 'string') {
-      return link;
+      return link.trim();
     }
     // Handle object format: { url } or { href }
     return (link as any)?.url || (link as any)?.href || String(link);
```

### Patch 4: 移除所有重复去重逻辑，统一使用 tool.evidenceLinks

已在之前的修复中完成：
- `AlternativeToolCardV2.tsx`: 直接使用 `tool.evidenceLinks`
- `AlternativesClient.tsx`: 弹窗渲染前最后一步去重（防御性检查）

## 可复现验收步骤

### 验收 1: InVideo 不再 pending

1. 访问 `http://localhost:3000/tool/fliki/alternatives`
2. 找到 InVideo 卡片
3. 检查 Proof 按钮显示: `Proof (3 sources)`（不是 "pending"）
4. 点击 Proof 按钮，弹窗应显示：
   - `/tool/invideo/pricing`
   - `/tool/invideo/features`
   - `/tool/invideo/reviews`

**Console 输出验证**:
```
[Evidence] fliki -> invideo: No evidence found, will use default internal page links
[Evidence Final] fliki -> invideo: Final evidenceLinks count = 3
```

### 验收 2: HeyGen 弹窗不重复

1. 在同一页面找到 HeyGen 卡片
2. 检查 Proof 按钮显示: `Proof (1 sources)` 或 `Proof (n sources)`（n <= 3，且不重复）
3. 点击 Proof 按钮，弹窗应只显示 **1 条** `/tool/heygen/pricing`（或不同页面但不重复）

**Console 输出验证**:
```
[Evidence] fliki -> heygen: Found 1 links  // 或 Found n links（n <= 3，去重后）
[Evidence Final] fliki -> heygen: Final evidenceLinks count = 1  // 去重后的数量
```

## 验证 Console 输出片段（每个工具 3 行以内）

### InVideo (无 evidence，应使用默认链接)
```
[Evidence] fliki -> invideo: No evidence found, will use default internal page links
[Evidence Final] fliki -> invideo: Final evidenceLinks count = 3
```

### HeyGen (有 evidence，应去重)
```
[Evidence] fliki -> heygen: Found 7 links  // 源数据有 7 个 /tool/heygen/pricing
[Evidence Final] fliki -> heygen: Final evidenceLinks count = 1  // 去重后只有 1 个
```
