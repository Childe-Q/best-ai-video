# Alternatives 架构：Canonical + Evidence 两层设计

## 架构概述

Alternatives 页面采用两层架构，彻底防止 AI dossier 覆盖结构：

### A. Canonical 层（结构，不可被 AI 覆盖）

**位置**: `src/data/alternatives/canonical.ts`

**职责**:
- 定义分组标题与顺序（固定四类 tabs 或该页原本 use-case 结构）
- 定义每组包含哪些工具（必须是站内 `tools.json` 中的工具）
- Filters（free trial / free plan / 4k / watermark）仅由 tools 属性驱动

**规则**:
- 所有 `toolSlugs` 必须存在于 `tools.json`
- Evidence 不允许改变上面三件事

### B. Evidence 层（仅文案）

**位置**: `src/data/alternatives/evidence.ts`

**职责**:
- 为"站内已存在工具 slug"提供文案：
  - `pickThisIf` (whySwitch[0])
  - `extraReason` (whySwitch[1], 可选)
  - `limitations` (tradeoffs[0])
  - `evidenceLinks` (sources 去重)

**规则**:
- Pricing details **永远从站内 pricing 数据源读取**，不从 evidence 生成
- Evidence 中出现的 tool slug 若不在站内 tools，会被忽略并 console.warn

## 工程护栏

### 1. 类型约束

**文件**: `src/types/alternatives.ts`

- `CanonicalAlternativesConfig`: 定义 canonical 结构
- `ToolEvidence`: 定义 evidence 结构（禁止包含 groups/filters/tool list 字段）
- `AlternativeToolWithEvidence`: 合并后的结果类型

### 2. 验证逻辑

**文件**: `src/lib/alternatives/mergeCanonicalAndEvidence.ts`

- `validateCanonicalConfig()`: 验证 canonical 中所有 tool slugs 存在
- `validateEvidence()`: 验证 evidence 不包含结构字段，tool slug 存在
- 合并时自动校验并 console.warn

### 3. UI 渲染断言

**文件**: `src/app/alternatives/[slug]/page.tsx`

- Tabs/分组标题只来自 canonical config
- 工具列表只来自 canonical config
- Evidence 只提供文案

## 使用方法

### 添加新的 Alternatives 页面

1. **在 `canonical.ts` 中添加配置**:
```typescript
'new-tool': {
  toolSlug: 'new-tool',
  groups: [
    {
      id: 'cost-control',
      title: 'Cost control',
      description: '...',
      toolSlugs: ['tool1', 'tool2'] // 必须是 tools.json 中的 slugs
    },
    // ... 更多 groups
  ]
}
```

2. **在 `evidence.ts` 中添加文案**:
```typescript
'tool1': {
  toolSlug: 'tool1',
  pickThisIf: '...',
  extraReason: '...', // 可选
  limitations: '...',
  evidenceLinks: ['/tool/tool1/pricing']
}
```

3. **页面会自动使用新配置**

### 从 Dossier JSON 提取 Evidence

使用 `extractEvidenceFromDossier()` 函数：

```typescript
import { extractEvidenceFromDossier } from '@/lib/alternatives/extractEvidenceFromDossier';
import dossierData from '@/data/alternatives/fliki.json';

const evidenceMap = extractEvidenceFromDossier(dossierData);
// 然后手动添加到 evidence.ts
```

## 回滚说明

已回滚所有"把 tool list / group list 替换成 dossier"的改动：

- ❌ 删除了直接使用 dossier JSON 的特殊 Client 组件（FlikiAlternativesClient, VeedAlternativesClient 等）
- ✅ 统一使用 `mergeCanonicalAndEvidence()` 合并逻辑
- ✅ 所有页面使用统一的 `AlternativesClient` 组件

## 验收检查

- ✅ veed/fliki alternatives 不再出现站内不存在的工具卡（CapCut 等）
- ✅ InVideo tabs（Editing control 等）恢复
- ✅ 只有卡片的 Pick this if / Limitations / Evidence 变得更充实，结构不变
