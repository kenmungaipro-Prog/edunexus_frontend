// ============================================================
// app/pages/auth/login.tsx
// ============================================================
import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/login";
import { api } from "~/lib/api";

// 1. Guard against authenticated users
export async function clientLoader() {
  const token = localStorage.getItem("edunexus_token");
  if (token) {
    throw redirect("/");
  }
  return {};
}
clientLoader.hydrate = true; // Fixes initial browser load bug

// 2. Handle form submission natively
export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    //await api.sanctum.getCsrfCookie();
    const res = await api.auth.login({ email, password });
    localStorage.removeItem("edunexus_academic_session_id");
    localStorage.setItem("edunexus_token", res.data.token);
    return redirect("/"); // Native framework redirect
  } catch (err: unknown) {
    return {
      error: (err as { message?: string })?.message ?? "Invalid credentials."
    };
  }
}

export default function LoginPage() {
  const actionData = useActionData<typeof clientAction>(); // Catches return errors
  const navigation = useNavigation(); // Automatically tracks loading states
  const [showPassword, setShowPassword] = useState(false);

  const isLoading = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-3 sm:p-6 text-white">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white mx-auto mb-4 shadow-lg">
  <img
    src="/public/logo.jpeg"
    alt="St. Peters logo"
    className="w-full h-full object-cover"
  />
</div>
          <h1 className="text-2xl font-bold">St.Peters Catholic School</h1>
          <p className="text-slate-400 text-sm mt-1">School Management System</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-7 shadow-2xl">
          <h2 className="text-lg font-bold mb-6">Sign In</h2>

          {/* Displays error returned from clientAction */}
          {actionData?.error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm rounded-lg p-3 mb-4">
              {actionData.error}
            </div>
          )}

          {/* Native Form component triggers clientAction automatically */}
          <Form method="post" className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                required
                autoComplete="username"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500 transition"
                placeholder="admin@school.edu.in"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 pr-12 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500 transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-controls="login-password"
                  aria-pressed={showPassword}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 rounded"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    {showPassword ? (
                      <>
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                        <path d="M9.9 5.2A10.8 10.8 0 0112 5c6.4 0 10 7 10 7a15.7 15.7 0 01-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10.7 10.7 0 004.1-.8" />
                      </>
                    ) : (
                      <>
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition mt-2"
            >
              {isLoading ? "Signing in..." : "Sign In →"}
            </button>
          </Form>

          <div className="mt-4 text-center">
            <Link to="/demo-login" className="text-xs text-blue-300 hover:text-blue-200 underline underline-offset-2">
              Looking for demo access?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}