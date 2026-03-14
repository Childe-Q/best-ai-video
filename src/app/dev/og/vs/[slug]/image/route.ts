import { ImageResponse } from 'next/og';
import { createElement } from 'react';
import { getVsOgData } from '@/lib/og/getVsOgData';
import { FallbackLayout, renderComparisonOgLayout } from '@/lib/og/layouts';
import { OG_HEIGHT, OG_WIDTH } from '@/lib/og/theme';

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const data = getVsOgData(slug);

  if (!data) {
    return new ImageResponse(
      createElement(FallbackLayout, { heading: 'VS comparison preview' }),
      {
        width: OG_WIDTH,
        height: OG_HEIGHT,
      },
    );
  }

  const variant = new URL(request.url).searchParams.get('variant');

  return new ImageResponse(renderComparisonOgLayout(data, variant), {
    width: OG_WIDTH,
    height: OG_HEIGHT,
  });
}
