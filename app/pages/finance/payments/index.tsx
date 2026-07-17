import { Link, useNavigation, useSearchParams } from "react-router";
import api, { type FinancePayment, type FinancePaymentStatus, type PaginationMeta, type PaymentMethod } from "~/lib/api";

export async function clientLoader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const status = url.searchParams.get("status") as FinancePaymentStatus | null;
  const method = url.searchParams.get("method") as PaymentMethod | null;

  const res = await api.finance.payments({ page, per_page: 20, status: status ?? undefined, method: method ?? undefined });
  return { payments: res.data.data, meta: res.data.meta };
}

function money(value: number | string | null | undefined) {
  return `KES ${Number(value ?? 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

function date(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" }) : "-";
}

export default function FinancePaymentsPage({ loaderData }: { loaderData: { payments: FinancePayment[]; meta: PaginationMeta } }) {
  const { payments, meta } = loaderData;
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
    <div className={`space-y-5 ${navigation.state === "loading" ? "opacity-60" : ""}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Register</h1>
          <p className="text-sm text-slate-400 mt-1">Cash, M-Pesa, bank, card, and online payments</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={searchParams.get("method") ?? ""} onChange={(e) => setParam("method", e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
            <option value="">All methods</option>
            <option value="cash">Cash</option>
            <option value="mpesa">M-Pesa</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="bank_deposit">Bank Deposit</option>
            <option value="card">Card</option>
            <option value="cheque">Cheque</option>
            <option value="online">Online</option>
          </select>
          <Link to="/finance/payments/mpesa-status" className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700">STK Status</Link>
          <Link to="/finance/payments/collect" className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">Collect Payment</Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">Payment</th>
                <th className="py-2 pr-3">Receipt</th>
                <th className="py-2 pr-3">Student</th>
                <th className="py-2 pr-3">Method</th>
                <th className="py-2 pr-3">Reference</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {payments.length > 0 ? payments.map((payment) => (
                <tr key={payment.id} className="text-slate-300">
                  <td className="py-3 pr-3 font-mono text-xs text-blue-400">{payment.payment_number}</td>
                  <td className="py-3 pr-3 font-mono text-xs">{payment.receipt?.receipt_number ?? "-"}</td>
                  <td className="py-3 pr-3">{payment.student?.full_name ?? "-"}</td>
                  <td className="py-3 pr-3 capitalize">{payment.payment_method.replace("_", " ")}</td>
                  <td className="py-3 pr-3 text-slate-400">{payment.reference_number ?? payment.external_transaction_id ?? "-"}</td>
                  <td className="py-3 pr-3 font-semibold text-white">{money(payment.amount)}</td>
                  <td className="py-3 pr-3 text-slate-400">{date(payment.payment_date)}</td>
                  <td className="py-3 pr-3"><span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-400">{payment.status.replace("_", " ")}</span></td>
                  <td className="py-3 pr-3">
                    <Link to={`/finance/students/${payment.student_id}/statement`} className="rounded-lg bg-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-600">Statement</Link>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={9} className="py-10 text-center text-slate-500">No payments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {meta?.last_page > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-slate-700 pt-4 text-xs text-slate-400">
            <span>Showing {meta.from}-{meta.to} of {meta.total}</span>
            <div className="flex gap-2">
              <button disabled={meta.current_page === 1} onClick={() => setParam("page", String(meta.current_page - 1))} className="rounded bg-slate-700 px-3 py-1 disabled:opacity-40">Previous</button>
              <button disabled={meta.current_page === meta.last_page} onClick={() => setParam("page", String(meta.current_page + 1))} className="rounded bg-blue-500 px-3 py-1 text-white disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
