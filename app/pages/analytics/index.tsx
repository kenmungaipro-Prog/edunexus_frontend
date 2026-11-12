// ============================================================
// app/pages/analytics/index.tsx
// ============================================================
import type { Route as AnalyticsRoute } from "./+types/index";
import { analytics } from "~/lib/api";

// ============================================================
// Loader — fetch all analytics data in parallel
// ============================================================
export async function clientLoader() {
  const [overviewRes, gradesRes, attendanceRes, feesRes, examsRes] = await Promise.allSettled([
    analytics.overview(),
    analytics.gradePerformance(),
    analytics.attendanceTrend(),
    analytics.feeAnalytics(),
    analytics.examPerformance(),
  ]);

  const errorMessage = (result: PromiseSettledResult<unknown>, section: string) => {
    if (result.status === "fulfilled") return null;
    console.error(`Unable to load ${section} analytics:`, result.reason);
    return `${section} analytics could not be loaded.`;
  };

  return {
    overview:   overviewRes.status   === "fulfilled" ? overviewRes.value.data   : null,
    grades:     gradesRes.status     === "fulfilled" ? gradesRes.value.data     : [],
    attendance: attendanceRes.status === "fulfilled" ? attendanceRes.value.data : [],
    fees:       feesRes.status       === "fulfilled" ? feesRes.value.data       : null,
    exams:      examsRes.status      === "fulfilled" ? examsRes.value.data      : null,
    errors: {
      overview: errorMessage(overviewRes, "Overview"),
      grades: errorMessage(gradesRes, "Grade performance"),
      attendance: errorMessage(attendanceRes, "Attendance"),
      fees: errorMessage(feesRes, "Fee"),
      exams: errorMessage(examsRes, "Exam"),
    },
  };
}

// ============================================================
// Types
// ============================================================
interface OverviewData {
  avg_attendance: number;
  pass_rate: number;
  fee_collection: number;
}

interface GradeRow {
  class: string;
  students: number;
  avg: number | null;
}

interface AttendanceMonth {
  month: string;
  rate: number | null;
}

interface FeeByType {
  name?: string;
  type?: string;
  collected: number;
  rate?: number;
}

interface FeeData {
  total_budget?: number;
  total_collected?: number;
  by_type: FeeByType[];
  by_month: Array<{ month: string; collected: number }>;
  totals: { paid: number; pending: number; overdue: number };
}

interface ExamGradeDist {
  grade: string;
  count: number;
  pct: number;
  color: string;
}

interface ExamSubject {
  name: string;
  avg: number;
  pass: number;
}

interface ExamData {
  stats: { total: number; upcoming: number; ongoing: number; completed: number };
  grades: ExamGradeDist[];
  subjects: ExamSubject[];
}

interface LoaderData {
  overview: OverviewData | null;
  grades: GradeRow[];
  attendance: AttendanceMonth[];
  fees: FeeData | null;
  exams: ExamData | null;
  errors: Record<string, string | null>;
}

// ============================================================
// Helpers
// ============================================================
function fmt(n: number | undefined | null, decimals = 1): string {
  if (n == null || isNaN(Number(n))) return "—";
  return Number(n).toFixed(decimals);
}

const formatKES = (value: number | null | undefined) =>
  `KES ${Number(value || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

function barColor(rate: number | null): string {
  if (rate === null) return "linear-gradient(180deg,#64748b,rgba(100,116,139,0.25))";
  if (rate >= 95) return "linear-gradient(180deg,#34d399,rgba(52,211,153,0.25))";
  if (rate >= 90) return "linear-gradient(180deg,#fbbf24,rgba(251,191,36,0.25))";
  return "linear-gradient(180deg,#f87171,rgba(248,113,113,0.25))";
}

const FEE_PALETTE = ["#4f8ef7", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

// ============================================================
// Page Component
// ============================================================
export default function AnalyticsPage({ loaderData }: AnalyticsRoute.ComponentProps) {
  const { overview, grades, attendance, fees, exams, errors } = loaderData as LoaderData;

  // ── KPI cards ─────────────────────────────────────────────
  const kpis = [
    {
      label: "Avg Attendance",
      val:   overview?.avg_attendance == null ? "—" : `${fmt(overview.avg_attendance)}%`,
      color: "text-blue-400",
      ring:  "ring-blue-500/20",
      bg:    "from-blue-500/10",
      note:  "This month",
      icon:  "👥",
    },
    {
      label: "Pass Rate",
      val:   overview?.pass_rate == null ? "—" : `${fmt(overview.pass_rate)}%`,
      color: "text-emerald-400",
      ring:  "ring-emerald-500/20",
      bg:    "from-emerald-500/10",
      note:  "All recorded grades",
      icon:  "✅",
    },
    {
      label: "Fee Collection",
      val:   overview?.fee_collection == null ? "—" : `${fmt(overview.fee_collection)}%`,
      color: "text-amber-400",
      ring:  "ring-amber-500/20",
      bg:    "from-amber-500/10",
      note:  "This year",
      icon:  "💰",
    },
  ];

  // ── Grade performance rows ────────────────────────────────
  const gradeRows: GradeRow[] = grades;

  // ── Attendance months ─────────────────────────────────────
  const attMonths: AttendanceMonth[] = attendance;

  // ── Fee by type ───────────────────────────────────────────
  const feeByType: FeeByType[] = fees?.by_type ?? [];

  // ── Exam stats ────────────────────────────────────────────
  const examStats = exams?.stats ?? { total: "—", upcoming: "—", ongoing: "—", completed: "—" };

  // ── Exam grade distribution ───────────────────────────────
  const examGrades: ExamGradeDist[] = exams?.grades ?? [];

  // ── Subject performance ───────────────────────────────────
  const subjects: ExamSubject[] = exams?.subjects ?? [];

  // ── Fee donut arcs ─────────────────────────────────────────
  const feeTotal = feeByType.reduce((sum, f) => sum + (f.collected ?? 0), 0);
  let arcOffset = 0;
  const CIRC = 238; // 2π×38
  const arcs = feeTotal > 0 ? feeByType.slice(0, 6).map((f, i) => {
    const pct  = f.collected / feeTotal;
    const dash = pct * CIRC;
    const arc  = { color: FEE_PALETTE[i], dash, offset: -arcOffset + 60 };
    arcOffset += dash;
    return arc;
  }) : [];

  const collectionRate = fmt(overview?.fee_collection);

  return (
    <div className="min-h-screen pb-8">
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-1 text-slate-100 flex items-center gap-2">
          <span className="text-blue-400">◈</span> Advanced Analytics
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm">Comprehensive insights across all school metrics</p>
      </div>

      {/* ── KPI Strip ── */}
      {Object.values(errors).some(Boolean) && (
        <div role="alert" className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Some analytics could not be loaded. {Object.values(errors).filter(Boolean).join(" ")}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {kpis.map(k => (
          <div
            key={k.label}
            className={`bg-gradient-to-br ${k.bg} to-transparent bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5 ring-1 ${k.ring}`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-base sm:text-lg">{k.icon}</span>
              <span className="text-[10px] sm:text-xs text-slate-500 bg-slate-700/60 px-2 py-0.5 rounded-full">{k.note}</span>
            </div>
            <div className={`text-xl sm:text-2xl font-bold mb-0.5 ${k.color} font-mono tracking-tight`}>{k.val}</div>
            <div className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Exam Status Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Exams",    val: examStats.total,     color: "text-slate-300",   bg: "bg-slate-700/40"  },
          { label: "Upcoming",       val: examStats.upcoming,  color: "text-blue-400",    bg: "bg-blue-500/10"   },
          { label: "Ongoing",        val: examStats.ongoing,   color: "text-amber-400",   bg: "bg-amber-500/10"  },
          { label: "Completed",      val: examStats.completed, color: "text-emerald-400", bg: "bg-emerald-500/10"},
        ].map(e => (
          <div key={e.label} className={`${e.bg} border border-slate-700/60 rounded-lg px-3 sm:px-4 py-3 flex items-center gap-3`}>
            <div>
              <div className={`text-lg sm:text-xl font-bold font-mono ${e.color}`}>{e.val}</div>
              <div className="text-[11px] sm:text-xs text-slate-500">{e.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Grade Performance bars */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5">
          <h3 className="text-sm font-semibold mb-5 flex items-center gap-2 text-slate-200">
            <span>📊</span> Performance by Class
          </h3>
          {gradeRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              {errors.grades ?? "No class grade data available."}
            </p>
          ) : <div className="space-y-3">
            {gradeRows.map(g => (
              <div key={g.class} className="flex items-center gap-3">
                <div className="text-xs text-slate-400 w-16 sm:w-20 flex-shrink-0 font-mono">{g.class}</div>
                <div className="flex-1 h-7 bg-slate-900/60 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg flex items-center px-3 transition-all duration-700"
                    style={{
                      width: `${g.avg == null ? 0 : Math.min(g.avg, 100)}%`,
                      background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                    }}
                  >
                    <span className="text-xs font-semibold text-white font-mono">{fmt(g.avg)}%</span>
                  </div>
                </div>
                <span className="text-xs text-slate-500 w-12 text-right">{g.students} students</span>
              </div>
            ))}
          </div>}
        </div>

        {/* Monthly Attendance Trend */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-slate-200">
            <span>📅</span> Monthly Attendance Trend
          </h3>
          <div className="flex items-end gap-1 sm:gap-1.5 h-32">
            {attMonths.map(m => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t transition-all hover:brightness-125 cursor-pointer"
                  style={{
                    height: `${m.rate == null ? 0 : m.rate}%`,
                    background: barColor(m.rate),
                  }}
                  title={`${m.month}: ${m.rate == null ? "No records" : `${m.rate}%`}`}
                />
                <span className="text-[10px] text-slate-500 font-mono">{m.month}</span>
              </div>
            ))}
          </div>
          {!attMonths.some((month) => month.rate !== null) && (
            <p className="mt-3 text-center text-xs text-slate-500">
              {errors.attendance ?? "No attendance records for this year."}
            </p>
          )}
          <div className="flex flex-wrap gap-3 mt-3 justify-end text-[11px] sm:text-xs">
            {[["≥95%","text-emerald-400"],["90–95%","text-amber-400"],["<90%","text-red-400"]].map(([l,c]) => (
              <span key={l} className={c}>● {l}</span>
            ))}
          </div>
        </div>

        {/* Fee Collection Donut */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-slate-200">
            <span>💰</span> Fee Collection by Type
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <svg viewBox="0 0 100 100" className="w-28 h-28 flex-shrink-0">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#1e2640" strokeWidth="16"/>
              {arcs.map((a, i) => (
                <circle
                  key={i} cx="50" cy="50" r="38" fill="none"
                  stroke={a.color} strokeWidth="16"
                  strokeDasharray={`${a.dash} ${CIRC - a.dash}`}
                  strokeDashoffset={a.offset}
                  transform="rotate(-90 50 50)"
                />
              ))}
              <text x="50" y="53" textAnchor="middle" fill="#e8edf8" fontSize="10" fontWeight="700" fontFamily="monospace">
                {collectionRate}%
              </text>
            </svg>
            <div className="space-y-2.5 w-full sm:flex-1">
              {feeByType.length > 0 ? feeByType.slice(0, 6).map((f, i) => {
                const label = f.name ?? f.type ?? `Type ${i + 1}`;
                return (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: FEE_PALETTE[i] }}/>
                    <span className="text-slate-400 flex-1 truncate">{label}</span>
                    <span className="font-mono font-semibold" style={{ color: FEE_PALETTE[i] }}>{formatKES(f.collected)}</span>
                  </div>
                );
              }) : <p className="text-sm text-slate-500">{errors.fees ?? "No fee types available."}</p>}
            </div>
          </div>
        </div>

        {/* Subject Performance Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-slate-200">
            <span>🏆</span> Subject Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {["#", "Subject", "Avg Score", "Pass Rate"].map(h => (
                    <th key={h} className="text-left py-2 text-xs text-slate-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subjects.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-sm text-slate-500">{errors.exams ?? "No subject grade data available."}</td></tr>
                ) : subjects
                  .slice()
                  .sort((a, b) => b.avg - a.avg)
                  .map((s, idx) => (
                    <tr key={s.name} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                      <td className="py-2.5 font-bold text-slate-500 w-6">{idx + 1}</td>
                      <td className="py-2.5 text-slate-300 truncate max-w-[120px] sm:max-w-none">{s.name}</td>
                      <td className="py-2.5 font-mono text-blue-400">{fmt(s.avg)}%</td>
                      <td className="py-2.5 font-semibold text-emerald-400">{fmt(s.pass, 0)}%</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grade Distribution (from exam data) */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5">
          <h3 className="text-sm font-semibold mb-5 flex items-center gap-2 text-slate-200">
            <span>🎓</span> Grade Distribution
          </h3>
          {examGrades.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              {errors.exams ?? "No exam grade distribution available."}
            </p>
          ) : <div className="space-y-3">
            {examGrades.map(g => {
              const colorMap: Record<string, string> = {
                "bg-emerald-400": "#34d399",
                "bg-blue-400":    "#60a5fa",
                "bg-amber-400":   "#fbbf24",
                "bg-orange-400":  "#fb923c",
                "bg-red-400":     "#f87171",
              };
              const hex = colorMap[g.color] ?? "#94a3b8";
              return (
                <div key={g.grade} className="flex items-center gap-3">
                  <div
                    className="text-xs font-bold w-7 text-center py-0.5 rounded font-mono flex-shrink-0"
                    style={{ color: hex, background: `${hex}22` }}
                  >
                    {g.grade}
                  </div>
                  <div className="flex-1 h-6 bg-slate-900/60 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg flex items-center px-2 transition-all duration-700"
                      style={{ width: `${g.pct}%`, background: hex }}
                    >
                      {g.pct >= 8 && (
                        <span className="text-xs font-semibold text-slate-900 font-mono">{g.pct}%</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 w-16 text-right font-mono">{g.count} students</span>
                </div>
              );
            })}
          </div>}
        </div>

        {/* Monthly Fee Collection bars */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-slate-200">
            <span>📈</span> Monthly Fee Collection
          </h3>
          {fees?.by_month?.length && fees.by_month.some((month) => month.collected > 0) ? (
            <>
              <div className="flex items-end gap-1 sm:gap-1.5 h-32">
                {fees.by_month.map((m) => {
                  const maxVal = Math.max(...fees.by_month.map(x => x.collected), 1);
                  const heightPct = (m.collected / maxVal) * 100;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t transition-all hover:brightness-125 cursor-pointer"
                        style={{
                          height: `${heightPct}%`,
                          background: "linear-gradient(180deg,#4f8ef7,rgba(79,142,247,0.25))",
                        }}
                        title={`${m.month}: ${formatKES(m.collected)}`}
                      />
                      <span className="text-[10px] text-slate-500 font-mono">{m.month}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-3 text-right">
                Total collected: {formatKES(fees.by_month.reduce((s, m) => s + m.collected, 0))}
              </p>
            </>
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-600 text-sm">
              {errors.fees ?? "No collection data available"}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}