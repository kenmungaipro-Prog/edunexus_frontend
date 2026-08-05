import React from "react";
import { Link, useLoaderData } from "react-router";
import { api, type TransportAnalyticsOverview, type TransportDriverRankingEntry, type TransportHeatMapResponse, type TransportPrediction } from "~/lib/api";
import TransportSubNav from "./TransportSubNav";

export async function clientLoader() {
  try {
    const [overviewRes, rankingRes, heatMapRes, predictionRes] = await Promise.all([
      api.transport.analytics.overview(),
      api.transport.analytics.driverRanking(),
      api.transport.analytics.heatMap(),
      api.transport.analytics.prediction(),
    ]);

    return {
      overview: overviewRes.data,
      ranking: rankingRes.data,
      heatMap: heatMapRes.data,
      prediction: predictionRes.data,
      date: new Date().toISOString().slice(0, 10),
    };
  } catch (error: any) {
    console.error("Transport analytics loader failed:", error);
    return {
      overview: null,
      ranking: [],
      heatMap: null,
      prediction: null,
      error: error.response?.message || "Unable to load transport analytics.",
      date: new Date().toISOString().slice(0, 10),
    };
  }
}

export default function TransportAnalyticsPage() {
  const { overview, ranking, heatMap, prediction, error, date } = useLoaderData<typeof clientLoader>();

  const routeSummary = overview ? (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Efficiency</p>
        <p className="text-3xl font-bold text-emerald-400 mt-3">{overview.efficiency_score}%</p>
        <p className="text-sm text-slate-400 mt-2">Route performance score for today</p>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Completion</p>
        <p className="text-3xl font-bold text-sky-400 mt-3">{overview.completed_stops} / {overview.stop_count}</p>
        <p className="text-sm text-slate-400 mt-2">Stops completed by route</p>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Average speed</p>
        <p className="text-3xl font-bold text-amber-400 mt-3">{overview.metrics.average_speed} km/h</p>
        <p className="text-sm text-slate-400 mt-2">Based on today's telemetry</p>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Telemetries</p>
        <p className="text-3xl font-bold text-violet-400 mt-3">{overview.metrics.telemetry_points}</p>
        <p className="text-sm text-slate-400 mt-2">Recorded GPS points</p>
      </div>
    </div>
  ) : null;

  const predictionCard = prediction ? (
    <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-lg shadow-slate-900/30">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Delay prediction</p>
          <h2 className="text-2xl font-bold text-white mt-2">{prediction.predicted_delay_minutes} min</h2>
          <p className="text-sm text-slate-400 mt-1">{prediction.status} • {prediction.confidence}% confidence</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 px-4 py-3 text-sm text-slate-200">
          <div className="font-semibold text-slate-100">Route</div>
          <div className="mt-2">{prediction.route_name}</div>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-900/80 p-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Avg speed</p>
          <p className="mt-2 text-lg font-semibold text-emerald-300">{prediction.basis.average_speed} km/h</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 p-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Idle minutes</p>
          <p className="mt-2 text-lg font-semibold text-amber-300">{prediction.basis.idle_minutes}</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 p-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Stop delay</p>
          <p className="mt-2 text-lg font-semibold text-slate-100">{prediction.basis.stop_delay} min</p>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">📊 Transport Analytics</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">Performance, route efficiency, and delay predictions for the active school transport route.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/transport" className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs sm:text-sm hover:bg-slate-700 transition">← Transport Dashboard</Link>
          <Link to="/transport/playback" className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs sm:text-sm hover:bg-slate-700 transition">▶ Playback</Link>
          <Link to="/transport/notifications" className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs sm:text-sm hover:bg-slate-700 transition">🔔 Notifications</Link>
        </div>
      </div>
      <TransportSubNav />

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          {routeSummary}
          {predictionCard}
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Route details</p>
                <h2 className="text-lg font-semibold text-white mt-2">{overview?.route_name ?? "No Route Available"}</h2>
                <p className="text-sm text-slate-500">Date {date}</p>
              </div>
              <div className="text-right text-sm text-slate-400">
                <div>Geofence events: <span className="font-semibold text-slate-100">{overview?.geofence_events ?? 0}</span></div>
                <div>Completion: <span className="font-semibold text-slate-100">{overview?.completion_pct ?? 0}%</span></div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-900/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Student count</p>
                <p className="mt-2 text-xl font-semibold text-slate-100">{overview?.route_id ? overview?.stop_count : "—"}</p>
              </div>
              <div className="rounded-2xl bg-slate-900/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Route driver</p>
                <p className="mt-2 text-xl font-semibold text-slate-100">{overview?.driver_name ?? "Unknown"}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Driver ranking</h2>
            {ranking.length === 0 ? (
              <p className="text-slate-400 text-sm">No driver ranking data available yet.</p>
            ) : (
              <div className="space-y-4">
                {ranking.map((driver) => (
                  <div key={driver.driver_id} className="rounded-2xl border border-slate-700 p-4 bg-slate-900/80">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{driver.driver_name ?? "Unnamed Driver"}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{driver.route_count} route(s)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-semibold text-emerald-300">{driver.average_efficiency}%</p>
                        <p className="text-xs text-slate-500">Efficiency</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-950/80 p-3 text-sm text-slate-300">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Distance</p>
                        <p className="mt-2 font-semibold text-white">{driver.total_distance_km} km</p>
                      </div>
                      <div className="rounded-2xl bg-slate-950/80 p-3 text-sm text-slate-300">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Routes</p>
                        <p className="mt-2 font-semibold text-white">{driver.route_count}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-950/80 p-3 text-sm text-slate-300">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Top route</p>
                        <p className="mt-2 font-semibold text-white">{driver.routes[0]?.route_name ?? "—"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Route heat map summary</h2>
            {heatMap ? (
              <div className="space-y-4 text-sm text-slate-300">
                <p>Points recorded: <span className="font-semibold text-slate-100">{heatMap.points.length}</span></p>
                <p>Vehicle: <span className="font-semibold text-slate-100">{heatMap.vehicle ?? "Unknown"}</span></p>
                <p>Route: <span className="font-semibold text-slate-100">{heatMap.route_name}</span></p>
                <div className="rounded-2xl bg-slate-900/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Latest trace samples</p>
                  <ol className="mt-3 space-y-2 text-slate-400 text-xs">
                    {heatMap.points.slice(-3).map((point, index) => (
                      <li key={index}>
                        {new Date(point.recorded_at ?? "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "Unknown"} • {point.lat.toFixed(5)}, {point.lng.toFixed(5)} • {point.speed ?? 0} km/h
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No heat map available for today.</p>
            )}
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Insights & actions</h2>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="rounded-2xl bg-slate-900/80 p-4">
                <p className="font-semibold text-slate-100">Keep the driver route stable</p>
                <p className="mt-2 text-slate-400">Use the transport dashboard to verify the same vehicle and driver assignments are retained across trips.</p>
              </li>
              <li className="rounded-2xl bg-slate-900/80 p-4">
                <p className="font-semibold text-slate-100">Monitor stop punctuality</p>
                <p className="mt-2 text-slate-400">A higher stop delay indicates you should review the pickup sequence or traffic impact on the route.</p>
              </li>
              <li className="rounded-2xl bg-slate-900/80 p-4">
                <p className="font-semibold text-slate-100">Act on alerts</p>
                <p className="mt-2 text-slate-400">Use the Notifications page to confirm emergency alerts and recent geofence events.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
