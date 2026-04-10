# Features Data Domain

This directory is the production-facing feature-page data line.

It works with the upstream research line under `src/data/research/features/`.

## Responsibility

This domain is responsible for:

- normalized feature-page data
- feature-specific page structure and grouped content
- production-facing inputs for `/features/[slug]`

## Inputs

Typical inputs include:

- `src/data/research/features/*.raw.json`
- `src/data/tools.json`
- feature normalization scripts
- feature rendering needs from `src/app/features/` and `src/components/features/`

## Outputs

This domain supports:

- normalized feature JSON under `src/data/features/normalized/`
- feature routes in `src/app/features/`
- feature templates and related feature logic

## Default Write Surface

For production-facing feature content work:

- `src/data/features/normalized/*.json`

If the issue is upstream research quality rather than normalized output, update the raw research line in `src/data/research/features/*.raw.json` instead.

## Avoid Mixing With

- `src/data/tools.json` for feature-specific conclusions
- `content/tools/*`
- `src/data/vs/*`
- `src/data/alternatives/*`

## High-Risk Area

- `src/data/features/normalized/*.json`

This subtree is production-facing and influences feature page quality directly.

## Default Rule

Keep feature work inside the feature production line:

1. raw research feeds normalized output
2. normalized output feeds feature pages
3. unrelated production lines should stay untouched unless the task explicitly crosses boundaries

