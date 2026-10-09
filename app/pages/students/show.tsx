// ============================================================
// app/pages/students/show.tsx
// ============================================================
import { useState } from "react";
import { Link, Form, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/show";
import {
  api,
  type Student,
  type Grade,
  type Fee,
  type Attendance,
  type AttendanceStatus,
  type User,
} from "~/lib/api";

export async function clientLoader({ params }: Route.LoaderArgs) {
  const id = Number(params.id);

  const [studentRes, reportCardRes, feeHistoryRes, attendanceHistoryRes] = await Promise.allSettled([
    api.students.get(id),
    api.students.reportCard(id),
    api.students.feeHistory(id),
    api.students.attendanceHistory(id),
  ]);

  if (studentRes.status === "rejected") throw studentRes.reason;

  const student = (studentRes.value).data;

  return {
    student,
    reportCard:  reportCardRes.status === "fulfilled"  ? reportCardRes.value.data  : null,
    feeHistory:  feeHistoryRes.status === "fulfilled"  ? feeHistoryRes.value.data  : null,
    attendance:  attendanceHistoryRes.status === "fulfilled" ? attendanceHistoryRes.value.data : null,
  };
}

export async function clientAction({ request, params }: Route.ActionArgs) {
  const form   = await request.formData();
  const intent = form.get("intent");
  if (intent === "delete") {
    await api.students.delete(Number(params.id));
    return redirect("/students");
  }
  return null;
}

const AVATAR_COLORS: Record<string, string> = {
  A:"#4f8ef7",B:"#10b981",C:"#f59e0b",D:"#8b5cf6",E:"#ef4444",
  F:"#6366f1",G:"#14b8a6",H:"#f97316",I:"#4f8ef7",J:"#10b981",
  K:"#f59e0b",L:"#8b5cf6",M:"#ef4444",N:"#6366f1",O:"#14b8a6",
  P:"#f97316",Q:"#4f8ef7",R:"#10b981",S:"#f59e0b",T:"#8b5cf6",
  U:"#ef4444",V:"#6366f1",W:"#14b8a6",X:"#f97316",Y:"#4f8ef7",Z:"#10b981",
};
function avatarColor(name: string) { return AVATAR_COLORS[name[0]?.toUpperCase()] ?? "#4f8ef7"; }
function initials(name: string) { return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase(); }
function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
}
function fmtKES(n: number) { return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 0 })}`; }

const STATUS_CONFIG = {
  active:   { bg: "rgba(16,185,129,0.12)", color: "#34d399", label: "Active"   },
  inactive: { bg: "rgba(239,68,68,0.12)",  color: "#f87171", label: "Inactive" },
  alumni:   { bg: "rgba(99,102,241,0.12)", color: "#a5b4fc", label: "Alumni"   },
};

const GRADE_CONFIG: Record<string, { bg: string; color: string }> = {
  "A+": { bg: "rgba(16,185,129,0.12)", color: "#34d399" },
  "A":  { bg: "rgba(16,185,129,0.10)", color: "#6ee7b7" },
  "B+": { bg: "rgba(79,142,247,0.12)", color: "#7dd3fc" },
  "B":  { bg: "rgba(79,142,247,0.10)", color: "#93c5fd" },
  "C":  { bg: "rgba(245,158,11,0.12)", color: "#fbbf24" },
  "D":  { bg: "rgba(249,115,22,0.12)", color: "#fb923c" },
  "F":  { bg: "rgba(239,68,68,0.12)",  color: "#f87171" },
};

const FEE_CONFIG = {
  paid:     { bg: "rgba(16,185,129,0.12)",  color: "#34d399", label: "Paid"     },
  pending:  { bg: "rgba(245,158,11,0.12)",  color: "#fbbf24", label: "Pending"  },
  overdue:  { bg: "rgba(239,68,68,0.12)",   color: "#f87171", label: "Overdue"  },
  waived:   { bg: "rgba(99,102,241,0.12)",  color: "#a5b4fc", label: "Waived"   },
  reversed: { bg: "rgba(113,113,122,0.14)", color: "#d4d4d8", label: "Reversed" },
};

const ATT_CONFIG: Record<AttendanceStatus, { color: string; label: string }> = {
  present: { color: "#34d399", label: "Present" },
  absent:  { color: "#f87171", label: "Absent"  },
  late:    { color: "#fbbf24", label: "Late"     },
  holiday: { color: "#a5b4fc", label: "Holiday"  },
  excused: { color: "#60a5fa", label: "Excused"  },
};

function Pill({ bg, color, label }: { bg: string; color: string; label: string }) {
  return <span style={{ background: bg, color, fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", whiteSpace: "nowrap" }}>{label}</span>;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#0f1424", border: "1px solid #1e2640", borderRadius: "14px", padding: "22px 24px", boxSizing: "border-box", ...style }}>
      {children}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4f8ef7", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontFamily: "'Sora', sans-serif" }}>
      {children}
    </h3>
  );
}

function AttendanceBar({ pct }: { pct: number }) {
  const color = pct >= 90 ? "#34d399" : pct >= 75 ? "#fbbf24" : "#f87171";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.07)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color, borderRadius: "3px", transition: "width .6s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", fontWeight: 700, color }}>{pct}%</span>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: "#4b5a7a", fontSize: "13px" }}>
      <div style={{ fontSize: "32px", marginBottom: "10px", opacity: 0.5 }}>{icon}</div>
      {message}
    </div>
  );
}

function TH({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "10px", fontWeight: 700, color: "#4b5a7a", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" as const }}>{children}</th>;
}

type TabId = "overview" | "grades" | "fees" | "attendance";

export default function StudentShowPage({ loaderData }: Route.ComponentProps) {
  const { student, reportCard, feeHistory, attendance } = loaderData as {
    student:    Student;
    reportCard: { grades: Record<string, Grade[]>; attendance_percentage: number; rank: number | null; total_students: number } | null;
    feeHistory: { fees: Fee[]; total_paid: number; total_pending: number; total_overdue: number } | null;
    attendance: { records: Attendance[]; percentage: number; summary: Record<AttendanceStatus, number> } | null;
  };

  const [tab, setTab] = useState<TabId>("overview");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const navigation = useNavigation();
  const deleting   = navigation.state === "submitting";

  const statusCfg = STATUS_CONFIG[student.status] ?? STATUS_CONFIG.active;
  const color     = avatarColor(student.full_name);

  const allGrades: Grade[] = reportCard
    ? Object.values(reportCard.grades).flat()
    : (student.grades ?? []);

  const allFees: Fee[] = feeHistory?.fees ?? (student.fees ?? []);
  const allAttendance: Attendance[] = attendance?.records ?? [];
  const studentParents = [
    { label: "Primary Parent / Guardian", parent: student.parent },
    { label: "Second Parent / Guardian", parent: student.secondary_parent },
  ].filter((entry): entry is { label: string; parent: User } => Boolean(entry.parent));

  const TABS: { id: TabId; label: string; count?: number }[] = [
    { id: "overview",   label: "Overview" },
    { id: "grades",     label: "Grades",     count: allGrades.length },
    { id: "fees",       label: "Fees",       count: allFees.length },
    { id: "attendance", label: "Attendance", count: allAttendance.length },
  ];

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", color: "#e2e8f0", maxWidth: "960px", margin: "0 auto", boxSizing: "border-box" }} className="responsive-container">

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", fontSize: "13px", flexWrap: "wrap" }}>
        <Link to="/students" style={{ color: "#4f8ef7", textDecoration: "none", fontWeight: 600 }}>Students</Link>
        <span style={{ color: "#2a3350" }}>›</span>
        <span style={{ color: "#6b7a99", wordBreak: "break-all" }}>{student.full_name}</span>
      </div>

      {/* Hero card */}
      <Card style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
          <div style={{
            width: "68px", height: "68px", borderRadius: "50%", flexShrink: 0,
            overflow: "hidden",
            background: `linear-gradient(135deg, ${color}, ${color}99)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "22px", fontWeight: 700,
            boxShadow: `0 0 0 3px ${color}40`,
          }}>
            {student.profile_photo ? (
              <img src={`${import.meta.env.VITE_API_URL}/storage/${student.profile_photo}`} alt={student.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : initials(student.full_name)}
          </div>

          <div style={{ flex: 1, minWidth: "200px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
              <h1 style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.3px", margin: 0, wordBreak: "break-word" }}>{student.full_name}</h1>
              <Pill {...statusCfg} />
            </div>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "13px", color: "#6b7a99" }}>
              <span>🏫 {student.class_room?.name ?? "—"}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#a0aec0" }}>#{student.roll_number}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#6b7a99" }}>{student.admission_no}</span>
              {reportCard && reportCard.rank && (
                <span style={{ color: "#fbbf24" }}>🏆 Rank {reportCard.rank} / {reportCard.total_students}</span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "1px", borderRadius: "10px", overflow: "hidden", border: "1px solid #1e2640", flexWrap: "wrap" }} className="responsive-stats-box">
            {[
              {
                label: "Attendance",
                value: `${attendance?.percentage ?? student.attendance_percentage}%`,
                color: (attendance?.percentage ?? student.attendance_percentage) >= 90 ? "#34d399" : (attendance?.percentage ?? student.attendance_percentage) >= 75 ? "#fbbf24" : "#f87171",
              },
              { label: "Exams",      value: String(allGrades.length),        color: "#4f8ef7" },
              { label: "Fee Status", value: student.fee_status,              color: FEE_CONFIG[student.fee_status]?.color ?? "#a0aec0" },
            ].map((stat) => (
              <div key={stat.label} style={{ padding: "12px 18px", background: "#0a0e1a", textAlign: "center", minWidth: "75px", flex: 1 }}>
                <div style={{ fontSize: "17px", fontWeight: 700, color: stat.color, fontFamily: "'JetBrains Mono', monospace", textTransform: "capitalize" }}>{stat.value}</div>
                <div style={{ fontSize: "10px", color: "#4b5a7a", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px", alignSelf: "center", flexWrap: "wrap" }} className="responsive-hero-actions">
            <Link to={`/students/${student.id}/edit`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", background: "rgba(79,142,247,0.1)", border: "1px solid rgba(79,142,247,0.25)", color: "#4f8ef7", textDecoration: "none", fontSize: "12px", fontWeight: 700 }}>
              ✏️ Edit
            </Link>
            {!deleteConfirm ? (
              <button onClick={() => setDeleteConfirm(true)} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Sora', sans-serif" }}>
                🗑 Remove
              </button>
            ) : (
              <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", color: "#f87171", fontWeight: 600 }}>Confirm?</span>
                <Form method="post">
                  <input type="hidden" name="intent" value="delete" />
                  <button type="submit" disabled={deleting} style={{ padding: "6px 12px", borderRadius: "7px", background: "#ef4444", border: "none", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Sora', sans-serif", opacity: deleting ? 0.6 : 1 }}>
                    {deleting ? "Removing…" : "Yes, remove"}
                  </button>
                </Form>
                <button onClick={() => setDeleteConfirm(false)} style={{ padding: "6px 12px", borderRadius: "7px", background: "#1e2640", border: "1px solid #2a3350", color: "#a0aec0", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'Sora', sans-serif" }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "2px", background: "#0a0e1a", border: "1px solid #1e2640", borderRadius: "10px", padding: "4px", marginBottom: "16px", overflowX: "auto", maxWidth: "100%", WebkitOverflowScrolling: "touch" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "7px 16px", borderRadius: "7px", background: tab === t.id ? "#1e2640" : "transparent", border: tab === t.id ? "1px solid #2a3350" : "1px solid transparent", color: tab === t.id ? "#e2e8f0" : "#6b7a99", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'Sora', sans-serif", transition: "all .15s", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", flexShrink: 0 }}>
            {t.label}
            {t.count != null && t.count > 0 && (
              <span style={{ background: tab === t.id ? "#4f8ef7" : "#2a3350", color: tab === t.id ? "#fff" : "#6b7a99", fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px", transition: "all .15s" }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="responsive-grid-overview">
          <Card>
            <SectionHeading>👤 Personal</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                ["Date of Birth",  fmtDate(student.date_of_birth as string)],
                ["Gender",         student.gender],
                ["Blood Group",    student.blood_group ?? "—"],
                ["Category",       student.category   ?? "—"],
                ["Religion",       student.religion   ?? "—"],
                ["Admission Date", fmtDate(student.admission_date as string)],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#6b7a99" }}>{label}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#c4cfdf", textTransform: "capitalize", textAlign: "right", wordBreak: "break-word" }}>{value}</span>
                </div>
              ))}
              {student.address && (
                <div>
                  <div style={{ fontSize: "11px", color: "#4b5a7a", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px" }}>Address</div>
                  <div style={{ fontSize: "13px", color: "#a0aec0", lineHeight: 1.6, wordBreak: "break-word" }}>{student.address}</div>
                </div>
              )}
            </div>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {studentParents.length > 0 && (
              <Card>
                <SectionHeading>👨‍👩‍👧 Parents / Guardians</SectionHeading>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {studentParents.map(({ label, parent }) => (
                    <div key={parent.id} style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0, background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#34d399" }}>
                        {initials(parent.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: "140px" }}>
                        <div style={{ fontSize: "11px", color: "#6b7a99", marginBottom: "2px" }}>{label}</div>
                        <div style={{ fontSize: "14px", fontWeight: 600, wordBreak: "break-word" }}>{parent.name}</div>
                        <div style={{ fontSize: "12px", color: "#6b7a99", wordBreak: "break-all" }}>{parent.email}</div>
                      </div>
                      <Link to="/messages" style={{ padding: "6px 12px", borderRadius: "7px", background: "#1e2640", border: "1px solid #2a3350", color: "#a0aec0", textDecoration: "none", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" }}>💬 Message</Link>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card>
              <SectionHeading>📊 Attendance Summary</SectionHeading>
              <div style={{ marginBottom: "14px" }}>
                <AttendanceBar pct={attendance?.percentage ?? student.attendance_percentage} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }} className="responsive-grid-4">
                {(["present", "absent", "late", "holiday"] as AttendanceStatus[]).map((status) => {
                  const cfg   = ATT_CONFIG[status];
                  const count = attendance?.summary?.[status] ??
                    allAttendance.filter((a) => a.status === status).length;
                  return (
                    <div key={status} style={{ background: "#0a0e1a", border: "1px solid #1e2640", borderRadius: "8px", padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: cfg.color, fontFamily: "'JetBrains Mono', monospace" }}>{count}</div>
                      <div style={{ fontSize: "9px", color: "#4b5a7a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px" }}>{cfg.label}</div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {feeHistory && (
              <Card>
                <SectionHeading>💰 Fee Summary</SectionHeading>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }} className="responsive-grid-2">
                  {[
                    { label: "Total Paid",    value: feeHistory.total_paid,    color: "#34d399" },
                    { label: "Pending",       value: feeHistory.total_pending, color: "#fbbf24" },
                    { label: "Overdue",       value: feeHistory.total_overdue, color: "#f87171" },
                    { label: "Fee Status",    value: student.fee_status,       color: FEE_CONFIG[student.fee_status]?.color ?? "#a0aec0", isText: true },
                  ].map(({ label, value, color: c, isText }) => (
                    <div key={label} style={{ background: "#0a0e1a", border: "1px solid #1e2640", borderRadius: "8px", padding: "10px 12px" }}>
                      <div style={{ fontSize: "10px", color: "#4b5a7a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>{label}</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: c, fontFamily: isText ? "'Sora', sans-serif" : "'JetBrains Mono', monospace", textTransform: isText ? "capitalize" : undefined, wordBreak: "break-all" }}>
                        {isText ? String(value) : fmtKES(Number(value))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Tab: Grades */}
      {tab === "grades" && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <SectionHeading>🏆 Grade History</SectionHeading>
            {reportCard && (
              <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#6b7a99" }}>
                {reportCard.rank && <span>🏆 Rank <strong style={{ color: "#fbbf24" }}>{reportCard.rank}</strong> / {reportCard.total_students}</span>}
              </div>
            )}
          </div>
          {allGrades.length > 0 ? (
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "650px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e2640" }}>
                    {["Subject", "Exam", "Date", "Score", "Grade", "Status", "Remarks"].map((h) => <TH key={h}>{h}</TH>)}
                  </tr>
                </thead>
                <tbody>
                  {allGrades.map((g: Grade, i: number) => {
                    const gc = GRADE_CONFIG[g.letter_grade] ?? GRADE_CONFIG["C"];
                    return (
                      <tr key={g.id ?? i} style={{ borderBottom: "1px solid rgba(30,38,64,0.7)" }}>
                        <td style={{ padding: "11px 12px", color: "#c4cfdf", fontWeight: 500 }}>{g.exam?.subject?.name ?? "—"}</td>
                        <td style={{ padding: "11px 12px", color: "#6b7a99", fontSize: "12px" }}>{g.exam?.title ?? "—"}</td>
                        <td style={{ padding: "11px 12px", color: "#4b5a7a", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>{g.exam?.exam_date ?? "—"}</td>
                        <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{g.marks_obtained}</span>
                          <span style={{ color: "#4b5a7a", fontSize: "11px" }}>/{g.total_marks}</span>
                          <span style={{ color: "#6b7a99", fontSize: "11px", marginLeft: "4px" }}>({g.percentage}%)</span>
                        </td>
                        <td style={{ padding: "11px 12px" }}><Pill bg={gc.bg} color={gc.color} label={g.letter_grade} /></td>
                        <td style={{ padding: "11px 12px" }}><Pill bg={g.status === "pass" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)"} color={g.status === "pass" ? "#34d399" : "#f87171"} label={g.status} /></td>
                        <td style={{ padding: "11px 12px", color: "#4b5a7a", fontSize: "12px" }}>{g.remarks ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <EmptyState icon="📝" message="No grades recorded yet." />}
        </Card>
      )}

      {/* Tab: Fees */}
      {tab === "fees" && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <SectionHeading>💰 Fee History</SectionHeading>
            {feeHistory && allFees.length > 0 && (
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                {[
                  { label: "Total Paid", val: feeHistory.total_paid,    color: "#34d399" },
                  { label: "Pending",    val: feeHistory.total_pending, color: "#fbbf24" },
                  { label: "Overdue",    val: feeHistory.total_overdue, color: "#f87171" },
                ].map(({ label, val, color: c }) => (
                  <div key={label} style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: c, fontFamily: "'JetBrains Mono', monospace" }}>{fmtKES(val)}</div>
                    <div style={{ fontSize: "10px", color: "#4b5a7a", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {allFees.length > 0 ? (
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "700px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e2640" }}>
                    {['Receipt', 'Fee Type', 'Amount', 'Method', 'Paid On', 'Status', 'Action'].map((h) => <TH key={h}>{h}</TH>)}
                  </tr>
                </thead>
                <tbody>
                  {allFees.map((f: Fee, i: number) => {
                    const fc = FEE_CONFIG[f.status] ?? FEE_CONFIG.pending;
                    return (
                      <tr key={f.id ?? i} style={{ borderBottom: "1px solid rgba(30,38,64,0.7)" }}>
                        <td style={{ padding: "11px 12px" }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "#4f8ef7" }}>{f.receipt_no}</span>
                        </td>
                        <td style={{ padding: "11px 12px", color: "#c4cfdf" }}>{f.fee_type?.name ?? "—"}</td>
                        <td style={{ padding: "11px 12px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, whiteSpace: "nowrap" }}>{fmtKES(Number(f.amount))}</td>
                        <td style={{ padding: "11px 12px", color: "#6b7a99", fontSize: "12px", textTransform: "capitalize" }}>{f.payment_method ?? "—"}</td>
                        <td style={{ padding: "11px 12px", color: "#4b5a7a", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>{f.paid_at ? f.paid_at.split("T")[0] : "—"}</td>
                        <td style={{ padding: "11px 12px" }}><Pill bg={fc.bg} color={fc.color} label={fc.label} /></td>
                        <td style={{ padding: "11px 12px" }}>
                          <a
                            href={api.fees.receiptUrl(f.id)}
                            target="_blank"
                            rel="noreferrer"
                            title="Download receipt"
                            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "6px 10px", borderRadius: "8px", background: "rgba(79,142,247,0.1)", color: "#4f8ef7", fontSize: "12px", fontWeight: 700, textDecoration: "none", border: "1px solid rgba(79,142,247,0.2)" }}
                          >
                            🖨 Download
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <EmptyState icon="💳" message="No fee records found." />}
        </Card>
      )}

      {/* Tab: Attendance */}
      {tab === "attendance" && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <SectionHeading>📅 Attendance Records</SectionHeading>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "#6b7a99" }}>Overall</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "14px", color: (attendance?.percentage ?? student.attendance_percentage) >= 90 ? "#34d399" : (attendance?.percentage ?? student.attendance_percentage) >= 75 ? "#fbbf24" : "#f87171" }}>
                {attendance?.percentage ?? student.attendance_percentage}%
              </span>
            </div>
          </div>

          {attendance?.summary && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              {(["present", "absent", "late", "holiday", "excused"] as AttendanceStatus[]).map((status) => {
                const cfg = ATT_CONFIG[status];
                const count = attendance.summary[status] ?? 0;
                return (
                  <div key={status} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#0a0e1a", border: "1px solid #1e2640", borderRadius: "8px", padding: "6px 12px", flex: "1 1 auto", minWidth: "90px" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: cfg.color, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: cfg.color, fontWeight: 600 }}>{count}</span>
                    <span style={{ fontSize: "11px", color: "#6b7a99" }}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {allAttendance.length > 0 ? (
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "400px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e2640" }}>
                    {["Date", "Status", "Remarks"].map((h) => <TH key={h}>{h}</TH>)}
                  </tr>
                </thead>
                <tbody>
                  {allAttendance.slice(0, 90).map((a, i) => {
                    const ac = ATT_CONFIG[a.status] ?? ATT_CONFIG.present;
                    return (
                      <tr key={a.id ?? i} style={{ borderBottom: "1px solid rgba(30,38,64,0.7)" }}>
                        <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "#a0aec0", whiteSpace: "nowrap" }}>{a.date}</td>
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600, color: ac.color }}>
                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: ac.color, display: "inline-block" }} />
                            {ac.label}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", color: "#4b5a7a", fontSize: "12px" }}>{a.remarks ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {allAttendance.length > 90 && (
                <p style={{ textAlign: "center", fontSize: "12px", color: "#4b5a7a", marginTop: "12px" }}>Showing latest 90 of {allAttendance.length} records.</p>
              )}
            </div>
          ) : <EmptyState icon="📅" message="No attendance records yet." />}
        </Card>
      )}

      <style>{`
        @media (max-width: 768px) {
          .responsive-container { padding: 12px !important; }
          .responsive-grid-overview { grid-template-columns: 1fr !important; }
          .responsive-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .responsive-stats-box { width: 100% !important; }
          .responsive-hero-actions { width: 100% !important; justify-content: flex-start; }
        }
      `}</style>
    </div>
  );
}