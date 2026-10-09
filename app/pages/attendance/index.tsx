import { useEffect, useMemo, useState } from "react";
import { Link, useNavigation, useSearchParams } from "react-router";
import type { Route } from "./+types/index";
import { api, type AttendanceReport, type AttendanceReportDay } from "~/lib/api";

type Period = "week" | "month" | "year" | "custom";
type DayStatus = "present" | "absent" | "late" | "holiday" | "unmarked";

const STATUS_STYLE: Record<DayStatus, string> = {
  present: "bg-emerald-500/20 text-emerald-300",
  absent: "bg-red-500/20 text-red-300",
  late: "bg-amber-500/20 text-amber-300",
  holiday: "bg-slate-600 text-slate-200",
  unmarked: "bg-slate-800 text-slate-500 border border-slate-700",
};

const STATUS_LABEL: Record<DayStatus, string> = {
  present: "P",
  absent: "A",
  late: "L",
  holiday: "H",
  unmarked: "-",
};

const pad = (value: number) => String(value).padStart(2, "0");
const formatDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseDate = (value: string | null, fallback: Date) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : fallback;
};

function dateRange(period: Period, params: URLSearchParams, now: Date) {
  if (period === "week") {
    const anchor = parseDate(params.get("date"), now);
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from: formatDate(start), to: formatDate(end), anchor: formatDate(anchor) };
  }

  if (period === "month") {
    const monthValue = params.get("month");
    const validMonth = monthValue && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthValue)
      ? monthValue
      : `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    const [year, month] = validMonth.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return { from: formatDate(start), to: formatDate(end), month: validMonth, year, monthNumber: month };
  }

  if (period === "year") {
    const parsedYear = Number(params.get("year"));
    const year = Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100
      ? parsedYear
      : now.getFullYear();
    return { from: `${year}-01-01`, to: `${year}-12-31`, year };
  }

  const from = parseDate(params.get("date_from"), new Date(now.getFullYear(), now.getMonth(), 1));
  const to = parseDate(params.get("date_to"), new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const [rangeStart, rangeEnd] = from <= to ? [from, to] : [to, from];
  return { from: formatDate(rangeStart), to: formatDate(rangeEnd) };
}

export async function clientLoader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const validPeriods: Period[] = ["week", "month", "year", "custom"];
  const requestedPeriod = params.get("period") as Period | null;
  const period = requestedPeriod && validPeriods.includes(requestedPeriod) ? requestedPeriod : "month";
  const now = new Date();
  const range = dateRange(period, params, now);

  const classesResponse = await api.classes.list({ per_page: 100 });
  const classes = classesResponse.data || [];
  const parsedClassId = Number(params.get("class_id"));
  const classId = classes.some((item) => item.id === parsedClassId)
    ? parsedClassId
    : classes[0]?.id;
  const selectedYear = "year" in range && typeof range.year === "number"
    ? range.year
    : now.getFullYear();
  const selectedMonth = "month" in range && typeof range.month === "string"
    ? range.month
    : `${selectedYear}-${pad(now.getMonth() + 1)}`;

  const [lowResponse, reportResponse] = await Promise.all([
    api.attendance.low(),
    classId
      ? api.attendance.report({ class_id: classId, date_from: range.from, date_to: range.to })
      : Promise.resolve(null),
  ]);

  return {
    classes,
    classId,
    low: lowResponse.data || [],
    report: reportResponse?.data ?? null,
    period,
    dateFrom: range.from,
    dateTo: range.to,
    anchor: "anchor" in range ? range.anchor : "",
    selectedMonth,
    selectedYear,
    selectedDateFrom: period === "custom" ? range.from : params.get("date_from") || range.from,
    selectedDateTo: period === "custom" ? range.to : params.get("date_to") || range.to,
  };
}

function dailyStatus(day?: AttendanceReportDay): DayStatus {
  if (!day || day.records_count === 0) return "unmarked";
  const counted = day.present + day.absent + day.late;
  if (counted === 0 && day.holiday > 0) return "holiday";
  if (counted === 0) return "unmarked";
  return (day.present + day.late) / counted >= 0.5 ? "present" : "absent";
}

function periodLabel(period: Period, from: string, to: string) {
  const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };
  const start = new Date(`${from}T12:00:00`).toLocaleDateString(undefined, options);
  const end = new Date(`${to}T12:00:00`).toLocaleDateString(undefined, options);
  if (period === "week" || period === "custom") return `${start} – ${end}`;
  if (period === "month") return new Date(`${from}T12:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  return from.slice(0, 4);
}

function countFromDays(days: AttendanceReportDay[]) {
  return days.reduce(
    (result, day) => {
      result.present += day.present;
      result.absent += day.absent;
      result.late += day.late;
      result.holiday += day.holiday;
      result.excused += day.excused;
      return result;
    },
    { present: 0, absent: 0, late: 0, holiday: 0, excused: 0 },
  );
}

function AttendanceRegister({ report }: { report: AttendanceReport }) {
  return (
    <section className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-700">
        <h2 className="font-semibold">Per-student attendance register</h2>
        <p className="text-xs text-slate-400 mt-1">
          Rates use recorded present, late, and absent entries. Unmarked days, holidays, and excused entries are excluded.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-slate-400 bg-slate-900/60">
            <tr>
              <th className="px-4 py-3">Roll No.</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3 text-right">Present</th>
              <th className="px-4 py-3 text-right">Late</th>
              <th className="px-4 py-3 text-right">Absent</th>
              <th className="px-4 py-3 text-right">Holiday</th>
              <th className="px-4 py-3 text-right">Excused</th>
              <th className="px-4 py-3 text-right">Recorded</th>
              <th className="px-4 py-3 text-right">Attendance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/70">
            {report.students.map((student) => (
              <tr key={student.id} className="text-slate-200 hover:bg-slate-700/30">
                <td className="px-4 py-3 font-mono text-slate-400">{student.roll_number}</td>
                <td className="px-4 py-3 font-medium">{student.name}</td>
                <td className="px-4 py-3 text-right text-emerald-300">{student.present}</td>
                <td className="px-4 py-3 text-right text-amber-300">{student.late}</td>
                <td className="px-4 py-3 text-right text-red-300">{student.absent}</td>
                <td className="px-4 py-3 text-right text-slate-400">{student.holiday}</td>
                <td className="px-4 py-3 text-right text-violet-300">{student.excused}</td>
                <td className="px-4 py-3 text-right">{student.recorded_days}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {student.attendance_rate === null ? <span className="text-slate-500">No records</span> : `${student.attendance_rate}%`}
                </td>
              </tr>
            ))}
            {report.students.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">No students are enrolled in this class.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AttendancePage({ loaderData }: Route.ComponentProps) {
  const {
    classes, classId, low, report, period, dateFrom, dateTo, anchor,
    selectedMonth, selectedYear, selectedDateFrom, selectedDateTo,
  } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const [draftFrom, setDraftFrom] = useState(selectedDateFrom);
  const [draftTo, setDraftTo] = useState(selectedDateTo);
  const [exportError, setExportError] = useState("");
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";

  useEffect(() => {
    setDraftFrom(selectedDateFrom);
    setDraftTo(selectedDateTo);
  }, [selectedDateFrom, selectedDateTo]);

  const updateParams = (updates: Record<string, string>, remove: string[] = []) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      remove.forEach((key) => next.delete(key));
      Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
      return next;
    });
  };

  const dailyByDate = useMemo(
    () => new Map((report?.daily ?? []).map((day) => [day.date.slice(0, 10), day])),
    [report],
  );

  const monthlySummary = useMemo(() => {
    const grouped = new Map<string, AttendanceReportDay[]>();
    for (const day of report?.daily ?? []) {
      const key = day.date.slice(0, 7);
      grouped.set(key, [...(grouped.get(key) ?? []), day]);
    }
    return [...grouped.entries()].map(([month, days]) => {
      const counts = countFromDays(days);
      const denominator = counts.present + counts.absent + counts.late;
      return {
        month,
        ...counts,
        recorded: denominator,
        rate: denominator ? Math.round(((counts.present + counts.late) / denominator) * 1000) / 10 : null,
      };
    });
  }, [report]);

  const classSummary = report?.summary;
  const lowList = Array.isArray(low) ? low.slice(0, 5) : [];
  const label = periodLabel(period, dateFrom, dateTo);
  const monthDates = useMemo(() => {
    if (period !== "month") return [];
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const leading = (new Date(year, month - 1, 1).getDay() + 6) % 7;
    return [
      ...Array.from({ length: leading }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => `${selectedMonth}-${pad(index + 1)}`),
    ];
  }, [period, selectedMonth]);

  const weekDays = useMemo(() => {
    if (period !== "week") return [];
    const weekStart = new Date(`${dateFrom}T12:00:00`);
    return Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + offset);
      const dateKey = formatDate(date);
      return dailyByDate.get(dateKey) ?? {
        date: dateKey,
        present: 0,
        absent: 0,
        late: 0,
        holiday: 0,
        excused: 0,
        records_count: 0,
        attendance_rate: null,
      };
    });
  }, [period, dateFrom, dailyByDate]);

  const navigatePeriod = (direction: number) => {
    if (period === "week") {
      const date = new Date(`${anchor}T12:00:00`);
      date.setDate(date.getDate() + direction * 7);
      updateParams({ date: formatDate(date) });
    } else if (period === "month") {
      const [year, month] = selectedMonth.split("-").map(Number);
      const date = new Date(year, month - 1 + direction, 1);
      updateParams({ month: `${date.getFullYear()}-${pad(date.getMonth() + 1)}` });
    } else if (period === "year") {
      updateParams({ year: String(selectedYear + direction) });
    }
  };

  const exportMonth = async () => {
    if (!classId || !selectedMonth) return;
    const [year, month] = selectedMonth.split("-").map(Number);
    setExportError("");
    try {
      const file = await api.attendance.export({ class_id: classId, month, year });
      const downloadUrl = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `attendance-${year}-${pad(month)}.xlsx`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch {
      setExportError("The attendance export could not be downloaded. Please try again.");
    }
  };

  const dailyTable = (days: AttendanceReportDay[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase text-slate-400 bg-slate-900/60">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3 text-right">Present</th>
            <th className="px-4 py-3 text-right">Late</th>
            <th className="px-4 py-3 text-right">Absent</th>
            <th className="px-4 py-3 text-right">Holiday</th>
            <th className="px-4 py-3 text-right">Attendance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/70">
          {days.map((day) => (
            <tr key={day.date} className="text-slate-200">
              <td className="px-4 py-3">{new Date(`${day.date.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</td>
              <td className="px-4 py-3 text-right text-emerald-300">{day.present}</td>
              <td className="px-4 py-3 text-right text-amber-300">{day.late}</td>
              <td className="px-4 py-3 text-right text-red-300">{day.absent}</td>
              <td className="px-4 py-3 text-right text-slate-400">{day.holiday}</td>
              <td className="px-4 py-3 text-right font-semibold">{day.attendance_rate === null ? "No records" : `${day.attendance_rate}%`}</td>
            </tr>
          ))}
          {days.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No attendance was marked during this period.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={isLoading ? "opacity-60 pointer-events-none transition-opacity" : ""}>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold">Attendance Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">Review class and student attendance across a selected period.</p>
        </div>
        <Link
          to={`/attendance/mark${classId ? `?class_id=${classId}` : ""}`}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition text-center"
        >
          Mark Attendance
        </Link>
        {period === "month" && (
          <button type="button" onClick={exportMonth} className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition">
            Export month
          </button>
        )}
      </header>
      {exportError && <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{exportError}</p>}

      <section className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-xs text-slate-400">
            Class
            <select
              value={classId || ""}
              onChange={(event) => updateParams({ class_id: event.target.value })}
              className="mt-1 block w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-200"
            >
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            View period
            <select
              value={period}
              onChange={(event) => updateParams({ period: event.target.value }, ["date", "month", "year", "date_from", "date_to"])}
              className="mt-1 block w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-200"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
              <option value="custom">Custom range</option>
            </select>
          </label>
          {period === "week" && (
            <label className="text-xs text-slate-400">
              Choose a date in the week
              <input type="date" value={anchor} onChange={(event) => updateParams({ date: event.target.value })} className="mt-1 block w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200" />
            </label>
          )}
          {period === "month" && (
            <label className="text-xs text-slate-400">
              Month
              <input type="month" value={selectedMonth} onChange={(event) => updateParams({ month: event.target.value })} className="mt-1 block w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200" />
            </label>
          )}
          {period === "year" && (
            <label className="text-xs text-slate-400">
              Year
              <input type="number" min="2000" max="2100" value={selectedYear} onChange={(event) => updateParams({ year: event.target.value })} className="mt-1 block w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200" />
            </label>
          )}
          {period === "custom" && (
            <>
              <label className="text-xs text-slate-400">
                From
                <input type="date" value={draftFrom} onChange={(event) => setDraftFrom(event.target.value)} className="mt-1 block w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200" />
              </label>
              <label className="text-xs text-slate-400">
                To
                <input type="date" value={draftTo} min={draftFrom} onChange={(event) => setDraftTo(event.target.value)} className="mt-1 block w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200" />
              </label>
              <button type="button" disabled={!draftFrom || !draftTo || draftTo < draftFrom} onClick={() => updateParams({ date_from: draftFrom, date_to: draftTo })} className="self-end rounded-lg px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">
                Apply dates
              </button>
            </>
          )}
        </div>
        {period !== "custom" && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700">
            <button type="button" onClick={() => navigatePeriod(-1)} className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-200 hover:bg-slate-700">← Previous</button>
            <div className="text-sm font-semibold text-slate-200">{label}</div>
            <button type="button" onClick={() => navigatePeriod(1)} className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-200 hover:bg-slate-700">Next →</button>
          </div>
        )}
      </section>

      {!classId || !report ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-8 text-center text-slate-300">
          {classes.length ? "Attendance report could not be loaded." : "Add a class and students to view attendance."}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
            {[
              { label: "Class attendance", value: classSummary?.attendance_rate === null ? "No records" : `${classSummary?.attendance_rate ?? 0}%`, color: "text-blue-300" },
              { label: "Present", value: classSummary?.present ?? 0, color: "text-emerald-300" },
              { label: "Late", value: classSummary?.late ?? 0, color: "text-amber-300" },
              { label: "Absent", value: classSummary?.absent ?? 0, color: "text-red-300" },
              { label: "Holiday", value: classSummary?.holiday ?? 0, color: "text-slate-300" },
              { label: "Excused", value: classSummary?.excused ?? 0, color: "text-violet-300" },
              { label: "Students", value: classSummary?.students_count ?? 0, color: "text-slate-100" },
            ].map((item) => (
              <div key={item.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
                <div className="text-xs text-slate-400 mt-1">{item.label}</div>
              </div>
            ))}
          </div>

          {period === "month" && (
            <section className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5 mb-6">
              <h2 className="font-semibold mb-4">{label} calendar</h2>
              <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-500 mb-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day}>{day}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {monthDates.map((date, index) => {
                  if (!date) return <div key={`empty-${index}`} />;
                  const status = dailyStatus(dailyByDate.get(date));
                  return (
                    <div key={date} title={`${date}: ${status}`} className={`aspect-square rounded-lg flex flex-col items-center justify-center ${STATUS_STYLE[status]}`}>
                      <span className="text-sm font-semibold">{Number(date.slice(-2))}</span>
                      <span className="text-[10px]">{STATUS_LABEL[status]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs text-slate-400">
                {(["present", "absent", "late", "holiday", "unmarked"] as DayStatus[]).map((status) => (
                  <span key={status} className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded ${STATUS_STYLE[status]}`} />{status === "unmarked" ? "No records" : status}</span>
                ))}
              </div>
            </section>
          )}

          {period === "year" && (
            <section className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mb-6">
              <div className="p-4 border-b border-slate-700">
                <h2 className="font-semibold">{selectedYear} month-by-month summary</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-slate-400 bg-slate-900/60">
                    <tr><th className="px-4 py-3 text-left">Month</th><th className="px-4 py-3 text-right">Present</th><th className="px-4 py-3 text-right">Late</th><th className="px-4 py-3 text-right">Absent</th>                    <th className="px-4 py-3 text-right">Counted days</th><th className="px-4 py-3 text-right">Rate</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/70">
                    {Array.from({ length: 12 }, (_, index) => {
                      const key = `${selectedYear}-${pad(index + 1)}`;
                      const data = monthlySummary.find((month) => month.month === key);
                      return (
                        <tr key={key} className="text-slate-200">
                          <td className="px-4 py-3">{new Date(selectedYear, index, 1).toLocaleDateString(undefined, { month: "long" })}</td>
                          <td className="px-4 py-3 text-right text-emerald-300">{data?.present ?? 0}</td>
                          <td className="px-4 py-3 text-right text-amber-300">{data?.late ?? 0}</td>
                          <td className="px-4 py-3 text-right text-red-300">{data?.absent ?? 0}</td>
                          <td className="px-4 py-3 text-right">{data?.recorded ?? 0}</td>
                          <td className="px-4 py-3 text-right font-semibold">{data?.rate == null ? "No records" : `${data.rate}%`}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {(period === "week" || period === "custom") && (
            <section className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mb-6">
              <div className="p-4 border-b border-slate-700">
                <h2 className="font-semibold">Daily class summary</h2>
                <p className="text-xs text-slate-400 mt-1">Days without a row are shown as having no records, not as absences.</p>
              </div>
              {dailyTable(period === "week" ? weekDays : report.daily)}
            </section>
          )}

          <AttendanceRegister report={report} />

          <section className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5 mt-6">
            <h2 className="font-semibold mb-3">Overall low attendance alerts</h2>
            {lowList.length ? (
              <div className="space-y-2">
                {lowList.map((student: { id: number; name: string; class: string; percentage: number }) => (
                  <div key={student.id} className="flex items-center justify-between gap-3 rounded-lg bg-red-500/5 border border-red-500/15 px-3 py-2">
                    <div><p className="text-sm text-slate-200">{student.name}</p><p className="text-xs text-slate-500">{student.class}</p></div>
                    <div className="flex items-center gap-3"><span className="font-mono text-sm font-bold text-red-300">{student.percentage}%</span><Link to={`/students/${student.id}`} className="text-xs text-slate-300 hover:text-white">View</Link></div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">No low attendance alerts.</p>}
          </section>
        </>
      )}
    </div>
  );
}
