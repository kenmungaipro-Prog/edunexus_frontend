// ============================================================
// app/pages/transport/live-map.tsx
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLoaderData } from "react-router";
import { api, type DemoSession, type DemoTarget, type LiveVehicle, type TransportRoute } from "~/lib/api";
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
  const { user, isLoading: isAuthLoading } = useAuth();

  const [vehicles, setVehicles] = useState<LiveVehicle[]>(initialVehicles);
  const [routes] = useState<TransportRoute[]>(initialRoutes);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [demoSession, setDemoSession] = useState<DemoSession | null>(null);
  const [demoTarget, setDemoTarget] = useState<DemoTarget | null>(null);
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const demoSessionRef = useRef<DemoSession | null>(null);
  const geolocationWatchRef = useRef<number | null>(null);
  const positionPostInProgressRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const canManageDemo = user?.role === "admin";

  const setCurrentDemoSession = useCallback((session: DemoSession | null) => {
    demoSessionRef.current = session;
    setDemoSession(session);
  }, []);

  const stopLocationWatch = useCallback(() => {
    if (geolocationWatchRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(geolocationWatchRef.current);
      geolocationWatchRef.current = null;
    }
  }, []);

  const startLocationWatch = useCallback((session: DemoSession) => {
    if (geolocationWatchRef.current !== null || stopRequestedRef.current) {
      return;
    }

    if (!navigator.geolocation) {
      setDemoError("This browser does not provide phone GPS access.");
      return;
    }

    geolocationWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (stopRequestedRef.current || positionPostInProgressRef.current) {
          return;
        }

        positionPostInProgressRef.current = true;
        void api.transport.updateDemoPosition(session.vehicle_id, {
          session_id: session.session_id,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speed: position.coords.speed === null ? null : Math.max(0, position.coords.speed * 3.6),
          heading: position.coords.heading,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString(),
        }).then(() => {
          setDemoError(null);
        }).catch((error: unknown) => {
          console.error("Failed to upload demo GPS position:", error);
          setDemoError("Demo GPS could not reach the server. The overlay will expire automatically if updates stop.");
        }).finally(() => {
          positionPostInProgressRef.current = false;
        });
      },
      (error) => {
        setDemoError(`Phone GPS error: ${error.message}`);
        stopLocationWatch();
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    );
  }, [stopLocationWatch]);

  const stopDemo = useCallback(async () => {
    const session = demoSessionRef.current;
    if (!session) {
      return;
    }

    stopRequestedRef.current = true;
    stopLocationWatch();
    setDemoBusy(true);
    setDemoError(null);
    try {
      await api.transport.stopDemoSession(session.vehicle_id, session.session_id);
      setCurrentDemoSession(null);
      setVehicles((current) => current.map((vehicle) => (
        vehicle.vehicle_id === session.vehicle_id ? { ...vehicle, demo: null } : vehicle
      )));
      stopRequestedRef.current = false;
      try {
        const response = await api.transport.live();
        setVehicles(response.data);
      } catch (error) {
        console.error("Failed refreshing the map after stopping demo:", error);
      }
    } catch (error) {
      console.error("Failed to stop demo session:", error);
      setDemoError("The stop request failed. The demo position will expire automatically within 30 seconds; retry stop when connected.");
    } finally {
      setDemoBusy(false);
    }
  }, [setCurrentDemoSession, stopLocationWatch]);

  useEffect(() => {
    let mounted = true;
    const syncDemo = async () => {
      try {
        const liveResponse = await api.transport.live();
        if (!mounted) {
          return;
        }
        setVehicles(liveResponse.data);

        if (!canManageDemo) {
          return;
        }

        try {
          const targetResponse = await api.transport.demoTarget();
          if (!mounted) {
            return;
          }
          setDemoTarget(targetResponse.data);
        } catch (error) {
          console.error("Failed loading configured demo vehicle:", error);
          setDemoTarget(null);
          setDemoError("The approved demonstration vehicle is not configured or available for this school.");
        }

        const sessionResponse = await api.transport.activeDemoSession();
        if (!mounted) {
          return;
        }
        const session = sessionResponse.data;
        if (session) {
          setCurrentDemoSession(session);
          startLocationWatch(session);
        } else if (demoSessionRef.current) {
          stopLocationWatch();
          setCurrentDemoSession(null);
          stopRequestedRef.current = false;
          setDemoError("The demo session expired and its map overlay has been cleared.");
        }
      } catch (error) {
        console.error("Failed refreshing live transport data:", error);
      }
    };

    void syncDemo();
    const interval = window.setInterval(() => void syncDemo(), 5000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      stopLocationWatch();
    };
  }, [canManageDemo, setCurrentDemoSession, startLocationWatch, stopLocationWatch]);

  useEffect(() => {
    if (!canManageDemo) {
      return;
    }
    const interval = window.setInterval(() => {
      const session = demoSessionRef.current;
      if (session && Date.now() >= new Date(session.hard_expires_at).getTime()) {
        void stopDemo();
        setDemoError("The demo reached its 15-minute limit and was stopped.");
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [canManageDemo, stopDemo]);

  useEffect(() => () => {
    stopLocationWatch();
  }, [stopLocationWatch]);

  useEffect(() => {
    const nextExpiry = vehicles
      .flatMap((vehicle) => vehicle.demo ? [new Date(vehicle.demo.expires_at).getTime()] : [])
      .filter((expiresAt) => expiresAt > Date.now())
      .sort((left, right) => left - right)[0];

    if (nextExpiry === undefined) {
      return;
    }

    const timeout = window.setTimeout(() => setClock(Date.now()), Math.max(0, nextExpiry - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [vehicles]);

  useEffect(() => {
    const reverbAppKey = import.meta.env.VITE_REVERB_APP_KEY;
    const reverbHost = import.meta.env.VITE_REVERB_HOST;
    const reverbPort = import.meta.env.VITE_REVERB_PORT ?? "8080";
    const reverbScheme = import.meta.env.VITE_REVERB_SCHEME ?? "https";
    const authToken = localStorage.getItem("edunexus_token");

    if (!reverbAppKey || reverbAppKey === "your-app-key-here") {
      console.warn("Realtime fleet telemetry disabled: missing VITE_REVERB_APP_KEY in frontend/.env.");
      return;
    }

    if (!reverbHost) {
      console.warn("Realtime fleet telemetry disabled: missing VITE_REVERB_HOST in frontend/.env.");
      return;
    }

    if (!authToken) {
      console.warn("Realtime fleet telemetry disabled: missing authentication token.");
      return;
    }

    if (isAuthLoading) {
      return;
    }

    if (!user?.school_id) {
      console.warn("Realtime fleet telemetry disabled: the signed-in user has no school assignment.");
      return;
    }

    window.Pusher = Pusher;

    const echo = new Echo({
      broadcaster: "reverb",
      key: reverbAppKey,
      authEndpoint: "/broadcasting/auth",
      auth: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
      wsHost: reverbHost,
      wsPort: Number(reverbPort),
      wssPort: Number(reverbPort),
      forceTLS: reverbScheme === "https",
      enabledTransports: ["ws", "wss"],
    });

    const schoolChannel = `fleet-delivery.${user.school_id}`;

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
  }, [isAuthLoading, user?.school_id]);

  useEffect(() => {
    if (vehicles.length > 0 && selectedVehicleId === null) {
      setSelectedVehicleId(vehicles[0].vehicle_id);
    }
  }, [selectedVehicleId, vehicles]);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.vehicle_id === selectedVehicleId) ?? null;
  const visibleVehicles = useMemo(() => vehicles.map((vehicle) => ({
    ...vehicle,
    demo: vehicle.demo && new Date(vehicle.demo.expires_at).getTime() > clock ? vehicle.demo : null,
  })), [vehicles, clock]);
  const demoVehicle = demoSession
    ? vehicles.find((vehicle) => vehicle.vehicle_id === demoSession.vehicle_id) ?? null
    : null;

  const startDemo = async () => {
    if (!demoTarget) {
      setDemoError("The approved demonstration vehicle is not configured or available.");
      return;
    }
    if (!window.isSecureContext || !navigator.geolocation) {
      setDemoError("Phone GPS requires a supported browser over HTTPS.");
      return;
    }

    setDemoBusy(true);
    setDemoError(null);
    stopRequestedRef.current = false;
    try {
      const response = await api.transport.startDemoSession(demoTarget.vehicle_id);
      setCurrentDemoSession(response.data);
      startLocationWatch(response.data);
    } catch (error) {
      console.error("Failed to start demo session:", error);
      setDemoError("Could not start the demo. Confirm the vehicle is active and assigned to a route, then try again.");
    } finally {
      setDemoBusy(false);
    }
  };

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
            Detailed street map centered on Kamakis, Ruiru. Bus and stop locations use recorded GPS data.
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

      {visibleVehicles.some((vehicle) => vehicle.demo) ? (
        <div className="rounded-xl border border-red-500/60 bg-red-950/80 px-4 py-3 text-sm font-semibold text-red-100">
          DEMO MODE — {visibleVehicles.find((vehicle) => vehicle.demo)?.number} is showing temporary phone GPS. This position is not genuine tracking and is not saved to vehicle or trip history.
        </div>
      ) : null}

      {canManageDemo ? (
        <section className="rounded-2xl border border-amber-500/40 bg-slate-900 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-amber-300">Controlled phone GPS demo</h2>
              <p className="mt-1 text-xs text-slate-300">
                Open this page on the GPS phone and allow location access. Demo points are isolated from operational tracking.
              </p>
            </div>
            {demoSession ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">DEMO ACTIVE</span>
                <span className="text-xs text-slate-300">
                  {demoVehicle?.number ?? `Vehicle ${demoSession.vehicle_id}`} · ends at {new Date(demoSession.hard_expires_at).toLocaleTimeString()}
                </span>
                <button
                  type="button"
                  disabled={demoBusy}
                  onClick={() => void stopDemo()}
                  className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  Stop demo
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
                  {demoTarget
                    ? `Approved target: ${demoTarget.number}`
                    : "Approved demo target is not configured"}
                </span>
                <button
                  type="button"
                  disabled={demoBusy || !demoTarget}
                  onClick={() => void startDemo()}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  Start phone demo
                </button>
              </div>
            )}
          </div>
          {demoError ? <p role="alert" className="mt-3 text-sm text-red-300">{demoError}</p> : null}
          <p className="mt-2 text-[11px] text-slate-400">
            The demo clears after 30 seconds without a GPS fix and has a 15-minute maximum. Refreshing this page resumes an active session.
          </p>
        </section>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-5">
        <aside className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
              Active Vehicles ({vehicles.length})
            </h2>
          </div>

          <div className="space-y-2">
            {vehicles.length > 0 ? (
              visibleVehicles.map((vehicle) => {
                const isSelected = vehicle.vehicle_id === selectedVehicleId;
                const position = vehicle.demo ?? vehicle;
                const hasSignal = position.lat !== null && position.lng !== null;
                const isMoving = (position.speed ?? 0) > 0;

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
                        {vehicle.demo ? <div className="mt-1 inline-flex rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">DEMO GPS</div> : null}
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
                            {isMoving ? `${position.speed} km/h` : "Idle"}
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
                <p className="text-xs text-slate-400">Each bus has its own color and registration label. Green means moving; amber means stopped.</p>
              </div>

              {selectedVehicle ? (
                <div className="rounded-lg border border-blue-500/30 bg-blue-600/10 px-3 py-2 text-right">
                  <div className="text-[10px] uppercase tracking-wider text-blue-300">Selected</div>
                  <div className="text-sm font-semibold text-white">{selectedVehicle.number}</div>
                </div>
              ) : null}
            </div>

            <TransportMap
              vehicles={visibleVehicles}
              routes={routes}
              height="520px"
              selectedVehicleId={selectedVehicleId}
              onVehicleSelect={setSelectedVehicleId}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
