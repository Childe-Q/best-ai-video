'use client';

import { useState } from 'react';
import { UseCaseChip, CapabilityChip } from '@/lib/toolChips';

interface DoubleLayerChipsProps {
  useCases: UseCaseChip[];
  coreCapabilities: CapabilityChip[];
  differentiators: CapabilityChip[];
}

export default function DoubleLayerChips({ 
  useCases, 
  coreCapabilities, 
  differentiators 
}: DoubleLayerChipsProps) {
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
  const [activeCapId, setActiveCapId] = useState<string | null>(null);

  function jumpTo(targetId: string, capId: string) {
    setActiveTargetId(targetId);
    setActiveCapId(capId);
    
    const element = document.getElementById(targetId);
    if (element) {
      // 判断是否是 key-fact 条目（需要特殊高亮样式）
      const isKeyFact = targetId.startsWith('key-fact-');
      
      if (isKeyFact) {
        // Key Fact 条目：添加左侧边框高亮
        element.classList.add('bg-black/5', 'border-l-2', 'border-black', 'pl-2', '-ml-2.5', 'rounded-r', 'pr-1');
      } else {
        // 其他容器（pros-cons, key-facts）：添加背景高亮
        element.classList.add('bg-black/5', 'rounded-xl', 'p-2', '-m-2');
      }
      
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // 移除高亮状态，1.8秒后
      setTimeout(() => {
        if (isKeyFact) {
          element.classList.remove('bg-black/5', 'border-l-2', 'border-black', 'pl-2', '-ml-2.5', 'rounded-r', 'pr-1');
        } else {
          element.classList.remove('bg-black/5', 'rounded-xl', 'p-2', '-m-2');
        }
        setActiveTargetId(null);
        setActiveCapId(null);
      }, 1800);
    }
  }

  // 如果没有任何数据，不渲染
  if (useCases.length === 0 && coreCapabilities.length === 0 && differentiators.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2.5 mt-4 mb-2">
      {/* 1. Use-case Chips (上层) */}
      {useCases.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {useCases.map((chip) => (
            <span
              key={chip.id}
              className="inline-flex items-center rounded-full border border-black/15 bg-white px-3 py-1 text-sm font-semibold text-black shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:border-black/30 hover:bg-black/[0.03] transition"
            >
              {chip.label}
            </span>
          ))}
        </div>
      )}

      {/* 2. Core Capability Chips (中层) */}
      {coreCapabilities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {coreCapabilities.map((chip) => (
            <button
              key={chip.id}
              onClick={() => jumpTo(chip.targetId, chip.id)}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition ${
                activeCapId === chip.id
                  ? 'bg-black text-white border-black'
                  : 'border-black/10 bg-black/[0.02] text-black/80 hover:bg-black/[0.04] hover:border-black/20'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* 3. Differentiators Chips (下层，新增) */}
      {differentiators.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mr-1">
            Stand-out
          </span>
          {differentiators.map((chip) => (
            <button
              key={`diff-${chip.id}`}
              onClick={() => jumpTo(chip.targetId, `diff-${chip.id}`)}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold transition ${
                activeCapId === `diff-${chip.id}`
                  ? 'bg-black text-white border-black'
                  : 'border-black/20 bg-white text-black hover:bg-black/[0.03] hover:border-black/30'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
