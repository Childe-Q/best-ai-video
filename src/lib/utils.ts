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

