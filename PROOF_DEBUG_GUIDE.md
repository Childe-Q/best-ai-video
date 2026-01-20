# Proof 数据流调试指南

## 调试日志层级

### 1. 数据组装层（mergeCanonicalAndEvidence.ts）

#### evidenceMap 访问
- **位置**: `mergeCanonicalAndEvidence` 函数中，调用 `buildToolWithEvidence` 之前
- **日志标签**: `[Proof Debug - evidenceMap Access]`
- **输出内容**:
  - `currentSlug`: 当前工具 slug
  - `candidateSlug`: 候选工具 slug
  - `toolName`: 候选工具名称
  - `evidenceMapHas`: evidenceMap.has(candidateSlug) 的结果
  - `evidenceMapGetRaw`: evidenceMap.get(candidateSlug) 的原始值
  - `evidenceMapGetType`: 原始值的类型
  - `evidenceLinksFromMap`: 从 evidenceMap 中获取的 evidenceLinks
  - `evidenceLinksFromMapCount`: evidenceLinks 的数量

#### buildToolWithEvidence 内部
- **位置**: `buildToolWithEvidence` 函数中，evidenceLinks 处理逻辑
- **日志标签**: 
  - `[Proof Debug - Data Assembly Layer] buildToolWithEvidence`
  - `[Proof Debug - normalizeEvidenceLinks]`
  - `[Proof Debug - generateDefaultEvidenceLinks]`
  - `[Proof Debug - Final evidenceLinks]`
- **输出内容**:
  - `evidenceLinksRaw`: evidence?.evidenceLinks 的原始值
  - `evidenceLinksRawType`: 原始值的类型
  - `evidenceLinksRawCount`: 原始数量
  - `inputLinks` / `outputLinks`: normalizeEvidenceLinks 的输入/输出
  - `defaultLinks`: generateDefaultEvidenceLinks 的输出
  - `finalEvidenceLinks`: 最终的 evidenceLinks 数组
  - `finalCount`: 最终数量
  - `source`: 来源（'evidence' 或 'default'）

### 2. 渲染层（AlternativeToolCardV2.tsx）

- **位置**: `AlternativeToolCardV2` 组件中，渲染 Proof 按钮之前
- **日志标签**: `[Proof Debug - Rendering Layer] AlternativeToolCardV2`
- **输出内容**:
  - `currentSlug`: 当前工具 slug（从 props 传入）
  - `candidateSlug`: 候选工具 slug
  - `toolSlug`: 工具 slug
  - `toolName`: 工具名称
  - `rawEvidenceLinks`: 原始证据链接数组
  - `rawCount`: 原始数量
  - `normalizedEvidenceLinks`: 标准化后的证据链接数组
  - `normalizedCount`: 标准化后的数量
  - `renderedEvidenceLinks`: 最终渲染的证据链接数组
  - `renderedCount`: 最终渲染数量
  - `countSource`: 计数来源（'renderedEvidenceLinks.length'）
  - `hasDuplicates`: 是否有重复
  - `duplicateCount`: 重复数量

### 3. 弹窗层（AlternativesClient.tsx - ProofModal）

#### 按钮点击
- **位置**: `onShowEvidence` 回调中
- **日志标签**: `[ProofModal Debug - Button Click]`
- **输出内容**:
  - `currentSlug`: 当前工具 slug
  - `candidateSlug`: 候选工具 slug
  - `toolName`: 工具名称
  - `linksReceived`: 接收到的链接数组
  - `linksCount`: 链接数量
  - `proofKey`: 唯一键

#### 弹窗渲染
- **位置**: ProofModal 渲染逻辑中
- **日志标签**: 
  - `[ProofModal Debug - Modal Rendering Layer]`
  - `[ProofModal Debug - After Deduplication]`
- **输出内容**:
  - `rawLinks`: 原始链接数组
  - `rawCount`: 原始数量
  - `rawLinksType`: 原始数组类型
  - `rawLinksFirstItem`: 第一个链接项
  - `deduplicatedLinks`: 去重后的链接数组
  - `deduplicatedCount`: 去重后的数量
  - `removedDuplicates`: 移除的重复数量
  - `renderedCount`: 最终渲染数量
  - `countSource`: 计数来源

## 验证步骤

### 1. 访问 Fliki alternatives 页面
```
http://localhost:3000/tool/fliki/alternatives
```

### 2. 打开浏览器控制台（DevTools Console）

### 3. 查找 InVideo 卡片
- 查看控制台中的日志，按以下顺序检查：
  1. `[Proof Debug - evidenceMap Access]` - 检查 evidenceMap 是否有 invideo 的数据
  2. `[Proof Debug - Data Assembly Layer]` - 检查 evidenceLinksRaw 是否为空
  3. `[Proof Debug - generateDefaultEvidenceLinks]` - 检查是否生成了默认链接
  4. `[Proof Debug - Final evidenceLinks]` - 检查最终的 evidenceLinks
  5. `[Proof Debug - Rendering Layer]` - 检查渲染层的 rawEvidenceLinks

### 4. 点击 InVideo 的 Proof 按钮
- 查看控制台中的日志：
  1. `[ProofModal Debug - Button Click]` - 检查接收到的 links
  2. `[ProofModal Debug - Modal Rendering Layer]` - 检查弹窗渲染的原始链接
  3. `[ProofModal Debug - After Deduplication]` - 检查去重后的链接

### 5. 查找 HeyGen 卡片
- 重复步骤 3-4，特别关注：
  - `evidenceLinksRaw` 是否包含重复项
  - `normalizeEvidenceLinks` 的输入/输出
  - 弹窗中的去重逻辑是否生效

## 根因分析检查点

### InVideo sources 为空的原因
检查以下日志，确定问题所在层级：

1. **evidenceMap 层**:
   - `evidenceMapHas`: 如果为 `false`，说明 evidenceMap 中没有 invideo 的数据
   - `evidenceMapGetRaw`: 如果为 `undefined`，同上

2. **normalizeEvidenceLinks 层**:
   - `inputCount` vs `outputCount`: 如果 `outputCount` 为 0，说明 normalizeEvidenceLinks 过滤掉了所有链接

3. **generateDefaultEvidenceLinks 层**:
   - `defaultLinks`: 如果为空，说明默认链接生成失败

4. **渲染层**:
   - `rawEvidenceLinks`: 如果为空，说明数据在传递过程中丢失

### HeyGen 重复的原因
检查以下日志，确定重复发生在哪一层：

1. **源数据层**:
   - `evidenceLinksRaw`: 检查是否源数据就包含重复项

2. **normalizeEvidenceLinks 层**:
   - `inputCount` vs `outputCount`: 如果差值 > 0，说明 normalizeEvidenceLinks 去重了
   - 如果差值 = 0，说明 normalizeEvidenceLinks 未去重

3. **渲染层**:
   - `hasDuplicates`: 如果为 `true`，说明在渲染层仍有重复
   - `duplicateCount`: 重复的数量

4. **弹窗层**:
   - `removedDuplicates`: 如果 > 0，说明弹窗层去重了
   - 如果 = 0，说明弹窗层未去重

## 预期输出示例

### InVideo（无 evidence，应使用默认链接）
```
[Proof Debug - evidenceMap Access] { evidenceMapHas: false, ... }
[Proof Debug - Data Assembly Layer] { evidenceLinksRaw: undefined, ... }
[Proof Debug - generateDefaultEvidenceLinks] { defaultLinks: ['/tool/invideo/pricing', ...], ... }
[Proof Debug - Final evidenceLinks] { finalCount: 3, source: 'default', ... }
[Proof Debug - Rendering Layer] { rawCount: 3, renderedCount: 3, ... }
```

### HeyGen（有 evidence，但可能重复）
```
[Proof Debug - evidenceMap Access] { evidenceMapHas: true, evidenceLinksFromMapCount: 2, ... }
[Proof Debug - Data Assembly Layer] { evidenceLinksRaw: ['/tool/heygen/pricing', '/tool/heygen/pricing'], ... }
[Proof Debug - normalizeEvidenceLinks] { inputCount: 2, outputCount: 1, removedByNormalize: 1, ... }
[Proof Debug - Rendering Layer] { rawCount: 1, renderedCount: 1, hasDuplicates: false, ... }
```

## 注意事项

1. 所有调试日志仅在 `NODE_ENV === 'development'` 时输出
2. 日志按时间顺序输出，可以通过时间戳追踪数据流
3. 如果某个层级没有输出日志，说明该层级的代码未执行
4. 检查 `countSource` 字段，确认 UI 显示的 "(n sources)" 计数来源
