# Scripts Documentation

## Fetch and Cache Tool

### Installation

Install required dependencies:

```bash
pnpm add -D playwright tsx
```

Install Playwright browser (first time only):

```bash
pnpm exec playwright install chromium
```

**Note:** Node 18+ includes global `fetch`, so no additional fetch library is needed. If using Node < 18, you may need to add `undici`.

### Usage

Fetch and cache HTML content from tool sources:

```bash
# Fetch pricing page for fliki
pnpm run fetch:cache --slug fliki --type pricing

# Fetch features page
pnpm run fetch:cache --slug fliki --type features

# Force re-fetch (ignore cache)
pnpm run fetch:cache --slug fliki --type pricing --force
```

### Parameters

- `--slug` (required): Tool slug from `tools.sources.json`
- `--type` (required): Page type - one of: `pricing`, `features`, `terms`, `help`
- `--force` (optional): Ignore cache and re-fetch

### Cache Location

Cached HTML files are stored in:
```
scripts/cache/{slug}/{type}-{urlHash}.html
```

Where:
- `{slug}`: Tool slug
- `{type}`: Page type (pricing, features, etc.)
- `{urlHash}`: First 12 characters of SHA256 hash of the URL

### Features

- **Static fetching**: Uses native `fetch` API with retry logic (exponential backoff)
- **Dynamic fetching**: Uses Playwright for JavaScript-rendered content
- **Caching**: Automatically caches fetched content to avoid redundant requests
- **Retry logic**: Up to 2 retries with exponential backoff (500ms, 1500ms)
- **Timeout**: 15s for static, 45s for dynamic content
