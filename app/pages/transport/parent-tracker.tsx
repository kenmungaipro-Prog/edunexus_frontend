// ============================================================
// app/pages/transport/parent-tracker.tsx
// ============================================================
import { useMemo, useState, useEffect } from "react";
import { Link, useLoaderData } from "react-router";
import { api, type LiveVehicle, type TransportRoute } from "~/lib/api";
import TransportMap from "~/components/transport/TransportMap";
import StudentTripTracker from "~/components/transport/StudentTripTracker";
import TransportSubNav from "./TransportSubNav";

function formatLastUpdate(value: string | null) {
  if (!value) {
    return "No recent update";
  }

  const updatedAt = new Date(value);
  const diffMs = Date.now() - updatedAt.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes === 0) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
}

function getFriendlyVehicleStatus(vehicle: LiveVehicle) {
  if (vehicle.lat === null || vehicle.lng === null) {
    return {
      label: "Location unavailable",
      detail: "GPS signal missing",
      tone: "bg-slate-700 text-slate-300",
    };
  }

  if ((vehicle.speed ?? 0) > 0) {
    return {
      label: "Bus is moving",
      detail: `${vehicle.speed} km/h`,
      tone: "bg-emerald-500/10 text-emerald-400",
    };
  }

  return {
    label: "Bus is waiting",
    detail: "On the route",
    tone: "bg-amber-500/10 text-amber-400",
  };
}

interface Child {
  id: number;
  full_name: string;
  admission_no: string;
}

export async function clientLoader() {
  try {
    const [liveRes, routesRes, childrenRes] = await Promise.all([
      api.transport.live(),
      api.transport.list(),
      api.portal.myChildren(),
    ]);

    return {
      vehicles: liveRes.data,
      routes: routesRes.data,
      children: childrenRes.data?.children || [],
    };
  } catch (error) {
    console.error("Failed fetching live transport data:", error);
    return {
      vehicles: [],
      routes: [],
      children: [],
    };
  }
}

export default function ParentTransportTrackerPage() {
  const { vehicles, routes, children } = useLoaderData<typeof clientLoader>();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    vehicles.length > 0 ? vehicles[0].vehicle_id : null,
  );
  const [selectedChildId, setSelectedChildId] = useState<number | null>(
    children.length > 0 ? children[0].id : null,
  );

  const selectedVehicle = vehicles.find((vehicle) => vehicle.vehicle_id === selectedVehicleId) ?? null;
  const selectedRoute = useMemo<TransportRoute | undefined>(() => {
    if (!selectedVehicle) {
      return undefined;
    }

    return routes.find((route) => route.vehicle_id === selectedVehicle.vehicle_id);
  }, [selectedVehicle, routes]);

  const selectedChild = children.find((c) => c.id === selectedChildId) ?? null;

  const nextStop = selectedRoute?.stops?.[0]?.name ?? "Stop schedule pending";
  const status = selectedVehicle ? getFriendlyVehicleStatus(selectedVehicle) : null;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">🚌 Where is my child's bus?</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Live route status, pickup tracking, and real-time bus updates without exposing raw GPS coordinates.
          </p>
        </div>

        <Link
          to="/transport"
          className="self-start rounded-lg bg-slate-800 px-4 py-2 text-slate-200 text-sm font-medium hover:bg-slate-700 transition"
        >
          ← Back to Transport
        </Link>
      </div>

      <TransportSubNav />

      {/* My Children Selector */}
      {children.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Your Children</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`rounded-lg p-3 text-left text-xs transition border ${
                  selectedChildId === child.id
                    ? "border-blue-500 bg-blue-600/10"
                    : "border-slate-800 bg-slate-800/50 hover:border-slate-700 hover:bg-slate-800"
                }`}
              >
                <div className="font-semibold text-white truncate">{child.full_name}</div>
                <div className="text-[10px] text-slate-400 truncate">{child.admission_no}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">Live route overview</h2>
                <p className="text-xs text-slate-400">Updated in real time from the school transport feed</p>
              </div>

              {selectedVehicle && status ? (
                <div className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${status.tone}`}>
                  {status.label}
                </div>
              ) : null}
            </div>

            <TransportMap vehicles={vehicles} routes={routes} height="500px" />
          </div>
        </div>

        <aside className="space-y-4">
          {/* Child's Trip Tracker */}
          {selectedChild && (
            <StudentTripTracker
              studentId={selectedChild.id}
              studentName={selectedChild.full_name}
            />
          )}

          {/* All Buses */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">School transport</h2>
              <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-300">
                {vehicles.length} buses
              </span>
            </div>

            <div className="space-y-2">
              {vehicles.length > 0 ? (
                vehicles.map((vehicle) => {
                  const isSelected = vehicle.vehicle_id === selectedVehicleId;
                  const statusInfo = getFriendlyVehicleStatus(vehicle);

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
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-white">{vehicle.number}</div>
                          <div className="text-[11px] text-slate-400">{vehicle.route || "Unassigned route"}</div>
                        </div>

                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusInfo.tone}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-slate-700 p-5 text-center text-sm text-slate-500">
                  No active buses are reporting right now.
                </div>
              )}
            </div>
          </div>

          {selectedVehicle ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Selected vehicle</div>
                  <div className="text-xl font-bold text-white">{selectedVehicle.number}</div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${status?.tone ?? "bg-slate-700 text-slate-300"}`}>
                  {status?.label ?? "Status unavailable"}
                </span>
              </div>

              <div className="space-y-3 text-sm text-slate-300">
                <div className="rounded-xl bg-slate-800/60 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Route</div>
                  <div className="mt-1 font-semibold text-white">{selectedVehicle.route || "Route not assigned"}</div>
                </div>

                <div className="rounded-xl bg-slate-800/60 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Driver</div>
                  <div className="mt-1 font-semibold text-white">{selectedVehicle.driver || "Driver unavailable"}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-800/60 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Speed</div>
                    <div className="mt-1 font-semibold text-white">
                      {selectedVehicle.speed !== null ? `${selectedVehicle.speed} km/h` : "N/A"}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-800/60 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">GPS</div>
                    <div className="mt-1 font-semibold text-white">
                      {selectedVehicle.lat !== null && selectedVehicle.lng !== null ? "Active" : "Unavailable"}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-800/60 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Next stop</div>
                  <div className="mt-1 font-semibold text-white">{nextStop}</div>
                </div>

                <div className="rounded-xl bg-slate-800/60 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Last update</div>
                  <div className="mt-1 font-semibold text-white">{formatLastUpdate(selectedVehicle.updated_at)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-4 text-sm text-slate-400">
              Select a bus to view the latest route status.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
