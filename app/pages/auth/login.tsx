// ============================================================
// app/pages/auth/login.tsx
// ============================================================
import { redirect, Form, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/login";
import api from "~/lib/api";

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
  
  const isLoading = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-sm">
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
                defaultValue="admin@greenwood.edu.in"
                required
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500 transition"
                placeholder="admin@school.edu.in"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Password</label>
              <input
                type="password"
                name="password"
                defaultValue="password"
                required
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500 transition"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition mt-2"
            >
              {isLoading ? "Signing in..." : "Sign In →"}
            </button>
          </Form>

          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-500 font-semibold mb-2">Demo credentials:</p>
            <p className="text-xs text-slate-400 font-mono">admin@greenwood.edu.in</p>
            <p className="text-xs text-slate-400 font-mono">password</p>
          </div>
        </div>
      </div>
    </div>
  );
}
