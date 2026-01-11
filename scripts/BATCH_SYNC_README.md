# 批量抓取工具使用说明

## 功能说明

批量抓取所有工具的 pricing 和 features 页面，清洗 HTML 并缓存为文本文件。

## 使用方法

### 1. 抓取所有工具（跳过 fliki）

```bash
pnpm sync:tools -- --all --onlyFetch --concurrency 1 --skip fliki
```

### 2. 抓取指定工具

```bash
pnpm sync:tools -- --slugs invideo,heygen,veed-io --onlyFetch
```

### 3. 抓取单个工具

```bash
pnpm sync:tools -- --slug invideo --onlyFetch
```

### 4. 强制重新抓取（忽略缓存）

```bash
pnpm sync:tools -- --all --onlyFetch --concurrency 1 --skip fliki --force
```

## 参数说明

- `--all`: 抓取所有工具
- `--slugs <slug1,slug2,...>`: 抓取指定工具（逗号分隔）
- `--slug <slug>`: 抓取单个工具
- `--skip <slug1,slug2>`: 跳过指定工具（逗号分隔）
- `--type <pricing|features>`: 只抓取指定类型（默认抓取 pricing 和 features）
- `--onlyFetch`: 只抓取和清洗，不进行 LLM 提取（默认开启）
- `--concurrency <n>`: 并发数（默认 1）
- `--force`: 强制重新抓取，忽略缓存

## 验证步骤

### 1. 运行抓取命令

```bash
pnpm sync:tools -- --all --onlyFetch --concurrency 1 --skip fliki
```

### 2. 检查缓存文件

每个工具会在 `scripts/cache/{slug}/` 目录下生成以下文件：

- `pricing-{hash}.html` - 原始 HTML
- `pricing-{hash}.txt` - 清洗后的文本
- `pricing-clean.json` - 元数据摘要
- `features-{hash}.html` - 原始 HTML
- `features-{hash}.txt` - 清洗后的文本
- `features-clean.json` - 元数据摘要

### 3. 验证文件是否存在

```bash
# 检查所有工具的缓存目录
ls -la scripts/cache/

# 检查特定工具的文件
ls -la scripts/cache/invideo/

# 查看文本文件字符数
wc -c scripts/cache/invideo/pricing-*.txt
wc -c scripts/cache/invideo/features-*.txt
```

### 4. 查看摘要信息

```bash
# 查看 pricing 摘要
cat scripts/cache/invideo/pricing-clean.json

# 查看 features 摘要
cat scripts/cache/invideo/features-clean.json
```

摘要 JSON 包含：
- `textLength`: 文本字符数（应该 > 0）
- `truncated`: 是否被截断
- `htmlPath`: HTML 文件路径
- `textPath`: 文本文件路径

### 5. 快速验证脚本

```bash
# 检查所有工具是否都有 pricing 和 features 文件
for slug in invideo heygen veed-io zebracat synthesia elai-io pika descript opus-clip runway sora pictory colossyan d-id deepbrain-ai synthesys flexclip lumen5 steve-ai; do
  echo "Checking $slug..."
  if [ -f "scripts/cache/$slug/pricing-clean.json" ]; then
    pricing_chars=$(cat scripts/cache/$slug/pricing-clean.json | grep -o '"textLength": [0-9]*' | grep -o '[0-9]*')
    echo "  ✓ pricing: $pricing_chars chars"
  else
    echo "  ✗ pricing: missing"
  fi
  if [ -f "scripts/cache/$slug/features-clean.json" ]; then
    features_chars=$(cat scripts/cache/$slug/features-clean.json | grep -o '"textLength": [0-9]*' | grep -o '[0-9]*')
    echo "  ✓ features: $features_chars chars"
  else
    echo "  ✗ features: missing"
  fi
done
```

## 预期输出

运行成功后，每个工具应该：

1. ✅ 有 `pricing-*.txt` 文件，字符数 > 1000（不是空页面）
2. ✅ 有 `features-*.txt` 文件，字符数 > 1000（不是空页面）
3. ✅ 有对应的 `*-clean.json` 摘要文件

## 注意事项

- fliki 已存在缓存，会被跳过（除非使用 `--force`）
- 如果某个 URL 抓取失败，不会影响其他工具
- 默认使用缓存，如果文件已存在则跳过抓取
- 使用 `--force` 可以强制重新抓取
