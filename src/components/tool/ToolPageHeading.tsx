'use client';

import { useSelectedLayoutSegment } from 'next/navigation';

type ToolPageHeadingProps = {
  toolName: string;
};

export default function ToolPageHeading({ toolName }: ToolPageHeadingProps) {
  const selectedSegment = useSelectedLayoutSegment();

  if (selectedSegment === null) {
    return <h1 className="text-2xl font-bold text-gray-900">{toolName}</h1>;
  }

  return <p className="text-2xl font-bold text-gray-900">{toolName}</p>;
}
