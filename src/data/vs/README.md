# VS Data Domain

This directory is the data entry point for the VS comparison production line.

It works together with `src/lib/vs*` and `src/app/vs/`.

## Responsibility

This domain is responsible for:

- explicit comparison definitions
- pair-specific data for VS pages
- comparison inputs that belong to the VS line rather than to general tool identity

## Inputs

Typical reference inputs include:

- `src/data/tools.json`
- `content/tools/*.json`
- `src/data/pricing/*`
- VS helper logic in `src/lib/vs*`

## Outputs

This domain supports:

- `/vs/[slug]` routes
- VS-specific comparison logic
- pair-specific rendering and metadata

## Default Write Surface

Use:

- `src/data/vs/*.ts` for VS pair definitions and VS-owned data

If the problem is actually comparison logic rather than pair data, move to `src/lib/vs*` instead of forcing it into data files.

## Avoid Mixing With

- `src/data/tools.json` for pair-specific judgments
- `src/data/features/normalized/*.json`
- `src/data/alternatives/*`
- unrelated generic page components

## High-Risk Area

- `src/data/vs/index.ts`

This file is shared and high impact. Edit it carefully and only when the task truly requires it.

## Default Rule

Keep VS-specific conclusions in the VS line.

Do not promote a pair-specific comparison statement into a global shared fact unless the task explicitly calls for that.

