// ============================================================
// app/pages/events/index.tsx
// ============================================================
import { Form, useNavigation, Link } from "react-router";
import type { Route as EventsRoute } from "./+types/index";
import { apiService, type SchoolEvent } from "~/lib/api";

export async function clientLoader() {
  try {
    const response = await apiService.events.list({ per_page: 50 });
    return { events: response.data.data };
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return { events: [] };
  }
}

export async function ClientAction({ request }: EventsRoute.ActionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");
  const id = form.get("id");

  if (intent === "delete" && id) {
    await apiService.events.delete(Number(id));
  }
  return null;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  event:       { icon: "🎉", color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
  exam:        { icon: "📝", color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20" },
  holiday:     { icon: "🌴", color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
  meeting:     { icon: "🤝", color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20" },
  competition: { icon: "🏆", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
};

export default function EventsPage({ loaderData }: EventsRoute.ComponentProps) {
  const { events } = loaderData as { events: SchoolEvent[] };
  const navigation = useNavigation();

  const formatDates = (start: string, end?: string | null) => {
    const s = new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (end && end !== start) {
      const e = new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return `${s} - ${e}`;
    }
    return new Date(start).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">School Events</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Manage and view upcoming academic activities</p>
        </div>
        <Link 
          to="/events/new" 
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20 text-sm w-full sm:w-auto"
        >
          <span className="text-lg">＋</span> Create New Event
        </Link>
      </div>

      {/* Content Grid */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-3xl p-6 text-center">
          <div className="text-4xl sm:text-5xl mb-4 text-slate-700">📅</div>
          <p className="text-slate-500 text-base sm:text-lg">No events found in the database.</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 transition-opacity ${navigation.state !== 'idle' ? 'opacity-50' : 'opacity-100'}`}>
          {events.map((event) => {
            const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.event;
            
            return (
              <div 
                key={event.id} 
                className={`group relative flex flex-col bg-slate-900/50 border ${config.border} rounded-2xl p-4 sm:p-6 hover:shadow-2xl hover:shadow-black/40 transition-all duration-300`}
              >
                {/* Type Badge */}
                <div className="flex justify-between items-start mb-4 sm:mb-6 pr-8 sm:pr-0">
                  <div className={`p-2.5 sm:p-3 rounded-xl bg-slate-800 border border-white/5 text-xl sm:text-2xl shadow-inner`}>
                    {config.icon}
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full ${config.bg} ${config.color}`}>
                    {event.type}
                  </span>
                </div>

                {/* Title & Description */}
                <div className="flex-grow">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 leading-tight group-hover:text-indigo-300 transition-colors break-words">
                    {event.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm line-clamp-3 mb-4 leading-relaxed break-words">
                    {event.description || "No additional details provided for this event."}
                  </p>
                </div>

                {/* Metadata Footer */}
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 sm:space-y-3">
                  <div className="flex items-center text-xs text-slate-300 font-medium truncate">
                    <svg className="w-4 h-4 mr-2 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">{formatDates(event.event_date, event.end_date)}</span>
                  </div>

                  {event.venue && (
                    <div className="flex items-center text-xs text-slate-400 truncate">
                      <svg className="w-4 h-4 mr-2 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{event.venue}</span>
                    </div>
                  )}
                </div>

                {/* View Event Button Link */}
                <Link to={`/events/${event.id}`} className="absolute top-4 right-4 text-blue-400 hover:text-blue-300 transition-colors p-2" title="View Event">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}