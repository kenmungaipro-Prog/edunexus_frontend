import { useState, useEffect, useRef } from "react";
import { Form, useSubmit, useActionData, useNavigation } from "react-router";
import type { Route as TTRoute } from "./+types/index";
import { apiService, type TimetableSlot, type ClassRoom, type Subject, type Teacher } from "~/lib/api";

// --- Constants & Styling ---

const DAYS = [
  { id: 1, label: "Monday", short: "Mon" },
  { id: 2, label: "Tuesday", short: "Tue" },
  { id: 3, label: "Wednesday", short: "Wed" },
  { id: 4, label: "Thursday", short: "Thu" },
  { id: 5, label: "Friday", short: "Fri" },
  { id: 6, label: "Saturday", short: "Sat" },
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const SUBJECT_COLORS = [
  "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:border-blue-500/40",
  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40",
  "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:border-amber-500/40",
  "bg-violet-500/10 text-violet-400 border-violet-500/20 hover:border-violet-500/40",
  "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:border-cyan-500/40",
  "bg-pink-500/10 text-pink-400 border-pink-500/20 hover:border-pink-500/40",
  "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:border-rose-500/40",
  "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:border-indigo-500/40",
];

const getSubjectStyle = (subjectId: number) => {
  return SUBJECT_COLORS[subjectId % SUBJECT_COLORS.length];
};

// --- Data Loading & Actions ---

function normalizeListData<T>(response: any): T[] {
  if (Array.isArray(response?.data)) return response.data as T[];
  if (Array.isArray(response?.data?.data)) return response.data.data as T[];
  return [];
}

export async function clientLoader() {
  try {
    const [classesRes, subjectsRes, teachersRes] = await Promise.all([
      apiService.classes.list({ per_page: 100 }),
      apiService.subjects.list({ per_page: 100 }),
      apiService.teachers.list({ per_page: 100 }),
    ]);
    return {
      classes: normalizeListData<ClassRoom>(classesRes),
      subjects: normalizeListData<Subject>(subjectsRes),
      teachers: normalizeListData<Teacher>(teachersRes),
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

// --- Custom Class / Grade Dropdown Component ---

function ClassSelectorDropdown({
  classes,
  selectedClassId,
  onSelect,
}: {
  classes: ClassRoom[];
  selectedClassId: string;
  onSelect: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedClass = classes.find((c) => c.id.toString() === selectedClassId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClasses = classes.filter((c) => {
    const query = search.toLowerCase();
    const className = c.name?.toLowerCase() || "";
    const section = c.section?.toLowerCase() || "";
    return className.includes(query) || section.includes(query);
  });

  return (
    <div className="relative w-full sm:w-64 min-w-0" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 outline-none focus:border-blue-500/70 transition-all cursor-pointer truncate"
      >
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <span className="font-semibold truncate">
            {selectedClass ? (
              `${selectedClass.name} ${selectedClass.section ? `(${selectedClass.section})` : ""}`
            ) : (
              "Select Class / Grade"
            )}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Quick Filter Input */}
          <div className="p-2 border-b border-slate-800">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search grade or section..."
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/60"
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
            {filteredClasses.map((c) => {
              const isSelected = c.id.toString() === selectedClassId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelect(c.id.toString());
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-blue-500/10 text-blue-400"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="truncate">
                      {c.name} {c.section && `(${c.section})`}
                    </span>
                  </div>
                  {isSelected && <span className="text-xs shrink-0 font-bold">✓</span>}
                </button>
              );
            })}

            {filteredClasses.length === 0 && (
              <p className="text-[11px] text-slate-500 text-center py-3">No classes found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main Component ---

export default function TimetablePage({ loaderData }: TTRoute.ComponentProps) {
  const { classes, subjects, teachers } = loaderData;
  const actionData = useActionData() as any;
  const navigation = useNavigation();
  
  const [selectedClass, setSelectedClass] = useState<string>(classes[0]?.id?.toString() || "");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [timetable, setTimetable] = useState<Record<number, TimetableSlot[]>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCell, setActiveCell] = useState<{ day: number, period: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="p-3 sm:p-6 max-w-7xl mx-auto text-slate-200 min-h-screen">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-xl sm:text-2xl">📅</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Class Timetable</h1>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">Real-time schedule management for all grades</p>
        </div>

        {/* Action Controls Header Toolbar */}
        <div className="bg-slate-900/60 border border-slate-800 p-2 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Custom Grade Dropdown */}
          <ClassSelectorDropdown
            classes={classes}
            selectedClassId={selectedClass}
            onSelect={(id) => setSelectedClass(id)}
          />

          <Form method="post" className="w-full sm:w-auto">
            <input type="hidden" name="intent" value="generate" />
            <input type="hidden" name="class_id" value={selectedClass} />
            <button 
              type="submit"
              disabled={isProcessing || !selectedClass}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm px-4 py-2.5 rounded-xl font-semibold transition shadow-md shadow-blue-500/10 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <span>⚡</span>
              <span>{isProcessing ? "Generating..." : "Auto-Generate"}</span>
            </button>
          </Form>
        </div>
      </div>

      {/* Notifications */}
      {actionData?.message && (
        <div className={`mb-6 px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-2.5 shadow-lg ${actionData.success ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-rose-500/10 border-rose-500/25 text-rose-400'}`}>
          <span>{actionData.success ? '✅' : '⚠️'}</span>
          <span>{actionData.message}</span>
        </div>
      )}

      {/* ── MOBILE VIEW: Day Selector Tabs & Card List ────────────── */}
      <div className="block md:hidden">
        <div className="flex overflow-x-auto pb-2 mb-4 gap-1.5 scrollbar-none">
          {DAYS.map(day => (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`flex-1 min-w-[70px] py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap text-center transition ${
                selectedDay === day.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {day.short}
            </button>
          ))}
        </div>

        <div className={`space-y-2.5 transition-opacity duration-300 ${isLoading ? 'opacity-40' : 'opacity-100'}`}>
          {PERIODS.map(p => {
            const slot = getSlot(selectedDay, p);
            return (
              <div key={p} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-slate-400 font-mono text-xs font-bold bg-slate-800 border border-slate-700/50 px-2.5 py-1.5 rounded-xl shrink-0">
                    P{p}
                  </span>
                  {slot ? (
                    <div className="min-w-0">
                      <span className="font-semibold text-sm block text-white truncate">{slot.subject?.name}</span>
                      <span className="text-xs text-slate-400 block truncate">{slot.teacher?.user?.name}</span>
                      {slot.room && (
                        <span className="inline-block mt-1 text-[10px] bg-slate-800 border border-slate-700/40 px-2 py-0.5 rounded-md text-slate-300">
                          📍 {slot.room}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600 italic">Unassigned slot</span>
                  )}
                </div>

                {!slot && (
                  <button 
                    onClick={() => { setActiveCell({ day: selectedDay, period: p }); setIsModalOpen(true); }}
                    className="shrink-0 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs px-3 py-1.5 rounded-xl font-medium transition"
                  >
                    + Slot
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DESKTOP VIEW: Full Grid Schedule ─────────────────────── */}
      <div className={`hidden md:block bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-opacity duration-300 ${isLoading ? 'opacity-40' : 'opacity-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800">
                <th className="p-3.5 text-center text-slate-500 font-bold uppercase tracking-widest text-[11px] w-20 border-r border-slate-800/80">Period</th>
                {DAYS.map(day => (
                  <th key={day.id} className="p-3.5 text-center text-slate-300 font-semibold text-xs border-r border-slate-800/60 last:border-r-0">
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {PERIODS.map(p => (
                <tr key={p} className="hover:bg-slate-800/20 transition-colors">
                  <td className="p-3 text-slate-400 font-mono text-xs font-semibold bg-slate-900/80 text-center border-r border-slate-800/80">
                    P{p}
                  </td>
                  {DAYS.map(d => {
                    const slot = getSlot(d.id, p);
                    return (
                      <td key={d.id} className="p-2 h-28 border-r border-slate-800/40 last:border-r-0">
                        {slot ? (
                          <div className={`group relative border rounded-xl p-3 h-full flex flex-col justify-between transition-all duration-200 ${getSubjectStyle(slot.subject_id)}`}>
                            <div>
                              <span className="font-bold text-xs sm:text-sm block leading-tight truncate">{slot.subject?.name}</span>
                              <span className="text-[11px] opacity-75 font-medium block truncate mt-0.5">
                                {slot.teacher?.user?.name}
                              </span>
                            </div>
                            {slot.room && (
                              <div className="flex items-center">
                                <span className="text-[9px] bg-slate-950/40 border border-white/10 px-2 py-0.5 rounded-md font-mono text-slate-300">
                                  📍 {slot.room}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <button 
                            onClick={() => { setActiveCell({ day: d.id, period: p }); setIsModalOpen(true); }}
                            className="w-full h-full border border-dashed border-slate-800 rounded-xl hover:border-blue-500/40 hover:bg-blue-500/5 transition-all flex items-center justify-center text-slate-700 hover:text-blue-400 group"
                          >
                            <span className="text-xl group-hover:scale-125 transition-transform">+</span>
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
      </div>

      {/* ── Manual Slot Modal ────────────────────────────────────── */}
      {isModalOpen && activeCell && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Assign Schedule Slot</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  {DAYS.find(d => d.id === activeCell.day)?.label} — Period {activeCell.period}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
            </div>
            
            <Form method="post" onSubmit={() => setIsModalOpen(false)} className="p-5 space-y-4">
              <input type="hidden" name="intent" value="manual_save" />
              <input type="hidden" name="class_id" value={selectedClass} />
              <input type="hidden" name="day_of_week" value={activeCell.day} />
              <input type="hidden" name="period_number" value={activeCell.period} />

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</label>
                <select name="subject_id" required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:border-blue-500 outline-none">
                  {subjects.map((s: Subject) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Teacher</label>
                <select name="teacher_id" required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:border-blue-500 outline-none">
                  {teachers.map((t: Teacher) => <option key={t.id} value={t.id}>{t.user?.name || t.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start Time</label>
                  <input type="time" name="start_time" defaultValue="08:00" required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">End Time</label>
                  <input type="time" name="end_time" defaultValue="09:00" required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:border-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Room / Location</label>
                <input type="text" name="room" placeholder="e.g. Science Lab 1" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:border-blue-500 outline-none" />
              </div>

              <div className="pt-4 flex gap-2.5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition font-semibold text-xs sm:text-sm">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20">Save Slot</button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}