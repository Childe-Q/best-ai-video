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
1. readiness registry
2. ready-only linking on recommendation surfaces
3. full feature-template promote-safe filtering
4. fix top excluded pages
5. light distribution on mature assets only

## Why Phase 2 comes next
The readiness phase already tightened key recommendation surfaces, but feature templates may still contain hardcoded `/features/...` exits that bypass shared filtering.
This means some ready pages may still push users toward not-ready feature pages.
That inconsistency should be fixed before content expansion.

## Current Phase 2 boundary
- focus on feature templates and feature-related linking consistency
- reuse existing readiness logic
- avoid inventing a second parallel system
- do not expand to all browse/index surfaces yet
- do not shift into broad content writing yet

## What counts as success for Phase 2
- ready feature pages no longer strongly promote not-ready feature pages
- shared filtering logic is reused across feature templates
- known hardcoded feature exits are audited and tightened
- build / typecheck / relevant audits pass
- results are documented in a way that future sessions can continue from

## Content priorities after Phase 2
Highest-priority excluded pages to improve next:
1. best-ai-video-generators
2. ai-avatar-video-generators
3. content-repurposing-ai-tools
4. professional-ai-video-tools
5. runway
6. pictory

## Working principle for future tasks
Always prefer:
- tightening mature-page exposure first
- improving high-value pages next
- expanding and promoting only after quality and routing confidence improve

## Expected task output format from Codex
For each phase, Codex should report:
1. changed files
2. rules or logic introduced
3. test / audit results
4. promote-safe pool impact
5. remaining risks
6. next recommended task
