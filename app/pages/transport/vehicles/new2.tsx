// ============================================================
// app/pages/transport/vehicles/new.tsx
// ============================================================
import React from "react";
import { Form, Link, redirect, useActionData } from "react-router";
import { api } from "~/lib/api";

export async function clientAction({ request }: { request: Request }) {
  const formData = await request.formData();
  const payload = {
        registration_number: String(formData.get("registration_number") ?? "").trim().toUpperCase(),
        make: String(formData.get("make") ?? "").trim() || null,
        model: String(formData.get("model") ?? "").trim() || null,
        capacity: Number(formData.get("capacity")),
        year: formData.get("year")
          ? Number(formData.get("year"))
          : null,
        status: "active" as const,
    };

  try {
    await api.transport.createVehicle(payload);
    return redirect("/transport");
  } catch (error: any) {
    const responseData = error.response?.data;
    return {
      error: responseData?.message || "Failed to register transport vehicle.",
      fieldErrors: responseData?.errors || {},
    };
  }
}

export default function NewVehiclePage() {
  const actionData = useActionData<typeof clientAction>();

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">🚛 Register Fleet Vehicle</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Introduce a new transit bus or van into system records.</p>
        </div>
        <Link to="/transport" className="text-slate-400 hover:text-white text-sm transition self-start sm:self-auto">
          ← Back
        </Link>
      </div>

      {actionData?.error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {actionData.error}
        </div>
      )}

      <Form method="post" className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Registration Number / Plate ID</label>
          <input
            name="registration_number"
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition font-mono uppercase text-sm"
            placeholder="e.g., KAA 123X"
          />
          {actionData?.fieldErrors?.registration_number && (
            <p className="text-red-400 text-xs mt-1">{actionData.fieldErrors.registration_number[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Manufacturer / Make</label>
            <input
              name="make"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
              placeholder="e.g., Isuzu / Toyota"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Model Variant</label>
            <input
              name="model"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
              placeholder="e.g., Coaster / Minibus"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Passenger Capacity Limit</label>
          <input
            type="number"
            name="capacity"
            min="1"
            required
            defaultValue="40"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition text-sm"
          >
            Save Vehicle Details
          </button>
          <Link to="/transport" className="w-full sm:w-auto text-center px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition text-sm">
            Cancel
          </Link>
        </div>
      </Form>
    </div>
  );
}