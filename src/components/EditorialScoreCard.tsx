'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

interface EditorialScoreCardProps {
  score?: number; // 5分制评分
  updatedAt?: string; // 格式如 "Jan 2026" 或完整日期
  toolSlug: string; // 用于生成链接
}

// 评分维度定义（与工具页保持一致）
const SCORING_METRICS = [
  { id: 'quality', label: 'Output quality', weight: 20, anchorId: 'mini-test', href: '#mini-test' },
  { id: 'cost', label: 'Cost control', weight: 20, anchorId: 'pricing', href: '/pricing#pricing' },
  { id: 'editing', label: 'Editing control', weight: 20, anchorId: 'pros-cons', href: '#pros-cons' },
  { id: 'speed', label: 'Speed & reliability', weight: 20, anchorId: 'mini-test', href: '#mini-test' },
  { id: 'rights', label: 'Commercial clarity', weight: 20, anchorId: 'key-facts', href: '#key-facts' },
  { id: 'workflow', label: 'Workflow fit', weight: 0, anchorId: 'overview', href: '#overview' },
];

export default function EditorialScoreCard({ 
  score, 
  updatedAt,
  toolSlug 
}: EditorialScoreCardProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // 计算 100 分制分数
  const score100 = score ? Math.round(score * 20) : null;
  const displayScore = score100 !== null ? `${score100}/100` : null;

  // 格式化日期（简化显示）
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    // 如果已经是简短格式（如 "Jan 2026"），直接返回
    if (dateStr.match(/^[A-Za-z]{3}\s+\d{4}$/)) return dateStr;
    // 否则尝试解析并格式化
    try {
      const date = new Date(dateStr);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const formattedDate = formatDate(updatedAt);

  // 计算 Popover 位置（基于 trigger 按钮）
  const updatePopoverPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollX = window.scrollX || window.pageXOffset;
      
      // 计算位置，确保不超出视口
      let left = rect.left + scrollX;
      let top = rect.bottom + scrollY + 8;
      
      // 如果右侧空间不足，向左调整
      if (left + 320 > window.innerWidth + scrollX) {
        left = window.innerWidth + scrollX - 320 - 12;
      }
      
      // 如果下方空间不足，显示在上方
      if (top + 300 > window.innerHeight + scrollY) {
        top = rect.top + scrollY - 300 - 8;
      }
      
      setPopoverPosition({ top, left });
    }
  };

  // 关闭 Popover 当点击外部
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        triggerRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    };

    if (isPopoverOpen) {
      updatePopoverPosition();
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', updatePopoverPosition);
      window.addEventListener('scroll', updatePopoverPosition, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
    };
  }, [isPopoverOpen]);

  // 关闭 Popover 当按 Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isPopoverOpen) {
        setIsPopoverOpen(false);
      }
    };

    if (isPopoverOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isPopoverOpen]);

  const handleToggle = () => {
    if (!isPopoverOpen) {
      updatePopoverPosition();
    }
    setIsPopoverOpen(!isPopoverOpen);
  };

  // 渲染 Popover（使用 Portal）
  const renderPopover = () => {
    if (!isPopoverOpen) return null;

    const popoverContent = (
      <div
        ref={popoverRef}
        className="fixed z-[9999] bg-white border border-black/10 shadow-lg rounded-xl p-4 w-[320px] max-w-[calc(100vw-24px)]"
        style={{
          top: `${popoverPosition.top}px`,
          left: `${popoverPosition.left}px`,
        }}
        role="dialog"
        aria-labelledby="how-we-score-title"
      >
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <h3 id="how-we-score-title" className="text-sm font-semibold text-black/80">
              How we score
            </h3>
            <span className="text-xs text-black/60 font-medium px-2 py-0.5 rounded-full bg-black/[0.02] border border-black/5 inline-block w-fit">
              Editorial rubric — not user reviews
            </span>
          </div>
          
          <div className="space-y-2 pt-2 border-t border-gray-100">
            {SCORING_METRICS.map((metric) => {
              // 只显示有权重的维度（workflow 权重为 0，不显示）
              if (metric.weight === 0) return null;
              
              const href = metric.href.startsWith('/') 
                ? `/tool/${toolSlug}${metric.href}`
                : `/tool/${toolSlug}${metric.href}`;
              
              return (
                <div
                  key={metric.id}
                  className="flex items-center justify-between gap-3 py-1 leading-6"
                >
                  <span className="text-sm text-black/80">{metric.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-black/60">{metric.weight}%</span>
                    <Link
                      href={href}
                      className="text-xs text-black/60 hover:text-black/80 hover:underline underline-offset-2 transition"
                      onClick={() => setIsPopoverOpen(false)}
                    >
                      View evidence →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );

    // 使用 Portal 渲染到 body
    if (typeof window !== 'undefined') {
      return createPortal(popoverContent, document.body);
    }
    return null;
  };

  return (
    <>
      <div className="flex flex-col gap-0.5">
        {/* 主行：Editorial score */}
        <div className="flex items-center gap-2 flex-wrap">
          {displayScore ? (
            <span className="text-sm font-semibold text-black/80">
              Editorial score {displayScore}
            </span>
          ) : (
            <span className="text-sm font-semibold text-black/80">
              Editorial rubric
            </span>
          )}
          
          <button
            ref={triggerRef}
            type="button"
            onClick={handleToggle}
            className="text-xs font-medium text-black/60 hover:text-black/80 hover:underline underline-offset-4 transition"
            aria-expanded={isPopoverOpen}
            aria-haspopup="true"
          >
            How we score
          </button>
        </div>
        
        {/* 次行：metrics + updated */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-black/50">
            · 6 metrics
          </span>
          {formattedDate && (
            <>
              <span className="text-xs text-black/50">·</span>
              <span className="text-xs text-black/50">
                Updated {formattedDate}
              </span>
            </>
          )}
        </div>
      </div>
      
      {/* Popover (使用 Portal) */}
      {renderPopover()}
    </>
  );
}
