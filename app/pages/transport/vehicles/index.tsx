// ============================================================
// app/pages/transport/vehicles/index.tsx - Manage Vehicles/Buses
// ============================================================
import { useState } from "react";
import { Link, useLoaderData } from "react-router";
import { api } from "~/lib/api";
import type { Vehicle } from "~/lib/api";



export async function clientLoader() {
  try {
    const response = await api.transport.vehicles();
    return { vehicles: response.data || [] };
  } catch (error) {
    console.error("Failed to load vehicles:", error);
    return { vehicles: [] };
  }
}

export default function VehiclesManagementPage() {
  const { vehicles } = useLoaderData<typeof clientLoader>();
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = vehicles.filter((v) =>
    v.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.make ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this vehicle? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingId(id);
      await api.transport.deleteVehicle(id);
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete vehicle:", error);
      alert("Failed to delete vehicle");
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">🚌 Manage Buses</h1>
          <p className="text-slate-400 text-sm mt-0.5">View, edit, or remove registered vehicles</p>
        </div>
        <Link
          to="/transport/vehicles/new"
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition self-start"
        >
          ➕ Add New Bus
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by registration number or make..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Vehicles Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            {vehicles.length === 0 ? "No buses registered yet" : "No buses match your search"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Registration</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Make & Model</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">  Last Update</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b border-slate-700 hover:bg-slate-900/50 transition">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-white">{vehicle.registration_number}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {vehicle.make} {vehicle.model}
                    </td>
                    <td className="px-6 py-4 text-slate-300">{vehicle.capacity} seats</td>
                    <td className="px-6 py-4 text-slate-300">{vehicle.year}</td>
                    <td className="px-6 py-4 text-slate-300"> {vehicle.location_updated_at ? new Date(vehicle.location_updated_at).toLocaleDateString() : "—"} </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/transport/vehicles/${vehicle.id}/edit`}
                          className="px-3 py-1.5 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded text-xs font-medium transition"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          disabled={deletingId === vehicle.id}
                          className="px-3 py-1.5 bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white rounded text-xs font-medium transition disabled:opacity-50"
                        >
                          {deletingId === vehicle.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-slate-400">
        Showing {filtered.length} of {vehicles.length} buses
      </div>
    </div>
  );
}
