// ============================================================
// app/pages/transport/routes/assign.tsx
// ============================================================
import React from "react";
import { Form, Link, redirect, useActionData, useLoaderData } from "react-router";
import { api, type ApiResponse, type TransportRoute, type Student } from "~/lib/api";

export async function clientLoader({ params }: any) {
  try {
    // Fetch the specific route to get its configured stops, and the student list
    const [routeRes, studentsRes] = await Promise.all([
      api.get<ApiResponse<TransportRoute>>(`/transport/routes/${params.id}`),
      api.get<ApiResponse<{ data: Student[] }>>("/students?per_page=1000"), // Fetching a large batch for the dropdown
    ]);
    
    return {
      route: routeRes.data.data,
      students: studentsRes.data.data.data, // Unwrapping pagination
    };
  } catch (error) {
    console.error("Failed to load route or student data:", error);
    throw new Error("Required resources not found");
  }
}

export async function clientAction({ request, params }: any) {
  const formData = await request.formData();
  
  const payload = {
    student_id: Number(formData.get("student_id")),
    stop: String(formData.get("stop")),
  };

  try {
    // Calls TransportController.assignStudent via the API client
    await api.post(`/transport/routes/${params.id}/assign`, payload);
    return redirect(`/transport/routes/${params.id}`);
  } catch (error: any) {
    const responseData = error.response?.data;
    return {
      error: responseData?.message || "Failed to assign student to route.",
      fieldErrors: responseData?.errors || {},
    };
  }
}

export default function AssignStudentRoutePage() {
  const { route, students } = useLoaderData<typeof clientLoader>();
  const actionData = useActionData<typeof clientAction>();

  // Filter out students who are already assigned to this route
  const unassignedStudents = students.filter(
    (student) => !route.students?.some((assigned) => assigned.id === student.id)
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🎓 Assign Student to Route</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Mapping student transit for <span className="text-blue-400 font-semibold">{route.name}</span>
          </p>
        </div>
        <Link to={`/transport/routes/${route.id}`} className="text-slate-400 hover:text-white text-sm transition">
          ← Back to Route
        </Link>
      </div>

      {actionData?.error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {actionData.error}
        </div>
      )}

      <Form method="post" className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
        
        {/* Read-Only Route Summary */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 mb-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Vehicle</p>
              <p className="text-sm text-slate-300 font-mono mt-1">{route.vehicle?.registration_number}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Current Load</p>
              <p className="text-sm text-slate-300 mt-1">{route.students?.length || 0} Students</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Select Student</label>
          <select
            name="student_id"
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            <option value="">-- Choose an unassigned student --</option>
            {unassignedStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name} ({s.admission_no})
              </option>
            ))}
          </select>
          {actionData?.fieldErrors?.student_id && (
            <p className="text-red-400 text-xs mt-1">{actionData.fieldErrors.student_id[0]}</p>
          )}
          {unassignedStudents.length === 0 && (
            <p className="text-amber-400 text-xs mt-2 italic">All available students are already assigned to this route.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Designated Drop/Pickup Stop</label>
          <select
            name="stop"
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            <option value="">-- Select a predefined route stop --</option>
            {route.stops?.map((stop, index) => (
              <option key={index} value={stop.name}>
                {stop.name} (Pick: {stop.pickup_time} / Drop: {stop.drop_time})
              </option>
            ))}
          </select>
          {actionData?.fieldErrors?.stop && (
            <p className="text-red-400 text-xs mt-1">{actionData.fieldErrors.stop[0]}</p>
          )}
        </div>

        <div className="flex gap-4 pt-4 border-t border-slate-700">
          <button
            type="submit"
            disabled={unassignedStudents.length === 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assign Student
          </button>
          <Link
            to={`/transport/routes/${route.id}`}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition"
          >
            Cancel
          </Link>
        </div>
      </Form>
    </div>
  );
}