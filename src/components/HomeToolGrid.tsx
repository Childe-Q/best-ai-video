'use client';

import { Tool } from '@/types/tool';
import ToolCard from './ToolCard';

interface HomeToolGridProps {
  tools: Tool[];
}

export default function HomeToolGrid({ tools }: HomeToolGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
