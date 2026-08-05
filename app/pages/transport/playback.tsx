import React, { useEffect, useMemo, useState } from "react";
import { Link, useLoaderData } from "react-router";
import { api, type VehicleTelemetry, type LiveVehicle } from "~/lib/api";
import TransportSubNav from "./TransportSubNav";

export async function clientLoader() {
  try {
    const [liveRes] = await Promise.all([api.transport.live()]);
    return { vehicles: liveRes.data };
  } catch (error) {
    console.error("Failed to load playback assets:", error);
    return { vehicles: [] };
  }
}

export default function TransportPlaybackPage() {
  const { vehicles } = useLoaderData<typeof clientLoader>();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(vehicles[0]?.vehicle_id ?? null);
  const [playbackData, setPlaybackData] = useState<VehicleTelemetry[]>([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!selectedVehicleId) {
      setPlaybackData([]);
      return;
    }

    let cancelled = false;
    api.transport.vehicleTelemetryHistory(selectedVehicleId)
      .then((res) => {
        if (!cancelled) {
          setPlaybackData(res.data);
          setPlaybackIndex(0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPlaybackData([]);
          setPlaybackIndex(0);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedVehicleId]);

  useEffect(() => {
    if (!isPlaying || playbackData.length === 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setPlaybackIndex((current) => {
        if (current + 1 >= playbackData.length) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1200 / speed);

    return () => window.clearInterval(timerId);
  }, [isPlaying, playbackData, speed]);

  const selectedPoint = playbackData[playbackIndex] ?? null;
  const routePoints = useMemo(
    () => playbackData.filter((point) => point.lat !== null && point.lng !== null),
    [playbackData]
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">▶️ Route Playback</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">Replay the selected vehicle’s recorded telemetry and inspect stop-by-stop movement.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/transport" className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs sm:text-sm hover:bg-slate-700 transition">← Transport Dashboard</Link>
          <Link to="/transport/analytics" className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs sm:text-sm hover:bg-slate-700 transition">📊 Analytics</Link>
        </div>
      </div>
      <TransportSubNav />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Selected vehicle</p>
              <h2 className="text-lg font-semibold text-white mt-2">{vehicles.find((item) => item.vehicle_id === selectedVehicleId)?.number ?? "None selected"}</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedVehicleId ?? ""}
                onChange={(e) => setSelectedVehicleId(Number(e.target.value) || null)}
                className="rounded-2xl bg-slate-900 border border-slate-700 px-4 py-2 text-sm text-slate-100"
              >
                <option value="">Select a vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                    {vehicle.number} — {vehicle.route ?? "Unassigned"}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsPlaying((current) => !current)}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition"
                disabled={!routePoints.length}
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-900/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Playback speed</p>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="mt-3 w-full"
              />
              <p className="mt-2 text-sm text-slate-300">{speed}x</p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Progress</p>
              <div className="mt-3 rounded-full bg-slate-800 h-2 overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-blue-400 to-sky-400"
                  style={{ width: routePoints.length ? `${Math.min(100, Math.round(((playbackIndex + 1) / routePoints.length) * 100))}%` : "0%" }}
                />
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {routePoints.length ? `${playbackIndex + 1}/${routePoints.length}` : "No recorded points"}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-slate-900/80 p-5">
            <h3 className="text-sm uppercase tracking-[0.2em] text-slate-500">Current playback point</h3>
            {selectedPoint ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-950 border border-slate-700 p-4">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Latitude</span>
                  <p className="mt-2 font-semibold text-slate-100">{selectedPoint.lat?.toFixed(5) ?? "N/A"}</p>
                </div>
                <div className="rounded-2xl bg-slate-950 border border-slate-700 p-4">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Longitude</span>
                  <p className="mt-2 font-semibold text-slate-100">{selectedPoint.lng?.toFixed(5) ?? "N/A"}</p>
                </div>
                <div className="rounded-2xl bg-slate-950 border border-slate-700 p-4">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Speed</span>
                  <p className="mt-2 font-semibold text-slate-100">{selectedPoint.speed ?? 0} km/h</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 mt-4 text-sm">Choose a vehicle to view its recorded GPS trace and playback details.</p>
            )}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Latest playback summary</h2>
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Recorded points</p>
              <p className="mt-2 text-2xl font-semibold text-white">{routePoints.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total span</p>
              <p className="mt-2 text-2xl font-semibold text-white">{routePoints.length ? `${Math.max(0, routePoints.length - 1)} points` : "—"}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Recommended action</p>
              <p className="mt-2 text-sm text-slate-300">Replay until you see a slow or idle segment, then cross-check with the transport analytics page for delay causes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
