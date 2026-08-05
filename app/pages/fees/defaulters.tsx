// app/pages/fees/defaulters.tsx
import { Link, useNavigation, useSearchParams } from "react-router";
import { api, type PaginationMeta, type Student } from "~/lib/api";

export async function clientLoader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const res = await api.fees.defaulters({ page, per_page: 20 });
  return { defaulters: res.data.data, meta: res.data.meta };
}

type Defaulter = Student & { overdue_amount: number };

function formatMoney(value: number | string | null | undefined): string {
  return `KES ${Number(value ?? 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

export default function FeeDefaultersPage({
  loaderData,
}: {
  loaderData: { defaulters: Defaulter[]; meta: PaginationMeta };
}) {
  const { defaulters, meta } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  function setPage(page: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(page));
      return next;
    });
  }

  return (
    <div className={`space-y-5 p-2 sm:p-0 ${isLoading ? "opacity-60" : ""}`}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Fee Defaulters</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Students with overdue fee balances
          </p>
        </div>
        <Link
          to="/fees"
          className="text-sm text-slate-300 hover:text-white rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 transition-colors"
        >
          ← Back to Fees Dashboard
        </Link>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2.5 pr-3">Student</th>
                <th className="py-2.5 pr-3">Class</th>
                <th className="py-2.5 pr-3">Phone</th>
                <th className="py-2.5 pr-3">Overdue Amount</th>
                <th className="py-2.5 pr-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {defaulters.length > 0 ? (
                defaulters.map((student) => (
                  <tr
                    key={student.id}
                    className="text-slate-300 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3 pr-3 max-w-[220px] truncate whitespace-nowrap overflow-hidden font-medium">
                      {student.full_name}
                    </td>
                    <td className="py-3 pr-3 text-slate-400 max-w-[160px] truncate whitespace-nowrap overflow-hidden">
                      {student.class_room?.name ?? "—"}
                    </td>
                    <td className="py-3 pr-3 text-slate-400 max-w-[160px] truncate whitespace-nowrap overflow-hidden">
                      {student.parent?.phone ?? "—"}
                    </td>
                    <td className="py-3 pr-3 font-semibold text-white">
                      {formatMoney(student.overdue_amount)}
                    </td>
                    <td className="py-3 pr-3">
                      <Link
                        to={`/students/${student.id}`}
                        className="inline-block rounded-lg bg-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-600 transition-colors cursor-pointer"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    No defaulters found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-700 pt-4 text-xs text-slate-400">
            <span>
              Showing {meta.from}–{meta.to} of {meta.total.toLocaleString()}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(meta.current_page - 1)}
                disabled={meta.current_page === 1}
                className="rounded-lg bg-slate-700 px-4 py-1.5 disabled:opacity-40 hover:bg-slate-600 transition-colors disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="px-3 text-slate-500">
                Page {meta.current_page} of {meta.last_page}
              </span>

              <button
                onClick={() => setPage(meta.current_page + 1)}
                disabled={meta.current_page === meta.last_page}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-white hover:bg-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
