// ============================================================
// app/pages/parents/show.tsx
// ============================================================
import { useEffect, useState } from "react";
import { Link, Form, useRevalidator } from "react-router";
import type { Route } from "./+types/show";
import { api, type ParentProfile, type Student } from "~/lib/api";

export async function clientLoader({ params }: Route.LoaderArgs) {
  const id = Number(params.id);
  const response = await api.parents.get(id);
  return { parent: response.data };
}

export async function clientAction({ request, params }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "delete") {
    await api.parents.delete(Number(params.id));
    return { redirect: "/parents" };
  }
  return null;
}

export default function ParentShowPage({ loaderData }: Route.ComponentProps) {
  const parent = (loaderData as { parent?: ParentProfile } | undefined)?.parent ?? null;
  const revalidator = useRevalidator();
  const [showLinkStudent, setShowLinkStudent] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [linkingStudent, setLinkingStudent] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkNotice, setLinkNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!showLinkStudent) return;
    const query = studentSearch.trim();
    if (!query) {
      setStudentResults([]);
      setSelectedStudentId(null);
      setStudentSearchLoading(false);
      setLinkError(null);
      return;
    }

    let cancelled = false;
    setStudentSearchLoading(true);
    setLinkError(null);
    const timeout = setTimeout(async () => {
      try {
        const response = await api.students.list({ search: query, per_page: 20 });
        if (!cancelled) setStudentResults(response.data.data);
      } catch (error: unknown) {
        if (!cancelled) {
          setStudentResults([]);
          setLinkError((error as { message?: string })?.message ?? "Could not search students. Please try again.");
        }
      } finally {
        if (!cancelled) setStudentSearchLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [showLinkStudent, studentSearch]);

  useEffect(() => {
    if (!showLinkStudent) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !linkingStudent) setShowLinkStudent(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLinkStudent, linkingStudent]);

  async function linkStudentToParent() {
    if (!parent?.user_id || selectedStudentId === null) return;
    const student = studentResults.find((result) => result.id === selectedStudentId);
    if (!student) return;

    if (student.parent_id === parent.user_id || student.secondary_parent_id === parent.user_id) {
      setLinkError(`${student.full_name} is already linked to this parent.`);
      return;
    }

    const parentPayload = !student.parent_id
      ? { parent_id: parent.user_id }
      : !student.secondary_parent_id
        ? { secondary_parent_id: parent.user_id }
        : null;
    if (!parentPayload) {
      setLinkError(`${student.full_name} is already linked to two parents. Remove a parent link before adding another.`);
      return;
    }

    setLinkingStudent(true);
    setLinkError(null);
    setLinkNotice(null);
    try {
      await api.students.update(student.id, parentPayload);
      setLinkNotice(`${student.full_name} was linked to ${parent.user?.name ?? "this parent"}.`);
      setShowLinkStudent(false);
      setStudentSearch("");
      setStudentResults([]);
      setSelectedStudentId(null);
      revalidator.revalidate();
    } catch (error: unknown) {
      const apiError = error as { message?: string; errors?: Record<string, string[]> };
      setLinkError(
        apiError?.message ??
          apiError?.errors?.parent_id?.[0] ??
          apiError?.errors?.secondary_parent_id?.[0] ??
          "Could not link this student. Please try again."
      );
    } finally {
      setLinkingStudent(false);
    }
  }

  if (!parent) {
    return (
      <div style={{ color: "#f8fafc", fontFamily: "'Sora', sans-serif", display: "flex", justifyContent: "center", padding: "40px" }}>
        <h2 style={{ fontSize: 14, color: "#94a3b8" }}>Loading parent profile...</h2>
      </div>
    );
  }

  return (
    <div style={{ color: "#f8fafc", fontFamily: "'Sora', sans-serif", maxWidth: "1000px", margin: "0 auto", padding: "12px", boxSizing: "border-box" }}>
      
      {/* Navigation */}
      <div style={{ marginBottom: "20px" }}>
        <Link to="/parents" style={{ color: "#3b82f6", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
          ← Back to Parents Directory
        </Link>
      </div>

      {/* Header Profile Area */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", borderBottom: "1px solid #1e293b", paddingBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "clamp(22px, 4vw, 26px)", margin: 0, fontWeight: 700, wordBreak: "break-word" }}>
            {parent.user?.name ?? "Unnamed Parent"}
          </h1>
          <span style={{ display: "inline-block", background: "rgba(16,185,129,0.15)", color: "#10b981", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", marginTop: "8px" }}>
            Account Status: {parent.user?.status ?? "Active"}
          </span>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", width: "100%" }}>
          <Link to={`/parents/${parent.id}/edit`} style={{ flex: 1, textAlign: "center", background: "#3b82f6", color: "#ffffff", padding: "10px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>
            Edit Profile
          </Link>
          <Form method="post" onSubmit={(e) => !confirm("Delete this profile permanent?") && e.preventDefault()} style={{ flex: 1 }}>
            <input type="hidden" name="intent" value="delete" />
            <button type="submit" style={{ width: "100%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "10px 16px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>
              Delete Account
            </button>
          </Form>
        </div>
      </div>

      {/* Data Layout Split */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
        
        {/* Profile Card Info */}
        <section style={{ padding: "20px", borderRadius: "12px", background: "#0f172a", border: "1px solid #1e293b", boxSizing: "border-box" }}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "16px", borderBottom: "1px solid #1e293b", paddingBottom: "10px" }}>Account Details</h2>
          <div style={{ display: "grid", gap: "16px", fontSize: "14px", wordBreak: "break-word" }}>
            <div><span style={{ color: "#64748b" }}>Email: </span>{parent.user?.email ?? "—"}</div>
            <div><span style={{ color: "#64748b" }}>Phone: </span>{parent.phone ?? "—"}</div>
            <div><span style={{ color: "#64748b" }}>Relationship: </span>{parent.relationship ?? "—"}</div>
            <div><span style={{ color: "#64748b" }}>Occupation: </span>{parent.occupation ?? "—"}</div>
            <div><span style={{ color: "#64748b" }}>Address: </span>{parent.address ?? "—"}</div>
            {parent.notes && (
              <div style={{ marginTop: "12px", padding: "12px", background: "#1e293b", borderRadius: "8px" }}>
                <strong style={{ fontSize: "12px", color: "#94a3b8" }}>Notes:</strong>
                <p style={{ margin: "4px 0 0 0" }}>{parent.notes}</p>
              </div>
            )}
          </div>
        </section>

        {/* Linked Children Card */}
        <section style={{ padding: "20px", borderRadius: "12px", background: "#0f172a", border: "1px solid #1e293b", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", borderBottom: "1px solid #1e293b", paddingBottom: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: "16px" }}>
              Linked Students ({parent.children?.length ?? 0})
            </h2>
            <button
              type="button"
              onClick={() => {
                setLinkNotice(null);
                setLinkError(null);
                setShowLinkStudent(true);
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "linear-gradient(135deg, #2563eb, #4f46e5)", border: "none", borderRadius: "9px", color: "#fff", padding: "9px 13px", fontWeight: 600, cursor: "pointer", fontSize: "12px" }}
            >
              <span aria-hidden="true">＋</span> Link Student
            </button>
          </div>
          {linkNotice && (
            <div role="status" style={{ marginBottom: "14px", padding: "10px 12px", borderRadius: "8px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#6ee7b7", fontSize: "13px" }}>
              {linkNotice}
            </div>
          )}
          {parent.children && parent.children.length > 0 ? (
            <div style={{ display: "grid", gap: "12px" }}>
              {parent.children.map((child) => (
                <div key={child.id} style={{ display: "flex", justifyContent: "space-between", padding: "14px", borderRadius: "8px", background: "#1e293b" }}>
                  <div>
                    <Link to={`/students/${child.id}`} style={{ color: "#f8fafc", fontWeight: 600, fontSize: "14px", textDecoration: "none" }}>{child.full_name}</Link>
                    <div style={{ color: "#64748b", fontSize: "12px" }}>
                      Adm No: {child.admission_no}
                      {child.parent?.name && ` · Parent: ${child.parent.name}`}
                      {child.secondary_parent?.name && ` · Second parent: ${child.secondary_parent.name}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#64748b", fontSize: "14px" }}>No students linked to this profile.</p>
          )}
        </section>
      </div>

      {showLinkStudent && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !linkingStudent) setShowLinkStudent(false);
          }}
          style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(2,6,23,0.78)", backdropFilter: "blur(5px)", overflowY: "auto" }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="link-student-title"
            style={{ width: "100%", maxWidth: "540px", maxHeight: "calc(100vh - 40px)", overflowY: "auto", padding: "24px", borderRadius: "18px", border: "1px solid #334155", background: "linear-gradient(145deg, #111b30, #0f172a)", boxShadow: "0 24px 80px rgba(0,0,0,0.55)", boxSizing: "border-box", color: "#f8fafc" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px", marginBottom: "20px" }}>
              <div>
                <h2 id="link-student-title" style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>Link a student</h2>
                <p style={{ margin: "7px 0 0", color: "#94a3b8", fontSize: "13px", lineHeight: 1.5 }}>
                  Search for a student to link to {parent.user?.name ?? "this parent"}.
                </p>
              </div>
              <button type="button" aria-label="Close dialog" disabled={linkingStudent} onClick={() => setShowLinkStudent(false)} style={{ width: "34px", height: "34px", borderRadius: "9px", border: "1px solid #334155", background: "#1e293b", color: "#cbd5e1", fontSize: "20px", cursor: "pointer", flexShrink: 0 }}>×</button>
            </div>

            <label htmlFor="parent-student-search" style={{ display: "block", color: "#cbd5e1", fontSize: "12px", fontWeight: 600, marginBottom: "7px" }}>Find student</label>
            <input
              id="parent-student-search"
              autoFocus
              value={studentSearch}
              onChange={(event) => {
                setStudentSearch(event.target.value);
                setSelectedStudentId(null);
              }}
              placeholder="Search by student name or admission number..."
              autoComplete="off"
              style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: "10px", border: "1px solid #334155", background: "#020617", color: "#f8fafc", fontSize: "13px", outline: "none" }}
            />

            <div aria-live="polite" style={{ marginTop: "12px" }}>
              {studentSearchLoading && <p style={{ color: "#94a3b8", fontSize: "13px", padding: "12px 2px" }}>Searching students…</p>}
              {!studentSearchLoading && !linkError && studentSearch.trim() && studentResults.length === 0 && (
                <p style={{ color: "#94a3b8", fontSize: "13px", padding: "12px 2px" }}>No students found. Try another name or admission number.</p>
              )}
              {studentResults.length > 0 && (
                <div style={{ display: "grid", gap: "8px", maxHeight: "280px", overflowY: "auto" }}>
                  {studentResults.map((student) => {
                    const alreadyLinked = student.parent_id === parent.user_id || student.secondary_parent_id === parent.user_id;
                    const hasTwoParents = Boolean(student.parent_id && student.secondary_parent_id);
                    const selected = selectedStudentId === student.id;
                    return (
                      <button
                        key={student.id}
                        type="button"
                        disabled={alreadyLinked || hasTwoParents || linkingStudent}
                        onClick={() => setSelectedStudentId(student.id)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", width: "100%", textAlign: "left", padding: "12px", borderRadius: "10px", border: `1px solid ${selected ? "#3b82f6" : "#273449"}`, background: selected ? "rgba(59,130,246,0.14)" : "#111c30", color: "#f8fafc", cursor: alreadyLinked || hasTwoParents ? "not-allowed" : "pointer", opacity: alreadyLinked || hasTwoParents ? 0.65 : 1 }}
                      >
                        <span>
                          <span style={{ display: "block", fontSize: "13px", fontWeight: 600 }}>{student.full_name}</span>
                          <span style={{ display: "block", color: "#94a3b8", fontSize: "11px", marginTop: "4px" }}>
                            Adm No: {student.admission_no}{student.class_room?.name ? ` · ${student.class_room.name}` : ""}
                            {student.parent_id && ` · Parent: ${student.parent?.name ?? "Linked"}`}
                            {student.secondary_parent_id && ` · Second parent: ${student.secondary_parent?.name ?? "Linked"}`}
                          </span>
                        </span>
                        <span style={{ color: alreadyLinked ? "#34d399" : selected ? "#93c5fd" : "#64748b", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {alreadyLinked ? "Already linked" : hasTwoParents ? "Two parents linked" : selected ? "Selected" : "Select"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {linkError && (
              <div role="alert" style={{ marginTop: "14px", padding: "11px 12px", borderRadius: "9px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: "12px" }}>
                {linkError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "22px", paddingTop: "16px", borderTop: "1px solid #263449", flexWrap: "wrap" }}>
              <button type="button" disabled={linkingStudent} onClick={() => setShowLinkStudent(false)} style={{ padding: "10px 16px", borderRadius: "9px", background: "#1e293b", border: "1px solid #334155", color: "#cbd5e1", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button type="button" disabled={selectedStudentId === null || linkingStudent} onClick={linkStudentToParent} style={{ padding: "10px 16px", borderRadius: "9px", background: "linear-gradient(135deg, #2563eb, #4f46e5)", border: "none", color: "#fff", fontWeight: 700, cursor: selectedStudentId === null || linkingStudent ? "not-allowed" : "pointer", opacity: selectedStudentId === null || linkingStudent ? 0.55 : 1 }}>
                {linkingStudent ? "Linking…" : "Link student"}
              </button>
            </div>
          </section>
        </div>
      )}

    </div>
  );
}