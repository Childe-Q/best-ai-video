# src/data

This directory contains production-facing structured data for the main app.

It is not one single data system. It contains several parallel production lines that should not be mixed casually.

## Main Subdomains

## 1. Tool Registry

- Path:
  - `src/data/tools.json`
  - `src/data/categories.ts`
  - `src/data/externalToolTags.ts`
- Role:
  - shared tool identity and baseline cross-site tool facts
- Notes:
  - this is a high-risk shared dataset
  - many app surfaces depend on it
  - do not use it as the default first write target for broad content generation

## 2. Alternatives Data

- Path:
  - `src/data/alternatives/`
  - `src/data/alternatives.json`
  - `src/data/alternativesEvidence.json`
- Role:
  - alternatives relationships, evidence, and supporting configs for alternatives pages
- Notes:
  - keep alternatives-specific logic and data in the alternatives line
  - avoid stuffing alternatives-specific conclusions into unrelated tool or feature datasets

## 3. Feature Research and Normalized Feature Data

- Path:
  - `src/data/research/features/*.raw.json`
  - `src/data/features/normalized/*.json`
  - `src/data/features/free-ai-video-no-watermark.json`
- Role:
  - raw research input and normalized feature page output
- Notes:
  - raw research is upstream
  - normalized feature JSON is production-facing output
  - do not write normalized feature conclusions directly into `tools.json` unless the fact is truly cross-site shared

## 4. VS Comparison Data

- Path:
  - `src/data/vs/`
- Role:
  - explicit comparison definitions and VS-specific models
- Notes:
  - keep comparison-line logic and source material inside the VS line
  - do not treat VS-specific conclusions as generic tool truth automatically

## 5. Pricing Data

- Path:
  - `src/data/pricing/`
  - `src/data/pricing/raw/`
  - `src/data/pricing/normalized/`
  - `src/data/pricing/audits/`
  - `src/data/pricing/reviews/`
- Role:
  - pricing-specific raw inputs, normalized facts, audits, and review notes
- Notes:
  - pricing is its own line
  - preserve the distinction between raw, normalized, and audit/review layers
  - do not collapse them into one flat write target

## 6. Reviews Data

- Path:
  - `src/data/reviews/`
- Role:
  - review-page-specific structured data
- Notes:
  - keep review-specific snapshots and issues here
  - do not mix review commentary into unrelated feature or pricing stores

## 7. Product Intelligence Schema Support

- Path:
  - `src/data/productIntelligence/`
- Role:
  - schema definitions and support for richer product-intelligence work
- Notes:
  - this is support for a broader evidence layer, not a replacement for every page dataset

## High-Risk Shared Files

These files or subtrees should be edited carefully because they affect multiple surfaces:

- `src/data/tools.json`
- `src/data/vs/index.ts`
- `src/data/features/normalized/*.json`
- `src/data/alternatives/canonical.ts`
- pricing normalized files that feed multiple pricing views

## Human-Maintained vs Process-Maintained

Default guidance:

- human-maintained or tightly reviewed:
  - `tools.json`
  - alternatives canonical config
  - selected VS definitions
  - review-page curated data
- process-maintained or process-assisted:
  - `research/features/*.raw.json`
  - `features/normalized/*.json`
  - pricing raw and normalized files
  - audit outputs

If a file is produced by a script or normalization flow, do not casually hand-edit a downstream copy while ignoring the upstream input.

## Separation Rule

Do not mix these production lines unless the task clearly requires it:

- tool registry
- tool editorial content
- alternatives
- features
- vs
- pricing
- reviews

The safest default is:

1. identify the production line
2. find the upstream input
3. write to the narrowest documented output surface

## Page Consumption Rule

For tool-facing runtime pages, do not reassemble data in each route from `tools.json`, `content/tools/*.json`, and page-local fallbacks.

Use `src/lib/toolData.ts` as the unified read entry for:

- `/tool/[slug]`
- `/tool/[slug]/pricing`
- `/tool/[slug]/reviews`
- `/tool/[slug]/features`
- `/tool/[slug]/alternatives`
- VS helpers that need tool identity plus editorial overlays

This keeps `src/data/*` as the write surface while making runtime pages consume one merged tool record instead of multiple ad hoc reads.
