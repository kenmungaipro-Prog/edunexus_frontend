// ============================================================
// app/pages/subjects/index.tsx
// ============================================================
import { Link, Form } from "react-router";
import { api, type Subject } from "~/lib/api";

export async function clientLoader() {
  const res = await api.subjects.list();
  return { subjects: (res.data as Subject[]) ?? [] };
}

export async function clientAction({ request }: any) {
  const form = await request.formData();
  const action = form.get("_action");

  try {
    if (action === "delete") {
      const id = Number(form.get("id"));
      if (!Number.isNaN(id)) {
        await api.subjects.delete(id);
      }
    }
    return { success: true };
  } catch (err: unknown) {
    const e = err as any;
    return { error: e?.message ?? "Failed to perform action." };
  }
}

export default function SubjectsIndex({ loaderData, actionData }: any) {
  const subjects: Subject[] = loaderData?.subjects ?? [];
  const error = actionData?.error;

  const totalSubjects = subjects.length;
  const totalExams = subjects.reduce((sum, subject) => sum + (subject.exams_count ?? 0), 0);
  const totalTeachers = subjects.reduce((sum, subject) => sum + (subject.teachers_count ?? 0), 0);

  const getTypeBadgeStyle = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'core':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'elective':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'activity':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Subjects</h1>
          <p className="text-sm text-slate-400 mt-1">Manage academic subjects, track associated exams, and teaching staff.</p>
        </div>
        <Link 
          to="/subjects/new" 
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all"
        >
          + New Subject
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Subjects</p>
          <p className="mt-2 text-3xl font-bold text-white">{totalSubjects}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Linked Exams</p>
          <p className="mt-2 text-3xl font-bold text-white">{totalExams}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Assigned Teachers</p>
          <p className="mt-2 text-3xl font-bold text-white">{totalTeachers}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {subjects.length === 0 ? (
          <div className="text-sm text-slate-400 py-12 text-center">
            No subjects found. Create your first subject to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-medium">Name</th>
                  <th className="py-3.5 px-4 font-medium">Code</th>
                  <th className="py-3.5 px-4 font-medium">Type</th>
                  <th className="py-3.5 px-4 font-medium">Exams</th>
                  <th className="py-3.5 px-4 font-medium">Teachers</th>
                  <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-100">{s.name}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">{s.code ?? "—"}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeBadgeStyle(s.type)}`}>
                        {s.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{s.exams_count ?? 0}</td>
                    <td className="py-3.5 px-4 text-slate-300">{s.teachers_count ?? 0}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link 
                          to={`/subjects/${s.id}/edit`} 
                          className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Edit
                        </Link>
                        <Form method="post" replace onSubmit={(e) => { if (!confirm('Are you sure you want to delete this subject?')) e.preventDefault(); }}>
                          <input type="hidden" name="_action" value="delete" />
                          <input type="hidden" name="id" value={String(s.id)} />
                          <button type="submit" className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors">
                            Delete
                          </button>
                        </Form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}