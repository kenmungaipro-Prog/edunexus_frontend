// ============================================================
// app/pages/transport/routes/index.tsx - Manage Routes
// ============================================================
import { useState } from "react";
import { Link, useLoaderData } from "react-router";
import { api, type TransportRoute } from "~/lib/api";

export async function clientLoader() {
  try {
    const response = await api.transport.list();
    return { routes: response.data || [] };
  } catch (error) {
    console.error("Failed to load routes:", error);
    return { routes: [] };
  }
}

export default function RoutesManagementPage() {
  const { routes } = useLoaderData<typeof clientLoader>();
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = routes.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.vehicle?.registration_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this route? This action cannot be undone and will affect assigned students."
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);
      await api.transport.delete(id);
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete route:", error);
      alert("Failed to delete route. It may have dependencies.");
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">🗺️ Manage Routes</h1>
          <p className="text-slate-400 text-sm mt-0.5">View, edit, or remove registered routes</p>
        </div>
        <Link
          to="/transport/new"
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition self-start"
        >
          ➕ Add New Route
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by route name or bus registration..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Routes Grid */}
      {filtered.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
          {routes.length === 0 ? "No routes configured yet" : "No routes match your search"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((route) => (
            <div key={route.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{route.name}</h3>
                  <span className="inline-block px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs font-semibold">
                    {route.stops?.length || 0} stops
                  </span>
                </div>
                <p className="text-slate-400 text-sm">
                  🚌 {route.vehicle?.registration_number || "No vehicle"}
                </p>
                <p className="text-slate-400 text-sm">
                  👨‍✈️ {route.driver?.name || "No driver"}
                </p>
              </div>

              <div className="space-y-2 mb-4 pb-4 border-b border-slate-700">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Students:</span>
                  <span className="text-white font-semibold">{route.students_count || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Fee:</span>
                  <span className="text-white font-semibold">KES {(route.monthly_fee || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                {route.stops && route.stops.length > 0 && (
                  <div className="text-sm">
                    <span className="text-slate-400 text-xs uppercase">Stops:</span>
                    <div className="mt-1 space-y-1">
                      {route.stops.slice(0, 2).map((stop: any, idx: number) => (
                        <div key={idx} className="text-xs text-slate-300">
                          📍 {stop.name}
                        </div>
                      ))}
                      {route.stops.length > 2 && (
                        <div className="text-xs text-slate-500">+{route.stops.length - 2} more stops</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                <Link
                  to={`/transport/routes/${route.id}`}
                  className="flex-1 px-3 py-2 bg-slate-900 text-slate-300 hover:text-white rounded text-xs font-medium text-center transition"
                >
                  View
                </Link>
                <Link
                  to={`/transport/routes/${route.id}/edit`}
                  className="flex-1 px-3 py-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded text-xs font-medium text-center transition"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(route.id)}
                  disabled={deletingId === route.id}
                  className="flex-1 px-3 py-2 bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white rounded text-xs font-medium transition disabled:opacity-50"
                >
                  {deletingId === route.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-sm text-slate-400">
        Showing {filtered.length} of {routes.length} routes
      </div>
    </div>
  );
}
