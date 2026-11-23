// ============================================================
// app/pages/attendance/mark.tsx
// ============================================================
import { useState, useEffect } from "react";
import { Form, Link, useSearchParams, useNavigation } from "react-router";
import { api, type Attendance, type AttendanceStatus, type Student } from "~/lib/api";

const localDate = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const attendanceStatuses = ["present", "absent", "late", "holiday", "excused"] as const satisfies readonly AttendanceStatus[];
const statusLabels: Record<AttendanceStatus, string> = {
  present: "P",
  absent: "A",
  late: "L",
  holiday: "H",
  excused: "E",
};

export async function clientLoader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const classesRes = await api.classes.list({ per_page: 100 });
  const classes = classesRes.data || [];
  
  const classIdParam = url.searchParams.get("class_id");
  const requestedClassId = classIdParam ? Number(classIdParam) : null;
  const classId = requestedClassId && classes.some((classItem) => classItem.id === requestedClassId)
    ? requestedClassId
    : classes[0]?.id;
  const requestedDate = url.searchParams.get("date");
  const date = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
    ? requestedDate
    : localDate();

  let students: Student[] = [];
  let attendanceRecords: Attendance[] = [];
  if (classId) {
    const [studentsRes, attendanceRes] = await Promise.all([
      api.students.list({ class_id: classId, status: "active", per_page: 100 }),
      api.attendance.list({ class_id: classId, date, per_page: 1000 }),
    ]);
    students = studentsRes.data?.data || [];
    attendanceRecords = attendanceRes.data?.data || [];
  }

  return { classes, students, classId, date, attendanceRecords };
}

export async function clientAction({ request }: { request: Request }) {
  const form = await request.formData();
  const entries = Array.from(form.entries());
  
  const attendance = entries
    .filter(([k]) => k.startsWith("status_"))
    .map(([k, v]) => ({ 
      student_id: Number(k.replace("status_", "")), 
      status: v as AttendanceStatus,
      remarks: String(form.get(`remarks_${k.replace("status_", "")}`) || "").trim() || undefined,
    }));

  if (attendance.length === 0) {
    return { error: "Select attendance for at least one student." };
  }

  try {
    await api.attendance.mark({ 
      class_id: Number(form.get("class_id")), 
      date: form.get("date") as string, 
      attendance 
    });
    return { success: true, message: `Attendance saved for ${attendance.length} students.` };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
      return { error: err.message };
    }
    return { error: "Failed to save attendance. Check your connection and try again." };
  }
}

export default function MarkAttendancePage({ loaderData, actionData }: {
  loaderData: {
    classes: Array<{ id: number; name: string }>;
    students: Student[];
    classId?: number;
    date: string;
    attendanceRecords: Attendance[];
  };
  actionData?: { success?: boolean; error?: string; message?: string };
}) {
  const { classes, students, classId, date, attendanceRecords } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSwitchingClass = navigation.state === "loading" && navigation.formMethod !== "POST";
  const [statuses, setStatuses] = useState<Record<number, AttendanceStatus>>(() => Object.fromEntries(
    students.map((student) => [
      student.id,
      attendanceRecords.find((record) => record.student_id === student.id)?.status || "present",
    ])
  ));
  const [remarks, setRemarks] = useState<Record<number, string>>(() => Object.fromEntries(
    attendanceRecords.map((record) => [record.student_id, record.remarks || ""])
  ));
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);

  useEffect(() => {
    const existing = new Map(attendanceRecords.map((record) => [record.student_id, record]));
    setStatuses(Object.fromEntries(students.map((student) => [
      student.id,
      existing.get(student.id)?.status || "present",
    ])));
    setRemarks(Object.fromEntries(students.map((student) => [
      student.id,
      existing.get(student.id)?.remarks || "",
    ])));
  }, [students, attendanceRecords]);

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  const markAll = (status: AttendanceStatus) => setStatuses(Object.fromEntries(students.map(s => [s.id, status])));

  if (actionData?.success) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold mb-2">Attendance Saved</h2>
        <p className="text-slate-400 text-sm mb-6">{actionData.message || "Attendance saved successfully."}</p>
        <div className="flex gap-3 justify-center">
          <Link to={`/attendance?class_id=${classId}`} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition">← Dashboard</Link>
          <Link to={`/attendance/mark?class_id=${classId}`} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition">Mark Another</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-6">📝 Mark Attendance</h1>

      <p role="status" className={`mb-4 rounded-lg border px-3 py-2 text-sm ${isOnline ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>
        {isOnline ? "Online — attendance will be saved to the server." : "You are offline. Attendance cannot be saved until you reconnect."}
      </p>
      
      {actionData?.error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {actionData.error}
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-6">
        <Form method="post">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Class</label>
              <select 
                name="class_id" 
                value={classId || ""}
                onChange={(e) => setSearchParams({ class_id: e.target.value, date })}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
              >
                {classes?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Date</label>
              <input type="date" name="date" value={date}
                onChange={(e) => setSearchParams({ class_id: String(classId || ""), date: e.target.value })}
                max={localDate()}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <span className="text-xs text-slate-500 mr-1">Mark all:</span>
            {(["present", "absent", "late"] as const).map(s => (
              <button key={s} type="button" onClick={() => markAll(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  s === "present" ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25" :
                  s === "absent"  ? "bg-red-500/15 text-red-400 hover:bg-red-500/25" :
                                   "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                }`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className={`space-y-2 max-h-[60vh] overflow-y-auto pr-1 ${isSwitchingClass ? "opacity-50" : ""}`}>
            {students.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-4">No students found in this class.</p>
            ) : (
              students.map((s) => (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-3 bg-slate-900/40 rounded-lg border border-slate-700/50 hover:bg-slate-900 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
                      {s.profile_photo ? <img src={s.profile_photo} alt={s.first_name} className="w-full h-full object-cover" /> : s.first_name[0] + s.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.full_name || `${s.first_name} ${s.last_name}`}</p>
                      <p className="text-xs text-slate-500 font-mono truncate">{s.roll_number || s.admission_no}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 self-end sm:self-auto">
                    {attendanceStatuses.map(status => (
                      <label key={status}>
                        <input type="radio" name={`status_${s.id}`} value={status} className="sr-only"
                          aria-label={`${s.full_name || `${s.first_name} ${s.last_name}`} ${status}`}
                          checked={statuses[s.id] === status}
                          onChange={() => setStatuses(prev => ({ ...prev, [s.id]: status }))} />
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all inline-block ${
                          statuses[s.id] === status
                            ? status === "present" ? "bg-emerald-500 text-white"
                              : status === "absent" ? "bg-red-500 text-white"
                              : status === "late" ? "bg-amber-500 text-white"
                              : "bg-indigo-500 text-white"
                            : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                        }`}>
                          {statusLabels[status]}
                        </span>
                      </label>
                    ))}
                  </div>
                  {(statuses[s.id] === "absent" || statuses[s.id] === "late" || statuses[s.id] === "excused") && (
                    <input
                      type="text"
                      name={`remarks_${s.id}`}
                      value={remarks[s.id] || ""}
                      onChange={(event) => setRemarks((current) => ({ ...current, [s.id]: event.target.value }))}
                      maxLength={500}
                      placeholder={statuses[s.id] === "absent" ? "Reason (optional)" : statuses[s.id] === "late" ? "Late note (optional)" : "Note (optional)"}
                      aria-label={`${s.full_name || `${s.first_name} ${s.last_name}`} attendance note`}
                      className="w-full sm:max-w-48 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
                    />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-5 pt-4 border-t border-slate-700">
            <Link to="/attendance" className="flex-1 text-center py-2.5 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition">Cancel</Link>
            <button 
              type="submit" 
              disabled={students.length === 0 || !isOnline || navigation.state === "submitting" || isSwitchingClass}
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {navigation.state === "submitting" ? "Saving…" : "✅ Save Attendance"}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}