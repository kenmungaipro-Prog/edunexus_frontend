// ============================================================
// app/pages/transport/drivers/new.tsx
// ============================================================
import React from "react";
import { Form, Link, redirect, useActionData } from "react-router";
import { api } from "~/lib/api";

export async function clientAction({ request }: { request: Request }) {
  const formData = await request.formData();
  const payload = {
    name: String(formData.get("name")),
    phone: String(formData.get("phone")),
    license_no: String(formData.get("license_no")),
    license_expiry: String(formData.get("license_expiry")),
    status: "active",
  };

  try {
    await api.post("/transport/drivers", payload);
    return redirect("/transport");
  } catch (error: any) {
    const responseData = error.response?.data;
    return {
      error: responseData?.message || "Failed to register new transit pilot driver.",
      fieldErrors: responseData?.errors || {},
    };
  }
}

export default function NewDriverPage() {
  const actionData = useActionData<typeof clientAction>();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">👨‍✈️ Add New Driver</h1>
          <p className="text-slate-400 text-sm mt-0.5">Register licensed personnel into transport roster assignments.</p>
        </div>
        <Link to="/transport" className="text-slate-400 hover:text-white text-sm transition">
          ← Back
        </Link>
      </div>

      {actionData?.error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {actionData.error}
        </div>
      )}

      <Form method="post" className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Full Legal Name</label>
          <input
            name="name"
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Direct Phone Contact Number</label>
          <input
            name="phone"
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition font-mono"
            placeholder="+254..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Driving License Number</label>
            <input
              name="license_no"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition font-mono"
              placeholder="DL-XXXX"
            />
            {actionData?.fieldErrors?.license_no && (
              <p className="text-red-400 text-xs mt-1">{actionData.fieldErrors.license_no[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">License Expiry Calendar Date</label>
            <input
              type="date"
              name="license_expiry"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition"
          >
            Save Driver Registry
          </button>
          <Link to="/transport" className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition">
            Cancel
          </Link>
        </div>
      </Form>
    </div>
  );
}