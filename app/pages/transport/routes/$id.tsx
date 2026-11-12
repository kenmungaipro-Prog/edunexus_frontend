// ============================================================
// app/pages/transport/routes/$id.tsx
// ============================================================
import { useState } from "react";
import { Link, Form, redirect } from "react-router";
import type { Route } from "./+types/\$id";
import { api, type Student } from "~/lib/api";
import { PrintTools } from "~/components/PrintTools";
import { PrintListButton } from "~/components/PrintListButton";

const actionItemClass =
  "flex w-full items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-left text-sm font-semibold text-slate-200 shadow-sm transition hover:border-blue-500/50 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

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
  const [studentSearch, setStudentSearch] = useState("");
  const [showStops, setShowStops] = useState(false);
  const [showStudents, setShowStudents] = useState(false);
  const routeStudents = route.students ?? [];
  const filteredStudents = routeStudents.filter((student) =>
    [
      student.full_name,
      student.admission_no,
      student.class_room?.name,
      student.pivot?.stop,
    ].some((value) => value?.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  const handleDelete = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm("Are you sure you want to delete this route?")) {
      e.preventDefault();
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <PrintTools title={`Transport Route — ${route.name}`} />
      <div className="mb-6 space-y-5 sm:mb-8">
        <Link
          to="/transport/routes"
          target="_self"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
        >
          <span aria-hidden="true">←</span> Back to routes
        </Link>
        <div className="overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 via-slate-800 to-blue-950/60 shadow-xl shadow-black/10">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-2xl" aria-hidden="true">
                🚌
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">Transport route</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{route.name}</h1>
                <p className="mt-2 text-sm text-slate-400">
                  {route.vehicle?.registration_number || "No bus assigned"}
                  <span className="px-2 text-slate-600">·</span>
                  {route.driver?.name || "No driver assigned"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-200">
                {routeStudents.length} students
              </span>
              <span className="rounded-full border border-slate-600 bg-slate-900/50 px-3 py-1.5 text-xs font-semibold text-slate-300">
                {route.stops?.length ?? 0} stops
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-lg shadow-black/10 sm:p-7">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Route information</p>
              <h2 className="mt-1 text-lg font-bold text-white">At a glance</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-700/80 bg-slate-900/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bus</p>
                <p className="mt-2 font-mono text-lg font-semibold text-white">{route.vehicle?.registration_number || "Not assigned"}</p>
                <p className="mt-1 text-sm text-slate-400">{[route.vehicle?.make, route.vehicle?.model].filter(Boolean).join(" ") || "Vehicle details unavailable"}</p>
              </div>
              <div className="rounded-xl border border-slate-700/80 bg-slate-900/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Driver</p>
                <p className="mt-2 text-lg font-semibold text-white">{route.driver?.name || "Not assigned"}</p>
                <p className="mt-1 text-sm text-slate-400">{route.driver?.phone || "Phone unavailable"}</p>
              </div>
              <div className="rounded-xl border border-slate-700/80 bg-slate-900/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Route capacity</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {routeStudents.length}{route.vehicle?.capacity ? ` / ${route.vehicle.capacity}` : ""}
                  <span className="ml-1 text-sm font-normal text-slate-400">students</span>
                </p>
                {route.vehicle?.capacity && routeStudents.length > route.vehicle.capacity ? (
                  <p className="mt-1 text-xs font-medium text-amber-300">Student count exceeds bus capacity</p>
                ) : (
                  <p className="mt-1 text-sm text-slate-400">{route.stops?.length ?? 0} planned stops</p>
                )}
              </div>
              <div className="rounded-xl border border-slate-700/80 bg-slate-900/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Monthly fee</p>
                <p className="mt-2 text-lg font-semibold text-white">KES {(route.monthly_fee || 0).toLocaleString()}</p>
                <p className="mt-1 text-sm text-slate-400">Per student</p>
              </div>
            </div>
          </section>

          {showStops && (
            <section id="route-stops" className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-lg shadow-black/10 sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Route plan</p>
                <h3 className="mt-1 text-lg font-bold text-white">Route stops</h3>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">{route.stops?.length ?? 0}</span>
            </div>

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
            </section>
          )}

          {showStudents && (
            <section id="bus-students" className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-lg shadow-black/10 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Students on this bus</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {route.vehicle?.registration_number || "Bus not assigned"} · {route.name} · {routeStudents.length} students
                </p>
              </div>
              <PrintListButton
                title={`Bus Roster — ${route.vehicle?.registration_number || route.name}`}
                filterSummary={`Route: ${route.name}${studentSearch ? ` · Search: ${studentSearch}` : ""}`}
                loadRows={() => Promise.resolve(filteredStudents)}
                columns={[
                  { label: "Student", value: (student: Student) => student.full_name },
                  { label: "Admission No.", value: (student: Student) => student.admission_no },
                  { label: "Class", value: (student: Student) => student.class_room?.name },
                  { label: "Pickup / Drop-off Stop", value: (student: Student & { pivot?: { stop?: string } }) => student.pivot?.stop },
                  { label: "Parent Phone", value: (student: Student) => student.parent_phone ?? student.parent?.phone },
                ]}
              />
            </div>

            <label className="block mb-4">
              <span className="sr-only">Search students on this route</span>
              <input
                type="search"
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder="Search by student, admission number, class, or stop..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />
            </label>

            {filteredStudents.length === 0 ? (
              <p className="rounded-lg border border-slate-700 bg-slate-900/40 p-5 text-center text-sm text-slate-400">
                {routeStudents.length === 0
                  ? "No students are assigned to this route yet."
                  : "No students match your search."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="border-b border-slate-700 text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-3 py-3 font-semibold">Student</th>
                      <th className="px-3 py-3 font-semibold">Admission No.</th>
                      <th className="px-3 py-3 font-semibold">Class</th>
                      <th className="px-3 py-3 font-semibold">Pickup / Drop-off Stop</th>
                      <th className="px-3 py-3 font-semibold">Parent Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-b border-slate-700/70 text-sm last:border-0">
                        <td className="px-3 py-3 font-medium text-white">{student.full_name}</td>
                        <td className="px-3 py-3 font-mono text-slate-300">{student.admission_no}</td>
                        <td className="px-3 py-3 text-slate-300">{student.class_room?.name ?? "—"}</td>
                        <td className="px-3 py-3 text-slate-300">{student.pivot?.stop ?? "—"}</td>
                        <td className="px-3 py-3 text-slate-300">{student.parent_phone ?? student.parent?.phone ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-4 text-xs text-slate-500">
              Showing {filteredStudents.length} of {routeStudents.length} assigned students.
            </p>
            </section>
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-lg shadow-black/10 sm:p-6 lg:sticky lg:top-6">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Manage this route</p>
              <h3 className="mt-1 text-lg font-bold text-white">Actions</h3>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                aria-expanded={showStops}
                aria-controls="route-stops"
                onClick={() => setShowStops((visible) => !visible)}
                className={actionItemClass}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-base" aria-hidden="true">📍</span>
                <span className="flex-1">{showStops ? "Hide route stops" : "View route stops"}</span>
                <span className="text-xs text-slate-500">{route.stops?.length ?? 0}</span>
              </button>

              <button
                type="button"
                aria-expanded={showStudents}
                aria-controls="bus-students"
                onClick={() => setShowStudents((visible) => !visible)}
                className={actionItemClass}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-base" aria-hidden="true">🚌</span>
                <span className="flex-1">{showStudents ? "Hide bus students" : "View bus students"}</span>
                <span className="text-xs text-slate-500">{routeStudents.length}</span>
              </button>

              <Link 
                to={`/transport/routes/${route.id}/edit`} 
                target="_self"
                className={actionItemClass}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-base" aria-hidden="true">✏️</span>
                <span>Edit route</span>
              </Link>
              
              <Link 
                to={`/transport/routes/${route.id}/assign`} 
                target="_self"
                className={actionItemClass}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-base" aria-hidden="true">🎓</span>
                <span>Manage students</span>
              </Link>
              
              <Link 
                to="/transport/live" 
                target="_self"
                className={actionItemClass}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-base" aria-hidden="true">📡</span>
                <span>View live location</span>
              </Link>

              <Form method="delete" onSubmit={handleDelete} className="border-t border-slate-700/70 pt-3">
                <button
                  type="submit"
                  className={`${actionItemClass} text-red-300 hover:border-red-500/50 hover:bg-red-500/10`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-base" aria-hidden="true">🗑️</span>
                  <span>Delete route</span>
                </button>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}