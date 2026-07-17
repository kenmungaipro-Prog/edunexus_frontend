// ============================================================
// app/pages/exams/index.tsx
// ============================================================
import { Link, Form, useSearchParams, useNavigation } from "react-router";
import type { Route } from "./+types/index";
import api from "~/lib/api";

// ── Types ─────────────────────────────────────────────────────
type ExamStatus = "scheduled" | "ongoing" | "completed" | "cancelled";

interface Exam {
  id:            number;
  title:         string;
  exam_date:     string;
  start_time:    string;
  end_time:      string;
  room:          string | null;
  status:        ExamStatus;
  subject:       { name: string } | null;
  class_room:    { name: string } | null;
}

interface GradeRow { 
  grade: string; 
  pct: number; 
  count: number; 
  color: string; 
}

interface SubjectRow { 
  name: string; 
  avg: number; 
  pass: number; 
}

interface LoaderData {
  exams:       Exam[];
  stats:       { total: number; upcoming: number; ongoing: number; completed: number };
  gradeData:   GradeRow[];
  subjectData: SubjectRow[];
  statusParam: string;
}

// ── Loader ────────────────────────────────────────────────────
export async function clientLoader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "";

  // ✅ Fetch both the exam list and the new analytics endpoint
  const [examsRes, analyticsRes] = await Promise.all([
    api.exams.list({
      status: ["scheduled", "ongoing", "completed", "cancelled"].includes(status) 
        ? (status as any) : undefined,
      per_page: 20,
    }),
    api.analytics.examPerformance() // This calls your updated Laravel method
  ]);

  return {
    exams:       examsRes.data.data,
    stats:       analyticsRes.data.stats,
    gradeData:   analyticsRes.data.grades,
    subjectData: analyticsRes.data.subjects,
    statusParam: status,
  };
}

// ── Action ────────────────────────────────────────────────────
export async function clientAction({ request }: Route.ClientActionArgs) {
  const form = await request.formData();
  const id = Number(form.get("id"));
  if (form.get("intent") === "delete" && id) {
    await api.exams.delete(id);
  }
  return null;
}

// ── Component ─────────────────────────────────────────────────
export default function ExamsPage({ loaderData }: Route.ComponentProps) {
  const { exams, stats, gradeData, subjectData, statusParam } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();

  const STATUS_COLORS: Record<string, string> = {
    scheduled: "bg-blue-500/15 text-blue-400",
    ongoing:   "bg-amber-500/15 text-amber-400",
    completed: "bg-emerald-500/15 text-emerald-400",
    cancelled: "bg-red-500/15 text-red-400",
  };

  return (
    <div className={`p-6 transition-opacity ${navigation.state === "loading" ? "opacity-50" : "opacity-100"}`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">📝 Exams</h1>
          <p className="text-slate-400 text-sm">Real-time examination performance and scheduling</p>
        </div>
        <Link to="/exams/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition">
          + Schedule Exam
        </Link>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Exams", val: stats.total, color: "text-slate-100" },
          { label: "Scheduled", val: stats.upcoming, color: "text-blue-400" },
          { label: "Ongoing", val: stats.ongoing, color: "text-amber-400" },
          { label: "Completed", val: stats.completed, color: "text-emerald-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Exam List */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
            <h3 className="font-bold">Exam Schedule</h3>
            <select 
              value={statusParam} 
              onChange={(e) => setSearchParams({ status: e.target.value })}
              className="bg-slate-900 border border-slate-700 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="divide-y divide-slate-700">
            {exams.length > 0 ? exams.map((exam) => (
              <div key={exam.id} className="p-4 flex items-center gap-4 hover:bg-slate-700/30 transition group">
                <div className="text-center min-w-[50px] bg-slate-900 rounded-lg py-2 border border-slate-700">
                  <p className="text-lg font-bold text-blue-400">{new Date(exam.exam_date).getDate()}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">
                    {new Date(exam.exam_date).toLocaleString('en', { month: 'short' })}
                  </p>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-200">{exam.title}</h4>
                  <p className="text-xs text-slate-500">
                    {exam.subject?.name} • {exam.class_room?.name} • {exam.start_time}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase border ${STATUS_COLORS[exam.status] || "bg-slate-700"}`}>
                  {exam.status}
                </span>
                <Link to={`/exams/${exam.id}`} className="p-2 text-slate-500 hover:text-white transition">
                  👁️
                </Link>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-500 italic">No examinations found for this criteria.</div>
            )}
          </div>
        </div>

        {/* Right: Analytics Sidebars */}
        <div className="space-y-6">
          {/* Grade Distribution */}
          <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl">
            <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">Grade Distribution</h4>
            <div className="space-y-4">
              {gradeData.map((g) => (
                <div key={g.grade} className="flex items-center gap-3">
                  <div className="text-xs font-bold text-slate-400 w-6">{g.grade}</div>
                  <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${g.color} transition-all duration-1000`} 
                      style={{ width: `${g.pct}%` }} 
                    />
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 w-8 text-right">{g.pct}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Performance */}
          <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl">
            <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">Subject Performance</h4>
            <div className="space-y-5">
              {subjectData.map((s) => (
                <div key={s.name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">{s.name}</span>
                    <span className="text-slate-500 text-[10px]">avg {s.avg}% · pass {s.pass}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${Number(s.avg) > 75 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${s.avg}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}