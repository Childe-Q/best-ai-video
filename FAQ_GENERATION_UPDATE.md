# FAQ 生成逻辑更新说明

## 改动概述

实现了智能 FAQ 生成和排序系统，解决以下问题：
1. ✅ 每个工具页 FAQ 不再千篇一律（不再固定 watermark 第一）
2. ✅ 按决策路径排序（8个固定位置）
3. ✅ 去重规则（watermark 和 "Is it free?" 不同时出现在前 3 题）
4. ✅ 触发条件检查（基于工具数据自动判断）
5. ✅ 答案风格处理（用户反馈前缀、[NEED VERIFICATION] 处理）

## 文件改动

### 1. 新增文件：`src/lib/generateSmartFAQs.ts`

核心功能：
- `generateSmartFAQs()`: 主函数，接收工具数据、内容数据、原始 FAQ 列表，返回排序后的 8 个 FAQ
- `categorizeFAQs()`: 将原始 FAQ 按类型分类（coreUseCase, credits, watermark, commercial, etc.）
- `findOrGenerateFAQ()`: 从候选 FAQ 中选择或生成新的 FAQ
- `generateNeutralFAQ()`: 当没有匹配的 FAQ 时，生成中性操作类问题

### 2. 更新文件：`src/app/tool/[slug]/reviews/page.tsx`

改动：
- 导入 `generateSmartFAQs` 函数
- 收集所有来源的 FAQ（content/tools JSON, tools.json content.reviews.faqs, tools.json root faqs）
- 使用 `generateSmartFAQs` 对 FAQ 进行智能排序和选择
- 确保输出正好 8 个 FAQ

## FAQ 排序规则（8个固定位置）

1. **Q1: 核心独特卖点/使用场景**
   - 从 tool.summary / bestFor / useCases 提取
   - 问题示例："What is [Tool] best for?"

2. **Q2: Credits/minutes 如何消耗**
   - 仅当工具有 credits/minutes 相关证据时显示
   - 否则显示 "生成/导出限制有哪些？"
   - 问题示例："How do credits or minutes work?"

3. **Q3: 导出分辨率/水印**
   - 仅当存在 Free plan 且有 watermark 证据时显示 watermark 问题
   - 否则显示分辨率问题
   - 问题示例："Do free plan videos have a watermark?" 或 "What export resolution do plans support?"

4. **Q4: 商业用途/授权边界**
   - 问题示例："Can I use videos commercially?"

5. **Q5: 取消订阅/退款**
   - 如果有退款争议，显示退款问题（答案前缀 "Note: Official terms are typically stricter"）
   - 否则显示取消订阅问题
   - 问题示例："What is the refund policy?" 或 "How do I cancel my subscription?"

6. **Q6: 导出格式/字幕/可下载内容**
   - 问题示例："What file formats can I export?"

7. **Q7: 浏览器/稳定性/常见故障**
   - 来自 reviews 痛点
   - 问题示例："What browsers or system requirements are recommended?"

8. **Q8: 对比类问题**
   - 链接到站内 vs 页面（如果存在）
   - 问题示例："How does [Tool] compare to alternatives?"

## 去重规则

1. **Watermark 问题在同一工具页只出现一次**
2. **"Is it free?" 与 "watermark?" 不允许同时作为前两题**（最多一个在前 3 题内）
3. **所有 FAQ 问题去重**（基于标准化的问题文本）

## 触发条件

- **Watermark 题**：仅当 tool 定义为 freemium/free trial 且 hardFacts 有 watermark/resolution 任一证据
- **Credits 题**：仅当硬事实或用户痛点中出现 credit/minutes 相关；否则改为 "生成/导出限制有哪些？"
- **Refunds 题**：仅当 hardFacts 或用户痛点中出现退款/取消争议；否则用 "如何取消订阅，何时生效？"

## 答案风格

1. **2-3 句，实用、克制**
2. **用户反馈必须以 "User feedback:" 或 "User reports:" 前缀**
3. **如果是 [NEED VERIFICATION]，答案必须明确 "需要在官方 help/terms/pricing 的哪一类页面验证"**
4. **自动清理 [NEED VERIFICATION] 标签**（从答案中移除，但保留谨慎措辞）

## 测试工具

以下工具已更新，可以验证效果：
- InVideo (`/tool/invideo/reviews`)
- HeyGen (`/tool/heygen/reviews`)
- Fliki (`/tool/fliki/reviews`)
- Veed.io (`/tool/veed-io/reviews`)

## 预期效果对比

### 之前（InVideo）：
1. Do free plan videos have a watermark?
2. Is InVideo AI completely free to use?
3. Do edits consume credits in InVideo?
...

### 之后（InVideo）：
1. What is InVideo AI best for? (核心卖点)
2. Do edits consume credits in InVideo? (credits 消耗)
3. Do free plan videos have a watermark? (watermark，因为 Q1 不是 "Is it free?")
4. Can I use InVideo stock footage commercially? (商业用途)
5. What happens if I cancel? (取消订阅)
6. What browsers work best with InVideo? (浏览器/稳定性)
7. Why do my exports fail at 99% completion? (常见故障)
8. InVideo AI vs. InVideo Studio: Which one do I need? (对比问题)

## 注意事项

1. 如果某个位置没有匹配的 FAQ，会生成一个中性操作类问题（不编造数字）
2. 如果原始 FAQ 不足 8 个，会用中性问题填充
3. 所有生成的 FAQ 都会经过 [NEED VERIFICATION] 清理和答案风格处理
