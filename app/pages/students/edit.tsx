// ============================================================
// app/pages/students/edit.tsx
// ============================================================
import { Link, useNavigation, redirect, Form } from "react-router";
import type { Route } from "./+types/edit";
import api, { type Student, type ClassRoom, type UpdateStudentPayload } from "~/lib/api";

// ── Loader ──────────────────────────────────────────────────
export async function clientLoader({ params }: Route.LoaderArgs) {
  const [studentRes, classesRes] = await Promise.all([
    api.students.get(Number(params.id)),
    api.classes.list({ per_page: 100 }),
  ]);
  return {
    student: studentRes.data,
    // FIX: classes.list returns ApiResponse<ClassRoom[]>, .data is the array
    classes: classesRes.data as ClassRoom[],
  };
}

// ── Action ──────────────────────────────────────────────────
export async function clientAction({ request, params }: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw new Error(`Unsupported method: ${request.method}`);
  }

  const form = await request.formData();

  // Build payload, omitting blank strings so we don't accidentally clear optional fields
  const raw = Object.fromEntries(form.entries()) as Record<string, string>;
  const payload: UpdateStudentPayload = {};

  for (const [k, v] of Object.entries(raw)) {
    if (v === "" || v === undefined) continue;
    (payload as Record<string, unknown>)[k] = v;
  }

  // Coerce numeric fields
  if (payload.class_id) payload.class_id = Number(payload.class_id) as unknown as typeof payload.class_id;

  try {
    await api.students.update(Number(params.id), payload);
    return redirect(`/students/${params.id}`);
  } catch (e: unknown) {
    const err = e as { message?: string; errors?: Record<string, string[]> };
    return {
      error:  err?.message ?? "Update failed.",
      errors: err?.errors  ?? {},
    };
  }
}

// ── Shared styles ─────────────────────────────────────────────
const s = {
  page: { fontFamily: "'Sora', sans-serif", color: "#e2e8f0", maxWidth: "780px" } as React.CSSProperties,
  breadcrumb: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "13px" } as React.CSSProperties,
  heading: { fontSize: "22px", fontWeight: 700, marginBottom: "6px", letterSpacing: "-0.3px" } as React.CSSProperties,
  subheading: { fontSize: "13px", color: "#6b7a99", marginBottom: 0 } as React.CSSProperties,
  card: { background: "#0f1424", border: "1px solid #1e2640", borderRadius: "14px", padding: "28px", marginBottom: "16px" } as React.CSSProperties,
  sectionTitle: { fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#4f8ef7", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" } as React.CSSProperties,
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" } as React.CSSProperties,
  label: { display: "block", fontSize: "11px", fontWeight: 600, color: "#6b7a99", marginBottom: "6px", letterSpacing: "0.05em" } as React.CSSProperties,
  input: { width: "100%", boxSizing: "border-box" as const, background: "#0a0e1a", border: "1px solid #2a3350", borderRadius: "8px", padding: "9px 12px", fontSize: "13px", color: "#e2e8f0", outline: "none", transition: "border-color .15s", fontFamily: "'Sora', sans-serif" } as React.CSSProperties,
  inputError: { borderColor: "#ef4444" } as React.CSSProperties,
  fieldError: { fontSize: "11px", color: "#f87171", marginTop: "4px" } as React.CSSProperties,
  select: {
    width: "100%", boxSizing: "border-box" as const,
    background: "#0a0e1a", border: "1px solid #2a3350",
    borderRadius: "8px", padding: "9px 12px",
    fontSize: "13px", color: "#e2e8f0",
    outline: "none", transition: "border-color .15s",
    fontFamily: "'Sora', sans-serif", appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7a99' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "32px",
  } as React.CSSProperties,
  textarea: { width: "100%", boxSizing: "border-box" as const, background: "#0a0e1a", border: "1px solid #2a3350", borderRadius: "8px", padding: "9px 12px", fontSize: "13px", color: "#e2e8f0", outline: "none", transition: "border-color .15s", fontFamily: "'Sora', sans-serif", resize: "none" as const, lineHeight: 1.6 } as React.CSSProperties,
  errorBanner: { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#f87171", fontWeight: 600, display: "flex", alignItems: "flex-start", gap: "8px" } as React.CSSProperties,
  actions: { display: "flex", gap: "10px", paddingTop: "4px" } as React.CSSProperties,
  btnCancel: { flex: 1, padding: "11px 20px", background: "#1e2640", border: "1px solid #2a3350", borderRadius: "9px", color: "#a0aec0", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'Sora', sans-serif", transition: "all .15s", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" } as React.CSSProperties,
  btnSubmit: { flex: 2, padding: "11px 24px", background: "linear-gradient(135deg, #4f8ef7, #6366f1)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Sora', sans-serif", transition: "opacity .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" } as React.CSSProperties,
} as const;

// ── Field helpers ────────────────────────────────────────────
function focusStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = "#4f8ef7";
}
function blurStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = "#2a3350";
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      {children}
      {error && <p style={s.fieldError}>{error}</p>}
    </div>
  );
}

function SectionIcon({ emoji }: { emoji: string }) {
  return (
    <span style={{ width: "20px", height: "20px", borderRadius: "5px", background: "rgba(79,142,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}>
      {emoji}
    </span>
  );
}

/**
 * Safely converts any value to a string suitable for a controlled input.
 * Strips the time portion from ISO datetime strings so date inputs work correctly.
 */
function toInputStr(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (s === "null" || s === "undefined") return "";
  // Strip time portion from ISO dates: "2010-05-15T00:00:00.000Z" → "2010-05-15"
  const isoDate = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDate) return isoDate[1];
  return s;
}

// ── Component ────────────────────────────────────────────────
export default function StudentEditPage({ loaderData, actionData }: Route.ComponentProps) {
  const { student, classes } = loaderData as { student: Student; classes: ClassRoom[] };
  const errors      = (actionData as { errors?: Record<string, string[]> })?.errors ?? {};
  const globalError = (actionData as { error?: string })?.error;
  const navigation  = useNavigation();
  const submitting  = navigation.state === "submitting";

  return (
    <div style={s.page}>
      {/* Breadcrumb */}
      <div style={s.breadcrumb}>
        <Link to="/students" style={{ color: "#4f8ef7", textDecoration: "none", fontWeight: 600 }}>Students</Link>
        <span style={{ color: "#2a3350" }}>›</span>
        <Link to={`/students/${student.id}`} style={{ color: "#4f8ef7", textDecoration: "none", fontWeight: 600 }}>{student.full_name}</Link>
        <span style={{ color: "#2a3350" }}>›</span>
        <span style={{ color: "#6b7a99" }}>Edit</span>
      </div>

      {/* Header with avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg, #4f8ef7, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, flexShrink: 0 }}>
          {student.full_name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 style={s.heading}>Edit Student</h1>
          <p style={s.subheading}>{student.admission_no} · {student.class_room?.name ?? "—"}</p>
        </div>
      </div>

      {globalError && (
        <div style={s.errorBanner}>
          <span>⚠</span>
          <div>
            <div>{globalError}</div>
            {Object.keys(errors).length > 0 && (
              <ul style={{ margin: "8px 0 0", padding: "0 0 0 16px", fontSize: "12px", color: "#f87171" }}>
                {Object.entries(errors).map(([field, msgs]) => <li key={field}>{msgs[0]}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}

      <Form method="post">

        {/* ── Personal Information ── */}
        <div style={s.card}>
          <div style={s.sectionTitle}><SectionIcon emoji="👤" /> Personal Information</div>
          <div style={s.grid2}>
            <Field label="First Name" error={errors.first_name?.[0]}>
              <input name="first_name" defaultValue={toInputStr(student.first_name)} required style={{ ...s.input, ...(errors.first_name ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
            <Field label="Last Name" error={errors.last_name?.[0]}>
              <input name="last_name" defaultValue={toInputStr(student.last_name)} required style={{ ...s.input, ...(errors.last_name ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
            <Field label="Date of Birth" error={errors.date_of_birth?.[0]}>
              {/* FIX: toInputStr strips the time portion so type="date" gets "YYYY-MM-DD" */}
              <input name="date_of_birth" type="date" defaultValue={toInputStr(student.date_of_birth)} style={{ ...s.input, ...(errors.date_of_birth ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
            <Field label="Admission Date" error={errors.admission_date?.[0]}>
              <input name="admission_date" type="date" defaultValue={toInputStr(student.admission_date)} style={s.input} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
            <Field label="Gender" error={errors.gender?.[0]}>
              <select name="gender" defaultValue={toInputStr(student.gender)} style={s.select} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Blood Group" error={errors.blood_group?.[0]}>
              <select name="blood_group" defaultValue={toInputStr(student.blood_group)} style={s.select} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="">Not specified</option>
                {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Religion" error={errors.religion?.[0]}>
              <input name="religion" defaultValue={toInputStr(student.religion)} placeholder="Optional" style={s.input} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
            <Field label="Category" error={errors.category?.[0]}>
              <select name="category" defaultValue={toInputStr(student.category)} style={s.select} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="">Not specified</option>
                {["General", "OBC", "SC", "ST", "EWS"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ marginTop: "16px" }}>
            <Field label="Address" error={errors.address?.[0]}>
              <textarea name="address" rows={2} defaultValue={toInputStr(student.address)} style={s.textarea} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
          </div>
        </div>

        {/* ── Academic Details ── */}
        <div style={s.card}>
          <div style={s.sectionTitle}><SectionIcon emoji="🎓" /> Academic Details</div>
          <div style={s.grid2}>
            <Field label="Class / Section" error={errors.class_id?.[0]}>
              <select name="class_id" defaultValue={toInputStr(student.class_id)} style={{ ...s.select, ...(errors.class_id ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle}>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Enrolment Status" error={errors.status?.[0]}>
              <select name="status" defaultValue={toInputStr(student.status)} style={s.select} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="alumni">Alumni</option>
              </select>
            </Field>
          </div>

          {/* Read-only identifiers */}
          <div style={{ marginTop: "20px", background: "#0a0e1a", border: "1px solid #1e2640", borderRadius: "9px", padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[["Admission No", student.admission_no], ["Roll Number", student.roll_number]].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: "10px", color: "#4b5a7a", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "3px" }}>{label}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: "#a0aec0" }}>{val}</div>
              </div>
            ))}
            <div style={{ gridColumn: "1/-1" }}>
              <div style={{ fontSize: "11px", color: "#4b5a7a" }}>Admission number and roll number are system-generated and cannot be changed here.</div>
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div style={s.actions}>
          <Link to={`/students/${student.id}`} style={s.btnCancel}>Cancel</Link>
          <button type="submit" disabled={submitting} style={{ ...s.btnSubmit, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? (
              <>
                <span style={{ width: "13px", height: "13px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .6s linear infinite" }} />
                Saving…
              </>
            ) : "💾 Save Changes"}
          </button>
        </div>
      </Form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}