# Alternatives 页面根因分析报告

## ① 实际候选池来源文件与函数链路

### 调用路径：
```
/tool/[slug]/alternatives/page.tsx (line 34-85)
  ├─ 如果有 canonicalConfig (line 45)
  │   └─ mergeCanonicalAndEvidence() 
  │       └─ 候选池来源: allTools.filter(t => t.slug !== currentSlug) (line 306)
  │       └─ 但优先使用: canonical.ts 中的硬编码 toolSlugs (line 333-350)
  │
  └─ 如果没有 canonicalConfig (line 58-84)
      └─ getAlternativesShortlist() (line 61)
          └─ 候选池来源: allTools.filter(t => t.slug !== currentSlug) (line 76)
          └─ 但排序规则: whitelist tools 优先 (line 190-191)
      └─ buildAlternativeGroups() (line 62)
```

### 关键文件：
1. **`src/data/alternatives/canonical.ts`** - 硬编码的 toolSlugs 数组（每个 group 都有）
2. **`src/lib/alternatives/getAlternativesShortlist.ts`** - 评分和排序逻辑
3. **`src/lib/alternatives/mergeCanonicalAndEvidence.ts`** - 合并逻辑，优先使用硬编码 toolSlugs

## ② 当前筛选/排序规则

### 问题 1: Affiliate 工具被优先排序
**位置**: `getAlternativesShortlist.ts` line 122-126, 190-191

```typescript
// Line 122-126: Affiliate 工具 +2 分
if (isTryNowTool(tool)) {
  breakdown.hasAffiliate = 2;
  score += 2;  // ❌ 问题：affiliate 工具被加分
}

// Line 190-191: Whitelist tools 优先
topTools = [...whitelistTools, ...otherTools].slice(0, targetCount);
// ❌ 问题：affiliate 工具排在前面，即使相关性低
```

### 问题 2: 硬编码 toolSlugs 优先使用
**位置**: `mergeCanonicalAndEvidence.ts` line 333-350

```typescript
// Step 1: If legacy toolSlugs exist, use them first (backward compatibility)
if (group.toolSlugs && group.toolSlugs.length > 0) {
  for (const toolSlug of group.toolSlugs) {
    // ❌ 问题：硬编码的 toolSlugs 优先，忽略相关性评分
    tools.push(buildToolWithEvidence(tool, evidence, allTools, groupIntent));
  }
}
```

### 问题 3: 评分规则被覆盖
- Tags overlap: +3 per tag ✅
- Categories overlap: +2 per category ✅
- **Has affiliate: +2** ❌ (应该移除或降低权重)
- Rating bonus: +0~1 ✅

## ③ 去重逻辑是否缺失

### 同页去重：✅ 存在但有限
**位置**: `mergeCanonicalAndEvidence.ts` line 325, 340, 359, 386

```typescript
const usedToolSlugs = new Set<string>(); // ✅ 同页去重
if (usedToolSlugs.has(toolSlug)) continue; // ✅ 检查
```

**问题**：
- ✅ 同页内去重有效
- ❌ **跨页面没有去重机制**（Fliki/HeyGen/InVideo 在不同页面重复出现）

### 跨分组去重：✅ 存在
- `usedToolSlugs` 在 groups.map() 外层定义，确保跨分组去重

## ④ 分组映射是否硬塞同一批工具

### 问题：✅ 确认硬编码
**位置**: `canonical.ts` line 14-243

**证据**：
- `invideo` groups: `['veed-io', 'descript']`, `['pictory', 'fliki']`, `['heygen', 'synthesia']`
- `fliki` groups: `['invideo', 'zebracat']`, `['pictory', 'veed-io']`, `['descript', 'capcut']`, `['heygen', 'synthesia']`
- `heygen` groups: 没有 toolSlugs（动态选择），但其他工具都有硬编码

**循环互推证据**：
- Fliki → InVideo (line 51)
- InVideo → Fliki (line 28)
- HeyGen 出现在多个工具的 groups 中

**Descript 固定兜底证据**：
- `invideo` editing-control: `['veed-io', 'descript']` (line 22)
- `fliki` editing-control: `['descript', 'capcut']` (line 63)
- `veed-io` quality-issues: `['descript', 'riverside']` (line 86)
- `synthesia` enterprise-security: `['vyond', 'descript']` (line 185)

## 总结：根因清单

1. ✅ **硬编码 toolSlugs**：`canonical.ts` 中每个 group 都有固定的 toolSlugs 数组
2. ✅ **Affiliate 优先排序**：`getAlternativesShortlist.ts` 中 affiliate 工具 +2 分，且排序时优先
3. ✅ **循环互推**：canonical.ts 中 Fliki/InVideo/HeyGen 互相出现在对方的 groups 中
4. ✅ **Descript 固定兜底**：多个 editing-control 和 quality-issues groups 都硬编码了 descript
5. ✅ **跨页面无去重**：只有同页去重，跨页面没有机制
6. ✅ **候选池受限**：虽然从 allTools 筛选，但硬编码 toolSlugs 优先，导致实际候选池很小
