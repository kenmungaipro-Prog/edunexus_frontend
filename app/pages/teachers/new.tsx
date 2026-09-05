// ============================================================
// app/pages/teachers/new.tsx  — Mobile Responsive
// ============================================================
import { useState, useEffect } from "react";
import { Link, Form, redirect, useNavigation, useActionData } from "react-router";
import type { Route } from "./+types/new";
import { api } from "~/lib/api";
import { validateTeacher } from "~/lib/validation";

interface ActionErrors {
  name?:     string;
  email?:    string;
  dept?:     string;
  username?: string;
  password?: string;
  general?:  string;
}

interface Subject {
  id: number;
  name: string;
}

interface ClassRoom {
  id: number;
  name: string;
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const form = await request.formData();

  const name     = String(form.get("name")       ?? "").trim();
  const email    = String(form.get("email")      ?? "").trim();
  const dept     = String(form.get("department") ?? "").trim();
  const phone    = String(form.get("phone")      ?? "").trim();
  const password = String(form.get("password")   ?? "");
  const qualification = String(form.get("qualification") ?? "").trim();
  const experience_yrs = String(form.get("experience") ?? "").trim();
  const join_date = String(form.get("join_date") ?? "").trim();

  // Prepare payload for validation
  const payload = {
    name,
    email,
    phone,
    department: dept,
    qualification,
    experience_yrs: experience_yrs ? Number(experience_yrs) : undefined,
    join_date,
    gender: String(form.get("gender") || ""),
    dob: String(form.get("dob") || ""),
    nationality: String(form.get("nationality") || ""),
    employment_type: String(form.get("employment_type") || ""),
    salary: String(form.get("salary") || ""),
    bio: String(form.get("bio") || ""),
    status: String(form.get("status") ?? "active"),
    password,
  };

  // Frontend validation
  const validationErrors = validateTeacher(payload);
  if (Object.keys(validationErrors).length > 0) {
    return {
      errors: validationErrors,
    };
  }

  try {
    const selectedSubjects = Array.from(form.getAll("subject_ids")) as string[];

    const genderValue = String(form.get("gender") || "");
    const gender =
      genderValue === "male" ||
      genderValue === "female" ||
      genderValue === "other"
        ? genderValue
        : undefined;

    const statusValue = String(form.get("status") ?? "active");
    const status = (["active", "inactive", "on_leave"].includes(statusValue) 
      ? statusValue 
      : "active") as "active" | "inactive" | "on_leave";

    const emptyOrValue = (val: string): string | undefined => val.trim() === "" ? undefined : val.trim();

    await api.teachers.create({
      name,
      email,
      phone,
      gender,
      dob: emptyOrValue(String(form.get("dob") || "")),
      nationality: emptyOrValue(String(form.get("nationality") || "")),
      department: dept,
      qualification,
      experience_yrs: Number(experience_yrs) || 0,
      join_date,
      employment_type: emptyOrValue(String(form.get("employment_type") || "")),
      bio: emptyOrValue(String(form.get("bio") || "")),
      salary: emptyOrValue(String(form.get("salary") || "")) ? Number(form.get("salary")) : undefined,
      subjects: selectedSubjects.length > 0
        ? selectedSubjects.map(s => parseInt(s))
        : undefined,
      password,
      status,
    });
    return redirect("/teachers");
  } catch (err: any) {
    const backendErrors = err?.response?.data?.errors;
    if (backendErrors) {
      return {
        errors: {
          name: backendErrors.name?.[0],
          email: backendErrors.email?.[0],
          dept: backendErrors.department?.[0],
          password: backendErrors.password?.[0],
          general: err?.response?.data?.message ?? "Please resolve the highlighted errors below."
        } as ActionErrors
      };
    }
    return { errors: { general: err?.message ?? "Something went wrong. Please try again." } as ActionErrors };
  }
}

const DEPTS = [
  "Mathematics", "Science", "English", "Social Studies",
  "Computer", "Hindi", "Art", "Physical Education",
];

const STEPS = [
  { label: "Personal Info",        icon: "👤", desc: "Basic details & contact" },
  { label: "Professional",         icon: "💼", desc: "Employment & qualifications" },
  { label: "Subjects & Classes",   icon: "📚", desc: "Teaching assignments" },
  { label: "Account Setup",        icon: "🔐", desc: "Login credentials & role" },
];

export default function NewTeacherPage() {
  const actionData   = useActionData<typeof clientAction>();
  const navigation   = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const errors       = (actionData as { errors?: ActionErrors } | undefined)?.errors ?? {};

  const [step, setStep]             = useState(0);
  const [subjects, setSubjects]     = useState<Subject[]>([]);
  const [classRooms, setClassRooms] = useState<ClassRoom[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [selectedClassIds, setSelectedClassIds]     = useState<number[]>([]);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [dept,     setDept]     = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [subRes, classRes] = await Promise.all([
          api.subjects.list(),
          api.classes.list({ per_page: 999 }),
        ]);
        setSubjects(subRes.data || []);
        setClassRooms(classRes.data || []);
      } catch (err) {
        console.error("Failed to load subjects/classrooms:", err);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (errors.name || errors.email) {
      setStep(0);
    } else if (errors.dept) {
      setStep(1);
    } else if (errors.username || errors.password) {
      setStep(3);
    }
  }, [errors]);

  const initials = name.trim().split(" ").filter(Boolean).map(n => n[0]).join("").substring(0, 2).toUpperCase() || "?";
  const progress = ((step) / (STEPS.length - 1)) * 100;

  function validateStep(n: number): boolean {
    const errs: Record<string, string> = {};
    if (n === 0) {
      if (!name.trim())                          errs.name  = "Full name is required.";
      if (!email.trim() || !email.includes("@")) errs.email = "A valid email is required.";
    }
    if (n === 1) {
      if (!dept) errs.dept = "Department is required.";
    }
    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const next = () => { if (validateStep(step)) setStep(s => s + 1); };
  const back = () => { setStepErrors({}); setStep(s => s - 1); };

  function toggleSubject(id: number) {
    setSelectedSubjectIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  function toggleClass(id: number) {
    setSelectedClassIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  const Field = ({
    label, required, error, hint, children
  }: {
    label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
  }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
        {label}
        {required && <span className="text-red-400 text-sm leading-none">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-slate-600">{hint}</p>}
      {error && (
        <p className="text-[11px] text-red-400 flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500/20 text-center leading-3">!</span>
          {error}
        </p>
      )}
    </div>
  );

  const inputCls = (hasError?: boolean) =>
    `bg-slate-900/60 border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600
    outline-none transition-all w-full
    ${hasError
      ? "border-red-500/50 focus:border-red-500"
      : "border-slate-700/60 focus:border-blue-500/60 focus:bg-slate-900"}`;

  const selectCls = inputCls() + " cursor-pointer";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-12">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            to="/teachers"
            className="w-9 h-9 flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-400 rounded-xl hover:bg-slate-700 hover:text-slate-200 transition-all flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">Add New Teacher</h1>
            <p className="text-slate-500 text-sm mt-0.5">Create a staff profile in {STEPS.length} quick steps</p>
          </div>
        </div>

        {/* Avatar preview */}
        <div className="sm:ml-auto flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-500">Preview</p>
            <p className="text-xs text-slate-300 font-medium">{name || "—"}</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-500/20">
            {initials}
          </div>
        </div>
      </div>

      {/* ── Step Progress ─────────────────────────────────── */}
      <div className="mb-6">
        <div className="h-1 bg-slate-800 rounded-full mb-5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-4 gap-1 sm:gap-2">
          {STEPS.map(({ label, icon }, i) => {
            const isDone    = i < step;
            const isCurrent = i === step;
            return (
              <div key={label} className="flex-1">
                <div className={`
                  flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-1 sm:px-3 py-2 rounded-xl text-xs font-medium transition-all
                  ${isCurrent ? "bg-blue-500/10 border border-blue-500/25 text-blue-400" :
                    isDone ? "text-emerald-400" : "text-slate-600"}
                `}>
                  <span className={`
                    w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0
                    ${isDone ? "bg-emerald-500/20 text-emerald-400" :
                      isCurrent ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40" :
                      "bg-slate-800 text-slate-600"}
                  `}>
                    {isDone ? "✓" : i + 1}
                  </span>
                  <span className="leading-tight hidden md:block">{label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5">
        <span className="text-xl">{STEPS[step].icon}</span>
        <div>
          <p className="font-semibold text-slate-100">{STEPS[step].label}</p>
          <p className="text-xs text-slate-500">{STEPS[step].desc}</p>
        </div>
        <span className="ml-auto text-xs text-slate-600">Step {step + 1} of {STEPS.length}</span>
      </div>

      {errors.general && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3.5 bg-red-500/8 border border-red-500/25 text-red-400 text-sm rounded-xl">
          <span className="w-5 h-5 rounded-full bg-red-500/15 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">!</span>
          {errors.general}
        </div>
      )}

      <Form method="post">
        {selectedSubjectIds.map(id => (
          <input key={`subj-${id}`} type="hidden" name="subject_ids" value={id} />
        ))}
        {selectedClassIds.map(id => (
          <input key={`class-${id}`} type="hidden" name="classroom_ids" value={id} />
        ))}

        {/* ── Step 0: Personal Info ─────────────────────── */}
        <div className={`bg-slate-900/40 border border-slate-700/50 rounded-2xl p-4 sm:p-6 space-y-5 ${step === 0 ? "" : "hidden"}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Full Name" required error={stepErrors.name ?? errors.name}>
                <input
                  name="name" value={name}
                  onChange={e => setName(e.target.value)}
                  className={inputCls(!!(stepErrors.name ?? errors.name))}
                  placeholder="e.g. Amara Osei"
                />
              </Field>
            </div>

            <Field label="Email Address" required error={stepErrors.email ?? errors.email}>
              <input name="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputCls(!!(stepErrors.email ?? errors.email))}
                placeholder="teacher@school.edu" />
            </Field>

            <Field label="Phone Number">
              <input name="phone" type="tel" className={inputCls()}
                placeholder="+254 700 000 000" />
            </Field>

            <Field label="Gender">
              <select name="gender" className={selectCls}>
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
                <option>Prefer not to say</option>
              </select>
            </Field>

            <Field label="Date of Birth">
              <input name="dob" type="date" className={inputCls()} />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Nationality">
                <input name="nationality" className={inputCls()} placeholder="e.g. Kenyan" />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Step 1: Professional ──────────────────────── */}
        <div className={`bg-slate-900/40 border border-slate-700/50 rounded-2xl p-4 sm:p-6 space-y-5 ${step === 1 ? "" : "hidden"}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Department" required error={stepErrors.dept ?? errors.dept}>
                <select name="department" value={dept}
                  onChange={e => setDept(e.target.value)}
                  className={`${selectCls} ${stepErrors.dept || errors.dept ? "border-red-500/50" : ""}`}>
                  <option value="">Select department</option>
                  {DEPTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Qualification">
              <input name="qualification" className={inputCls()}
                placeholder="e.g. B.Ed Mathematics" />
            </Field>

            <Field label="Years of Experience">
              <input name="experience" type="number" min={0} max={50}
                className={inputCls()} placeholder="e.g. 5" />
            </Field>

            <Field label="Join Date">
              <input name="join_date" type="date" className={inputCls()} />
            </Field>

            <Field label="Employment Type">
              <select name="employment_type" className={selectCls}>
                <option value="">Select type</option>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Substitute</option>
              </select>
            </Field>

            <div className="sm:col-span-2">
              <Field label="Bio / Notes">
                <textarea name="bio" rows={3}
                  className={inputCls() + " resize-y min-h-[80px]"}
                  placeholder="Brief professional background, specialisms, or notes…" />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Step 2: Subjects & Classes ────────────────── */}
        <div className={`space-y-4 ${step === 2 ? "" : "hidden"}`}>
          <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">📖</span>
              <p className="text-sm font-semibold text-slate-200">Teaching Subjects</p>
              {selectedSubjectIds.length > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-medium">
                  {selectedSubjectIds.length} selected
                </span>
              )}
            </div>

            {loadingData ? (
              <p className="text-xs text-slate-600">Loading subjects...</p>
            ) : subjects.length === 0 ? (
              <p className="text-xs text-slate-600">No subjects available</p>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {subjects.map(subject => (
                  <label key={subject.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedSubjectIds.includes(subject.id)}
                      onChange={() => toggleSubject(subject.id)}
                      className="w-4 h-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">{subject.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">🏫</span>
              <p className="text-sm font-semibold text-slate-200">Assigned Classrooms</p>
              {selectedClassIds.length > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full text-xs font-medium">
                  {selectedClassIds.length} selected
                </span>
              )}
            </div>

            {loadingData ? (
              <p className="text-xs text-slate-600">Loading classrooms...</p>
            ) : classRooms.length === 0 ? (
              <p className="text-xs text-slate-600">No classrooms available</p>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {classRooms.map(classroom => (
                  <label key={classroom.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedClassIds.includes(classroom.id)}
                      onChange={() => toggleClass(classroom.id)}
                      className="w-4 h-4 rounded border-slate-600 text-violet-500 focus:ring-violet-500"
                    />
                    <span className="text-sm text-slate-300">{classroom.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Step 3: Account Setup ─────────────────────── */}
        <div className={`bg-slate-900/40 border border-slate-700/50 rounded-2xl p-4 sm:p-6 space-y-5 ${step === 3 ? "" : "hidden"}`}>
          <div className="flex items-center gap-4 p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="truncate">
              <p className="font-semibold text-slate-100 truncate">{name || "—"}</p>
              <p className="text-xs text-slate-500 truncate">{email || "—"} · {dept || "—"}</p>
            </div>
            <div className="ml-auto text-right flex-shrink-0 hidden sm:block">
              <p className="text-xs text-slate-500">{selectedSubjectIds.length} subjects</p>
              <p className="text-xs text-slate-500">{selectedClassIds.length} classes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Username" required error={errors.username} hint="Used for login">
              <input name="username" value={username}
                onChange={e => setUsername(e.target.value)}
                className={inputCls(!!errors.username)}
                placeholder="e.g. a.osei" />
            </Field>

            <Field label="Initial Password" required error={errors.password} hint="Minimum 8 characters">
              <div className="relative w-full">
                <input name="password" type={showPwd ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={inputCls(!!errors.password) + " pr-12"}
                  placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-xs select-none">
                  {showPwd ? "Hide" : "Show"}
                </button>
              </div>
              {password.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {[8, 12, 16].map((len, i) => (
                    <div key={len} className={`flex-1 h-0.5 rounded-full transition-colors ${
                      password.length >= len
                        ? i === 0 ? "bg-red-400" : i === 1 ? "bg-amber-400" : "bg-emerald-400"
                        : "bg-slate-700"
                    }`} />
                  ))}
                </div>
              )}
            </Field>

            <Field label="Role / Permissions">
              <select name="role" className={selectCls}>
                <option value="teacher">Teacher</option>
                <option value="class_teacher">Class Teacher</option>
                <option value="head_of_dept">Head of Department</option>
                <option value="admin">Admin</option>
              </select>
            </Field>

            <Field label="Account Status">
              <select name="status" className={selectCls}>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────── */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="w-full sm:w-auto">
            {step > 0 && (
              <button type="button" onClick={back}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/60 border border-slate-700 text-slate-400 text-sm rounded-xl hover:bg-slate-700 hover:text-slate-200 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link to="/teachers"
              className="text-center px-4 py-2.5 text-slate-500 text-sm rounded-xl hover:text-slate-300 transition-colors">
              Cancel
            </Link>

            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold rounded-xl hover:from-blue-400 hover:to-indigo-400 transition-all shadow-lg shadow-blue-500/20">
                Continue
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold rounded-xl hover:from-blue-400 hover:to-indigo-400 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Teacher
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </Form>
    </div>
  );
}
