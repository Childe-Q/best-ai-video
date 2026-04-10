# Non-Price Evidence Export Bundle

This export bundle contains only the structured non-price evidence results prepared for migration into the SEO project.

Included files:
- `index.json`: top-level index of all tool result files, extracted field counts, and unresolved field summary per tool.
- `missing-fields-summary.json`: cross-tool unresolved field summary for quick gap review.
- `remote-fetch-round-2026-04-08.json`: official-page remote enrichment round log, including fetched pages, fetched fields, and unresolved fields after merge.
- `next-fetch-targets.json`: remaining official-page targets worth fetching in a future round.
- `slug-map.json`: canonical import-slug to site-slug mapping derived from existing project alias patterns.
- `tools/*.json`: per-tool structured evidence records with `officialUrl`, `sourceUrls`, `policy`, `mainLimitations`, `workflowFeatureDocs`, `securityApiEnterprise`, `logoSources`, and `missingFields`.

Not included:
- runtime captures
- HTML snapshots
- network response dumps
- cache directories
- unrelated scripts

Recommended import order for the SEO project:
1. `tools/*.json`
2. `index.json`
3. `missing-fields-summary.json`
4. `remote-fetch-round-2026-04-08.json`
5. `next-fetch-targets.json`
