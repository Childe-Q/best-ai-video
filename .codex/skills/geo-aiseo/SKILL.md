---
name: geo-aiseo
description: GEO and AI SEO skill for best-ai-video.com. Use when improving llms.txt, robots.txt, sitemap coverage, schema, metadata, citability blocks, or internal linking for this Next.js AI video tools directory across homepage, tool pages, alternatives pages, vs pages, and feature-led use-case pages.
---

# GEO AI SEO For Best AI Video Tools

## Purpose

Use this skill for structural GEO work on `https://www.best-ai-video.com`, not broad copy rewrites.

This site is an AI video tools directory with five core page systems:

- Homepage: route chooser and entity entry point
- Tool pages: `/tool/[slug]`
- Tool alternatives pages: `/tool/[slug]/alternatives`
- VS pages: `/vs/[slug]`
- Feature-led use-case pages: `/features/[slug]`

The job is to make these pages easier for AI systems to understand, quote, and route users through.

## Default Priorities

Always work in this order unless the user explicitly asks otherwise:

1. `llms.txt`
2. `robots.ts` and `sitemap.ts`
3. Canonical metadata and page titles/descriptions
4. JSON-LD schema that matches visible page content
5. Citability blocks and source-backed fact blocks
6. Internal linking between route hubs and decision pages
7. Only then consider copy expansion

Do not start with large-scale copy rewrites. Prefer infrastructure, template logic, and reusable page blocks.

## What GEO Means On This Site

For this project, GEO is mostly about:

- making the site legible to LLM crawlers and retrieval systems
- making page purpose obvious in the first screen and first sections
- turning each template into a clean citation target
- surfacing official-source evidence and decision-ready summaries
- reinforcing entity clarity for the site and for covered tools
- routing users and AI systems from broad query pages to narrow decision pages

The strongest reusable patterns on this codebase are already visible in:

- `src/app/layout.tsx`
- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `src/lib/jsonLd.ts`
- `src/app/page.tsx`
- `src/app/tool/[slug]/page.tsx`
- `src/app/tool/[slug]/alternatives/page.tsx`
- `src/app/vs/[slug]/page.tsx`
- `src/app/features/[slug]/page.tsx`
- `src/components/tool/EvidenceNuggets.tsx`
- `src/components/tool/EvidenceNotes.tsx`
- `src/components/alternatives/longform/AlternativesLongformTemplate.tsx`
- `src/components/vs/VsPageTemplate.tsx`
- `src/components/features/FeatureHubPage.tsx`

## Page Model

Treat each page type as a distinct retrieval target.

### Homepage

Purpose:

- define the site entity
- explain how to use the site
- route users into `features`, `tool`, or `vs`

Structural GEO goals:

- strong entity summary near top of page
- clear route-based internal links
- organization and website schema
- optional search-focused schema only if a real site search endpoint exists

### Tool Pages

Purpose:

- be the canonical overview for one tool
- answer "what is it, who is it for, what are the tradeoffs"

Structural GEO goals:

- `SoftwareApplication` schema plus breadcrumbs
- fast-answer block above the fold
- source-backed facts from official docs
- strong links to pricing, alternatives, features, reviews, related VS pages, and relevant use-case pages

### Alternatives Pages

Purpose:

- answer "what should I use instead of X"
- cluster substitutes by workflow and buyer intent

Structural GEO goals:

- clear "why users leave X" summary
- shortlist table or at-a-glance block
- links into tool pages and adjacent `vs` pages
- noindex if thin, consistent with sitemap rules

### VS Pages

Purpose:

- answer "A vs B: which should I choose"
- be the narrowest decision page in the system

Structural GEO goals:

- short answer at top
- decision table and winner-by-use-case block
- FAQ JSON-LD only when backed by real visible FAQ content
- strong source visibility
- links outward to both tool pages and relevant feature pages

### Feature Pages

Purpose:

- answer broad workflow or use-case queries
- route from intent to shortlist

Structural GEO goals:

- clear route definition in hero
- "best picks at a glance" and "choose your route" blocks
- strong recommended reading links to tools, alternatives, and vs pages
- collection-style schema only if the visible page truly behaves like a collection

## Page-Type Rules

### Metadata

- Every indexable page must have a canonical URL.
- Titles should describe the page type, not just the keyword.
- Descriptions should summarize decision value, not generic marketing copy.
- Preserve noindex logic for thin pages; do not add thin pages back into the sitemap.

### Schema

- Only ship schema that matches visible content.
- Keep sitewide `Organization` and `WebSite` schema in the layout.
- Tool pages should keep `SoftwareApplication`.
- Add breadcrumb schema where the page hierarchy is real.
- Add FAQ schema only when the FAQ is rendered on page.
- Do not spam schema types that are not supported by the template content.

### Citability

A page is more citable when the answer is extractable in 1-3 blocks without scrolling through narrative text.

Prefer adding or tightening these blocks:

- short answer / verdict
- best for / not for
- key facts
- pricing signal
- workflow fit
- tradeoffs
- sources used
- related next-step links

For this site, citability should come from structured blocks, comparison tables, FAQ sections, and evidence components, not from long rewritten prose.

### Internal Linking

Internal links should mirror the site's decision ladder:

- homepage -> feature hubs / flagship tools / flagship vs pages
- feature page -> tool reviews / alternatives / vs pages
- tool page -> pricing / alternatives / reviews / features / related vs
- alternatives page -> tool pages / pricing pages / vs pages / adjacent feature pages
- vs page -> both tool pages / alternatives pages / relevant feature pages

Do not add random cross-links. Every internal link should answer "what is the next decision after this page?"

## Site-Specific Modules To Favor

### 1. llms.txt

This is the highest-leverage missing infrastructure item on the current project.

Prefer:

- `public/llms.txt` for the root file
- optional `public/llms-full.txt` later, after the short file is stable

The initial file should prioritize:

- homepage
- methodology
- top feature pages
- flagship tool pages
- flagship alternatives pages
- flagship vs pages

Do not dump every URL in the file. Curate the best citation targets.

### 2. Crawlers

Use `src/app/robots.ts` and `src/app/sitemap.ts` as the source of truth.

Protect:

- `/go/`
- `/api/`
- thin pages already gated by readiness checks

Make sure new GEO files are crawlable:

- `llms.txt`
- `llms-full.txt` if added

### 3. Schema

Current schema coverage exists but is uneven.

Focus on:

- strengthening breadcrumbs across key templates
- keeping tool schema consistent
- extending FAQ schema where visible FAQ sections already exist
- adding collection/list schema only to pages that render actual ranked or grouped lists

### 4. Technical SEO

For this project, technical GEO work means:

- clean canonicals
- sitemap parity with noindex rules
- stable metadata generation
- valid structured data
- root-file availability
- no accidental crawler blocking

### 5. Content Quality And E-E-A-T

Do not rewrite the whole page.

Instead:

- expose methodology clearly
- keep affiliate disclosure visible
- prefer source-backed fact blocks
- preserve editorial summaries and tradeoff framing
- link to methodology when a page makes judgment calls

### 6. Brand And Entity Signals

For this site, entity work is mostly:

- consistent site name usage: `Best AI Video Tools`
- consistent description of what the site does
- stronger `Organization.sameAs` only when real profiles exist
- clean methodology and about-page references

Do not invent `sameAs` URLs.

### 7. Platform-Specific AI Visibility

The most relevant external platforms for this site are:

- YouTube
- Reddit
- Product Hunt
- GitHub only when a covered tool or resource genuinely has developer relevance

For onsite work, reflect this by:

- making YouTube-related and creator-related routes easy to discover
- surfacing route pages that answer comparison-style queries cleanly
- avoiding generic "AI SEO" language that does not map to actual AI video buyer intent

## Workflow

When asked to improve GEO for a page or template, do this:

1. Identify the page type and its decision role.
2. Check metadata, canonical, robots, and sitemap behavior.
3. Check existing schema and whether it matches visible content.
4. Check the first two screenfuls for extractable answer blocks.
5. Check whether the page links to the next logical decision pages.
6. Prefer template changes over page-by-page prose edits.
7. Verify that the result improves both crawlability and citation readiness.

## Recommended Deliverables

When making GEO changes, prefer outputs like:

- `public/llms.txt`
- shared metadata helpers
- shared JSON-LD helpers
- reusable citation-ready blocks
- reusable related-links blocks
- sitemap and robots improvements
- template-level linking logic

Avoid one-off edits that do not scale across the page system.

## Validation

After edits, verify:

- `llms.txt` resolves at `/llms.txt`
- sitemap only includes indexable pages
- thin pages remain noindexed
- structured data matches rendered content
- canonical URLs are correct
- key pages expose short-answer or key-facts blocks
- every major page type links to the next step in the site journey

## Do Not

- do not mass-rewrite article bodies first
- do not add schema types unsupported by visible content
- do not add every URL to `llms.txt`
- do not break existing thin-page gating
- do not let affiliate CTAs become the main page purpose
- do not replace evidence-backed sections with vague marketing copy
