/**
 * Get the SEO current year for metadata
 * Returns next year if current month is November or December (>= 11)
 * Otherwise returns current year
 */
export function getSEOCurrentYear(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() returns 0-11, so add 1
  
  return month >= 11 ? year + 1 : year;
}

/**
 * Get current month and year string for status badge
 * Returns format like "Dec 2025"
 */
export function getCurrentMonthYear(): string {
  const now = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  
  return `${month} ${year}`;
}

