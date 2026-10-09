import { Link } from "react-router";
import type { Route } from "./+types/view";
import { api, type Exam, type Student } from "~/lib/api";

interface ExamDetails extends Exam {
  class_room?: Exam["class_room"] & { students?: Student[] };
}

export async function clientLoader({ params }: Route.LoaderArgs) {
  const response = await api.exams.get(Number(params.id));
  return { exam: response.data as ExamDetails };
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function ViewExamPage({ loaderData }: Route.ComponentProps) {
  const { exam } = loaderData;
  const students = exam.class_room?.students ?? [];
  const grades = new Map((exam.grades ?? []).map((grade) => [grade.student_id, grade]));

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link to="/exams" className="text-sm text-slate-400 transition hover:text-white">
          ← Back to exams
        </Link>
        <div className="flex gap-2">
          {exam.status !== "cancelled" && (
            <>
              <Link
                to={`/exams/${exam.id}/edit`}
                className="rounded-lg border border-amber-500/30 px-3 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/10"
              >
                Edit exam
              </Link>
              <Link
                to={`/exams/${exam.id}`}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Enter marks
              </Link>
            </>
          )}
        </div>
      </div>

      <section className="rounded-xl border border-slate-700 bg-slate-800 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-400">
              {exam.subject?.name ?? "Subject"} · {exam.class_room?.name ?? "Class"}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white">{exam.title}</h1>
            <p className="mt-2 text-sm text-slate-400">Scheduled exam details and class results.</p>
          </div>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold capitalize text-slate-300">
            {exam.status}
          </span>
        </div>

        <dl className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Date", formatDate(exam.exam_date)],
            ["Time", `${exam.start_time} – ${exam.end_time}`],
            ["Room", exam.room || "Not specified"],
            ["Total marks", String(exam.total_marks)],
            ["Passing marks", String(exam.passing_marks)],
            ["Invigilator", exam.invigilator?.user?.name ?? "Not assigned"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
              <dd className="mt-1 text-sm font-medium text-slate-100">{value}</dd>
            </div>
          ))}
        </dl>

        {exam.instructions && (
          <div className="mt-5 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Instructions</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{exam.instructions}</p>
          </div>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
        <div className="border-b border-slate-700 p-5">
          <h2 className="font-bold text-white">Class roster and marks</h2>
          <p className="mt-1 text-sm text-slate-400">
            {students.length} students · {(exam.grades ?? []).length} marks recorded
          </p>
        </div>
        {students.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">There are no students currently assigned to this class.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Student</th>
                  <th className="px-5 py-3 font-semibold">Admission number</th>
                  <th className="px-5 py-3 font-semibold">Marks</th>
                  <th className="px-5 py-3 font-semibold">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {students.map((student) => {
                  const grade = grades.get(student.id);
                  return (
                    <tr key={student.id}>
                      <td className="px-5 py-3 font-medium text-slate-100">{student.full_name}</td>
                      <td className="px-5 py-3 text-slate-400">{student.admission_no}</td>
                      <td className="px-5 py-3 text-slate-200">
                        {grade ? `${grade.marks_obtained} / ${grade.total_marks}` : "Not entered"}
                      </td>
                      <td className="px-5 py-3 text-slate-400">
                        {grade
                          ? `${Number(grade.percentage).toFixed(1)}% · ${grade.letter_grade} · ${grade.status}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
