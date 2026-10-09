import { Link } from "react-router";
import type { Route } from "./+types/history";
import { api, type Book, type BookIssue } from "~/lib/api";

interface LoadedHistory {
  book: Book;
  issues: BookIssue[];
}

interface LoaderError {
  error: string;
}

type LoaderData = LoadedHistory | LoaderError;

export async function clientLoader({ params }: Route.LoaderArgs): Promise<LoaderData> {
  const bookId = Number(params.id);
  if (!Number.isSafeInteger(bookId) || bookId < 1) {
    return { error: "The book ID is invalid. Return to the library and open a book again." };
  }

  try {
    const [bookResponse, issuesResponse] = await Promise.all([
      api.library.get(bookId),
      api.library.issues(bookId),
    ]);

    if (!bookResponse?.data || !Array.isArray(issuesResponse?.data)) {
      return { error: "The book's issue history could not be loaded. Please try again." };
    }

    return { book: bookResponse.data, issues: issuesResponse.data };
  } catch (error: unknown) {
    console.error("Failed to load book issue history:", error);
    return {
      error: "The book's issue history could not be loaded. Check your connection and try again.",
    };
  }
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function IssueHistoryPage({ loaderData }: Route.ComponentProps) {
  if (!loaderData || "error" in loaderData) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <div role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {loaderData?.error ?? "The book's issue history could not be loaded. Please try again."}
        </div>
        <Link
          to="/library"
          className="inline-flex rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
        >
          ← Back to library
        </Link>
      </div>
    );
  }

  const { book, issues } = loaderData;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Issue history</h1>
          <p className="mt-1 text-sm text-slate-400">{book.title} · {issues.length} total {issues.length === 1 ? "record" : "records"}</p>
        </div>
        <Link
          to={`/library/books/${book.id}`}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-center text-sm text-slate-300 hover:bg-slate-700"
        >
          ← Back to book
        </Link>
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
        {issues.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No issue history has been recorded for this book.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-900/60 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="p-4 font-medium">Borrower</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Issued</th>
                  <th className="p-4 font-medium">Due</th>
                  <th className="p-4 font-medium">Returned</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 text-right font-medium">Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {issues.map(issue => (
                  <tr key={issue.id}>
                    <td className="p-4 font-medium text-slate-200">{issue.member?.name ?? `Member #${issue.member_id}`}</td>
                    <td className="p-4 capitalize text-slate-400">{issue.member?.role ?? "—"}</td>
                    <td className="p-4 text-slate-400">{formatDate(issue.issued_at)}</td>
                    <td className="p-4 text-slate-400">{formatDate(issue.due_date)}</td>
                    <td className="p-4 text-slate-400">{formatDate(issue.returned_at)}</td>
                    <td className="p-4">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        issue.status === "issued"
                          ? "border-blue-500/20 bg-blue-500/10 text-blue-300"
                          : issue.status === "returned"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                            : "border-red-500/20 bg-red-500/10 text-red-300"
                      }`}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="p-4 text-right text-slate-300">KES {Number(issue.fine_amount).toLocaleString("en-KE")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
