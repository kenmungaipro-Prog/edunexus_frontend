// ============================================================
// app/pages/students/new.tsx
// ============================================================
import { useState } from "react";
import { Link, useNavigation, redirect, Form } from "react-router";
import type { Route } from "./+types/new";
import { api, type ClassRoom, type CreateStudentPayload } from "~/lib/api";

export async function clientLoader() {
  const res = await api.classes.list({ per_page: 100 });
  return { classes: res.data as ClassRoom[] };
}

export async function clientAction({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const raw = Object.fromEntries(form.entries()) as Record<string, string>;
  const payload: Partial<CreateStudentPayload> = {};

  for (const [k, v] of Object.entries(raw)) {
    if (v === "" || v === undefined) continue;
    (payload as Record<string, unknown>)[k] = v;
  }

  if (payload.class_id)   payload.class_id   = Number(payload.class_id)   as unknown as typeof payload.class_id;
  if (payload.parent_id)  payload.parent_id  = Number(payload.parent_id)  as unknown as typeof payload.parent_id;

  try {
    const res = await api.students.create(payload as CreateStudentPayload);
    const { redirect } = await import("react-router");
    return redirect(`/students/${res.data.id}`);
  } catch (e: unknown) {
    const err = e as { message?: string; errors?: Record<string, string[]> };
    return {
      error:  err?.message ?? "Failed to create student.",
      errors: err?.errors  ?? {},
    };
  }
}

const s = {
  page: { fontFamily: "'Sora', sans-serif", color: "#e2e8f0", maxWidth: "780px", margin: "0 auto", boxSizing: "border-box" } as React.CSSProperties,
  breadcrumb: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "13px", flexWrap: "wrap" as const } as React.CSSProperties,
  heading: { fontSize: "22px", fontWeight: 700, marginBottom: "6px", letterSpacing: "-0.3px" } as React.CSSProperties,
  subheading: { fontSize: "13px", color: "#6b7a99", marginBottom: "28px" } as React.CSSProperties,
  card: { background: "#0f1424", border: "1px solid #1e2640", borderRadius: "14px", padding: "28px", marginBottom: "16px", boxSizing: "border-box" } as React.CSSProperties,
  sectionTitle: { fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#4f8ef7", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" } as React.CSSProperties,
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" } as React.CSSProperties,
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" } as React.CSSProperties,
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

function focusStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = "#4f8ef7";
}
function blurStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = "#2a3350";
}

function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={s.label}>
        {label}
        {required && <span style={{ color: "#f87171", marginLeft: "3px" }}>*</span>}
      </label>
      {children}
      {hint && !error && <p style={{ fontSize: "11px", color: "#4b5a7a", marginTop: "4px" }}>{hint}</p>}
      {error && <p style={s.fieldError}>{error}</p>}
    </div>
  );
}

function SectionIcon({ emoji }: { emoji: string }) {
  return (
    <span style={{ width: "20px", height: "20px", borderRadius: "5px", background: "rgba(79,142,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", flexShrink: 0 }}>
      {emoji}
    </span>
  );
}

export default function NewStudentPage({ loaderData, actionData }: Route.ComponentProps) {
  const { classes } = loaderData as { classes: ClassRoom[] };
  const errors      = (actionData as { errors?: Record<string, string[]> })?.errors ?? {};
  const globalError = (actionData as { error?: string })?.error;
  const navigation  = useNavigation();
  const submitting  = navigation.state === "submitting";

  return (
    <div style={s.page} className="responsive-container">
      {/* Breadcrumb */}
      <div style={s.breadcrumb}>
        <Link to="/students" style={{ color: "#4f8ef7", textDecoration: "none", fontWeight: 600 }}>Students</Link>
        <span style={{ color: "#2a3350" }}>›</span>
        <span style={{ color: "#6b7a99" }}>New Student</span>
      </div>

      <h1 style={s.heading}>Add New Student</h1>
      <p style={s.subheading}>Fill in the details below to enrol a new student. Fields marked * are required.</p>

      {globalError && (
        <div style={s.errorBanner}>
          <span>⚠</span>
          <div>
            <div>{globalError}</div>
            {Object.keys(errors).length > 0 && (
              <ul style={{ margin: "8px 0 0", padding: "0 0 0 16px", fontSize: "12px", color: "#f87171" }}>
                {Object.entries(errors).map(([field, msgs]) => (
                  <li key={field}>{msgs[0]}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <Form method="post">
        {/* Personal Information */}
        <div style={s.card} className="responsive-card">
          <div style={s.sectionTitle}><SectionIcon emoji="👤" /> Personal Information</div>
          <div style={s.grid2} className="responsive-grid-2">
            <Field label="First Name" required error={errors.first_name?.[0]}>
              <input name="first_name" required placeholder="Amara" style={{ ...s.input, ...(errors.first_name ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
            <Field label="Last Name" required error={errors.last_name?.[0]}>
              <input name="last_name" required placeholder="Omondi" style={{ ...s.input, ...(errors.last_name ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
            <Field label="Date of Birth" required error={errors.date_of_birth?.[0]}>
              <input name="date_of_birth" type="date" required style={{ ...s.input, ...(errors.date_of_birth ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
            <Field label="Gender" required error={errors.gender?.[0]}>
              <select name="gender" required defaultValue="male" style={{ ...s.select, ...(errors.gender ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Blood Group" error={errors.blood_group?.[0]}>
              <select name="blood_group" defaultValue="" style={s.select} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="">Not specified</option>
                {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Religion" error={errors.religion?.[0]}>
              <input name="religion" placeholder="Optional" style={s.input} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
          </div>

          <div style={{ ...s.grid2, marginTop: "16px" }} className="responsive-grid-2">
            <Field label="Category" error={errors.category?.[0]}>
              <select name="category" defaultValue="" style={s.select} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="">Not specified</option>
                {["General", "OBC", "SC", "ST", "EWS"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Admission Date" error={errors.admission_date?.[0]}>
              <input name="admission_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} style={s.input} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
          </div>

          <div style={{ marginTop: "16px" }}>
            <Field label="Address" error={errors.address?.[0]}>
              <textarea name="address" rows={2} placeholder="Street / City / County" style={s.textarea} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
          </div>
        </div>

        {/* Academic Details */}
        <div style={s.card} className="responsive-card">
          <div style={s.sectionTitle}><SectionIcon emoji="🎓" /> Academic Details</div>
          <div style={{ maxWidth: "340px" }} className="responsive-full-width">
            <Field label="Class / Section" required error={errors.class_id?.[0]}>
              <select name="class_id" required defaultValue="" style={{ ...s.select, ...(errors.class_id ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="" disabled>Select a class…</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Parent / Guardian */}
        <div style={s.card} className="responsive-card">
          <div style={s.sectionTitle}><SectionIcon emoji="👨‍👩‍👧" /> Parent / Guardian</div>

          <div style={{ background: "rgba(79,142,247,0.04)", border: "1px solid rgba(79,142,247,0.12)", borderRadius: "9px", padding: "12px 14px", marginBottom: "18px", fontSize: "12px", color: "#6b7a99" }}>
            💡 If the parent already has an account, enter their email below and the system will link them automatically. A temporary password <strong style={{ color: "#a0aec0" }}>Parent@123</strong> will be set for new parent accounts.
          </div>

          <div style={s.grid3} className="responsive-grid-3">
            <Field label="Parent Name" error={errors.parent_name?.[0]} hint="Required only when creating a new parent account.">
              <input name="parent_name" placeholder="John Omondi" style={{ ...s.input, ...(errors.parent_name ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
            <Field label="Email Address" error={errors.parent_email?.[0]} hint="Enter an existing parent's email to link them, or provide a new email to create a parent account.">
              <input name="parent_email" type="email" placeholder="john@example.com" style={{ ...s.input, ...(errors.parent_email ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
            <Field label="Phone Number" error={errors.parent_phone?.[0]} hint="e.g. +254 712 345 678">
              <input name="parent_phone" type="tel" placeholder="+254 7XX XXX XXX" style={s.input} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div style={s.actions} className="responsive-actions">
          <Link to="/students" style={s.btnCancel}>Cancel</Link>
          <button type="submit" disabled={submitting} style={{ ...s.btnSubmit, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? (
              <>
                <span style={{ width: "13px", height: "13px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .6s linear infinite" }} />
                Saving…
              </>
            ) : "✅ Enrol Student"}
          </button>
        </div>
      </Form>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .responsive-container { padding: 12px !important; }
          .responsive-card { padding: 16px !important; }
          .responsive-grid-2 { grid-template-columns: 1fr !important; }
          .responsive-grid-3 { grid-template-columns: 1fr !important; }
          .responsive-full-width { max-width: 100% !important; }
          .responsive-actions { flex-direction: column !important; }
          .responsive-actions > * { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}