// ============================================================
// app/pages/classes/[id]/edit.tsx
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import {
  useNavigation,
  useLoaderData,
  useActionData,
  Link,
  Form,
  redirect,
  useRevalidator,
  useRouteError,
  isRouteErrorResponse,
} from "react-router";
import {
  api,
  type ClassRoom,
  type CreateClassPayload,
  type Subject,
  type Teacher,
} from "~/lib/api";

interface LoaderData {
  classData: ClassRoom;
  teachers: Teacher[];
  subjects: Subject[];
}

interface ActionErrorShape {
  error?: string;
  errors?: Record<string, string[]>;
}

export async function clientLoader({
  params,
}: {
  params: Record<string, string>;
}) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    throw new Response("Invalid class id", { status: 400 });
  }

  const [classRes, teachersRes, subjectsRes] = await Promise.all([
    api.classes.get(id),
    api.teachers.list({ per_page: 200 }),
    api.subjects.list(),
  ]);

  const classData = (classRes as any).data as ClassRoom;

  if (!classData) {
    throw new Response("Class not found", { status: 404 });
  }

  const teachers = ((teachersRes as any).data?.data ?? []) as Teacher[];
  const subjects = ((subjectsRes as any).data ?? []) as Subject[];

  return { classData, teachers, subjects } satisfies LoaderData;
}

clientLoader.hydrate = true;

export async function clientAction({
  request,
  params,
}: {
  request: Request;
  params: Record<string, string>;
}) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return { error: "Invalid class id." } satisfies ActionErrorShape;
  }

  const formData = await request.formData();

  const getString = (key: string): string | undefined => {
    const v = formData.get(key);
    return typeof v === "string" ? v.trim() : undefined;
  };

  const clientErrors: Record<string, string[]> = {};

  const name = getString("name");
  if (!name) clientErrors.name = ["Name is required."];

  const gradeStr = getString("grade");
  const gradeNum = gradeStr ? Number(gradeStr) : NaN;
  if (!gradeStr || Number.isNaN(gradeNum) || gradeNum < 1 || gradeNum > 12) {
    clientErrors.grade = ["Grade must be a number between 1 and 12."];
  }

  const section = getString("section");

  const capacityStr = getString("capacity");
  const capacityNum = capacityStr ? Number(capacityStr) : NaN;
  if (!capacityStr || Number.isNaN(capacityNum) || capacityNum < 1) {
    clientErrors.capacity = ["Capacity must be a positive number."];
  }

  if (Object.keys(clientErrors).length > 0) {
    return {
      error: "Please fix the errors below.",
      errors: clientErrors,
    } satisfies ActionErrorShape;
  }

  const payload: Partial<CreateClassPayload> = {
    name: name!,
    grade: gradeNum as any,
    section: section!,
    capacity: capacityNum as any,
  };

  const classTeacherIdStr = getString("class_teacher_id");
  if (classTeacherIdStr !== undefined) {
    payload.class_teacher_id =
      classTeacherIdStr === "" ? null : (Number(classTeacherIdStr) as any);
  }

  const room = getString("room");
  if (room !== undefined) {
    payload.room = room === "" ? undefined : room;
  }

  const subjectsRaw = formData.getAll("subjects");
  const subjects = subjectsRaw
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  payload.subjects = subjects as any;

  try {
    const res = await api.classes.update(id, payload);
    const updated = (res as any).data as ClassRoom;
    return redirect(`/classes/${updated.id}`);
  } catch (err: unknown) {
    const e = err as any;
    const message: string =
      e?.response?.data?.message ??
      e?.message ??
      "Failed to update class. Please try again.";
    const errors: Record<string, string[]> =
      e?.response?.data?.errors ?? e?.errors ?? {};
    return { error: message, errors } satisfies ActionErrorShape;
  }
}

export function ErrorBoundary() {
  const error = useRouteError();
  const revalidator = useRevalidator();

  let heading = "Something went wrong";
  let body = "An unexpected error occurred while loading the page.";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      heading = "Class not found";
      body = "The class you're looking for doesn't exist or has been deleted.";
    } else if (error.status === 400) {
      heading = "Invalid request";
      body = error.data ?? "The request was malformed.";
    } else {
      heading = `Error ${error.status}`;
      body = error.data ?? error.statusText;
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-20 px-4 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4 shadow-lg shadow-red-500/5">
        <svg
          className="w-8 h-8 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-slate-100 mb-2">{heading}</h1>
      <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">{body}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {isRouteErrorResponse(error) && error.status >= 500 && (
          <button
            onClick={() => revalidator.revalidate()}
            className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-all font-medium"
          >
            Try again
          </button>
        )}
        <Link
          to="/classes"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm text-white hover:bg-blue-500 transition-all font-medium shadow-lg shadow-blue-600/20"
        >
          Back to classes
        </Link>
      </div>
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-800/80 ${className}`}
      aria-hidden
    />
  );
}

function FormSkeleton() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6" aria-label="Loading class data">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-4 w-24 self-start sm:self-auto" />
      </div>

      <div className="space-y-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}

function FieldError({
  id,
  messages,
}: {
  id?: string;
  messages?: string[];
}) {
  if (!messages || messages.length === 0) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1.5" role="alert">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      {messages[0]}
    </p>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner";

const labelClass = "block text-xs font-semibold uppercase tracking-wider text-slate-400";

function SubjectsCheckboxList({
  subjects,
  selectedIds,
  error,
  disabled,
}: {
  subjects: Subject[];
  selectedIds: Set<string>;
  error?: string[];
  disabled?: boolean;
}) {
  const hasError = error && error.length > 0;
  const selectedSubjects = subjects.filter((subject) => selectedIds.has(String(subject.id)));

  return (
    <fieldset
      aria-invalid={hasError ? "true" : "false"}
      aria-describedby={hasError ? "error-subjects" : undefined}
      className="space-y-2"
    >
      <legend className={labelClass}>Assigned Subjects</legend>
      {selectedSubjects.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedSubjects.map((subject) => (
            <span
              key={subject.id}
              className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 border border-slate-700 px-3 py-1 text-xs font-medium text-slate-200"
            >
              {subject.name}
            </span>
          ))}
        </div>
      )}
      <div
        className={`rounded-3xl border bg-slate-950/60 p-4 shadow-inner scrollbar-thin scrollbar-thumb-slate-700 ${
          hasError ? "border-red-500/60" : "border-slate-700/80"
        } ${disabled ? "opacity-50" : ""}`}
      >
        {subjects.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No subjects available in the system
          </p>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200">
                  Pick subjects for this class
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Toggle the subjects below to assign them to this class.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-300">
                  {selectedSubjects.length} selected
                </span>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="list">
                {subjects.map((subject) => (
                  <li key={subject.id}>
                    <label
                      htmlFor={`subject-${subject.id}`}
                      className="flex items-center gap-3 rounded-3xl border border-slate-800/90 bg-slate-900/60 p-3 cursor-pointer hover:border-slate-700/80 hover:bg-slate-800/70 transition-all"
                    >
                      <input
                        id={`subject-${subject.id}`}
                        type="checkbox"
                        name="subjects"
                        value={String(subject.id)}
                        defaultChecked={selectedIds.has(String(subject.id))}
                        disabled={disabled}
                        className="h-3.5 w-3.5 rounded-sm border border-slate-400 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer flex-shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">
                              {subject.name ?? subject.code ?? `Subject #${subject.id}`}
                            </p>
                            {(subject.code || subject.type) && (
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {subject.code}
                                {subject.code && subject.type ? " • " : ""}
                                {subject.type}
                              </p>
                            )}
                          </div>
                          {subject.exams_count ? (
                            <span className="text-xs text-slate-400 whitespace-nowrap">
                              {subject.exams_count} exams
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
      <FieldError id="error-subjects" messages={error} />
    </fieldset>
  );
}

export default function EditClassPage() {
  const loaderData = useLoaderData() as LoaderData | undefined;
  const actionData = useActionData() as ActionErrorShape | undefined;
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  const errorBannerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (actionData?.error) {
      errorBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [actionData?.error]);

  if (!loaderData?.classData) {
    return <FormSkeleton />;
  }

  const { classData, teachers, subjects } = loaderData;
  const errors = actionData?.errors ?? {};
  const errorMessage = actionData?.error;

  const selectedSubjectIds = new Set<string>(
    ((classData as any).subjects ?? []).map((s: { id: number | string }) => String(s.id)) ?? []
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Edit Class Room</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Updating settings and parameters for{" "}
            <span className="text-slate-200 font-semibold bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700/60">
              {classData.name}
            </span>
          </p>
        </div>
        <Link
          to={`/classes/${classData.id}`}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs sm:text-sm font-medium transition-all shadow-sm self-start sm:self-auto"
        >
          <svg
            className="w-4 h-4 flex-shrink-0 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          Back to class
        </Link>
      </div>

      {/* ── Error banner ── */}
      {errorMessage && (
        <div
          ref={errorBannerRef}
          className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-200 flex items-start gap-3 shadow-lg shadow-red-500/5 animate-shake"
          role="alert"
          aria-live="polite"
        >
          <svg
            className="w-5 h-5 mt-0.5 shrink-0 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
          <div className="flex-1">
            <span className="font-semibold block text-red-100">Action Failed</span>
            <span className="text-xs text-red-300/90">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* ── Form ── */}
      <Form
        method="post"
        replace
        className="space-y-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl"
      >
        {/* Row 1: Name + Grade */}
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="name">
              Class Name <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              defaultValue={classData.name ?? ""}
              required
              disabled={submitting}
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={errors.name ? "error-name" : undefined}
              className={`${inputClass} ${errors.name ? "border-red-500/60" : ""}`}
            />
            <FieldError id="error-name" messages={errors.name} />
          </div>

          <div>
            <label className={labelClass} htmlFor="grade">
              Grade Level <span className="text-red-400">*</span>
            </label>
            <input
              id="grade"
              name="grade"
              type="number"
              defaultValue={String(classData.grade ?? "")}
              required
              min={1}
              max={12}
              disabled={submitting}
              aria-invalid={errors.grade ? "true" : "false"}
              aria-describedby={errors.grade ? "error-grade" : undefined}
              className={`${inputClass} ${errors.grade ? "border-red-500/60" : ""}`}
            />
            <FieldError id="error-grade" messages={errors.grade} />
          </div>

          {/* Row 2: Section + Capacity */}
          <div>
            <label className={labelClass} htmlFor="section">
              Section
            </label>
            <input
              id="section"
              name="section"
              defaultValue={classData.section ?? ""}
              disabled={submitting}
              aria-invalid={errors.section ? "true" : "false"}
              aria-describedby={errors.section ? "error-section" : undefined}
              className={`${inputClass} ${errors.section ? "border-red-500/60" : ""}`}
            />
            <FieldError id="error-section" messages={errors.section} />
          </div>

          <div>
            <label className={labelClass} htmlFor="capacity">
              Maximum Capacity <span className="text-red-400">*</span>
            </label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              defaultValue={String(classData.capacity ?? "")}
              required
              min={1}
              disabled={submitting}
              aria-invalid={errors.capacity ? "true" : "false"}
              aria-describedby={errors.capacity ? "error-capacity" : undefined}
              className={`${inputClass} ${errors.capacity ? "border-red-500/60" : ""}`}
            />
            <FieldError id="error-capacity" messages={errors.capacity} />
          </div>
        </div>

        {/* Row 3: Teacher + Room */}
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="class_teacher_id">
              Class Teacher
            </label>
            <select
              id="class_teacher_id"
              name="class_teacher_id"
              defaultValue={
                classData.class_teacher_id
                  ? String(classData.class_teacher_id)
                  : ""
              }
              disabled={submitting}
              aria-invalid={errors.class_teacher_id ? "true" : "false"}
              aria-describedby={
                errors.class_teacher_id
                  ? "error-class_teacher_id"
                  : undefined
              }
              className={`${inputClass} ${
                errors.class_teacher_id ? "border-red-500/60" : ""
              }`}
            >
              <option value="">No teacher assigned</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={String(teacher.id)}>
                  {teacher.user?.name ?? `Teacher #${teacher.id}`}
                </option>
              ))}
            </select>
            <FieldError
              id="error-class_teacher_id"
              messages={errors.class_teacher_id}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="room">
              Room Location
            </label>
            <input
              id="room"
              name="room"
              defaultValue={classData.room ?? ""}
              disabled={submitting}
              placeholder="e.g. Building B, Room 204"
              aria-invalid={errors.room ? "true" : "false"}
              aria-describedby={errors.room ? "error-room" : undefined}
              className={`${inputClass} ${errors.room ? "border-red-500/60" : ""}`}
            />
            <FieldError id="error-room" messages={errors.room} />
          </div>
        </div>

        {/* Subjects */}
        <SubjectsCheckboxList
          subjects={subjects}
          selectedIds={selectedSubjectIds}
          error={errors.subjects}
          disabled={submitting}
        />

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-4 border-t border-slate-800">
          <Link
            to={`/classes/${classData.id}`}
            className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-800/50 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Saving Changes…
              </>
            ) : (
              "Save Class Updates"
            )}
          </button>
        </div>

        <p className="text-xs text-slate-500 text-center pt-1">
          Fields marked with <span className="text-red-400">*</span> are mandatory parameters.
        </p>
      </Form>
    </div>
  );
}