// ============================================================
// app/pages/subjects/new.tsx
// ============================================================
import { Form, Link, useNavigation } from "react-router";
import { api } from "~/lib/api";

export async function clientAction({ request }: any) {
  const form = await request.formData();
  const payload = {
    name: form.get("name"),
    code: form.get("code"),
    type: form.get("type"),
  } as any;

  try {
    await api.subjects.create(payload);
    const { redirect } = await import("react-router");
    return redirect("/subjects");
  } catch (err: unknown) {
    const e = err as any;
    return { error: e?.message ?? "Failed to create subject.", errors: e?.errors ?? {} };
  }
}

export default function SubjectNew({ actionData }: any) {
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const errors = (actionData?.errors ?? {}) as Record<string, string[]>;
  const generalError = actionData?.error;

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-8 space-y-6">
      {/* Back link */}
      <div>
        <Link to="/subjects" className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors">
          ← Back to Subjects
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Create New Subject</h1>
        <p className="text-sm text-slate-400 mt-1">Add a new academic subject to the curriculum system.</p>
      </div>

      {generalError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {generalError}
        </div>
      )}

      <Form method="post" className="space-y-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <label className="block text-sm font-medium text-slate-300">
          Subject Name
          <input 
            name="name" 
            required 
            placeholder="e.g. Advanced Mathematics"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name[0]}</p>}
        </label>

        <label className="block text-sm font-medium text-slate-300">
          Subject Code
          <input 
            name="code" 
            placeholder="e.g. MAT-301"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
          />
          {errors.code && <p className="mt-1.5 text-xs text-red-400">{errors.code[0]}</p>}
        </label>

        <label className="block text-sm font-medium text-slate-300">
          Subject Type
          <select 
            name="type" 
            required 
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="core">Core</option>
            <option value="elective">Elective</option>
            <option value="activity">Activity</option>
          </select>
          {errors.type && <p className="mt-1.5 text-xs text-red-400">{errors.type[0]}</p>}
        </label>

        <div className="pt-2 flex items-center gap-3">
          <Link 
            to="/subjects" 
            className="w-1/3 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-center py-2.5 text-sm font-semibold transition-all"
          >
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={submitting} 
            className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create Subject'}
          </button>
        </div>
      </Form>
    </div>
  );
}