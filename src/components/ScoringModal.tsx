'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ScoringModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 评分维度定义
const SCORING_METRICS = [
  { id: 'quality', label: 'Output quality', weight: 20 },
  { id: 'cost', label: 'Cost control', weight: 20 },
  { id: 'editing', label: 'Editing control', weight: 20 },
  { id: 'speed', label: 'Speed & reliability', weight: 20 },
  { id: 'rights', label: 'Commercial clarity', weight: 20 },
];

export default function ScoringModal({ isOpen, onClose }: ScoringModalProps) {
  // 关闭 Modal 当按 Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/40 z-[9998]"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal 内容 */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
        <div
          className="relative w-full max-w-lg rounded-2xl border border-black/10 bg-white shadow-xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-labelledby="how-we-score-title"
          aria-modal="true"
        >
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-black/40 hover:text-black/70 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="p-6">
            <h2 id="how-we-score-title" className="text-lg font-semibold text-black/90 mb-4 pr-8">
              How we score
            </h2>
            
            <p className="text-sm text-black/70 leading-6 mb-6">
              Editorial score is based on a consistent rubric using public docs and our structured review notes — not user ratings.
            </p>
            
            <div className="space-y-3 mb-6">
              {SCORING_METRICS.map((metric) => (
                <div
                  key={metric.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm text-black/80">{metric.label}</span>
                  <span className="text-sm text-black/60 font-mono tabular-nums">
                    {metric.weight}%
                  </span>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-black/60 leading-5 mb-4">
                Evidence is sourced from each tool's Key Facts, Pricing pages, Pros & Cons sections, and Mini Test results (when available). Our methodology applies consistently across all tools.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // 使用 Portal 渲染到 body
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return null;
}
