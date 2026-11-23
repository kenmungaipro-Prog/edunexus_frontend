import { useState } from "react";
import { Form, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/index";
import {
  api,
  type AssignmentStatus,
  getPaginationMeta,
  type Assignment,
  type AssignmentPayload,
  type AssignmentSubmissionMode,
  type ClassRoom,
  type CreateAssignmentPayload,
  type Student,
  type User,
} from "~/lib/api";

async function studentsForClass(classId: number): Promise<Student[]> {
  const firstPage = await api.students.list({ class_id: classId, status: "active", per_page: 500 });
  const pagination = getPaginationMeta(firstPage.data);
  const remaining = await Promise.all(
    Array.from({ length: Math.max(0, pagination.last_page - 1) }, (_, index) =>
      api.students.list({ class_id: classId, status: "active", per_page: 500, page: index + 2 }),
    ),
  );
  return [firstPage, ...remaining].flatMap((response) => response.data.data);
}

export async function clientLoader() {
  const userResponse = await api.auth.me();
  const user = userResponse.data;
  if (!["teacher", "admin", "student", "parent"].includes(user.role)) {
    throw redirect("/");
  }

  const assignmentsResponse = await api.assignments.list();
  const classesResponse = user.role === "teacher" ? await api.classes.list() : null;
  const classIds = [...new Set(assignmentsResponse.data.map((assignment) => assignment.class_id))];
  const studentGroups = user.role === "teacher"
    ? await Promise.all(classIds.map((classId) => studentsForClass(classId)))
    : [];

  return {
    user,
    classes: classesResponse?.data ?? [],
    assignments: assignmentsResponse.data,
    students: studentGroups.flat(),
  };
}

function actionError(error: unknown) {
  const value = error as { message?: string; errors?: Record<string, string[]> };
  return {
    error: value?.message ?? "The assignment action failed.",
    errors: value?.errors ?? {},
  };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  const attachmentValue = form.get("attachment");
  const attachment = typeof File !== "undefined" && attachmentValue instanceof File && attachmentValue.size > 0
    ? attachmentValue
    : undefined;

  try {
    if (intent === "create") {
      const payload: CreateAssignmentPayload = {
        class_id: Number(form.get("class_id")),
        subject_id: Number(form.get("subject_id")),
        title: String(form.get("title")),
        description: String(form.get("description") ?? ""),
        instructions: String(form.get("instructions") ?? ""),
        due_at: String(form.get("due_at")),
        max_score: Number(form.get("max_score")),
        submission_mode: String(form.get("submission_mode")) as AssignmentSubmissionMode,
        visible_to_parents: form.get("visible_to_parents") === "on",
        status: String(form.get("status")) as AssignmentStatus,
        attachment,
      };
      await api.assignments.create(payload);
    } else if (intent === "update") {
      const payload: AssignmentPayload = {
        title: String(form.get("title")),
        description: String(form.get("description") ?? ""),
        instructions: String(form.get("instructions") ?? ""),
        due_at: String(form.get("due_at")),
        max_score: Number(form.get("max_score")),
        submission_mode: String(form.get("submission_mode")) as AssignmentSubmissionMode,
        visible_to_parents: form.get("visible_to_parents") === "on",
        status: String(form.get("status")) as AssignmentStatus,
        attachment,
      };
      await api.assignments.update(Number(form.get("assignment_id")), payload);
    } else if (intent === "delete") {
      await api.assignments.delete(Number(form.get("assignment_id")));
    } else if (intent === "submit") {
      await api.assignments.submit(Number(form.get("assignment_id")), {
        response_text: String(form.get("response_text") ?? ""),
        attachment,
      });
    } else if (intent === "record-submission") {
      const marks = String(form.get("marks_obtained") ?? "").trim();
      await api.assignments.recordSubmission(
        Number(form.get("assignment_id")),
        Number(form.get("student_id")),
        {
          offline_completed: form.get("offline_completed") === "on",
          ...(marks ? { marks_obtained: Number(marks) } : {}),
          feedback: String(form.get("feedback") ?? ""),
        },
      );
    } else {
      return { error: "Unknown assignment action.", errors: {} };
    }

    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}

const fieldClass = "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100";

function DownloadButton({ onDownload, filename }: { onDownload: () => Promise<Blob>; filename: string }) {
  const [error, setError] = useState("");

  const download = async () => {
    setError("");
    try {
      const blob = await onDownload();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (downloadError) {
      const value = downloadError as { message?: string };
      setError(value?.message ?? "The file could not be downloaded.");
    }
  };

  return (
    <span className="inline-flex flex-col items-start">
      <button type="button" onClick={() => void download()} className="text-sm font-medium text-blue-300 underline underline-offset-2">
        Download {filename}
      </button>
      {error && <span role="alert" className="text-xs text-red-300">{error}</span>}
    </span>
  );
}

function formatDueAt(value: string) {
  return new Date(value).toLocaleString();
}

export default function AssignmentsPage({ loaderData, actionData }: Route.ComponentProps) {
  const { user, classes, assignments, students } = loaderData as {
    user: User;
    classes: ClassRoom[];
    assignments: Assignment[];
    students: Student[];
  };
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const result = actionData as { error?: string; errors?: Record<string, string[]>; success?: boolean } | undefined;
  const isTeacher = user.role === "teacher";
  const isAdmin = user.role === "admin";
  const isStudent = user.role === "student";
  const availableSubjects = classes.find((classRoom) => String(classRoom.id) === classId)?.subjects ?? [];

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 text-slate-100 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold">Assignments</h1>
        <p className="mt-1 text-sm text-slate-400">
          {isTeacher
            ? "Create work for your assigned class-subject pairs and track submissions."
            : isAdmin
              ? "Review assignments for the current academic session."
              : "View assignments shared with you and track completion."}
        </p>
      </header>

      {result?.error && (
        <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {result.error}
          {Object.entries(result.errors ?? {}).map(([field, messages]) => (
            <p key={field}>{field.replaceAll("_", " ")}: {messages.join(", ")}</p>
          ))}
        </div>
      )}
      {result?.success && (
        <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          Assignment changes saved.
        </p>
      )}

      {isTeacher && (
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">Create assignment</h2>
          <Form method="post" encType="multipart/form-data" className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="intent" value="create" />
            <label className="space-y-1 text-sm text-slate-300">Class
              <select name="class_id" required value={classId} onChange={(event) => { setClassId(event.target.value); setSubjectId(""); }} className={fieldClass}>
                <option value="">Select a class</option>
                {classes.map((classRoom) => <option key={classRoom.id} value={classRoom.id}>{classRoom.name}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm text-slate-300">Subject
              <select name="subject_id" required value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className={fieldClass}>
                <option value="">Select a subject</option>
                {availableSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm text-slate-300 md:col-span-2">Title
              <input name="title" required maxLength={255} className={fieldClass} />
            </label>
            <label className="space-y-1 text-sm text-slate-300">Due date and time
              <input name="due_at" type="datetime-local" required className={fieldClass} />
            </label>
            <label className="space-y-1 text-sm text-slate-300">Maximum score
              <input name="max_score" type="number" min="0.01" step="0.01" required defaultValue="100" className={fieldClass} />
            </label>
            <label className="space-y-1 text-sm text-slate-300">Submission method
              <select name="submission_mode" defaultValue="both" className={fieldClass}>
                <option value="both">Online and offline</option>
                <option value="online">Online only</option>
                <option value="offline">Offline only</option>
              </select>
            </label>
            <label className="space-y-1 text-sm text-slate-300">Initial status
              <select name="status" defaultValue="published" className={fieldClass}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
            <label className="space-y-1 text-sm text-slate-300 md:col-span-2">Description
              <textarea name="description" rows={2} className={fieldClass} />
            </label>
            <label className="space-y-1 text-sm text-slate-300 md:col-span-2">Instructions
              <textarea name="instructions" rows={3} className={fieldClass} />
            </label>
            <label className="space-y-1 text-sm text-slate-300 md:col-span-2">Attachment (PDF, Office document, text or image; max 10 MB)
              <input name="attachment" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png" className={`${fieldClass} file:mr-3 file:rounded file:border-0 file:bg-slate-800 file:px-3 file:py-1`} />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 md:col-span-2">
              <input name="visible_to_parents" type="checkbox" defaultChecked className="accent-blue-500" />
              Make this assignment visible to parents
            </label>
            <button disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 md:col-span-2">
              {submitting ? "Saving…" : "Create assignment"}
            </button>
          </Form>
        </section>
      )}

      <section className="space-y-4">
        {assignments.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">No assignments to show.</p>
        ) : assignments.map((assignment) => {
          const ownSubmission = assignment.submissions?.[0];
          const submittedStudentIds = new Set((assignment.submissions ?? []).map((submission) => submission.student_id));
          const classStudents = students.filter((student) => student.class_id === assignment.class_id);

          return (
            <article key={assignment.id} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">{assignment.class_room?.name} · {assignment.subject?.name}</p>
                  <h2 className="mt-1 text-lg font-semibold">{assignment.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">Due {formatDueAt(assignment.due_at)} · {assignment.max_score} points · {assignment.submission_mode} submission</p>
                  {isAdmin && (
                    <p className="mt-1 text-sm text-slate-400">
                      Teacher: {assignment.teacher?.user?.name ?? "Teacher profile unavailable"}
                    </p>
                  )}
                </div>
                <span className="w-fit rounded-full bg-slate-800 px-3 py-1 text-xs capitalize text-slate-300">{assignment.status}</span>
              </div>

              {assignment.description && <p className="whitespace-pre-wrap text-sm text-slate-300">{assignment.description}</p>}
              {assignment.instructions && <div className="rounded-lg bg-slate-950/70 p-3 text-sm text-slate-300"><strong>Instructions:</strong><p className="mt-1 whitespace-pre-wrap">{assignment.instructions}</p></div>}
              {assignment.attachment_name && isAdmin && (
                <p className="text-sm text-slate-400">Attached file: {assignment.attachment_name}</p>
              )}
              {assignment.attachment_name && !isAdmin && (
                <DownloadButton
                  filename={assignment.attachment_name}
                  onDownload={() => api.assignments.downloadAttachment(assignment.id)}
                />
              )}

              {isTeacher ? (
                <div className="space-y-3 border-t border-slate-800 pt-4">
                  <details>
                    <summary className="cursor-pointer text-sm font-semibold text-slate-300">Edit assignment</summary>
                    <Form method="post" encType="multipart/form-data" className="mt-3 grid gap-3 md:grid-cols-2">
                      <input type="hidden" name="intent" value="update" />
                      <input type="hidden" name="assignment_id" value={assignment.id} />
                      <label className="space-y-1 text-sm text-slate-300 md:col-span-2">Title
                        <input name="title" required maxLength={255} defaultValue={assignment.title} className={fieldClass} />
                      </label>
                      <label className="space-y-1 text-sm text-slate-300">Due
                        <input name="due_at" type="datetime-local" required defaultValue={assignment.due_at.replace(" ", "T").slice(0, 16)} className={fieldClass} />
                      </label>
                      <label className="space-y-1 text-sm text-slate-300">Maximum score
                        <input name="max_score" type="number" min="0.01" step="0.01" required defaultValue={assignment.max_score} className={fieldClass} />
                      </label>
                      <label className="space-y-1 text-sm text-slate-300">Submission method
                        <select name="submission_mode" defaultValue={assignment.submission_mode} className={fieldClass}>
                          <option value="both">Online and offline</option><option value="online">Online only</option><option value="offline">Offline only</option>
                        </select>
                      </label>
                      <label className="space-y-1 text-sm text-slate-300">Status
                        <select name="status" defaultValue={assignment.status} className={fieldClass}>
                          <option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option>
                        </select>
                      </label>
                      <label className="space-y-1 text-sm text-slate-300 md:col-span-2">Description
                        <textarea name="description" rows={2} defaultValue={assignment.description ?? ""} className={fieldClass} />
                      </label>
                      <label className="space-y-1 text-sm text-slate-300 md:col-span-2">Instructions
                        <textarea name="instructions" rows={2} defaultValue={assignment.instructions ?? ""} className={fieldClass} />
                      </label>
                      <label className="space-y-1 text-sm text-slate-300 md:col-span-2">Replace attachment
                        <input name="attachment" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png" className={fieldClass} />
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-300 md:col-span-2">
                        <input name="visible_to_parents" type="checkbox" defaultChecked={assignment.visible_to_parents} className="accent-blue-500" />
                        Visible to parents
                      </label>
                      <button disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save changes</button>
                    </Form>
                    <Form method="post" className="mt-2">
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="assignment_id" value={assignment.id} />
                      <button disabled={submitting} className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 disabled:opacity-50">Delete assignment</button>
                    </Form>
                  </details>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Class progress</h3>
                    <p className="mb-2 text-xs text-slate-400">{assignment.submissions_count ?? assignment.submissions?.length ?? 0} submissions recorded</p>
                    {classStudents.length === 0 ? (
                      <p className="text-sm text-slate-400">No active students are currently enrolled in this class.</p>
                    ) : (
                      <div className="space-y-2">
                        {classStudents.map((student) => {
                          const submission = assignment.submissions?.find((item) => item.student_id === student.id);
                          return (
                            <div key={student.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                              <p className="mb-2 text-sm font-medium">{student.full_name} <span className="text-xs text-slate-500">({submission?.status ?? "not submitted"})</span></p>
                              {submission?.response_text && <p className="mb-2 whitespace-pre-wrap text-sm text-slate-400">{submission.response_text}</p>}
                              {submission?.attachment_name && (
                                <DownloadButton
                                  filename={submission.attachment_name}
                                  onDownload={() => api.assignments.downloadSubmission(assignment.id, student.id)}
                                />
                              )}
                              <Form method="post" className="mt-3 grid gap-2 sm:grid-cols-2">
                                <input type="hidden" name="intent" value="record-submission" />
                                <input type="hidden" name="assignment_id" value={assignment.id} />
                                <input type="hidden" name="student_id" value={student.id} />
                                {assignment.submission_mode !== "online" && (
                                  <label className="flex items-center gap-2 text-sm text-slate-300">
                                    <input name="offline_completed" type="checkbox" defaultChecked={submission?.status === "offline_completed" || submission?.status === "graded"} className="accent-blue-500" />
                                    Completed offline
                                  </label>
                                )}
                                <label className="space-y-1 text-sm text-slate-300">Marks
                                  <input name="marks_obtained" type="number" min="0" max={Number(assignment.max_score)} step="0.01" defaultValue={submission?.marks_obtained ?? ""} className={fieldClass} />
                                </label>
                                <label className="space-y-1 text-sm text-slate-300 sm:col-span-2">Feedback
                                  <textarea name="feedback" rows={2} defaultValue={submission?.feedback ?? ""} className={fieldClass} />
                                </label>
                                <button disabled={submitting} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 sm:col-span-2">
                                  {submission ? "Save progress / grade" : "Record offline completion"}
                                </button>
                              </Form>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : isAdmin ? (
                <div className="border-t border-slate-800 pt-4">
                  <h3 className="text-sm font-semibold">Submission progress</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {assignment.submissions_count ?? 0} submissions recorded.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 border-t border-slate-800 pt-4">
                  {ownSubmission ? (
                    <div className="rounded-lg bg-slate-950/70 p-3 text-sm">
                      <p className="font-semibold capitalize text-slate-200">Status: {ownSubmission.status.replaceAll("_", " ")}</p>
                      {ownSubmission.marks_obtained !== null && <p className="mt-1 text-slate-300">Score: {ownSubmission.marks_obtained} / {assignment.max_score}</p>}
                      {ownSubmission.feedback && <p className="mt-1 whitespace-pre-wrap text-slate-400">Feedback: {ownSubmission.feedback}</p>}
                      {ownSubmission.attachment_name && (
                        <div className="mt-2">
                          <DownloadButton
                            filename={ownSubmission.attachment_name}
                            onDownload={() => api.assignments.downloadSubmission(assignment.id, ownSubmission.student_id)}
                          />
                        </div>
                      )}
                    </div>
                  ) : <p className="text-sm text-slate-400">{isStudent ? "Not submitted yet." : "No submission has been recorded for your child."}</p>}

                  {isStudent && assignment.status === "published" && assignment.submission_mode !== "offline" && ownSubmission?.status !== "graded" && (
                    <Form method="post" encType="multipart/form-data" className="space-y-3">
                      <input type="hidden" name="intent" value="submit" />
                      <input type="hidden" name="assignment_id" value={assignment.id} />
                      <label className="block space-y-1 text-sm text-slate-300">Your response
                        <textarea name="response_text" rows={3} defaultValue={ownSubmission?.response_text ?? ""} className={fieldClass} />
                      </label>
                      <label className="block space-y-1 text-sm text-slate-300">Attach your work (optional)
                        <input name="attachment" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png" className={fieldClass} />
                      </label>
                      <button disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                        {ownSubmission ? "Update submission" : "Submit assignment"}
                      </button>
                    </Form>
                  )}
                  {!isStudent && assignment.submissions?.map((submission) => (
                    <div key={submission.id} className="rounded-lg bg-slate-950/70 p-3 text-sm">
                      <p className="font-semibold">{submission.student?.full_name ?? `${submission.student?.first_name ?? ""} ${submission.student?.last_name ?? ""}`}</p>
                      <p className="mt-1 capitalize text-slate-400">{submission.status.replaceAll("_", " ")}</p>
                      {submission.marks_obtained !== null && <p className="text-slate-300">Score: {submission.marks_obtained} / {assignment.max_score}</p>}
                      {submission.feedback && <p className="mt-1 whitespace-pre-wrap text-slate-400">Feedback: {submission.feedback}</p>}
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
