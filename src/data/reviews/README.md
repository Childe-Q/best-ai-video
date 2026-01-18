# Reviews Data JSON Files

This directory contains structured reviews data JSON files for each tool, used to drive the reviews pages.

## Structure

Each `{slug}.json` file follows the `ReviewsPageData` type defined in `src/components/reviews/ReviewsPageTemplate.tsx`.

## Schema

```typescript
{
  userFeedbackSnapshot?: Array<{
    point: string;
    type: "positive" | "neutral" | "negative";
    sourceType?: string;
    url?: string;
  }>;  // Max 6 items per type
  commonIssues?: Array<{
    point: string;
    flag: "Official" | "User feedback";
    sourceType?: string;
    url?: string;
  }>;  // Max 8 items
  faqs?: Array<{
    q: string;
    a: string;
    confidence?: "confirmed" | "unconfirmed";
  }>;  // Max 8 items
}
```

## Data Rules

1. **userFeedbackSnapshot**: 
   - Max 6 items per type (positive/negative/neutral)
   - Must be evidence-based, no auto-generated content
   - Include sourceType and url when available

2. **commonIssues**:
   - Max 8 items
   - flag must be either "Official" or "User feedback"
   - point should be a clear, actionable statement

3. **faqs**:
   - Exactly 8 items (if data is available)
   - Do not create placeholder FAQs if data is missing
   - confidence field is optional

## Fallback Behavior

If a reviews JSON file doesn't exist, the page will fall back to:
- `tool.content.reviews.reviewHighlights` (from content JSON)
- `tool.content.reviews.faqs` (from content JSON)
- `tool.faqs` (from tools.json)

The page will gracefully handle missing data - sections with no data will not be rendered.
