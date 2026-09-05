// ============================================================
// app/pages/transport/index.tsx
// ============================================================
import { useRevalidator, Link } from "react-router";
import { useEffect } from "react";
import type { Route as TransRoute } from "./+types/index";
import { api, type ApiResponse, type TransportRoute, type LiveVehicle } from "~/lib/api";

export async function clientLoader() {
  const [routesRes, liveRes] = await Promise.all([
    api.transport.list(),
    api.transport.live(),
  ]);

  return { 
    routes: routesRes.data,
    liveVehicles: liveRes.data,
  };
}

export default function TransportPage({ loaderData }: TransRoute.ComponentProps) {
  const { routes, liveVehicles } = loaderData;
  const revalidator = useRevalidator();

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        revalidator.revalidate();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [revalidator]);

  const stats = {
    totalVehicles: new Set(routes.map(r => r.vehicle_id)).size,
    totalRoutes: routes.length,
    totalStudents: routes.reduce((sum, r) => sum + (r.students_count || 0), 0),
    activeNow: liveVehicles.filter(v => v.speed !== null).length,
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white">🚌 Transport Management</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Real-time fleet tracking and route management</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button 
            onClick={() => revalidator.revalidate()}
            className="px-3 sm:px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-700 transition"
          >
            🔄 Refresh
          </button>
          <Link to="/transport/tracker" className="px-3 sm:px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-700 transition">
            👪 Parent Tracker
          </Link>
          <Link to="/transport/live" className="px-3 sm:px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-700 transition">
            📡 Live Map
          </Link>
          <Link to="/transport/analytics" className="px-3 sm:px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-700 transition">
            📊 Analytics
          </Link>
          <Link to="/transport/playback" className="px-3 sm:px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-700 transition">
            ▶️ Playback
          </Link>
          <Link to="/transport/notifications" className="px-3 sm:px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-700 transition">
            🔔 Notifications
          </Link>
          <Link to="/transport/vehicles" className="px-3 sm:px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-700 transition">
            🚌 Manage Buses
          </Link>
          <Link to="/transport/drivers" className="px-3 sm:px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-700 transition">
            👨‍✈️ Manage Drivers
          </Link>
          <Link to="/transport/routes" className="px-3 sm:px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-700 transition">
            🗺️ Manage Routes
          </Link>
          <Link to="/transport/vehicles/new" className="px-3 sm:px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-700 transition">
            🚛 Add Vehicle
          </Link>
          <Link to="/transport/drivers/new" className="px-3 sm:px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-700 transition">
            👨‍✈️ Add Driver
          </Link>
          <Link to="/transport/new" className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-xs sm:text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-blue-500/20">
            ➕ Add Route
          </Link>
        </div>
      </div>

      {/* Dynamic Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: "🚌", val: stats.totalVehicles, label: "Registered Vehicles", color: "text-blue-400" },
          { icon: "🗺️", val: stats.totalRoutes, label: "Active Routes", color: "text-emerald-400" },
          { icon: "🎓", val: stats.totalStudents, label: "Assigned Students", color: "text-amber-400" },
          { icon: "📡", val: `${stats.activeNow} / ${stats.totalVehicles}`, label: "Live on Road", color: "text-violet-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-slate-900/50 flex items-center justify-center text-2xl shadow-inner shrink-0">
              {s.icon}
            </div>
            <div>
              <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="bg-slate-900/50">
              <tr className="border-b border-slate-700">
                <th className="py-4 px-4 text-xs text-slate-500 uppercase font-bold">Route Name</th>
                <th className="py-4 px-4 text-xs text-slate-500 uppercase font-bold">Vehicle Info</th>
                <th className="py-4 px-4 text-xs text-slate-500 uppercase font-bold">Driver</th>
                <th className="py-4 px-4 text-xs text-slate-500 uppercase font-bold text-center">Stops</th>
                <th className="py-4 px-4 text-xs text-slate-500 uppercase font-bold text-center">Students</th>
                <th className="py-4 px-4 text-xs text-slate-500 uppercase font-bold">Live Status</th>
                <th className="py-4 px-4 text-xs text-slate-500 uppercase font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {routes.length > 0 ? (
                routes.map((route) => {
                  const liveInfo = liveVehicles.find(lv => lv.vehicle_id === route.vehicle_id);
                  const isMoving = liveInfo && (liveInfo.speed ?? 0) > 0;

                  return (
                    <tr key={route.id} className="hover:bg-slate-700/20 transition-colors group">
                      <td className="py-4 px-4 font-semibold text-slate-200">
                        {route.name}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-blue-400 font-bold">{route.vehicle?.registration_number}</span>
                          <span className="text-[10px] text-slate-500">{route.vehicle?.make} {route.vehicle?.model}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-300">
                        <div className="flex flex-col">
                          <span>{route.driver?.name}</span>
                          <span className="text-[10px] text-slate-500">{route.driver?.phone}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-2 py-1 bg-slate-900 rounded text-slate-400 text-xs">
                          {route.stops?.length || 0}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-200">
                        {route.students_count || 0}
                      </td>
                      <td className="py-4 px-4">
                        {liveInfo ? (
                          <div className="flex items-center gap-2">
                            <span className={`relative flex h-2 w-2`}>
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isMoving ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${isMoving ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                            </span>
                            <span className={`text-xs font-medium ${isMoving ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {isMoving ? `${liveInfo.speed} km/h` : 'Stationary'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 italic">Offline</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link to={`/transport/routes/${route.id}`} className="px-3 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-lg hover:bg-blue-600 hover:text-white transition shadow-sm">
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 italic">
                    No transport routes found. Click "Add Route" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}