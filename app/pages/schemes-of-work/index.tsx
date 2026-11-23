import { useState } from "react";
import { Form, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/index";
import { api, type ClassRoom, type SchemeOfWork } from "~/lib/api";

export async function clientLoader() {
  const userResponse = await api.auth.me();
  const user = userResponse.data;
  if (user.role !== "teacher" && user.role !== "admin") {
    throw redirect("/");
  }

  const [classesResponse, schemesResponse] = await Promise.all([
    user.role === "teacher" ? api.classes.list() : Promise.resolve(null),
    api.schemesOfWork.list(),
  ]);
  return {
    user,
    classes: classesResponse?.data ?? [],
    schemes: schemesResponse.data,
  };
}

function getError(error: unknown) {
  const value = error as { message?: string; errors?: Record<string, string[]> };
  return {
    error: value?.message ?? "The scheme entry could not be saved.",
    errors: value?.errors ?? {},
  };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  const id = Number(form.get("id"));

  try {
    if (intent === "delete") {
      await api.schemesOfWork.delete(id);
    } else if (intent === "update") {
      await api.schemesOfWork.update(id, {
        term_number: Number(form.get("term_number")),
        week_number: Number(form.get("week_number")),
        topic: String(form.get("topic")),
        subtopic: String(form.get("subtopic") ?? ""),
        objectives: String(form.get("objectives") ?? ""),
        activities: String(form.get("activities") ?? ""),
        resources: String(form.get("resources") ?? ""),
        assessment: String(form.get("assessment") ?? ""),
        status: String(form.get("status")) as SchemeOfWork["status"],
      });
    } else if (intent === "create") {
      await api.schemesOfWork.create({
        class_id: Number(form.get("class_id")),
        subject_id: Number(form.get("subject_id")),
        term_number: Number(form.get("term_number")),
        week_number: Number(form.get("week_number")),
        topic: String(form.get("topic")),
        subtopic: String(form.get("subtopic") ?? ""),
        objectives: String(form.get("objectives") ?? ""),
        activities: String(form.get("activities") ?? ""),
        resources: String(form.get("resources") ?? ""),
        assessment: String(form.get("assessment") ?? ""),
      });
    } else {
      return { error: "Unknown scheme action.", errors: {} };
    }

    return { success: true };
  } catch (error) {
    return getError(error);
  }
}

const fieldClass = "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100";

export default function SchemesOfWorkPage({ loaderData, actionData }: Route.ComponentProps) {
  const { user, classes, schemes } = loaderData as {
    user: { role: "teacher" | "admin" };
    classes: ClassRoom[];
    schemes: SchemeOfWork[];
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
        <h1 className="text-2xl font-bold">Schemes of Work</h1>
        <p className="mt-1 text-sm text-slate-400">
          {isTeacher
            ? "Organize the term into numbered weeks and track topic progress."
            : "Review teachers' schemes of work for the current academic session."}
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
        <h2 className="mb-4 text-lg font-semibold">Add a weekly topic</h2>
        <Form method="post" className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="intent" value="create" />
          <label className="space-y-1 text-sm text-slate-300">Class
            <select name="class_id" required value={classId} onChange={(event) => { setClassId(event.target.value); setSubjectId(""); }} className={fieldClass}>
              <option value="">Select a class</option>
              {classes.map((classRoom) => (
                <option key={classRoom.id} value={classRoom.id}>
                  {classRoom.name} - {classRoom.section} ({classRoom.session?.name ?? "No session"})
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-slate-300">Subject
            <select name="subject_id" required value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className={fieldClass}>
              <option value="">Select a subject</option>
              {availableSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm text-slate-300">Term
            <select name="term_number" required defaultValue="1" className={fieldClass}>
              <option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-slate-300">Week
            <input name="week_number" type="number" min={1} max={20} required className={fieldClass} />
          </label>
          <label className="space-y-1 text-sm text-slate-300 md:col-span-2">Topic
            <input name="topic" required maxLength={255} className={fieldClass} placeholder="Main topic for the week" />
          </label>
          <label className="space-y-1 text-sm text-slate-300">Subtopic
            <input name="subtopic" maxLength={255} className={fieldClass} />
          </label>
          <label className="space-y-1 text-sm text-slate-300">Learning objectives
            <textarea name="objectives" rows={2} className={fieldClass} />
          </label>
          <label className="space-y-1 text-sm text-slate-300">Activities
            <textarea name="activities" rows={3} className={fieldClass} />
          </label>
          <label className="space-y-1 text-sm text-slate-300">Resources
            <textarea name="resources" rows={2} className={fieldClass} />
          </label>
          <label className="space-y-1 text-sm text-slate-300">Assessment
            <textarea name="assessment" rows={2} className={fieldClass} />
          </label>
          <button name="intent" value="create" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Add weekly topic</button>
        </Form>
      </section>
        </>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{isTeacher ? "Your schemes" : "Schemes this session"}</h2>
        {schemes.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">No scheme entries yet.</p>
        ) : schemes.map((scheme) => (
          <details key={scheme.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <summary className="cursor-pointer list-none">
              <span className="mr-2 text-xs font-bold uppercase text-blue-300">Term {scheme.term_number} · Week {scheme.week_number}</span>
              <span className="font-semibold">{scheme.topic}</span>
              <span className="ml-2 text-sm text-slate-400">{scheme.class_room?.name} · {scheme.subject?.name}</span>
              {!isTeacher && (
                <span className="ml-2 text-sm text-slate-400">
                  · {scheme.teacher?.user?.name ?? "Teacher profile unavailable"}
                </span>
              )}
              <span className="float-right rounded-full bg-slate-800 px-2 py-1 text-xs capitalize text-slate-300">{scheme.status.replaceAll("_", " ")}</span>
            </summary>
            {!isTeacher && (
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                {([
                  ["Subtopic", scheme.subtopic],
                  ["Learning objectives", scheme.objectives],
                  ["Activities", scheme.activities],
                  ["Resources", scheme.resources],
                  ["Assessment", scheme.assessment],
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
              <input type="hidden" name="id" value={scheme.id} />
              <label className="space-y-1 text-sm text-slate-300">Term
                <select name="term_number" defaultValue={scheme.term_number} className={fieldClass}>
                  <option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option>
                </select>
              </label>
              <label className="space-y-1 text-sm text-slate-300">Week
                <input name="week_number" type="number" min={1} max={20} required defaultValue={scheme.week_number} className={fieldClass} />
              </label>
              <label className="space-y-1 text-sm text-slate-300">Topic
                <input name="topic" required maxLength={255} defaultValue={scheme.topic} className={fieldClass} />
              </label>
              <label className="space-y-1 text-sm text-slate-300">Subtopic
                <input name="subtopic" maxLength={255} defaultValue={scheme.subtopic ?? ""} className={fieldClass} />
              </label>
              <label className="space-y-1 text-sm text-slate-300">Status
                <select name="status" defaultValue={scheme.status} className={fieldClass}>
                  <option value="not_started">Not started</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
              <label className="space-y-1 text-sm text-slate-300">Objectives
                <textarea name="objectives" rows={2} defaultValue={scheme.objectives ?? ""} className={fieldClass} />
              </label>
              <label className="space-y-1 text-sm text-slate-300">Activities
                <textarea name="activities" rows={3} defaultValue={scheme.activities ?? ""} className={fieldClass} />
              </label>
              <label className="space-y-1 text-sm text-slate-300">Resources
                <textarea name="resources" rows={2} defaultValue={scheme.resources ?? ""} className={fieldClass} />
              </label>
              <label className="space-y-1 text-sm text-slate-300">Assessment
                <textarea name="assessment" rows={2} defaultValue={scheme.assessment ?? ""} className={fieldClass} />
              </label>
              <button name="intent" value="update" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save changes</button>
              <button name="intent" value="delete" formNoValidate disabled={submitting} className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 disabled:opacity-50">Delete entry</button>
            </Form>
            )}
          </details>
        ))}
      </section>
    </main>
  );
}
