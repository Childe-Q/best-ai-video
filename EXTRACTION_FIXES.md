# 提取失败原因分析与修复方案

## 1. heygen: Could not find pricing root container

### 问题原因
- HeyGen 的 pricing HTML 是 Next.js SSR 输出，pricing 数据在 `<script>` 标签的 JSON 数据中，而不是直接的 HTML DOM
- `findPricingRoot()` 函数在 DOM 中找不到包含价格信息的容器（因为价格在 JSON 里）

### 修复方案
在 `extractPricingPlansFromHtml()` 中为 `heygen` 添加 fallback：

1. **如果找不到 pricing root**，从整页文本/HTML 用"计划名窗口切片 + 价格正则"提取
2. **使用类似 invideo 的 window match 策略**：
   - 查找计划名（Starter, Creator, Business, Free, Enterprise）
   - 为每个计划名创建 400-800 字符的窗口
   - 在窗口内提取价格、CTA、features
3. **保证至少抓到 2 个 plan 才写回**
4. **打印命中的窗口 preview**（planName + index + preview）

### 实现位置
`scripts/extract-tools-from-cache.ts` 的 `extractPricingPlansFromHtml()` 函数

---

## 2. zebracat: 只提取到 Free，Standard 解析失败

### 问题原因
- `extractPlanCardsDynamically()` 使用了 `[class*="row"] > div` 选择器，找到了 14 个"疑似 cards"
- 但这些 cards 包含了很多非 plan 卡片/重复块（如 "Custom Avatar...", "custom...", "Custom AI Styles..."）
- Standard plan 的 DOM 结构与预期不匹配

### 修复方案
为 `zebracat` 增加"范围收敛"：

1. **只在包含 "Pricing/Plans" 标题的 section 内找 plan cards**
   - 先定位包含 "Pricing" 或 "Plans" 的 section/div
   - 然后在该 section 内 query 子元素
   - 不要全页 `[class*="row"] > div` 扫描

2. **改进价格提取**：
   - 不要只找 `$xx`，也要支持：
     - `€` / `£` 等货币符号
     - `/mo` / `/month` / `per month` / `billed yearly` 等文本节点组合
   - 支持 "Cat Mode $29/month" 这样的格式

3. **过滤非 plan cards**：
   - 排除包含 "Custom Avatar", "Custom AI Styles" 的 cards
   - 只保留包含计划名（Free, Standard, Cat Mode, Super Cat, Unlimited Cat）的 cards

### 实现位置
`scripts/extract-tools-from-cache.ts` 的 `extractPlanCardsDynamically()` 和 `extractPlanFromCard()` 函数

---

## 3. veed-io: 扫到了 Minimax / Kling / Sora 等乱入卡片

### 问题原因
- `extractPlanCardsDynamically()` 的 selector 太泛，抓到了工具列表而不是价格 plans
- `[class*="row"] > div` 选择器匹配到了 AI 模型列表区域

### 修复方案
为 `veed-io` 的 plan cards 必须限定在 pricing 区块：

1. **先定位 pricing section**：
   - 查找包含 "per editor" / "billed yearly" / "Lite" / "Pro" / "Enterprise" 的区域
   - 查找包含 "Pricing" 标题的 section

2. **在该 section 内 query 子元素**：
   - 使用更具体的选择器：`[class*="pricing"] [class*="card"]` 或 `[class*="plan"]`
   - 排除包含 "Minimax", "Kling", "Sora" 的 cards（这些是 AI 模型，不是 pricing plans）

3. **验证 plan cards**：
   - 必须包含计划名（Free, Lite, Pro, Enterprise）
   - 必须包含价格或 "Custom pricing"
   - 不能包含 AI 模型名称

### 实现位置
`scripts/extract-tools-from-cache.ts` 的 `extractPricingPlansFromHtml()` 和 `extractPlanCardsDynamically()` 函数

---

## 修复优先级

1. **heygen** - 最高优先级（完全无法提取）
2. **zebracat** - 中等优先级（部分提取成功）
3. **veed-io** - 中等优先级（提取了错误数据）

## 测试命令

修复后运行：
```bash
pnpm extract:tools -- --slugs heygen,zebracat,veed-io --dryRun
```

预期结果：
- heygen: 至少提取到 2 个 plans（Starter, Creator, Business 等）
- zebracat: 至少提取到 3 个 plans（Free, Standard/Cat Mode, Super Cat）
- veed-io: 提取到 4 个 plans（Free, Lite, Pro, Enterprise），不包含 AI 模型
