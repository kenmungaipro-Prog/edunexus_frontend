import { useEffect, useState } from "react";
import { api, type LiveVehicle, type TransportRoute } from "~/lib/api";
import TransportMap from "~/components/transport/TransportMap";
import DriverControlPanel from "~/components/transport/DriverControlPanel";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Pusher?: typeof Pusher;
  }
}

export async function clientLoader() {
  try {
    const [liveRes, routesRes] = await Promise.all([api.transport.live(), api.transport.list()]);
    return { vehicles: liveRes.data, routes: routesRes.data };
  } catch (e) {
    console.error(e);
    return { vehicles: [], routes: [] };
  }
}

export default function DriverDashboard() {
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [currentTrip, setCurrentTrip] = useState<any | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [isTripActive, setIsTripActive] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [live, list] = await Promise.all([api.transport.live(), api.transport.list()]);
      if (!mounted) return;
      setVehicles(live.data);
      setRoutes(list.data);
      if (live.data.length > 0) setSelectedVehicleId((prev) => prev ?? live.data[0].vehicle_id);
      // fetch driver trips (if authenticated as driver)
      try {
        const tripsRes = await api.transport.trips.my();
        if (!mounted) return;
        setTrips(tripsRes.data || []);
      } catch (e) {
        // ignore if not authorized or endpoint unavailable for this user
      }
    })();

    return () => { mounted = false; };
  }, []);

  const selectedVehicle = vehicles.find((v) => v.vehicle_id === selectedVehicleId) ?? null;
  const selectedRoute = routes.find((r) => r.vehicle_id === selectedVehicle?.vehicle_id);

  useEffect(() => {
    // pick current trip for selected vehicle (if any)
    if (!selectedVehicle) {
      setCurrentTrip(null);
      setIsTripActive(false);
      return;
    }

    const found = trips.find((t) => t.vehicle_id === selectedVehicle.vehicle_id) ?? null;
    setCurrentTrip(found);
    setIsTripActive(found ? found.status === "ongoing" || found.status === "started" : false);
  }, [selectedVehicle, trips]);

  // Realtime telemetry: subscribe to vehicle updates and apply optimistic updates
  useEffect(() => {
    const reverbAppKey = import.meta.env.VITE_REVERB_APP_KEY;
    const reverbHost = import.meta.env.VITE_REVERB_HOST;
    const reverbPort = import.meta.env.VITE_REVERB_PORT ?? "8080";
    const reverbScheme = import.meta.env.VITE_REVERB_SCHEME ?? "https";
    const schoolId = sessionStorage.getItem('school_id') || localStorage.getItem('school_id');

    if (!reverbAppKey || !reverbHost || !schoolId) return;

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

    // Subscribe to private authenticated channel for this school
    const privateChannel = `fleet-delivery.${schoolId}`;
    echo.private(privateChannel).listen('.vehicle.location.updated', (event: { vehicle: LiveVehicle }) => {
      setVehicles((prev) => {
        const exists = prev.find((v) => v.vehicle_id === event.vehicle.vehicle_id);
        if (exists) {
          return prev.map((v) => v.vehicle_id === event.vehicle.vehicle_id ? { ...v, ...event.vehicle } : v);
        }
        return [...prev, event.vehicle];
      });
    });

    // Trip status events (start / end / stop updates)
    echo.private(privateChannel).listen('.trip.status.updated', (event: { trip: any; action: string; stop?: any }) => {
      setTrips((prev) => {
        const existing = prev.find((t) => t.id === event.trip.id);
        if (existing) {
          return prev.map((t) => t.id === event.trip.id ? { ...t, ...event.trip } : t);
        }
        return [event.trip, ...prev];
      });

      // if current trip is the one updated, reconcile active flag
      if (currentTrip && currentTrip.id === event.trip.id) {
        if (event.action === 'started') setIsTripActive(true);
        else if (event.action === 'ended') setIsTripActive(false);
      }
    });

    return () => {
      echo.leaveChannel(privateChannel);
    };
  }, [currentTrip]);

  // Control handlers
  const handleStartTrip = async () => {
    if (!currentTrip) {
      console.warn("No trip available to start for this vehicle");
      return;
    }

    // optimistic
    setIsTripActive(true);

    try {
      await api.transport.trips.start(currentTrip.id);
      // refresh trips list
      const tripsRes = await api.transport.trips.my();
      setTrips(tripsRes.data || []);
    } catch (e) {
      console.error("Failed to start trip", e);
      setIsTripActive(false);
    }
  };

  const handleEndTrip = async () => {
    if (!currentTrip) {
      console.warn("No trip available to end for this vehicle");
      return;
    }

    // optimistic
    setIsTripActive(false);

    try {
      await api.transport.trips.end(currentTrip.id);
      const tripsRes = await api.transport.trips.my();
      setTrips(tripsRes.data || []);
    } catch (e) {
      console.error("Failed to end trip", e);
      setIsTripActive(true);
    }
  };

  const handleMarkStop = async (index: number) => {
    if (!currentTrip) {
      console.warn("No trip selected to mark stop for");
      return;
    }

    const stop = selectedRoute?.stops?.[index] as any;
    const stopId = stop?.id ?? stop?.stop_id ?? null;

    if (!stopId) {
      console.warn("Stop does not have an id; cannot mark via API");
      return;
    }

    // optimistic: could mark local trip state, but we'll wait for success to refresh
    try {
      await api.transport.trips.storeStop(currentTrip.id, stopId);
      const tripsRes = await api.transport.trips.my();
      setTrips(tripsRes.data || []);
    } catch (e) {
      console.error("Failed to mark stop", e);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">🚍 Driver Dashboard</h1>
          <p className="text-sm text-slate-400">Live trip controls, route, and GPS status for drivers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        <div>
          <TransportMap vehicles={vehicles} routes={routes} height="620px" />
        </div>

        <aside>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 text-sm text-slate-400">Select vehicle</div>
              <div className="space-y-2">
                {vehicles.map((v) => (
                  <button key={v.vehicle_id} onClick={() => setSelectedVehicleId(v.vehicle_id)} className={`w-full text-left p-3 rounded-lg ${v.vehicle_id === selectedVehicleId ? "bg-slate-800 border border-blue-500" : "bg-slate-950/50 border border-slate-800"}`}>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-white">{v.number}</div>
                      <div className="text-xs text-slate-400">{v.speed !== null ? `${v.speed} km/h` : "—"}</div>
                    </div>
                    <div className="text-xs text-slate-500">{v.route ?? "Unassigned"}</div>
                  </button>
                ))}
              </div>
            </div>

            <DriverControlPanel vehicle={selectedVehicle} route={selectedRoute} onStartTrip={handleStartTrip} onEndTrip={handleEndTrip} onMarkStop={handleMarkStop} />

          </div>
        </aside>
      </div>
    </div>
  );
}
