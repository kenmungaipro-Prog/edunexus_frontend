// ============================================================
// app/pages/transport/routes/$id.tsx
// ============================================================
import { Link, Form, redirect } from "react-router";
import type { Route } from "./+types/\$id";
import { api } from "~/lib/api";

export async function clientLoader({ params }: Route.LoaderArgs) {
  try {
    const route = await api.transport.get(Number(params.id));
    return route.data;
  } catch (error) {
    console.error("Failed to load route:", error);
    throw new Error("Route not found");
  }
}

export async function clientAction({ request, params }: Route.ActionArgs) {
  if (request.method === "DELETE") {
    try {
      await api.transport.delete(Number(params.id));
      return redirect("/transport");
    } catch (error) {
      console.error("Failed to delete route:", error);
      return { error: "Failed to delete route" };
    }
  }
  return null;
}

export default function TransportRouteDetailPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const route = loaderData;
  const error = actionData?.error;

  const handleDelete = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm("Are you sure you want to delete this route?")) {
      e.preventDefault();
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <Link to="/transport" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
          ← Back to Transport
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 sm:p-8">
            {/* Route Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">{route.name}</h1>

            {/* Route Details Grid */}
            <div className="space-y-6 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                    Vehicle
                  </label>
                  <p className="text-white text-base sm:text-lg font-mono mt-1">
                    {route.vehicle?.registration_number}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {route.vehicle?.make} {route.vehicle?.model}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                    Driver
                  </label>
                  <p className="text-white text-base sm:text-lg mt-1">{route.driver?.name}</p>
                  <p className="text-slate-400 text-sm">{route.driver?.phone}</p>
                </div>

                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                    Total Stops
                  </label>
                  <p className="text-white text-base sm:text-lg mt-1">{route.stops?.length || 0}</p>
                </div>

                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                    Assigned Students
                  </label>
                  <p className="text-white text-base sm:text-lg mt-1">{route.students_count || 0}</p>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-6">
                <label className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                  Monthly Fee
                </label>
                <p className="text-white text-xl sm:text-2xl font-bold mt-1">
                  KES {(route.monthly_fee || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Stops Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 sm:p-8">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-6">Route Stops</h3>

            {route.stops && route.stops.length > 0 ? (
              <div className="space-y-3">
                {route.stops.map((stop: any, index: number) => (
                  <div
                    key={index}
                    className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-semibold text-white text-sm sm:text-base">
                        {index + 1}. {stop.name || `Stop ${index + 1}`}
                      </p>
                      <p className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1">
                        Pickup: {stop.pickup_time} | Drop: {stop.drop_time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic text-sm">No stops configured</p>
            )}
          </div>
        </div>

        {/* Sidebar Actions */}
        <div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-white mb-4">Actions</h3>

            <div className="space-y-3">
              <Link 
                to={`/transport/routes/${route.id}/edit`} 
                className="w-full text-center block px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition"
              >
                ✏️ Edit Route
              </Link>
              
              <Link 
                to={`/transport/routes/${route.id}/assign`} 
                className="w-full text-center block px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition"
              >
                🎓 Manage Students
              </Link>
              
              <Link 
                to="/transport/live" 
                className="w-full text-center block px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition"
              >
                📡 View Live Location
              </Link>

              <Form method="delete" onSubmit={handleDelete} className="w-full pt-2 border-t border-slate-700/50">
                <button
                  type="submit"
                  className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-sm font-medium transition border border-red-500/20 hover:border-red-500"
                >
                  🗑️ Delete Route
                </button>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}