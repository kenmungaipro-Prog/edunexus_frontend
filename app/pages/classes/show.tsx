// ============================================================
// app/pages/classes/show.tsx
// ============================================================
import { Link } from "react-router";
import type { Route } from "./+types/show";
import api, { type ClassRoom as ApiClassRoom } from "~/lib/api";

// ── Types ─────────────────────────────────────────────────────
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

// ── Loader ────────────────────────────────────────────────────
export async function clientLoader({ params }: Route.LoaderArgs) {
  const id = Number(params.id);
  const res = await api.classes.get(id);
  
  // Cast to ensure we have the expanded type fields available if returned by API
  const classData = res.data as unknown as ClassRoom;
  
  return { classData };
}

// ── Helpers ───────────────────────────────────────────────────
function occupancyColor(pct: number) {
  if (pct >= 95) return { bar: "bg-red-400",   text: "text-red-400"   };
  if (pct >= 75) return { bar: "bg-amber-400", text: "text-amber-400" };
  return              { bar: "bg-emerald-400", text: "text-emerald-400" };
}

// ── Component ─────────────────────────────────────────────────
export default function ClassShowPage({ loaderData }: Route.ComponentProps) {
  const { classData } = loaderData as LoaderData;
  
  const studentsCount = classData.students_count ?? 0;
  const capacity = classData.capacity ?? 0;
  const pct = capacity > 0 ? Math.round((studentsCount / capacity) * 100) : 0;
  const colors = occupancyColor(pct);

  return (
    <div className="max-w-5xl mx-auto">
      
      {/* ── Breadcrumb & Actions ───────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link 
            to="/classes" 
            className="w-8 h-8 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition"
          >
            ←
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-100">{classData.name} Overview</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Grade {classData.grade} • Section {classData.section}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link
            to={`/timetable?class_id=${classData.id}`}
            className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-700 transition"
          >
            📅 Timetable
          </Link>
          <Link
            to={`/classes/${classData.id}/edit`}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition flex items-center gap-2"
          >
            ✏️ Edit Class
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        
        {/* ── Main Column (Left) ───────────────────────── */}
        <div className="col-span-2 space-y-6">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center text-xl">
                👥
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">{studentsCount}</div>
                <div className="text-sm text-slate-400">Total Students</div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center text-xl">
                🚪
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">{classData.room || "N/A"}</div>
                <div className="text-sm text-slate-400">Room Number</div>
              </div>
            </div>
          </div>

          {/* Occupancy Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-base font-bold text-slate-100 mb-4">Capacity & Occupancy</h2>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-400">
                <span className="text-slate-200 font-semibold">{studentsCount}</span> of {capacity} seats filled
              </div>
              <div className={`text-sm font-bold ${colors.text}`}>{pct}% Full</div>
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
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
             <h2 className="text-base font-bold text-slate-100 mb-4">Class Operations</h2>
             <div className="grid grid-cols-2 gap-3">
               <Link 
                  to={`/students?class_id=${classData.id}`} 
                  className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-blue-500/50 hover:bg-slate-700/50 transition flex items-center gap-3"
                >
                 <span className="text-xl">👩‍🎓</span>
                 <div>
                   <div className="font-semibold text-slate-200 text-sm">View Roster</div>
                   <div className="text-xs text-slate-500">Manage student list</div>
                 </div>
               </Link>
               <Link 
                  to={`/attendance?class_id=${classData.id}`} 
                  className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-blue-500/50 hover:bg-slate-700/50 transition flex items-center gap-3"
                >
                 <span className="text-xl">✅</span>
                 <div>
                   <div className="font-semibold text-slate-200 text-sm">Attendance</div>
                   <div className="text-xs text-slate-500">View or mark attendance</div>
                 </div>
               </Link>
               <Link 
                  to={`/exams?class_id=${classData.id}`} 
                  className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-blue-500/50 hover:bg-slate-700/50 transition flex items-center gap-3"
                >
                 <span className="text-xl">📝</span>
                 <div>
                   <div className="font-semibold text-slate-200 text-sm">Examinations</div>
                   <div className="text-xs text-slate-500">Exams & grading</div>
                 </div>
               </Link>
             </div>
          </div>

        </div>

        {/* ── Sidebar (Right) ──────────────────────────── */}
        <div className="space-y-6">
          
          {/* Class Teacher Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              🧑‍🏫 Class Teacher
            </h2>
            
            {classData.class_teacher ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg mb-3">
                  {classData.class_teacher.user?.name.charAt(0).toUpperCase() || "T"}
                </div>
                <h3 className="font-bold text-slate-100">
                  {classData.class_teacher.user?.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {classData.class_teacher.department || "General Department"}
                </p>
                <div className="w-full h-px bg-slate-700 my-4" />
                <a 
                  href={`mailto:${classData.class_teacher.user?.email}`}
                  className="text-sm text-blue-400 hover:text-blue-300 transition"
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
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-base font-bold text-slate-100 mb-4">Details</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between">
                <span className="text-slate-400">Class ID</span>
                <span className="text-slate-200 font-mono">#{classData.id}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Grade Level</span>
                <span className="text-slate-200">{classData.grade}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Section</span>
                <span className="text-slate-200">{classData.section}</span>
              </li>
              <li className="flex justify-between">
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