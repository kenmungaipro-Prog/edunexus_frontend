import { useState, useEffect } from "react";
import { Form, useSubmit, useActionData, useNavigation } from "react-router";
import type { Route as TTRoute } from "./+types/index";
import apiService, { type TimetableSlot, type ClassRoom, type Subject, type Teacher } from "~/lib/api";

// --- Constants & Styling ---

const DAYS = [
  { id: 1, label: "Monday" },
  { id: 2, label: "Tuesday" },
  { id: 3, label: "Wednesday" },
  { id: 4, label: "Thursday" },
  { id: 5, label: "Friday" },
  { id: 6, label: "Saturday" },
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const SUBJECT_COLORS = [
  "bg-blue-500/15 text-blue-400 border-blue-500/25",
  "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  "bg-amber-500/15 text-amber-400 border-amber-500/25",
  "bg-violet-500/15 text-violet-400 border-violet-500/25",
  "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  "bg-pink-500/15 text-pink-400 border-pink-500/25",
  "bg-rose-500/15 text-rose-400 border-rose-500/25",
  "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
];

const getSubjectStyle = (subjectId: number) => {
  return SUBJECT_COLORS[subjectId % SUBJECT_COLORS.length];
};

// --- Data Loading & Actions ---

export async function clientLoader() {
  try {
    const [classesRes, subjectsRes, teachersRes] = await Promise.all([
      apiService.classes.list({ per_page: 100 }),
      apiService.subjects.list({ per_page: 100 }),
      apiService.teachers.list({ per_page: 100 }),
    ]);
    return { 
      classes: classesRes.data.data || [],
      subjects: subjectsRes.data.data || [],
      teachers: teachersRes.data.data || []
    };
  } catch (error) {
    console.error("Loader failed:", error);
    return { classes: [], subjects: [], teachers: [] };
  }
}

export async function clientAction({ request }: TTRoute.ClientActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "generate") {
      const classId = Number(formData.get("class_id"));
      await apiService.timetable.generate({ class_id: classId });
      return { success: true, message: "Schedule auto-generated!" };
    }

    if (intent === "manual_save") {
      const data = {
        class_id: Number(formData.get("class_id")),
        subject_id: Number(formData.get("subject_id")),
        teacher_id: Number(formData.get("teacher_id")),
        day_of_week: Number(formData.get("day_of_week")),
        period_number: Number(formData.get("period_number")),
        start_time: String(formData.get("start_time")),
        end_time: String(formData.get("end_time")),
        room: String(formData.get("room")),
      };
      await apiService.timetable.store(data);
      return { success: true, message: "Slot updated successfully." };
    }
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Operation failed." };
  }
  return {};
}

// --- Main Component ---

export default function TimetablePage({ loaderData }: TTRoute.ComponentProps) {
  const { classes, subjects, teachers } = loaderData;
  const actionData = useActionData() as any;
  const navigation = useNavigation();
  
  const [selectedClass, setSelectedClass] = useState<string>(classes[0]?.id?.toString() || "");
  const [timetable, setTimetable] = useState<Record<number, TimetableSlot[]>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCell, setActiveCell] = useState<{ day: number, period: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch timetable slots for the selected class
  useEffect(() => {
    if (selectedClass) {
      setIsLoading(true);
      apiService.timetable.get(Number(selectedClass))
        .then(res => setTimetable(res.data))
        .finally(() => setIsLoading(false));
    }
  }, [selectedClass, actionData]);

  const getSlot = (day: number, period: number) => {
    return timetable[day]?.find(s => s.period_number === period);
  };

  const isProcessing = navigation.state !== "idle";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">📅 Class Timetable</h1>
          <p className="text-slate-400 text-sm">Real-time schedule management for all grades</p>
        </div>

        <div className="flex gap-3">
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 transition"
          >
            {classes.map((c: ClassRoom) => (
              <option key={c.id} value={c.id}>{c.name} {c.section && `(${c.section})`}</option>
            ))}
          </select>

          <Form method="post">
            <input type="hidden" name="intent" value="generate" />
            <input type="hidden" name="class_id" value={selectedClass} />
            <button 
              type="submit"
              disabled={isProcessing || !selectedClass}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold transition disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing ? "Generating..." : "⚡ Auto-Generate"}
            </button>
          </Form>
        </div>
      </div>

      {/* Notifications */}
      {actionData?.message && (
        <div className={`mb-6 p-4 rounded-lg border ${actionData.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
          {actionData.success ? '✅' : '⚠️'} {actionData.message}
        </div>
      )}

      {/* Timetable Grid */}
      <div className={`bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-2xl transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        <table className="w-full border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-800/40">
              <th className="p-4 text-left text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800 w-24">Period</th>
              {DAYS.map(day => (
                <th key={day.id} className="p-4 text-center text-slate-200 font-bold border-b border-slate-800">
                  {day.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map(p => (
              <tr key={p} className="border-b border-slate-800/50 last:border-0 hover:bg-white/[0.01] transition">
                <td className="p-4 text-slate-400 font-mono text-sm bg-slate-800/10 text-center border-r border-slate-800/50">
                  P{p}
                </td>
                {DAYS.map(d => {
                  const slot = getSlot(d.id, p);
                  return (
                    <td key={d.id} className="p-2 h-28 group">
                      {slot ? (
                        <div className={`relative border rounded-xl p-3 h-full flex flex-col justify-center items-center text-center transition-all duration-200 hover:scale-[1.02] hover:brightness-125 cursor-pointer ${getSubjectStyle(slot.subject_id)}`}>
                          <span className="font-bold text-sm leading-tight mb-1">{slot.subject?.name}</span>
                          <span className="opacity-70 text-[10px] font-medium uppercase tracking-tight truncate w-full">
                            {slot.teacher?.user?.name}
                          </span>
                          {slot.room && (
                            <span className="mt-2 text-[9px] bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full text-white/80">
                              {slot.room}
                            </span>
                          )}
                        </div>
                      ) : (
                        <button 
                          onClick={() => { setActiveCell({ day: d.id, period: p }); setIsModalOpen(true); }}
                          className="w-full h-full border-2 border-dashed border-slate-800 rounded-xl hover:border-blue-500/40 hover:bg-blue-500/5 transition-all flex items-center justify-center text-slate-700 group"
                        >
                          <span className="text-2xl group-hover:text-blue-500/60">+</span>
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Manual Slot Modal */}
      {isModalOpen && activeCell && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-slate-800/20">
              <h2 className="text-xl font-bold text-white">Assign Schedule Slot</h2>
              <p className="text-slate-400 text-xs mt-1">
                {DAYS.find(d => d.id === activeCell.day)?.label} — Period {activeCell.period}
              </p>
            </div>
            
            <Form method="post" onSubmit={() => setIsModalOpen(false)} className="p-6">
              <input type="hidden" name="intent" value="manual_save" />
              <input type="hidden" name="class_id" value={selectedClass} />
              <input type="hidden" name="day_of_week" value={activeCell.day} />
              <input type="hidden" name="period_number" value={activeCell.period} />

              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Subject</label>
                    <select name="subject_id" required className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none">
                      {subjects.map((s: Subject) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Teacher</label>
                    <select name="teacher_id" required className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none">
                      {teachers.map((t: Teacher) => <option key={t.id} value={t.id}>{t.user?.name || t.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Start</label>
                    <input type="time" name="start_time" defaultValue="08:00" required className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">End</label>
                    <input type="time" name="end_time" defaultValue="09:00" required className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Location/Room</label>
                  <input type="text" name="room" placeholder="e.g. Science Lab 1" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white placeholder:text-slate-600 focus:border-blue-500 outline-none" />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition font-bold shadow-lg shadow-blue-900/20">Save Slot</button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}