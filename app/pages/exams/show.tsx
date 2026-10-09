import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/show";
import { api, type Exam, type Grade, type Student } from "~/lib/api";

interface ExamDetails extends Exam {
  class_room?: Exam["class_room"] & { students?: Student[] };
}

interface MarkEntry {
  marks: string;
  remarks: string;
}

export async function clientLoader({ params }: Route.LoaderArgs) {
  const response = await api.exams.get(Number(params.id));
  return { exam: response.data as ExamDetails };
}

const studentName = (student: Student) =>
  student.full_name || `${student.first_name} ${student.last_name}`;

function errorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    if ("errors" in error && error.errors && typeof error.errors === "object") {
      const messages = Object.values(error.errors)
        .flatMap((value) => Array.isArray(value) ? value : [])
        .filter((value): value is string => typeof value === "string");
      if (messages.length > 0) return messages.join(" ");
    }
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }
  return "Marks could not be saved. Please try again.";
}

export default function ExamShowPage({ loaderData }: Route.ComponentProps) {
  const { exam: initialExam } = loaderData;
  const [exam, setExam] = useState(initialExam);
  const [entries, setEntries] = useState<Record<number, MarkEntry>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const students = exam.class_room?.students ?? [];
  const existingGrades = useMemo(
    () => new Map((exam.grades ?? []).map((grade) => [grade.student_id, grade])),
    [exam.grades],
  );
  const enteredCount = students.filter((student) => {
    const current = entries[student.id];
    return current ? current.marks.trim() !== "" : existingGrades.has(student.id);
  }).length;

  useEffect(() => {
    setEntries((current) => {
      const next = { ...current };
      for (const student of students) {
        if (!next[student.id]) {
          const grade = existingGrades.get(student.id);
          next[student.id] = {
            marks: grade ? String(grade.marks_obtained) : "",
            remarks: grade?.remarks ?? "",
          };
        }
      }
      return next;
    });
  }, [students, existingGrades]);

  const updateEntry = (studentId: number, field: keyof MarkEntry, value: string) => {
    setEntries((current) => ({
      ...current,
      [studentId]: { ...current[studentId], [field]: value },
    }));
    setError("");
    setSuccess("");
  };

  const saveMarks = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const grades = students.flatMap((student) => {
      const entry = entries[student.id];
      if (!entry?.marks.trim()) return [];
      const marks = Number(entry.marks);
      if (!Number.isFinite(marks) || marks < 0 || marks > exam.total_marks) return [];
      return [{
        student_id: student.id,
        marks_obtained: marks,
        remarks: entry.remarks.trim() || undefined,
      }];
    });
    const invalidStudent = students.find((student) => {
      const mark = entries[student.id]?.marks.trim();
      return mark !== undefined && mark !== "" &&
        (!Number.isFinite(Number(mark)) || Number(mark) < 0 || Number(mark) > exam.total_marks);
    });

    if (invalidStudent) {
      setError(`${studentName(invalidStudent)}'s score must be between 0 and ${exam.total_marks}.`);
      return;
    }
    if (grades.length === 0) {
      setError("Enter at least one student's mark before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.grades.enter({ exam_id: exam.id, grades });
      const updated = await api.exams.get(exam.id);
      setExam(updated.data as ExamDetails);
      setSuccess(response.message || "Marks saved successfully.");
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const resultFor = (grade?: Grade) => {
    if (!grade) return null;
    return `${Number(grade.percentage).toFixed(1)}% · ${grade.letter_grade} · ${grade.status}`;
  };

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <Link to="/exams" className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <span aria-hidden="true">←</span> Back to exams
      </Link>

      <section className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-400">
              {exam.subject?.name || "Exam"} · {exam.class_room?.name || "Class"}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white">{exam.title}</h1>
            <p className="mt-2 text-sm text-slate-400">
              {new Date(exam.exam_date).toLocaleDateString("en-KE", {
                day: "numeric", month: "long", year: "numeric",
              })}
              {" · "}Passing mark {exam.passing_marks} / {exam.total_marks}
            </p>
          </div>
          <span className="w-fit rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold capitalize text-slate-300">
            {exam.status}
          </span>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
        <div className="flex flex-col gap-2 border-b border-slate-700 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-bold text-white">Enter marks</h2>
            <p className="mt-1 text-xs text-slate-400">
              Scores are out of {exam.total_marks}. Existing marks can be updated.
            </p>
          </div>
          <span className="text-sm text-slate-400">
            {enteredCount} of {students.length} students entered
          </span>
        </div>

        {error && <div role="alert" className="m-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
        {success && <div role="status" className="m-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">{success}</div>}

        {exam.status !== "completed" ? (
          <div className="p-8 text-center">
            <div role="alert" className="mx-auto max-w-xl rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-left">
              <p className="font-semibold text-amber-200">Marks can only be entered for completed exams.</p>
              <p className="mt-1 text-sm text-amber-100/80">
                This exam is currently {exam.status}. Edit the exam and change its status to Completed before recording marks.
              </p>
            </div>
          </div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-semibold text-slate-200">No students found in this class</p>
            <p className="mt-1 text-sm text-slate-400">Add students to the exam class before recording marks.</p>
          </div>
        ) : (
          <form onSubmit={saveMarks}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Student</th>
                    <th className="w-40 px-4 py-3 font-semibold">Score / {exam.total_marks}</th>
                    <th className="w-64 px-4 py-3 font-semibold">Remarks</th>
                    <th className="w-48 px-4 py-3 font-semibold">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {students.map((student) => {
                    const grade = existingGrades.get(student.id);
                    const score = entries[student.id]?.marks;
                    return (
                      <tr key={student.id} className="hover:bg-slate-700/20">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-100">{studentName(student)}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{student.admission_no}</p>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max={exam.total_marks}
                            step="0.01"
                            inputMode="decimal"
                            aria-label={`Marks for ${studentName(student)}`}
                            value={score ?? ""}
                            onChange={(event) => updateEntry(student.id, "marks", event.target.value)}
                            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                            placeholder="—"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            aria-label={`Remarks for ${studentName(student)}`}
                            value={entries[student.id]?.remarks ?? ""}
                            onChange={(event) => updateEntry(student.id, "remarks", event.target.value)}
                            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                            placeholder="Optional"
                          />
                        </td>
                        <td className="px-4 py-3 text-xs capitalize text-slate-400">
                          {resultFor(grade) ?? "Not saved"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-700 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <p className="text-xs text-slate-500">
                Percentage, letter grade, and pass/fail are calculated automatically.
              </p>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving marks…" : "Save marks"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
