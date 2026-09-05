// ============================================================
// app/pages/subjects/[id]/edit.tsx
// ============================================================
import { useNavigation, useLoaderData, Form, Link } from "react-router";
import { api, type Subject } from "~/lib/api";

export async function clientLoader({ params }: any) {
  const id = Number(params.id);
  const res = await api.subjects.get(id);
  return { subject: res.data as Subject };
}

export async function clientAction({ request, params }: any) {
  const id = Number(params.id);
  const form = await request.formData();
  const action = form.get("_action");

  try {
    if (action === "delete") {
      await api.subjects.delete(id);
      const { redirect } = await import("react-router");
      return redirect("/subjects");
    }

    const payload: any = {
      name: form.get("name"),
      code: form.get("code"),
      type: form.get("type"),
    };

    await api.subjects.update(id, payload);
    const { redirect } = await import("react-router");
    return redirect(`/subjects`);
  } catch (err: unknown) {
    const e = err as any;
    return { error: e?.message ?? "Failed to update.", errors: e?.errors ?? {} };
  }
}

export default function SubjectEdit({ actionData }: { actionData?: any }) {
  const loader = useLoaderData() as { subject: Subject };
  const subject = loader.subject;
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Edit Subject</h1>
          <p className="text-sm text-slate-400 mt-1">Update details for <span className="text-slate-200 font-medium">{subject.name}</span>.</p>
        </div>
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
            defaultValue={subject.name} 
            required 
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name[0]}</p>}
        </label>

        <label className="block text-sm font-medium text-slate-300">
          Subject Code
          <input 
            name="code" 
            defaultValue={subject.code ?? ""} 
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
          />
          {errors.code && <p className="mt-1.5 text-xs text-red-400">{errors.code[0]}</p>}
        </label>

        <label className="block text-sm font-medium text-slate-300">
          Subject Type
          <select 
            name="type" 
            defaultValue={subject.type} 
            required 
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="core">Core</option>
            <option value="elective">Elective</option>
            <option value="activity">Activity</option>
          </select>
          {errors.type && <p className="mt-1.5 text-xs text-red-400">{errors.type[0]}</p>}
        </label>

        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
          <button 
            type="submit" 
            disabled={submitting} 
            className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </Form>

      {/* Separate distinct danger zone card for safety */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-red-400">Delete Subject</h3>
          <p className="text-xs text-slate-400 mt-0.5">Permanently remove this subject and its system links.</p>
        </div>
        <Form method="post" onSubmit={(e) => { if (!confirm('Are you sure you want to delete this subject? This action cannot be undone.')) e.preventDefault(); }}>
          <input type="hidden" name="_action" value="delete" />
          <button 
            type="submit" 
            className="rounded-xl bg-red-600 hover:bg-red-500 text-white px-4 py-2 text-xs font-semibold shadow-lg shadow-red-600/20 transition-all"
          >
            Delete
          </button>
        </Form>
      </div>
    </div>
  );
}