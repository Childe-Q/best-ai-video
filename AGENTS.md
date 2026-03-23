# AGENTS.md

## GEO

When working on SEO, GEO, or AI visibility for `best-ai-video.com`, optimize the existing Next.js page system instead of treating the site like a generic blog.

Primary page types:

- homepage
- `/tool/[slug]`
- `/tool/[slug]/alternatives`
- `/vs/[slug]`
- `/features/[slug]`

Default priority order:

1. `llms.txt`
2. `robots.ts` and `sitemap.ts`
3. metadata and canonicals
4. JSON-LD schema
5. citability blocks
6. internal linking
7. only then broader copy improvements

Project rules:

- Prefer structural and template-level changes over large copy rewrites.
- Keep thin-page noindex logic aligned with sitemap inclusion rules.
- Only add schema that matches visible on-page content.
- Preserve and strengthen evidence-backed blocks, methodology signals, and affiliate disclosure.
- Do not invent brand `sameAs` profiles or unsupported entity claims.
- Use internal links to move users through the site's decision ladder:
  homepage -> features/tool/vs
  features -> tool/alternatives/vs
  tool -> pricing/alternatives/reviews/features/vs
  alternatives -> tool/vs/features
  vs -> both tool pages/alternatives/features

Template intent:

- homepage = route chooser and site entity page
- tool page = canonical tool overview
- alternatives page = replacement shortlist page
- vs page = narrow decision page
- feature page = broad workflow and use-case page

Preferred GEO work products:

- `public/llms.txt`
- root-file and crawler updates
- shared metadata helpers
- shared JSON-LD helpers
- reusable short-answer, key-facts, source, and related-links blocks

Avoid:

- sitewide copy churn as the first move
- generic AI SEO advice that ignores page type
- schema spam
- dumping every page into `llms.txt`
