// ============================================================
// app/pages/auth/login.tsx
// ============================================================
import { useRef } from "react";
import { redirect, Form, useActionData, useNavigation } from "react-router";
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
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  
  const demoUsers = [
    { label: "School Admin", email: "admin@greenwood.edu.in", password: "password" },
    { label: "Super Admin", email: "superadmin@edunexus.com", password: "password" },
    { label: "Teacher: Dr. Sunita Rao", email: "sunita.rao@greenwood.edu.in", password: "password" },
    { label: "Teacher: Arjun Pillai", email: "arjun.pillai@greenwood.edu.in", password: "password" },
    { label: "Teacher: Kavya Menon", email: "kavya.menon@greenwood.edu.in", password: "password" },
    { label: "Accountant", email: "accounts@greenwood.edu.in", password: "password" },
    { label: "Librarian", email: "library@greenwood.edu.in", password: "password" },
    { label: "Student: Arjun Kumar", email: "student@greenwood.edu.in", password: "password" },
    { label: "Parent: Mrs. Priya Kumar", email: "parent@greenwood.edu.in", password: "password" },
  ];

  const fillDemoUser = (email: string, password: string) => {
    if (emailRef.current) emailRef.current.value = email;
    if (passwordRef.current) passwordRef.current.value = password;
  };

  const isLoading = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 text-white">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-2xl mx-auto mb-3 shadow-lg">EN</div>
          <h1 className="text-xl sm:text-2xl font-bold">EduNexus</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">School Management System</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 sm:p-7 shadow-2xl">
          <h2 className="text-base sm:text-lg font-bold mb-5 sm:mb-6">Sign In</h2>

          {/* Displays error returned from clientAction */}
          {actionData?.error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs sm:text-sm rounded-lg p-3 mb-4">
              {actionData.error}
            </div>
          )}

          {/* Native Form component triggers clientAction automatically */}
          <Form method="post" className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Email Address</label>
              <input
                ref={emailRef}
                type="email"
                name="email"
                defaultValue="admin@greenwood.edu.in"
                required
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500 transition"
                placeholder="admin@school.edu.in"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Password</label>
              <input
                ref={passwordRef}
                type="password"
                name="password"
                defaultValue="password"
                required
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500 transition"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Quick Demo Accounts:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[240px] sm:max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {demoUsers.map((user) => (
                  <button
                    key={user.email}
                    type="button"
                    onClick={() => fillDemoUser(user.email, user.password)}
                    className="text-left text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 transition active:scale-[0.98]"
                  >
                    <span className="block text-slate-200 truncate">{user.label}</span>
                    <span className="block text-slate-500 truncate">{user.email}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition text-sm sm:text-base mt-2"
            >
              {isLoading ? "Signing in..." : "Sign In →"}
            </button>
          </Form>

          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-500 font-semibold mb-1">Default credentials:</p>
            <p className="text-xs text-slate-400 font-mono truncate">
              admin@greenwood.edu.in / password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}