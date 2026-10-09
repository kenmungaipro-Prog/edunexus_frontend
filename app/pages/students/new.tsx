// ============================================================
// app/pages/students/new.tsx
// ============================================================
import { useEffect, useState } from "react";
import { Link, useNavigation, redirect, Form } from "react-router";
import type { Route } from "./+types/new";
import { api, type ClassRoom, type CreateClassPayload, type CreateStudentPayload, type ParentProfile, type Subject, type Teacher } from "~/lib/api";
import { validateClassRoom, validateStudent } from "~/lib/validation";

export async function clientLoader() {
  const [classesRes, teachersRes, subjectsRes] = await Promise.all([
    api.classes.list({ per_page: 100 }),
    api.teachers.list({ per_page: 200 }),
    api.subjects.list(),
  ]);
  const teachers = ((teachersRes as any).data?.data ?? (teachersRes as any).data ?? []) as Teacher[];
  const subjects = ((subjectsRes as any).data?.data ?? (subjectsRes as any).data ?? []) as Subject[];
  return { classes: classesRes.data as ClassRoom[], teachers, subjects };
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
  if (payload.secondary_parent_id) payload.secondary_parent_id = Number(payload.secondary_parent_id) as unknown as typeof payload.secondary_parent_id;

  // Frontend validation
  const validationErrors = validateStudent(payload);
  if (Object.keys(validationErrors).length > 0) {
    return {
      error: "Please fix the highlighted errors below.",
      errors: validationErrors,
    };
  }

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
  const { classes, teachers, subjects } = loaderData as { classes: ClassRoom[]; teachers: Teacher[]; subjects: Subject[] };
  const [availableClasses, setAvailableClasses] = useState<ClassRoom[]>(classes);
  const errors      = (actionData as { errors?: Record<string, string[]> })?.errors ?? {};
  const globalError = (actionData as { error?: string })?.error;
  const navigation  = useNavigation();
  const submitting  = navigation.state === "submitting";

  const [selectedClassId, setSelectedClassId] = useState("");
  const [showClassModal, setShowClassModal] = useState(false);
  const [classSaving, setClassSaving] = useState(false);
  const [classModalError, setClassModalError] = useState<string | null>(null);
  const [classModalErrors, setClassModalErrors] = useState<Record<string, string[]>>({});
  const [classNotice, setClassNotice] = useState<string | null>(null);
  const [classFields, setClassFields] = useState({ name: "", grade: "", section: "", capacity: "", class_teacher_id: "", room: "" });
  const [classSubjectQuery, setClassSubjectQuery] = useState("");
  const [selectedClassSubjects, setSelectedClassSubjects] = useState<number[]>([]);

  const filteredClassSubjects = subjects.filter((subject) => {
    const query = classSubjectQuery.trim().toLowerCase();
    return !query ||
      subject.name.toLowerCase().includes(query) ||
      (subject.code ?? "").toLowerCase().includes(query);
  });
  const visibleClassSubjectIds = filteredClassSubjects.map((subject) => subject.id);
  const allVisibleClassSubjectsSelected =
    visibleClassSubjectIds.length > 0 &&
    visibleClassSubjectIds.every((id) => selectedClassSubjects.includes(id));

  const [parentQuery, setParentQuery] = useState("");
  const [parentOptions, setParentOptions] = useState<ParentProfile[]>([]);
  const [selectedParent, setSelectedParent] = useState<ParentProfile | null>(null);
  const [secondaryParentQuery, setSecondaryParentQuery] = useState("");
  const [secondaryParentOptions, setSecondaryParentOptions] = useState<ParentProfile[]>([]);
  const [selectedSecondaryParent, setSelectedSecondaryParent] = useState<ParentProfile | null>(null);
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [showParentModal, setShowParentModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalFields, setModalFields] = useState({
    name: "",
    email: "",
    password: "",
    relationship: "",
    phone: "",
    address: "",
    occupation: "",
    notes: "",
  });

  useEffect(() => {
    if (!showClassModal) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !classSaving) setShowClassModal(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showClassModal, classSaving]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!parentQuery.trim()) {
        setParentOptions([]);
        return;
      }

      try {
        const res = await api.parents.list({ per_page: 10, search: parentQuery });
        setParentOptions(res.data.data ?? []);
      } catch {
        setParentOptions([]);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [parentQuery]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!secondaryParentQuery.trim()) {
        setSecondaryParentOptions([]);
        return;
      }

      try {
        const res = await api.parents.list({ per_page: 10, search: secondaryParentQuery });
        setSecondaryParentOptions(
          (res.data.data ?? []).filter((parent) => parent.user_id !== selectedParent?.user_id)
        );
      } catch {
        setSecondaryParentOptions([]);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [secondaryParentQuery, selectedParent?.user_id]);

  function handleParentSelect(parent: ParentProfile) {
    if (selectedSecondaryParent?.user_id === parent.user_id) clearSelectedSecondaryParent();
    setSelectedParent(parent);
    setParentQuery(parent.user?.name ?? "");
    setParentEmail(parent.user?.email ?? "");
    setParentPhone(parent.phone ?? "");
    setParentOptions([]);
  }

  function handleSecondaryParentSelect(parent: ParentProfile) {
    if (selectedParent?.user_id === parent.user_id) return;
    setSelectedSecondaryParent(parent);
    setSecondaryParentQuery(parent.user?.name ?? "");
    setSecondaryParentOptions([]);
  }

  function clearSelectedParent() {
    setSelectedParent(null);
    setParentQuery("");
    setParentEmail("");
    setParentPhone("");
    setParentOptions([]);
    setSecondaryParentOptions((current) => current.filter((parent) => parent.user_id !== selectedParent?.user_id));
  }

  function clearSelectedSecondaryParent() {
    setSelectedSecondaryParent(null);
    setSecondaryParentQuery("");
    setSecondaryParentOptions([]);
  }

  async function handleParentSaved(parent: ParentProfile) {
    setSelectedParent(parent);
    setParentQuery(parent.user?.name ?? "");
    setParentEmail(parent.user?.email ?? "");
    setParentPhone(parent.phone ?? "");
    setShowParentModal(false);
    setModalError(null);
    setModalFields({
      name: "",
      email: "",
      password: "",
      relationship: "",
      phone: "",
      address: "",
      occupation: "",
      notes: "",
    });
  }

  function toggleClassSubject(id: number) {
    setSelectedClassSubjects((current) =>
      current.includes(id) ? current.filter((subjectId) => subjectId !== id) : [...current, id]
    );
  }

  function toggleVisibleClassSubjects() {
    setSelectedClassSubjects((current) => {
      if (allVisibleClassSubjectsSelected) {
        return current.filter((id) => !visibleClassSubjectIds.includes(id));
      }
      return [...new Set([...current, ...visibleClassSubjectIds])];
    });
  }

  async function handleClassCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: CreateClassPayload = {
      name: classFields.name.trim(),
      grade: Number(classFields.grade),
      section: classFields.section.trim(),
      capacity: Number(classFields.capacity),
      subjects: selectedClassSubjects,
      ...(classFields.class_teacher_id ? { class_teacher_id: Number(classFields.class_teacher_id) } : {}),
      ...(classFields.room.trim() ? { room: classFields.room.trim() } : {}),
    };
    const validationErrors = validateClassRoom({ ...payload });
    setClassModalErrors(Object.fromEntries(Object.entries(validationErrors).map(([field, message]) => [field, [message]])));
    setClassModalError(null);
    if (Object.keys(validationErrors).length > 0) return;

    setClassSaving(true);
    try {
      const response = await api.classes.create(payload);
      const createdClass = response.data;
      setAvailableClasses((current) => [
        ...current.filter((classRoom) => classRoom.id !== createdClass.id),
        createdClass,
      ]);
      setClassNotice(`${createdClass.name} was added. Select it from the class list.`);
      setShowClassModal(false);
      setClassFields({ name: "", grade: "", section: "", capacity: "", class_teacher_id: "", room: "" });
      setSelectedClassSubjects([]);
      setClassSubjectQuery("");
      setClassModalErrors({});
    } catch (error: unknown) {
      const apiError = error as { message?: string; errors?: Record<string, string[]> };
      setClassModalError(apiError?.message ?? "Could not add this class. Please check your details and try again.");
      if (apiError?.errors) {
        setClassModalErrors(apiError.errors);
      }
    } finally {
      setClassSaving(false);
    }
  }

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
          <div style={{ maxWidth: "380px" }} className="responsive-full-width">
            <Field label="Class / Section" required error={errors.class_id?.[0]}>
              <select name="class_id" required value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)} style={{ ...s.select, ...(errors.class_id ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="" disabled>Select a class…</option>
                {availableClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  setClassModalError(null);
                  setClassModalErrors({});
                  setShowClassModal(true);
                }}
                style={{ color: "#75a7ff", background: "none", border: "none", padding: 0, fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'Sora', sans-serif" }}
              >
                + Add a new class
              </button>
              {classNotice && <span role="status" style={{ color: "#4ade80", fontSize: "11px" }}>{classNotice}</span>}
            </div>
          </div>
        </div>

        {/* Parent / Guardian */}
        <div style={s.card} className="responsive-card">
          <div style={s.sectionTitle}><SectionIcon emoji="👨‍👩‍👧" /> Parent / Guardian</div>

          <div style={{ background: "rgba(79,142,247,0.04)", border: "1px solid rgba(79,142,247,0.12)", borderRadius: "9px", padding: "12px 14px", marginBottom: "18px", fontSize: "12px", color: "#6b7a99" }}>
            💡 Search parents by name and select an existing guardian to auto-fill their contact details. If the parent does not exist, click <button type="button" onClick={() => setShowParentModal(true)} style={{ color: "#4f8ef7", textDecoration: "underline", background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "12px" }}>Add new parent</button>.
          </div>

          <div style={s.grid3} className="responsive-grid-3">
            <Field label="Primary Parent / Guardian" required error={errors.parent_id?.[0]} hint="Start typing a guardian name to search existing parent accounts.">
              <div style={{ position: "relative" }}>
                <input
                  name="parent_name"
                  value={selectedParent ? selectedParent.user?.name ?? "" : parentQuery}
                  onChange={(event) => {
                    clearSelectedParent();
                    setParentQuery(event.target.value);
                  }}
                  placeholder="Search parent by name..."
                  style={{ ...s.input, ...(errors.parent_id ? s.inputError : {} ) }}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  autoComplete="off"
                />
                {parentOptions.length > 0 && (
                  <div style={{ position: "absolute", zIndex: 10, top: "100%", left: 0, right: 0, background: "#0a0e1a", border: "1px solid #2a3350", borderRadius: "8px", marginTop: "6px", maxHeight: "220px", overflowY: "auto" }}>
                    {parentOptions.map((parent) => (
                      <button
                        type="button"
                        key={parent.id}
                        onMouseDown={() => handleParentSelect(parent)}
                        style={{ width: "100%", textAlign: "left", padding: "10px 12px", background: "#0a0e1a", border: "none", color: "#e2e8f0", cursor: "pointer" }}
                      >
                        {parent.user?.name}{parent.phone ? ` • ${parent.phone}` : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>

            <Field label="Email Address" error={errors.parent_email?.[0]} hint="Auto-filled from selected parent.">
              <input
                name="parent_email"
                type="email"
                value={selectedParent ? selectedParent.user?.email ?? "" : parentEmail}
                onChange={(event) => {
                  if (selectedParent) {
                    clearSelectedParent();
                  }
                  setParentEmail(event.target.value);
                }}
                placeholder="john@example.com"
                style={{ ...s.input, ...(errors.parent_email ? s.inputError : {}) }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </Field>

            <Field label="Phone Number" required error={errors.parent_phone?.[0]} hint="Required. e.g. +254 712 345 678">
              <input
                name="parent_phone"
                type="tel"
                value={selectedParent ? selectedParent.phone ?? "" : parentPhone}
                onChange={(event) => {
                  if (selectedParent) {
                    clearSelectedParent();
                  }
                  setParentPhone(event.target.value);
                }}
                required
                placeholder="+254 7XX XXX XXX"
                style={{ ...s.input, ...(errors.parent_phone ? s.inputError : {}) }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </Field>
          </div>

          {selectedParent?.user?.id && (
            <input type="hidden" name="parent_id" value={selectedParent.user.id} />
          )}

          <div style={{ maxWidth: "420px", marginTop: "16px" }}>
            <Field label="Second Parent / Guardian" hint="Optional. A student can be linked to up to two parent accounts.">
              <div style={{ position: "relative" }}>
                <input
                  value={selectedSecondaryParent?.user?.name ?? secondaryParentQuery}
                  onChange={(event) => {
                    setSelectedSecondaryParent(null);
                    setSecondaryParentQuery(event.target.value);
                  }}
                  placeholder="Search for a second parent..."
                  style={s.input}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  autoComplete="off"
                />
                {secondaryParentOptions.length > 0 && (
                  <div style={{ position: "absolute", zIndex: 10, top: "100%", left: 0, right: 0, background: "#0a0e1a", border: "1px solid #2a3350", borderRadius: "8px", marginTop: "6px", maxHeight: "220px", overflowY: "auto" }}>
                    {secondaryParentOptions.map((parent) => (
                      <button
                        type="button"
                        key={parent.id}
                        onMouseDown={() => handleSecondaryParentSelect(parent)}
                        style={{ width: "100%", textAlign: "left", padding: "10px 12px", background: "#0a0e1a", border: "none", color: "#e2e8f0", cursor: "pointer" }}
                      >
                        {parent.user?.name}{parent.phone ? ` • ${parent.phone}` : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedSecondaryParent && (
                <button type="button" onClick={clearSelectedSecondaryParent} style={{ marginTop: "7px", background: "none", border: "none", color: "#75a7ff", cursor: "pointer", padding: 0, fontSize: "11px" }}>
                  Remove second parent
                </button>
              )}
            </Field>
          </div>

          {selectedSecondaryParent?.user_id && (
            <input type="hidden" name="secondary_parent_id" value={selectedSecondaryParent.user_id} />
          )}

          {showParentModal && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", overflowY: "auto" }}>
              <div style={{ width: "100%", maxWidth: "640px", background: "#0f1424", borderRadius: "18px", padding: "24px", border: "1px solid #2a3350", boxSizing: "border-box", position: "relative", maxHeight: "calc(100vh - 60px)", overflowY: "auto" }}>
                <button type="button" onClick={() => setShowParentModal(false)} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: "#a0aec0", fontSize: "22px", cursor: "pointer" }}>×</button>
                <h2 style={{ margin: 0, fontSize: "clamp(20px, 4vw, 24px)", color: "#e2e8f0" }}>Register New Parent</h2>
                <p style={{ marginTop: "10px", color: "#94a3b8" }}>Enter the parent details below. Closing without saving will discard the information.</p>
                <div style={{ display: "grid", gap: "16px", marginTop: "20px" }}>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={s.label}>Full Name</label>
                    <input value={modalFields.name} onChange={(event) => setModalFields({ ...modalFields, name: event.target.value })} placeholder="Parent name" style={s.input} />
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={s.label}>Email address</label>
                    <input value={modalFields.email} onChange={(event) => setModalFields({ ...modalFields, email: event.target.value })} type="email" placeholder="parent@example.com" style={s.input} />
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={s.label}>Password</label>
                    <input value={modalFields.password} onChange={(event) => setModalFields({ ...modalFields, password: event.target.value })} type="password" placeholder="Leave empty for default" style={s.input} />
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={s.label}>Relationship</label>
                    <input value={modalFields.relationship} onChange={(event) => setModalFields({ ...modalFields, relationship: event.target.value })} placeholder="Mother, Father, Guardian" style={s.input} />
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={s.label}>Phone</label>
                    <input value={modalFields.phone} onChange={(event) => setModalFields({ ...modalFields, phone: event.target.value })} placeholder="+254 7XX XXX XXX" style={s.input} />
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={s.label}>Occupation</label>
                    <input value={modalFields.occupation} onChange={(event) => setModalFields({ ...modalFields, occupation: event.target.value })} placeholder="Occupation" style={s.input} />
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={s.label}>Address</label>
                    <textarea value={modalFields.address} onChange={(event) => setModalFields({ ...modalFields, address: event.target.value })} rows={3} placeholder="Street / City / County" style={s.textarea} />
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={s.label}>Notes</label>
                    <textarea value={modalFields.notes} onChange={(event) => setModalFields({ ...modalFields, notes: event.target.value })} rows={3} placeholder="Optional notes" style={s.textarea} />
                  </div>
                  {modalError && <div style={{ color: "#f87171", fontSize: "13px" }}>{modalError}</div>}
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button type="button" onClick={() => setShowParentModal(false)} style={{ flex: 1, padding: "12px 18px", borderRadius: "10px", background: "#1e2640", border: "1px solid #2a3350", color: "#a0aec0", cursor: "pointer" }}>Cancel</button>
                    <button
                      type="button"
                      disabled={modalLoading}
                      onClick={async () => {
                        setModalLoading(true);
                        setModalError(null);
                        try {
                          const res = await api.parents.create({
                            name: modalFields.name,
                                email: modalFields.email?.trim() || undefined,
                            password: modalFields.password || undefined,
                            relationship: modalFields.relationship || undefined,
                            phone: modalFields.phone || undefined,
                            address: modalFields.address || undefined,
                            occupation: modalFields.occupation || undefined,
                            notes: modalFields.notes || undefined,
                          });
                          await handleParentSaved(res.data);
                        } catch (error: unknown) {
                          setModalError((error as { message?: string })?.message ?? "Failed to save parent. Please check the fields.");
                        } finally {
                          setModalLoading(false);
                        }
                      }}
                      style={{ flex: 1, padding: "12px 18px", borderRadius: "10px", border: "none", background: "#4f8ef7", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                    >
                      {modalLoading ? "Saving…" : "Save Parent"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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

      {showClassModal && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !classSaving) setShowClassModal(false);
          }}
          style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(3, 7, 18, 0.78)", backdropFilter: "blur(6px)", overflowY: "auto" }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-class-title"
            style={{ width: "100%", maxWidth: "780px", maxHeight: "calc(100vh - 40px)", overflowY: "auto", background: "linear-gradient(145deg, #121a2e, #0d1220)", border: "1px solid #293555", borderRadius: "20px", padding: "clamp(20px, 4vw, 32px)", boxSizing: "border-box", boxShadow: "0 24px 80px rgba(0,0,0,0.55)" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "24px" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "999px", background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.2)", color: "#75a7ff", fontSize: "11px", fontWeight: 700, marginBottom: "12px" }}>
                  🏫 Academic Setup
                </div>
                <h2 id="add-class-title" style={{ margin: 0, color: "#e2e8f0", fontSize: "22px", fontWeight: 700 }}>Add New Class Room</h2>
                <p style={{ margin: "7px 0 0", color: "#8391ad", fontSize: "13px", lineHeight: 1.6 }}>Configure the class details below. You can select it for the student after saving.</p>
              </div>
              <button type="button" aria-label="Close dialog" disabled={classSaving} onClick={() => setShowClassModal(false)} style={{ background: "#1b2439", border: "1px solid #2a3652", borderRadius: "9px", width: "36px", height: "36px", color: "#a0aec0", fontSize: "21px", cursor: "pointer", flexShrink: 0 }}>×</button>
            </div>

            {classModalError && (
              <div role="alert" style={{ ...s.errorBanner, marginBottom: "20px" }}>
                <span>⚠</span>
                <div>{classModalError}</div>
              </div>
            )}

            <form onSubmit={handleClassCreate} noValidate style={{ background: "rgba(15,23,42,0.72)", border: "1px solid rgba(51,65,85,0.7)", borderRadius: "18px", padding: "clamp(16px, 3vw, 26px)", display: "grid", gap: "22px" }}>
              <div style={s.grid2} className="responsive-grid-2">
                <Field label="Class Name" required error={classModalErrors.name?.[0]}>
                  <input autoFocus required maxLength={50} value={classFields.name} onChange={(event) => setClassFields({ ...classFields, name: event.target.value })} placeholder="e.g. Form 4 East" style={{ ...s.input, marginTop: "8px", ...(classModalErrors.name ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
                </Field>
                <Field label="Grade Level" required error={classModalErrors.grade?.[0]}>
                  <input required type="number" min="1" max="12" value={classFields.grade} onChange={(event) => setClassFields({ ...classFields, grade: event.target.value })} placeholder="1-12" style={{ ...s.input, marginTop: "8px", ...(classModalErrors.grade ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
                </Field>
              </div>

              <div style={s.grid2} className="responsive-grid-2">
                <Field label="Section" required error={classModalErrors.section?.[0]} hint="For example: A, B, or North">
                  <input required maxLength={5} value={classFields.section} onChange={(event) => setClassFields({ ...classFields, section: event.target.value })} placeholder="e.g. A, B, North" style={{ ...s.input, marginTop: "8px", ...(classModalErrors.section ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
                </Field>
                <Field label="Capacity" required error={classModalErrors.capacity?.[0]}>
                  <input required type="number" min="1" value={classFields.capacity} onChange={(event) => setClassFields({ ...classFields, capacity: event.target.value })} placeholder="e.g. 40" style={{ ...s.input, marginTop: "8px", ...(classModalErrors.capacity ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
                </Field>
              </div>

              <div style={s.grid2} className="responsive-grid-2">
                <Field label="Class Teacher" error={classModalErrors.class_teacher_id?.[0]}>
                  <select value={classFields.class_teacher_id} onChange={(event) => setClassFields({ ...classFields, class_teacher_id: event.target.value })} style={{ ...s.select, marginTop: "8px" }} onFocus={focusStyle} onBlur={blurStyle}>
                    <option value="">No teacher assigned</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>{teacher.user?.name ?? `Teacher #${teacher.id}`}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Room Location" error={classModalErrors.room?.[0]}>
                  <input maxLength={50} value={classFields.room} onChange={(event) => setClassFields({ ...classFields, room: event.target.value })} placeholder="e.g. Lab 3 / Room 102" style={{ ...s.input, marginTop: "8px", ...(classModalErrors.room ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
                </Field>
              </div>

              <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                <legend style={{ ...s.label, marginBottom: "8px" }}>Assigned Subjects</legend>
                {selectedClassSubjects.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                    {subjects.filter((subject) => selectedClassSubjects.includes(subject.id)).map((subject) => (
                      <span key={subject.id} style={{ display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "999px", background: "#1e293b", border: "1px solid #334155", padding: "5px 10px", color: "#e2e8f0", fontSize: "12px" }}>
                        {subject.name}
                        <button type="button" aria-label={`Remove ${subject.name}`} onClick={() => toggleClassSubject(subject.id)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ border: "1px solid #2a3350", borderRadius: "14px", background: "rgba(2,6,23,0.55)", padding: "14px" }}>
                  {subjects.length === 0 ? (
                    <p style={{ color: "#6b7a99", fontSize: "12px", textAlign: "center", padding: "20px 0", margin: 0 }}>No subjects available in the system.</p>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
                        <div>
                          <p style={{ margin: 0, color: "#e2e8f0", fontSize: "13px", fontWeight: 600 }}>Pick subjects for this class</p>
                          <p style={{ margin: "4px 0 0", color: "#6b7a99", fontSize: "11px" }}>Search, select, or remove subjects from the list below.</p>
                        </div>
                        <button type="button" onClick={toggleVisibleClassSubjects} style={{ border: "1px solid #334155", borderRadius: "10px", padding: "7px 10px", background: "#1e293b", color: "#cbd5e1", cursor: "pointer", fontSize: "12px" }}>
                          {selectedClassSubjects.length} selected · {allVisibleClassSubjectsSelected ? "Deselect all" : "Select all"}
                        </button>
                      </div>
                      <input value={classSubjectQuery} onChange={(event) => setClassSubjectQuery(event.target.value)} placeholder="Search subjects..." style={{ ...s.input, marginBottom: "12px" }} />
                      <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                        <ul style={{ listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px", padding: 0, margin: 0 }}>
                          {filteredClassSubjects.map((subject) => (
                            <li key={subject.id}>
                              <label htmlFor={`new-class-subject-${subject.id}`} style={{ display: "flex", alignItems: "center", gap: "9px", minHeight: "44px", padding: "9px 10px", border: "1px solid #26324a", borderRadius: "10px", background: "rgba(15,23,42,0.65)", cursor: "pointer" }}>
                                <input id={`new-class-subject-${subject.id}`} type="checkbox" checked={selectedClassSubjects.includes(subject.id)} onChange={() => toggleClassSubject(subject.id)} style={{ accentColor: "#4f8ef7", flexShrink: 0 }} />
                                <span style={{ display: "grid", gap: "3px" }}>
                                  <span style={{ color: "#e2e8f0", fontSize: "12px", fontWeight: 600 }}>{subject.name}</span>
                                  {(subject.code || subject.type) && <span style={{ color: "#8391ad", fontSize: "10px" }}>{subject.code}{subject.code && subject.type ? " · " : ""}{subject.type}</span>}
                                </span>
                                {subject.exams_count ? <span style={{ marginLeft: "auto", color: "#6b7a99", fontSize: "10px", whiteSpace: "nowrap" }}>{subject.exams_count} exams</span> : null}
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </fieldset>

              <div style={{ display: "flex", gap: "12px", paddingTop: "18px", borderTop: "1px solid #26324a", flexWrap: "wrap" }}>
                <button type="button" disabled={classSaving} onClick={() => setShowClassModal(false)} style={{ ...s.btnCancel, flex: "1 1 140px", padding: "12px 18px" }}>Close</button>
                <button type="submit" disabled={classSaving} style={{ ...s.btnSubmit, flex: "2 1 220px", padding: "12px 18px", opacity: classSaving ? 0.7 : 1 }}>
                  {classSaving ? "Creating Class Room…" : "Create Class Room"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

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