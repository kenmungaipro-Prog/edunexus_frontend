import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import type { SchoolEvent } from "~/lib/api";
import { api } from "~/lib/api";

interface LoaderData {
  event: SchoolEvent;
}

export async function clientLoader({ params }: { params: Record<string, string> }) {
  const event = await api.events.get(Number(params.id));
  return { event: event.data };
}

export async function clientAction({ request, params }: { request: Request; params: Record<string, string> }) {
  if (request.method !== "POST") {
    return null;
  }

  const formData = await request.formData();
  const payload = {
    title: String(formData.get("title")),
    description: formData.get("description") ? String(formData.get("description")) : null,
    event_date: String(formData.get("event_date")),
    end_date: formData.get("end_date") ? String(formData.get("end_date")) : null,
    type: String(formData.get("type")) as SchoolEvent["type"],
    venue: formData.get("venue") ? String(formData.get("venue")) : null,
    notify_all: formData.get("notify_all") === "on",
  };

  try {
    await api.events.update(Number(params.id), payload);
    return redirect(`/events/${params.id}`);
  } catch (error: any) {
    return { error: error.response?.data?.message || "Failed to update event." };
  }
}

export default function EditEventPage({ loaderData }: { loaderData: LoaderData }) {
  const { event } = loaderData;
  const actionData = useActionData() as { error?: string } | null;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to={`/events/${event.id}`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs sm:text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Event Details
        </Link>
      </div>

      {/* Page Title & Subtitle */}
      <div className="border-b border-slate-700/60 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Edit Event</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Update the event details and adjust notification preferences.
        </p>
      </div>

      {/* Action Error Notification */}
      {actionData?.error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {actionData.error}
        </div>
      )}

      {/* Form Card */}
      <Form
        method="post"
        className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 sm:p-8 backdrop-blur-sm space-y-8 shadow-xl"
      >
        {/* Section 1: General Information */}
        <div className="space-y-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-700/60 pb-2">
            General Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-slate-200 mb-2">
                Event Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                defaultValue={event.title}
                required
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="e.g., Year-End Celebration, Staff Training"
              />
            </div>

            {/* Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-slate-200 mb-2">
                Event Type <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  id="type"
                  name="type"
                  defaultValue={event.type}
                  required
                  className="w-full appearance-none bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                >
                  <option value="event">🎉 Event</option>
                  <option value="exam">📝 Exam</option>
                  <option value="holiday">🌴 Holiday</option>
                  <option value="meeting">🤝 Meeting</option>
                  <option value="competition">🏆 Competition</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-200 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={event.description ?? ""}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-y"
              placeholder="Provide event overview, instructions, or agenda..."
            />
          </div>
        </div>

        {/* Section 2: Date & Location */}
        <div className="space-y-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-700/60 pb-2">
            Schedule & Location
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Start Date */}
            <div>
              <label htmlFor="event_date" className="block text-sm font-medium text-slate-200 mb-2">
                Start Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                id="event_date"
                name="event_date"
                defaultValue={event.event_date}
                required
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-slate-200 mb-2">
                End Date <span className="text-slate-500 text-xs font-normal">(Optional)</span>
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                defaultValue={event.end_date ?? ""}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          {/* Venue */}
          <div>
            <label htmlFor="venue" className="block text-sm font-medium text-slate-200 mb-2">
              Venue / Location
            </label>
            <div className="relative">
              <input
                type="text"
                id="venue"
                name="venue"
                defaultValue={event.venue ?? ""}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="e.g., Main Hall, Gymnasium, Auditorium"
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Notification Settings */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Preferences & Notifications
            </h2>
            <span className="hidden sm:inline-block text-[11px] text-slate-500 font-medium">
              Optional settings
            </span>
          </div>

          {/* Optimized Preference Box for Medium & Large Screens */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <label 
              htmlFor="notify_all"
              className="md:col-span-12 group relative flex items-start justify-between gap-4 p-4 sm:p-5 bg-slate-900/40 hover:bg-slate-900/70 border border-slate-700/50 hover:border-slate-600 rounded-2xl cursor-pointer transition-all duration-200"
            >
              <div className="flex items-start gap-3.5">
                {/* Icon Container */}
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>

                {/* Text Details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-semibold text-slate-200 group-hover:text-white transition-colors">
                      Broadcast Email Notification
                    </span>
                    <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                      Immediate dispatch
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
                    Automatically send an updated event invitation and summary email to all registered parents, teachers, and staff members.
                  </p>
                </div>
              </div>

              {/* Styled Toggle Switch UI */}
              <div className="relative inline-flex items-center shrink-0 mt-1 sm:mt-0">
                <input
                  type="checkbox"
                  id="notify_all"
                  name="notify_all"
                  defaultChecked={event.notify_all}
                  className="sr-only peer"
                />
                {/* Switch Track */}
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 transition-colors"></div>
              </div>
            </label>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-700/60">
          <Link
            to={`/events/${event.id}`}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-700/70 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition text-sm text-center border border-slate-600/30"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition text-sm text-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </Form>
    </div>
  );
}