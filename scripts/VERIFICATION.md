# 批量抓取验证步骤

## 快速验证命令

### 1. 运行批量抓取（跳过 fliki）

```bash
pnpm sync:tools -- --all --onlyFetch --concurrency 1 --skip fliki
```

### 2. 检查文件是否生成

```bash
# 检查所有工具的缓存目录
ls scripts/cache/

# 应该看到以下目录（除了 fliki）：
# invideo, heygen, veed-io, zebracat, synthesia, elai-io, pika, descript, 
# opus-clip, runway, sora, pictory, colossyan, d-id, deepbrain-ai, 
# synthesys, flexclip, lumen5, steve-ai
```

### 3. 验证每个工具的文件和字符数

```bash
# 检查单个工具（以 invideo 为例）
ls -lh scripts/cache/invideo/

# 应该看到：
# pricing-*.html
# pricing-*.txt
# pricing-clean.json
# features-*.html
# features-*.txt
# features-clean.json

# 查看文本文件字符数（应该 > 1000）
cat scripts/cache/invideo/pricing-clean.json | grep textLength
cat scripts/cache/invideo/features-clean.json | grep textLength
```

### 4. 批量验证脚本

```bash
# 创建验证脚本
cat > scripts/verify-cache.sh << 'EOF'
#!/bin/bash
for slug in invideo heygen veed-io zebracat synthesia elai-io pika descript opus-clip runway sora pictory colossyan d-id deepbrain-ai synthesys flexclip lumen5 steve-ai; do
  echo "Checking $slug..."
  if [ -f "scripts/cache/$slug/pricing-clean.json" ]; then
    pricing_chars=$(cat scripts/cache/$slug/pricing-clean.json | grep -o '"textLength": [0-9]*' | grep -o '[0-9]*')
    if [ "$pricing_chars" -gt 1000 ]; then
      echo "  ✓ pricing: $pricing_chars chars"
    else
      echo "  ⚠ pricing: only $pricing_chars chars (may be empty)"
    fi
  else
    echo "  ✗ pricing: missing"
  fi
  if [ -f "scripts/cache/$slug/features-clean.json" ]; then
    features_chars=$(cat scripts/cache/$slug/features-clean.json | grep -o '"textLength": [0-9]*' | grep -o '[0-9]*')
    if [ "$features_chars" -gt 1000 ]; then
      echo "  ✓ features: $features_chars chars"
    else
      echo "  ⚠ features: only $features_chars chars (may be empty)"
    fi
  else
    echo "  ✗ features: missing"
  fi
done
EOF

chmod +x scripts/verify-cache.sh
./scripts/verify-cache.sh
```

## 预期结果

每个工具（除了 fliki）应该有以下文件：

- ✅ `pricing-*.html` - 原始 HTML（> 10KB）
- ✅ `pricing-*.txt` - 清洗后文本（> 1000 字符）
- ✅ `pricing-clean.json` - 元数据摘要
- ✅ `features-*.html` - 原始 HTML（> 10KB）
- ✅ `features-*.txt` - 清洗后文本（> 1000 字符）
- ✅ `features-clean.json` - 元数据摘要

## 成功标准

- ✅ 19 个工具（排除 fliki）都有 pricing 和 features 文件
- ✅ 每个文本文件字符数 > 1000（不是空页面）
- ✅ 摘要 JSON 文件包含正确的元数据
