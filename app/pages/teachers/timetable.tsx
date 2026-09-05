// ============================================================
// app/pages/teachers/timetable.tsx — Mobile Responsive
// ============================================================
import { Link } from "react-router";
import type { Route } from "./+types/timetable";
import { api } from "~/lib/api";
import type { TimetableSlot } from "~/lib/api";



type TimetableData = Record<string, TimetableSlot[]>;

export async function clientLoader({ params }: Route.LoaderArgs) {
  try {
    const [teacherRes, timetableRes] = await Promise.all([
      api.teachers.get(Number(params.id)),
      api.teachers.timetable(Number(params.id)),
    ]);

    return {
      teacher: teacherRes.data,
      timetable: timetableRes.data as TimetableData,
    };
  } catch (error: any) {
    console.error("Error loading timetable data:", error);
    throw new Error("Could not retrieve teacher schedule details.");
  }
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function TeacherTimetable({ loaderData }: Route.ComponentProps) {
  const { teacher, timetable } = loaderData;
  const teacherName = teacher?.user?.name || "Teacher";

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            <Link to="/teachers" className="hover:text-blue-400 transition-colors">Teachers</Link>
            <span>/</span>
            <Link to={`/teachers/${teacher?.id}`} className="hover:text-blue-400 transition-colors truncate max-w-[120px] sm:max-w-none">{teacherName}</Link>
            <span>/</span>
            <span className="text-slate-300">Timetable</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Weekly Schedule — {teacherName}
          </h1>
          <p className="text-sm text-slate-400 mt-1">Department: {teacher?.department || "Unassigned"}</p>
        </div>

        <div>
          <Link
            to={`/teachers/${teacher?.id}`}
            className="inline-flex items-center justify-center w-full md:w-auto gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-sm font-medium text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Profile
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {DAYS_OF_WEEK.map((day) => {
          const slots = timetable[day] || [];
          
          return (
            <div key={day} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-800/40 border-b border-slate-800 px-4 sm:px-5 py-3.5">
                <h3 className="text-sm font-semibold text-slate-200 tracking-wide">{day}</h3>
              </div>
              
              <div className="p-4 sm:p-5">
                {slots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {slots.map((slot) => (
                      <div 
                        key={slot.id} 
                        className="p-4 bg-slate-800/70 border border-slate-700/60 rounded-xl hover:border-blue-500/30 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <span className="inline-block text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md mb-2">
                            Period {slot.period_number}
                          </span>
                          <h4 className="font-semibold text-slate-200 text-sm">
                            {slot.subject?.name || "No Subject assigned"}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <span>🏫 Classroom:</span>
                            <span className="text-slate-300 font-medium">{slot.class_room?.name || "N/A"}</span>
                          </p>
                        </div>
                        
                        <div className="text-[11px] text-slate-500 font-mono mt-3 pt-2 border-t border-slate-700/40">
                          ⏱️ {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-2 italic">
                    <span>📅</span> No periods schedule allocations assigned for this day.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
