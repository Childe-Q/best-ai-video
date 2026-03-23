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
- Reports exist:
  - reports/readiness-report.md
  - reports/readiness-report.json
  - reports/seo-audit.md

## Current confirmed conclusions
- Recommendation surfaces should consume readiness
- Full browse directories should not be fully gated yet
- Current priority is to improve mature asset density, not to expand site-wide exposure

## Current status snapshot
- 122 pages total
- 96 promote-safe
- 26 excluded
- Main excluded groups:
  - 12 manual_review_pending features
  - 12 missing_editorial_pack tool overviews
  - 1 not_found feature
  - 1 not-ready VS page

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
- Tool overviews in current safe pool:
  - invideo
  - heygen
  - fliki
  - veed-io
  - zebracat
  - synthesia
  - elai-io
  - pika
- Ready feature pages currently highlighted:
  - /features/enterprise-ai-video-solutions
  - /features/free-ai-video-no-watermark
- Ready alternatives topics currently highlighted:
  - /alternatives/topic/ai-avatar-video-for-training
  - /alternatives/topic/ai-video-for-youtube-growth

## Current top priority
Phase 2:
1. fully connect all feature templates to the same promote-safe link filtering logic
2. then fix the highest-priority excluded pages

## Priority content targets after Phase 2
- best-ai-video-generators
- ai-avatar-video-generators
- content-repurposing-ai-tools
- professional-ai-video-tools
- runway
- pictory

## Phase 2 scope
- Focus on feature templates, contextual exits, recommended reading, and hardcoded `/features/...` cross-links
- Do not do large-scale content expansion yet
- Do not add new pages
- Do not fully gate browse directories yet
- Reuse the existing readiness registry and filtering logic wherever possible

## Acceptance standard for the next task
- No hardcoded feature cross-links should bypass readiness in ready surfaces
- Feature templates should use shared filtering, not ad hoc logic
- Build / typecheck should pass
- Relevant audit/report should be updated
- Output should clearly state:
  - changed files
  - what feature exits were tightened
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
   - reports/seo-audit.md
   - PLAN-20260319.md
   - strategy_report-20260319.md
2. scan the codebase for readiness / feature linking / recommendation surface logic
3. first output:
   - current project stage
   - summary of completed work
   - Phase 2 scope boundary
   - files it expects to modify
   - test / acceptance plan
4. wait for confirmation before editing code
