'use client';

import { useState, useRef, useEffect } from 'react';

interface EditorialScoreProps {
  rating?: number; // 5分制评分
  lastUpdated?: string; // 格式如 "January 15, 2026" 或 "Jan 2026"
  metricsCount?: number; // 默认 5
}

// 评分维度定义（组件内部常量）
const SCORING_METRICS = [
  { id: 'quality', label: 'Output quality', weight: 20, anchorId: 'mini-test' },
  { id: 'cost', label: 'Cost control', weight: 20, anchorId: 'pricing' },
  { id: 'editing', label: 'Editing control', weight: 20, anchorId: 'pros-cons' },
  { id: 'speed', label: 'Speed & reliability', weight: 20, anchorId: 'mini-test' },
  { id: 'rights', label: 'Commercial clarity', weight: 20, anchorId: 'key-facts' },
];

export default function EditorialScore({ 
  rating, 
  lastUpdated,
  metricsCount = 5 
}: EditorialScoreProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // 计算 100 分制分数
  const score100 = rating ? Math.round(rating * 20) : null;
  const displayScore = score100 !== null ? `${score100}/100` : '—';

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

  const formattedDate = formatDate(lastUpdated);

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
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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

  const handleViewEvidence = (anchorId: string) => {
    setIsPopoverOpen(false);
    
    // 延迟一下确保 popover 关闭动画完成
    setTimeout(() => {
      const element = document.getElementById(anchorId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Fallback: 滚动到页面顶部评分下方的第一个内容区
        const overviewSection = document.getElementById('overview');
        if (overviewSection) {
          overviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  };

  return (
    <div className="relative flex flex-col gap-1 mb-2">
      {/* 主行：Editorial score */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-black/80">
          Editorial score {displayScore}
        </span>
        
        {/* 辅助信息：metrics + updated */}
        {(metricsCount > 0 || formattedDate) && (
          <span className="text-xs text-black/50">
            {metricsCount > 0 && `· ${metricsCount} metrics`}
            {formattedDate && ` · Updated ${formattedDate}`}
          </span>
        )}
        
        {/* How we score 按钮 */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          className="text-xs text-black/60 hover:text-black/80 transition relative"
          aria-expanded={isPopoverOpen}
          aria-haspopup="true"
        >
          How we score
        </button>
      </div>

      {/* Popover */}
      {isPopoverOpen && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-2 z-50 bg-white border border-black/10 shadow-lg rounded-xl p-4 w-[320px] max-w-[calc(100vw-24px)]"
          role="dialog"
          aria-labelledby="how-we-score-title"
        >
          <div className="space-y-3">
            <h3 id="how-we-score-title" className="text-sm font-semibold text-gray-900">
              How we score
            </h3>
            
            <p className="text-xs text-gray-600 leading-relaxed">
              Editorial score is based on our rubric and testing notes — not user ratings.
            </p>
            
            <div className="space-y-2 pt-2 border-t border-gray-100">
              {SCORING_METRICS.map((metric) => (
                <div
                  key={metric.id}
                  className="flex items-center justify-between gap-3 py-1"
                >
                  <span className="text-xs text-gray-700">{metric.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{metric.weight}%</span>
                    <button
                      type="button"
                      onClick={() => handleViewEvidence(metric.anchorId)}
                      className="text-xs text-black/60 hover:text-black/80 transition"
                    >
                      View evidence →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
