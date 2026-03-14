import { ImageResponse } from 'next/og';
import { getVsOgData } from '@/lib/og/getVsOgData';
import {
  DEFAULT_COMPARISON_OG_VARIANT,
  FallbackLayout,
  renderComparisonOgLayout,
} from '@/lib/og/layouts';
import { OG_WIDTH, OG_HEIGHT } from '@/lib/og/theme';

export const alt = 'VS Comparison';
export const size = { width: OG_WIDTH, height: OG_HEIGHT };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getVsOgData(slug);

  if (!data) {
    return new ImageResponse(<FallbackLayout />, size);
  }

  return new ImageResponse(
    renderComparisonOgLayout(data, DEFAULT_COMPARISON_OG_VARIANT),
    size,
  );
}
