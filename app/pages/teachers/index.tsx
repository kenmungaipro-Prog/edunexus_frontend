// ============================================================
// app/pages/teachers/index.tsx  — Mobile Responsive
// ============================================================
import { useState, useCallback } from "react";
import {
  Link,
  Form,
  useSearchParams,
  useNavigation,
  useSubmit,
  redirect,
} from "react-router";
import type { Route } from "./+types/index";
import { api, type Teacher, type TeacherFilters, type PaginationMeta, type ValidationError } from "~/lib/api";

const DEPARTMENTS = [
  "Mathematics", "Science", "English", "Social Studies",
  "Computer", "Hindi", "Art", "Physical Education",
];

const DEPT_COLORS: Record<string, string> = {
  "Mathematics":       "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Science":           "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "English":           "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Social Studies":    "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Computer":          "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Hindi":             "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Art":               "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
  "Physical Education":"bg-lime-500/10 text-lime-400 border-lime-500/20",
};

const AVATAR_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-sky-600",
];
const avatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

export async function clientLoader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const filters: TeacherFilters = {
    page:       Number(url.searchParams.get("page") ?? 1),
    per_page:   Number(url.searchParams.get("per_page") ?? 20),
    search:     url.searchParams.get("search") ?? undefined,
    department: url.searchParams.get("department") ?? undefined,
    status:     url.searchParams.get("status") ?? undefined,
    sort_by:    url.searchParams.get("sort_by") ?? "id",
    sort_dir:  (url.searchParams.get("sort_dir") as "asc" | "desc") ?? "asc",
  };
  const teachersRes = await api.teachers.list(filters);
  return {
    teachers: teachersRes.data.data as Teacher[],
    meta:     (teachersRes.data.meta || teachersRes.data) as unknown as PaginationMeta,
    filters,
  };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const form   = await request.formData();
  const intent = form.get("intent") as string;
  try {
    if (intent === "deactivate") {
      await api.teachers.delete(Number(form.get("id")));
      return { ok: true, message: "Teacher deactivated successfully." };
    }
    if (intent === "bulk-deactivate") {
      const ids = form.getAll("ids").map(Number);
      await Promise.all(ids.map((id) => api.teachers.delete(id)));
      return { ok: true, message: `${ids.length} teacher(s) deactivated.` };
    }
  } catch (err) {
    const e = err as ValidationError;
    return { ok: false, message: e?.message ?? "Operation failed." };
  }
  return redirect("/teachers");
}

function Toast({ message, ok }: { message: string; ok: boolean }) {
  return (
    <div className={`
      fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 px-4 sm:px-5 py-3 rounded-2xl text-sm font-semibold
      flex items-center gap-3 shadow-2xl border backdrop-blur-xl max-w-[90vw]
      ${ok
        ? "bg-slate-900/90 border-emerald-500/30 text-emerald-400"
        : "bg-slate-900/90 border-red-500/30 text-red-400"}
    `}
      style={{ animation: "slideUp 0.3s ease-out" }}
    >
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${ok ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
        {ok ? "✓" : "✕"}
      </span>
      <span className="truncate">{message}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: Teacher["status"] }) {
  const map = {
    active:   { cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-400", label: "Active" },
    on_leave: { cls: "bg-amber-500/10 text-amber-400 border-amber-500/25",       dot: "bg-amber-400",   label: "On Leave" },
    inactive: { cls: "bg-slate-700/50 text-slate-500 border-slate-600/40",       dot: "bg-slate-500",   label: "Inactive" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export default function TeachersPage({ loaderData, actionData }: Route.ComponentProps) {
  const { teachers, meta, filters } = loaderData;
  const actionResult = actionData as { ok?: boolean; message?: string } | undefined;

  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const submit     = useSubmit();
  const isLoading  = navigation.state === "loading";

  const [searchDraft, setSearchDraft] = useState(filters.search ?? "");
  const [selected, setSelected]       = useState<Set<number>>(new Set());
  const [hoveredRow, setHoveredRow]   = useState<number | null>(null);

  const setParam = useCallback((key: string, value: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value) next.delete(key); else next.set(key, value);
      next.set("page", "1");
      return next;
    });
  }, [setSearchParams]);

  const goToPage = (page: number) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(page));
      return next;
    });

  const allSelected = teachers.length > 0 && teachers.every((t) => selected.has(t.id));
  const toggleAll   = () => setSelected(allSelected ? new Set() : new Set(teachers.map(t => t.id)));
  const toggleOne   = (id: number) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleBulkDeactivate = () => {
    if (!confirm(`Deactivate ${selected.size} teacher(s)?`)) return;
    const fd = new FormData();
    fd.set("intent", "bulk-deactivate");
    selected.forEach((id) => fd.append("ids", String(id)));
    submit(fd, { method: "post" });
    setSelected(new Set());
  };

  const activeCount   = teachers.filter(t => t.status === "active").length;
  const onLeaveCount  = teachers.filter(t => t.status === "on_leave").length;
  const inactiveCount = teachers.filter(t => t.status === "inactive").length;

  return (
    <div className="text-slate-200 min-h-screen px-3 sm:px-6 pb-12">
      <style>{`
        @keyframes slideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        .row-enter { animation: fadeIn 0.2s ease-out; }
      `}</style>

      {actionResult?.message && (
        <Toast message={actionResult.message} ok={actionResult.ok ?? false} />
      )}

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm shadow-lg shadow-blue-500/20 flex-shrink-0">
              👨‍🏫
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Teacher Management</h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm sm:ml-12">Staff profiles, assignments and performance</p>
        </div>
        <Link
          to="/teachers/new"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-semibold hover:from-blue-400 hover:to-indigo-400 transition-all shadow-lg shadow-blue-500/20"
        >
          <span className="text-base leading-none">+</span>
          Add Teacher
        </Link>
      </div>

      {/* ── Stats row ──────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          {
            label: "Total Staff", val: meta?.total ?? 0,
            sub: `${DEPARTMENTS.length} departments`,
            icon: "👨‍🏫", gradient: "from-blue-500/20 to-indigo-500/10", border: "border-blue-500/15", text: "text-blue-400",
          },
          {
            label: "Active", val: activeCount,
            sub: meta?.total ? `${Math.round(activeCount / (meta.total || 1) * 100)}% of staff` : "—",
            icon: "✅", gradient: "from-emerald-500/20 to-teal-500/10", border: "border-emerald-500/15", text: "text-emerald-400",
          },
          {
            label: "On Leave", val: onLeaveCount,
            sub: "currently absent",
            icon: "🌴", gradient: "from-amber-500/20 to-orange-500/10", border: "border-amber-500/15", text: "text-amber-400",
          },
          {
            label: "Inactive", val: inactiveCount,
            sub: "deactivated accounts",
            icon: "⛔", gradient: "from-slate-500/20 to-slate-600/10", border: "border-slate-600/30", text: "text-slate-400",
          },
        ].map(s => (
          <div key={s.label} className={`relative overflow-hidden bg-gradient-to-br ${s.gradient} border ${s.border} rounded-2xl p-4 sm:p-5`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium mb-1">{s.label}</p>
                <p className={`text-2xl sm:text-3xl font-bold ${s.text}`}>{s.val}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-600 mt-1 truncate">{s.sub}</p>
              </div>
              <span className="text-xl sm:text-2xl opacity-60">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Card ──────────────────────────────────── */}
      <div className="bg-slate-900/50 border border-slate-700/60 rounded-2xl overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 p-4 sm:p-5 border-b border-slate-700/60">
          <div className="relative w-full sm:flex-1 min-w-[200px] sm:max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={searchDraft}
              onChange={e => setSearchDraft(e.target.value)}
              onKeyDown={e => e.key === "Enter" && setParam("search", searchDraft || null)}
              onBlur={() => setParam("search", searchDraft || null)}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/70 focus:bg-slate-800 transition-all"
              placeholder="Search by name, email…"
            />
          </div>

          <select
            value={filters.department ?? ""}
            onChange={e => setParam("department", e.target.value || null)}
            className="w-full sm:w-auto bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-blue-500/70 transition-all cursor-pointer"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={filters.status ?? ""}
            onChange={e => setParam("status", e.target.value || null)}
            className="w-full sm:w-auto bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-blue-500/70 transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>

          {(filters.search || filters.department || filters.status) && (
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              {filters.search && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-400">
                  "{filters.search}"
                  <button onClick={() => { setSearchDraft(""); setParam("search", null); }} className="hover:text-white transition">✕</button>
                </span>
              )}
              {filters.department && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 rounded-lg text-xs text-violet-400">
                  {filters.department}
                  <button onClick={() => setParam("department", null)} className="hover:text-white transition">✕</button>
                </span>
              )}
            </div>
          )}

          {selected.size > 0 && (
            <div className="w-full sm:ml-auto sm:w-auto flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
              <span className="text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                {selected.size} selected
              </span>
              <button
                onClick={handleBulkDeactivate}
                className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium rounded-lg hover:bg-red-500/20 transition"
              >
                Deactivate Selected
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className={`overflow-x-auto transition-opacity duration-300 ${isLoading ? "opacity-40" : "opacity-100"}`}>
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-700/60">
                <th className="py-3 px-4 sm:px-5 w-10 text-left">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    className="w-4 h-4 cursor-pointer accent-blue-500 rounded" />
                </th>
                {["Teacher", "ID", "Department", "Subjects", "Classes", "Exp.", "Status", ""].map(h => (
                  <th key={h} className="text-left py-3 px-3 sm:px-4 text-[11px] text-slate-500 uppercase font-semibold tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.isArray(teachers) && teachers.length > 0 ? (
                teachers.map((t) => {
                  const isChecked = selected.has(t.id);
                  const isHovered = hoveredRow === t.id;
                  const initials = (t.user?.name ?? "T").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
                  const deptKey = t.department ?? "";
                  const deptCls = DEPT_COLORS[deptKey] ?? "bg-slate-700/30 text-slate-400 border-slate-600/30";

                  return (
                    <tr
                      key={t.id}
                      className={`border-b border-slate-800/80 transition-all duration-150 row-enter
                        ${isChecked ? "bg-blue-500/5" : isHovered ? "bg-slate-800/40" : ""}`}
                      onMouseEnter={() => setHoveredRow(t.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <td className="py-3.5 px-4 sm:px-5">
                        <input type="checkbox" checked={isChecked} onChange={() => toggleOne(t.id)}
                          className="w-4 h-4 cursor-pointer accent-blue-500 rounded" />
                      </td>

                      <td className="py-3.5 px-3 sm:px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColor(t.id)} flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm`}>
                            {initials}
                          </div>
                          <div>
                            <Link to={`/teachers/${t.id}`} className="font-semibold text-slate-100 hover:text-blue-400 transition-colors whitespace-nowrap">
                              {t.user?.name}
                            </Link>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[150px] sm:max-w-none">{t.user?.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                        <code className="text-xs text-slate-400 bg-slate-800/60 border border-slate-700/50 px-2 py-0.5 rounded-md font-mono">
                          {t.employee_id}
                        </code>
                      </td>

                      <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                        <span className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium ${deptCls}`}>
                          {t.department}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 sm:px-4 max-w-[160px]">
                        <div className="flex flex-wrap gap-1">
                          {t.subjects?.slice(0, 2).map(s => (
                            <span key={s.name} className="text-[10px] px-1.5 py-0.5 bg-slate-800 border border-slate-700/50 rounded text-slate-400 whitespace-nowrap">
                              {s.name}
                            </span>
                          ))}
                          {(t.subjects?.length ?? 0) > 2 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 border border-slate-700/50 rounded text-slate-500">
                              +{(t.subjects?.length ?? 0) - 2}
                            </span>
                          )}
                          {!t.subjects?.length && <span className="text-slate-600 text-xs">—</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold ${(t.class_rooms?.length ?? 0) > 0 ? "text-slate-200" : "text-slate-600"}`}>
                            {t.class_rooms?.length ?? 0}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                        <span className="text-slate-400 text-xs">{t.experience_yrs} <span className="text-slate-600">yrs</span></span>
                      </td>

                      <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                        <StatusBadge status={t.status} />
                      </td>

                      <td className="py-3.5 px-3 sm:px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/teachers/${t.id}`}
                            title="View Profile"
                            className="w-8 h-8 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-lg hover:border-blue-500/50 hover:text-blue-400 text-slate-400 transition-all text-sm"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          <Link
                            to={`/teachers/${t.id}/edit`}
                            title="Edit"
                            className="w-8 h-8 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-lg hover:border-amber-500/50 hover:text-amber-400 text-slate-400 transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <Form method="post" className="inline">
                            <input type="hidden" name="intent" value="deactivate" />
                            <input type="hidden" name="id" value={t.id} />
                            <button
                              type="submit"
                              title="Deactivate"
                              className="w-8 h-8 flex items-center justify-center bg-red-500/5 border border-red-500/15 text-red-500 rounded-lg hover:bg-red-500/15 hover:border-red-500/30 transition-all"
                              onClick={e => { if (!confirm(`Deactivate ${t.user?.name}?`)) e.preventDefault(); }}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          </Form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-2xl">
                        👨‍🏫
                      </div>
                      <div>
                        <p className="text-slate-300 font-semibold mb-1">No teachers found</p>
                        <p className="text-slate-500 text-xs">Adjust your search or filters</p>
                      </div>
                      {(filters.search || filters.department || filters.status) && (
                        <button
                          onClick={() => setSearchParams(new URLSearchParams())}
                          className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-4 border-t border-slate-700/60">
            <p className="text-xs text-slate-500 text-center sm:text-left">
              Showing <span className="text-slate-300 font-medium">{meta.from}–{meta.to}</span> of{" "}
              <span className="text-slate-300 font-medium">{meta.total}</span> teachers
            </p>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <button
                disabled={meta.current_page === 1}
                onClick={() => goToPage(meta.current_page - 1)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ← Prev
              </button>

              {Array.from({ length: Math.min(meta.last_page, 5) }, (_, i) => {
                const page = meta.last_page <= 5 ? i + 1 :
                  meta.current_page <= 3 ? i + 1 :
                  meta.current_page >= meta.last_page - 2 ? meta.last_page - 4 + i :
                  meta.current_page - 2 + i;
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-8 h-8 text-xs rounded-lg border transition-all ${
                      page === meta.current_page
                        ? "bg-blue-500/20 border-blue-500/40 text-blue-400 font-semibold"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                disabled={meta.current_page === meta.last_page}
                onClick={() => goToPage(meta.current_page + 1)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
