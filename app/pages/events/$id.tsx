import { Link, Form, redirect } from "react-router";
import type { Route } from "./+types/\$id";
import api from "~/lib/api";

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

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  event: { icon: "🎉", color: "text-blue-400", bg: "bg-blue-500/10" },
  exam: { icon: "📝", color: "text-red-400", bg: "bg-red-500/10" },
  holiday: { icon: "🌴", color: "text-amber-400", bg: "bg-amber-500/10" },
  meeting: { icon: "🤝", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  competition: { icon: "🏆", color: "text-purple-400", bg: "bg-purple-500/10" },
};

export default function EventDetailPage({ loaderData, actionData }: Route.ComponentProps) {
  const event = loaderData;
  const error = actionData?.error;
  const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.event;

  const handleDelete = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      e.preventDefault();
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link to="/events" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
          ← Back to Events
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 mb-6">
            {/* Event Type Badge */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-lg ${config.bg} text-2xl`}>{config.icon}</div>
              <span className={`text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full ${config.bg} ${config.color}`}>
                {event.type}
              </span>
            </div>

            {/* Event Title */}
            <h1 className="text-3xl font-bold text-white mb-6">{event.title}</h1>

            {/* Event Details Grid */}
            <div className="space-y-6 mb-8">
              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Start Date
                  </label>
                  <p className="text-white text-lg mt-2 font-semibold">{formatDate(event.event_date)}</p>
                </div>

                {event.end_date && event.end_date !== event.event_date && (
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider font-medium flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      End Date
                    </label>
                    <p className="text-white text-lg mt-2 font-semibold">{formatDate(event.end_date)}</p>
                  </div>
                )}
              </div>

              {/* Venue */}
              {event.venue && (
                <div className="border-t border-slate-700 pt-6">
                  <label className="text-xs text-slate-500 uppercase tracking-wider font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                    </svg>
                    Venue
                  </label>
                  <p className="text-white text-lg mt-2 font-semibold">{event.venue}</p>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div className="border-t border-slate-700 pt-6">
                  <label className="text-xs text-slate-500 uppercase tracking-wider font-medium">Description</label>
                  <p className="text-slate-300 text-lg mt-3 leading-relaxed">{event.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Event Status Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Event Status</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Event Status</p>
                <p className="text-white text-lg font-bold mt-1">
                  {new Date(event.event_date) > new Date() ? "Upcoming" : "Completed"}
                </p>
              </div>
              <div className={`text-4xl ${new Date(event.event_date) > new Date() ? "text-blue-400" : "text-slate-400"}`}>
                {new Date(event.event_date) > new Date() ? "📅" : "✓"}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Actions</h3>

            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition">
                Edit Event
              </button>
              <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition">
                View Attendees
              </button>
              <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition">
                Send Notification
              </button>

              <Form method="delete" onSubmit={handleDelete} className="w-full">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-sm font-medium transition border border-red-500/20 hover:border-red-500"
                >
                  Delete Event
                </button>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
