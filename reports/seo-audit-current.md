# Current Technical SEO Audit

Updated from current repository code on 2026-05-06. This document replaces old static conclusions from `reports/seo-audit.md` and earlier conclusions in this file where code has since changed.

## 1. Executive summary

- Core technical SEO is materially stronger than the old audit indicates.
- The canonical issues previously reported for `/methodology`, `/about`, `/privacy`, `/terms`, and `/vs` are fixed in current code.
- `robots.ts` and `sitemap.ts` cover the main public route families, and `llms.txt` exists in `public/`.
- Current readiness report shows:
  - 122 pages checked
  - 122 promote-safe
  - 0 excluded
- Current noindex / sitemap parity is in place for:
  - tool alternatives
  - tool features
  - tool reviews
  - VS detail pages
  - topic alternatives
  - feature detail pages
  - pricing pages through pricing exposure
- `/pricing-cards` utility routes are explicitly noindex.
- Technical SEO old-report issues that should not remain open:
  - missing static-page canonicals
  - missing `/methodology` route
  - pricing pages always indexable
  - `/pricing-cards` indexable by default
  - feature detail pages lacking indexability / sitemap parity
- Remaining technical work is narrower:
  - decide Sora pricing exposure
  - keep schema improvements focused on high-value surfaces if needed
  - keep reports synchronized with current code after future exposure-rule changes

## 2. Already fixed

### Canonical fixes already present

- `/methodology` has explicit canonical metadata.
- `/about` has explicit canonical metadata.
- `/privacy` has explicit canonical metadata.
- `/terms` has explicit canonical metadata.
- `/vs` has explicit canonical metadata.

### `/methodology` route is live and exposed

- The route exists.
- It is included in sitemap.
- Links pointing to `/methodology` should not be treated as broken from route absence.

### `llms.txt` exists

- `public/llms.txt` is present.
- It is not blocked by `robots.ts`.
- This closes the earlier missing root GEO file gap.

### VS canonical redirect and exposure logic is in place

- Non-canonical VS slugs redirect to the canonical slug.
- Not-ready VS pages return canonical metadata plus `noindex,follow`.
- Sitemap includes only ready VS slugs.
- Current readiness report lists current VS pages as promote-safe.

### Tool secondary-page noindex/sitemap parity is in place

- Tool alternatives pages: page-level `robots` noindex if thin, and sitemap excludes thin pages.
- Tool features pages: page-level `robots` noindex if thin, and sitemap excludes thin pages.
- Tool reviews pages: page-level `robots` noindex if thin, and sitemap excludes thin pages.
- Topic alternatives pages: page-level `robots` noindex if thin, and sitemap excludes thin pages.

### Feature detail indexability is in place

- `src/lib/features/indexability.ts` defines feature indexability from readable page data, hero, groups, and `meta.needsManualReview`.
- `src/app/features/[slug]/page.tsx` applies `robots: { index: false, follow: true }` when a feature page is not indexable.
- `src/app/sitemap.ts` uses `getIndexableFeaturePageSlugs()`, so non-indexable feature states should not remain in sitemap by accident.

### Pricing-page exposure is in place

- `src/lib/pricing/indexability.ts` defines pricing exposure separately from page rendering.
- `src/app/tool/[slug]/pricing/page.tsx` applies `noindex,follow` when `getPricingPageExposure(...)` is not indexable.
- `src/app/sitemap.ts` includes `/tool/[slug]/pricing` only when pricing exposure is indexable.
- Pricing pages with canonical or productized overrides can be indexable even when the older summary fallback is unverified.

### `/pricing-cards` utility routes are noindex

- `/pricing-cards` has `robots: { index: false, follow: false }`.
- `/pricing-cards/[slug]` has `robots: { index: false, follow: false }`.
- These support routes remain omitted from sitemap.

## 3. Still open issues

### A. Sora pricing exposure needs a deliberate decision

Current behavior:

- Sora has pricing raw, normalized, and audit files.
- Sora does not currently have the same canonical/productized pricing-page override path as most other tools.
- `getPricingPageExposure('sora', tool)` currently falls back to summary status and should keep `/tool/sora/pricing` non-indexable unless a trusted exposure path is added.

Assessment:

- This is a narrow P1 pricing-governance decision, not a sitewide pricing indexability bug.
- Do not re-open the old conclusion that all pricing pages are always indexable.

### B. Schema coverage can still be improved selectively

Current strongest coverage:

- sitewide `Organization` + `WebSite`
- homepage `WebPage`
- features hub `CollectionPage` + FAQ
- alternatives hub `CollectionPage`
- VS index `CollectionPage` + FAQ
- tool overview `SoftwareApplication`
- tool family breadcrumb schema
- tool pricing `CollectionPage` when indexable
- VS detail breadcrumb + FAQ schema
- topic alternatives breadcrumb + FAQ schema
- tool alternatives FAQ schema
- tool reviews FAQ schema when enough FAQs exist
- feature detail breadcrumb schema

Still weaker / lower priority:

- methodology / about / privacy / terms have metadata, but no page-specific schema.
- Pricing pages may eventually need stronger pricing-specific schema beyond `CollectionPage`, but only after pricing exposure and data confidence are settled.

Assessment:

- This is not a broken-state issue.
- Do not turn this into a broad schema rewrite. Expand schema only on high-value surfaces with visible content alignment.

### C. Evidence and content assets are now the higher-value follow-through

Current open P1 content assets:

- no-price evidence first pass is completed; remaining policy fields require external official docs / terms / help / product docs before writeback
- official YouTube evidence conversion into concrete page-level claims

Assessment:

- These are content/evidence tasks, not technical SEO crawl bugs.
- The no-price evidence first pass only changed `data/evidence/invideo.json`, `data/evidence/elai-io.json`, and `data/evidence/synthesys.json`.
- The first pass was reviewed as clean: JSON parses, `git diff --check` has no findings, no third-party-only evidence was promoted to official-confirmed, and no unclear or missing field was written as a strong conclusion.
- Current remaining unresolved fields after the first pass:
  - InVideo: `policy.usageRights`
  - Elai: `policy.commercialUse`, `policy.usageRights`
  - Synthesys: `policy.watermark`
- Additional fields still requiring external official-source review:
  - Runway: `policy.commercialUse`, `policy.usageRights`, `policy.exportLimits`
  - InVideo: `policy.usageRights`
  - Elai: `policy.commercialUse`, `policy.usageRights`
  - Synthesys: `policy.commercialUse`, `policy.usageRights`, `policy.watermark`
  - Pictory: `policy.commercialUse`, `policy.usageRights`
- Third-party reviews are not official policy sources for these fields.

## 4. Likely outdated conclusions in old audits

These conclusions should not be reused as current-state findings:

- Missing canonical for `/about`
- Missing canonical for `/privacy`
- Missing canonical for `/terms`
- Missing canonical for `/vs`
- `/methodology` target not found
- pricing pages are always indexable and always included in sitemap
- `/pricing-cards` routes are indexable by default
- feature pages lack page-level indexability / sitemap parity
- 96 promote-safe / 26 excluded readiness status

Why these are outdated:

- Current code defines canonical metadata for the affected static routes.
- `/methodology` exists and is included in sitemap.
- Pricing exposure is centralized in `src/lib/pricing/indexability.ts`.
- `/pricing-cards` routes explicitly set noindex.
- Feature detail exposure is centralized in `src/lib/features/indexability.ts`.
- Current readiness report shows 122 promote-safe pages and 0 excluded.

Also treat these old audit areas as stale or out of scope for current technical status:

- word-count based thin-content conclusions on hub/feature/VS pages from the old report
- canonical conclusions derived from pre-fix route files
- pricing exposure conclusions that do not account for canonical/productized overrides

## 5. Recommended next actions

### Priority 1

- Decide Sora pricing exposure:
  - either keep `/tool/sora/pricing` non-indexable and document why
  - or add a narrow Sora pricing exposure path if current pricing evidence is strong enough

### Priority 2

- Continue no-price evidence only after external official docs / terms / help / product docs are available for the remaining fields.
- Do not use third-party reviews as official policy sources.

### Priority 3

- Run an official YouTube evidence conversion pilot:
  - choose a small set of high-value tools
  - convert official video evidence into concrete workflow claims, Mini Test refinements, or source-backed key facts
  - do not start with a full-site YouTube capture pass

### Priority 4

- Consider selective schema improvements only where visible content already supports the markup:
  - pricing pages after pricing exposure confidence is settled
  - static trust pages if they become meaningful search or citation targets

## 6. Route/file evidence

### Fixed canonical evidence

- `/about`: `src/app/about/page.tsx`
- `/privacy`: `src/app/privacy/page.tsx`
- `/terms`: `src/app/terms/page.tsx`
- `/methodology`: `src/app/methodology/page.tsx`
- `/vs`: `src/app/vs/page.tsx`
- Root metadata base: `src/app/layout.tsx`

### Sitemap evidence

- Main sitemap builder: `src/app/sitemap.ts`
- Includes static pages: `/about`, `/privacy`, `/terms`, `/methodology`, `/vs`
- Includes indexable feature slugs from `getIndexableFeaturePageSlugs()`
- Includes all tool overview pages
- Includes tool pricing pages only when `getPricingPageExposure(...).indexable` is true
- Excludes thin tool alternatives/features/reviews via route-family checks
- Includes only ready VS pages via `isComparisonReady`
- Excludes thin topic alternatives via `isAlternativesPageThin`

### Robots evidence

- Robots root: `src/app/robots.ts`
- Disallowed:
  - `/go/`
  - `/api/`
  - `/dev/`
- `llms.txt` is not blocked because it lives in `public/` and no disallow rule targets it.

### Noindex / readiness parity evidence

- Tool alternatives noindex gate: `src/app/tool/[slug]/alternatives/page.tsx`
- Tool features noindex gate: `src/app/tool/[slug]/features/page.tsx`
- Tool reviews noindex gate: `src/app/tool/[slug]/reviews/page.tsx`
- Topic alternatives noindex gate: `src/app/alternatives/topic/[slug]/page.tsx`
- VS not-ready noindex gate: `src/app/vs/[slug]/page.tsx`
- Feature indexability gate: `src/lib/features/indexability.ts`
- Feature metadata gate: `src/app/features/[slug]/page.tsx`
- Pricing exposure gate: `src/lib/pricing/indexability.ts`
- Pricing metadata gate: `src/app/tool/[slug]/pricing/page.tsx`
- Readiness model: `src/lib/readiness/index.ts`

### Current readiness evidence

- Readiness report:
  - `reports/readiness-report.md`
  - `reports/readiness-report.json`
- Current status:
  - 122 pages checked
  - 122 promote-safe
  - 0 excluded

### Redirect / canonical redirect evidence

- Old alternatives route permanently redirects to canonical route:
  - `src/app/alternatives/[slug]/page.tsx`
  - redirects to `/tool/[slug]/alternatives`
- VS canonical redirect:
  - `src/app/vs/[slug]/page.tsx`
  - redirects non-canonical comparison slugs to the canonical slug
- Affiliate redirect family:
  - `src/app/go/[slug]/route.ts`
  - also protected from crawling by `src/app/robots.ts`
- Outbound bridge page:
  - `src/app/out/veed/page.tsx`
  - explicitly `noindex,nofollow`

### `llms.txt` evidence

- File exists: `public/llms.txt`
- Current implementation is curated, not exhaustive
- No matching robots disallow blocks it

### Schema coverage evidence

- Sitewide root schema:
  - `src/app/layout.tsx`
  - `src/lib/jsonLd.ts`
- Homepage schema:
  - `src/app/page.tsx`
  - `buildWebPageJsonLd`
- Features hub schema:
  - `src/app/features/page.tsx`
  - `buildCollectionPageJsonLd`
  - `buildFaqJsonLd`
- Alternatives hub schema:
  - `src/app/alternatives/page.tsx`
  - `buildCollectionPageJsonLd`
- VS index schema:
  - `src/app/vs/page.tsx`
  - `buildCollectionPageJsonLd`
  - `buildFaqJsonLd`
- Tool overview schema:
  - `src/app/tool/[slug]/page.tsx`
  - `buildSoftwareApplicationJsonLd`
- Tool-family breadcrumb schema:
  - `src/app/tool/[slug]/layout.tsx`
- Tool pricing schema:
  - `src/app/tool/[slug]/pricing/page.tsx`
  - `buildCollectionPageJsonLd`
- Feature detail breadcrumb schema:
  - `src/app/features/[slug]/page.tsx`
- Tool alternatives FAQ schema:
  - `src/app/tool/[slug]/alternatives/page.tsx`
- Topic alternatives breadcrumb + FAQ schema:
  - `src/app/alternatives/topic/[slug]/page.tsx`
- Tool reviews FAQ schema:
  - `src/app/tool/[slug]/reviews/page.tsx`
- VS detail breadcrumb + FAQ schema:
  - `src/app/vs/[slug]/page.tsx`
  - `src/lib/vsPageModel.ts`

### Utility-route exposure evidence

- `/pricing-cards`: `src/app/pricing-cards/page.tsx`
- `/pricing-cards/[slug]`: `src/app/pricing-cards/[slug]/page.tsx`
- Both route files currently add noindex metadata.
