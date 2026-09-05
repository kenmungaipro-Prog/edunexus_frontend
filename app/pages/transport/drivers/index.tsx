// ============================================================
// app/pages/transport/drivers/index.tsx - Manage Drivers
// ============================================================
import { useState } from "react";
import { Link, useLoaderData } from "react-router";
import { api } from "~/lib/api";

interface Driver {
  id: number;
  name: string;
  phone: string;
  license_no: string;
  license_expiry: string;
  status: string;
  created_at: string;
}

export async function clientLoader() {
  try {
    const response = await api.transport.drivers();
    return { drivers: response.data || [] };
  } catch (error) {
    console.error("Failed to load drivers:", error);
    return { drivers: [] };
  }
}

export default function DriversManagementPage() {
  const { drivers } = useLoaderData<typeof clientLoader>();
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = drivers.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.phone ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.license_no ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this driver? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingId(id);
      await api.transport.deleteDriver(id);
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete driver:", error);
      alert("Failed to delete driver");
      setDeletingId(null);
    }
  };

  const isLicenseExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isLicenseExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">👨‍✈️ Manage Drivers</h1>
          <p className="text-slate-400 text-sm mt-0.5">View, edit, or remove registered drivers</p>
        </div>
        <Link
          to="/transport/drivers/new"
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition self-start"
        >
          ➕ Add New Driver
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Drivers Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            {drivers.length === 0 ? "No drivers registered yet" : "No drivers match your search"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">License</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Expiry</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((driver) => {
                  const expired = isLicenseExpired(driver.license_expiry);
                  const expiring = isLicenseExpiringSoon(driver.license_expiry);

                  return (
                    <tr key={driver.id} className="border-b border-slate-700 hover:bg-slate-900/50 transition">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-white">{driver.name}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{driver.phone}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{driver.license_no}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-sm ${
                            expired
                              ? "text-red-400"
                              : expiring
                                ? "text-amber-400"
                                : "text-slate-300"
                          }`}
                        >
                          {new Date(driver.license_expiry).toLocaleDateString()}
                          {expired && " ⚠️ EXPIRED"}
                          {expiring && " ⚠️ EXPIRING"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            driver.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-slate-700 text-slate-400"
                          }`}
                        >
                          {driver.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/transport/drivers/${driver.id}/edit`}
                            className="px-3 py-1.5 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded text-xs font-medium transition"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(driver.id)}
                            disabled={deletingId === driver.id}
                            className="px-3 py-1.5 bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white rounded text-xs font-medium transition disabled:opacity-50"
                          >
                            {deletingId === driver.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-slate-400">
        Showing {filtered.length} of {drivers.length} drivers
      </div>
    </div>
  );
}
