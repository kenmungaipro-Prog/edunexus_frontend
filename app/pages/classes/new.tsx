// ============================================================
// app/pages/classes/new.tsx
// ============================================================
import { useNavigation, Link, Form } from "react-router";
import { api, type CreateClassPayload, type Subject, type Teacher } from "~/lib/api";

interface LoaderData {
  teachers: Teacher[];
  subjects: Subject[];
}

export async function clientLoader() {
  const [teachersRes, subjectsRes] = await Promise.all([
    api.teachers.list({ per_page: 200 }),
    api.subjects.list(),
  ]);

  return {
    teachers: teachersRes.data.data as Teacher[],
    subjects: subjectsRes.data as Subject[],
  };
}

export async function clientAction({ request }: any) {
  const formData = await request.formData();
  const payload: Partial<CreateClassPayload> = {};

  for (const key of formData.keys()) {
    if (key === "subjects") {
      const values = formData
        .getAll("subjects")
        .filter((v: FormDataEntryValue): v is string => typeof v === "string" && v !== "")
        .map((v) => Number(v));
      if (values.length > 0) payload.subjects = values as any;
      continue;
    }

    const value = formData.get(key);
    if (value === null || value === "") continue;
    payload[key as keyof CreateClassPayload] = value as any;
  }

  if (payload.grade) payload.grade = Number(payload.grade) as any;
  if (payload.capacity) payload.capacity = Number(payload.capacity) as any;

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

export default function NewClassPage({ loaderData, actionData }: any) {
  const { teachers, subjects } = loaderData as LoaderData;
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const errors = (actionData?.errors ?? {}) as Record<string, string[]>;
  const message = actionData?.error;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-100">Add New Class</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Create a new academic group for your school.</p>
        </div>
        <Link to="/classes" className="text-blue-400 hover:underline text-sm self-start sm:self-auto">Back to classes</Link>
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-red-900/20 border border-red-500/30 p-4 text-sm text-red-200 break-words">
          {message}
        </div>
      )}

      <Form method="post" className="space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-slate-300">
            Name
            <input name="name" required className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500 transition" />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name[0]}</p>}
          </label>
          <label className="block text-sm text-slate-300">
            Grade
            <input name="grade" type="number" required min="1" max="12" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500 transition" />
            {errors.grade && <p className="mt-1 text-xs text-red-400">{errors.grade[0]}</p>}
          </label>
          <label className="block text-sm text-slate-300">
            Section
            <input name="section" required className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500 transition" />
            {errors.section && <p className="mt-1 text-xs text-red-400">{errors.section[0]}</p>}
          </label>
          <label className="block text-sm text-slate-300">
            Capacity
            <input name="capacity" type="number" required min="1" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500 transition" />
            {errors.capacity && <p className="mt-1 text-xs text-red-400">{errors.capacity[0]}</p>}
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-slate-300">
            Class Teacher
            <select name="class_teacher_id" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500 transition">
              <option value="">No teacher assigned</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.user?.name ?? `Teacher #${teacher.id}`}</option>
              ))}
            </select>
            {errors.class_teacher_id && <p className="mt-1 text-xs text-red-400">{errors.class_teacher_id[0]}</p>}
          </label>
          <label className="block text-sm text-slate-300">
            Room
            <input name="room" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500 transition" />
            {errors.room && <p className="mt-1 text-xs text-red-400">{errors.room[0]}</p>}
          </label>
        </div>

        <label className="block text-sm text-slate-300">
          Subjects
          <select name="subjects" multiple className="mt-2 min-h-[140px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500 transition">
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
          {errors.subjects && <p className="mt-1 text-xs text-red-400">{errors.subjects[0]}</p>}
        </label>

        <button type="submit" disabled={submitting} className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60 transition">
          {submitting ? "Saving…" : "Create Class"}
        </button>
      </Form>
    </div>
  );
}