import { useState, type FormEvent } from "react";
import { redirect } from "react-router";
import type { Route } from "./+types/index";
import { api, type User } from "~/lib/api";

type AccountActionState = {
  passwordError?: string;
  passwordSuccess?: string;
  sessionError?: string;
};

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const apiError = error as {
      message?: string;
      errors?: Record<string, string[]>;
      response?: { data?: { message?: string; errors?: Record<string, string[]> } };
    };
    const errors = apiError.errors ?? apiError.response?.data?.errors;
    return Object.values(errors ?? {}).flat().find(Boolean)
      ?? apiError.response?.data?.message
      ?? apiError.message
      ?? "The request failed. Please try again.";
  }

  return "The request failed. Please try again.";
}

export async function clientLoader() {
  const response = await api.auth.me();
  if (response.data.role !== "teacher") {
    throw redirect("/");
  }

  return { user: response.data };
}

export default function TeacherAccountPage({
  loaderData,
}: Route.ComponentProps) {
  const { user } = loaderData as { user: User };
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [revokingSessions, setRevokingSessions] = useState(false);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSavingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      await api.auth.changePassword({
        current_password: String(form.get("current_password") ?? ""),
        password: String(form.get("password") ?? ""),
        password_confirmation: String(form.get("password_confirmation") ?? ""),
      });
      formElement.reset();
      setPasswordSuccess("Your password was changed.");
    } catch (error: unknown) {
      setPasswordError(getErrorMessage(error));
    } finally {
      setSavingPassword(false);
    }
  }

  async function logoutAllDevices() {
    if (!window.confirm("This will sign you out on all devices, including this one. Continue?")) {
      return;
    }

    setRevokingSessions(true);
    setSessionError("");

    try {
      await api.auth.logoutAllDevices();
      localStorage.removeItem("edunexus_token");
      window.location.assign("/login");
    } catch (error: unknown) {
      setSessionError(getErrorMessage(error));
      setRevokingSessions(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
      <header>
        <p className="mb-2 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
          Teacher account
        </p>
        <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">Account Settings</h1>
        <p className="mt-2 text-sm text-slate-400">
          Manage your sign-in security. School settings are managed by your administrator.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-100">Account</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Name</dt>
            <dd className="mt-1 text-sm text-slate-200">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-1 break-all text-sm text-slate-200">{user.email}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-100">Change password</h2>
        <p className="mt-1 text-sm text-slate-400">
          Use your current password to set a new password with at least 8 characters.
        </p>

        {passwordError && (
          <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {passwordError}
          </p>
        )}
        {passwordSuccess && (
          <p role="status" className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {passwordSuccess}
          </p>
        )}

        <form onSubmit={changePassword} className="mt-5 space-y-4">
          <label className="block text-sm text-slate-300">
            Current password
            <input
              name="current_password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>
          <label className="block text-sm text-slate-300">
            New password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Confirm new password
            <input
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingPassword ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-100">Active sessions</h2>
        <p className="mt-1 text-sm text-slate-400">
          Sign out of EduNexus on every device where you are currently signed in.
        </p>
        {sessionError && (
          <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {sessionError}
          </p>
        )}
        <button
          type="button"
          onClick={() => void logoutAllDevices()}
          disabled={revokingSessions}
          className="mt-4 rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {revokingSessions ? "Signing out…" : "Sign out all devices"}
        </button>
      </section>
    </main>
  );
}
