// ============================================================
// app/pages/classes/new.tsx
// ============================================================
import { useNavigation, Link, Form, useNavigate } from "react-router";
import { useState, useMemo } from "react";
import { api, type CreateClassPayload, type Subject, type Teacher } from "~/lib/api";
import { validateClassRoom } from "~/lib/validation";

interface LoaderData {
  teachers: Teacher[];
  subjects: Subject[];
}

export async function clientLoader() {
  const [teachersRes, subjectsRes] = await Promise.all([
    api.teachers.list({ per_page: 200 }),
    api.subjects.list(),
  ]);

  const teachers = ((teachersRes as any).data?.data ?? (teachersRes as any).data ?? []) as Teacher[];
  const subjects = ((subjectsRes as any).data?.data ?? (subjectsRes as any).data ?? []) as Subject[];

  return {
    teachers,
    subjects,
  } satisfies LoaderData;
}

export async function clientAction({ request }: any) {
  const formData = await request.formData();
  const payload: Partial<CreateClassPayload> = {};

  const getString = (key: string): string | undefined => {
    const v = formData.get(key);
    return typeof v === "string" ? v.trim() : undefined;
  };

  const name = getString("name");
  if (name) payload.name = name;

  const gradeStr = getString("grade");
  if (gradeStr) payload.grade = Number(gradeStr) as any;

  const section = getString("section");
  if (section) payload.section = section;

  const capacityStr = getString("capacity");
  if (capacityStr) payload.capacity = Number(capacityStr) as any;

  const classTeacherIdStr = getString("class_teacher_id");
  if (classTeacherIdStr && classTeacherIdStr !== "__add_new_teacher__") {
    payload.class_teacher_id = Number(classTeacherIdStr) as any;
  }

  const room = getString("room");
  if (room) payload.room = room;

  const subjectsRaw: FormDataEntryValue[] = formData.getAll("subjects");

  const subjects = subjectsRaw
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .map((v) => Number(v))
    .filter((n) => !Number.isNaN(n));

  payload.subjects = subjects as any;

  // Frontend validation
  const validationErrors = validateClassRoom(payload);
  if (Object.keys(validationErrors).length > 0) {
    return {
      error: "Please fix the highlighted errors below.",
      errors: validationErrors,
    };
  }

  try {
    const res = await api.classes.create(payload as CreateClassPayload);
    const { redirect } = await import("react-router");
    return redirect(`/classes/${res.data.id}`);
  } catch (error: unknown) {
    const err = error as { message?: string; errors?: Record<string, string[]> };
    return {
      error: err?.message ?? "Failed to create class.",
      errors: err?.errors ?? {},
    };
  }
}

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner";

const labelClass = "block text-xs font-semibold uppercase tracking-wider text-slate-400";

export default function NewClassPage({ loaderData, actionData }: any) {
  const ld = (loaderData ?? {}) as Partial<LoaderData>;
  const teachers = ld.teachers ?? [];
  const subjects = ld.subjects ?? [];

  const [subjectQuery, setSubjectQuery] = useState<string>("");
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);

  const filteredSubjects = useMemo(() => {
    if (!subjectQuery) return subjects;
    const q = subjectQuery.toLowerCase();
    return subjects.filter(
      (s) =>
        (s.name ?? "").toLowerCase().includes(q) ||
        (s.code ?? "").toLowerCase().includes(q)
    );
  }, [subjects, subjectQuery]);

  const visibleSubjectIds = useMemo(
    () => filteredSubjects.map((subject) => subject.id),
    [filteredSubjects]
  );

  const allVisibleSubjectsSelected =
    visibleSubjectIds.length > 0 &&
    visibleSubjectIds.every((id) => selectedSubjects.includes(id));

  const toggleSubject = (id: number) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAllSubjects = () => {
    setSelectedSubjects((prev) => {
      if (allVisibleSubjectsSelected) {
        return prev.filter((id) => !visibleSubjectIds.includes(id));
      }
      return [...new Set([...prev, ...visibleSubjectIds])];
    });
  };

  const navigation = useNavigation();
  const navigate = useNavigate();
  const submitting = navigation.state === "submitting";
  const errors = (actionData?.errors ?? {}) as Record<string, string[]>;
  const message = actionData?.error;
  const showAddTeacherOption = teachers.length === 0;

  const assignedSubjectObjects = useMemo(
    () => subjects.filter((s) => selectedSubjects.includes(s.id)),
    [subjects, selectedSubjects]
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            ✨ Creation Wizard
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Add New Class Room
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure parameters for a new academic group in your school.
          </p>
        </div>
        <Link
          to="/classes"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs sm:text-sm font-medium transition-all shadow-sm self-start sm:self-auto"
        >
          ← Back to classes
        </Link>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-200 flex items-start gap-3 shadow-lg shadow-red-500/5">
          <svg
            className="w-5 h-5 mt-0.5 shrink-0 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
          <div>
            <span className="font-semibold block text-red-100">
              Validation Error
            </span>
            <span className="text-xs text-red-300/90">{message}</span>
          </div>
        </div>
      )}

      <Form
        method="post"
        className="space-y-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>
              Class Name <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              required
              placeholder="e.g. Form 4 East"
              className={inputClass}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                {errors.name[0]}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Grade Level <span className="text-red-400">*</span>
            </label>
            <input
              name="grade"
              type="number"
              required
              min="1"
              max="12"
              placeholder="1-12"
              className={inputClass}
            />
            {errors.grade && (
              <p className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                {errors.grade[0]}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Section
            </label>
            <input
              name="section"
              placeholder="e.g. A, B, North"
              className={inputClass}
            />
            {errors.section && (
              <p className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                {errors.section[0]}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Capacity <span className="text-red-400">*</span>
            </label>
            <input
              name="capacity"
              type="number"
              required
              min="1"
              placeholder="e.g. 40"
              className={inputClass}
            />
            {errors.capacity && (
              <p className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                {errors.capacity[0]}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Class Teacher</label>
            <select
              name="class_teacher_id"
              className={inputClass}
              onChange={(event) => {
                if (event.target.value === "__add_new_teacher__") {
                  navigate("/teachers/new");
                }
              }}
            >
              <option value="">No teacher assigned</option>
              {showAddTeacherOption && (
                <option value="__add_new_teacher__">Add new teacher</option>
              )}
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user?.name ?? `Teacher #${teacher.id}`}
                </option>
              ))}
            </select>
            {errors.class_teacher_id && (
              <p className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                {errors.class_teacher_id[0]}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Room Location</label>
            <input
              name="room"
              placeholder="e.g. Lab 3 / Room 102"
              className={inputClass}
            />
            {errors.room && (
              <p className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                {errors.room[0]}
              </p>
            )}
          </div>
        </div>

        {/* Assigned Subjects Fieldset */}
        <fieldset
          aria-invalid={errors.subjects ? "true" : "false"}
          aria-describedby={errors.subjects ? "error-subjects" : undefined}
          className="space-y-2"
        >
          <legend className={labelClass}>Assigned Subjects</legend>

          {assignedSubjectObjects.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {assignedSubjectObjects.map((subject) => (
                <span
                  key={subject.id}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 border border-slate-700 px-3 py-1 text-xs font-medium text-slate-200"
                >
                  {subject.name}
                  <button
                    type="button"
                    onClick={() => toggleSubject(subject.id)}
                    className="hover:text-red-400 transition-colors ml-0.5"
                    title="Remove subject"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          <div
            className={`rounded-3xl border bg-slate-950/60 p-4 shadow-inner scrollbar-thin scrollbar-thumb-slate-700 ${
              errors.subjects ? "border-red-500/60" : "border-slate-700/80"
            }`}
          >
            {subjects.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No subjects available in the system
              </p>
            ) : (
              <>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200">
                      Pick subjects for this class
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Search, select, or remove subjects from the list below.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-300">
                      {selectedSubjects.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={toggleAllSubjects}
                      className="inline-flex items-center rounded-2xl bg-slate-800/80 border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      {allVisibleSubjectsSelected ? "Deselect all" : "Select all"}
                    </button>
                  </div>
                </div>

                <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    placeholder="Search subjects..."
                    value={subjectQuery}
                    onChange={(e) => setSubjectQuery(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto">
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="list">
                    {filteredSubjects.map((subject) => {
                      const isChecked = selectedSubjects.includes(subject.id);

                     
                        return (
                          <li key={subject.id}>
                            <label
                              htmlFor={`subject-${subject.id}`}
                              className="flex items-center gap-2 rounded-xl border border-slate-800/90 bg-slate-900/60 px-3 py-2 cursor-pointer hover:border-slate-700 hover:bg-slate-800/70 transition-all"
                            >
                              <input
                                id={`subject-${subject.id}`}
                                type="checkbox"
                                name="subjects"
                                value={String(subject.id)}
                                checked={isChecked}
                                onChange={() => toggleSubject(subject.id)}
                                className="h-4 w-4 rounded border-slate-500 text-blue-600 focus:ring-blue-500 flex-none"
                              />

                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-200">
                                  {subject.name ?? subject.code ?? `Subject #${subject.id}`}
                                </span>

                                {(subject.code || subject.type) && (
                                  <span className="text-xs text-slate-400">
                                    {subject.code}
                                    {subject.code && subject.type ? " • " : ""}
                                    {subject.type}
                                  </span>
                                )}
                              </div>

                              {subject.exams_count ? (
                                <span className="ml-auto text-xs text-slate-500 whitespace-nowrap">
                                  {subject.exams_count} exams
                                </span>
                              ) : null}
                            </label>
                          </li>
                        );
                    })}
                  </ul>
                </div>
              </>
            )}
          </div>
          {errors.subjects && (
            <p
              id="error-subjects"
              className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              {errors.subjects[0]}
            </p>
          )}
        </fieldset>

        <div className="pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 text-sm font-semibold text-white hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
          >
            {submitting ? "Creating Class Room..." : "Create Class Room"}
          </button>
        </div>
      </Form>
    </div>
  );
}