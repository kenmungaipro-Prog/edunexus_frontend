import React, { useState } from "react";
import { useLoaderData, Link } from "react-router";
import { api, type TransportGeofenceEvent } from "~/lib/api";
import TransportSubNav from "./TransportSubNav";

export async function clientLoader() {
  try {
    const [eventsRes] = await Promise.all([api.transport.geofenceEvents()]);
    return { events: eventsRes.data };
  } catch (error) {
    console.error("Failed to load transport notifications:", error);
    return { events: [] };
  }
}

export default function TransportNotificationsPage() {
  const { events } = useLoaderData<typeof clientLoader>();
  const [filter, setFilter] = useState("all");

  const filteredEvents = events.filter((event: TransportGeofenceEvent) => {
    if (filter === "all") return true;
    return event.event_type === filter;
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">🔔 Transport Notifications</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">Review recent stop events, geofence triggers, and dispatch alerts for your transport route.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/transport" className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs sm:text-sm hover:bg-slate-700 transition">← Transport Dashboard</Link>
          <Link to="/transport/analytics" className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs sm:text-sm hover:bg-slate-700 transition">📊 Analytics</Link>
        </div>
      </div>
      <TransportSubNav />

      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Filter by</p>
            <p className="text-lg font-semibold text-white">Event type</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'enter', 'exit'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${filter === value ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                {value === 'all' ? 'All' : value === 'enter' ? 'Arrivals' : 'Departures'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 text-slate-400 text-sm">
              No transport notifications available for the selected filter.
            </div>
          ) : (
            filteredEvents.map((event: TransportGeofenceEvent) => (
              <div key={event.id} className="rounded-3xl border border-slate-700 bg-slate-900/80 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{event.event_type === 'enter' ? 'Arrived at stop' : 'Left stop'}</p>
                    <p className="text-sm text-slate-400 mt-1">Vehicle {event.vehicle_id} on route {event.transport_route_id}</p>
                  </div>
                  <span className="rounded-full bg-slate-700 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-300">{new Date(event.triggered_at).toLocaleString()}</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-950/80 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Coordinates</p>
                    <p className="mt-2 text-sm text-slate-200">{event.lat.toFixed(5)}, {event.lng.toFixed(5)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/80 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Payload</p>
                    <pre className="mt-2 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(event.payload ?? {}, null, 2)}</pre>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
