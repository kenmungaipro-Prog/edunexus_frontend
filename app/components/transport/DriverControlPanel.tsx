import type { LiveVehicle, TransportRoute } from "~/lib/api";

export default function DriverControlPanel({
  vehicle,
  route,
  onStartTrip,
  onEndTrip,
  onMarkStop,
}: {
  vehicle: LiveVehicle | null;
  route?: TransportRoute;
  onStartTrip: () => void;
  onEndTrip: () => void;
  onMarkStop: (stopIndex: number) => void;
}) {
  const nextStop = route?.stops?.[0]?.name ?? "No stops configured";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400 uppercase">Driver Console</div>
          <div className="text-lg font-semibold text-white">{vehicle ? vehicle.number : "No vehicle"}</div>
        </div>
        <div className="text-right text-xs text-slate-400">GPS: {vehicle && vehicle.lat !== null && vehicle.lng !== null ? "Active" : "Unavailable"}</div>
      </div>

      <div className="space-y-2 text-sm text-slate-300">
        <div>
          <div className="text-[10px] uppercase text-slate-500">Route</div>
          <div className="font-semibold text-white">{route?.name ?? "Unassigned"}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-800/60 p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Next stop</div>
            <div className="mt-1 font-semibold text-white">{nextStop}</div>
          </div>

          <div className="rounded-xl bg-slate-800/60 p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Speed</div>
            <div className="mt-1 font-semibold text-white">{vehicle?.speed !== null && vehicle?.speed !== undefined ? `${vehicle?.speed} km/h` : "N/A"}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onStartTrip}
            className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:opacity-95"
          >
            ▶️ Start Trip
          </button>

          <button
            type="button"
            onClick={onEndTrip}
            className="flex-1 px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:opacity-95"
          >
            ⏹ End Trip
          </button>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Stops</div>
          <div className="space-y-2">
            {(route?.stops ?? []).map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40">
                <div className="text-sm text-slate-200">{s.name}</div>
                <div className="flex gap-2">
                  <button onClick={() => onMarkStop(idx)} className="px-2 py-1 rounded bg-blue-600 text-white text-xs">Arrived</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
