# Decision Log

## Current operating rule
Do not prioritize large-scale offsite promotion yet.

## Why
Mature asset density is still insufficient relative to the site structure.
The site framework is already strong, but the page-quality distribution is still uneven.
The current priority is to improve what is already built, not to increase exposure faster than quality can support.

## What we are optimizing for
- tighter exposure control
- better mature-page density
- stronger core pages
- cleaner recommendation surfaces
- more confidence about which pages are truly safe to promote

## What we are NOT doing right now
- not gating all browse directories yet
- not doing large-scale backlink / distribution pushes
- not expanding lots of new pages before fixing current high-value gaps
- not treating all existing pages as equally ready
- not doing broad structural rewrites unless necessary for readiness consistency

## Current sequencing
1. readiness registry - completed
2. ready-only linking on recommendation surfaces - completed
3. full feature-template promote-safe filtering - completed
4. feature and pricing exposure parity - completed for current code paths
5. targeted evidence and pricing follow-through - current focus
6. light distribution on mature assets only - later

## Current readiness status
- Current readiness report shows 122 pages checked, 122 promote-safe, and 0 excluded.
- Earlier 96 promote-safe / 26 excluded notes are stale.
- There is no current evidence that Phase 2 feature-template filtering needs to be restarted.

## Feature IA and promote-safe status
- `/features` now functions as a workflow router with primary, business/procurement, channel, constraint, and comparison route groups.
- Feature detail pages apply feature indexability in metadata and sitemap inclusion.
- Feature templates receive promote-safe feature hrefs and use shared filtering helpers for hardcoded exits.
- Future feature work should be evidence or conversion focused unless a concrete linking regression is found.

## Current P1 priorities
1. Decide Sora pricing exposure:
   - Sora has pricing raw/normalized/audit assets, but public pricing exposure still needs a deliberate indexability decision.
2. No-price evidence first pass completed:
   - The clean first pass only changed data/evidence/invideo.json, data/evidence/elai-io.json, and data/evidence/synthesys.json.
   - Remaining commercial use, usage rights, watermark, and export-limit gaps should wait for external official docs / terms / help / product docs.
   - Third-party reviews must not be treated as official policy sources.
3. Convert official YouTube evidence into page-level assets:
   - Start with a small pilot on high-value tools rather than broad capture.

## Working principle for future tasks
Always prefer:
- tightening mature-page exposure first
- improving high-value pages next
- expanding and promoting only after quality and routing confidence improve

## Technical SEO exposure rules
- Pricing pages should not stay indexable by default when pricing is still unverified. Current rule: public pricing pages stay in the sitemap only when the route has verified/trusted exposure or a proof-backed pricing page path.
- `/pricing-cards` is treated as support infrastructure, not a public search surface. Current rule: noindex those routes unless their public-search intent changes later.
- Feature detail pages should keep sitemap and robots behavior aligned with the same readiness floor. Current rule: feature routes remain accessible, but non-indexable feature states should not stay in sitemap or default-index by accident.
- Technical SEO reports must not keep pricing exposure, `/pricing-cards`, or feature indexability items open after code has fixed them.

## Expected task output format from Codex
For each phase, Codex should report:
1. changed files
2. rules or logic introduced
3. test / audit results
4. promote-safe pool impact
5. remaining risks
6. next recommended task
