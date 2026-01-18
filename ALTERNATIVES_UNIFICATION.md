# Alternatives 页面统一化说明

## 改动概述

以 `/tool/invideo/alternatives` 作为母版，统一所有工具的 alternatives 页面结构。

## 修改的文件

### 1. 新增组件

#### `src/components/alternatives/AlternativesReasonGroup.tsx`
- **功能**: 渲染一个 switching reason 分组（标题 + 描述 + 工具卡片网格）
- **Props**:
  - `group: AlternativeGroup` - 分组数据
  - `expandedCards: Set<string>` - 已展开的卡片 ID 集合
  - `onToggleCard: (cardId: string) => void` - 切换卡片展开状态
  - `onShowEvidence: (links: string[], toolName: string) => void` - 显示证据链接

#### `src/components/alternatives/AlternativeToolCard.tsx`
- **功能**: 渲染单个替代工具卡片
- **Props**:
  - `tool: AlternativeTool` - 工具数据
  - `cardId: string` - 卡片唯一 ID
  - `isExpanded: boolean` - 是否展开
  - `onToggle: () => void` - 切换展开状态
  - `onShowEvidence: (links: string[], toolName: string) => void` - 显示证据链接
- **特性**:
  - 自动截断文本到 18 个词
  - 支持展开/折叠详细信息
  - 显示 Best For chips、Why Switch、Trade-offs、Pricing Signals、Evidence Links

#### `src/components/alternatives/types.ts`
- **功能**: 定义类型和标准 switching reasons
- **类型**:
  - `AlternativeTool` - 替代工具数据结构
  - `AlternativeGroup` - 分组数据结构
- **常量**:
  - `STANDARD_SWITCHING_REASONS` - 4 个标准切换原因

### 2. 新增工具函数

#### `src/lib/buildAlternativesData.ts`
- **功能**: 构建 alternatives 页面数据
- **主要函数**:
  - `buildAlternativeTool()` - 从工具数据和证据构建 AlternativeTool
  - `buildAlternativeGroups()` - 使用标准 switching reasons 构建分组
  - `hasAffiliate()` - 检查工具是否有 affiliate link
  - `isValidClaim()` - 检查 claim 是否有效（不含 [NEED VERIFICATION]）
  - `cleanClaim()` - 清理 claim（移除验证标签）
  - `filterEvidenceLinks()` - 过滤证据链接（仅内部链接）
  - `truncateText()` - 截断文本到指定词数

### 3. 更新的文件

#### `src/app/tool/[slug]/alternatives/AlternativesClient.tsx`
- **改动**: 完全重写，使用新组件
- **新增功能**:
  - 页面顶部 Hero 区域（标题 + 说明）
  - 使用 `AlternativesReasonGroup` 组件渲染分组
  - FAQ 区块（6-8 个高意图问题）
  - 保持原有的搜索、过滤、滚动导航功能

#### `src/app/tool/[slug]/alternatives/page.tsx`
- **改动**: 使用新的数据构建函数
- **功能**:
  - 支持所有工具（不再仅限 InVideo）
  - 使用 `buildAlternativeGroups()` 构建标准分组
  - 使用 `generateSmartFAQs()` 生成 FAQ
  - 工具特定短名单（`TOOL_SHORTLISTS`）

## 数据结构

### AlternativeTool
```typescript
{
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  startingPrice: string;
  rating?: number;
  affiliateLink: string;
  compareLink?: string;
  hasFreeTrial: boolean;
  bestFor: string[]; // 最多 3 个
  whySwitch: string[]; // 2-3 条，每条 <= 18 words
  tradeOff: string | null; // 1 条，<= 18 words
  pricingSignals: {
    freePlan?: string;
    watermark?: string;
    exportQuality?: string;
    refundCancel?: string;
  };
  evidenceLinks: string[]; // 仅内部链接，最多 3 个
}
```

### AlternativeGroup
```typescript
{
  id: string; // 'cost-control' | 'output-quality' | 'workflow-speed' | 'control-compliance'
  title: string;
  description: string;
  tools: AlternativeTool[]; // 最多 3 个工具
}
```

## 标准 Switching Reasons

1. **Cost control & credits surprises**
   - 描述: Tools with clearer pricing, better free tiers, or more predictable credit consumption.

2. **Output quality / realism**
   - 描述: Alternatives with higher export resolution, better avatar quality, or more realistic AI voices.

3. **Workflow speed & simplicity**
   - 描述: Faster generation, simpler interfaces, or better automation for high-volume creators.

4. **Control & compliance**
   - 描述: More editing control, better licensing terms, or stronger compliance features.

## 数据映射规则

1. **证据来源优先级**:
   - `alternativesEvidence.json` (按 tool slug)
   - 工具数据 fallback (`tool.best_for`, `tool.pros`, `tool.cons`)

2. **过滤规则**:
   - 任意 claim 或 fact 含 `[NEED VERIFICATION]` 的条目不渲染
   - sources 仅允许站内路径（`/tool/...` `/vs/...`）
   - 外部链接自动丢弃或映射到站内对应页

3. **文本处理**:
   - Why Switch: 每条自动截断到 18 个词
   - Trade-off: 自动截断到 18 个词
   - Best For: 最多显示 3 个 tags

## SEO/内容一致性

1. **标题模板**: `{Tool} Alternatives (2026): Best Replacements by Use Case`
2. **页面顶部说明**: "Based on testing and user feedback. Different account limits may vary."
3. **FAQ 区块**: 6-8 个高意图问题，与四个 switching reasons 对齐
4. **链接**: 优先使用站内链接（`/tool/[slug]` 和 `/vs/...`）

## 测试工具

以下工具已更新，可以验证效果：
- InVideo (`/tool/invideo/alternatives`)
- Veed.io (`/tool/veed-io/alternatives`)
- HeyGen (`/tool/heygen/alternatives`)
- Fliki (`/tool/fliki/alternatives`)

其他工具会自动使用同一套组件和数据构建逻辑。

## 注意事项

1. InVideo Alternatives 页面渲染不受影响（使用相同组件）
2. 如果工具没有证据数据，会使用工具数据作为 fallback
3. 如果工具没有 affiliate link，不会显示在列表中（除非在 debug 模式下）
4. FAQ 使用智能生成逻辑，确保与 switching reasons 对齐
