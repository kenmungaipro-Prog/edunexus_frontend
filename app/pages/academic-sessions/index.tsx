import { Form, redirect } from "react-router";
import type { Route } from "./+types/index";
import { api, type AcademicSession } from "~/lib/api";

type ActionResult = {
  success?: string;
  error?: string;
};

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const apiError = error as {
      message?: string;
      response?: { data?: { message?: string; errors?: Record<string, string[]> } };
    };
    const errors = apiError.response?.data?.errors;
    return Object.values(errors ?? {}).flat()[0]
      ?? apiError.response?.data?.message
      ?? apiError.message
      ?? "The request failed. Please try again.";
  }

  return "The request failed. Please try again.";
}

export async function clientLoader() {
  const [userResponse, sessionsResponse] = await Promise.all([
    api.auth.me(),
    api.academicSessions.list(),
  ]);
  const role = userResponse.data.role;

  if (role !== "admin" && role !== "superadmin") {
    throw redirect("/");
  }

  return { sessions: sessionsResponse.data as AcademicSession[] };
}

export async function clientAction({ request }: Route.ClientActionArgs): Promise<ActionResult> {
  const form = await request.formData();
  const intent = form.get("intent");

  try {
    if (intent === "create") {
      await api.academicSessions.create({
        name: String(form.get("name") ?? "").trim(),
        start_date: String(form.get("start_date") ?? ""),
        end_date: String(form.get("end_date") ?? ""),
        is_active: true,
        is_current: form.get("is_current") === "on",
      });

      return { success: "Academic session created." };
    }

    if (intent === "set-current") {
      const sessionId = Number(form.get("session_id"));
      if (!Number.isInteger(sessionId) || sessionId < 1) {
        return { error: "Select a valid academic session." };
      }

      await api.academicSessions.update(sessionId, {
        is_active: true,
        is_current: true,
      });

      return { success: "Current academic session updated." };
    }

    return { error: "Choose a valid session action." };
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
  }
}

export default function AcademicSessionsPage({
  loaderData,
  actionData,
}: Route.ComponentProps & { actionData?: ActionResult }) {
  const sessions = loaderData.sessions;
  const message = actionData?.success ?? actionData?.error;

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-8">
      <header className="mb-8">
        <p className="mb-2 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
          School administration
        </p>
        <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">Academic Sessions</h1>
        <p className="mt-2 text-sm text-slate-400">
          Create school-year records and choose which one is current. Creating a session does not move classes or students.
        </p>
      </header>

      {message && (
        <div
          role={actionData?.error ? "alert" : "status"}
          className={`mb-6 rounded-xl border p-4 text-sm ${
            actionData?.error
              ? "border-red-500/30 bg-red-500/10 text-red-200"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          {message}
        </div>
      )}

      <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-100">Create a session</h2>
        <Form method="post" className="mt-5 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="intent" value="create" />
          <label className="text-sm text-slate-300">
            Session name
            <input
              name="name"
              required
              maxLength={255}
              placeholder="2026-27"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>
          <span className="hidden sm:block" />
          <label className="text-sm text-slate-300">
            Start date
            <input
              name="start_date"
              type="date"
              required
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>
          <label className="text-sm text-slate-300">
            End date
            <input
              name="end_date"
              type="date"
              required
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-2">
            <input
              name="is_current"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-blue-500"
            />
            Make this the current session now
          </label>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 sm:col-span-2 sm:justify-self-start"
          >
            Create session
          </button>
        </Form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold text-slate-100">Sessions for this school</h2>
        </div>
        {sessions.length === 0 ? (
          <p className="p-5 text-sm text-slate-400">No academic sessions have been created yet.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-slate-100">{session.name}</h3>
                    {session.is_current && (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                        Current
                      </span>
                    )}
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${
                      session.is_active
                        ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
                        : "border-slate-700 bg-slate-800 text-slate-400"
                    }`}>
                      {session.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {session.start_date} to {session.end_date}
                  </p>
                </div>
                {!session.is_current && (
                  <Form method="post">
                    <input type="hidden" name="intent" value="set-current" />
                    <input type="hidden" name="session_id" value={session.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:border-blue-500 hover:text-blue-300"
                    >
                      Set as current
                    </button>
                  </Form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
