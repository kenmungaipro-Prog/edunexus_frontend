// ============================================================
// app/pages/teachers/edit.tsx — Database-driven form (Mobile Responsive)
// ============================================================
import { useState, useEffect } from "react";
import {
  Link,
  Form,
  redirect,
  useNavigation,
  useActionData,
} from "react-router";
import type { Route } from "./+types/edit";
import { api } from "~/lib/api";

// ── Types ────────────────────────────────────────────────────
interface ActionErrors {
  name?:     string;
  email?:    string;
  dept?:     string;
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

// ── Loader ───────────────────────────────────────────────────
export async function clientLoader({ params }: Route.LoaderArgs) {
  try {
    const [teacherRes, subjectsRes, classesRes] = await Promise.all([
      api.teachers.get(Number(params.id)),
      api.subjects.list(),
      api.classes.list({ per_page: 999 }),
    ]);

    const teacher = teacherRes.data;
    const subjects = subjectsRes.data;
    const classes = classesRes.data;

    if (!teacher) {
      throw new Error("Teacher data not found in API response. Check console for details.");
    }
    
    return {
      teacher,
      allSubjects: subjects,
      allClasses: classes,
    };
  } catch (error: any) {
    console.error("Error loading teacher:", error);
    throw new Error(`Failed to load teacher: ${error?.message || "Unknown error"}`);
  }
}

// ── Action ───────────────────────────────────────────────────
export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const form = await request.formData();
  const errors: ActionErrors = {};
  
  const name   = String(form.get("name")       ?? "").trim();
  const email  = String(form.get("email")      ?? "").trim();
  const dept   = String(form.get("department") ?? "").trim();

  if (!name)                           errors.name   = "Full name is required.";
  if (!email || !email.includes("@")) errors.email  = "A valid email is required.";
  if (!dept)                           errors.dept   = "Department is required.";

  if (Object.keys(errors).length > 0) return { errors };

  try {
    const selectedSubjects = Array.from(form.getAll("subject_ids")) as string[];
    const selectedClasses  = Array.from(form.getAll("classroom_ids")) as string[];
    const genderValue = String(form.get("gender") || "");

    const gender =
      genderValue === "male" ||
      genderValue === "female" ||
      genderValue === "other"
        ? genderValue
        : undefined;

    await api.teachers.update(Number(params.id), {
      name, 
      email,
      phone: String(form.get("phone") || "") || undefined,
      gender,
      dob:             String(form.get("dob") || "") || undefined,
      nationality:     String(form.get("nationality") || "") || undefined,
      department:      dept,
      qualification: String(form.get("qualification") || "") || undefined,
      experience_yrs:  Number(form.get("experience") ?? 0) || undefined,
      join_date: String(form.get("join_date") || "") || undefined,
      employment_type: String(form.get("employment_type") || "") || undefined,
      bio:             String(form.get("bio") || "") || undefined,
      subjects:        selectedSubjects.length > 0 
        ? selectedSubjects.map(s => parseInt(s))
        : undefined,
      status: (String(form.get("status") || "active")) as "active" | "inactive" | "on_leave",
    });
    return redirect(`/teachers/${params.id}`);
  } catch (err: any) {
    const backendErrors = err?.response?.data?.errors;
    if (backendErrors) {
      return {
        errors: {
          name: backendErrors.name?.[0],
          email: backendErrors.email?.[0],
          dept: backendErrors.department?.[0],
          general: err?.response?.data?.message ?? "Please resolve the highlighted errors below."
        } as ActionErrors
      };
    }
    return { errors: { general: err?.message ?? "Failed to update teacher. Please try again." } as ActionErrors };
  }
}

const DEPTS = [
  "Mathematics", "Science", "English", "Social Studies",
  "Computer", "Hindi", "Art", "Physical Education",
];

export default function EditTeacherPage({ loaderData }: Route.ComponentProps) {
  const { teacher, allSubjects, allClasses }  = loaderData as any;
  const actionData   = useActionData<typeof clientAction>();
  const navigation   = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const errors       = (actionData as { errors?: ActionErrors } | undefined)?.errors ?? {};

  const [name, setName]       = useState(teacher?.user?.name ?? "");
  const [email, setEmail]     = useState(teacher?.user?.email ?? "");
  const [dept, setDept]       = useState(teacher?.department ?? "");
  
  const initialSubjectIds = Array.isArray(teacher?.subjects) 
    ? teacher.subjects.map((s: any) => s.id) 
    : [];
  const initialClassIds = Array.isArray(teacher?.classRooms) 
    ? teacher.classRooms.map((c: any) => c.id) 
    : [];

  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>(initialSubjectIds);
  const [selectedClassIds, setSelectedClassIds]     = useState<number[]>(initialClassIds);

  const initials = name.trim().split(" ").filter(Boolean).map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "?";

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
    <div className="max-w-3xl mx-auto text-slate-200 px-4 sm:px-6 pb-12">
      
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            to={`/teachers/${teacher?.id}`}
            className="w-9 h-9 flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-400 rounded-xl hover:bg-slate-700 hover:text-slate-200 transition-all flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">Edit Teacher Profile</h1>
            <div className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500 mt-0.5">
              <span>Updating profile for</span>
              <span className="font-semibold text-slate-400">{teacher?.user?.name}</span>
            </div>
          </div>
        </div>

        {/* Avatar preview */}
        <div className="sm:ml-auto flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-amber-500/20">
            {initials}
          </div>
        </div>
      </div>

      {errors.general && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3.5 bg-red-500/8 border border-red-500/25 text-red-400 text-sm rounded-xl">
          <span className="w-5 h-5 rounded-full bg-red-500/15 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">!</span>
          {errors.general}
        </div>
      )}

      <Form method="post" className="space-y-6">
        {selectedSubjectIds.map(id => (
          <input key={`subj-${id}`} type="hidden" name="subject_ids" value={id} />
        ))}
        {selectedClassIds.map(id => (
          <input key={`class-${id}`} type="hidden" name="classroom_ids" value={id} />
        ))}

        {/* ── Section 1: Personal Info ──────────────────── */}
        <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
            <span className="text-lg">👤</span>
            <h2 className="font-semibold text-slate-200">Personal Information</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="sm:col-span-2">
              <Field label="Full Name" required error={errors.name}>
                <input
                  name="name" value={name}
                  onChange={e => setName(e.target.value)}
                  className={inputCls(!!errors.name)}
                  placeholder="e.g. Amara Osei"
                />
              </Field>
            </div>

            <Field label="Email Address" required error={errors.email}>
              <input name="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputCls(!!errors.email)}
                placeholder="teacher@school.edu" />
            </Field>

            <Field label="Phone Number">
              <input name="phone" type="tel" defaultValue={teacher?.phone ?? ""} className={inputCls()}
                placeholder="+254 700 000 000" />
            </Field>

            <Field label="Gender">
              <select name="gender" defaultValue={teacher?.gender ?? ""} className={selectCls}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </Field>

            <Field label="Date of Birth">
              <input name="dob" type="date" defaultValue={teacher?.dob ?? ""} className={inputCls()} />
            </Field>

            <Field label="Nationality">
              <input name="nationality" defaultValue={teacher?.nationality ?? ""} className={inputCls()} 
                placeholder="e.g. Kenyan" />
            </Field>
          </div>
        </div>

        {/* ── Section 2: Professional Details ───────────── */}
        <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
            <span className="text-lg">💼</span>
            <h2 className="font-semibold text-slate-200">Professional Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="sm:col-span-2 p-4 bg-slate-800/40 border border-slate-700/30 rounded-xl">
              <p className="text-xs text-slate-500 font-semibold uppercase">Employee ID</p>
              <p className="text-sm text-slate-200 mt-1 font-mono">{teacher?.employee_id || "—"}</p>
              <p className="text-xs text-slate-600 mt-1">Auto-generated. Contact admin to change.</p>
            </div>

            <Field label="Department" required error={errors.dept}>
              <select name="department" value={dept}
                onChange={e => setDept(e.target.value)}
                className={`${selectCls} ${errors.dept ? "border-red-500/50" : ""}`}>
                <option value="">Select department</option>
                {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>

            <Field label="Qualification">
              <input name="qualification" defaultValue={teacher?.qualification ?? ""} className={inputCls()}
                placeholder="e.g. B.Ed Mathematics" />
            </Field>

            <Field label="Years of Experience">
              <input name="experience" type="number" min={0} max={50}
                defaultValue={teacher?.experience_yrs ?? ""} className={inputCls()} placeholder="e.g. 5" />
            </Field>

            <Field label="Join Date">
              <input name="join_date" type="date" defaultValue={teacher?.join_date ?? ""} className={inputCls()} />
            </Field>

            <Field label="Employment Type">
              <select name="employment_type" defaultValue={teacher?.employment_type ?? ""} className={selectCls}>
                <option value="">Select type</option>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Substitute</option>
              </select>
            </Field>

            <Field label="Account Status">
              <select name="status" defaultValue={teacher?.status ?? "active"} className={selectCls}>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>

            <div className="sm:col-span-2">
              <Field label="Bio / Notes">
                <textarea name="bio" rows={3}
                  defaultValue={teacher?.bio ?? ""}
                  className={inputCls() + " resize-y min-h-[80px]"}
                  placeholder="Brief professional background, specialisms, or notes…" />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Section 3: Teaching Assignments ───────────── */}
        <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
            <span className="text-lg">📚</span>
            <h2 className="font-semibold text-slate-200">Teaching Assignments</h2>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base">📖</span>
                <p className="text-sm font-semibold text-slate-200">Teaching Subjects</p>
                {selectedSubjectIds.length > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-medium">
                    {selectedSubjectIds.length} selected
                  </span>
                )}
              </div>

              {allSubjects.length === 0 ? (
                <p className="text-xs text-slate-600">No subjects available</p>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto bg-slate-800/20 p-4 rounded-lg border border-slate-700/30">
                  {allSubjects.map((subject: Subject) => (
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

            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base">🏫</span>
                <p className="text-sm font-semibold text-slate-200">Assigned Classrooms</p>
                {selectedClassIds.length > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full text-xs font-medium">
                    {selectedClassIds.length} selected
                  </span>
                )}
              </div>

              {allClasses.length === 0 ? (
                <p className="text-xs text-slate-600">No classrooms available</p>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto bg-slate-800/20 p-4 rounded-lg border border-slate-700/30">
                  {allClasses.map((classroom: ClassRoom) => (
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
        </div>

        {/* ── Footer Actions ──────────────────────────────── */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Link to={`/teachers/${teacher?.id}`}
            className="w-full sm:w-auto text-center px-5 py-2.5 text-slate-400 text-sm font-medium rounded-xl hover:text-slate-200 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold rounded-xl hover:from-amber-400 hover:to-orange-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving Changes…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </Form>
    </div>
  );
}
