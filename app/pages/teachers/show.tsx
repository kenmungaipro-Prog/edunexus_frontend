// ============================================================
// app/pages/teachers/show.tsx  — Improved
// ============================================================
import { Link } from "react-router";
import type { Route as ShowRoute } from "./+types/show";
import { api } from "~/lib/api";

export async function clientLoader({ params }: ShowRoute.LoaderArgs) {
  const [teacher, perf] = await Promise.all([
    api.get(`/teachers/${params.id}`),
    api.get(`/teachers/${params.id}/performance`),
  ]);
  return { teacher: teacher.data.data, perf: perf.data };
}

// ── Types ──────────────────────────────────────────────────
type TeacherStatus = "active" | "on_leave" | "inactive";

interface TeacherData {
  id: number;
  employee_id: string;
  department: string;
  qualification: string;
  experience_yrs: number;
  join_date: string;
  salary: number;
  status: TeacherStatus;
  phone: string;
  user: { name: string; email: string };
  subjects: Array<{ name: string; code: string }>;
  class_rooms: Array<{ id: number; name: string; students_count: number }>;
}

interface PerfData {
  avg_student_score: number;
  attendance_rate:   number;
  classes_taught:    number;
  students_count:    number;
}

// ── Helpers ────────────────────────────────────────────────
const AVATAR_PALETTE = [
  ["from-blue-500", "to-indigo-600", "shadow-blue-500/20"],
  ["from-emerald-500","to-teal-600","shadow-emerald-500/20"],
  ["from-violet-500","to-purple-600","shadow-violet-500/20"],
  ["from-amber-500","to-orange-600","shadow-amber-500/20"],
];
const avatarPalette = (id: number) => AVATAR_PALETTE[id % AVATAR_PALETTE.length];

function RadialProgress({ value, color, label }: { value: number; color: string; label: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * (value / 100);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" className="-rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="5" stroke="currentColor" className="text-slate-700/60" />
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="5"
          stroke="currentColor" className={color}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease-out" }}
        />
      </svg>
      <span className={`text-xs font-bold ${color} -mt-[54px] mb-[34px]`}>{value.toFixed(0)}%</span>
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  );
}

// ── Page component ─────────────────────────────────────────
export default function TeacherShowPage({ loaderData }: ShowRoute.ComponentProps) {
  const { teacher, perf } = loaderData as { teacher: TeacherData; perf: PerfData };

  const nameParts = teacher.user?.name.split(" ").filter(Boolean);
  const initials  = nameParts?.map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() ?? "?";
  const [grad1, grad2, shadow] = avatarPalette(teacher.id ?? 0);

  const statusMap: Record<TeacherStatus, { cls: string; dot: string; label: string }> = {
    active:   { cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-400", label: "Active" },
    on_leave: { cls: "bg-amber-500/10 text-amber-400 border-amber-500/25",       dot: "bg-amber-400",   label: "On Leave" },
    inactive: { cls: "bg-slate-700/50 text-slate-500 border-slate-600/40",       dot: "bg-slate-500",   label: "Inactive" },
  };
  const status = statusMap[teacher.status] ?? statusMap.inactive;

  return (
    <div className="text-slate-200">

      {/* ── Breadcrumb ──────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link to="/teachers" className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Teachers
        </Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-400">{teacher.user?.name}</span>
      </div>

      <div className="grid grid-cols-3 gap-5">

        {/* ── LEFT: Profile card ────────────────────────── */}
        <div className="space-y-4">

          {/* Identity */}
          <div className="bg-slate-900/50 border border-slate-700/60 rounded-2xl p-6 text-center">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${grad1} ${grad2} flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-xl ${shadow}`}>
              {initials}
            </div>
            <h2 className="text-lg font-bold mb-0.5">{teacher.user?.name}</h2>
            <p className="text-slate-400 text-sm mb-1">{teacher.department}</p>
            <code className="text-xs text-slate-500 font-mono bg-slate-800/60 px-2.5 py-0.5 rounded-md">
              {teacher.employee_id}
            </code>

            <div className="mt-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${status.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-5">
              <Link to={`/teachers/${teacher.id}/edit`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-xl hover:bg-blue-500/20 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Link>
              <Link to={`/teachers/${teacher.id}/timetable`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold rounded-xl hover:bg-slate-700 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Timetable
              </Link>
            </div>
          </div>

          {/* Contact details */}
          <div className="bg-slate-900/50 border border-slate-700/60 rounded-2xl p-5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Contact & Info</p>
            <div className="space-y-3">
              {[
                {
                  icon: (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                  val: teacher.user?.email,
                },
                {
                  icon: (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  ),
                  val: teacher.phone || "—",
                },
                {
                  icon: (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  ),
                  val: teacher.qualification || "—",
                },
                {
                  icon: (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ),
                  val: teacher.join_date ? `Joined ${teacher.join_date}` : "—",
                },
                {
                  icon: (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  val: `${teacher.experience_yrs} years experience`,
                },
              ].map(({ icon, val }, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-400 flex-shrink-0">
                    {icon}
                  </span>
                  <span className="text-slate-400 truncate">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Main content ───────────────────────── */}
        <div className="col-span-2 space-y-4">

          {/* Performance metrics */}
          <div className="bg-slate-900/50 border border-slate-700/60 rounded-2xl p-5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-5">Performance Overview</p>
            <div className="grid grid-cols-4 gap-4">
              {/* Stat cards */}
              {[
                {
                  label: "Students",
                  val: perf?.students_count ?? 0,
                  sub: "enrolled",
                  icon: "👥",
                  cls: "from-blue-500/15 to-indigo-500/5 border-blue-500/15 text-blue-400",
                },
                {
                  label: "Classes",
                  val: perf?.classes_taught ?? 0,
                  sub: "this term",
                  icon: "🏫",
                  cls: "from-violet-500/15 to-purple-500/5 border-violet-500/15 text-violet-400",
                },
              ].map(s => (
                <div key={s.label} className={`col-span-1 bg-gradient-to-br ${s.cls} border rounded-xl p-4 text-center`}>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-2xl font-bold text-slate-100">{s.val}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{s.label}</div>
                  <div className="text-[10px] text-slate-600">{s.sub}</div>
                </div>
              ))}

              {/* Radial progress charts */}
              <div className="col-span-1 flex flex-col items-center justify-center bg-slate-800/30 border border-slate-700/40 rounded-xl p-3">
                <RadialProgress
                  value={perf?.avg_student_score ?? 0}
                  color="text-emerald-400"
                  label="Avg Score"
                />
              </div>
              <div className="col-span-1 flex flex-col items-center justify-center bg-slate-800/30 border border-slate-700/40 rounded-xl p-3">
                <RadialProgress
                  value={perf?.attendance_rate ?? 0}
                  color="text-amber-400"
                  label="Attendance"
                />
              </div>
            </div>
          </div>

          {/* Subjects */}
          <div className="bg-slate-900/50 border border-slate-700/60 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Teaching Subjects</p>
              <span className="text-xs text-slate-600">{teacher.subjects?.length ?? 0} total</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {teacher.subjects?.length > 0 ? teacher.subjects.map((s, i) => {
                const colors = [
                  "bg-blue-500/10 text-blue-300 border-blue-500/20",
                  "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
                  "bg-violet-500/10 text-violet-300 border-violet-500/20",
                  "bg-amber-500/10 text-amber-300 border-amber-500/20",
                  "bg-rose-500/10 text-rose-300 border-rose-500/20",
                  "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
                ];
                const cls = colors[i % colors.length];
                return (
                  <span key={s.name} className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-medium ${cls}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                    {s.name}
                    {s.code && <span className="opacity-50 font-mono text-[10px]">({s.code})</span>}
                  </span>
                );
              }) : (
                <p className="text-slate-500 text-sm">No subjects assigned yet.</p>
              )}
            </div>
          </div>

          {/* Assigned classes */}
          <div className="bg-slate-900/50 border border-slate-700/60 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Assigned Classes</p>
              <span className="text-xs text-slate-600">{teacher.class_rooms?.length ?? 0} classes</span>
            </div>

            {teacher.class_rooms?.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {teacher.class_rooms.map((c, i) => {
                  const capacity = 40; // estimated
                  const pct = Math.min(((c.students_count ?? 0) / capacity) * 100, 100);
                  return (
                    <Link
                      key={c.id}
                      to={`/classes/${c.id}`}
                      className="group p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:border-blue-500/30 hover:bg-slate-800/60 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <p className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{c.name}</p>
                        <svg className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-500 transition-colors mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{c.students_count ?? 0} students</p>
                      {/* Occupancy bar */}
                      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-600 mt-1.5">{pct.toFixed(0)}% capacity</p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <span className="text-2xl">🏫</span>
                <p className="text-slate-500 text-sm">No classes assigned.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}