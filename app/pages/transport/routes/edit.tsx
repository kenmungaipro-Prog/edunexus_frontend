// ============================================================
// app/pages/transport/routes/edit.tsx
// ============================================================
import React, { useState } from "react";
import { Form, Link, redirect, useActionData, useLoaderData } from "react-router";
import { api, type ApiResponse, type TransportRoute } from "~/lib/api";

interface Vehicle { id: number; registration_number: string; make: string; model: string; }
interface Driver { id: number; name: string; }
interface StopInput { name: string; pickup_time: string; drop_time: string; }

export async function clientLoader({ params }: any) {
  try {
    const [routeRes, vehiclesRes, driversRes] = await Promise.all([
      api.transport.get(Number(params.id)),
      api.transport.vehicles(),
      api.transport.drivers(),
    ]);
    
    return {
      route: routeRes.data,
      vehicles: vehiclesRes.data,
      drivers: driversRes.data,
    };
  } catch (error) {
    console.error("Failed to load route data for editing:", error);
    throw new Error("Route or resources not found");
  }
}

export async function clientAction({ request, params }: any) {
  const formData = await request.formData();
  
  const rawStopsNames = formData.getAll("stop_name[]").map(String);
  const rawPickupTimes = formData.getAll("stop_pickup[]").map(String);
  const rawDropTimes = formData.getAll("stop_drop[]").map(String);

  const stops = rawStopsNames.map((name: string, i: number) => ({
    name,
    pickup_time: rawPickupTimes[i] ?? "",
    drop_time: rawDropTimes[i] ?? "",
  }));

  const payload = {
    name: String(formData.get("name")),
    vehicle_id: Number(formData.get("vehicle_id")),
    driver_id: Number(formData.get("driver_id")),
    monthly_fee: Number(formData.get("monthly_fee")),
    stops,
  };

  try {
    await api.transport.update(Number(params.id), payload);
    return redirect(`/transport/routes/${params.id}`);
  } catch (error: any) {
    const responseData = error.response?.data;
    return {
      error: responseData?.message || "Failed to update transport route.",
      fieldErrors: responseData?.errors || {},
    };
  }
}

export default function EditTransportRoutePage() {
  const { route, vehicles, drivers } = useLoaderData<typeof clientLoader>();
  const actionData = useActionData<typeof clientAction>();

  const [stops, setStops] = useState<StopInput[]>(
    route.stops?.length > 0 ? route.stops : [{ name: "", pickup_time: "", drop_time: "" }]
  );

  const addStopRow = () => setStops([...stops, { name: "", pickup_time: "", drop_time: "" }]);
  const removeStopRow = (index: number) => {
    if (stops.length > 1) setStops(stops.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">✏️ Edit Route: {route.name}</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Modify vehicle assignments, adjust pricing, or update stops.</p>
        </div>
        <Link to={`/transport/routes/${route.id}`} className="text-slate-400 hover:text-white text-sm transition self-start sm:self-auto">
          ← Back to Route Details
        </Link>
      </div>

      {actionData?.error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {actionData.error}
        </div>
      )}

      <Form method="put" className="space-y-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Route Designation Name</label>
            <input
              name="name"
              required
              defaultValue={route.name}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Assigned Transport Vehicle</label>
            <select
              name="vehicle_id"
              required
              defaultValue={String(route.vehicle_id || "")}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition [&_option]:bg-slate-800 [&_option]:text-white [&_option]:py-1"
            >
              <option value="">-- Select a vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={String(v.id)}>{v.registration_number} ({v.make})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Designated Route Driver</label>
            <select
              name="driver_id"
              required
              defaultValue={String(route.driver_id || "")}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition [&_option]:bg-slate-800 [&_option]:text-white [&_option]:py-1"
            >
              <option value="">-- Select a driver --</option>
              {drivers.map((d) => (
                <option key={d.id} value={String(d.id)}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Monthly Fee (KES)</label>
            <input
              type="number"
              name="monthly_fee"
              min="0"
              step="0.01"
              required
              defaultValue={route.monthly_fee}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h2 className="text-base font-semibold text-white">📍 Manage Stops</h2>
            <button
              type="button"
              onClick={addStopRow}
              className="px-3 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-semibold transition self-start sm:self-auto"
            >
              ➕ Add Stop
            </button>
          </div>

          <div className="space-y-3">
            {stops.map((stop, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-end gap-3 bg-slate-900/40 p-3 sm:p-4 rounded-lg border border-slate-700/50">
                <div className="w-full sm:flex-1">
                  <label className="block text-[11px] font-medium text-slate-400 uppercase mb-1">Stop Name</label>
                  <input
                    name="stop_name[]"
                    required
                    defaultValue={stop.name}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 sm:flex sm:gap-3 w-full sm:w-auto gap-3">
                  <div className="w-full sm:w-32">
                    <label className="block text-[11px] font-medium text-slate-400 uppercase mb-1">Pickup Time</label>
                    <input
                      type="time"
                      name="stop_pickup[]"
                      required
                      defaultValue={stop.pickup_time}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <label className="block text-[11px] font-medium text-slate-400 uppercase mb-1">Drop Time</label>
                    <input
                      type="time"
                      name="stop_drop[]"
                      required
                      defaultValue={stop.drop_time}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeStopRow(idx)}
                  disabled={stops.length === 1}
                  className="w-full sm:w-auto p-2.5 bg-slate-800 text-slate-400 hover:text-red-400 disabled:opacity-30 rounded-lg border border-slate-700 transition flex items-center justify-center"
                >
                  🗑️ <span className="sm:hidden ml-2 text-xs">Remove Stop</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition text-sm">
            Save Changes
          </button>
        </div>
      </Form>
    </div>
  );
}