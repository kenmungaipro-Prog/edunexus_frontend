import { Link, useNavigation, useSearchParams } from "react-router";
import { api, type FinancePayment, type FinancePaymentStatus, type PaginationMeta, type PaymentMethod } from "~/lib/api";

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

function getStatusBadge(status: string) {
  const normalized = status.toLowerCase().replace("_", " ");
  switch (normalized) {
    case "completed":
    case "success":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "pending":
    case "processing":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "failed":
    case "cancelled":
    case "reversed":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}

function getMethodBadge(method: string) {
  const normalized = method.toLowerCase();
  switch (normalized) {
    case "mpesa":
      return { label: "M-Pesa", icon: "📱", color: "text-emerald-400" };
    case "cash":
      return { label: "Cash", icon: "💵", color: "text-amber-400" };
    case "bank_transfer":
    case "bank_deposit":
      return { label: "Bank", icon: "🏦", color: "text-blue-400" };
    case "card":
      return { label: "Card", icon: "💳", color: "text-purple-400" };
    case "cheque":
      return { label: "Cheque", icon: "📝", color: "text-cyan-400" };
    default:
      return { label: method.replace("_", " "), icon: "🌐", color: "text-slate-400" };
  }
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

  const currentStatus = searchParams.get("status") ?? "";
  const currentMethod = searchParams.get("method") ?? "";

  // Summary computations
  const totalAmountOnPage = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  return (
    <div className={`p-3 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-200 transition-opacity duration-200 ${navigation.state === "loading" ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
      
      {/* ── Page Header & Top Actions ────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-xl sm:text-2xl">💳</span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Payment Register</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">Track Cash, M-Pesa, Bank, and Card payment collections</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link 
            to="/finance/payments/mpesa-status" 
            className="flex-1 sm:flex-none text-center rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition shadow-sm flex items-center justify-center gap-2"
          >
            <span>📱</span>
            <span>STK Status</span>
          </Link>
          <Link 
            to="/finance/payments/collect" 
            className="flex-1 sm:flex-none text-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <span>+</span>
            <span>Collect Payment</span>
          </Link>
        </div>
      </div>

      {/* ── Quick Stats Metrics Row ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Page Volume</p>
            <p className="text-lg font-bold text-white mt-0.5">{money(totalAmountOnPage)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            💰
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Transactions</p>
            <p className="text-lg font-bold text-white mt-0.5">{meta?.total ?? payments.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            📑
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Filters</p>
            <p className="text-xs font-semibold text-slate-300 mt-1 capitalize truncate">
              {currentMethod || currentStatus ? `${currentMethod || "All methods"} • ${currentStatus || "All statuses"}` : "None (Showing All)"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            ⚡
          </div>
        </div>
      </div>

      {/* ── Filters Toolbar ─────────────────────────────────── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          {/* Method Selector */}
          <select 
            value={currentMethod} 
            onChange={(e) => setParam("method", e.target.value)} 
            className="bg-slate-800 border border-slate-700/80 text-white text-xs sm:text-sm rounded-xl px-3.5 py-2 outline-none focus:border-blue-500 transition cursor-pointer"
          >
            <option value="">All Methods</option>
            <option value="cash">💵 Cash</option>
            <option value="mpesa">📱 M-Pesa</option>
            <option value="bank_transfer">🏦 Bank Transfer</option>
            <option value="bank_deposit">🏛️ Bank Deposit</option>
            <option value="card">💳 Card</option>
            <option value="cheque">📝 Cheque</option>
            <option value="online">🌐 Online</option>
          </select>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60 overflow-x-auto">
            {["", "completed", "pending", "failed"].map((st) => (
              <button
                key={st}
                onClick={() => setParam("status", st)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition ${
                  currentStatus === st
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                }`}
              >
                {st === "" ? "All Status" : st}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters Button */}
        {(currentMethod || currentStatus) && (
          <button
            onClick={() => {
              setSearchParams(new URLSearchParams());
            }}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 self-end sm:self-auto"
          >
            Clear Filters ✕
          </button>
        )}
      </div>

      {/* ── Desktop & Tablet View: Table ─────────────────────── */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[920px]">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Payment #</th>
                <th className="py-3.5 px-4">Receipt</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Reference</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
              {payments.length > 0 ? (
                payments.map((payment) => {
                  const methodInfo = getMethodBadge(payment.payment_method);
                  return (
                    <tr key={payment.id} className="hover:bg-slate-800/30 transition-colors group">
                      {/* Payment Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                        {payment.payment_number}
                      </td>

                      {/* Receipt Number */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {payment.receipt?.receipt_number ? (
                          <span className="bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded text-[11px]">
                            {payment.receipt.receipt_number}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Student Name */}
                      <td className="py-3.5 px-4 font-medium text-white">
                        {payment.student?.full_name ?? <span className="text-slate-500 italic">Unassigned</span>}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span>{methodInfo.icon}</span>
                          <span className={`font-semibold capitalize ${methodInfo.color}`}>
                            {methodInfo.label}
                          </span>
                        </div>
                      </td>

                      {/* Reference Number */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                        {payment.reference_number || payment.external_transaction_id || (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-bold text-white">
                        {money(payment.amount)}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {date(payment.payment_date)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-semibold capitalize ${getStatusBadge(payment.status)}`}>
                          {payment.status.replace("_", " ")}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <Link 
                          to={`/finance/students/${payment.student_id}/statement`} 
                          className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs font-semibold transition"
                        >
                          <span>Statement</span>
                          <span className="text-[10px]">→</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="text-3xl">💳</p>
                      <p className="text-sm font-semibold text-slate-300">No payment records found</p>
                      <p className="text-xs text-slate-500">Try adjusting your filters or search criteria above.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ─────────────────────────────────── */}
        {meta && meta.last_page > 1 && (
          <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span>
              Showing <strong className="text-slate-200">{meta.from ?? 0}</strong> to <strong className="text-slate-200">{meta.to ?? 0}</strong> of <strong className="text-slate-200">{meta.total}</strong> payments
            </span>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              <button 
                disabled={meta.current_page === 1} 
                onClick={() => setParam("page", String(meta.current_page - 1))} 
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-800 transition font-medium"
              >
                Previous
              </button>

              <span className="px-3 py-1.5 text-slate-300 font-mono">
                {meta.current_page} / {meta.last_page}
              </span>

              <button 
                disabled={meta.current_page === meta.last_page} 
                onClick={() => setParam("page", String(meta.current_page + 1))} 
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition font-semibold shadow-sm"
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