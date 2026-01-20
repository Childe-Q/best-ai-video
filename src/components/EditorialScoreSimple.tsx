interface EditorialScoreSimpleProps {
  score?: number; // 5分制评分
}

export default function EditorialScoreSimple({ score }: EditorialScoreSimpleProps) {
  // 计算 100 分制分数
  const score100 = score ? Math.round(score * 20) : null;
  const displayScore = score100 !== null ? `${score100}/100` : null;

  if (!score || score <= 0 || !displayScore) return null;

  return (
    <div className="mt-1 flex items-center gap-2 text-xs text-black/60">
      <span className="inline-flex items-center rounded-full border border-black/10 bg-black/[0.03] px-2 py-0.5 font-medium tracking-wide">
        Editorial
      </span>
      <span className="text-black/80 font-semibold tabular-nums">
        {displayScore}
      </span>
    </div>
  );
}
