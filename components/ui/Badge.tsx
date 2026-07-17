// ============================================================
// app/components/ui/Badge.tsx
// ============================================================
type BadgeVariant = "success" | "warning" | "danger" | "info" | "default";

const badgeStyles: Record<BadgeVariant, string> = {
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  danger:  "bg-red-500/15 text-red-400 border-red-500/25",
  info:    "bg-blue-500/15 text-blue-400 border-blue-500/25",
  default: "bg-slate-700 text-slate-300 border-slate-600",
};

export function Badge({ children, variant = "default" }: { children: ReactNode; variant?: BadgeVariant }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyles[variant]}`}>
      {children}
    </span>
  );
}
