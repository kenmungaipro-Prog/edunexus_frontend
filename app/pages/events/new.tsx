import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/new";
import api, { type SchoolEvent } from "~/lib/api";

export async function clientAction({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return null;
  }

  const formData = await request.formData();
  const payload = {
    title: String(formData.get("title")),
    description: formData.get("description") ? String(formData.get("description")) : null,
    event_date: String(formData.get("event_date")),
    end_date: formData.get("end_date") ? String(formData.get("end_date")) : null,
    type: String(formData.get("type")) as any,
    venue: formData.get("venue") ? String(formData.get("venue")) : null,
    notify_all: formData.get("notify_all") === "on",
  };

  try {
    await api.events.create(payload);
    return redirect("/events");
  } catch (error: any) {
    console.error("Failed to create event:", error);
    return { error: error.response?.data?.message || "Failed to create event" };
  }
}

export default function NewEventPage({ actionData }: Route.ComponentProps) {
  const error = actionData?.error;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Create New Event</h1>
          <p className="text-slate-400 text-sm mt-1">Add a new school event to the calendar</p>
        </div>
        <Link to="/events" className="text-slate-400 hover:text-white text-sm">
          ← Back to Events
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <Form method="post" className="bg-slate-800 border border-slate-700 rounded-xl p-8">
        <div className="space-y-6">
          {/* Event Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Year-End Celebration, Staff Training"
            />
          </div>

          {/* Event Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-slate-300 mb-2">
              Event Type <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Type</option>
              <option value="event">Event</option>
              <option value="exam">Exam</option>
              <option value="holiday">Holiday</option>
              <option value="meeting">Meeting</option>
              <option value="competition">Competition</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Event details and description..."
            />
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="event_date" className="block text-sm font-medium text-slate-300 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="event_date"
                name="event_date"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-slate-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Venue */}
          <div>
            <label htmlFor="venue" className="block text-sm font-medium text-slate-300 mb-2">
              Venue/Location
            </label>
            <input
              type="text"
              id="venue"
              name="venue"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Main Hall, Gymnasium, Auditorium"
            />
          </div>

          {/* Notifications */}
          <div className="border-t border-slate-700 pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="notify_all"
                className="w-4 h-4 bg-slate-900 border border-slate-700 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-300 font-medium">Notify all users about this event</span>
            </label>
            <p className="text-slate-500 text-sm mt-2">An email notification will be sent to all staff and parents</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition"
          >
            Create Event
          </button>
          <Link
            to="/events"
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition"
          >
            Cancel
          </Link>
        </div>
      </Form>
    </div>
  );
}
