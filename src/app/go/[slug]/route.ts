import { redirect } from 'next/navigation';
import { getToolBySlug } from '@/lib/toolData';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tool = getToolBySlug(slug)?.tool;

  if (tool && tool.affiliate_link) {
    redirect(tool.affiliate_link);
  } else {
    redirect('/');
  }
}
