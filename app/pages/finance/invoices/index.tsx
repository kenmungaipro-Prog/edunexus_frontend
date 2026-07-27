// ============================================================
// app/pages/finance/invoices/index.tsx
// ============================================================

import { Link, useNavigation, useSearchParams } from "react-router";
import { api, type Invoice, type InvoiceStatus, type PaginationMeta } from "~/lib/api";

export async function clientLoader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const status = url.searchParams.get("status") as InvoiceStatus | null;

  const res = await api.finance.invoices({ page, per_page: 20, status: status ?? undefined });
  return { invoices: res.data.data, meta: res.data.meta };
}

function money(value: number | string | null | undefined) {
  return `KES ${Number(value ?? 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

function statusClass(status: InvoiceStatus) {
  if (status === "paid") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
  if (status === "overdue" || status === "cancelled") return "bg-red-500/15 text-red-400 border-red-500/25";
  if (status === "partially_paid") return "bg-blue-500/15 text-blue-400 border-blue-500/25";
  return "bg-amber-500/15 text-amber-400 border-amber-500/25";
}

export default function FinanceInvoicesPage({ loaderData }: { loaderData: { invoices: Invoice[]; meta: PaginationMeta } }) {
  const { invoices, meta } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();

  function setParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      value ? next.set(key, value) : next.delete(key);
      if (key !== "page") next.delete("page");
      return next;
    });
  }

  return (
    <div className={`space-y-5 p-2 sm:p-0 ${navigation.state === "loading" ? "opacity-60" : ""}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Invoice Register</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Issued student bills and balances</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
          <select value={searchParams.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value)} className="w-full sm:w-auto rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200">
            <option value="">All statuses</option>
            <option value="issued">Issued</option>
            <option value="partially_paid">Partially paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Link to="/fees/generate" className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 transition">
            🧾 Create Invoice
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2.5 pr-3">Invoice</th>
                <th className="py-2.5 pr-3">Student</th>
                <th className="py-2.5 pr-3">Class</th>
                <th className="py-2.5 pr-3">Total</th>
                <th className="py-2.5 pr-3">Paid</th>
                <th className="py-2.5 pr-3">Balance</th>
                <th className="py-2.5 pr-3">Due</th>
                <th className="py-2.5 pr-3">Status</th>
                <th className="py-2.5 pr-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {invoices.length > 0 ? invoices.map((invoice) => (
                <tr key={invoice.id} className="text-slate-300">
                  <td className="py-3 pr-3 font-mono text-xs"><Link to={`/finance/invoices/${invoice.id}`} className="text-blue-400 hover:underline">{invoice.invoice_number}</Link></td>
                  <td className="py-3 pr-3">{invoice.student?.full_name ?? "-"}</td>
                  <td className="py-3 pr-3 text-slate-400">{invoice.student?.class_room?.name ?? "-"}</td>
                  <td className="py-3 pr-3 font-semibold text-white">{money(invoice.total)}</td>
                  <td className="py-3 pr-3">{money(invoice.amount_paid)}</td>
                  <td className="py-3 pr-3">{money(invoice.balance)}</td>
                  <td className="py-3 pr-3 text-slate-400">{invoice.due_date ?? "-"}</td>
                  <td className="py-3 pr-3"><span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusClass(invoice.status)}`}>{invoice.status.replace("_", " ")}</span></td>
                  <td className="py-3 pr-3">
                    <div className="flex gap-2">
                      <Link to={`/finance/invoices/${invoice.id}`} className="rounded-lg bg-blue-600/20 px-2 py-1 text-xs text-blue-400 hover:bg-blue-600/30">View</Link>
                      <Link to={`/finance/students/${invoice.student_id}/statement`} className="rounded-lg bg-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-600">Statement</Link>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={9} className="py-10 text-center text-slate-500">No invoices found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {meta?.last_page > 1 && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-700 pt-4 text-xs text-slate-400">
            <span>Showing {meta.from}-{meta.to} of {meta.total}</span>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button disabled={meta.current_page === 1} onClick={() => setParam("page", String(meta.current_page - 1))} className="rounded bg-slate-700 px-3 py-1.5 disabled:opacity-40">Previous</button>
              <button disabled={meta.current_page === meta.last_page} onClick={() => setParam("page", String(meta.current_page + 1))} className="rounded bg-blue-500 px-3 py-1.5 text-white disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}