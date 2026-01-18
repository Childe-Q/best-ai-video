# Tool Content JSON Files

This directory contains structured content JSON files for each tool, used to drive the tool pages.

## Structure

Each `{slug}.json` file follows the `ToolContent` type defined in `src/types/toolContent.ts`.

## Generating Content

Use the build script to generate content from dossiers + evidence:

```bash
# Generate content for a single tool
tsx scripts/build_tool_content.ts <slug> --dossier /tmp/dossiers/{slug}.json --evidence /tmp/evidence/{slug}.json

# Or use default paths
tsx scripts/build_tool_content.ts heygen
```

## Content Rules

1. **Pricing**: Only from site dossiers (never from external evidence)
2. **Evidence**: External evidence only for user pain points, FAQs, and non-pricing hard facts
3. **Filtering**: Any text containing `[NEED VERIFICATION]` is automatically discarded
4. **Length limits**:
   - Cards/lists: 12-18 words per item
   - Max 6 items per block (FAQ: 8, Features: 8-10)
   - Pros/Cons: Short, verifiable sentences

## Fallback Behavior

If a content JSON file doesn't exist, the page will fall back to:
- `tool.content` (from tools.json)
- `tool.pros`, `tool.cons`, `tool.features` (from tools.json)
