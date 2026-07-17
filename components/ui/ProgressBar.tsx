// ============================================================
// app/components/ui/ProgressBar.tsx
// ============================================================
export function ProgressBar({ value, max = 100, color = "blue", showLabel = true }: {
  value: number; max?: number; color?: string; showLabel?: boolean;
}) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const barColor = pct >= 90 ? "bg-emerald-400" : pct >= 70 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <span className="text-xs font-mono text-slate-400 w-10">{pct}%</span>}
    </div>
  );
}
