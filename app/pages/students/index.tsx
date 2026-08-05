import { useState, useCallback, useEffect } from "react";
import {
  Link,
  Form,
  useSearchParams,
  useNavigation,
  useSubmit,
} from "react-router";
import type { Route } from "./+types/index";
import {
  api,
  type Student,
  type ClassRoom,
  type PaginationMeta,
  type StudentFilters,
  type StudentStats,
  type ValidationError,
} from "~/lib/api";

// --- Loaders & Actions ---

export async function clientLoader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const filters: StudentFilters = {
    page:     Number(url.searchParams.get("page")     ?? 1),
    per_page: Number(url.searchParams.get("per_page") ?? 20),
    search:   url.searchParams.get("search")   ?? undefined,
    class_id: url.searchParams.get("class_id") ? Number(url.searchParams.get("class_id")) : undefined,
    status:   url.searchParams.get("status")   ?? undefined,
    gender:   url.searchParams.get("gender")   ?? undefined,
    sort_by:  url.searchParams.get("sort_by")  ?? "first_name",
    sort_dir: (url.searchParams.get("sort_dir") as "asc" | "desc") ?? "asc",
  };

  const [studentsRes, classesRes, statsRes] = await Promise.all([
    api.students.list(filters),
    api.classes.list({ per_page: 100 }),
    api.students.stats(),
  ]);

  return {
    students: studentsRes.data.data,
    meta:     studentsRes.data.meta,
    classes:  classesRes.data as ClassRoom[],
    stats:    statsRes.data,
    filters,
  };
}

export async function clientAction({ request }: Route.ActionArgs) {
  const form   = await request.formData();
  const intent = form.get("intent") as string;

  try {
    if (intent === "delete") {
      const id = Number(form.get("id"));
      await api.students.delete(id);
      return { ok: true, message: "Student removed successfully." };
    }

    if (intent === "bulk-delete") {
      const ids = form.getAll("ids").map(Number);
      await Promise.all(ids.map((id) => api.students.delete(id)));
      return { ok: true, message: `${ids.length} student(s) removed.` };
    }

    if (intent === "bulk-status") {
      const ids    = form.getAll("ids").map(Number);
      const status = form.get("status") as Student["status"];
      await Promise.all(ids.map((id) => api.students.update(id, { status })));
      return { ok: true, message: `${ids.length} student(s) updated to "${status}".` };
    }
  } catch (err) {
    const e = err as ValidationError;
    return { ok: false, message: e?.message ?? "Operation failed." };
  }

  return { ok: false, message: "Unknown action." };
}

// --- Helpers & Visual Mappings ---

function initials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
}

const AVATAR_COLORS: Record<string, string> = {
  A:"#4f8ef7",B:"#10b981",C:"#f59e0b",D:"#8b5cf6",E:"#ef4444",
  F:"#6366f1",G:"#14b8a6",H:"#f97316",I:"#4f8ef7",J:"#10b981",
  K:"#f59e0b",L:"#8b5cf6",M:"#ef4444",N:"#6366f1",O:"#14b8a6",
  P:"#f97316",Q:"#4f8ef7",R:"#10b981",S:"#f59e0b",T:"#8b5cf6",
  U:"#ef4444",V:"#6366f1",W:"#14b8a6",X:"#f97316",Y:"#4f8ef7",Z:"#10b981",
};

function avatarColor(name: string) {
  return AVATAR_COLORS[name[0]?.toUpperCase()] ?? "#4f8ef7";
}

const FEE_PILL: Record<string, { cls: string; label: string }> = {
  paid:    { cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Paid" },
  pending: { cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",    label: "Pending" },
  overdue: { cls: "bg-rose-500/10 text-rose-400 border-rose-500/20",       label: "Overdue" },
};

const STATUS_PILL: Record<string, string> = {
  active:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  inactive: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  alumni:   "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
};

// --- Subcomponents ---

function Toast({ message, ok, onDismiss }: { message: string; ok: boolean; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      onClick={onDismiss}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-5 py-3 text-xs font-semibold backdrop-blur-md shadow-2xl cursor-pointer transition-all animate-bounce-in ${
        ok
          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
          : "bg-rose-500/15 border-rose-500/30 text-rose-400"
      }`}
    >
      <span>{ok ? "✅" : "❌"}</span>
      <span>{message}</span>
      <span className="ml-2 text-[10px] opacity-60">✕</span>
    </div>
  );
}

function AttendanceBadge({ pct }: { pct: number }) {
  const color = pct >= 90 ? "bg-emerald-400" : pct >= 75 ? "bg-amber-400" : "bg-rose-400";
  const textColor = pct >= 90 ? "text-emerald-400 bg-emerald-500/10" : pct >= 75 ? "text-amber-400 bg-amber-500/10" : "text-rose-400 bg-rose-500/10";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-12 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold min-w-[38px] text-center ${textColor}`}>
        {pct}%
      </span>
    </div>
  );
}

function StatCard({ label, value, color, bg, icon }: { label: string; value: number; color: string; bg: string; icon: string }) {
  return (
    <div className="bg-[#1a2035] border border-[#2a3350] rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
      <div className={`w-11 h-11 rounded-lg ${bg} flex items-center justify-center text-xl shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className={`text-xl font-bold tracking-tight ${color}`}>{value.toLocaleString()}</div>
        <div className="text-xs text-slate-400 mt-0.5 font-medium">{label}</div>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 max-w-full truncate">
      <span className="truncate">{label}</span>
      <button onClick={onRemove} className="hover:text-blue-200 transition-colors shrink-0">✕</button>
    </span>
  );
}

function Pagination({ meta, onPage }: { meta: PaginationMeta; onPage: (p: number) => void }) {
  const { current_page: cur, last_page: last, total, from, to } = meta;

  const pages: (number | "...")[] = [];
  if (last <= 7) {
    for (let i = 1; i <= last; i++) pages.push(i);
  } else {
    pages.push(1);
    if (cur > 3) pages.push("...");
    for (let i = Math.max(2, cur - 1); i <= Math.min(last - 1, cur + 1); i++) pages.push(i);
    if (cur < last - 2) pages.push("...");
    pages.push(last);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-[#1e2640] gap-3 text-xs text-slate-400">
      <div>
        Showing <strong className="text-slate-200">{from ?? 0}–{to ?? 0}</strong> of{" "}
        <strong className="text-slate-200">{total.toLocaleString()}</strong> students
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <button
          disabled={cur === 1}
          onClick={() => onPage(cur - 1)}
          className="px-3 h-8 rounded-lg border border-[#2a3350] bg-transparent text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1e2640] transition-all"
        >
          ← Prev
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-1 text-slate-600">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`min-w-[32px] h-8 rounded-lg border text-xs font-medium transition-all ${
                p === cur
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-sm font-semibold"
                  : "border-[#2a3350] bg-transparent text-slate-300 hover:bg-[#1e2640]"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          disabled={cur === last}
          onClick={() => onPage(cur + 1)}
          className="px-3 h-8 rounded-lg border border-[#2a3350] bg-transparent text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1e2640] transition-all"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// --- Main Page Component ---

export default function StudentsPage({ loaderData, actionData }: Route.ComponentProps) {
  const { students, meta, classes, filters, stats } = loaderData as {
    students: Student[];
    meta:     PaginationMeta;
    classes:  ClassRoom[];
    stats:    StudentStats;
    filters:  StudentFilters;
  };

  const actionResult = actionData as { ok?: boolean; message?: string } | undefined;

  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const submit     = useSubmit();
  const isLoading  = navigation.state === "loading";

  const [selected, setSelected]             = useState<Set<number>>(new Set());
  const [showBulkMenu, setShowBulkMenu]     = useState(false);
  const [searchDraft, setSearchDraft]       = useState(filters.search ?? "");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile]         = useState<File | null>(null);
  const [importLoading, setImportLoading]   = useState(false);
  const [importMsg, setImportMsg]           = useState<{ ok: boolean; text: string } | null>(null);
  const [toastVisible, setToastVisible]     = useState(true);

  useEffect(() => { setToastVisible(true); }, [actionResult]);

  const setParam = useCallback((key: string, value: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value) next.delete(key); else next.set(key, value);
      next.set("page", "1");
      return next;
    });
  }, [setSearchParams]);

  const goToPage = (page: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(page));
      return next;
    });
  };

  const toggleSort = (field: string) => {
    const sameField = filters.sort_by === field;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("sort_by",  field);
      next.set("sort_dir", sameField && filters.sort_dir === "asc" ? "desc" : "asc");
      next.set("page", "1");
      return next;
    });
  };

  const allSelected  = students.length > 0 && students.every((s) => selected.has(s.id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(students.map((s) => s.id)));
  };

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bulkAction = (intent: string, extra?: Record<string, string>) => {
    const fd = new FormData();
    fd.set("intent", intent);
    selected.forEach((id) => fd.append("ids", String(id)));
    if (extra) Object.entries(extra).forEach(([k, v]) => fd.set(k, v));
    submit(fd, { method: "post" });
    setSelected(new Set());
    setShowBulkMenu(false);
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportMsg(null);
    try {
      const res = await api.students.import(importFile);
      setImportMsg({ ok: true, text: res.message ?? "Import successful." });
      setTimeout(() => { setShowImportModal(false); setImportFile(null); }, 1800);
    } catch (err) {
      const e = err as { message?: string };
      setImportMsg({ ok: false, text: e?.message ?? "Import failed." });
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.students.list({ ...filters, per_page: 10000, page: 1 });
      const rows = res.data.data;
      const header = "Admission No,Name,Class,Gender,Status,Attendance %,Fee Status\n";
      const csv = header + rows.map((st: Student) =>
        [st.admission_no, `"${st.full_name}"`, st.class_room?.name ?? "", st.gender, st.status, st.attendance_percentage, st.fee_status].join(",")
      ).join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `students-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  const hasFilters = !!(filters.search || filters.class_id || filters.status || filters.gender);

  return (
    <div className="w-full text-slate-100 font-sans p-4 sm:p-6 max-w-7xl mx-auto box-border">
      {actionResult?.message && toastVisible && (
        <Toast message={actionResult.message} ok={actionResult.ok ?? false} onDismiss={() => setToastVisible(false)} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            🎓 Student Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage student profiles, academic status, and records</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1e2640] border border-[#2a3350] text-slate-300 hover:bg-[#252f4e] transition-all"
          >
            📤 Import
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1e2640] border border-[#2a3350] text-slate-300 hover:bg-[#252f4e] transition-all"
          >
            📥 Export CSV
          </button>
          <Link
            to="/students/new"
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:opacity-95 transition-all"
          >
            ➕ Add Student
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Students" value={stats.total} color="text-blue-400" bg="bg-blue-500/10" icon="🎓" />
        <StatCard label="Active" value={stats.active} color="text-emerald-400" bg="bg-emerald-500/10" icon="✅" />
        <StatCard label="Fee Overdue" value={stats.fee_overdue} color="text-rose-400" bg="bg-rose-500/10" icon="⚠️" />
        <StatCard label="Low Attendance" value={stats.low_attendance} color="text-amber-400" bg="bg-amber-500/10" icon="📉" />
      </div>

      {/* Main card */}
      <div className="bg-[#1a2035] border border-[#2a3350] rounded-2xl p-4 sm:p-5 shadow-xl w-full box-border overflow-hidden">
        
        {/* Toolbar: Responsive Grid ensuring items fit strictly within container boundaries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 mb-4 w-full">
          
          {/* Search Box */}
          <div className="relative sm:col-span-2 lg:col-span-2 min-w-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">🔍</span>
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setParam("search", searchDraft || null)}
              onBlur={() => setParam("search", searchDraft || null)}
              placeholder="Search name, roll no…"
              className="w-full bg-[#0f1424] border border-[#2a3350] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all box-border"
            />
          </div>

          {/* Class Filter */}
          <div className="min-w-0">
            <select
              value={searchParams.get("class_id") ?? ""}
              onChange={(e) => setParam("class_id", e.target.value || null)}
              className="w-full bg-[#0f1424] border border-[#2a3350] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer box-border truncate"
            >
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Status Filter */}
          <div className="min-w-0">
            <select
              value={searchParams.get("status") ?? ""}
              onChange={(e) => setParam("status", e.target.value || null)}
              className="w-full bg-[#0f1424] border border-[#2a3350] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer box-border truncate"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="alumni">Alumni</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div className="min-w-0">
            <select
              value={searchParams.get("gender") ?? ""}
              onChange={(e) => setParam("gender", e.target.value || null)}
              className="w-full bg-[#0f1424] border border-[#2a3350] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer box-border truncate"
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Pagination limit / Clear button container */}
          <div className="flex items-center gap-2 min-w-0">
            <select
              value={searchParams.get("per_page") ?? "20"}
              onChange={(e) => setParam("per_page", e.target.value)}
              className="w-full bg-[#0f1424] border border-[#2a3350] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer box-border truncate"
            >
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>

            {hasFilters && (
              <button
                onClick={() => { setSearchDraft(""); setSearchParams(new URLSearchParams({ page: "1" })); }}
                className="px-3 py-2 text-xs font-semibold text-slate-400 bg-[#1e2640] hover:text-slate-200 rounded-lg transition-all shrink-0"
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Bulk Action Trigger */}
          {someSelected && (
            <div className="relative col-span-full sm:col-span-1">
              <button
                onClick={() => setShowBulkMenu((v) => !v)}
                className="w-full px-3 py-2 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all flex items-center justify-between gap-1"
              >
                <span>☑️ {selected.size} selected</span>
                <span>▾</span>
              </button>
              {showBulkMenu && (
                <div className="absolute right-0 sm:right-auto left-0 top-full mt-1.5 w-48 bg-[#1a2035] border border-[#2a3350] rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-[#1e2640]">
                  <div className="py-1">
                    {[
                      { label: "Set Active",   fn: () => bulkAction("bulk-status", { status: "active" }) },
                      { label: "Set Inactive", fn: () => bulkAction("bulk-status", { status: "inactive" }) },
                      { label: "Set Alumni",   fn: () => bulkAction("bulk-status", { status: "alumni" }) },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={item.fn}
                        className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-[#1e2640] transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { if (confirm(`Remove ${selected.size} student(s)?`)) bulkAction("bulk-delete"); }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      🗑 Delete Selected
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Active Filter Chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-1.5 mb-4 max-w-full">
            {filters.search && <FilterChip label={`Search: "${filters.search}"`} onRemove={() => { setSearchDraft(""); setParam("search", null); }} />}
            {filters.status && <FilterChip label={`Status: ${filters.status}`} onRemove={() => setParam("status", null)} />}
            {filters.gender && <FilterChip label={`Gender: ${filters.gender}`} onRemove={() => setParam("gender", null)} />}
            {filters.class_id && <FilterChip label={`Class: ${classes.find((c) => c.id === filters.class_id)?.name ?? filters.class_id}`} onRemove={() => setParam("class_id", null)} />}
          </div>
        )}

        {/* Data Table */}
        <div className={`overflow-x-auto transition-opacity duration-200 ${isLoading ? "opacity-50" : "opacity-100"}`}>
          <table className="w-full border-collapse text-xs text-slate-300 min-w-[850px]">
            <thead>
              <tr className="border-b border-[#1e2640] text-slate-400 uppercase text-[11px] font-semibold tracking-wider text-left">
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded accent-blue-500 cursor-pointer"
                  />
                </th>
                {[
                  { key: "first_name",  label: "Student"    },
                  { key: "roll_number", label: "Roll No"    },
                  { key: "class_room",  label: "Class",      sortable: false },
                  { key: "gender",      label: "Gender"     },
                  { key: "attendance",  label: "Attendance", sortable: false },
                  { key: "fee_status",  label: "Fees",       sortable: false },
                  { key: "status",      label: "Status"     },
                  { key: "created_at",  label: "Joined"     },
                  { key: "actions",     label: "",           sortable: false },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable !== false && toggleSort(col.key)}
                    className={`p-3 ${col.sortable !== false ? "cursor-pointer select-none hover:text-slate-200" : ""}`}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable !== false && (
                        <span className="text-slate-500">
                          {filters.sort_by === col.key ? (filters.sort_dir === "asc" ? "↑" : "↓") : "⇅"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141929]">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    <div className="text-3xl mb-2 opacity-50">🎓</div>
                    {hasFilters ? "No students match the current filters." : "No students found. Add your first student to get started."}
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const isChecked  = selected.has(student.id);
                  const color      = avatarColor(student.full_name);
                  const feePill    = FEE_PILL[student.fee_status] ?? FEE_PILL.pending;
                  const statusPill = STATUS_PILL[student.status]  ?? STATUS_PILL.active;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-white/[0.02] transition-colors ${isChecked ? "bg-blue-500/[0.04]" : ""}`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOne(student.id)}
                          className="rounded accent-blue-500 cursor-pointer"
                        />
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border overflow-hidden"
                            style={{ backgroundColor: `${color}20`, borderColor: `${color}40`, color }}
                          >
                            {student.profile_photo ? (
                              <img
                                src={`${import.meta.env.VITE_API_URL}/storage/${student.profile_photo}`}
                                alt={student.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : initials(student.full_name)}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/students/${student.id}`}
                              className="font-medium text-slate-100 hover:text-blue-400 transition-colors block truncate"
                            >
                              {student.full_name}
                            </Link>
                            <span className="text-[11px] text-slate-500 block">{student.admission_no}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-mono text-blue-400">{student.roll_number}</td>

                      <td className="p-3">
                        {student.class_room ? (
                          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap">
                            {student.class_room.name}
                          </span>
                        ) : "—"}
                      </td>

                      <td className="p-3 capitalize">{student.gender}</td>

                      <td className="p-3">
                        <AttendanceBadge pct={student.attendance_percentage} />
                      </td>

                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${feePill.cls}`}>
                          {feePill.label}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border whitespace-nowrap ${statusPill}`}>
                          {student.status}
                        </span>
                      </td>

                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {new Date(student.created_at).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/students/${student.id}`}
                            title="View profile"
                            className="w-7 h-7 rounded-md bg-[#1e2640] border border-[#2a3350] flex items-center justify-center hover:border-blue-500 transition-all text-xs"
                          >
                            👁
                          </Link>
                          <Link
                            to={`/students/${student.id}/edit`}
                            title="Edit student"
                            className="w-7 h-7 rounded-md bg-[#1e2640] border border-[#2a3350] flex items-center justify-center hover:border-amber-500 transition-all text-xs"
                          >
                            ✏️
                          </Link>
                          <Form method="post" className="inline">
                            <input type="hidden" name="intent" value="delete" />
                            <input type="hidden" name="id" value={student.id} />
                            <button
                              type="submit"
                              title="Remove student"
                              onClick={(e) => { if (!confirm(`Remove ${student.full_name}?`)) e.preventDefault(); }}
                              className="w-7 h-7 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center hover:bg-rose-500/20 transition-all text-xs"
                            >
                              🗑
                            </button>
                          </Form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {meta?.last_page > 1 && <Pagination meta={meta} onPage={goToPage} />}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setShowImportModal(false); setImportMsg(null); setImportFile(null); } }}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="bg-[#0f1424] border border-[#2a3350] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">📤 Import Students</h2>
              <button
                onClick={() => { setShowImportModal(false); setImportMsg(null); setImportFile(null); }}
                className="w-7 h-7 rounded-lg bg-[#1e2640] border border-[#2a3350] text-slate-400 hover:text-white transition-all text-xs"
              >
                ✕
              </button>
            </div>

            <label className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer mb-4 transition-all ${
              importFile ? "border-blue-500 bg-blue-500/5" : "border-[#2a3350] hover:border-slate-600"
            }`}>
              <input type="file" accept=".xlsx,.csv,.xls" className="hidden" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} />
              <div className="text-3xl mb-2">{importFile ? "📄" : "📁"}</div>
              {importFile ? (
                <>
                  <div className="font-semibold text-xs text-blue-400">{importFile.name}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{(importFile.size / 1024).toFixed(1)} KB · Click to change</div>
                </>
              ) : (
                <>
                  <div className="font-semibold text-xs text-slate-300">Drop CSV / Excel file here</div>
                  <div className="text-[11px] text-slate-500 mt-1">Supports .xlsx, .csv · Max 5 MB</div>
                </>
              )}
            </label>

            <div className="bg-[#0a0e1a] rounded-lg p-3 mb-4 text-[11px] text-slate-500 leading-relaxed overflow-x-auto">
              <div className="font-bold text-slate-400 mb-1">Required columns:</div>
              <code className="text-blue-400 font-mono break-all">
                first_name, last_name, date_of_birth, gender, class, parent_name, parent_email
              </code>
            </div>

            {importMsg && (
              <div className={`mb-4 p-3 rounded-lg text-xs font-semibold border ${
                importMsg.ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}>
                {importMsg.ok ? "✅" : "❌"} {importMsg.text}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setShowImportModal(false); setImportMsg(null); setImportFile(null); }}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-[#1e2640] border border-[#2a3350] text-slate-300 hover:bg-[#252f4e] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importFile || importLoading}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importLoading ? "Importing…" : "📤 Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}