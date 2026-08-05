import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/edit-$id";
import { api, type Book } from "~/lib/api";

interface LoaderData {
  book: Book;
}

export async function clientLoader({ params }: Route.LoaderArgs) {
  const book = await api.library.get(Number(params.id));
  return { book: book.data };
}

export async function clientAction({ request, params }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return null;
  }

  const formData = await request.formData();
  const payload: Partial<Book> = {
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
    await api.library.update(Number(params.id), payload);
    return redirect(`/library/books/${params.id}`);
  } catch (error: any) {
    return { error: error.response?.data?.message || "Failed to update book." };
  }
}

export default function EditBookPage({ loaderData, actionData }: Route.ComponentProps) {
  const { book } = loaderData as LoaderData;
  const error = actionData?.error;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Edit Book</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Update book details and save the changes.</p>
        </div>
        <Link to={`/library/books/${book.id}`} className="text-slate-400 hover:text-white text-sm">
          ← Back to Book Details
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <Form method="post" className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="md:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
              Book Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              defaultValue={book.title}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter book title"
            />
          </div>

          <div>
            <label htmlFor="author" className="block text-sm font-medium text-slate-300 mb-2">
              Author <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="author"
              name="author"
              defaultValue={book.author}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Author name"
            />
          </div>

          <div>
            <label htmlFor="isbn" className="block text-sm font-medium text-slate-300 mb-2">
              ISBN
            </label>
            <input
              type="text"
              id="isbn"
              name="isbn"
              defaultValue={book.isbn ?? ""}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="ISBN number"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="category"
              name="category"
              defaultValue={book.category}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g., Fiction, Science, History"
            />
          </div>

          <div>
            <label htmlFor="publisher" className="block text-sm font-medium text-slate-300 mb-2">
              Publisher
            </label>
            <input
              type="text"
              id="publisher"
              name="publisher"
              defaultValue={book.publisher ?? ""}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Publisher name"
            />
          </div>

          <div>
            <label htmlFor="year" className="block text-sm font-medium text-slate-300 mb-2">
              Year
            </label>
            <input
              type="number"
              id="year"
              name="year"
              defaultValue={book.year ?? ""}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Publication year"
            />
          </div>

          <div>
            <label htmlFor="total_copies" className="block text-sm font-medium text-slate-300 mb-2">
              Total Copies <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="total_copies"
              name="total_copies"
              defaultValue={book.total_copies}
              min="1"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="rack_no" className="block text-sm font-medium text-slate-300 mb-2">
              Rack Number
            </label>
            <input
              type="text"
              id="rack_no"
              name="rack_no"
              defaultValue={book.rack_no ?? ""}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Shelf location"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">
          <Link
            to={`/library/books/${book.id}`}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition text-sm text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition text-sm text-center"
          >
            Save Book
          </button>
        </div>
      </Form>
    </div>
  );
}
