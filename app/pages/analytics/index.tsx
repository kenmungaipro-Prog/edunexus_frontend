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

  return {
    overview:   overviewRes.status   === "fulfilled" ? overviewRes.value.data   : null,
    grades:     gradesRes.status     === "fulfilled" ? gradesRes.value.data     : [],
    attendance: attendanceRes.status === "fulfilled" ? attendanceRes.value.data : [],
    fees:       feesRes.status       === "fulfilled" ? feesRes.value.data       : null,
    exams:      examsRes.status      === "fulfilled" ? examsRes.value.data      : null,
  };
}

// ============================================================
// Types
// ============================================================
interface OverviewData {
  avg_attendance: number;
  pass_rate: number;
  fee_collection: number;
  teacher_rating: number;
}

interface GradeRow {
  class: string;
  students: number;
  avg: number;
}

interface AttendanceMonth {
  month: string;
  rate: number;
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

function barColor(rate: number): string {
  if (rate >= 95) return "linear-gradient(180deg,#34d399,rgba(52,211,153,0.25))";
  if (rate >= 90) return "linear-gradient(180deg,#fbbf24,rgba(251,191,36,0.25))";
  return "linear-gradient(180deg,#f87171,rgba(248,113,113,0.25))";
}

const FEE_PALETTE = ["#4f8ef7", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

// ============================================================
// Page Component
// ============================================================
export default function AnalyticsPage({ loaderData }: AnalyticsRoute.ComponentProps) {
  const { overview, grades, attendance, fees, exams } = loaderData as LoaderData;

  // ── KPI cards ─────────────────────────────────────────────
  const kpis = [
    {
      label: "Avg Attendance",
      val:   `${fmt(overview?.avg_attendance)}%`,
      color: "text-blue-400",
      ring:  "ring-blue-500/20",
      bg:    "from-blue-500/10",
      note:  "This month",
      icon:  "👥",
    },
    {
      label: "Pass Rate",
      val:   `${fmt(overview?.pass_rate)}%`,
      color: "text-emerald-400",
      ring:  "ring-emerald-500/20",
      bg:    "from-emerald-500/10",
      note:  "Last exams",
      icon:  "✅",
    },
    {
      label: "Fee Collection",
      val:   `${fmt(overview?.fee_collection)}%`,
      color: "text-amber-400",
      ring:  "ring-amber-500/20",
      bg:    "from-amber-500/10",
      note:  "This year",
      icon:  "💰",
    },
    {
      label: "Teacher Rating",
      val:   `${fmt(overview?.teacher_rating)}/5`,
      color: "text-violet-400",
      ring:  "ring-violet-500/20",
      bg:    "from-violet-500/10",
      note:  "Avg score",
      icon:  "⭐",
    },
  ];

  // ── Grade performance rows ────────────────────────────────
  const gradeRows: GradeRow[] = grades?.length
    ? grades
    : [
        { class: "Grade 12", students: 0, avg: 91 },
        { class: "Grade 11", students: 0, avg: 87 },
        { class: "Grade 10", students: 0, avg: 84 },
        { class: "Grade 9",  students: 0, avg: 82 },
        { class: "Grade 8",  students: 0, avg: 79 },
        { class: "Grade 7",  students: 0, avg: 76 },
      ];

  // ── Attendance months ─────────────────────────────────────
  const attMonths: AttendanceMonth[] = attendance?.length
    ? attendance
    : ["J","F","M","A","M","J","J","A","S","O","N","D"].map((m, i) => ({
        month: m,
        rate: [92,94,91,96,93,89,95,97,94,92,96,91][i],
      }));

  // ── Fee by type ───────────────────────────────────────────
  const feeByType: FeeByType[] = fees?.by_type?.length
    ? fees.by_type
    : [
        { name: "Tuition Fee",   collected: 0, rate: 78 },
        { name: "Transport Fee", collected: 0, rate: 62 },
        { name: "Exam Fee",      collected: 0, rate: 91 },
        { name: "Library Fee",   collected: 0, rate: 45 },
      ];

  // ── Exam stats ────────────────────────────────────────────
  const examStats = exams?.stats ?? { total: 0, upcoming: 0, ongoing: 0, completed: 0 };

  // ── Exam grade distribution ───────────────────────────────
  const examGrades: ExamGradeDist[] = exams?.grades?.length
    ? exams.grades
    : [
        { grade: "A+", count: 0, pct: 0, color: "bg-emerald-400" },
        { grade: "A",  count: 0, pct: 0, color: "bg-blue-400"    },
        { grade: "B",  count: 0, pct: 0, color: "bg-amber-400"   },
        { grade: "C",  count: 0, pct: 0, color: "bg-orange-400"  },
        { grade: "F",  count: 0, pct: 0, color: "bg-red-400"     },
      ];

  // ── Subject performance ───────────────────────────────────
  const subjects: ExamSubject[] = exams?.subjects?.length
    ? exams.subjects
    : [
        { name: "Science",     avg: 89.2, pass: 94 },
        { name: "Mathematics", avg: 87.4, pass: 88 },
        { name: "English",     avg: 85.1, pass: 96 },
        { name: "Computer",    avg: 83.8, pass: 91 },
        { name: "Social St.",  avg: 81.2, pass: 89 },
      ];

  // ── Fee donut arcs ─────────────────────────────────────────
  const feeTotal = feeByType.reduce((sum, f) => sum + (f.collected ?? 0), 0) || 1;
  let arcOffset = 0;
  const CIRC = 238; // 2π×38
  const arcs = feeByType.slice(0, 6).map((f, i) => {
    const pct  = feeTotal > 0 ? (f.collected / feeTotal) : (1 / feeByType.length);
    const dash = pct * CIRC;
    const arc  = { color: FEE_PALETTE[i], dash, offset: -arcOffset + 60 };
    arcOffset += dash;
    return arc;
  });

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
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
            <span>📊</span> Performance by Grade
          </h3>
          <div className="space-y-3">
            {gradeRows.map(g => (
              <div key={g.class} className="flex items-center gap-3">
                <div className="text-xs text-slate-400 w-16 sm:w-20 flex-shrink-0 font-mono">{g.class}</div>
                <div className="flex-1 h-7 bg-slate-900/60 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg flex items-center px-3 transition-all duration-700"
                    style={{
                      width: `${Math.min(g.avg, 100)}%`,
                      background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                    }}
                  >
                    <span className="text-xs font-semibold text-white font-mono">{fmt(g.avg)}%</span>
                  </div>
                </div>
                {g.students > 0 && (
                  <span className="text-xs text-slate-500 w-12 text-right">{g.students}st</span>
                )}
              </div>
            ))}
          </div>
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
                    height: `${Math.max(4, (m.rate / 100) * 100)}%`,
                    background: barColor(m.rate),
                  }}
                  title={`${m.month}: ${m.rate}%`}
                />
                <span className="text-[10px] text-slate-500 font-mono">{m.month}</span>
              </div>
            ))}
          </div>
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
              {feeByType.slice(0, 6).map((f, i) => {
                const label = f.name ?? f.type ?? `Type ${i + 1}`;
                return (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: FEE_PALETTE[i] }}/>
                    <span className="text-slate-400 flex-1 truncate">{label}</span>
                    <span className="font-mono font-semibold" style={{ color: FEE_PALETTE[i] }}>{formatKES(f.collected)}</span>
                  </div>
                );
              })}
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
                {subjects
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
          <div className="space-y-3">
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
                      style={{ width: `${Math.max(g.pct, 3)}%`, background: hex }}
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
          </div>
        </div>

        {/* Monthly Fee Collection bars */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-slate-200">
            <span>📈</span> Monthly Fee Collection
          </h3>
          {fees?.by_month?.length ? (
            <>
              <div className="flex items-end gap-1 sm:gap-1.5 h-32">
                {fees.by_month.map((m) => {
                  const maxVal = Math.max(...fees.by_month.map(x => x.collected), 1);
                  const heightPct = Math.max(4, (m.collected / maxVal) * 100);
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
              No collection data available
            </div>
          )}
        </div>

      </div>
    </div>
  );
}