// ============================================================
// app/pages/attendance/index.tsx
// ============================================================
import { useState, useMemo } from "react";
import { Link, useSearchParams, useNavigation } from "react-router";
import type { Route } from "./+types/index";
import api from "~/lib/api"; 

// ── Types ─────────────────────────────────────────────────────
interface WeeklyDay {
  day: string;
  pct: number;
}

type AttStatus = "present" | "absent" | "late" | "holiday" | "unmarked";

// ── Loader ────────────────────────────────────────────────────
export async function clientLoader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const classesRes = await api.classes.list({ per_page: 100 });
  const classes = classesRes.data || [];
  
  const classIdParam = url.searchParams.get("class_id");
  const classId = classIdParam ? Number(classIdParam) : classes[0]?.id;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [statsRes, lowRes, historyRes] = await Promise.all([
    api.attendance.stats(),
    api.attendance.low(),
    classId ? api.attendance.list({ class_id: classId, month, per_page: 1000 }) : { data: { data: [] } }
  ]);

  const weekly: WeeklyDay[] = (statsRes.data?.weekly_trend || []).map((w: any) => ({
    day: w.day,
    pct: w.rate,
  }));

  return {
    stats: statsRes.data,
    classes,
    low: lowRes.data,
    history: historyRes.data?.data || [],
    weekly,
    classId,
    month,
    year
  };
}

// ── Constants ─────────────────────────────────────────────────
const STATUS_CONFIG: Record<AttStatus, { bg: string; label: string }> = {
  present:  { bg: "bg-emerald-500/20 text-emerald-400", label: "P" },
  absent:   { bg: "bg-red-500/20 text-red-400",         label: "A" },
  late:     { bg: "bg-amber-500/20 text-amber-400",     label: "L" },
  holiday:  { bg: "bg-slate-700 text-slate-300",        label: "H" },
  unmarked: { bg: "bg-slate-800/50 text-slate-600 border border-slate-700/50", label: "-" },
};

// ── Helpers ───────────────────────────────────────────────────
function trendColor(pct: number) {
  if (pct >= 95) return { bar: "bg-emerald-400", text: "text-emerald-400" };
  if (pct >= 90) return { bar: "bg-amber-400",   text: "text-amber-400"   };
  return              { bar: "bg-red-400",       text: "text-red-400"     };
}

// ── Component ─────────────────────────────────────────────────
export default function AttendancePage({ loaderData }: Route.ComponentProps) {
  const { stats, classes, low, weekly, history, classId, month, year } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  function setParam(key: string, value: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else       next.delete(key);
      return next;
    });
  }

  // Derive class calendar for the current month based on real data
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
      const dayRecords = history.filter((r: any) => r.date.startsWith(dateStr));
      
      if (dayRecords.length === 0) return "unmarked" as AttStatus;
      
      // Determine overall class status for the day (Simplified logic)
      if (dayRecords.some((r: any) => r.status === "holiday")) return "holiday" as AttStatus;
      
      // Calculate majority presence
      const presentCount = dayRecords.filter((r: any) => r.status === "present" || r.status === "late").length;
      return (presentCount / dayRecords.length) >= 0.5 ? "present" as AttStatus : "absent" as AttStatus;
    });
  }, [history, year, month]);

  const weeklyData = weekly.length > 0 ? weekly : [];
  const lowList    = Array.isArray(low) ? low : [];
  const monthLabel = new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className={isLoading ? "opacity-60 pointer-events-none transition-opacity" : ""}>

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">✅ Attendance Tracker</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real-time attendance monitoring and reporting</p>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition"
            onClick={() => window.open(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/attendance/export?class_id=${classId || classes?.[0]?.id || ""}&month=${month}&year=${year}`, "_blank")}
          >
            📊 Export
          </button>
          <Link
            to={`/attendance/mark${classId ? `?class_id=${classId}` : ''}`}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition"
          >
            📝 Mark Attendance
          </Link>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { icon: "🟢", label: "Present today",  val: stats?.present_today ?? 0, color: "text-emerald-400" },
          { icon: "🔴", label: "Absent today",   val: stats?.absent_today  ?? 0, color: "text-red-400"     },
          { icon: "🟡", label: "Late arrivals",  val: stats?.late_today    ?? 0, color: "text-amber-400"   },
          { icon: "📊", label: "Overall rate",   val: `${stats?.overall_rate ?? 0}%`, color: "text-blue-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main panels ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-5">

        {/* ── Dot grid calendar ───────────────────────── */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">📅 {monthLabel}</h3>
            <select
              value={classId || ""}
              onChange={e => setParam("class_id", e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500 transition"
            >
              {classes?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            {(["present", "absent", "late", "holiday"] as AttStatus[]).map((k) => (
              <span key={k} className={`text-xs px-2 py-0.5 rounded ${STATUS_CONFIG[k].bg}`}>
                {STATUS_CONFIG[k].label} = {k}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-10">
            {calendarDays.map((status, i) => {
              const cfg = STATUS_CONFIG[status];
              return (
                <div
                  key={i}
                  title={`Day ${i + 1}: ${status}`}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-110 transition-transform ${cfg.bg}`}
                >
                  {cfg.label}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-700">
            {(["present","absent","late","holiday"] as AttStatus[]).map(s => {
              const count = calendarDays.filter(x => x === s).length;
              const cfg   = STATUS_CONFIG[s];
              return (
                <div key={s} className="text-center">
                  <div className={`text-sm font-bold ${cfg.bg.split(" ")[1]}`}>{count}</div>
                  <div className="text-xs text-slate-500 capitalize">{s}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Trend + low alerts ──────────────────────── */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col">
          <h3 className="text-sm font-semibold mb-4">📈 Weekly Trend</h3>
          <div className="space-y-3 mb-6">
            {weeklyData.map(d => {
              const c = trendColor(d.pct);
              return (
                <div key={d.day}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{d.day}</span>
                    <span className={`font-mono font-semibold ${c.text}`}>{d.pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${c.bar}`}
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <h3 className="text-sm font-semibold mb-3">🚨 Low Attendance Alerts</h3>
          <div className="space-y-2 flex-1">
            {lowList.length > 0 ? (
              lowList.slice(0, 5).map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2.5 bg-red-500/5 border border-red-500/15 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.class}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-red-400">{s.percentage}%</span>
                    <Link
                      to={`/students/${s.id}`}
                      className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded-lg hover:bg-slate-600 transition"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-slate-400 text-sm">No low attendance alerts!</p>
                <p className="text-slate-600 text-xs mt-1">All students are on track.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}