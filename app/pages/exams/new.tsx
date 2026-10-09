// ============================================================
// app/pages/exams/new.tsx
// ============================================================
import { Form, redirect, useNavigation, useActionData, Link } from "react-router";
import type { Route } from "./+types/new";
import { api } from "~/lib/api";
import { validateExam } from "~/lib/validation";

export async function clientLoader() {
  const [classesRes, subjectsRes, teachersRes] = await Promise.all([
    api.classes.list({ per_page: 100 }),
    api.subjects.list(),
    api.teachers.list({ per_page: 100 }),
  ]);

  return {
    classes: classesRes.data,
    subjects: subjectsRes.data,
    teachers: (teachersRes as any).data?.data || [], 
  };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();

  const payload = {
    title: formData.get("title") as string,
    class_id: Number(formData.get("class_id")),
    subject_id: Number(formData.get("subject_id")),
    invigilator_id: formData.get("invigilator_id") ? Number(formData.get("invigilator_id")) : undefined,
    exam_date: formData.get("exam_date") as string,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
    total_marks: Number(formData.get("total_marks")),
    passing_marks: Number(formData.get("passing_marks")),
    room: formData.get("room") as string,
    instructions: formData.get("instructions") as string,
  };

  // Frontend validation
  const validationErrors = validateExam(payload);
  if (Object.keys(validationErrors).length > 0) {
    return {
      error: "Please fix the highlighted errors below.",
      errors: Object.fromEntries(
        Object.entries(validationErrors).map(([field, message]) => [field, [message]]),
      ),
      values: Object.fromEntries(formData.entries()),
    };
  }

  try {
    await api.exams.create(payload);
    return redirect("/exams");
  } catch (error: any) {
    const errors = Object.fromEntries(
      Object.entries(error?.errors ?? {}).map(([field, messages]) => [
        field,
        Array.isArray(messages) ? messages.filter((message): message is string => typeof message === "string") : [String(messages)],
      ]),
    );
    const errorDetails = Object.values(errors).flat();
    return {
      error: errorDetails.length
        ? "The exam could not be scheduled. Review the errors below."
        : error?.message || "Failed to schedule exam. Please try again.",
      errors,
      values: Object.fromEntries(formData.entries()),
    };
  }
}

export default function NewExamPage({ loaderData, actionData }: Route.ComponentProps) {
  const { classes, subjects, teachers } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const values = actionData?.values ?? {};
  const fieldError = (field: string) => actionData?.errors?.[field]?.[0];
  const fieldClass = (field: string) =>
    `w-full bg-slate-900 border ${fieldError(field) ? "border-red-500" : "border-slate-700"} p-3 text-sm sm:text-base text-white focus:border-blue-500 outline-none rounded-lg`;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Schedule Exam</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Create a new examination block and assign an invigilator.</p>
        </div>
        <Link to="/exams" className="text-xs sm:text-sm font-bold text-slate-400 hover:text-white uppercase tracking-wider">
          Cancel &larr;
        </Link>
      </div>

      {actionData?.error && (
        <div role="alert" className="mb-6 p-4 bg-red-500/10 border border-red-500 text-red-300 text-sm rounded-lg">
          <p className="font-semibold">{actionData.error}</p>
          {Object.entries(actionData.errors ?? {}).some(([, messages]) => messages.length > 0) && (
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {Object.entries(actionData.errors ?? {}).flatMap(([field, messages]) =>
                messages.map((message) => (
                  <li key={`${field}-${message}`}><span className="font-semibold">{field.replaceAll("_", " ")}:</span> {message}</li>
                )),
              )}
            </ul>
          )}
        </div>
      )}

      <Form method="post" className="space-y-6 bg-slate-800 border border-slate-700 p-4 sm:p-6 md:p-8 rounded-xl shadow-lg">
        
        {/* Core Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Exam Title</label>
            <input 
              name="title" 
              type="text" 
              required 
              placeholder="e.g. Mid-Term Mathematics Assessment"
              defaultValue={String(values.title ?? "")}
              aria-invalid={Boolean(fieldError("title"))}
              className={fieldClass("title")}
            />
            {fieldError("title") && <p className="text-red-400 text-xs mt-1">{fieldError("title")}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Class</label>
            <select name="class_id" required defaultValue={String(values.class_id ?? "")} aria-invalid={Boolean(fieldError("class_id"))} className={fieldClass("class_id")}>
              <option value="">Select a class...</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {fieldError("class_id") && <p className="text-red-400 text-xs mt-1">{fieldError("class_id")}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Subject</label>
            <select name="subject_id" required defaultValue={String(values.subject_id ?? "")} aria-invalid={Boolean(fieldError("subject_id"))} className={fieldClass("subject_id")}>
              <option value="">Select a subject...</option>
              {subjects.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {fieldError("subject_id") && <p className="text-red-400 text-xs mt-1">{fieldError("subject_id")}</p>}
          </div>
        </div>

        <hr className="border-slate-700 my-6 sm:my-8" />

        {/* Scheduling Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Date</label>
            <input name="exam_date" type="date" required defaultValue={String(values.exam_date ?? "")} aria-invalid={Boolean(fieldError("exam_date"))} className={fieldClass("exam_date")} />
            {fieldError("exam_date") && <p className="text-red-400 text-xs mt-1">{fieldError("exam_date")}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Start Time</label>
            <input name="start_time" type="time" required defaultValue={String(values.start_time ?? "")} aria-invalid={Boolean(fieldError("start_time"))} className={fieldClass("start_time")} />
            {fieldError("start_time") && <p className="text-red-400 text-xs mt-1">{fieldError("start_time")}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">End Time</label>
            <input name="end_time" type="time" required defaultValue={String(values.end_time ?? "")} aria-invalid={Boolean(fieldError("end_time"))} className={fieldClass("end_time")} />
            {fieldError("end_time") && <p className="text-red-400 text-xs mt-1">{fieldError("end_time")}</p>}
          </div>
        </div>

        <hr className="border-slate-700 my-6 sm:my-8" />

        {/* Scoring & Logistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Marks</label>
            <input name="total_marks" type="number" required min="1" defaultValue={String(values.total_marks ?? "100")} aria-invalid={Boolean(fieldError("total_marks"))} className={fieldClass("total_marks")} />
            {fieldError("total_marks") && <p className="text-red-400 text-xs mt-1">{fieldError("total_marks")}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Passing Marks</label>
            <input name="passing_marks" type="number" required min="1" defaultValue={String(values.passing_marks ?? "40")} aria-invalid={Boolean(fieldError("passing_marks"))} className={fieldClass("passing_marks")} />
            {fieldError("passing_marks") && <p className="text-red-400 text-xs mt-1">{fieldError("passing_marks")}</p>}
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Room</label>
            <input name="room" type="text" placeholder="e.g. Hall A" defaultValue={String(values.room ?? "")} aria-invalid={Boolean(fieldError("room"))} className={fieldClass("room")} />
            {fieldError("room") && <p className="text-red-400 text-xs mt-1">{fieldError("room")}</p>}
          </div>

          <div className="space-y-2 md:col-span-3">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Invigilator (Optional)</label>
            <select name="invigilator_id" defaultValue={String(values.invigilator_id ?? "")} aria-invalid={Boolean(fieldError("invigilator_id"))} className={fieldClass("invigilator_id")}>
              <option value="">None / Unassigned</option>
              {teachers.map((t: any) => (
                <option key={t.id} value={t.id}>{t.user?.name || t.employee_id}</option>
              ))}
            </select>
            {fieldError("invigilator_id") && <p className="text-red-400 text-xs mt-1">{fieldError("invigilator_id")}</p>}
          </div>
          
          <div className="space-y-2 md:col-span-3">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Instructions</label>
            <textarea name="instructions" rows={3} placeholder="Special instructions for students or invigilators..." defaultValue={String(values.instructions ?? "")} aria-invalid={Boolean(fieldError("instructions"))} className={fieldClass("instructions")} />
            {fieldError("instructions") && <p className="text-red-400 text-xs mt-1">{fieldError("instructions")}</p>}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-700 flex justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base shadow-md"
          >
            {isSubmitting ? "Scheduling..." : "Schedule Exam"}
          </button>
        </div>
      </Form>
    </div>
  );
}