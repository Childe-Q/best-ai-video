import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import CanonicalPricingToolView from '@/components/pricing-cards/CanonicalPricingToolView';
import {
  getCanonicalPricingStaticParams,
  getCanonicalPricingTool,
} from '@/lib/pricingCards';

export async function generateStaticParams() {
  return getCanonicalPricingStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getCanonicalPricingTool(slug);

  if (!tool) {
    return {};
  }

  return {
    title: `${tool.toolName} pricing cards`,
    description: `Canonical pricing cards for ${tool.toolName}.`,
  };
}

export default async function CanonicalPricingToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getCanonicalPricingTool(slug);

  if (!tool) {
    notFound();
  }

  return <CanonicalPricingToolView tool={tool} />;
}
