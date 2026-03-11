interface EditorialScoreSimpleProps {
  score?: number; // 5分制评分
}

export default function EditorialScoreSimple({ score }: EditorialScoreSimpleProps) {
  const score100 = score ? Math.round(score * 20) : null;
  const displayScore = score100 !== null ? `${score100}/100` : null;

  if (!score || score <= 0 || !displayScore) return null;

  return (
    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-black/45">
      <span>Editorial</span>
      <span className="h-1 w-1 rounded-full bg-black/15" />
      <span className="tabular-nums text-black/65">{displayScore}</span>
    </div>
  );
}
