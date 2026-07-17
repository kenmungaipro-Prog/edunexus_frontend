// ============================================================
// app/pages/students/index.tsx
// ============================================================
import { useState, useCallback, useEffect } from "react";
import {
  Link,
  Form,
  useSearchParams,
  useNavigation,
  useSubmit,
} from "react-router";
import type { Route } from "./+types/index";
import api, {
  type Student,
  type ClassRoom,
  type PaginationMeta,
  type StudentFilters,
  type StudentStats,
  type ValidationError,
} from "~/lib/api";

// ============================================================
// Loader
// ============================================================
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
    // FIX: classes.list returns ApiResponse<ClassRoom[]>, so .data is the array
    classes:  classesRes.data as ClassRoom[],
    stats:    statsRes.data,
    filters,
  };
}

// ============================================================
// Action  (delete · bulk-delete · bulk-status)
// ============================================================
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

// ============================================================
// Helpers
// ============================================================
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

const FEE_PILL: Record<string, { bg: string; text: string; label: string }> = {
  paid:    { bg: "rgba(16,185,129,0.12)",  text: "#34d399", label: "Paid"    },
  pending: { bg: "rgba(245,158,11,0.12)",  text: "#fbbf24", label: "Pending" },
  overdue: { bg: "rgba(239,68,68,0.12)",   text: "#f87171", label: "Overdue" },
};

const STATUS_PILL: Record<string, { bg: string; text: string }> = {
  active:   { bg: "rgba(16,185,129,0.12)", text: "#34d399" },
  inactive: { bg: "rgba(239,68,68,0.12)",  text: "#f87171" },
  alumni:   { bg: "rgba(99,102,241,0.12)", text: "#a5b4fc" },
};

// ============================================================
// Sub-components
// ============================================================

function Toast({
  message, ok, onDismiss,
}: { message: string; ok: boolean; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      style={{
        position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
        padding: "12px 20px", borderRadius: "10px",
        fontSize: "13px", fontWeight: 600,
        background: ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
        border: `1px solid ${ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
        color: ok ? "#34d399" : "#f87171",
        backdropFilter: "blur(8px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", gap: "8px",
        cursor: "pointer",
        animation: "slideInToast .25s ease",
      }}
      onClick={onDismiss}
    >
      {ok ? "✅" : "❌"} {message}
      <span style={{ marginLeft: "6px", opacity: 0.5, fontSize: "11px" }}>✕</span>
      <style>{`@keyframes slideInToast { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  );
}

function AttendanceBadge({ pct }: { pct: number }) {
  const color = pct >= 90 ? "#34d399" : pct >= 75 ? "#fbbf24" : "#f87171";
  const bg    = pct >= 90 ? "rgba(16,185,129,0.08)" : pct >= 75 ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: "52px", height: "5px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color, borderRadius: "3px", transition: "width .6s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <span style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color, background: bg, padding: "2px 6px", borderRadius: "6px", minWidth: "40px", textAlign: "center" }}>
        {pct}%
      </span>
    </div>
  );
}

function SortIcon({ field, current, dir }: { field: string; current: string; dir: string }) {
  if (field !== current) return <span style={{ color: "#3a4570", marginLeft: "4px" }}>⇅</span>;
  return <span style={{ color: "#4f8ef7", marginLeft: "4px" }}>{dir === "asc" ? "↑" : "↓"}</span>;
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

  const btnBase: React.CSSProperties = {
    minWidth: "34px", height: "34px", padding: "0 10px",
    borderRadius: "8px", border: "1px solid #2a3350",
    background: "transparent", color: "#a0aec0",
    fontSize: "13px", fontFamily: "'Sora', sans-serif",
    cursor: "pointer", transition: "all .15s",
    display: "flex", alignItems: "center", justifyContent: "center",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #1e2640" }}>
      <span style={{ fontSize: "12px", color: "#6b7a99" }}>
        Showing <strong style={{ color: "#a0aec0" }}>{from}–{to}</strong> of{" "}
        <strong style={{ color: "#a0aec0" }}>{total.toLocaleString()}</strong> students
      </span>
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        <button style={{ ...btnBase, opacity: cur === 1 ? 0.3 : 1 }} disabled={cur === 1} onClick={() => onPage(cur - 1)}>← Prev</button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} style={{ color: "#3a4570", padding: "0 4px" }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              style={{ ...btnBase, background: p === cur ? "linear-gradient(135deg,#4f8ef7,#6366f1)" : "transparent", borderColor: p === cur ? "transparent" : "#2a3350", color: p === cur ? "#fff" : "#a0aec0", fontWeight: p === cur ? 700 : 400 }}
            >
              {p}
            </button>
          )
        )}
        <button style={{ ...btnBase, opacity: cur === last ? 0.3 : 1 }} disabled={cur === last} onClick={() => onPage(cur + 1)}>Next →</button>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{ background: "rgba(79,142,247,0.1)", color: "#60a5fa", border: "1px solid rgba(79,142,247,0.25)", fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
      {label}
      <button onClick={onRemove} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", padding: 0, fontSize: "11px", lineHeight: 1 }}>✕</button>
    </span>
  );
}

function RowIconLink({ to, title, icon, hoverColor }: { to: string; title: string; icon: string; hoverColor: string }) {
  return (
    <Link
      to={to} title={title}
      style={{ width: "30px", height: "30px", background: "#1e2640", border: "1px solid #2a3350", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", textDecoration: "none", transition: "all .15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = hoverColor; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a3350"; }}
    >
      {icon}
    </Link>
  );
}

// ============================================================
// Main component
// ============================================================
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

  // ── Local state ────────────────────────────────────────────
  const [selected,        setSelected]       = useState<Set<number>>(new Set());
  const [showBulkMenu,    setShowBulkMenu]    = useState(false);
  const [searchDraft,     setSearchDraft]     = useState(filters.search ?? "");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile,      setImportFile]      = useState<File | null>(null);
  const [importLoading,   setImportLoading]   = useState(false);
  const [importMsg,       setImportMsg]       = useState<{ ok: boolean; text: string } | null>(null);
  const [toastVisible,    setToastVisible]    = useState(true);

  // Reset toast visibility when actionResult changes
  useEffect(() => { setToastVisible(true); }, [actionResult]);

  // ── URL-param helpers ──────────────────────────────────────
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

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") setParam("search", searchDraft || null);
  };

  // ── Selection ──────────────────────────────────────────────
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

  // ── Bulk action ────────────────────────────────────────────
  const bulkAction = (intent: string, extra?: Record<string, string>) => {
    const fd = new FormData();
    fd.set("intent", intent);
    selected.forEach((id) => fd.append("ids", String(id)));
    if (extra) Object.entries(extra).forEach(([k, v]) => fd.set(k, v));
    submit(fd, { method: "post" });
    setSelected(new Set());
    setShowBulkMenu(false);
  };

  // ── Import ─────────────────────────────────────────────────
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

  // ── Export CSV ─────────────────────────────────────────────
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

  // ── Style tokens ────────────────────────────────────────────
  const s = {
    card: { background: "#1a2035", border: "1px solid #2a3350", borderRadius: "14px", padding: "20px" } as React.CSSProperties,
    btn: (variant: "primary" | "ghost" | "danger") => ({
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "8px 16px", borderRadius: "8px",
      fontSize: "13px", fontWeight: 600,
      cursor: "pointer", border: "none",
      fontFamily: "'Sora', sans-serif",
      transition: "all .15s", whiteSpace: "nowrap",
      ...(variant === "primary"
        ? { background: "linear-gradient(135deg,#4f8ef7,#6366f1)", color: "#fff" }
        : variant === "danger"
        ? { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }
        : { background: "#1e2640", color: "#a0aec0", border: "1px solid #2a3350" }),
    } as React.CSSProperties),
    input: { background: "#0f1424", border: "1px solid #2a3350", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#e8edf8", fontFamily: "'Sora', sans-serif", outline: "none" } as React.CSSProperties,
    select: { background: "#0f1424", border: "1px solid #2a3350", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#e8edf8", fontFamily: "'Sora', sans-serif", outline: "none", cursor: "pointer" } as React.CSSProperties,
    th: { textAlign: "left" as const, padding: "10px 14px", fontSize: "11px", fontWeight: 600, color: "#6b7a99", letterSpacing: ".6px", textTransform: "uppercase" as const, borderBottom: "1px solid #1e2640", userSelect: "none" as const, whiteSpace: "nowrap" as const } as React.CSSProperties,
    td: { padding: "12px 14px", borderBottom: "1px solid #141929", color: "#a0aec0", fontSize: "13px", verticalAlign: "middle" as const } as React.CSSProperties,
  };

  const hasFilters = !!(filters.search || filters.class_id || filters.status || filters.gender);

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", color: "#e8edf8" }}>

      {/* Toast */}
      {actionResult?.message && toastVisible && (
        <Toast message={actionResult.message} ok={actionResult.ok ?? false} onDismiss={() => setToastVisible(false)} />
      )}

      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>🎓 Student Management</h1>
          <p style={{ fontSize: "13px", color: "#6b7a99" }}>Manage student profiles, records and academic data</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button style={s.btn("ghost")} onClick={() => setShowImportModal(true)}>📤 Import</button>
          <button style={s.btn("ghost")} onClick={handleExportCsv}>📥 Export CSV</button>
          <Link to="/students/new" style={{ ...s.btn("primary"), textDecoration: "none" }}>➕ Add Student</Link>
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
        {[
          { label: "Total Students", value: stats.total,          color: "#4f8ef7", bg: "rgba(79,142,247,0.08)",   icon: "🎓" },
          { label: "Active",         value: stats.active,         color: "#34d399", bg: "rgba(16,185,129,0.08)",  icon: "✅" },
          { label: "Fee Overdue",    value: stats.fee_overdue,    color: "#f87171", bg: "rgba(239,68,68,0.08)",   icon: "⚠️" },
          { label: "Low Attendance", value: stats.low_attendance, color: "#fbbf24", bg: "rgba(245,158,11,0.08)",  icon: "📉" },
        ].map((stat) => (
          <div key={stat.label} style={{ ...s.card, display: "flex", alignItems: "center", gap: "14px", padding: "16px 20px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>{stat.icon}</div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: 700, lineHeight: 1, color: stat.color }}>{stat.value.toLocaleString()}</div>
              <div style={{ fontSize: "11px", color: "#6b7a99", marginTop: "3px" }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main table card ── */}
      <div style={s.card}>

        {/* ── Toolbar ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>

          {/* Search */}
          <div style={{ position: "relative", flex: "1", minWidth: "200px", maxWidth: "280px" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: "#6b7a99" }}>🔍</span>
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={handleSearchKey}
              onBlur={() => setParam("search", searchDraft || null)}
              placeholder="Search name, roll no, admission no…"
              style={{ ...s.input, width: "100%", paddingLeft: "32px", boxSizing: "border-box" }}
            />
          </div>

          {/* Class filter */}
          <select value={searchParams.get("class_id") ?? ""} onChange={(e) => setParam("class_id", e.target.value || null)} style={s.select}>
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Status filter */}
          <select value={searchParams.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value || null)} style={s.select}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="alumni">Alumni</option>
          </select>

          {/* Gender filter */}
          <select value={searchParams.get("gender") ?? ""} onChange={(e) => setParam("gender", e.target.value || null)} style={s.select}>
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          {/* Per-page */}
          <select value={searchParams.get("per_page") ?? "20"} onChange={(e) => setParam("per_page", e.target.value)} style={s.select}>
            {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>

          {/* Clear filters */}
          {hasFilters && (
            <button style={s.btn("ghost")} onClick={() => { setSearchDraft(""); setSearchParams(new URLSearchParams({ page: "1" })); }}>
              ✕ Clear
            </button>
          )}

          {/* Bulk actions */}
          {someSelected && (
            <div style={{ marginLeft: "auto", position: "relative" }}>
              <button style={s.btn("ghost")} onClick={() => setShowBulkMenu((v) => !v)}>
                ☑️ {selected.size} selected ▾
              </button>
              {showBulkMenu && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#1a2035", border: "1px solid #2a3350", borderRadius: "10px", zIndex: 50, minWidth: "180px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", overflow: "hidden" }}>
                  {[
                    { label: "Set Active",   fn: () => bulkAction("bulk-status", { status: "active"   }) },
                    { label: "Set Inactive", fn: () => bulkAction("bulk-status", { status: "inactive" }) },
                    { label: "Set Alumni",   fn: () => bulkAction("bulk-status", { status: "alumni"   }) },
                  ].map((item) => (
                    <button
                      key={item.label} onClick={item.fn}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", background: "transparent", border: "none", color: "#a0aec0", fontSize: "13px", fontFamily: "'Sora',sans-serif", cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#1e2640"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      {item.label}
                    </button>
                  ))}
                  <div style={{ borderTop: "1px solid #1e2640" }} />
                  <button
                    onClick={() => { if (confirm(`Remove ${selected.size} student(s)? This cannot be undone.`)) bulkAction("bulk-delete"); }}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", background: "transparent", border: "none", color: "#f87171", fontSize: "13px", fontFamily: "'Sora',sans-serif", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    🗑 Delete Selected
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Active filter chips ── */}
        {hasFilters && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
            {filters.search   && <FilterChip label={`Search: "${filters.search}"`} onRemove={() => { setSearchDraft(""); setParam("search", null); }} />}
            {filters.status   && <FilterChip label={`Status: ${filters.status}`}   onRemove={() => setParam("status", null)} />}
            {filters.gender   && <FilterChip label={`Gender: ${filters.gender}`}   onRemove={() => setParam("gender", null)} />}
            {filters.class_id && <FilterChip label={`Class: ${classes.find((c) => c.id === filters.class_id)?.name ?? filters.class_id}`} onRemove={() => setParam("class_id", null)} />}
          </div>
        )}

        {/* ── Table ── */}
        <div style={{ overflowX: "auto", opacity: isLoading ? 0.5 : 1, transition: "opacity .2s" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: "40px" }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "#4f8ef7" }} />
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
                    style={{ ...s.th, cursor: col.sortable !== false ? "pointer" : "default" }}
                    onClick={() => col.sortable !== false && toggleSort(col.key)}
                  >
                    {col.label}
                    {col.sortable !== false && (
                      <SortIcon field={col.key} current={filters.sort_by ?? "first_name"} dir={filters.sort_dir ?? "asc"} />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "56px 24px", color: "#4b5a7a" }}>
                    <div style={{ fontSize: "32px", marginBottom: "10px", opacity: 0.5 }}>🎓</div>
                    {hasFilters ? "No students match the current filters." : "No students found. Add your first student to get started."}
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const isChecked  = selected.has(student.id);
                  const color      = avatarColor(student.full_name);
                  const feePill    = FEE_PILL[student.fee_status]   ?? FEE_PILL.pending;
                  const statusPill = STATUS_PILL[student.status]    ?? STATUS_PILL.active;

                  return (
                    <tr
                      key={student.id}
                      style={{
                        background: isChecked ? "rgba(79,142,247,0.04)" : "transparent",
                        transition: "background .15s",
                      }}
                      onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                      onMouseLeave={(e) => { if (!isChecked) e.currentTarget.style.background = "transparent"; }}
                    >
                      {/* Checkbox */}
                      <td style={s.td}>
                        <input type="checkbox" checked={isChecked} onChange={() => toggleOne(student.id)} style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "#4f8ef7" }} />
                      </td>

                      {/* Student name + photo */}
                      <td style={s.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: `${color}20`, border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color, flexShrink: 0, overflow: "hidden" }}>
                            {student.profile_photo ? (
                              <img src={`${import.meta.env.VITE_API_URL}/storage/${student.profile_photo}`} alt={student.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : initials(student.full_name)}
                          </div>
                          <div>
                            <Link
                              to={`/students/${student.id}`}
                              style={{ color: "#e8edf8", fontWeight: 600, textDecoration: "none", fontSize: "13px", display: "block" }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = "#4f8ef7"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = "#e8edf8"; }}
                            >
                              {student.full_name}
                            </Link>
                            <span style={{ fontSize: "11px", color: "#6b7a99" }}>{student.admission_no}</span>
                          </div>
                        </div>
                      </td>

                      {/* Roll No */}
                      <td style={{ ...s.td, fontFamily: "'JetBrains Mono', monospace", color: "#4f8ef7", fontSize: "12px" }}>{student.roll_number}</td>

                      {/* Class */}
                      <td style={s.td}>
                        {student.class_room ? (
                          <span style={{ background: "rgba(79,142,247,0.08)", color: "#60a5fa", border: "1px solid rgba(79,142,247,0.15)", padding: "3px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>
                            {student.class_room.name}
                          </span>
                        ) : "—"}
                      </td>

                      {/* Gender */}
                      <td style={{ ...s.td, textTransform: "capitalize" }}>{student.gender}</td>

                      {/* Attendance */}
                      <td style={s.td}><AttendanceBadge pct={student.attendance_percentage} /></td>

                      {/* Fee status */}
                      <td style={s.td}>
                        <span style={{ background: feePill.bg, color: feePill.text, padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px" }}>
                          {feePill.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={s.td}>
                        <span style={{ background: statusPill.bg, color: statusPill.text, padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, textTransform: "capitalize" }}>
                          {student.status}
                        </span>
                      </td>

                      {/* Joined */}
                      <td style={{ ...s.td, fontSize: "12px", color: "#6b7a99" }}>
                        {new Date(student.created_at).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>

                      {/* Row actions */}
                      <td style={s.td}>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <RowIconLink to={`/students/${student.id}`}      title="View profile" icon="👁"  hoverColor="#4f8ef7" />
                          <RowIconLink to={`/students/${student.id}/edit`} title="Edit student" icon="✏️" hoverColor="#f59e0b" />
                          <Form method="post" style={{ display: "contents" }}>
                            <input type="hidden" name="intent" value="delete" />
                            <input type="hidden" name="id"     value={student.id} />
                            <button
                              type="submit"
                              title="Remove student"
                              onClick={(e) => { if (!confirm(`Remove ${student.full_name}? This cannot be undone.`)) e.preventDefault(); }}
                              style={{ width: "30px", height: "30px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", cursor: "pointer", fontFamily: "'Sora',sans-serif", transition: "all .15s" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
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

        {/* Pagination */}
        {meta?.last_page > 1 && <Pagination meta={meta} onPage={goToPage} />}

        {/* Loading indicator */}
        {isLoading && (
          <div style={{ textAlign: "center", marginTop: "8px", fontSize: "12px", color: "#4f8ef7", fontWeight: 600 }}>Loading…</div>
        )}
      </div>

      {/* ── Import Modal ── */}
      {showImportModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setShowImportModal(false); setImportMsg(null); setImportFile(null); } }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
        >
          <div style={{ background: "#0f1424", border: "1px solid #2a3350", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "460px", boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 700 }}>📤 Import Students</h2>
              <button onClick={() => { setShowImportModal(false); setImportMsg(null); setImportFile(null); }} style={{ background: "#1e2640", border: "1px solid #2a3350", borderRadius: "7px", width: "30px", height: "30px", color: "#a0aec0", cursor: "pointer", fontSize: "14px" }}>✕</button>
            </div>

            {/* Drop zone */}
            <label style={{ display: "block", border: `2px dashed ${importFile ? "#4f8ef7" : "#2a3350"}`, borderRadius: "12px", padding: "36px 20px", textAlign: "center", cursor: "pointer", marginBottom: "16px", background: importFile ? "rgba(79,142,247,0.05)" : "transparent", transition: "all .2s" }}>
              <input type="file" accept=".xlsx,.csv,.xls" style={{ display: "none" }} onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} />
              <div style={{ fontSize: "32px", marginBottom: "10px" }}>{importFile ? "📄" : "📁"}</div>
              {importFile ? (
                <>
                  <div style={{ fontWeight: 600, fontSize: "13px", color: "#4f8ef7" }}>{importFile.name}</div>
                  <div style={{ fontSize: "11px", color: "#6b7a99", marginTop: "4px" }}>{(importFile.size / 1024).toFixed(1)} KB · Click to change</div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>Drop CSV / Excel file here</div>
                  <div style={{ fontSize: "11px", color: "#6b7a99", marginTop: "4px" }}>Supports .xlsx, .csv · Max 5 MB</div>
                </>
              )}
            </label>

            {/* Column guide */}
            <div style={{ background: "#0a0e1a", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px", fontSize: "11px", color: "#6b7a99", lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, color: "#a0aec0", marginBottom: "4px" }}>Required columns:</div>
              <code style={{ color: "#60a5fa", fontFamily: "'JetBrains Mono', monospace" }}>
                first_name, last_name, date_of_birth, gender, class, parent_name, parent_email
              </code>
            </div>

            {/* Feedback */}
            {importMsg && (
              <div style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, background: importMsg.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: importMsg.ok ? "#34d399" : "#f87171", border: `1px solid ${importMsg.ok ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                {importMsg.ok ? "✅" : "❌"} {importMsg.text}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => { setShowImportModal(false); setImportMsg(null); setImportFile(null); }} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flex: 1, padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", background: "#1e2640", color: "#a0aec0", border: "1px solid #2a3350", fontFamily: "'Sora', sans-serif" }}>
                Cancel
              </button>
              <button onClick={handleImport} disabled={!importFile || importLoading} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flex: 1, padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, background: "linear-gradient(135deg,#4f8ef7,#6366f1)", color: "#fff", border: "none", fontFamily: "'Sora', sans-serif", cursor: !importFile || importLoading ? "not-allowed" : "pointer", opacity: !importFile || importLoading ? 0.5 : 1, transition: "all .15s" }}>
                {importLoading ? "Importing…" : "📤 Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}