import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/edit";
import { api, type Exam, type UpdateExamPayload } from "~/lib/api";

interface EditExam extends Exam {
  invigilator_id: number | null;
}

export async function clientLoader({ params }: Route.LoaderArgs) {
  const examId = Number(params.id);
  const [examResponse, classesResponse, subjectsResponse, teachersResponse] = await Promise.all([
    api.exams.get(examId),
    api.classes.list({ per_page: 100 }),
    api.subjects.list(),
    api.teachers.list({ per_page: 100 }),
  ]);

  return {
    exam: examResponse.data as EditExam,
    classes: classesResponse.data,
    subjects: subjectsResponse.data,
    teachers: teachersResponse.data.data,
  };
}

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const form = await request.formData();
  const values = Object.fromEntries(form.entries());
  const payload: UpdateExamPayload = {
    title: String(form.get("title") ?? "").trim(),
    class_id: Number(form.get("class_id")),
    subject_id: Number(form.get("subject_id")),
    exam_date: String(form.get("exam_date") ?? ""),
    start_time: String(form.get("start_time") ?? ""),
    end_time: String(form.get("end_time") ?? ""),
    total_marks: Number(form.get("total_marks")),
    passing_marks: Number(form.get("passing_marks")),
    room: String(form.get("room") ?? "").trim() || null,
    invigilator_id: form.get("invigilator_id") ? Number(form.get("invigilator_id")) : null,
    instructions: String(form.get("instructions") ?? "").trim() || null,
    status: String(form.get("status") ?? "scheduled") as Exam["status"],
  };

  try {
    await api.exams.update(Number(params.id), payload);
    return redirect(`/exams/${params.id}/view`);
  } catch (error: unknown) {
    const fieldErrors =
      error && typeof error === "object" && "errors" in error &&
      error.errors && typeof error.errors === "object"
        ? Object.fromEntries(
            Object.entries(error.errors).map(([field, messages]) => [
              field,
              Array.isArray(messages) ? messages.map(String) : [String(messages)],
            ]),
          )
        : {};
    const message =
      error && typeof error === "object" && "message" in error && typeof error.message === "string"
        ? error.message
        : "The exam could not be updated. Please check the details and try again.";

    return { error: message, errors: fieldErrors, values };
  }
}

export default function EditExamPage({ loaderData, actionData }: Route.ComponentProps) {
  const { exam, classes, subjects, teachers } = loaderData;
  const navigation = useNavigation();
  const values = actionData?.values ?? {};
  const isSaving = navigation.state === "submitting";
  const hasGrades = (exam.grades?.length ?? 0) > 0;
  const value = (key: string, fallback: string | number | null | undefined) =>
    String(values[key] ?? fallback ?? "");
  const fieldError = (key: string) => actionData?.errors?.[key]?.[0];
  const inputClass = (key: string) =>
    `w-full rounded-lg border bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 ${
      fieldError(key) ? "border-red-500" : "border-slate-700"
    }`;
  const errors = (key: string) =>
    fieldError(key) ? <p className="mt-1 text-xs text-red-400">{fieldError(key)}</p> : null;

  if (exam.status === "cancelled") {
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
          <h1 className="text-xl font-bold text-white">Cancelled exam</h1>
          <p className="mt-2 text-sm text-slate-400">Cancelled exams cannot be edited.</p>
          <Link to={`/exams/${exam.id}/view`} className="mt-5 inline-block text-sm text-blue-300 hover:text-white">
            View exam
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Update scheduled exam</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Edit {exam.title}</h1>
        </div>
        <Link to={`/exams/${exam.id}/view`} className="text-sm text-slate-400 hover:text-white">
          Cancel
        </Link>
      </div>

      {actionData?.error && (
        <div role="alert" className="mb-5 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          <p className="font-semibold">{actionData.error}</p>
          {Object.entries(actionData.errors ?? {}).flatMap(([field, messages]) =>
            messages.map((message) => (
              <p key={`${field}-${message}`} className="mt-1">
                <span className="font-semibold capitalize">{field.replaceAll("_", " ")}:</span> {message}
              </p>
            )),
          )}
        </div>
      )}

      {hasGrades && (
        <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Marks have already been recorded. Class, subject, total marks, and passing marks are locked to protect the saved results.
        </div>
      )}

      <Form method="post" className="space-y-6 rounded-xl border border-slate-700 bg-slate-800 p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Exam title</span>
            <input name="title" required maxLength={255} className={inputClass("title")} defaultValue={value("title", exam.title)} />
            {errors("title")}
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Class</span>
            <select name={hasGrades ? undefined : "class_id"} required disabled={hasGrades} className={inputClass("class_id")} defaultValue={value("class_id", exam.class_id)}>
              <option value="">Select a class</option>
              {classes.map((classRoom) => <option key={classRoom.id} value={classRoom.id}>{classRoom.name}</option>)}
            </select>
            {hasGrades && <input type="hidden" name="class_id" value={exam.class_id} />}
            {errors("class_id")}
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Subject</span>
            <select name={hasGrades ? undefined : "subject_id"} required disabled={hasGrades} className={inputClass("subject_id")} defaultValue={value("subject_id", exam.subject_id)}>
              <option value="">Select a subject</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
            {hasGrades && <input type="hidden" name="subject_id" value={exam.subject_id} />}
            {errors("subject_id")}
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Date</span>
            <input name="exam_date" type="date" required className={inputClass("exam_date")} defaultValue={value("exam_date", exam.exam_date.slice(0, 10))} />
            {errors("exam_date")}
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</span>
            <select name="status" required className={inputClass("status")} defaultValue={value("status", exam.status)}>
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {errors("status")}
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Start time</span>
            <input name="start_time" type="time" required className={inputClass("start_time")} defaultValue={value("start_time", exam.start_time.slice(0, 5))} />
            {errors("start_time")}
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">End time</span>
            <input name="end_time" type="time" required className={inputClass("end_time")} defaultValue={value("end_time", exam.end_time.slice(0, 5))} />
            {errors("end_time")}
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total marks</span>
            <input name={hasGrades ? undefined : "total_marks"} type="number" min="1" required disabled={hasGrades} className={inputClass("total_marks")} defaultValue={value("total_marks", exam.total_marks)} />
            {hasGrades && <input type="hidden" name="total_marks" value={exam.total_marks} />}
            {errors("total_marks")}
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Passing marks</span>
            <input name={hasGrades ? undefined : "passing_marks"} type="number" min="0" required disabled={hasGrades} className={inputClass("passing_marks")} defaultValue={value("passing_marks", exam.passing_marks)} />
            {hasGrades && <input type="hidden" name="passing_marks" value={exam.passing_marks} />}
            {errors("passing_marks")}
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Room</span>
            <input name="room" maxLength={255} className={inputClass("room")} defaultValue={value("room", exam.room)} />
            {errors("room")}
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Invigilator</span>
            <select name="invigilator_id" className={inputClass("invigilator_id")} defaultValue={value("invigilator_id", exam.invigilator_id)}>
              <option value="">No invigilator assigned</option>
              {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.user?.name ?? `Teacher ${teacher.id}`}</option>)}
            </select>
            {errors("invigilator_id")}
          </label>

          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Instructions</span>
            <textarea name="instructions" rows={4} className={inputClass("instructions")} defaultValue={value("instructions", exam.instructions)} />
            {errors("instructions")}
          </label>
        </div>

        <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-700 pt-5 sm:flex-row">
          <Link to={`/exams/${exam.id}/view`} className="rounded-lg border border-slate-600 px-4 py-2.5 text-center text-sm font-semibold text-slate-300 hover:bg-slate-700">
            Cancel
          </Link>
          <button type="submit" disabled={isSaving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
            {isSaving ? "Saving changes…" : "Save changes"}
          </button>
        </div>
      </Form>
    </main>
  );
}
