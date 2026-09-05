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

const getSubjectStyle = (subjectId?: number) => {
  if (!subjectId) return "bg-slate-800/40 text-slate-300 border-slate-700/50";
  return SUBJECT_COLORS[subjectId % SUBJECT_COLORS.length];
};

const formatTimeLabel = (slot: { start_time?: string; end_time?: string }) => {
  if (!slot?.start_time || !slot?.end_time) {
    return "Unscheduled";
  }
  return `${slot.start_time.slice(0, 5)} – ${slot.end_time.slice(0, 5)}`;
};

const getRowTimeLabel = (period: number, timetable: Record<number, TimetableSlot[]>) => {
  for (const day of DAYS) {
    const slot = timetable[day.id]?.find((s) => s.period_number === period);
    if (slot?.start_time && slot?.end_time) {
      return formatTimeLabel(slot);
    }
  }
  return `Period ${period}`;
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
      apiService.subjects.list(),
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
      return { success: true, message: "Schedule auto-generated with timing rules!" };
    }

    if (intent === "manual_save") {
      const slotId = formData.get("slot_id");
      const slotType = String(formData.get("slot_type") || "class");
      const data: any = {
        class_id: Number(formData.get("class_id")),
        slot_type: slotType,
        day_of_week: Number(formData.get("day_of_week")),
        period_number: Number(formData.get("period_number")),
        start_time: String(formData.get("start_time")),
        end_time: String(formData.get("end_time")),
        room: String(formData.get("room") || ""),
      };

      if (slotType === "class") {
        data.subject_id = Number(formData.get("subject_id"));
        data.teacher_id = Number(formData.get("teacher_id"));
      } else {
        data.title = String(formData.get("title") || slotType.toUpperCase());
      }

      // If slotId exists, update it; otherwise store a new one
      if (slotId) {
        await apiService.timetable.update(Number(slotId), data);
        return { success: true, message: "Timetable slot updated successfully." };
      } else {
        await apiService.timetable.store(data);
        return { success: true, message: "Timetable slot created successfully." };
      }
    }

    if (intent === "delete") {
      const slotId = Number(formData.get("slot_id"));
      await apiService.timetable.delete(slotId); // Ensure your apiService has a delete method pointing to DELETE /timetable-slots/{id}
      return { success: true, message: "Timetable slot deleted." };
    }

    if (intent === "update_settings") {
      // ... existing settings handler
    }
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Operation failed." };
  }
  return {};
}

// --- Class Selector Dropdown Component ---

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
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 outline-none focus:border-blue-500/70 transition-all cursor-pointer truncate"
      >
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <span className="font-semibold truncate">
            {selectedClass ? `${selectedClass.name} ${selectedClass.section ? `(${selectedClass.section})` : ""}` : "Select Class / Grade"}
          </span>
        </div>
        <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
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
                    isSelected ? "bg-blue-500/10 text-blue-400" : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <span className="truncate">{c.name} {c.section && `(${c.section})`}</span>
                  {isSelected && <span className="text-xs shrink-0 font-bold">✓</span>}
                </button>
              );
            })}
            {filteredClasses.length === 0 && <p className="text-[11px] text-slate-500 text-center py-3">No classes found</p>}
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
  const [viewAll, setViewAll] = useState<boolean>(false);
  const [filterTeacherId, setFilterTeacherId] = useState<number | "">("");
  const [filterSubjectId, setFilterSubjectId] = useState<number | "">("");
  const [filterDayOfWeek, setFilterDayOfWeek] = useState<number | "">("");
  const [timetable, setTimetable] = useState<Record<number, TimetableSlot[]>>({});
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [settings, setSettings] = useState<any>({
    total_periods: 8,
    period_duration_minutes: 60,
    day_start_time: "08:00",
    break_after_period: 3,
    break_duration_minutes: 15,
    lunch_after_period: 5,
    lunch_duration_minutes: 45,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeCell, setActiveCell] = useState<{ day: number, period: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Form states for manual modal slot types
  const [slotType, setSlotType] = useState<string>("class");

  const loadTimetable = async (classId?: string) => {
    setIsLoading(true);
    try {
      if (viewAll) {
        const params: Record<string, unknown> = {};
        if (filterTeacherId) params.teacher_id = Number(filterTeacherId);
        if (filterSubjectId) params.subject_id = Number(filterSubjectId);
        if (filterDayOfWeek) params.day_of_week = Number(filterDayOfWeek);
        const res = await apiService.timetable.list(params);
        setTimetable(res.data ?? {});
        if (res.settings) setSettings((prev: any) => ({ ...prev, ...res.settings }));
      } else {
        if (!classId) return;
        const res = await apiService.timetable.get(Number(classId));
        setTimetable(res.data ?? {});
        if (res.settings) setSettings((prev: any) => ({ ...prev, ...res.settings }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (viewAll) {
      void loadTimetable();
      return;
    }
    if (selectedClass) {
      void loadTimetable(selectedClass);
    }
  }, [selectedClass, viewAll, filterTeacherId, filterSubjectId, filterDayOfWeek]);

  const handleSlotSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const slotTypeValue = String(formData.get("slot_type") || "class");
    const classId = String(formData.get("class_id") || selectedClass);
    const payload: any = {
      class_id: Number(classId),
      slot_type: slotTypeValue,
      day_of_week: Number(formData.get("day_of_week")),
      period_number: Number(formData.get("period_number")),
      start_time: String(formData.get("start_time") || "08:00"),
      end_time: String(formData.get("end_time") || "09:00"),
      room: String(formData.get("room") || ""),
    };

    if (slotTypeValue === "class") {
      const subjectId = Number(formData.get("subject_id"));
      const teacherId = Number(formData.get("teacher_id"));
      if (subjectId) payload.subject_id = subjectId;
      if (teacherId) payload.teacher_id = teacherId;
    } else {
      payload.title = String(formData.get("title") || slotTypeValue.toUpperCase());
    }

    try {
      if (editingSlot?.id) {
        await apiService.timetable.update(editingSlot.id, payload);
        setFeedback({ success: true, message: "Timetable slot updated successfully." });
      } else {
        await apiService.timetable.store(payload);
        setFeedback({ success: true, message: "Timetable slot created successfully." });
      }

      setIsModalOpen(false);
      setEditingSlot(null);
      setActiveCell(null);
      setSlotType("class");
      await loadTimetable(classId);
    } catch (err: any) {
      setFeedback({ success: false, message: err?.message || "Operation failed." });
    }
  };

  const handleDeleteSlot = async () => {
    if (!editingSlot?.id) return;

    if (!window.confirm("Are you sure you want to delete this slot?")) {
      return;
    }

    try {
      await apiService.timetable.delete(editingSlot.id);
      setFeedback({ success: true, message: "Timetable slot deleted." });
      setIsModalOpen(false);
      setEditingSlot(null);
      setActiveCell(null);
      setSlotType("class");
      await loadTimetable(selectedClass);
    } catch (err: any) {
      setFeedback({ success: false, message: err?.message || "Delete failed." });
    }
  };

  const totalPeriodsCount = settings.total_periods || 8;
  const PERIODS = Array.from({ length: totalPeriodsCount }, (_, i) => i + 1);

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
          <p className="text-slate-400 text-xs sm:text-sm">Manage class schedules, breaks, and academic slots</p>
        </div>

        {/* Action Controls Header Toolbar */}
        <div className="bg-slate-900/60 border border-slate-800 p-2 rounded-2xl flex flex-wrap items-center gap-2">
          <ClassSelectorDropdown
            classes={classes}
            selectedClassId={selectedClass}
            onSelect={(id) => setSelectedClass(id)}
          />

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={viewAll}
                onChange={(e) => { setViewAll(e.target.checked); if (e.target.checked) setSelectedClass(""); }}
                className="w-4 h-4 bg-slate-800 rounded"
              />
              <span>All Classes</span>
            </label>

            <select value={filterTeacherId} onChange={(e) => setFilterTeacherId(e.target.value ? Number(e.target.value) : "")} className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-slate-200">
              <option value="">All Teachers</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.user?.name ?? `Teacher ${t.id}`}</option>)}
            </select>

            <select value={filterSubjectId} onChange={(e) => setFilterSubjectId(e.target.value ? Number(e.target.value) : "") } className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-slate-200">
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <select value={filterDayOfWeek} onChange={(e) => setFilterDayOfWeek(e.target.value ? Number(e.target.value) : "") } className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-slate-200">
              <option value="">Any Day</option>
              {DAYS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            disabled={!selectedClass}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-semibold transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>

          <Form method="post" className="w-full sm:w-auto">
            <input type="hidden" name="intent" value="generate" />
            <input type="hidden" name="class_id" value={selectedClass} />
            <button 
              type="submit"
              disabled={isProcessing || !selectedClass}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm px-4 py-2.5 rounded-xl font-semibold transition shadow-md shadow-blue-500/10 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>⚡</span>
              <span>{isProcessing ? "Generating..." : "Auto-Generate"}</span>
            </button>
          </Form>
        </div>
      </div>

      {/* Notifications */}
      {(feedback || actionData) && (
        <div className={`mb-6 px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-2.5 shadow-lg ${(feedback ?? actionData)?.success ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-rose-500/10 border-rose-500/25 text-rose-400'}`}>
          <span>{(feedback ?? actionData)?.success ? '✅' : '⚠️'}</span>
          <span>{(feedback ?? actionData)?.message}</span>
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
                selectedDay === day.id ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {day.short}
            </button>
          ))}
        </div>

        <div className={`space-y-2.5 transition-opacity duration-300 ${isLoading ? 'opacity-40' : 'opacity-100'}`}>
          {PERIODS.map(p => {
            const slot = getSlot(selectedDay, p);
            const isBreakOrLunch = slot && slot.slot_type && slot.slot_type !== 'class';
            return (
              <div key={p} className={`border rounded-2xl p-3.5 flex items-center justify-between gap-3 ${isBreakOrLunch ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-900/80 border-slate-800'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-slate-400 font-mono text-xs font-bold bg-slate-800 border border-slate-700/50 px-2.5 py-1.5 rounded-xl shrink-0">
                    {formatTimeLabel(slot ?? {})}
                  </span>
                  {slot ? (
                    // ── MAKE MOBILE CARD CLICKABLE TO EDIT ──
                    <div 
                      onClick={() => { 
                        setEditingSlot(slot); 
                        setActiveCell({ day: selectedDay, period: p }); 
                        setSlotType(slot.slot_type || 'class');
                        setIsModalOpen(true); 
                      }}
                      className="min-w-0 cursor-pointer group"
                    >
                      <span className="font-semibold text-sm block text-white truncate group-hover:text-blue-400 transition-colors">
                        {isBreakOrLunch ? slot.title || (slot.slot_type ?? "CLASS").toUpperCase() : slot.subject?.name}
                      </span>
                      {!isBreakOrLunch && <span className="text-xs text-slate-400 block truncate">{slot.teacher?.user?.name}</span>}
                      {slot.room && <span className="inline-block mt-1 text-[10px] bg-slate-800 border border-slate-700/40 px-2 py-0.5 rounded-md text-slate-300">📍 {slot.room}</span>}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600 italic">Unassigned slot</span>
                  )}
                </div>

                {!slot && (
                  <button 
                    onClick={() => { setEditingSlot(null); setActiveCell({ day: selectedDay, period: p }); setSlotType('class'); setIsModalOpen(true); }}
                    className="shrink-0 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs px-3 py-1.5 rounded-xl font-medium transition cursor-pointer"
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
                  <th className="p-3.5 text-center text-slate-500 font-bold uppercase tracking-widest text-[11px] w-28 border-r border-slate-800/80">Time</th>
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
                      {getRowTimeLabel(p, timetable)}
                    </td>
                    {DAYS.map(d => {
                      const slot = getSlot(d.id, p);
                      const isBreakOrLunch = slot && slot.slot_type && slot.slot_type !== 'class';
                      return (
                        <td key={d.id} className="p-2 h-28 border-r border-slate-800/40 last:border-r-0">
                          {slot ? (
                            // ── MAKE THIS CARD CLICKABLE ──
                            <div 
                              onClick={() => { 
                                setEditingSlot(slot); 
                                setActiveCell({ day: d.id, period: p }); 
                                setSlotType(slot.slot_type || 'class');
                                setIsModalOpen(true); 
                              }}
                              className={`group relative border rounded-xl p-3 h-full flex flex-col justify-between transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-lg ${isBreakOrLunch ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : getSubjectStyle(slot.subject_id ?? undefined)}`}
                            >
                              <div>
                                <span className="font-bold text-xs sm:text-sm block leading-tight truncate">
                                  {isBreakOrLunch ? slot.title || (slot.slot_type ?? "CLASS").toUpperCase() : slot.subject?.name}
                                </span>
                                {!isBreakOrLunch && (
                                  <span className="text-[11px] opacity-75 font-medium block truncate mt-0.5">
                                    {slot.teacher?.user?.name}
                                  </span>
                                )}
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
                              onClick={() => { setEditingSlot(null); setActiveCell({ day: d.id, period: p }); setSlotType('class'); setIsModalOpen(true); }}
                              className="w-full h-full border border-dashed border-slate-800 rounded-xl hover:border-blue-500/40 hover:bg-blue-500/5 transition-all flex items-center justify-center text-slate-700 hover:text-blue-400 group cursor-pointer"
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

      {/* ── Settings Modal ───────────────────────────────────────── */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Timetable Structure & Settings</h2>
                <p className="text-slate-400 text-xs mt-0.5">Configure periods, start times, recess, and lunch breaks</p>
              </div>
              <button onClick={() => setIsSettingsModalOpen(false)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
            </div>
            
            <Form method="post" onSubmit={() => setIsSettingsModalOpen(false)} className="p-5 space-y-4">
              <input type="hidden" name="intent" value="update_settings" />
              <input type="hidden" name="class_id" value={selectedClass} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Periods / Day</label>
                  <input type="number" name="total_periods" defaultValue={settings.total_periods} min="4" max="12" required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Period Duration (mins)</label>
                  <input type="number" name="period_duration_minutes" defaultValue={settings.period_duration_minutes} min="30" max="120" required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:border-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Day Start Time</label>
                <input type="time" name="day_start_time" defaultValue={settings.day_start_time || "08:00"} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:border-blue-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Break After Period</label>
                  <input type="number" name="break_after_period" defaultValue={settings.break_after_period} placeholder="e.g. 3" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Break Duration (mins)</label>
                  <input type="number" name="break_duration_minutes" defaultValue={settings.break_duration_minutes ?? 15} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:border-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lunch After Period</label>
                  <input type="number" name="lunch_after_period" defaultValue={settings.lunch_after_period} placeholder="e.g. 5" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lunch Duration (mins)</label>
                  <input type="number" name="lunch_duration_minutes" defaultValue={settings.lunch_duration_minutes ?? 45} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:border-blue-500 outline-none" />
                </div>
              </div>

              <div className="pt-4 flex gap-2.5">
                <button type="button" onClick={() => setIsSettingsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition font-semibold text-xs sm:text-sm">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20">Save Settings</button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {/* ── Manual Slot Modal ────────────────────────────────────── */}
      {isModalOpen && activeCell && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">
                  {editingSlot ? "Edit Schedule Slot" : "Assign Schedule Slot"}
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  {DAYS.find(d => d.id === activeCell.day)?.label} — Period {activeCell.period}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300 text-sm cursor-pointer">✕</button>
            </div>
            
            <Form method="post" onSubmit={handleSlotSubmit} className="p-5 space-y-4">
              <input type="hidden" name="intent" value="manual_save" />
              <input type="hidden" name="class_id" value={selectedClass} />
              <input type="hidden" name="day_of_week" value={activeCell.day} />
              <input type="hidden" name="period_number" value={activeCell.period} />
              
              {editingSlot?.id && <input type="hidden" name="slot_id" value={editingSlot.id} />}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Slot Type</label>
                <select 
                  name="slot_type" 
                  value={slotType} 
                  onChange={(e) => setSlotType(e.target.value)} 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:border-blue-500 outline-none"
                >
                  <option value="class">Regular Class</option>
                  <option value="break">Short Break / Recess</option>
                  <option value="lunch">Lunch Break</option>
                  <option value="event">Custom Event / Assembly</option>
                </select>
              </div>

              {slotType === 'class' ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</label>
                    <select 
                      name="subject_id" 
                      defaultValue={editingSlot?.subject_id ?? ""} 
                      required 
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:border-blue-500 outline-none"
                    >
                      <option value="" disabled>Select Subject</option>
                      {subjects.map((s: Subject) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Teacher</label>
                    <select 
                      name="teacher_id" 
                      defaultValue={editingSlot?.teacher_id ?? ""} 
                      required 
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:border-blue-500 outline-none"
                    >
                      <option value="" disabled>Select Teacher</option>
                      {teachers.map((t: Teacher) => <option key={t.id} value={t.id}>{t.user?.name ?? `Teacher ${t.id}`}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Title / Label</label>
                  <input 
                    type="text" 
                    name="title" 
                    defaultValue={editingSlot?.title || (slotType === 'lunch' ? 'Lunch Break' : slotType === 'break' ? 'Recess' : 'Assembly')} 
                    required 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:border-blue-500 outline-none" 
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start Time</label>
                  <input 
                    type="time" 
                    name="start_time" 
                    defaultValue={editingSlot?.start_time ? editingSlot.start_time.slice(0, 5) : "08:00"} 
                    required 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:border-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">End Time</label>
                  <input 
                    type="time" 
                    name="end_time" 
                    defaultValue={editingSlot?.end_time ? editingSlot.end_time.slice(0, 5) : "09:00"} 
                    required 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:border-blue-500 outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Room / Location</label>
                <input 
                  type="text" 
                  name="room" 
                  defaultValue={editingSlot?.room ?? ""} 
                  placeholder="e.g. Science Lab 1 or Main Hall" 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:border-blue-500 outline-none" 
                />
              </div>

              {/* Action buttons including Delete if editing an existing record */}
              <div className="pt-4 flex items-center gap-2.5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition font-semibold text-xs sm:text-sm cursor-pointer">Cancel</button>
                
                {editingSlot?.id && (
                  <button 
                    type="button"
                    onClick={handleDeleteSlot}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition font-semibold text-xs sm:text-sm cursor-pointer"
                  >
                    Delete
                  </button>
                )}

                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 cursor-pointer">
                  {editingSlot ? "Update Slot" : "Save Slot"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}