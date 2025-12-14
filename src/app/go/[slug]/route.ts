import { redirect } from 'next/navigation';
import toolsData from '@/data/tools.json';
import { Tool } from '@/types/tool';

const tools: Tool[] = toolsData as Tool[];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  const tool = tools.find((t) => t.slug === slug);

  if (tool && tool.affiliate_link) {
    redirect(tool.affiliate_link);
  } else {
    redirect('/');
  }
}

