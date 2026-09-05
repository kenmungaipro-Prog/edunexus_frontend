// ============================================================
// app/pages/transport/drivers/$id.edit.tsx - Edit Driver
// ============================================================
import { Form, Link, redirect, useActionData, useLoaderData } from "react-router";
import type { Route } from "./+types/\$id.edit";
import { api } from "~/lib/api";

interface Driver {
  id: number;
  name: string;
  phone: string;
  license_no: string;
  license_expiry: string;
  status: string;
}

export async function clientLoader({ params }: Route.LoaderArgs) {
  try {
    const response = await api.transport.drivers();
    const driver = response.data.find((d: Driver) => d.id === Number(params.id));
    if (!driver) throw new Error("Driver not found");
    return driver;
  } catch (error) {
    console.error("Failed to load driver:", error);
    throw new Error("Driver not found");
  }
}

export async function clientAction({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  const payload = {
    name: String(formData.get("name")),
    phone: String(formData.get("phone")),
    license_no: String(formData.get("license_no")),
    license_expiry: String(formData.get("license_expiry")),
    status: (String(formData.get("status") || "active")) as "active" | "inactive",
  };

  try {
    await api.transport.updateDriver(Number(params.id), payload);
    return redirect("/transport/drivers");
  } catch (error: any) {
    const responseData = error.response?.data;
    return {
      error: responseData?.message || "Failed to update driver.",
      fieldErrors: responseData?.errors || {},
    };
  }
}

export default function EditDriverPage({ loaderData, actionData }: Route.ComponentProps) {
  const driver = loaderData;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">✏️ Edit Driver</h1>
        <p className="text-slate-400 text-sm mt-0.5">Update driver information and license details</p>
      </div>

      {actionData?.error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {actionData.error}
        </div>
      )}

      <Form method="put" className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              required
              defaultValue={driver.name}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
            <input
              type="tel"
              name="phone"
              required
              defaultValue={driver.phone}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">License Number</label>
            <input
              type="text"
              name="license_no"
              required
              defaultValue={driver.license_no}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">License Expiry Date</label>
            <input
              type="date"
              name="license_expiry"
              required
              defaultValue={driver.license_expiry}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <select
              name="status"
              required
              defaultValue={driver.status}
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
            to="/transport/drivers"
            className="px-6 py-2.5 bg-slate-700 text-slate-300 rounded-lg font-semibold hover:bg-slate-600 transition"
          >
            Cancel
          </Link>
        </div>
      </Form>
    </div>
  );
}
