# Project Handoff

## Project
- Site: best-ai-video.com
- Goal: build a strong AI video tools site across tool / vs / features / alternatives

## Current stage
- Late foundation stage, not full-scale promotion stage
- Main priority is still on-site quality and mature-page exposure control
- External promotion is not the main line yet

## What has been completed
- Readiness registry has been introduced
- Ready-only linking has been applied to key recommendation surfaces
- Feature-template promote-safe filtering has been connected across the feature route family
- Pricing-page exposure now uses an independent indexability rule
- `/pricing-cards` support routes are explicitly noindex
- Reports exist:
  - reports/readiness-report.md
  - reports/readiness-report.json
  - reports/seo-audit-current.md

## Current confirmed conclusions
- Recommendation surfaces should consume readiness
- Feature detail indexability and sitemap inclusion now follow feature indexability checks
- Pricing pages should only enter the sitemap when pricing exposure is indexable
- `/pricing-cards` is support infrastructure, not a public search surface
- Current priority is to improve mature asset density, not to expand site-wide exposure

## Current status snapshot
- 122 pages checked
- 122 promote-safe
- 0 excluded
- Current readiness report:
  - reports/readiness-report.md
  - reports/readiness-report.json
- Earlier 96 promote-safe / 26 excluded notes are stale and should not be reused.

## Readiness work already completed
### Files changed in the readiness phase
- Core readiness and reporting:
  - src/lib/readiness/index.ts
  - src/lib/optionalServerOnly.ts
  - scripts/generate-readiness-report.ts
- Linking / hub tightening:
  - src/lib/getRelatedLinks.ts
  - src/lib/vsIndex.ts
  - src/lib/alternatives/buildLongformData.ts
- Page integration:
  - src/app/page.tsx
  - src/app/features/page.tsx
  - src/app/alternatives/page.tsx
  - src/app/tool/[slug]/page.tsx
  - src/app/features/[slug]/page.tsx
- Feature template tightening:
  - src/components/features/ToolFeaturesPageTemplate.tsx
  - src/components/features/FeatureHubPage.tsx
  - src/components/features/BusinessProcurementFeaturePage.tsx
  - src/components/features/PolicyThresholdFeaturePage.tsx
  - src/components/features/ComparisonFeaturePage.tsx
  - src/components/features/NarrowWorkflowFeaturePage.tsx
  - src/components/features/filterPromoteSafeFeatureHrefs.ts
- Feature data compatibility:
  - src/lib/features/readFeaturePageData.ts

### Rules already introduced
- `hub` is always accessible, but hub recommendation surfaces only consume the readiness registry.
- `tool` ready requires:
  - content/tools/<slug>.json exists
  - overview.tldr exists
  - overview.miniTest exists
  - overview.useCases >= 2
  - pros >= 2
  - cons >= 2
  - sources is non-empty
  - content does not contain `[NEED VERIFICATION]`, `TBD`, or `placeholder`
- `toolAlternatives` ready:
  - buildToolAlternativesLongformData(slug) succeeds
  - contentReady === true
- `toolFeatures` ready:
  - !isFeaturePageThinBySlug(...)
- `toolReviews` ready:
  - !isReviewPageThin(...)
- `feature` ready:
  - readFeaturePageData(slug) is readable
  - hero exists
  - groups exist
  - meta.needsManualReview !== true
- `vs` ready:
  - isComparisonReady(...) === true
- `alternativesTopic` ready:
  - topic longform data exists
  - contentReady === true
- Shared reason codes:
  - manual_review_pending
  - thin_features
  - thin_reviews
  - alternatives_content_gap
  - missing_editorial_pack
  - placeholder_signal
  - not_found

### Current promote-safe highlights
- Hubs:
  - /
  - /features
  - /alternatives
  - /vs
- Tool overviews:
  - all 20 current tool overview pages are promote-safe
- Feature pages:
  - all 15 current feature detail pages are promote-safe
- VS pages:
  - all 21 current VS comparison pages in the readiness report are promote-safe
- Ready alternatives topics currently highlighted:
  - /alternatives/topic/ai-avatar-video-for-training
  - /alternatives/topic/ai-video-for-youtube-growth

## Current top priority
P1 recovery tasks:
1. decide Sora pricing exposure
2. no-price evidence first pass is completed; remaining policy fields require external official docs
3. run a small official YouTube evidence-to-page conversion pilot

## Priority content targets after readiness normalization
- Sora pricing exposure decision
- non-price evidence follow-through only after official docs / terms / help / product docs are available
- official YouTube evidence conversion for a small set of high-value tools, such as Sora, Runway, or Pictory

## P1 no-price evidence first pass
- Status: completed.
- Files changed in the first pass:
  - data/evidence/invideo.json
  - data/evidence/elai-io.json
  - data/evidence/synthesys.json
- Validation:
  - JSON parsed successfully for the changed evidence files.
  - `git diff --check` had no findings for the changed evidence files.
  - No third-party-only source was promoted into an official-confirmed policy conclusion.
  - No unclear or missing field was written as a strong conclusion.
- Remaining unresolved fields after the first pass:
  - InVideo: policy.usageRights
  - Elai: policy.commercialUse, policy.usageRights
  - Synthesys: policy.watermark
- Remaining fields that need external official-source review before writeback:
  - Runway: policy.commercialUse, policy.usageRights, policy.exportLimits
  - InVideo: policy.usageRights
  - Elai: policy.commercialUse, policy.usageRights
  - Synthesys: policy.commercialUse, policy.usageRights, policy.watermark
  - Pictory: policy.commercialUse, policy.usageRights
- Source rule: third-party reviews can support market context, but must not be treated as official policy sources for commercial use, usage rights, watermark, or export-limit conclusions.

## Completed Phase 2 scope
- Feature hub now exposes all 15 feature routes through weighted route groups.
- Business/procurement lane is visible from `/features`.
- Feature detail pages build recommended reading through promote-safe filtering.
- Feature templates receive `promoteSafeFeatureHrefs` and sanitize hardcoded feature exits through the shared helper.

## Current scope boundary
- Do not redo broad feature IA or feature-template filtering unless a concrete regression is found.
- Do not add new pages
- Do not run a broad UI redesign
- Reuse the existing readiness registry and filtering logic wherever possible

## Acceptance standard for the next task
- Keep changes inside the owning production line
- Do not restart Phase 2 work that is already complete
- Relevant audit/report should be updated when status assumptions change
- Output should clearly state:
  - changed files
  - whether the task is audit, content, or code
  - what remains as risk
  - test results
  - next recommended task

## Recommended first prompt for Codex in the new directory
Use repository files as the source of truth. Do not assume old chat history exists.

Ask Codex to:
1. read:
   - docs/codex-handoff.md
   - docs/decision-log.md
   - reports/readiness-report.md
   - reports/readiness-report.json
   - reports/seo-audit-current.md
2. scan the codebase for the specific production line involved in the requested task
3. first output:
   - current project stage
   - summary of completed work
   - current scope boundary
   - files it expects to modify
   - test / acceptance plan
4. wait for confirmation before editing code
