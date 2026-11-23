import { useState } from "react";
import { Form, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/index";
import { api, type ClassRoom, type LessonPlan } from "~/lib/api";

export async function clientLoader() {
  const userResponse = await api.auth.me();
  const user = userResponse.data;
  if (user.role !== "teacher" && user.role !== "admin") {
    throw redirect("/");
  }

  const [classesResponse, plansResponse] = await Promise.all([
    user.role === "teacher" ? api.classes.list() : Promise.resolve(null),
    api.lessonPlans.list(),
  ]);
  return {
    user,
    classes: classesResponse?.data ?? [],
    plans: plansResponse.data,
  };
}

function getError(error: unknown) {
  const value = error as { message?: string; errors?: Record<string, string[]> };
  return {
    error: value?.message ?? "The lesson plan could not be saved.",
    errors: value?.errors ?? {},
  };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  const id = Number(form.get("id"));

  try {
    if (intent === "delete") {
      await api.lessonPlans.delete(id);
    } else if (intent === "update") {
      await api.lessonPlans.update(id, {
        planned_date: String(form.get("planned_date")),
        title: String(form.get("title")),
        objectives: String(form.get("objectives") ?? ""),
        materials: String(form.get("materials") ?? ""),
        activities: String(form.get("activities") ?? ""),
        homework: String(form.get("homework") ?? ""),
        status: String(form.get("status")) as LessonPlan["status"],
      });
    } else if (intent === "create") {
      await api.lessonPlans.create({
        class_id: Number(form.get("class_id")),
        subject_id: Number(form.get("subject_id")),
        planned_date: String(form.get("planned_date")),
        title: String(form.get("title")),
        objectives: String(form.get("objectives") ?? ""),
        materials: String(form.get("materials") ?? ""),
        activities: String(form.get("activities") ?? ""),
        homework: String(form.get("homework") ?? ""),
      });
    } else {
      return { error: "Unknown lesson-plan action.", errors: {} };
    }

    return { success: true };
  } catch (error) {
    return getError(error);
  }
}

const fieldClass = "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100";

export default function LessonPlansPage({ loaderData, actionData }: Route.ComponentProps) {
  const { user, classes, plans } = loaderData as {
    user: { role: "teacher" | "admin" };
    classes: ClassRoom[];
    plans: LessonPlan[];
  };
  const isTeacher = user.role === "teacher";
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const error = actionData as { error?: string; errors?: Record<string, string[]> } | undefined;
  const availableSubjects = classes.find((classRoom) => String(classRoom.id) === classId)?.subjects ?? [];

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 text-slate-100 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold">Dated Lesson Plans</h1>
        <p className="mt-1 text-sm text-slate-400">
          {isTeacher
            ? "Plan each lesson against the exact class and subject you teach."
            : "Review lesson plans submitted by teachers for the current academic session."}
        </p>
      </header>

      {isTeacher && (
        <>
          {error?.error && (
            <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
              {error.error}
              {Object.entries(error.errors ?? {}).map(([field, messages]) => (
                <p key={field}>{field.replaceAll("_", " ")}: {messages.join(", ")}</p>
              ))}
            </div>
          )}

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Add a lesson</h2>
            <Form method="post" className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="intent" value="create" />
              <label className="space-y-1 text-sm text-slate-300">
                Class
                <select name="class_id" required value={classId} onChange={(event) => { setClassId(event.target.value); setSubjectId(""); }} className={fieldClass}>
                  <option value="">Select a class</option>
                  {classes.map((classRoom) => (
                    <option key={classRoom.id} value={classRoom.id}>
                      {classRoom.name} - {classRoom.section} ({classRoom.session?.name ?? "No session"})
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm text-slate-300">
                Subject
                <select name="subject_id" required value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className={fieldClass}>
                  <option value="">Select a subject assigned to you</option>
                  {availableSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-sm text-slate-300">
                Lesson date
                <input name="planned_date" type="date" required className={fieldClass} />
              </label>
              <label className="space-y-1 text-sm text-slate-300">
                Lesson title
                <input name="title" required maxLength={255} className={fieldClass} placeholder="e.g. Fractions and equivalent values" />
              </label>
              <label className="space-y-1 text-sm text-slate-300">
                Learning objectives
                <textarea name="objectives" rows={2} className={fieldClass} />
              </label>
              <label className="space-y-1 text-sm text-slate-300">
                Materials
                <textarea name="materials" rows={2} className={fieldClass} />
              </label>
              <label className="space-y-1 text-sm text-slate-300 md:col-span-2">
                Activities
                <textarea name="activities" rows={3} className={fieldClass} />
              </label>
              <label className="space-y-1 text-sm text-slate-300 md:col-span-2">
                Homework
                <textarea name="homework" rows={2} className={fieldClass} />
              </label>
              <button name="intent" value="create" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 md:col-span-2">
                {submitting ? "Saving…" : "Add lesson plan"}
              </button>
            </Form>
          </section>
        </>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{isTeacher ? "Your lesson plans" : "Lesson plans this session"}</h2>
        {plans.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">No lesson plans yet.</p>
        ) : plans.map((plan) => (
          <details key={plan.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <summary className="cursor-pointer list-none">
              <span className="font-semibold">{plan.title}</span>
              <span className="ml-2 text-sm text-slate-400">{plan.planned_date.slice(0, 10)} · {plan.class_room?.name} · {plan.subject?.name}</span>
              {!isTeacher && (
                <span className="ml-2 text-sm text-slate-400">
                  · {plan.teacher?.user?.name ?? "Teacher profile unavailable"}
                </span>
              )}
              <span className="float-right rounded-full bg-slate-800 px-2 py-1 text-xs capitalize text-slate-300">{plan.status}</span>
            </summary>
            {!isTeacher && (
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                {([
                  ["Learning objectives", plan.objectives],
                  ["Materials", plan.materials],
                  ["Activities", plan.activities],
                  ["Homework", plan.homework],
                ] as const).map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-slate-950/70 p-3">
                    <dt className="font-medium text-slate-400">{label}</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-slate-200">{value || "—"}</dd>
                  </div>
                ))}
              </dl>
            )}
            {isTeacher && (
            <Form method="post" className="mt-4 grid gap-3 md:grid-cols-2">
              <input type="hidden" name="id" value={plan.id} />
              <label className="space-y-1 text-sm text-slate-300">Date
                <input name="planned_date" type="date" required defaultValue={plan.planned_date.slice(0, 10)} className={fieldClass} />
              </label>
              <label className="space-y-1 text-sm text-slate-300">Title
                <input name="title" required maxLength={255} defaultValue={plan.title} className={fieldClass} />
              </label>
              <label className="space-y-1 text-sm text-slate-300">Status
                <select name="status" defaultValue={plan.status} className={fieldClass}>
                  <option value="planned">Planned</option>
                  <option value="taught">Taught</option>
                  <option value="skipped">Skipped</option>
                </select>
              </label>
              <label className="space-y-1 text-sm text-slate-300">Objectives
                <textarea name="objectives" rows={2} defaultValue={plan.objectives ?? ""} className={fieldClass} />
              </label>
              <label className="space-y-1 text-sm text-slate-300">Materials
                <textarea name="materials" rows={2} defaultValue={plan.materials ?? ""} className={fieldClass} />
              </label>
              <label className="space-y-1 text-sm text-slate-300">Activities
                <textarea name="activities" rows={3} defaultValue={plan.activities ?? ""} className={fieldClass} />
              </label>
              <label className="space-y-1 text-sm text-slate-300">Homework
                <textarea name="homework" rows={2} defaultValue={plan.homework ?? ""} className={fieldClass} />
              </label>
              <button name="intent" value="update" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save changes</button>
              <button name="intent" value="delete" formNoValidate disabled={submitting} className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 disabled:opacity-50">Delete plan</button>
            </Form>
            )}
          </details>
        ))}
      </section>
    </main>
  );
}
