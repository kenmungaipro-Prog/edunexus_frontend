// ============================================================
// app/pages/library/books/$id.tsx
// ============================================================

import { Link, Form, redirect } from "react-router";
import type { Route } from "./+types/\$id";
import { api } from "~/lib/api";

export async function clientLoader({ params }: Route.LoaderArgs) {
  try {
    const book = await api.library.get(Number(params.id));
    return book.data;
  } catch (error) {
    console.error("Failed to load book:", error);
    throw new Error("Book not found");
  }
}

export async function clientAction({ request, params }: Route.ActionArgs) {
  if (request.method === "DELETE") {
    try {
      await api.library.delete(Number(params.id));
      return redirect("/library");
    } catch (error) {
      console.error("Failed to delete book:", error);
      return { error: "Failed to delete book" };
    }
  }
  return null;
}

export default function BookDetailPage({ loaderData, actionData }: Route.ComponentProps) {
  const book = loaderData;
  const error = actionData?.error;

  const handleDelete = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm("Are you sure you want to delete this book?")) {
      e.preventDefault();
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <Link to="/library" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
          ← Back to Library
        </Link>
        <span className="text-slate-400 text-sm font-mono">{book.book_id}</span>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-8">
            {/* Book Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{book.title}</h1>
            <p className="text-slate-400 text-sm sm:text-base mb-6">by {book.author}</p>

            {/* Book Details Grid */}
            <div className="space-y-6 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                    ISBN
                  </label>
                  <p className="text-white text-base sm:text-lg font-mono mt-1">{book.isbn || "N/A"}</p>
                </div>

                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                    Category
                  </label>
                  <p className="text-white text-base sm:text-lg mt-1">
                    <span className="bg-slate-700/50 px-3 py-1 rounded-md text-sm inline-block">
                      {book.category}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                    Publisher
                  </label>
                  <p className="text-white text-base sm:text-lg mt-1">{book.publisher || "N/A"}</p>
                </div>

                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                    Year
                  </label>
                  <p className="text-white text-base sm:text-lg mt-1">{book.year || "N/A"}</p>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-6">
                <label className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                  Rack Number
                </label>
                <p className="text-white text-base sm:text-lg mt-1">{book.rack_no || "Not assigned"}</p>
              </div>
            </div>

            {/* Availability Section */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs sm:text-sm">Available Copies</p>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-1">
                    {book.available_copies} / {book.total_copies}
                  </p>
                </div>
                <div
                  className={`text-3xl sm:text-4xl ${
                    book.available_copies > 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {book.available_copies > 0 ? "✓" : "✗"}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {book.available_copies > 0 && (
                <button className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition text-sm text-center">
                  Issue Book
                </button>
              )}
              <Link to={`/library/books/${book.id}/edit`} className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition text-sm text-center">
                Edit Book
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-6">
            <h3 className="text-lg font-bold text-white mb-4">Actions</h3>

            <div className="space-y-3">
              <Link 
                  to={`/library/books/${book.id}/circulation`}
                  className="block text-center w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition"
                >
                  View Circulation
                </Link>
                <Link 
                  to={`/library/books/${book.id}/history`}
                  className="block text-center w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition"
                >
                  Issue History
              </Link>

              <Form method="delete" onSubmit={handleDelete} className="w-full">
                <button
                  type="submit"
                  className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-sm font-medium transition border border-red-500/20 hover:border-red-500 text-center"
                >
                  Delete Book
                </button>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}