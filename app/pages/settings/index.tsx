import { useState, type FormEvent } from "react";
import { Form } from "react-router";
import { api, publicStorageUrl, type School, type User } from "~/lib/api";

type SettingsData = {
  notifications: Record<string, boolean>;
  preferences: Record<string, unknown>;
  academic: Record<string, unknown>;
};

export async function clientLoader() {
  const [schoolResponse, settingsResponse, userResponse] = await Promise.all([
    api.settings.school(),
    api.settings.get(),
    api.auth.me(),
  ]);
  return {
    school: schoolResponse.data,
    settings: settingsResponse.data,
    user: userResponse.data,
  };
}

export async function clientAction({ request }: { request: Request }) {
  const form = await request.formData();
  const intent = form.get("_intent");

  if (intent === "preferences") {
    try {
      const booleanValue = (key: string) => form.get(key) === "on";
      await api.settings.update({
        notifications: {
          email_alerts: booleanValue("email_alerts"),
          sms_alerts: booleanValue("sms_alerts"),
          fee_reminders: booleanValue("fee_reminders"),
          attendance_alerts: booleanValue("attendance_alerts"),
          exam_reminders: booleanValue("exam_reminders"),
        },
      });
      return { success: true };
    } catch (error: unknown) {
      console.error("Failed to save notification settings:", error);
      const response = error as { message?: string; errors?: Record<string, string[]> };
      return {
        error: response.message ?? "Failed to save notification settings.",
        errors: response.errors ?? {},
      };
    }
  }

  if (!(form.get("logo") instanceof File) || (form.get("logo") as File).size === 0) {
    form.delete("logo");
  }
  form.set("_method", "PUT");
  try {
    await api.settings.updateSchool(form);
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to save school settings:", error);
    const response = error as { message?: string; errors?: Record<string, string[]> };
    return {
      error: response.message ?? "Failed to save school settings.",
      errors: response.errors ?? {},
    };
  }
}

function apiErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const apiError = error as {
      message?: string;
      errors?: Record<string, string[]>;
      response?: { data?: { message?: string; errors?: Record<string, string[]> } };
    };
    const errors = apiError.errors ?? apiError.response?.data?.errors;
    const firstValidationError = errors && Object.values(errors).flat().find(Boolean);
    return firstValidationError ??
      apiError.response?.data?.message ??
      apiError.message ??
      "The request failed. Please try again.";
  }
  return "The request failed. Please try again.";
}

export default function SettingsPage({ loaderData, actionData }: {
  loaderData: { school: School; settings: SettingsData; user: User };
  actionData?: { success?: boolean; error?: string; errors?: Record<string, string[]> };
}) {
  const { school, settings, user } = loaderData;
  const logoUrl = publicStorageUrl(school.logo);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const [revokingSessions, setRevokingSessions] = useState(false);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSavingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");
    const form = new FormData(formElement);

    try {
      await api.auth.changePassword({
        current_password: String(form.get("current_password") ?? ""),
        password: String(form.get("password") ?? ""),
        password_confirmation: String(form.get("password_confirmation") ?? ""),
      });
      formElement.reset();
      setShowPasswordForm(false);
      setPasswordSuccess("Password changed successfully.");
    } catch (error: unknown) {
      setPasswordError(apiErrorMessage(error));
    } finally {
      setSavingPassword(false);
    }
  }

  async function logoutAllDevices() {
    if (!window.confirm("This will sign you out on all devices, including this one. Continue?")) return;

    setRevokingSessions(true);
    setSecurityError("");
    try {
      await api.auth.logoutAllDevices();
      localStorage.removeItem("edunexus_token");
      window.location.assign("/login");
    } catch (error: unknown) {
      setSecurityError(apiErrorMessage(error));
      setRevokingSessions(false);
    }
  }

  const notificationOptions = [
    { name: "email_alerts", label: "Email Notifications", description: "Allow school email alerts." },
    { name: "sms_alerts", label: "SMS Alerts", description: "Allow school SMS alerts." },
    { name: "fee_reminders", label: "Fee Reminders", description: "Include fee reminders in notifications." },
    { name: "attendance_alerts", label: "Attendance Alerts", description: "Include attendance alerts in notifications." },
    { name: "exam_reminders", label: "Exam Reminders", description: "Include exam reminders in notifications." },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6">
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">⚙️ Settings</h1>
      {actionData?.success && (
        <div role="status" className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-400">
          Settings saved successfully.
        </div>
      )}
      {actionData?.error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-400">
          {actionData.error}
          {actionData.errors && Object.values(actionData.errors).flat().map((message, index) => (
            <div key={`${message}-${index}`} className="mt-1">{message}</div>
          ))}
        </div>
      )}
      {passwordSuccess && (
        <div role="status" className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-400">
          {passwordSuccess}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold">🏫 School Information</h2>
          <Form method="post" encType="multipart/form-data" className="space-y-4">
            {[
              { name: "name", label: "School Name", placeholder: "Greenwood International", required: true },
              { name: "principal", label: "Principal", placeholder: "School principal" },
              { name: "email", label: "Contact Email", placeholder: "admin@school.edu", required: true },
              { name: "phone", label: "Phone", placeholder: "+254 700 000 000" },
              { name: "address", label: "Address", placeholder: "School address" },
              { name: "board", label: "Board", placeholder: "Education board" },
              { name: "admission_prefix", label: "Admission Number Prefix", placeholder: "SPSK" },
            ].map((field) => (
              <div key={field.name}>
                <label htmlFor={`school-${field.name}`} className="mb-1.5 block text-xs font-semibold text-slate-400">
                  {field.label}
                </label>
                <input
                  id={`school-${field.name}`}
                  name={field.name}
                  required={field.required}
                  defaultValue={school[field.name as keyof School] ?? ""}
                  placeholder={field.placeholder}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
                {field.name === "admission_prefix" && (
                  <p className="mt-1 text-xs text-slate-500">
                    New automatic admission numbers use this prefix, for example SPSK-0001. Existing student numbers are unchanged.
                  </p>
                )}
              </div>
            ))}
            <div>
              <label htmlFor="school-logo" className="mb-1.5 block text-xs font-semibold text-slate-400">
                School Logo for Printouts
              </label>
              <input
                id="school-logo"
                name="logo"
                type="file"
                accept="image/png,image/jpeg"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1 file:text-white"
              />
              <p className="mt-1 text-xs text-slate-500">PNG or JPG, up to 2 MB. Uploaded logos appear on printable school documents.</p>
              {logoUrl && (
                <img src={logoUrl} alt="Current school logo" className="mt-3 max-h-20 max-w-48 rounded border border-slate-600 bg-white p-2" />
              )}
            </div>
            <button type="submit" className="mt-2 w-full cursor-pointer rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
              💾 Save Changes
            </button>
          </Form>
        </section>

        <div className="space-y-4">
          <section className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:p-6">
            <h2 className="mb-1 text-sm font-semibold">🔔 Notification Preferences</h2>
            <p className="mb-4 text-xs text-slate-500">Save the school-wide notification options used by the application.</p>
            <Form method="post" className="space-y-3">
              <input type="hidden" name="_intent" value="preferences" />
              {notificationOptions.map((option) => (
                <label key={option.name} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900/50 p-3">
                  <span>
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="block text-xs text-slate-500">{option.description}</span>
                  </span>
                  <input
                    type="checkbox"
                    name={option.name}
                    defaultChecked={Boolean(settings.notifications?.[option.name])}
                    className="h-4 w-4 shrink-0 accent-blue-500"
                  />
                </label>
              ))}
              <button type="submit" className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
                Save Notification Preferences
              </button>
            </Form>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold">🔐 Security</h2>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setPasswordError("");
                  setShowPasswordForm((visible) => !visible);
                }}
                aria-expanded={showPasswordForm}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-left text-sm transition hover:border-blue-500"
              >
                🔑 {showPasswordForm ? "Cancel Password Change" : "Change Password"}
              </button>
              {showPasswordForm && (
                <form onSubmit={changePassword} className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/50 p-3">
                  {passwordError && <p role="alert" className="text-sm text-red-400">{passwordError}</p>}
                  <label className="block text-xs font-semibold text-slate-400">
                    Current Password
                    <input name="current_password" type="password" autoComplete="current-password" required className="mt-1.5 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white" />
                  </label>
                  <label className="block text-xs font-semibold text-slate-400">
                    New Password
                    <input name="password" type="password" autoComplete="new-password" minLength={8} required className="mt-1.5 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white" />
                  </label>
                  <label className="block text-xs font-semibold text-slate-400">
                    Confirm New Password
                    <input name="password_confirmation" type="password" autoComplete="new-password" minLength={8} required className="mt-1.5 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white" />
                  </label>
                  <button type="submit" disabled={savingPassword} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                    {savingPassword ? "Saving…" : "Update Password"}
                  </button>
                </form>
              )}

              <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
                <p className="text-sm font-medium">📋 Last Login</p>
                <p className="mt-1 text-xs text-slate-500">
                  {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "No login timestamp recorded."}
                </p>
              </div>
              {securityError && <p role="alert" className="text-sm text-red-400">{securityError}</p>}
              <button
                type="button"
                onClick={() => void logoutAllDevices()}
                disabled={revokingSessions}
                className="w-full rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-left text-sm text-red-400 transition hover:border-red-500/40 disabled:opacity-50"
              >
                🚪 {revokingSessions ? "Signing out…" : "Logout All Devices"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
