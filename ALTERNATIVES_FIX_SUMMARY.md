# Alternatives 页面修复总结

## 根因分析结果

### ① 候选池来源与调用路径

**调用链路**：
```
/tool/[slug]/alternatives/page.tsx
  └─ mergeCanonicalAndEvidence() 
      ├─ 候选池来源: allTools.filter(t => t.slug !== currentSlug)
      └─ ❌ 问题：优先使用 canonical.ts 中的硬编码 toolSlugs
```

**关键文件**：
- `src/data/alternatives/canonical.ts` - 硬编码 toolSlugs 数组
- `src/lib/alternatives/getAlternativesShortlist.ts` - 评分逻辑（affiliate +2 分）
- `src/lib/alternatives/mergeCanonicalAndEvidence.ts` - 合并逻辑（优先硬编码）

### ② 筛选/排序规则问题

**问题 1**: Affiliate 工具被优先排序
- `getAlternativesShortlist.ts` line 122-126: affiliate 工具 +2 分
- Line 190-191: whitelist tools 排在前面

**问题 2**: 硬编码 toolSlugs 优先使用
- `mergeCanonicalAndEvidence.ts` line 333-350: 硬编码 toolSlugs 优先于评分

**问题 3**: 评分规则被覆盖
- Tags: +3 ✅
- Categories: +2 ✅
- **Affiliate: +2** ❌ (已移除)
- Rating: +0~1 ✅

### ③ 去重逻辑

**同页去重**: ✅ 存在 (`usedToolSlugs` Set)
**跨页面去重**: ❌ 缺失（已通过循环互推阻止逻辑解决）

### ④ 分组映射硬塞问题

**确认**: ✅ 硬编码 toolSlugs 导致同一批工具被硬塞到每个分组
- `canonical.ts` 中每个 group 都有固定的 toolSlugs
- Fliki/InVideo/HeyGen 循环互推
- Descript 固定出现在多个 editing-control groups

## 修复实施

### 1. 新建可信推荐池 (`getTrustedAlternativesPool.ts`)

**功能**：
- ✅ 按相关性排序（Tags + Categories + Rating），**不**按 affiliate 状态
- ✅ 阻止循环互推（Fliki/HeyGen/InVideo 互不出现）
- ✅ 分离 Best Match (Editorial) 和 Deals (Sponsored)
- ✅ 包含所有工具（Runway, Sora, Veo 等）

**关键逻辑**：
```typescript
// 相关性评分（不包含 affiliate）
score = tagsOverlap * 3 + categoriesOverlap * 2 + ratingBonus

// 阻止循环互推
if (isBlockedByCircularReference(currentSlug, candidateSlug)) continue;

// 分离编辑推荐和推广
bestMatch = non-affiliate tools (sorted by relevance)
deals = affiliate tools (sorted by relevance)
```

### 2. 移除 Affiliate 加分 (`getAlternativesShortlist.ts`)

**修改**：
- ❌ 移除: `if (isTryNowTool(tool)) score += 2;`
- ✅ 改为: 仅追踪用于 UI 标签，不参与评分
- ✅ 排序: 按 score 降序，不再优先 whitelist tools

### 3. 移除硬编码 toolSlugs 优先级 (`mergeCanonicalAndEvidence.ts`)

**修改**：
- ❌ 移除: Step 1 的硬编码 toolSlugs 优先逻辑
- ✅ 改为: 完全基于相关性评分和 group intent 匹配
- ✅ 使用: `getTrustedAlternativesPool` 获取候选池

### 4. 增强专属推荐理由生成 (`generateFallbackCopy`)

**改进**：
- ✅ 基于工具独特特征（uniqueTags, uniqueCats）生成描述
- ✅ 对比当前工具，突出差异点
- ✅ 生成专属 limitations（从 tool.cons 或工具属性）
- ✅ 避免模板化描述

### 5. UI 分层显示 (`AlternativesReasonGroup.tsx`)

**新增**：
- ✅ Best Match 区域：显示 "Editorial" 标签
- ✅ Deals 区域：显示 "Sponsored" 标签
- ✅ 向后兼容：如果没有分层数据，显示所有 tools

### 6. 更新类型定义 (`types/alternatives.ts`)

**新增字段**：
```typescript
AlternativeGroupWithEvidence {
  bestMatch?: AlternativeToolWithEvidence[]; // 编辑推荐
  deals?: AlternativeToolWithEvidence[];     // 推广位
}
```

## 修复效果

### 修复前：
- ❌ 固定 8 个工具（硬编码 toolSlugs）
- ❌ 7 个带 Try now（affiliate 优先排序）
- ❌ Fliki/HeyGen/InVideo 循环互推
- ❌ Descript 固定兜底
- ❌ 模板化描述

### 修复后：
- ✅ 候选池来自 allTools（可扩展，包含 Runway/Sora/Veo）
- ✅ 按相关性排序（Tags + Categories + Rating）
- ✅ 阻止循环互推（CIRCULAR_REFERENCE_BLOCKLIST）
- ✅ Descript 仅在 editing-control 且相关时出现
- ✅ 专属推荐理由（基于工具特征和对比）
- ✅ Best Match vs Deals 分层显示

## 验证方法

1. **检查候选池**：
   - 访问 `/tool/invideo/alternatives`
   - 查看 dev console: `[Trusted Alternatives Pool]`
   - 确认包含 Runway, Sora 等非 affiliate 工具

2. **检查去重**：
   - 访问 `/tool/fliki/alternatives` 和 `/tool/heygen/alternatives`
   - 确认不出现循环互推（Fliki 页面不应出现 Heygen/InVideo）

3. **检查分层**：
   - 确认 Best Match 区域显示非 affiliate 工具
   - 确认 Deals 区域显示 affiliate 工具

4. **检查专属描述**：
   - 每个工具的描述应基于其独特特征
   - 不应出现模板化描述
