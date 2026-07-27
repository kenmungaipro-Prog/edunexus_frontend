// ============================================================
// app/pages/transport/new.tsx
// ============================================================
import React, { useState } from "react";
import { Form, Link, redirect, useActionData, useLoaderData } from "react-router";
import { api, type ApiResponse } from "~/lib/api";

interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
}

interface Driver {
  id: number;
  name: string;
}

interface StopInput {
  name: string;
  pickup_time: string;
  drop_time: string;
}

export async function clientLoader() {
  try {
    const [vehiclesRes, driversRes] = await Promise.all([
      api.transport.vehicles(),
      api.transport.drivers(),
    ]);
    return {
      vehicles: vehiclesRes.data,
      drivers: driversRes.data,
    };
  } catch (error) {
    console.error("Failed to pre-load route selection assets:", error);
    return { vehicles: [], drivers: [] };
  }
}

export async function clientAction({ request }: { request: Request }) {
  const formData = await request.formData();
  
  const rawStopsNames = formData.getAll("stop_name[]");
  const rawPickupTimes = formData.getAll("stop_pickup[]");
  const rawDropTimes = formData.getAll("stop_drop[]");

  const stops = rawStopsNames.map((name, i) => ({
    name: String(name),
    pickup_time: String(rawPickupTimes[i]),
    drop_time: String(rawDropTimes[i]),
  }));

  const payload = {
    name: String(formData.get("name")),
    vehicle_id: Number(formData.get("vehicle_id")),
    driver_id: Number(formData.get("driver_id")),
    monthly_fee: Number(formData.get("monthly_fee")),
    stops,
  };

  try {
    await api.transport.create(payload);
    return redirect("/transport");
  } catch (error: any) {
    const responseData = error.response?.data;
    return {
      error: responseData?.message || "Failed to create transport route.",
      fieldErrors: responseData?.errors || {},
    };
  }
}

export default function NewTransportRoutePage() {
  const { vehicles, drivers } = useLoaderData<typeof clientLoader>();
  const actionData = useActionData<typeof clientAction>();

  const [stops, setStops] = useState<StopInput[]>([
    { name: "School Campus (Hub)", pickup_time: "07:00", drop_time: "16:30" },
  ]);

  const addStopRow = () => {
    setStops([...stops, { name: "", pickup_time: "", drop_time: "" }]);
  };

  const removeStopRow = (index: number) => {
    if (stops.length === 1) return;
    setStops(stops.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">🗺️ Create Transport Route</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Map vehicle pathways, timeline schedules, and fee configurations.</p>
        </div>
        <Link to="/transport" className="text-slate-400 hover:text-white text-sm transition self-start sm:self-auto">
          ← Back to Fleet Dashboard
        </Link>
      </div>

      {actionData?.error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {actionData.error}
        </div>
      )}

      <Form method="post" className="space-y-6">
        {/* Basic Route Detail Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Route Designation Name</label>
            <input
              name="name"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="e.g., East-Wing Express / Route Line A"
            />
            {actionData?.fieldErrors?.name && (
              <p className="text-red-400 text-xs mt-1">{actionData.fieldErrors.name[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Assigned Transport Vehicle</label>
            <select
              name="vehicle_id"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              <option value="">-- Choose Active Fleet Bus --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registration_number} ({v.make} {v.model})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Designated Route Driver</label>
            <select
              name="driver_id"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              <option value="">-- Select Registered Driver --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Monthly Transit Subscription Fee</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-500 font-medium text-sm">KES</span>
              <input
                type="number"
                name="monthly_fee"
                min="0"
                step="0.01"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-14 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Stops Array Construction Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">📍 Journey Sequences & Stop Stations</h2>
              <p className="text-slate-400 text-xs mt-0.5">Define stop stations in consecutive chronological delivery order.</p>
            </div>
            <button
              type="button"
              onClick={addStopRow}
              className="px-3 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 self-start sm:self-auto"
            >
              ➕ Append Station Stop
            </button>
          </div>

          <div className="space-y-3">
            {stops.map((stop, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-end gap-3 bg-slate-900/40 p-3 sm:p-4 rounded-lg border border-slate-700/50">
                <div className="w-full sm:flex-1">
                  <label className="block text-[11px] font-medium text-slate-400 uppercase mb-1">Station / Stop Name</label>
                  <input
                    name="stop_name[]"
                    required
                    defaultValue={stop.name}
                    placeholder="e.g., Valley View Estate Gate 2"
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
                  title="Delete Stop"
                >
                  🗑️ <span className="sm:hidden ml-2 text-xs">Remove Stop</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Trigger Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-md transition text-sm"
          >
            Save Route Plan
          </button>
          <Link
            to="/transport"
            className="w-full sm:w-auto text-center px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition text-sm"
          >
            Discard
          </Link>
        </div>
      </Form>
    </div>
  );
}