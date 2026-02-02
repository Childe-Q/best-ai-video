import json

# 读取原始文件
with open('data/evidence/pika.json', 'r', encoding='utf-8') as f:
    content = f.read()

left_quote = chr(0x201c)
right_quote = chr(0x201d)

# 步骤1: 替换所有弯曲引号为直引号
content = content.replace(left_quote, '"').replace(right_quote, '"')

# 步骤2: 修复过度转义
content = content.replace('\\\\"', '\\"')

# 步骤3: 逐行修复 text 字段
lines = content.split('\n')
fixed_lines = []

for line in lines:
    if '"text":' in line:
        idx = line.find('"text":')
        if idx >= 0:
            rest = line[idx + 8:]
            
            end_idx = -1
            for marker in ['",', '"}']:
                pos = rest.find(marker)
                if pos >= 0:
                    if end_idx == -1 or pos < end_idx:
                        end_idx = pos
            
            if end_idx >= 0:
                value = rest[:end_idx]
                suffix = rest[end_idx:]
                
                clean_value = value.replace('\\"', '"')
                escaped = json.dumps(clean_value)[1:-1]
                
                line = line[:idx + 8] + escaped + suffix
    
    fixed_lines.append(line)

fixed_content = '\n'.join(fixed_lines)

try:
    parsed = json.loads(fixed_content)
    with open('data/evidence/pika.json', 'w', encoding='utf-8') as f:
        json.dump(parsed, f, ensure_ascii=False, indent=2)
    print('✓ 修复成功')
    print(f'slug: {parsed.get("slug")}')
    print(f'nuggets: {len(parsed.get("nuggets", []))}')
except json.JSONDecodeError as e:
    print(f'✗ JSON 错误: {e}')
