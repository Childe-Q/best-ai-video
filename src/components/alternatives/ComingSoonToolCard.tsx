'use client';

import { ClockIcon } from '@heroicons/react/24/solid';
import { ComingSoonTool } from '@/lib/alternatives/getComingSoonTools';

interface ComingSoonToolCardProps {
  tool: ComingSoonTool;
}

export default function ComingSoonToolCard({ tool }: ComingSoonToolCardProps) {
  return (
    <div className="bg-white border border-black/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
      <ClockIcon className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-xl font-bold text-black mb-2">{tool.name}</h3>
      <p className="text-sm text-gray-600 mb-4 leading-[1.65]">{tool.description}</p>
      <button className="px-6 py-2 bg-[#F7D700] text-black border border-black/15 rounded-lg font-semibold hover:opacity-90 transition-opacity">
        Request tool
      </button>
    </div>
  );
}
