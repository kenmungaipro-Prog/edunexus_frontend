// ============================================================
// app/pages/finance/receipts/index.tsx
// ============================================================

import { Link, useSearchParams } from "react-router";
import { api, type Receipt, type PaginationMeta } from "~/lib/api";

export async function clientLoader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const status = url.searchParams.get("status") ?? undefined;

  const res = await api.finance.receipts({ page, per_page: 20, status: status || undefined });
  return { receipts: res.data.data, meta: res.data.meta };
}

function money(value: number | string | null | undefined) {
  return `KES ${Number(value ?? 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

function date(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" }) : "-";
}

function statusClass(status: string) {
  if (status === "issued") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
  if (status === "reversed") return "bg-red-500/15 text-red-400 border-red-500/25";
  return "bg-slate-600/50 text-slate-400 border-slate-500/25";
}

export default function ReceiptsPage({
  loaderData,
}: {
  loaderData: { receipts: Receipt[]; meta: PaginationMeta };
}) {
  const { receipts, meta } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();

  function setParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      value ? next.set(key, value) : next.delete(key);
      if (key !== "page") next.delete("page");
      return next;
    });
  }

  return (
    <div className="space-y-6 p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Receipts</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Official payment acknowledgments issued to students
          </p>
        </div>
        <select
          value={searchParams.get("status") ?? ""}
          onChange={(e) => setParam("status", e.target.value)}
          className="w-full sm:w-auto rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200"
        >
          <option value="">All statuses</option>
          <option value="issued">Issued</option>
          <option value="reversed">Reversed</option>
          <option value="void">Void</option>
        </select>
      </div>

      {/* Receipts Table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 sm:px-5 py-3">Receipt #</th>
                <th className="px-4 sm:px-5 py-3">Payment #</th>
                <th className="px-4 sm:px-5 py-3">Student</th>
                <th className="px-4 sm:px-5 py-3">Class</th>
                <th className="px-4 sm:px-5 py-3">Amount</th>
                <th className="px-4 sm:px-5 py-3">Method</th>
                <th className="px-4 sm:px-5 py-3">Date</th>
                <th className="px-4 sm:px-5 py-3">Status</th>
                <th className="px-4 sm:px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {receipts.length > 0 ? receipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-slate-700/30 transition-colors group">
                  <td className="px-4 sm:px-5 py-3">
                    <span className="font-mono text-sm font-medium text-blue-400">{receipt.receipt_number}</span>
                  </td>
                  <td className="px-4 sm:px-5 py-3 text-slate-400">
                    <span className="font-mono text-xs">{receipt.payment?.payment_number ?? "-"}</span>
                  </td>
                  <td className="px-4 sm:px-5 py-3 text-white">
                    {receipt.payment?.student?.full_name ?? "-"}
                  </td>
                  <td className="px-4 sm:px-5 py-3 text-slate-400">
                    {receipt.payment?.student?.class_room?.name ?? "-"}
                  </td>
                  <td className="px-4 sm:px-5 py-3 font-semibold text-white">
                    {receipt.payment ? money(receipt.payment.amount) : "-"}
                  </td>
                  <td className="px-4 sm:px-5 py-3 text-slate-400 capitalize">
                    {receipt.payment?.payment_method?.replace("_", " ") ?? "-"}
                  </td>
                  <td className="px-4 sm:px-5 py-3 text-slate-400">
                    {date(receipt.receipt_date)}
                  </td>
                  <td className="px-4 sm:px-5 py-3">
                    <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusClass(receipt.status)}`}>
                      {receipt.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-5 py-3">
                    <Link
                      to={`/finance/students/${receipt.payment?.student_id}/statement`}
                      className="rounded-lg bg-slate-700 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-600"
                    >
                      Statement
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-slate-500">
                    No receipts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {meta?.last_page > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-700 px-5 py-4 text-xs text-slate-400">
            <span>Showing {meta.from}-{meta.to} of {meta.total}</span>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button
                disabled={meta.current_page === 1}
                onClick={() => setParam("page", String(meta.current_page - 1))}
                className="rounded bg-slate-700 px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={meta.current_page === meta.last_page}
                onClick={() => setParam("page", String(meta.current_page + 1))}
                className="rounded bg-blue-500 px-3 py-1.5 text-white disabled:opacity-40"
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