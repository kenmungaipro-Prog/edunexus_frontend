// ============================================================
// app/components/ui/Avatar.tsx
// ============================================================
export function Avatar({ name, size = "md", color = "blue" }: { name: string; size?: "sm" | "md" | "lg"; color?: string }) {
  const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const sizeClass = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-base" }[size];
  return (
    <div className={`${sizeClass} rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}
