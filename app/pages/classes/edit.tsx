import React, { useEffect, useRef } from "react";
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
import api, {
  type ClassRoom,
  type CreateClassPayload,
  type Subject,
  type Teacher,
} from "~/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoaderData {
  classData: ClassRoom;
  teachers: Teacher[];
  subjects: Subject[];
}

interface ActionErrorShape {
  error?: string;
  errors?: Record<string, string[]>;
}

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function clientLoader({
  params,
}: {
  params: Record<string, string>;
}) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    throw new Response("Invalid class id", { status: 400 });
  }

  // Fire all three requests in parallel to minimise waterfall latency.
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

// Tell React Router to always re-run this loader when the page is revisited,
// even if the URL hasn't changed (important after a failed update).
clientLoader.hydrate = true;

// ─── Action ───────────────────────────────────────────────────────────────────

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

  // Validate required fields before hitting the network.
  const clientErrors: Record<string, string[]> = {};

  const name = getString("name");
  if (!name) clientErrors.name = ["Name is required."];

  const gradeStr = getString("grade");
  const gradeNum = gradeStr ? Number(gradeStr) : NaN;
  if (!gradeStr || Number.isNaN(gradeNum) || gradeNum < 1 || gradeNum > 12) {
    clientErrors.grade = ["Grade must be a number between 1 and 12."];
  }

  const section = getString("section");
  if (!section) clientErrors.section = ["Section is required."];

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

  // Build the partial payload (only include keys the user may have changed).
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
    payload.room = room === "" ? null : room;
  }

  const subjectsRaw = formData.getAll("subjects");
  const subjects = subjectsRaw
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  // Always send subjects so an empty selection clears them.
  payload.subjects = subjects as any;

  try {
    const res = await api.classes.update(id, payload);
    const updated = (res as any).data as ClassRoom;
    return redirect(`/classes/${updated.id}`);
  } catch (err: unknown) {
    const e = err as any;
    // Normalise error shapes from axios / fetch / custom API clients.
    const message: string =
      e?.response?.data?.message ??
      e?.message ??
      "Failed to update class. Please try again.";
    const errors: Record<string, string[]> =
      e?.response?.data?.errors ?? e?.errors ?? {};
    return { error: message, errors } satisfies ActionErrorShape;
  }
}

// ─── Error Boundary ───────────────────────────────────────────────────────────

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
    <div className="max-w-3xl mx-auto py-16 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-900/20 mb-4">
        <svg
          className="w-7 h-7 text-red-400"
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
      <h1 className="text-xl font-semibold text-slate-100 mb-2">{heading}</h1>
      <p className="text-sm text-slate-400 mb-6">{body}</p>
      <div className="flex gap-3 justify-center">
        {isRouteErrorResponse(error) && error.status >= 500 && (
          <button
            onClick={() => revalidator.revalidate()}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Try again
          </button>
        )}
        <Link
          to="/classes"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 transition-colors"
        >
          Back to classes
        </Link>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-800/60 ${className}`}
      aria-hidden
    />
  );
}

function FormSkeleton() {
  return (
    <div className="max-w-3xl mx-auto py-8" aria-label="Loading class data">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-36 w-full" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function FieldError({
  id,
  messages,
}: {
  id?: string;
  messages?: string[];
}) {
  if (!messages || messages.length === 0) return null;
  return (
    <p id={id} className="mt-1 text-xs text-red-400" role="alert">
      {messages[0]}
    </p>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const labelClass = "block text-sm text-slate-300";

// ─── Subjects multi-select with checkboxes ────────────────────────────────────
//
// A native <select multiple> is notoriously hard to use on touch devices.
// This replaces it with a styled list of checkboxes that degrades gracefully.

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

  return (
    <fieldset
      aria-invalid={hasError ? "true" : "false"}
      aria-describedby={hasError ? "error-subjects" : undefined}
    >
      <legend className={labelClass}>Subjects</legend>
      <div
        className={`mt-2 rounded-xl border bg-slate-950 p-3 max-h-48 overflow-y-auto ${
          hasError ? "border-red-500/60" : "border-slate-700"
        } ${disabled ? "opacity-50" : ""}`}
      >
        {subjects.length === 0 ? (
          <p className="text-xs text-slate-500 py-2 text-center">
            No subjects available
          </p>
        ) : (
          <ul className="space-y-1" role="list">
            {subjects.map((subject) => (
              <li key={subject.id}>
                <label className="flex items-center gap-2.5 cursor-pointer group px-1 py-1 rounded-lg hover:bg-slate-800/60 transition-colors">
                  <input
                    type="checkbox"
                    name="subjects"
                    value={String(subject.id)}
                    defaultChecked={selectedIds.has(String(subject.id))}
                    disabled={disabled}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">
                    {subject.name}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
      <FieldError id="error-subjects" messages={error} />
    </fieldset>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EditClassPage() {
  const loaderData = useLoaderData() as LoaderData | undefined;
  const actionData = useActionData() as ActionErrorShape | undefined;
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  // Scroll to top of form on server/action error so the user sees the banner.
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
    classData.subjects?.map((s: { id: number | string }) => String(s.id)) ?? []
  );

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Edit Class</h1>
          <p className="text-sm text-slate-400">
            Update academic group details for{" "}
            <span className="text-slate-300 font-medium">{classData.name}</span>
            .
          </p>
        </div>
        <Link
          to={`/classes/${classData.id}`}
          className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 hover:underline text-sm transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
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
          className="mb-4 rounded-xl bg-red-900/20 border border-red-500/30 p-4 text-sm text-red-200 flex gap-3"
          role="alert"
          aria-live="polite"
        >
          <svg
            className="w-4 h-4 mt-0.5 shrink-0 text-red-400"
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
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── Form ── */}
      <Form
        method="post"
        replace
        className="space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-6"
      >
        {/* Row 1: Name + Grade */}
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass} htmlFor="name">
            Name <span className="text-red-400" aria-hidden>*</span>
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
          </label>

          <label className={labelClass} htmlFor="grade">
            Grade <span className="text-red-400" aria-hidden>*</span>
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
          </label>

          {/* Row 2: Section + Capacity */}
          <label className={labelClass} htmlFor="section">
            Section <span className="text-red-400" aria-hidden>*</span>
            <input
              id="section"
              name="section"
              defaultValue={classData.section ?? ""}
              required
              disabled={submitting}
              aria-invalid={errors.section ? "true" : "false"}
              aria-describedby={errors.section ? "error-section" : undefined}
              className={`${inputClass} ${errors.section ? "border-red-500/60" : ""}`}
            />
            <FieldError id="error-section" messages={errors.section} />
          </label>

          <label className={labelClass} htmlFor="capacity">
            Capacity <span className="text-red-400" aria-hidden>*</span>
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
          </label>
        </div>

        {/* Row 3: Teacher + Room */}
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass} htmlFor="class_teacher_id">
            Class Teacher
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
          </label>

          <label className={labelClass} htmlFor="room">
            Room
            <input
              id="room"
              name="room"
              defaultValue={classData.room ?? ""}
              disabled={submitting}
              placeholder="e.g. B-204"
              aria-invalid={errors.room ? "true" : "false"}
              aria-describedby={errors.room ? "error-room" : undefined}
              className={`${inputClass} ${errors.room ? "border-red-500/60" : ""}`}
            />
            <FieldError id="error-room" messages={errors.room} />
          </label>
        </div>

        {/* Subjects */}
        <SubjectsCheckboxList
          subjects={subjects}
          selectedIds={selectedSubjectIds}
          error={errors.subjects}
          disabled={submitting}
        />

        {/* Footer */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
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
                Saving…
              </>
            ) : (
              "Update Class"
            )}
          </button>

          <Link
            to={`/classes/${classData.id}`}
            className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            Cancel
          </Link>
        </div>

        <p className="text-xs text-slate-500 text-center -mt-2">
          Fields marked <span className="text-red-400">*</span> are required
        </p>
      </Form>
    </div>
  );
}