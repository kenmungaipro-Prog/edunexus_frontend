// ============================================================
// app/pages/exams/new.tsx
// ============================================================
import { Form, redirect, useNavigation, useActionData, Link } from "react-router";
import type { Route } from "./+types/new";
import api from "~/lib/api";

export async function clientLoader() {
  // Fetch required dependencies for the form dropdowns
  const [classesRes, subjectsRes, teachersRes] = await Promise.all([
    api.classes.list({ per_page: 100 }),
    api.subjects.list(),
    api.teachers.list({ per_page: 100 }),
  ]);

  return {
    classes: classesRes.data,
    subjects: subjectsRes.data,
    // Assuming PaginatedResponse for teachers based on api.ts
    teachers: (teachersRes as any).data?.data || [], 
  };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  
  const payload = {
    title: formData.get("title") as string,
    class_id: Number(formData.get("class_id")),
    subject_id: Number(formData.get("subject_id")),
    invigilator_id: formData.get("invigilator_id") ? Number(formData.get("invigilator_id")) : undefined,
    exam_date: formData.get("exam_date") as string,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
    total_marks: Number(formData.get("total_marks")),
    passing_marks: Number(formData.get("passing_marks")),
    room: formData.get("room") as string,
    instructions: formData.get("instructions") as string,
  };

  try {
    await api.exams.create(payload);
    return redirect("/exams");
  } catch (error: any) {
    return { error: error.message || "Failed to schedule exam.", errors: error.errors };
  }
}

export default function NewExamPage({ loaderData, actionData }: Route.ComponentProps) {
  const { classes, subjects, teachers } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Schedule Exam</h1>
          <p className="text-slate-400 mt-1">Create a new examination block and assign an invigilator.</p>
        </div>
        <Link to="/exams" className="text-sm font-bold text-slate-400 hover:text-white uppercase tracking-wider">
          Cancel &larr;
        </Link>
      </div>

      {actionData?.error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 text-red-400 font-medium">
          {actionData.error}
        </div>
      )}

      <Form method="post" className="space-y-6 bg-slate-800 border border-slate-700 p-6 md:p-8">
        
        {/* Core Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Exam Title</label>
            <input 
              name="title" 
              type="text" 
              required 
              placeholder="e.g. Mid-Term Mathematics Assessment"
              className="w-full bg-slate-900 border border-slate-700 p-3 text-white focus:border-blue-500 outline-none transition-colors"
            />
            {actionData?.errors?.title && <p className="text-red-400 text-xs mt-1">{actionData.errors.title[0]}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Class</label>
            <select name="class_id" required className="w-full bg-slate-900 border border-slate-700 p-3 text-white focus:border-blue-500 outline-none appearance-none">
              <option value="">Select a class...</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Subject</label>
            <select name="subject_id" required className="w-full bg-slate-900 border border-slate-700 p-3 text-white focus:border-blue-500 outline-none appearance-none">
              <option value="">Select a subject...</option>
              {subjects.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <hr className="border-slate-700 my-8" />

        {/* Scheduling Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Date</label>
            <input name="exam_date" type="date" required className="w-full bg-slate-900 border border-slate-700 p-3 text-white focus:border-blue-500 outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Start Time</label>
            <input name="start_time" type="time" required className="w-full bg-slate-900 border border-slate-700 p-3 text-white focus:border-blue-500 outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">End Time</label>
            <input name="end_time" type="time" required className="w-full bg-slate-900 border border-slate-700 p-3 text-white focus:border-blue-500 outline-none" />
          </div>
        </div>

        <hr className="border-slate-700 my-8" />

        {/* Scoring & Logistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Marks</label>
            <input name="total_marks" type="number" required min="1" defaultValue="100" className="w-full bg-slate-900 border border-slate-700 p-3 text-white focus:border-blue-500 outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Passing Marks</label>
            <input name="passing_marks" type="number" required min="1" defaultValue="40" className="w-full bg-slate-900 border border-slate-700 p-3 text-white focus:border-blue-500 outline-none" />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Room</label>
            <input name="room" type="text" placeholder="e.g. Hall A" className="w-full bg-slate-900 border border-slate-700 p-3 text-white focus:border-blue-500 outline-none" />
          </div>

          <div className="space-y-2 md:col-span-3">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Invigilator (Optional)</label>
            <select name="invigilator_id" className="w-full bg-slate-900 border border-slate-700 p-3 text-white focus:border-blue-500 outline-none appearance-none">
              <option value="">None / Unassigned</option>
              {teachers.map((t: any) => (
                <option key={t.id} value={t.id}>{t.user?.name || t.employee_id}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2 md:col-span-3">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Instructions</label>
            <textarea name="instructions" rows={3} placeholder="Special instructions for students or invigilators..." className="w-full bg-slate-900 border border-slate-700 p-3 text-white focus:border-blue-500 outline-none resize-none" />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-700 flex justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Scheduling..." : "Schedule Exam"}
          </button>
        </div>
      </Form>
    </div>
  );
}