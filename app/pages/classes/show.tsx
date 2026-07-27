// ============================================================
// app/pages/classes/show.tsx
// ============================================================
import { Link } from "react-router";
import type { Route } from "./+types/show";
import { api, type ClassRoom as ApiClassRoom } from "~/lib/api";

interface ClassRoom extends ApiClassRoom {
  students_count: number;
  class_teacher: { 
    department?: string | null;
    user?: { 
      name: string; 
      email: string;
    } 
  } | null;
}

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
  if (pct >= 95) return { bar: "bg-red-400",   text: "text-red-400"   };
  if (pct >= 75) return { bar: "bg-amber-400", text: "text-amber-400" };
  return              { bar: "bg-emerald-400", text: "text-emerald-400" };
}

export default function ClassShowPage({ loaderData }: Route.ComponentProps) {
  const { classData } = loaderData as LoaderData;
  
  const studentsCount = classData.students_count ?? 0;
  const capacity = classData.capacity ?? 0;
  const pct = capacity > 0 ? Math.round((studentsCount / capacity) * 100) : 0;
  const colors = occupancyColor(pct);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      
      {/* ── Breadcrumb & Actions ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link 
            to="/classes" 
            className="w-9 h-9 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition flex-shrink-0"
          >
            ←
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-100 truncate">{classData.name} Overview</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5 truncate">
              Grade {classData.grade} • Section {classData.section}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/timetable?class_id=${classData.id}`}
            className="flex-1 sm:flex-none text-center px-3.5 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs sm:text-sm font-semibold hover:bg-slate-700 transition"
          >
            📅 Timetable
          </Link>
          <Link
            to={`/classes/${classData.id}/edit`}
            className="flex-1 sm:flex-none text-center px-3.5 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-xs sm:text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
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
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                👥
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-bold text-slate-100 truncate">{studentsCount}</div>
                <div className="text-xs sm:text-sm text-slate-400 truncate">Total Students</div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                🚪
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-bold text-slate-100 truncate">{classData.room || "N/A"}</div>
                <div className="text-xs sm:text-sm text-slate-400 truncate">Room Number</div>
              </div>
            </div>
          </div>

          {/* Occupancy Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-6">
            <h2 className="text-base font-bold text-slate-100 mb-4">Capacity & Occupancy</h2>
            <div className="flex items-center justify-between mb-2 gap-2">
              <div className="text-xs sm:text-sm text-slate-400 truncate">
                <span className="text-slate-200 font-semibold">{studentsCount}</span> of {capacity} seats filled
              </div>
              <div className={`text-xs sm:text-sm font-bold flex-shrink-0 ${colors.text}`}>{pct}% Full</div>
            </div>
            <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            {pct >= 100 && (
              <p className="text-xs text-red-400 mt-3 flex items-center gap-1.5">
                ⚠️ This class has reached or exceeded its maximum capacity.
              </p>
            )}
          </div>
          
          {/* Action Links List */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-6">
             <h2 className="text-base font-bold text-slate-100 mb-4">Class Operations</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               <Link 
                  to={`/students?class_id=${classData.id}`} 
                  className="p-3 sm:p-4 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-blue-500/50 hover:bg-slate-700/50 transition flex items-center gap-3"
                >
                 <span className="text-xl flex-shrink-0">👩‍🎓</span>
                 <div className="min-w-0">
                   <div className="font-semibold text-slate-200 text-sm truncate">View Roster</div>
                   <div className="text-xs text-slate-500 truncate">Manage student list</div>
                 </div>
               </Link>
               <Link 
                  to={`/attendance?class_id=${classData.id}`} 
                  className="p-3 sm:p-4 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-blue-500/50 hover:bg-slate-700/50 transition flex items-center gap-3"
                >
                 <span className="text-xl flex-shrink-0">✅</span>
                 <div className="min-w-0">
                   <div className="font-semibold text-slate-200 text-sm truncate">Attendance</div>
                   <div className="text-xs text-slate-500 truncate">View or mark attendance</div>
                 </div>
               </Link>
               <Link 
                  to={`/exams?class_id=${classData.id}`} 
                  className="p-3 sm:p-4 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-blue-500/50 hover:bg-slate-700/50 transition flex items-center gap-3"
                >
                 <span className="text-xl flex-shrink-0">📝</span>
                 <div className="min-w-0">
                   <div className="font-semibold text-slate-200 text-sm truncate">Examinations</div>
                   <div className="text-xs text-slate-500 truncate">Exams & grading</div>
                 </div>
               </Link>
             </div>
          </div>

        </div>

        {/* ── Sidebar (Right) ──────────────────────────── */}
        <div className="space-y-6">
          
          {/* Class Teacher Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-6">
            <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              🧑‍🏫 Class Teacher
            </h2>
            
            {classData.class_teacher ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg mb-3">
                  {classData.class_teacher.user?.name.charAt(0).toUpperCase() || "T"}
                </div>
                <h3 className="font-bold text-slate-100 truncate max-w-full">
                  {classData.class_teacher.user?.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 truncate max-w-full">
                  {classData.class_teacher.department || "General Department"}
                </p>
                <div className="w-full h-px bg-slate-700 my-4" />
                <a 
                  href={`mailto:${classData.class_teacher.user?.email}`}
                  className="text-sm text-blue-400 hover:text-blue-300 transition truncate max-w-full"
                >
                  {classData.class_teacher.user?.email}
                </a>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-4xl mb-3 opacity-50">🤷‍♂️</div>
                <p className="text-sm text-slate-400">No class teacher assigned.</p>
                <Link 
                  to={`/classes/${classData.id}/edit`} 
                  className="text-xs text-blue-400 hover:underline mt-2 inline-block"
                >
                  Assign a teacher
                </Link>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-6">
            <h2 className="text-base font-bold text-slate-100 mb-4">Details</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between gap-2">
                <span className="text-slate-400">Class ID</span>
                <span className="text-slate-200 font-mono">#{classData.id}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="text-slate-400">Grade Level</span>
                <span className="text-slate-200">{classData.grade}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="text-slate-400">Section</span>
                <span className="text-slate-200">{classData.section}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="text-slate-400">Session ID</span>
                <span className="text-slate-200">{classData.session_id}</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
      
    </div>
  );
}