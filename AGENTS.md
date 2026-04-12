# AGENTS.md

`ai-saas-mvp/` is the real working directory for `best-ai-video.com`.
Default to treating this folder as a standalone Next.js app, not as the larger `SEO-GEO` mixed workspace.

## Start Here

For non-trivial work, read in this order:

1. `AGENTS.md`
2. `docs/working-surfaces.md`
3. `docs/codex-handoff.md`
4. `docs/decision-log.md`
5. the nearest local `README.md`

## Common Commands

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm validate:tools`
- `pnpm validate:pricing`

## Working Defaults

- Keep changes narrow and stay inside one production line unless the task clearly crosses boundaries.
- Prefer the smallest valid write surface; do not start with broad edits to shared datasets.
- Keep outputs concise. Do not write long reports unless the task explicitly asks for them.
- Do not default to UI churn, broad refactors, or large copy rewrites.
- When structure, ownership, or workflow assumptions change, update local Markdown in the same task.

## Default Write Surfaces

- routes and rendering: `src/app/*`, `src/components/*`
- tool overview content: `content/tools/{slug}.json`
- features: `src/data/research/features/*.raw.json` -> `src/data/features/normalized/*.json`
- alternatives: `src/data/alternatives/*`, `src/lib/alternatives/*`
- VS: `src/data/vs/*`, `src/lib/vs*`
- pricing: `src/data/pricing/*`
- readiness and exposure control: `src/lib/readiness/*`, `reports/*`
- GEO infrastructure: `public/llms.txt`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/lib/jsonLd.ts`

See `docs/working-surfaces.md` for quick routing and avoid-lists.

## High-Risk Shared Files

Edit these only with clear justification and minimal diffs:

- `src/data/tools.json`
- `src/data/vs/index.ts`
- `src/lib/readiness/index.ts`
- `src/data/features/normalized/*.json`
- `src/data/alternatives/canonical.ts`

## GEO Defaults

When the task is SEO, GEO, or AI visibility work, use this priority order:

1. `llms.txt`
2. `robots.ts` and `sitemap.ts`
3. metadata and canonicals
4. JSON-LD schema
5. citability blocks
6. internal linking
7. only then broader copy changes

Keep schema aligned with visible content, preserve evidence-backed blocks, and use internal links to move users through the decision ladder between homepage, feature pages, tool pages, alternatives pages, and VS pages.

## Do Not Default To

- treating `information/`, `data/runtime-captures/`, or `data/product-intelligence/` as direct runtime truth
- using `src/data/tools.json` as the first write target for editorial or pricing work
- mixing tool, feature, pricing, alternatives, and VS conclusions in one pass
- copying root-level workspace rules into app code tasks
