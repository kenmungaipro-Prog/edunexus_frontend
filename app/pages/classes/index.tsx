// ============================================================
// app/pages/classes/index.tsx
// ============================================================
import { Link, Form, useSearchParams, useNavigation } from "react-router";
import type { Route } from "./+types/index";
import { api, type ValidationError, type ClassRoom as ApiClassRoom } from "~/lib/api";

interface ClassRoom extends Omit<ApiClassRoom, "class_teacher"> {
  students_count: number;
  class_teacher: ApiClassRoom["class_teacher"];
}

interface LoaderData {
  classes: ClassRoom[];
  meta: {
    total:        number;
    active:       number;
    full:         number;
    avg_occupancy: number;
  };
}

export async function clientLoader({ request }: Route.LoaderArgs) {
  const url    = new URL(request.url);
  const search = url.searchParams.get("search") ?? undefined;
  const grade  = url.searchParams.get("grade")  ?? undefined;
  const sort   = url.searchParams.get("sort")   ?? "grade";

  const res = await api.classes.list({ search, grade, sort, per_page: 100 } as any);
  const classes = (res.data ?? []) as unknown as ClassRoom[];

  const total        = classes.length;
  const full         = classes.filter(c => c.students_count >= c.capacity).length;
  const active       = classes.filter(c => c.students_count > 0).length;
  const avg_occupancy = total > 0
    ? Math.round(classes.reduce((sum, c) => sum + (c.students_count / c.capacity) * 100, 0) / total)
    : 0;

  return { classes, meta: { total, active, full, avg_occupancy } };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const form   = await request.formData();
  const intent = form.get("intent") as string;

  try {
    if (intent === "delete") {
      const id = Number(form.get("id"));
      await api.classes.delete(id);
      return { ok: true, message: "Class deleted successfully." };
    }
  } catch (err) {
    const e = err as ValidationError;
    return { ok: false, message: e?.message ?? "Operation failed." };
  }

  return null;
}

const GRADE_ACCENT = [
  "border-t-blue-500",
  "border-t-emerald-500",
  "border-t-amber-500",
  "border-t-violet-500",
  "border-t-rose-500",
  "border-t-cyan-500",
  "border-t-orange-500",
  "border-t-pink-500",
];

const GRADES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

function occupancyColor(pct: number) {
  if (pct >= 95) return { bar: "bg-red-500",   text: "text-red-400",   badge: "bg-red-500/10 text-red-400 border-red-500/20" };
  if (pct >= 75) return { bar: "bg-amber-500", text: "text-amber-400", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
  return              { bar: "bg-emerald-500", text: "text-emerald-400", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
}

export default function ClassesPage({ loaderData }: Route.ComponentProps) {
  const { classes, meta } = loaderData as LoaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading  = navigation.state === "loading";

  function setParam(key: string, value: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else       next.delete(key);
      return next;
    });
  }

  const search = searchParams.get("search") ?? "";
  const grade  = searchParams.get("grade")  ?? "";
  const sort   = searchParams.get("sort")   ?? "grade";

  return (
    <div className={`p-4 sm:p-8 max-w-7xl mx-auto transition-opacity ${isLoading ? "opacity-60 pointer-events-none" : ""}`}>

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            🏫 Academic Setup
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">Class Management</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Monitor all active sections, capacities, and group configurations.</p>
        </div>
        <Link
          to="/classes/new"
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all text-center shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New Class
        </Link>
      </div>

      {/* ── Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: "📚", val: meta.total,          label: "Total Classes",   color: "text-blue-400",    border: "border-blue-500/20 bg-blue-500/5" },
          { icon: "✅", val: meta.active,          label: "Active Roster",   color: "text-emerald-400", border: "border-emerald-500/20 bg-emerald-500/5" },
          { icon: "🔴", val: meta.full,            label: "At Capacity",     color: "text-red-400",     border: "border-red-500/20 bg-red-500/5" },
          { icon: "📊", val: `${meta.avg_occupancy}%`, label: "Avg Occupancy", color: "text-amber-400",  border: "border-amber-500/20 bg-amber-500/5" },
        ].map(s => (
          <div key={s.label} className={`bg-slate-900/80 backdrop-blur-xl border ${s.border} rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-xl`}>
            <span className="text-2xl sm:text-3xl flex-shrink-0 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner">{s.icon}</span>
            <div className="min-w-0">
              <div className={`text-xl sm:text-2xl font-bold tracking-tight truncate ${s.color}`}>{s.val}</div>
              <div className="text-xs font-medium text-slate-400 truncate mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters Bar ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-3.5 rounded-2xl shadow-xl">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            className="bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all w-full shadow-inner"
            placeholder="Search classes by name or code..."
            defaultValue={search}
            onChange={e => setParam("search", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-3">
          <select
            className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all sm:w-44 shadow-inner"
            value={grade}
            onChange={e => setParam("grade", e.target.value)}
          >
            <option value="">All grades</option>
            {GRADES.map(g => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
          <select
            className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all sm:w-48 shadow-inner"
            value={sort}
            onChange={e => setParam("sort", e.target.value)}
          >
            <option value="grade">Sort: Grade Level</option>
            <option value="name">Sort: Class Name</option>
            <option value="occupancy">Sort: Occupancy</option>
            <option value="students_count">Sort: Student Count</option>
          </select>
        </div>
      </div>

      {/* ── Empty state ─────────────────────────────────── */}
      {classes.length === 0 && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl py-20 text-center px-4 shadow-2xl">
          <div className="w-16 h-16 bg-slate-800 border border-slate-700/80 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">
            🏫
          </div>
          <p className="text-slate-200 font-semibold text-base">No classes found</p>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-sm mx-auto">Try adjusting your active search filters or add a new class section to get started.</p>
        </div>
      )}

      {/* ── Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {classes.map((c, i) => {
          const pct    = c.capacity > 0 ? Math.round((c.students_count / c.capacity) * 100) : 0;
          const colors = occupancyColor(pct);
          const accent = GRADE_ACCENT[i % GRADE_ACCENT.length];

          return (
            <div
              key={c.id}
              className={`bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 border-t-4 ${accent} rounded-2xl p-5 hover:-translate-y-1 transform-gpu transition-all duration-300 flex flex-col shadow-2xl group`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-slate-100 truncate group-hover:text-blue-400 transition-colors">{c.name}</h3>
                  <p className="text-xs font-medium text-slate-400 mt-0.5 truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    {c.room ? `Room ${c.room}` : "No room assigned"}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    to={`/classes/${c.id}/edit`}
                    className="w-8 h-8 flex items-center justify-center bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs rounded-xl hover:bg-slate-700 hover:text-white transition-all shadow-sm"
                    title="Edit class"
                  >
                    ✏️
                  </Link>
                  <Form method="post" className="inline">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="id"     value={c.id}   />
                    <button
                      type="submit"
                      title="Delete class"
                      className="w-8 h-8 flex items-center justify-center bg-slate-800/80 border border-slate-700/60 text-slate-400 text-xs rounded-xl hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition-all shadow-sm"
                      onClick={e => { if (!confirm(`Delete class "${c.name}"? This action cannot be undone.`)) e.preventDefault(); }}
                    >
                      ✕
                    </button>
                  </Form>
                </div>
              </div>

              {/* Student / capacity counters */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 text-center shadow-inner">
                  <div className="text-lg font-extrabold text-slate-100">{c.students_count}</div>
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Students</div>
                </div>
                <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 text-center shadow-inner">
                  <div className="text-lg font-extrabold text-slate-100">{c.capacity}</div>
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Capacity</div>
                </div>
              </div>

              {/* Occupancy bar */}
              <div className="mb-4 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                <div className="flex justify-between text-xs mb-1.5 items-center">
                  <span className="text-slate-400 font-medium">Occupancy</span>
                  <span className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${colors.badge}`}>{pct}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/40">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Class teacher */}
              <div className="text-xs font-medium text-slate-300 mb-5 flex items-center gap-2 truncate">
                <span className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-400">🧑‍🏫</span>
                <span className="truncate">
                  {c.class_teacher?.user?.name ?? (
                    <span className="text-slate-500 italic">No class teacher assigned</span>
                  )}
                </span>
              </div>

              {/* Footer actions */}
              <div className="flex gap-2 mt-auto pt-2 border-t border-slate-800/80">
                <Link
                  to={`/classes/${c.id}`}
                  className="flex-1 text-center py-2.5 bg-slate-800/80 border border-slate-700/60 text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-700 hover:text-white transition-all shadow-sm"
                >
                  View Details
                </Link>
                <Link
                  to={`/students?class_id=${c.id}`}
                  className="flex-1 text-center py-2.5 bg-blue-600/10 text-blue-400 border border-blue-500/20 text-xs font-semibold rounded-xl hover:bg-blue-600/20 transition-all shadow-sm"
                >
                  Roster ({c.students_count})
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}