# 链接 Hover 规范

## 全局规则
- **所有链接默认无下划线**（在 `globals.css` 中统一设置）
- 使用替代的视觉反馈来指示可点击性

## Hover 效果分类

### 1. 标准文本链接（无背景、无边框）
```css
/* 默认：黑色文字 */
/* Hover：灰色 + 透明度降低 */
color: var(--neo-gray);
opacity: 0.85;
```

**适用场景：**
- 导航链接
- 面包屑链接
- 普通文本中的链接

### 2. 带背景的链接（按钮样式）
```css
/* Hover：透明度降低 */
opacity: 0.9;
```

**适用场景：**
- CTA 按钮
- 带背景色的链接按钮

### 3. 带边框的链接（卡片/按钮）
```css
/* Hover：轻微阴影效果 */
box-shadow: 2px 2px 0 0 var(--neo-black);
```

**适用场景：**
- 卡片式链接
- 带边框的按钮链接

### 4. 证据/工具页面链接
```css
/* Hover：黄色背景 + 黑色文字 */
background-color: var(--neo-yellow);
color: var(--neo-black);
```

**适用场景：**
- Proof 弹窗中的证据链接
- `/tool/[slug]` 相关链接

## 实现方式

### 全局样式（`globals.css`）
```css
/* 强制移除所有下划线 */
a {
  text-decoration: none !important;
}

a:hover,
a:focus,
a:active {
  text-decoration: none !important;
  text-decoration-line: none !important;
  text-decoration-thickness: 0 !important;
  text-underline-offset: 0 !important;
}
```

### 组件级样式
- 移除所有 `underline`、`hover:underline`、`decoration-*` 类
- 使用 `hover:opacity-80`、`hover:text-{color}` 等替代
- 对于特殊链接，使用 `hover:bg-[#F6D200]` 等背景色变化

## 禁止使用的类
- ❌ `underline`
- ❌ `hover:underline`
- ❌ `decoration-*`
- ❌ `underline-offset-*`

## 推荐使用的类
- ✅ `hover:opacity-80` - 透明度变化
- ✅ `hover:text-{color}` - 颜色变化
- ✅ `hover:bg-{color}` - 背景色变化
- ✅ `hover:shadow-sm` - 阴影效果
- ✅ `transition-colors` - 平滑过渡

## 示例

### 文本链接
```tsx
<Link href="/" className="hover:text-gray-600 hover:opacity-80 transition-colors">
  Home
</Link>
```

### 证据链接（Proof Modal）
```tsx
<Link
  href="/tool/heygen/pricing"
  className="block p-3 rounded-lg border border-gray-200 hover:border-black hover:bg-[#F6D200] hover:text-black transition-all"
>
  /tool/heygen/pricing
</Link>
```

### CTA 按钮链接
```tsx
<a
  href={affiliateLink}
  className="px-2 py-0.5 bg-[#F6D200] border border-black rounded hover:bg-[#F6D200]/80 hover:shadow-sm transition-all"
>
  Try now
</a>
```
