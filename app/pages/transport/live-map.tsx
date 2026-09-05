// ============================================================
// app/pages/transport/live-map.tsx
// ============================================================
import { useEffect, useState } from "react";
import { Link, useLoaderData } from "react-router";
import { api, type LiveVehicle, type TransportRoute } from "~/lib/api";
import TransportSubNav from "./TransportSubNav";
import { useAuth } from "~/contexts/auth";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import TransportMap from "~/components/transport/TransportMap";

declare global {
  interface Window {
    Pusher?: typeof Pusher;
  }
}

export async function clientLoader() {
  try {
    const [liveRes, routesRes] = await Promise.all([
      api.transport.live(),
      api.transport.list(),
    ]);

    return {
      initialVehicles: liveRes.data,
      initialRoutes: routesRes.data,
    };
  } catch (error) {
    console.error("Failed fetching transport map data:", error);
    return {
      initialVehicles: [],
      initialRoutes: [],
    };
  }
}

export default function FleetLiveMapPage() {
  const { initialVehicles, initialRoutes } = useLoaderData<typeof clientLoader>();
  const { user } = useAuth();

  const [vehicles, setVehicles] = useState<LiveVehicle[]>(initialVehicles);
  const [routes] = useState<TransportRoute[]>(initialRoutes);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  useEffect(() => {
    const reverbAppKey = import.meta.env.VITE_REVERB_APP_KEY;
    const reverbHost = import.meta.env.VITE_REVERB_HOST;
    const reverbPort = import.meta.env.VITE_REVERB_PORT ?? "8080";
    const reverbScheme = import.meta.env.VITE_REVERB_SCHEME ?? "https";

    if (!reverbAppKey || reverbAppKey === "your-app-key-here") {
      console.warn("Realtime fleet telemetry disabled: missing VITE_REVERB_APP_KEY in frontend/.env.");
      return;
    }

    if (!reverbHost) {
      console.warn("Realtime fleet telemetry disabled: missing VITE_REVERB_HOST in frontend/.env.");
      return;
    }

    window.Pusher = Pusher;

    const echo = new Echo({
      broadcaster: "reverb",
      key: reverbAppKey,
      wsHost: reverbHost,
      wsPort: Number(reverbPort),
      wssPort: Number(reverbPort),
      forceTLS: reverbScheme === "https",
      enabledTransports: ["ws", "wss"],
    });

    const schoolChannel = user?.school_id ? `fleet-delivery.${user.school_id}` : "fleet-delivery";

    // Use private channel for authenticated subscription
    echo.private(schoolChannel).listen(".vehicle.location.updated", (event: { vehicle: LiveVehicle }) => {
      setVehicles((prevVehicles) => {
        const exists = prevVehicles.find((v) => v.vehicle_id === event.vehicle.vehicle_id);

        if (exists) {
          return prevVehicles.map((v) =>
            v.vehicle_id === event.vehicle.vehicle_id ? { ...v, ...event.vehicle } : v,
          );
        }

        return [...prevVehicles, event.vehicle];
      });
    });

    return () => {
      echo.leaveChannel(schoolChannel);
    };
  }, [user?.school_id]);

  useEffect(() => {
    if (vehicles.length > 0 && selectedVehicleId === null) {
      setSelectedVehicleId(vehicles[0].vehicle_id);
    }
  }, [selectedVehicleId, vehicles]);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.vehicle_id === selectedVehicleId) ?? null;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/transport"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition border border-slate-700"
            >
              ⬅️
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">📡 Transport Live Map</h1>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 sm:ml-11">
            Live route and vehicle tracking using Leaflet + OpenStreetMap.
          </p>
        </div>

        <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-3 font-medium text-xs text-slate-300 self-start md:self-auto">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live Feed Active
        </div>
      </div>

      <TransportSubNav />

      <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-5">
        <aside className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
              Active Vehicles ({vehicles.length})
            </h2>
          </div>

          <div className="space-y-2">
            {vehicles.length > 0 ? (
              vehicles.map((vehicle) => {
                const isSelected = vehicle.vehicle_id === selectedVehicleId;
                const hasSignal = vehicle.lat !== null && vehicle.lng !== null;
                const isMoving = (vehicle.speed ?? 0) > 0;

                return (
                  <button
                    key={vehicle.vehicle_id}
                    type="button"
                    onClick={() => setSelectedVehicleId(vehicle.vehicle_id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-600/10"
                        : "border-slate-800 bg-slate-800/50 hover:border-slate-700 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono font-bold text-sm text-white">{vehicle.number}</div>
                        <div className="text-[11px] text-slate-400">{vehicle.route || "Unassigned route"}</div>
                        <div className="text-[11px] text-slate-500">{vehicle.driver || "Driver unavailable"}</div>
                      </div>

                      <div className="text-right text-[10px]">
                        {hasSignal ? (
                          <span
                            className={`inline-flex rounded-full px-2 py-1 font-semibold ${
                              isMoving
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {isMoving ? `${vehicle.speed} km/h` : "Idle"}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-700 px-2 py-1 text-slate-400">Offline</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
                No live vehicle telemetry available.
              </div>
            )}
          </div>
        </aside>

        <main className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">Map View</h2>
                <p className="text-xs text-slate-400">Routes, stops, geofences, and active vehicle coordinates</p>
              </div>

              {selectedVehicle ? (
                <div className="rounded-lg border border-blue-500/30 bg-blue-600/10 px-3 py-2 text-right">
                  <div className="text-[10px] uppercase tracking-wider text-blue-300">Selected</div>
                  <div className="text-sm font-semibold text-white">{selectedVehicle.number}</div>
                </div>
              ) : null}
            </div>

            <TransportMap vehicles={vehicles} routes={routes} height="520px" />
          </div>
        </main>
      </div>
    </div>
  );
}

