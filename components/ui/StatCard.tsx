// ============================================================
// app/components/ui/StatCard.tsx
// ============================================================
interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  color?: "blue" | "green" | "amber" | "purple" | "red";
  onClick?: () => void;
}

const colorMap = {
  blue:   { bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/20" },
  green:  { bg: "bg-emerald-500/10",text: "text-emerald-400",border: "border-emerald-500/20"},
  amber:  { bg: "bg-amber-500/10",  text: "text-amber-400",  border: "border-amber-500/20" },
  purple: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20"},
  red:    { bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/20"   },
};

export function StatCard({ icon, value, label, change, changeType = "neutral", color = "blue", onClick }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div
      className={`bg-slate-800 border border-slate-700 rounded-xl p-5 cursor-pointer hover:border-slate-600 hover:-translate-y-0.5 transition-all ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className={`w-10 h-10 rounded-lg ${c.bg} ${c.text} flex items-center justify-center text-xl mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs text-slate-400 font-medium">{label}</div>
      {change && (
        <div className={`text-xs mt-2 font-semibold ${changeType === "up" ? "text-emerald-400" : changeType === "down" ? "text-red-400" : "text-slate-400"}`}>
          {change}
        </div>
      )}
    </div>
  );
}
