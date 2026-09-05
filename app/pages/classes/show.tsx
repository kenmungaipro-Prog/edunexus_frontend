// ============================================================
// app/pages/classes/show.tsx
// ============================================================
import { Link } from "react-router";
import type { Route } from "./+types/show";
import { api, type ClassRoom as ApiClassRoom } from "~/lib/api";

type ClassRoom = ApiClassRoom & {
  students_count: number;
};

interface LoaderData {
  classData: ClassRoom;
}

export async function clientLoader({ params }: Route.LoaderArgs) {
  const id = Number(params.id);
  const res = await api.classes.get(id);
  const classData = res.data as unknown as ClassRoom;
  return { classData };
}

function occupancyColor(pct: number) {
  if (pct >= 95) return { bar: "bg-red-500",   text: "text-red-400",   badge: "bg-red-500/10 text-red-400 border-red-500/20" };
  if (pct >= 75) return { bar: "bg-amber-500", text: "text-amber-400", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
  return              { bar: "bg-emerald-500", text: "text-emerald-400", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
}

export default function ClassShowPage({ loaderData }: Route.ComponentProps) {
  const { classData } = loaderData as LoaderData;
  
  const studentsCount = classData.students_count ?? 0;
  const capacity = classData.capacity ?? 0;
  const pct = capacity > 0 ? Math.round((studentsCount / capacity) * 100) : 0;
  const colors = occupancyColor(pct);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      
      {/* ── Breadcrumb & Actions ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4 min-w-0">
          <Link 
            to="/classes" 
            className="w-10 h-10 flex items-center justify-center bg-slate-800/80 border border-slate-700/80 rounded-2xl text-slate-300 hover:bg-slate-700 hover:text-white transition-all flex-shrink-0 shadow-sm"
          >
            ←
          </Link>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-semibold mb-1">
              Grade {classData.grade} • Section {classData.section}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight truncate">{classData.name}</h1>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={`/timetable?class_id=${classData.id}`}
            className="flex-1 sm:flex-none text-center px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-700 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
          >
            📅 Timetable
          </Link>
          <Link
            to={`/classes/${classData.id}/edit`}
            className="flex-1 sm:flex-none text-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
          >
            ✏️ Edit Class
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Main Column (Left) ───────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
              <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
                👥
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-extrabold text-slate-100 tracking-tight truncate">{studentsCount}</div>
                <div className="text-xs font-medium text-slate-400 truncate mt-0.5">Enrolled Students</div>
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
                🚪
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-extrabold text-slate-100 tracking-tight truncate">{classData.room || "N/A"}</div>
                <div className="text-xs font-medium text-slate-400 truncate mt-0.5">Room Location</div>
              </div>
            </div>
          </div>

          {/* Occupancy Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-100 tracking-tight">Capacity & Occupancy</h2>
              <span className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${colors.badge}`}>{pct}% Full</span>
            </div>
            
            <div className="flex items-center justify-between mb-2 text-xs sm:text-sm">
              <span className="text-slate-400 font-medium">
                <span className="text-slate-200 font-bold">{studentsCount}</span> of {capacity} seats utilized
              </span>
            </div>
            
            <div className="h-3 bg-slate-950/80 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            
            {pct >= 100 && (
              <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300 font-medium flex items-center gap-2">
                <span>⚠️</span> This class section has reached or exceeded its maximum seating capacity.
              </div>
            )}
          </div>
          {/* Subjects Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-100 tracking-tight">Subjects</h2>
              <span className="text-xs text-slate-400">{(classData as any).subjects?.length ?? 0} total</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {((classData as any).subjects ?? []).length === 0 ? (
                <div className="text-xs text-slate-500">No subjects assigned to this class.</div>
              ) : (
                ((classData as any).subjects ?? []).map((s: any) => (
                  <span key={s.id} className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700">
                    {s.name}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Action Links List */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
             <h2 className="text-base font-bold text-slate-100 tracking-tight mb-4">Class Management Operations</h2>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
               <Link 
                  to={`/students?class_id=${classData.id}`} 
                  className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-blue-500/40 hover:bg-slate-800/60 transition-all flex flex-col gap-2 shadow-inner group"
                >
                 <span className="text-2xl">👩‍🎓</span>
                 <div>
                   <div className="font-semibold text-slate-200 text-sm group-hover:text-blue-400 transition-colors">View Roster</div>
                   <div className="text-xs text-slate-500 mt-0.5">Manage students</div>
                 </div>
               </Link>
               <Link 
                  to={`/attendance?class_id=${classData.id}`} 
                  className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-blue-500/40 hover:bg-slate-800/60 transition-all flex flex-col gap-2 shadow-inner group"
                >
                 <span className="text-2xl">✅</span>
                 <div>
                   <div className="font-semibold text-slate-200 text-sm group-hover:text-blue-400 transition-colors">Attendance</div>
                   <div className="text-xs text-slate-500 mt-0.5">Track daily logs</div>
                 </div>
               </Link>
               <Link 
                  to={`/exams?class_id=${classData.id}`} 
                  className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-blue-500/40 hover:bg-slate-800/60 transition-all flex flex-col gap-2 shadow-inner group"
                >
                 <span className="text-2xl">📝</span>
                 <div>
                   <div className="font-semibold text-slate-200 text-sm group-hover:text-blue-400 transition-colors">Examinations</div>
                   <div className="text-xs text-slate-500 mt-0.5">Grades & tests</div>
                 </div>
               </Link>
             </div>
          </div>

        </div>

        {/* ── Sidebar (Right) ──────────────────────────── */}
        <div className="space-y-6">
          
          {/* Class Teacher Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-slate-100 tracking-tight mb-5 flex items-center gap-2">
              <span>🧑‍🏫</span> Class Teacher
            </h2>
            
            {classData.class_teacher ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg mb-3 border border-indigo-400/30">
                  {classData.class_teacher.user?.name.charAt(0).toUpperCase() || "T"}
                </div>
                <h3 className="font-bold text-slate-100 text-base truncate max-w-full">
                  {classData.class_teacher.user?.name}
                </h3>
                <p className="text-xs font-medium text-slate-400 mt-1 truncate max-w-full">
                  {classData.class_teacher.department || "General Faculty"}
                </p>
                <div className="w-full h-px bg-slate-800 my-4" />
                <a 
                  href={`mailto:${classData.class_teacher.user?.email}`}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300 transition truncate max-w-full bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-xl w-full"
                >
                  {classData.class_teacher.user?.email}
                </a>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3 opacity-40">🤷‍♂️</div>
                <p className="text-sm text-slate-300 font-medium">No teacher assigned</p>
                <p className="text-xs text-slate-500 mt-1">Assign a faculty lead to this room.</p>
                <Link 
                  to={`/classes/${classData.id}/edit`} 
                  className="mt-4 inline-block text-xs font-semibold px-4 py-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 transition-all"
                >
                  Assign Teacher
                </Link>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-slate-100 tracking-tight mb-4">Metadata & Codes</h2>
            <ul className="space-y-3.5 text-sm">
              <li className="flex justify-between items-center gap-2 pb-3 border-b border-slate-800/80">
                <span className="text-slate-400 text-xs font-medium">Internal ID</span>
                <span className="text-slate-200 font-mono text-xs bg-slate-950 px-2 py-1 rounded border border-slate-800">#{classData.id}</span>
              </li>
              <li className="flex justify-between items-center gap-2 pb-3 border-b border-slate-800/80">
                <span className="text-slate-400 text-xs font-medium">Grade Level</span>
                <span className="text-slate-200 font-semibold text-xs">Grade {classData.grade}</span>
              </li>
              <li className="flex justify-between items-center gap-2 pb-3 border-b border-slate-800/80">
                <span className="text-slate-400 text-xs font-medium">Section Group</span>
                <span className="text-slate-200 font-semibold text-xs">{classData.section}</span>
              </li>
              <li className="flex justify-between items-center gap-2">
                <span className="text-slate-400 text-xs font-medium">Session Identifier</span>
                <span className="text-slate-200 font-mono text-xs bg-slate-950 px-2 py-1 rounded border border-slate-800">{classData.session_id ?? "Default"}</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
      
    </div>
  );
}