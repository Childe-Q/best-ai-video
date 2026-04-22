# Current Technical SEO Audit

Generated from current repository code on 2026-04-22. This document replaces old static conclusions from `reports/seo-audit.md` where code has since changed.

## 1. Executive summary

- Core technical SEO is materially stronger than the old audit indicates.
- The canonical issues previously reported for `/methodology`, `/about`, `/privacy`, `/terms`, and `/vs` are fixed in current code.
- `robots.ts` and `sitemap.ts` now cover the main public route families, and `llms.txt` now exists in `public/`.
- Current noindex / sitemap parity is good for:
  - tool alternatives
  - tool features
  - tool reviews
  - VS detail pages
  - topic alternatives
- Current data snapshot does not show active thin-page mismatches in those gated families.
- Remaining technical issues are now narrower:
  - pricing pages are always indexable and always included in sitemap, even when pricing is unverified
  - `/pricing-cards` utility routes are indexable by default without canonical or noindex intent
  - schema coverage is uneven: tool pages are strongest, but hubs, pricing pages, and most static pages still have weak page-level schema
  - feature pages do not have page-level noindex/sitemap gating, even though readiness logic exists for that family

Static code snapshot used during this audit:

- Feature pages with `needsManualReview=true`: `0`
- Thin tool features pages: `0`
- Thin tool reviews pages: `0`
- Thin tool alternatives pages: `0`
- Thin topic alternatives pages: `0`
- VS slugs currently not ready: `7`
- Tool pricing slugs currently `unverified`: `7`

## 2. Already fixed

### Canonical fixes already present

- `/methodology` now has explicit canonical metadata.
- `/about` now has explicit canonical metadata.
- `/privacy` now has explicit canonical metadata.
- `/terms` now has explicit canonical metadata.
- `/vs` now has explicit canonical metadata.

### `/methodology` route is live and exposed

- The route exists.
- It is included in sitemap.
- Links pointing to `/methodology` should no longer be treated as broken purely from route absence.

### `llms.txt` now exists

- `public/llms.txt` is present.
- It is not blocked by `robots.ts`.
- This closes the earlier “missing root GEO file” gap.

### VS canonical redirect logic is in place

- Non-canonical VS slugs redirect to the canonical slug.
- Not-ready VS pages return canonical metadata plus `noindex,follow`.
- Sitemap includes only ready VS slugs.

### Tool secondary-page noindex/sitemap parity is in place

- Tool alternatives pages: page-level `robots` noindex if thin, and sitemap excludes thin pages.
- Tool features pages: page-level `robots` noindex if thin, and sitemap excludes thin pages.
- Tool reviews pages: page-level `robots` noindex if thin, and sitemap excludes thin pages.
- Topic alternatives pages: page-level `robots` noindex if thin, and sitemap excludes thin pages.

### Current dataset is not triggering those thin-page gates

- In the current code/data snapshot, thin lists for tool alternatives, tool features, tool reviews, and topic alternatives are all empty.
- This means there is no active live mismatch in those route families right now.

## 3. Still open issues

### A. Pricing pages are always indexable and always in sitemap, even when pricing is unverified

Current behavior:

- `src/app/sitemap.ts` includes every `/tool/[slug]/pricing` page unconditionally.
- `src/app/tool/[slug]/pricing/page.tsx` sets canonical metadata but does not apply any noindex or readiness gate.

Why this is still open:

- Current code/data snapshot shows `7` tool slugs with `pricingSummary.verification === 'unverified'`:
  - `sora`
  - `colossyan`
  - `d-id`
  - `deepbrain-ai`
  - `synthesys`
  - `lumen5`
  - `steve-ai`
- So unlike alternatives/features/reviews/VS, pricing pages do not yet use an exposure rule that tracks evidence confidence.

Assessment:

- This is a real current technical exposure inconsistency, not just an old report artifact.

### B. `/pricing-cards` routes look like internal utility routes but are indexable by default

Current behavior:

- `/pricing-cards`
- `/pricing-cards/[slug]`

Both routes:

- have metadata
- do not define canonical metadata
- do not define `robots` noindex
- are omitted from sitemap

Why this is still open:

- Their implementation reads from canonical pricing card support files and looks operational/internal rather than public search-target content.
- If these routes are not meant to rank, they currently lack explicit index suppression.
- If they are meant to rank, they currently lack canonical intent and sitemap inclusion.

Assessment:

- This is a real current intent gap in index exposure logic.

### C. Schema coverage is still uneven across route families

Current strongest coverage:

- sitewide `Organization` + `WebSite`
- tool overview: `SoftwareApplication`
- tool family: breadcrumb schema via `tool/[slug]/layout.tsx`
- VS detail: breadcrumb + FAQ schema
- topic alternatives: breadcrumb + FAQ schema
- tool alternatives: FAQ schema
- tool reviews: FAQ schema when enough FAQs exist
- feature detail: breadcrumb schema

Still weak / uneven:

- homepage: no page-specific schema beyond sitewide root schema
- features hub: no page-level schema
- alternatives hub: no page-level schema
- VS index: no page-level schema
- tool pricing pages: breadcrumb only via tool layout; no page-specific pricing-related schema
- methodology / about / privacy / terms: metadata exists, but no page-level schema

Assessment:

- This is not a broken-state issue, but it remains a real technical SEO gap in structured data consistency.

### D. Feature route exposure is broader than the readiness model, even though it is not causing a live mismatch today

Current behavior:

- `src/lib/readiness/index.ts` has feature readiness logic, including `manual_review_pending`.
- `src/app/features/[slug]/page.tsx` does not set noindex based on readiness or `needsManualReview`.
- `src/app/sitemap.ts` includes all feature slugs returned by `getFeaturePageSlugs()` without readiness filtering.

Current data state:

- Current snapshot shows `0` feature pages with `meta.needsManualReview === true`.

Assessment:

- There is no active live index mismatch right now.
- But the code path is still asymmetric relative to other route families and can drift again if manual-review flags reappear.

## 4. Likely outdated conclusions in old audit

These old conclusions should not be reused as current-state technical findings:

- “Missing canonical” for `/about`
- “Missing canonical” for `/privacy`
- “Missing canonical” for `/terms`
- “Missing canonical” for `/vs`
- “`/methodology` target not found” / methodology-link brokenness caused by route absence

Why these are outdated:

- Current code now defines canonical metadata for all of those routes.
- `/methodology` exists as a route and is also included in sitemap.

Also treat these old audit areas as stale or out of scope for current technical status:

- word-count based “thin content” conclusions on hub/feature/VS pages from the old report
- any canonical conclusions derived from the pre-fix snapshot rather than the current route files

## 5. Recommended next technical actions

### Priority 1

- Add exposure intent for `/tool/[slug]/pricing`:
  - either introduce a pricing-readiness/noindex rule
  - or explicitly confirm that unverified pricing pages should remain indexed

### Priority 2

- Decide the intended search posture for `/pricing-cards`:
  - if internal/support-only: add `noindex`
  - if public: add canonical metadata and decide whether sitemap inclusion is desired

### Priority 3

- Normalize feature-family exposure logic with the rest of the site:
  - either keep broad indexing intentionally and document it
  - or align sitemap / robots behavior with feature readiness signals

### Priority 4

- Expand page-level schema on the high-value hubs first:
  - homepage
  - features hub
  - VS index
  - alternatives hub
- Then decide whether pricing pages need stronger page-specific schema beyond inherited breadcrumb markup.

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
- Includes all feature slugs from `getFeaturePageSlugs()`
- Includes all tool overview pages
- Includes all tool pricing pages
- Excludes thin tool alternatives/features/reviews via route-family checks
- Includes only ready VS pages via `isComparisonReady`
- Excludes thin topic alternatives via `isAlternativesPageThin`

### Robots evidence

- Robots root: `src/app/robots.ts`
- Disallowed:
  - `/go/`
  - `/api/`
  - `/dev/`
- `llms.txt` is not blocked because it lives in `public/` and no disallow rule targets it

### Noindex / readiness parity evidence

- Tool alternatives noindex gate: `src/app/tool/[slug]/alternatives/page.tsx`
- Tool features noindex gate: `src/app/tool/[slug]/features/page.tsx`
- Tool reviews noindex gate: `src/app/tool/[slug]/reviews/page.tsx`
- Topic alternatives noindex gate: `src/app/alternatives/topic/[slug]/page.tsx`
- VS not-ready noindex gate: `src/app/vs/[slug]/page.tsx`
- Readiness model: `src/lib/readiness/index.ts`

### Current data snapshot evidence

- Feature manual-review count `0`:
  - source query: `readFeaturePageData(...).meta.needsManualReview`
  - code source: `src/lib/features/readFeaturePageData.ts`
- Thin tool features/reviews/alternatives/topic alternatives all `0`:
  - checks sourced from:
    - `src/lib/features/isFeaturePageThin.ts`
    - `src/lib/reviews/isReviewPageThin.ts`
    - `src/lib/alternatives/buildLongformData.ts`
- Not-ready VS count `7`:
  - source logic:
    - `src/data/vs`
    - `src/lib/vsComparisonReady.ts`
- Unverified pricing count `7`:
  - source logic:
    - `src/lib/pricing/display.ts`
    - `src/app/tool/[slug]/pricing/page.tsx`

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
- Tool overview schema:
  - `src/app/tool/[slug]/page.tsx`
  - `buildSoftwareApplicationJsonLd`
- Tool-family breadcrumb schema:
  - `src/app/tool/[slug]/layout.tsx`
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

### Weak / missing page-level schema evidence

- Homepage: `src/app/page.tsx`
- Features hub: `src/app/features/page.tsx`
- Alternatives hub: `src/app/alternatives/page.tsx`
- VS index: `src/app/vs/page.tsx`
- Tool pricing pages: `src/app/tool/[slug]/pricing/page.tsx`
- Static pages:
  - `src/app/methodology/page.tsx`
  - `src/app/about/page.tsx`
  - `src/app/privacy/page.tsx`
  - `src/app/terms/page.tsx`

### Utility-route exposure gap evidence

- `/pricing-cards`: `src/app/pricing-cards/page.tsx`
- `/pricing-cards/[slug]`: `src/app/pricing-cards/[slug]/page.tsx`
- Neither file currently adds canonical metadata or noindex logic.
