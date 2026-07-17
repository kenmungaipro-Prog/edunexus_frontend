import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/new";
import api, { type Book } from "~/lib/api";

export async function clientAction({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return null;
  }

  const formData = await request.formData();
  const payload: Omit<Book, "id" | "book_id" | "available_copies" | "is_available"> = {
    title: String(formData.get("title")),
    author: String(formData.get("author")),
    isbn: formData.get("isbn") ? String(formData.get("isbn")) : null,
    category: String(formData.get("category")),
    publisher: formData.get("publisher") ? String(formData.get("publisher")) : null,
    year: formData.get("year") ? Number(formData.get("year")) : null,
    total_copies: Number(formData.get("total_copies")) || 1,
    rack_no: formData.get("rack_no") ? String(formData.get("rack_no")) : null,
  };

  try {
    await api.library.create(payload);
    return redirect("/library");
  } catch (error) {
    console.error("Failed to create book:", error);
    return { error: "Failed to create book" };
  }
}

export default function NewBookPage({ actionData }: Route.ComponentProps) {
  const error = actionData?.error;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Add New Book</h1>
          <p className="text-slate-400 text-sm mt-1">Register a new book in the library system</p>
        </div>
        <Link to="/library" className="text-slate-400 hover:text-white text-sm">
          ← Back to Library
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <Form method="post" className="bg-slate-800 border border-slate-700 rounded-xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="md:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
              Book Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter book title"
            />
          </div>

          {/* Author */}
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-slate-300 mb-2">
              Author <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="author"
              name="author"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Author name"
            />
          </div>

          {/* ISBN */}
          <div>
            <label htmlFor="isbn" className="block text-sm font-medium text-slate-300 mb-2">
              ISBN
            </label>
            <input
              type="text"
              id="isbn"
              name="isbn"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ISBN number"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="category"
              name="category"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Fiction, Science, History"
            />
          </div>

          {/* Publisher */}
          <div>
            <label htmlFor="publisher" className="block text-sm font-medium text-slate-300 mb-2">
              Publisher
            </label>
            <input
              type="text"
              id="publisher"
              name="publisher"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Publisher name"
            />
          </div>

          {/* Year */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-slate-300 mb-2">
              Year
            </label>
            <input
              type="number"
              id="year"
              name="year"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Publication year"
            />
          </div>

          {/* Total Copies */}
          <div>
            <label htmlFor="total_copies" className="block text-sm font-medium text-slate-300 mb-2">
              Total Copies <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="total_copies"
              name="total_copies"
              required
              min="1"
              defaultValue="1"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Rack Number */}
          <div>
            <label htmlFor="rack_no" className="block text-sm font-medium text-slate-300 mb-2">
              Rack Number
            </label>
            <input
              type="text"
              id="rack_no"
              name="rack_no"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Shelf location"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition"
          >
            Create Book
          </button>
          <Link
            to="/library"
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition"
          >
            Cancel
          </Link>
        </div>
      </Form>
    </div>
  );
}
