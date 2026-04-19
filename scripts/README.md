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

## Evidence Extraction Note

`scripts/extract-tool-evidence.ts` writes extractor output to `data/evidence/{slug}.evidence.json`.
Runtime evidence readers now fall back to that file when a curated `data/evidence/{slug}.json` file is not present, so scraper output can land in existing tool and alternatives evidence slots without a second manual rename step.

## Non-Price Evidence Sync

Use `scripts/sync-non-price-evidence-import.ts` to merge existing `data/non-price-evidence-import/tools/*.json` bundles into the runtime-facing `data/evidence/{slug}.json` files.

Examples:

```bash
pnpm exec tsx scripts/sync-non-price-evidence-import.ts
pnpm exec tsx scripts/sync-non-price-evidence-import.ts --force --slugs heygen,invideo-io,runwayml-com
```

Behavior:

- skips unmapped import slugs
- skips already-synced evidence files unless `--force` is passed
- accepts either import slugs or site slugs in `--slugs`
- writes into the existing `nonPriceEvidenceImport.safeWriteback` structure that `readEvidence()` already consumes at runtime
