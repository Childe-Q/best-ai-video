# Git Push SSL 证书问题解决方案

## 问题描述
在沙箱环境中执行 `git push` 时遇到 SSL 证书验证错误：
```
fatal: unable to access 'https://github.com/Childe-Q/best-ai-video.git/': 
error setting certificate verify locations: 
CAfile: /etc/ssl/cert.pem CApath: none
```

## 系统信息
- **证书文件位置**: `/etc/ssl/cert.pem` (存在，333KB)
- **OpenSSL 目录**: `/private/etc/ssl`
- **Git SSL 配置**: 未设置

## 解决方案

### 方案 1：使用完整权限（推荐，最简单）
```typescript
run_terminal_cmd({
  command: "cd /Users/jackshan/Desktop/AI/SEO-GEO/ai-saas-mvp && git push",
  required_permissions: ['all']  // 完全绕过沙箱限制
})
```

### 方案 2：配置 Git SSL 证书路径
```bash
# 设置 Git 使用系统证书
git config --global http.sslCAInfo /etc/ssl/cert.pem

# 或者设置证书目录
git config --global http.sslCAPath /etc/ssl/certs
```

### 方案 3：临时跳过 SSL 验证（不推荐，仅用于测试）
```bash
git config --global http.sslVerify false
```

## 推荐做法
**直接使用 `required_permissions: ['all']`**，这是最简单可靠的方案，因为：
1. 完全绕过沙箱限制
2. 使用系统原生环境
3. 不需要额外配置
4. 证书验证自动工作

## 验证命令
```bash
# 检查证书文件
ls -la /etc/ssl/cert.pem

# 检查 Git 配置
git config --global http.sslCAInfo

# 测试推送
git push
```
