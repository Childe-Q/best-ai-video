# Feature IA Cleanup Plan

## Scope

This plan covers only the `/features` route family:

- `/features`
- `/features/[slug]`
- feature-page templates and normalized feature data

It does not cover tool pages, VS pages, pricing pages, alternatives pages, or new official YouTube content capture.

## Current Findings

- The feature system currently has 15 promote-safe feature detail pages.
- `/features` is still a hand-authored workflow router, not a true feature IA surface.
- The hub strongly exposes only four routes: broad shortlist, avatars, repurposing, and editors.
- `enterprise-ai-video-solutions` is ready and has a dedicated business-procurement template, but it has weak discovery from the feature hub.
- `professional-ai-video-tools` and `enterprise-ai-video-solutions` should be treated as one business/procurement lane with two different weights:
  - professional: business-team rollout, collaboration, brand control
  - enterprise: procurement, SSO, SCORM/API, security review, governed deployment
- Channel-specific and constraint-specific pages are useful, but they should not compete with the primary workflow lanes on the first screen.

## Feature Entry Tiers

### Primary Routes

These should be the clearest routes from `/features`:

- `best-ai-video-generators`
- `text-to-video-ai-tools`
- `ai-avatar-video-generators`
- `content-repurposing-ai-tools`
- `ai-video-editors`

### Business And Procurement

These should be visible as a dedicated route family, not buried inside avatar or repurposing pages:

- `professional-ai-video-tools`
- `enterprise-ai-video-solutions`

The enterprise page should be discoverable when the user asks about procurement, security review, SSO, SCORM/API, admin controls, or governed rollout.

### Secondary Routes

These should appear below the primary route family:

- `ai-video-for-youtube`
- `ai-video-for-social-media`
- `ai-video-for-marketing`

### Constraint Routes

These are useful once a hard constraint is known:

- `free-ai-video-no-watermark`
- `budget-friendly-ai-video-tools`
- `fast-ai-video-generators`

### Lowest Hub Weight

These should remain discoverable, but not compete with primary workflow routing:

- `ai-video-generators-comparison`
- `viral-ai-video-generators`

## Cleanup Priorities

### P0: Document IA Rules

Create this file as the feature IA source of truth for the cleanup phase.

### P1: Feature Hub Routing

Update `/features` so it:

- adds an explicit business/procurement lane
- exposes `enterprise-ai-video-solutions` from the feature hub
- presents all 15 feature pages through weighted route groups
- keeps the first decision focused on route selection
- avoids turning `/features` into a flat card directory

### P2: Enterprise Page Denoise

Clean `enterprise-ai-video-solutions` after hub routing is fixed:

- merge repeated fit/checklist language
- keep the capability matrix
- shorten procurement reminders
- preserve the two enterprise lanes

Implementation note:

- The procurement-heavy template should use one combined procurement-fit section instead of separate fit and checklist sections.
- Enterprise lanes should show representative tools first, not every tool in the normalized group.
- Keep professional/business-light rendering separate so the lighter business-team page is not accidentally compressed by enterprise-specific cleanup.

### P2.5: Enterprise Second-Pass Denoise

Further reduce repeated enterprise-fit language:

- Keep the hero positioning short.
- Remove the separate hero-level "leave this page" module for procurement-heavy pages.
- Keep one centralized exit area in the procurement-fit gate.
- Remove per-lane contextual exits on the enterprise page.
- Keep the capability matrix, but use shorter heading/intro copy.
- Render enterprise representative tools with a compact local card instead of the full feature review-style `ToolCard`.
- Keep enterprise FAQ to three procurement-lane questions.

### P2.7: Procurement Shortlist Flow

Shift `enterprise-ai-video-solutions` from a gatekeeping explainer into a procurement shortlist:

- Replace blocker cards with a short procurement redline checklist.
- Use the capability matrix as the lane explanation.
- Move directly from matrix into representative vendor groups.
- Hide enterprise-only lane labels such as "Shortlist lane", "Use when", and "Check before procurement".
- Keep representative tool cards to best fit, why it belongs, watch out, and review/pricing links.
- Keep FAQ to procurement verification and enterprise-plan gating questions.

### P3: Narrow Workflow Denoise

Reduce repeated "stay here / leave this route" sections in narrow workflow pages.

Implementation note:

- Use one `Quick route decision` section instead of stacking separate fit and route-check blocks.
- Move narrow workflow shortlists directly after the quick decision.
- Remove per-lane `Use this shortlist when`, `Leave this route if`, and `If this route stops fitting` blocks from the rendered template.
- Keep contextual next steps after the shortlist and keep FAQ focused on concrete workflow verification questions.

### P4: Sync External Discovery

Only after the feature hub settles, consider updating:

- `public/llms.txt`
- homepage feature slots
- docs/handoff notes
