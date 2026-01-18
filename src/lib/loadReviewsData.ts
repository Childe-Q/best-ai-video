import { ReviewsPageData } from '@/components/reviews/ReviewsPageTemplate';
import { readFileSync } from 'fs';
import { join } from 'path';

const REVIEWS_DIR = join(process.cwd(), 'src', 'data', 'reviews');

/**
 * Load reviews data from JSON file
 * Returns null if file doesn't exist (graceful fallback)
 */
export function loadReviewsData(slug: string): ReviewsPageData | null {
  try {
    const filePath = join(REVIEWS_DIR, `${slug}.json`);
    const fileContent = readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent) as ReviewsPageData;
  } catch (error) {
    // File doesn't exist or invalid JSON - return null for graceful fallback
    return null;
  }
}
