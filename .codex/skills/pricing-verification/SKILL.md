---
name: pricing-verification
description: Official-source pricing capture skill for one tool slug. Capture raw pricing facts, normalize them into a governed record, and decide whether exact price is safe to display.
---

# Pricing Verification

## Purpose

Use this skill for one tool slug at a time when pricing needs to be captured or refreshed from official sources.

Primary goal:

- capture official pricing facts
- keep raw evidence separate from normalized pricing data
- decide whether exact price is safe to show
- avoid fake precision, loose inference, and display-layer guessing

This skill is intentionally stricter than generic feature capture.

## Output Layers

Every run should produce three outputs:

1. `raw capture`
   - official source facts and evidence only
2. `normalized pricing record`
   - app-consumable governed summary
3. `resolver preview / audit`
   - what the UI should show, and why

## Allowed Sources

Only use official sources as the primary basis:

- official homepage
- official pricing page
- official FAQ
- official help / billing docs
- official terms / plan docs
- official API pricing page when API pricing is the relevant commercial surface

Third-party pages may inform follow-up questions but must not be the primary basis for displayable pricing.

## Capture Stack

Default stack for this repo:

1. static capture
   - `fetch + cheerio`
2. dynamic fallback
   - `Playwright`

Escalate to Playwright when:

- pricing depends on JS rendering
- pricing requires monthly / yearly toggle interaction
- pricing is hidden behind tabs or accordions
- pricing has per-seat, annual, or interactive calculator behavior that cannot be captured safely from static HTML
- fetch output looks like a shell or is missing plan facts

## Required Fields

At normalization time, populate at least:

- `origin`
- `verification`
- `hasFreePlan`
- `hasFreeTrial`
- `hasSelfServePaid`
- `hasEnterprise`
- `hasInteractivePricing`
- `interactiveReasons`
- `plans`
- `verifiedStartingPrice.safeToShow`
- `coarseDisplayText`

## Prohibited

Never:

- invent prices
- treat free trial as free plan
- flatten billed-yearly monthly-equivalent pricing into ordinary monthly pricing
- treat per-seat pricing as a generic starting price without the seat qualifier
- convert custom / contact sales into a number
- treat `amount = 0` as a free plan without supporting context
- let page components infer price safety on their own

## Governance

Pricing record origins:

- `affiliate-legacy-allowed`
- `legacy-hidden`
- `newly-captured`

Allowed origin / verification combinations:

- `newly-captured -> verified | partial | unverified`
- `affiliate-legacy-allowed -> trusted`
- `legacy-hidden -> trusted | unverified`

Invalid combinations must be treated as data errors and downgraded.

## Working Method

1. Confirm the tool slug exists in `src/data/tools.json`.
2. Load official source URLs from `src/data/sources/tools.sources.json`.
3. Capture pricing page first.
4. Pull FAQ / help / terms only when the pricing page is incomplete or ambiguous.
5. Write raw capture output with source URLs, capture timestamps, snippets, and fact candidates.
6. Normalize into a governed pricing record.
7. Run resolver preview for:
   - `display`
   - `comparison`
   - `structured-data`
   - `scoring`
8. Write a short audit note explaining:
   - what was captured
   - what remains uncertain
   - whether exact price is safe to show

## Scope Discipline

Default scope is narrow:

- one slug
- pricing only
- no broad content rewrite
- no sitewide rollout

Do not default to editing front-end components unless the task explicitly includes integration work.
