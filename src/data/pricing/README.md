# Pricing Data Domain

This directory is the production-facing pricing data line for the main app.

It is not a single flat store. It contains multiple pricing layers that should remain distinct.

## Responsibility

This domain is responsible for:

- pricing raw inputs
- normalized pricing facts
- pricing audits
- pricing review notes
- pricing-specific support records used by pricing views and downstream logic

## Subareas

- `src/data/pricing/raw/`: upstream raw pricing captures in structured form
- `src/data/pricing/normalized/`: normalized pricing facts suitable for broader reuse
- `src/data/pricing/audits/`: audit outputs and pricing-quality checks
- `src/data/pricing/reviews/`: pricing review support data and notes
- root files in `src/data/pricing/`: current working pricing records for specific slugs

## Inputs

Typical inputs come from:

- `information/`
- `ai-saas-mvp/data/runtime-captures/`
- `ai-saas-mvp/data/product-intelligence/`
- pricing extraction or conversion scripts in `ai-saas-mvp/scripts/`

## Outputs

Typical outputs support:

- pricing facts reused in the app
- pricing validation
- downstream pricing-card or pricing-page work

For `/tool/[slug]/pricing` specifically:

- override-backed pricing inputs should be treated as the primary plan-table source
- root `src/data/pricing/*.json` records are legacy fallback inputs when a page has not been switched to an override-backed pricing source yet
- formal table rows should be derived from the canonical plan content itself, not from legacy `comparison_table` row semantics

## Default Write Surface

Choose one pricing layer before editing:

- raw pricing task: write to `src/data/pricing/raw/*.json`
- normalized pricing task: write to `src/data/pricing/normalized/*.json`
- audit task: write to `src/data/pricing/audits/*.json`
- review-note task: write to `src/data/pricing/reviews/*`

Do not blur those layers together in one casual edit.

## Avoid Mixing With

- `src/data/tools.json` as a shortcut for pricing fixes
- `content/tools/*` unless the task explicitly includes editorial follow-through
- `src/app/*` or `src/components/*` as a place to patch over pricing-data gaps
- raw research directories as if they were already normalized production truth

## Default Rule

When a pricing task arrives:

1. decide whether it is raw, normalized, audit, or review work
2. read only that subline plus the nearest evidence inputs
3. write to the narrowest pricing layer that actually owns the problem
