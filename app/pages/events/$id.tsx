// ============================================================
// app/pages/events/$id.tsx
// ============================================================

import { Link, Form, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/$id";
import { api } from "~/lib/api";

export async function clientLoader({ params }: Route.LoaderArgs) {
  try {
    const event = await api.events.get(Number(params.id));
    return event.data;
  } catch (error) {
    console.error("Failed to load event:", error);
    throw new Error("Event not found");
  }
}

export async function clientAction({ request, params }: Route.ActionArgs) {
  if (request.method === "DELETE") {
    try {
      await api.events.delete(Number(params.id));
      return redirect("/events");
    } catch (error) {
      console.error("Failed to delete event:", error);
      return { error: "Failed to delete event" };
    }
  }
  return null;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  event: { icon: "🎉", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  exam: { icon: "📝", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  holiday: { icon: "🌴", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  meeting: { icon: "🤝", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  competition: { icon: "🏆", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
};

export default function EventDetailPage({ loaderData, actionData }: Route.ComponentProps) {
  const event = loaderData;
  const error = actionData?.error;
  const navigation = useNavigation();
  const isDeleting = navigation.state === "submitting" && navigation.formData?.get("_method") === "DELETE";

  const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.event;
  const isUpcoming = new Date(event.event_date) > new Date();

  const handleDelete = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      e.preventDefault();
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link 
          to="/events" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs sm:text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Events
        </Link>
      </div>

      {/* Action Error Banner */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Hero Banner Card */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              {/* Type Badge */}
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${config.bg} text-2xl border ${config.border}`}>
                  {config.icon}
                </div>
                <span className={`text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-full ${config.bg} ${config.color} border ${config.border}`}>
                  {event.type}
                </span>
              </div>

              {/* Status Pill */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                isUpcoming 
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                  : "bg-slate-700/50 text-slate-400 border-slate-600/30"
              }`}>
                <span className={`w-2 h-2 rounded-full ${isUpcoming ? "bg-blue-400 animate-pulse" : "bg-slate-400"}`} />
                {isUpcoming ? "Upcoming Event" : "Completed"}
              </div>
            </div>

            {/* Event Title */}
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight break-words leading-tight">
              {event.title}
            </h1>
          </div>

          {/* Details Overview Card */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-base sm:text-lg font-semibold text-slate-200 border-b border-slate-700/60 pb-4">
              Event Details
            </h2>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Start Date */}
              <div className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Start Date
                </div>
                <p className="text-white text-base sm:text-lg font-medium">
                  {formatDate(event.event_date)}
                </p>
              </div>

              {/* End Date */}
              {event.end_date && event.end_date !== event.event_date ? (
                <div className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    End Date
                  </div>
                  <p className="text-white text-base sm:text-lg font-medium">
                    {formatDate(event.end_date)}
                  </p>
                </div>
              ) : (
                <div className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Duration
                  </div>
                  <p className="text-white text-base sm:text-lg font-medium">Single-day event</p>
                </div>
              )}

              {/* Venue */}
              {event.venue && (
                <div className="sm:col-span-2 bg-slate-900/50 border border-slate-700/50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Venue Location
                  </div>
                  <p className="text-white text-base sm:text-lg font-medium break-words">
                    {event.venue}
                  </p>
                </div>
              )}
            </div>

            {/* Description Section */}
            {event.description && (
              <div className="pt-2">
                <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
                  Description
                </div>
                <div className="bg-slate-900/30 border border-slate-700/40 p-4 sm:p-5 rounded-xl">
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                    {event.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Management
            </h3>

            <div className="space-y-2.5">
              <Link 
                to={`/events/${event.id}/edit`} 
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-medium transition-all duration-200 border border-slate-600/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Event
              </Link>

              <button 
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all duration-200 border border-slate-600/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                View Attendees
              </button>

              <button 
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all duration-200 border border-slate-600/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Send Notification
              </button>

              <div className="pt-2 border-t border-slate-700/60">
                <Form method="delete" onSubmit={handleDelete}>
                  <input type="hidden" name="_method" value="DELETE" />
                  <button
                    type="submit"
                    disabled={isDeleting}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-sm font-medium transition-all duration-200 border border-red-500/20 hover:border-red-500 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {isDeleting ? "Deleting..." : "Delete Event"}
                  </button>
                </Form>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}