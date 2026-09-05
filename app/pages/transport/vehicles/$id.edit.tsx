// ============================================================
// app/pages/transport/vehicles/$id.edit.tsx - Edit Vehicle
// ============================================================
import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/\$id.edit";
import { api, type Vehicle } from "~/lib/api";



export async function clientLoader({ params }: Route.LoaderArgs) {
  try {
    const response = await api.transport.vehicles();
    const vehicle = response.data.find((v) => v.id === Number(params.id));
    if (!vehicle) throw new Error("Vehicle not found");
    return vehicle;
  } catch (error) {
    console.error("Failed to load vehicle:", error);
    throw new Error("Vehicle not found");
  }
}

export async function clientAction({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  const status = String(formData.get("status") || "active") as "active" | "inactive";

  const payload = {
    registration_number: String(formData.get("registration_number") || ""),
    make: String(formData.get("make") || ""),
    model: String(formData.get("model") || ""),
    capacity: Number(formData.get("capacity")),
    status,
  };

  try {
    await api.transport.updateVehicle(Number(params.id), payload);
    return redirect("/transport/vehicles");
  } catch (error: any) {
    const responseData = error.response?.data;
    return {
      error: responseData?.message || "Failed to update vehicle.",
      fieldErrors: responseData?.errors || {},
    };
  }
}

export default function EditVehiclePage({ loaderData, actionData }: Route.ComponentProps) {
  const vehicle = loaderData;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">✏️ Edit Bus</h1>
        <p className="text-slate-400 text-sm mt-0.5">Update vehicle information</p>
      </div>

      {actionData?.error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {actionData.error}
        </div>
      )}

      <Form method="put" className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Registration Number</label>
            <input
              type="text"
              name="registration_number"
              required
              defaultValue={vehicle.registration_number}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Make</label>
            <input
              type="text"
              name="make"
              required
              defaultValue={vehicle.make ?? ""}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Model</label>
            <input
              type="text"
              name="model"
              required
              defaultValue={vehicle.model ?? ""}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
            <input
              type="number"
              name="year"
              required
              defaultValue={vehicle.year ?? ""}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Capacity (seats)</label>
            <input
              type="number"
              name="capacity"
              required
              defaultValue={vehicle.capacity}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <select
              name="status"
              required
              defaultValue={vehicle.status || "active"}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none [&_option]:bg-slate-800 [&_option]:text-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-700">
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-semibold hover:opacity-90 transition"
          >
            💾 Save Changes
          </button>
          <Link
            to="/transport/vehicles"
            className="px-6 py-2.5 bg-slate-700 text-slate-300 rounded-lg font-semibold hover:bg-slate-600 transition"
          >
            Cancel
          </Link>
        </div>
      </Form>
    </div>
  );
}
