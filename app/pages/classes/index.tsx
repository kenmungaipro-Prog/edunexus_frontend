// ============================================================
// app/pages/classes/index.tsx
// ============================================================
import { Link, Form, useSearchParams, useNavigation } from "react-router";
import type { Route } from "./+types/index";
import { api, type ValidationError, type ClassRoom as ApiClassRoom } from "~/lib/api";

interface ClassRoom extends ApiClassRoom {
  students_count: number;
  class_teacher: { user: { name: string } } | null;
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
  "border-blue-500",
  "border-emerald-500",
  "border-amber-500",
  "border-violet-500",
  "border-rose-500",
  "border-cyan-500",
  "border-orange-500",
  "border-pink-500",
];

const GRADES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

function occupancyColor(pct: number) {
  if (pct >= 95) return { bar: "bg-red-400",   text: "text-red-400"   };
  if (pct >= 75) return { bar: "bg-amber-400", text: "text-amber-400" };
  return              { bar: "bg-emerald-400", text: "text-emerald-400" };
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
    <div className={`p-4 sm:p-6 max-w-7xl mx-auto ${isLoading ? "opacity-60 pointer-events-none transition-opacity" : ""}`}>

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">📚 Class Management</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">All classes, sections and academic structure</p>
        </div>
        <Link
          to="/classes/new"
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition text-center shadow-lg shadow-blue-500/20"
        >
          ➕ Add Class
        </Link>
      </div>

      {/* ── Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { icon: "📚", val: meta.total,          label: "Total classes",   color: "text-blue-400"    },
          { icon: "✅", val: meta.active,          label: "Active classes",  color: "text-emerald-400" },
          { icon: "🔴", val: meta.full,            label: "At capacity",     color: "text-red-400"     },
          { icon: "📊", val: `${meta.avg_occupancy}%`, label: "Avg occupancy", color: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-xl p-3.5 sm:p-4 flex items-center gap-3">
            <span className="text-xl sm:text-2xl flex-shrink-0">{s.icon}</span>
            <div className="min-w-0">
              <div className={`text-lg sm:text-xl font-bold truncate ${s.color}`}>{s.val}</div>
              <div className="text-xs text-slate-400 truncate">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500 transition w-full sm:w-64"
          placeholder="🔍 Search classes..."
          defaultValue={search}
          onChange={e => setParam("search", e.target.value)}
        />
        <div className="grid grid-cols-2 sm:flex gap-3">
          <select
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500 transition flex-1 sm:w-auto"
            value={grade}
            onChange={e => setParam("grade", e.target.value)}
          >
            <option value="">All grades</option>
            {GRADES.map(g => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
          <select
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500 transition flex-1 sm:w-auto"
            value={sort}
            onChange={e => setParam("sort", e.target.value)}
          >
            <option value="grade">Sort: Grade</option>
            <option value="name">Sort: Name</option>
            <option value="occupancy">Sort: Occupancy</option>
            <option value="students_count">Sort: Students</option>
          </select>
        </div>
      </div>

      {/* ── Empty state ─────────────────────────────────── */}
      {classes.length === 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl py-16 text-center px-4">
          <p className="text-3xl mb-3">🏫</p>
          <p className="text-slate-400 text-sm">No classes found.</p>
          <p className="text-slate-600 text-xs mt-1">Try adjusting your filters or add a new class.</p>
        </div>
      )}

      {/* ── Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {classes.map((c, i) => {
          const pct    = c.capacity > 0 ? Math.round((c.students_count / c.capacity) * 100) : 0;
          const colors = occupancyColor(pct);
          const accent = GRADE_ACCENT[i % GRADE_ACCENT.length];

          return (
            <div
              key={c.id}
              className={`bg-slate-800 border border-slate-700 border-t-2 ${accent} rounded-xl p-4 sm:p-5 hover:-translate-y-1 transition-transform flex flex-col`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-slate-100 truncate">{c.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {c.room ? `Room ${c.room}` : "No room assigned"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Link
                    to={`/classes/${c.id}/edit`}
                    className="w-7 h-7 flex items-center justify-center bg-slate-700 text-slate-400 text-xs rounded-lg hover:bg-slate-600 hover:text-slate-200 transition"
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
                      className="w-7 h-7 flex items-center justify-center bg-slate-700 text-slate-500 text-xs rounded-lg hover:bg-red-500/15 hover:text-red-400 transition"
                      onClick={e => { if (!confirm(`Delete class "${c.name}"? This cannot be undone.`)) e.preventDefault(); }}
                    >
                      ✕
                    </button>
                  </Form>
                </div>
              </div>

              {/* Student / capacity counters */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-900/60 rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-slate-100">{c.students_count}</div>
                  <div className="text-xs text-slate-500">Students</div>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-slate-100">{c.capacity}</div>
                  <div className="text-xs text-slate-500">Capacity</div>
                </div>
              </div>

              {/* Occupancy bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Occupancy</span>
                  <span className={colors.text}>{pct}%</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Class teacher */}
              <p className="text-xs text-slate-400 mb-4 flex-1 truncate">
                🧑‍🏫 {c.class_teacher?.user?.name ?? (
                  <span className="text-slate-600 italic">No class teacher</span>
                )}
              </p>

              {/* Footer actions */}
              <div className="flex gap-2">
                <Link
                  to={`/classes/${c.id}`}
                  className="flex-1 text-center py-2 bg-slate-700 text-slate-300 text-xs rounded-lg hover:bg-slate-600 transition"
                >
                  👁 View
                </Link>
                <Link
                  to={`/students?class_id=${c.id}`}
                  className="flex-1 text-center py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs rounded-lg hover:bg-blue-500/20 transition"
                >
                  👥 Students
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}