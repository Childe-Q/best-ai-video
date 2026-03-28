# Product Intelligence

This directory holds an official-source-first capability and product-intelligence layer for AI video tools.

The purpose is upstream research, not front-end display. This data is meant to support later work across:

- tool pages
- pricing pages
- alternatives pages
- vs pages
- feature-led pages

## What This Layer Stores

Each tool sample captures:

- `sourceBlocks`: the official pages used for evidence
- `capabilityFacts`: normalized product and commercial facts
- `modelSupportItems`: model, engine, provider, or proprietary stack support
- `uniqueValueItems`: structured summaries of what the product is trying to lead with
- `differentiationItems`: bounded positioning inferred from official sources
- `collaborationItems` / `developerItems` / `commercialItems`
- `limitationItems`: purchase-critical constraints and plan gates
- `useCaseItems` / `userFitItems`
- `rawEvidenceBlocks`: paraphrased raw evidence snapshots
- `unresolvedQuestions`: where official evidence is still missing or conditional

## Evidence Rules

This layer uses only official vendor-owned sources.

Preferred order:

1. `docs` / `api_docs`
2. `feature_page` / `product_page`
3. `help_center` / `faq`
4. `blog` / `changelog`
5. `pricing` only as a supplement

Each item must declare one of:

- `confirmed_fact`: explicit on the official page
- `structured_inference`: reasonable structured conclusion from multiple official signals
- `unclear`: evidence is insufficient to support a claim

## Sample Set

The current validation batch is intentionally small and representative:

- `heygen`: avatar-heavy, interactive avatar, API-heavy
- `runway`: generator-heavy, model-led creative platform
- `opus-clip`: repurposing-heavy, clipping workflow product
- `synthesia`: enterprise-oriented avatar and localization platform
- `invideo`: template/workflow-oriented creation platform with multi-model generation

## Validation

Run:

```bash
pnpm exec tsx scripts/validate-product-intelligence.ts
```

The validator checks:

- required top-level fields
- enum values
- evidence URLs
- minimum multi-source coverage for each sample
- whether evidence items point to a declared source block

## Next Expansion Path

The batchable path is:

1. maintain a per-tool official source registry
2. capture source pages into cache or structured notes
3. normalize raw facts into this schema
4. validate every record locally
5. map selected fields into page-specific view models later

Do not collapse this layer into a single front-end schema too early. It should remain richer than any one surface.
