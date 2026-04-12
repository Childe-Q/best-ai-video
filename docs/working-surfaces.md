# Working Surfaces

This file is the quick routing note for `ai-saas-mvp`.
Use it when the task is clear enough to work, but you need to choose the correct write surface fast.

## Read Order

1. `AGENTS.md`
2. this file
3. `docs/codex-handoff.md` and `docs/decision-log.md` when the task touches readiness, exposure, or current project priorities
4. the nearest local `README.md`

## Quick Routing

| Task type | Default write surface | Avoid starting in |
| --- | --- | --- |
| tool overview content | `content/tools/{slug}.json` | `src/data/tools.json` |
| feature-page content | `src/data/research/features/*.raw.json` and `src/data/features/normalized/*.json` | `content/tools/*`, `src/data/tools.json` |
| alternatives logic or content | `src/data/alternatives/*`, `src/lib/alternatives/*` | feature or VS data files |
| VS comparisons | `src/data/vs/*`, `src/lib/vs*` | `src/data/tools.json` for pair-specific judgments |
| pricing facts | `src/data/pricing/raw/*.json`, `src/data/pricing/normalized/*.json`, or the owning pricing sublayer | page components or `src/data/tools.json` |
| route or template behavior | `src/app/*`, `src/components/*`, route-facing helpers | upstream data files unless the problem is data-owned |
| readiness or promote-safe logic | `src/lib/readiness/*`, `reports/*` | editorial files as if reports were truth |
| GEO infrastructure | `public/llms.txt`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/lib/jsonLd.ts` | large copy rewrites as the first move |

## Reference-Only Inputs

These are useful inputs, but not default runtime truth:

- `information/`
- `data/runtime-captures/*`
- `data/product-intelligence/*`
- root-level `.codex/skills/*`
- root-level research, audit, and extraction folders

Promote facts into the owning app surface instead of treating reference inputs as production output.

## Shared-Truth Caution

Be explicit before editing these:

- `src/data/tools.json`
- `src/data/vs/index.ts`
- `src/lib/readiness/index.ts`
- `src/data/features/normalized/*.json`
- `src/data/alternatives/canonical.ts`

If one of these is the right target, keep the diff minimal and avoid opportunistic cleanup.
