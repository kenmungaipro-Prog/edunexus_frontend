// ============================================================
// app/pages/transport/live-map.tsx
// ============================================================
import React, { useEffect, useState } from "react";
import { useLoaderData, Link } from "react-router";
import { api, type ApiResponse } from "~/lib/api";
import TransportSubNav from "./TransportSubNav";
import { useAuth } from "~/contexts/auth";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

interface LiveVehicle {
  vehicle_id: number;
  number: string;
  route: string | null;
  driver: string | null;
  lat: number | null;
  lng: number | null;
  speed: number | null;
  updated_at: string;
}

interface VehicleTelemetry {
  vehicle_id: number;
  lat: number | null;
  lng: number | null;
  speed: number | null;
  recorded_at: string | null;
}

export async function clientLoader() {
  try {
    const res = await api.transport.live();
    return { initialVehicles: res.data };
  } catch (error) {
    console.error("Failed fetching dynamic vehicle feeds:", error);
    return { initialVehicles: [] };
  }
}

export default function FleetLiveMapPage() {
  const { initialVehicles } = useLoaderData<typeof clientLoader>();
  const { user } = useAuth();

  const [vehicles, setVehicles] = useState<LiveVehicle[]>(initialVehicles);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<VehicleTelemetry[]>([]);

  useEffect(() => {
    const reverbAppKey = import.meta.env.VITE_REVERB_APP_KEY;
    const reverbHost = import.meta.env.VITE_REVERB_HOST;
    const reverbPort = import.meta.env.VITE_REVERB_PORT ?? "8080";
    const reverbScheme = import.meta.env.VITE_REVERB_SCHEME ?? "https";

    if (!reverbAppKey || reverbAppKey === "your-app-key-here") {
      console.warn(
        "Realtime fleet telemetry disabled: missing VITE_REVERB_APP_KEY in frontend/.env."
      );
      return;
    }

    if (!reverbHost) {
      console.warn(
        "Realtime fleet telemetry disabled: missing VITE_REVERB_HOST in frontend/.env."
      );
      return;
    }

    window.Pusher = Pusher;

    const echo = new Echo({
      broadcaster: 'reverb',
      key: reverbAppKey,
      wsHost: reverbHost,
      wsPort: Number(reverbPort),
      wssPort: Number(reverbPort),
      forceTLS: reverbScheme === 'https',
      enabledTransports: ['ws', 'wss'],
    });

    const schoolChannel = user?.school_id ? `fleet-delivery.${user.school_id}` : 'fleet-delivery';

    echo.channel(schoolChannel)
      .listen(".vehicle.location.updated", (event: { vehicle: LiveVehicle }) => {
        setVehicles((prevVehicles) => {
          const exists = prevVehicles.find(
            (v) => v.vehicle_id === event.vehicle.vehicle_id
          );

          if (exists) {
            return prevVehicles.map((v) =>
              v.vehicle_id === event.vehicle.vehicle_id ? { ...v, ...event.vehicle } : v
            );
          }

          return [...prevVehicles, event.vehicle];
        });
      });

    return () => {
      const schoolChannel = user?.school_id ? `fleet-delivery.${user.school_id}` : 'fleet-delivery';
      echo.leaveChannel(schoolChannel);
    };
  }, []);

  useEffect(() => {
    if (selectedVehicleId === null) {
      setTelemetryHistory([]);
      return;
    }

    let cancelled = false;

    api.transport.vehicleTelemetryHistory(selectedVehicleId)
      .then((response) => {
        if (!cancelled) {
          setTelemetryHistory(response.data);
        }
      })
      .catch((error) => {
        console.warn('Failed to load vehicle telemetry history:', error);
        if (!cancelled) {
          setTelemetryHistory([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedVehicleId]);

  const activeFocusVehicle = vehicles.find(v => v.vehicle_id === selectedVehicleId);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex flex-col h-auto lg:h-[calc(100vh-110px)]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 flex-shrink-0 text-left">
        <div>
          <div className="flex items-center gap-3">
            <Link to="/transport" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition border border-slate-700 shrink-0">
              ⬅️
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">📡 Real-Time Fleet Telemetry</h1>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 sm:ml-11">
            Monitoring active school transit vehicles and transit pilot telemetry tracks.
          </p>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-3 font-medium text-xs text-slate-300 self-start md:self-auto">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live Stream Polling Active (10s)
        </div>
      </div>
      <TransportSubNav />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[300px] lg:h-auto min-h-0 overflow-hidden text-left">
          <h2 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex-shrink-0">
            Active Vehicles ({vehicles.length})
          </h2>
          <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {vehicles.length > 0 ? (
              vehicles.map((vehicle) => {
                const isSelected = vehicle.vehicle_id === selectedVehicleId;
                const hasSignal = vehicle.lat !== null && vehicle.lng !== null;
                const isMoving = (vehicle.speed ?? 0) > 0;

                return (
                  <button
                    key={vehicle.vehicle_id}
                    onClick={() => setSelectedVehicleId(vehicle.vehicle_id)}
                    className={`w-full p-3.5 rounded-xl border text-left transition ${
                      isSelected
                        ? "bg-blue-600/10 border-blue-500 text-white shadow-md"
                        : "bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700"
                    }`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-mono font-bold text-white text-sm">{vehicle.number}</div>
                        <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">
                          Route: <span className="text-slate-300 font-medium">{vehicle.route || "Idle/Unassigned"}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 truncate max-w-[180px]">
                          Driver: {vehicle.driver || "Unallocated"}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {hasSignal ? (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isMoving ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {isMoving ? `🚚 ${vehicle.speed} km/h` : "🛑 Idle"}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700">
                            Offline
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(vehicle.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-500 italic text-sm">
                No telemetry targets streaming updates.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden flex flex-col justify-between p-4 sm:p-6 min-h-[400px] lg:min-h-0">
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
          
          <div className="relative z-10 flex justify-between items-start pointer-events-none text-left">
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg backdrop-blur-sm max-w-sm">
              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Canvas Status</span>
              <p className="text-xs text-slate-300 mt-1">
                {selectedVehicleId 
                  ? `Simulating dynamic trace projection matrices tracking device ID: ${selectedVehicleId}`
                  : "Select an active fleet vessel node from the registry deck to lock coordinate arrays."}
              </p>
            </div>
          </div>

          <div className="my-auto py-8 sm:py-12 flex flex-col items-center justify-center relative z-10">
            {activeFocusVehicle ? (
              <div className="bg-slate-900/90 border border-slate-700/60 p-5 sm:p-6 rounded-2xl shadow-2xl text-center space-y-3 border-t-2 border-t-blue-500 max-w-xs animate-fadeIn w-full">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl mx-auto animate-bounce">
                  🚌
                </div>
                <div>
                  <h3 className="font-mono text-lg font-bold text-white">{activeFocusVehicle.number}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{activeFocusVehicle.route || "No Route Context Assigned"}</p>
                </div>
                <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-left space-y-1">
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>Latitude:</span>
                    <span className="font-mono text-slate-300 font-medium">{activeFocusVehicle.lat?.toFixed(5) ?? "N/A"}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>Longitude:</span>
                    <span className="font-mono text-slate-300 font-medium">{activeFocusVehicle.lng?.toFixed(5) ?? "N/A"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2 px-4">
                <div className="text-4xl opacity-30">🗺️</div>
                <p className="text-sm text-slate-500 font-medium">Select a transit device node to isolate vector coordinates</p>
              </div>
            )}
          </div>

          {activeFocusVehicle && (
            <>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 grid grid-cols-2 xl:grid-cols-6 gap-4 flex-shrink-0 text-left relative z-10 animate-slideUp">
                <div>
                  <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">Active Tracker Node</div>
                  <div className="text-sm sm:text-base font-mono font-bold text-blue-400 mt-0.5">{activeFocusVehicle.number}</div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">Pathway Route</div>
                  <div className="text-sm sm:text-base font-bold text-slate-200 mt-0.5 truncate">{activeFocusVehicle.route || "Idle Status"}</div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">Speed Metrics</div>
                  <div className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5 font-mono">{(activeFocusVehicle.speed ?? 0) > 0 ? `${activeFocusVehicle.speed} KM/H` : "Stationary"}</div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">Driver Assigned</div>
                  <div className="text-sm sm:text-base font-bold text-slate-200 mt-0.5 truncate">{activeFocusVehicle.driver || "Unallocated"}</div>
                </div>
                <div className="xl:col-span-2">
                  <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">Telemetry History</div>
                  <div className="text-sm sm:text-base text-slate-200 mt-0.5">Last {telemetryHistory.length} points</div>
                </div>
              </div>
              {telemetryHistory.length > 0 && (
                <div className="mt-4 bg-slate-900/90 border border-slate-700 rounded-2xl p-4 space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-200">Recent Telemetry Stream</div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Latest {Math.min(5, telemetryHistory.length)}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                    {telemetryHistory.slice(0, 5).map((entry, index) => (
                      <div key={index} className="rounded-2xl border border-slate-700 p-3 bg-slate-950/70">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Point #{telemetryHistory.length - index}</div>
                        <div className="mt-2 font-semibold text-slate-100">{entry.speed ?? 0} km/h</div>
                        <div className="text-[11px] text-slate-500 mt-1">{entry.lat?.toFixed(4) ?? 'N/A'}, {entry.lng?.toFixed(4) ?? 'N/A'}</div>
                        <div className="text-[11px] text-slate-500 mt-1">{entry.recorded_at ? new Date(entry.recorded_at).toLocaleTimeString() : 'No time'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

