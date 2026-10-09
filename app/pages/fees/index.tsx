// ============================================================
// app/pages/fees/index.tsx
// EduNexus — Fee Management Dashboard
// ============================================================
import { Link, useSearchParams, useNavigation } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/index";
import {
  api,
  type FeeSummary,
  type FinancePayment,
  type FinancePaymentStatus,
  type PaymentMethod,
  type PaginationMeta,
} from "~/lib/api";

interface LoaderData {
  payments: FinancePayment[];
  summary: FeeSummary;
  meta: PaginationMeta;
}

export async function clientLoader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const status = url.searchParams.get("status") as FinancePaymentStatus | null;
  const method = url.searchParams.get("method") as PaymentMethod | null;
  const month = url.searchParams.get("month") ? Number(url.searchParams.get("month")) : undefined;
  const year = url.searchParams.get("year") ? Number(url.searchParams.get("year")) : undefined;

  const [paymentsRes, summaryRes] = await Promise.all([
    api.finance.payments({ page, per_page: 15, status: status ?? undefined, method: method ?? undefined, month, year }),
    api.fees.summary(),
  ]);

  const paymentsData = paymentsRes.data.data;
  const metaData = paymentsRes.data.meta ?? paymentsRes.data;
  const summaryData = summaryRes.data;

  return {
    payments: paymentsData,
    meta: metaData,
    summary: summaryData,
  };
}

const STATUS_STYLES: Record<string, string> = {
  successful: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  fully_allocated: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  partially_allocated: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  processing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  reversed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  refunded: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  reconciled: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  suspicious: "bg-red-500/10 text-red-400 border-red-500/20",
};

function formatKES(n: number | null | undefined) {
  const val = n ?? 0;
  if (val >= 1_000_000) return `KES ${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `KES ${(val / 1_000).toFixed(1)}K`;
  return `KES ${val.toLocaleString("en-KE")}`;
}

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
}

function rateColor(pct: number) {
  if (pct >= 80) return { text: "text-emerald-400", bar: "bg-emerald-500" };
  if (pct >= 60) return { text: "text-amber-400", bar: "bg-amber-500" };
  return { text: "text-red-400", bar: "bg-red-500" };
}

export default function FeesPage({ loaderData }: Route.ComponentProps) {
  const { payments, summary, meta } = loaderData as LoaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<number | null>(null);
  const [receiptError, setReceiptError] = useState("");

  function setParam(key: string, value: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.delete("page");
      return next;
    });
  }

  const rate = summary?.collection_rate ?? 0;
  const colors = rateColor(rate);
  const byMonth = summary?.monthly ?? [];
  const maxMonthVal = byMonth.length > 0 ? Math.max(...byMonth.map(m => m.collected)) : 1;
  const currentYear = new Date().getFullYear();

  async function downloadReceipt(receiptId: number) {
    setDownloadingReceiptId(receiptId);
    setReceiptError("");
    try {
      const pdf = await api.finance.receiptPdf(receiptId);
      const url = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${receiptId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: unknown) {
      setReceiptError(
        error && typeof error === "object" && "message" in error && typeof error.message === "string"
          ? error.message
          : "Could not download the receipt.",
      );
    } finally {
      setDownloadingReceiptId(null);
    }
  }

  return (
    <div className={`w-full min-w-0 overflow-hidden p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 transition-opacity duration-200 ${isLoading ? "opacity-50 pointer-events-none" : ""}`}>
      
      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">💰 Fee Management</h1>
          <p className="text-slate-400 text-sm mt-1">Track payments, dues, and generate receipts effortlessly.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Link
            to="/fees/defaulters"
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
          >
            ⚠️ Defaulters
          </Link>
          <Link
            to="/fees/generate"
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-white text-slate-900 rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            🧾 Generate
          </Link>
          <Link
            to="/fees/collect"
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            💳 Collect
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {[
          { icon: "💵", label: "Payments Received", color: "text-emerald-400", val: formatKES(summary?.total_collected), sub: "Successful payments in this session" },
          { icon: "⏳", label: "Outstanding Balance", color: "text-amber-400", val: formatKES(summary?.total_pending), sub: `${formatKES(summary?.overdue_balance)} overdue` },
          { icon: "⚠️", label: "Defaulters", color: "text-red-400", val: summary?.defaulters ?? "—", sub: "View all →", subLink: "/fees/defaulters" },
          { icon: "🎯", label: "Invoiced This Session", color: "text-blue-400", val: formatKES(summary?.total_budget), sub: summary?.session_name ?? "Current academic session" },
        ].map(s => (
          <div key={s.label} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 flex items-start gap-4 hover:border-slate-600/80 transition-colors">
            <div className="p-3 bg-slate-900/50 rounded-xl text-2xl leading-none shadow-inner">
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-400 mb-1">{s.label}</div>
              <div className={`text-xl md:text-2xl font-bold ${s.color} truncate tracking-tight mb-1`}>{s.val}</div>
              <div className="text-xs font-medium text-slate-500">
                {s.subLink ? <Link to={s.subLink} className="hover:text-red-400 hover:underline transition-colors">{s.sub}</Link> : s.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Overall Collection Bars */}
        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 md:p-6 flex flex-col justify-center">
          <div className="flex flex-wrap items-end justify-between mb-4 gap-2">
            <div>
              <h3 className="text-base font-semibold text-white">Overall collection rate</h3>
              <p className="text-xs text-slate-400 mt-0.5">Invoice amount settled ({summary?.session_name ?? "current session"})</p>
            </div>
            <span className={`text-2xl font-mono font-bold ${colors.text}`}>{rate.toFixed(1)}%</span>
          </div>
          
          <div className="h-3 bg-slate-900/80 rounded-full overflow-hidden mb-6 shadow-inner">
            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${colors.bar}`} style={{ width: `${Math.min(rate, 100)}%` }} />
          </div>

          {summary?.by_type?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-2">
              {summary.by_type.slice(0, 6).map((t, i) => (
                <div key={`${t.type}-${i}`} className="w-full">
                  <div className="flex justify-between items-end text-sm mb-1.5">
                    <span className="text-slate-300 font-medium truncate pr-3">{t.type}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="hidden sm:inline text-xs text-slate-500">{formatKES(t.collected)}</span>
                      <span className={`font-mono text-xs font-semibold ${rateColor(t.rate).text}`}>{t.rate.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-900/80 rounded-full overflow-hidden shadow-inner">
                    <div className={`h-full rounded-full transition-all duration-1000 ease-out ${rateColor(t.rate).bar}`} style={{ width: `${Math.min(t.rate, 100)}%` }} />
                  </div>
                </div>
              ))}
              <p className="md:col-span-2 text-xs text-slate-500">
                Fee-category settlement is estimated proportionally from invoice payments; exact category allocations are not recorded.
              </p>
            </div>
          )}
        </div>

        {/* Monthly Collections Chart */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 md:p-6 flex flex-col">
          <h3 className="text-base font-semibold text-white mb-6">📈 Monthly payments · {summary?.monthly_year ?? currentYear}</h3>
          
          {byMonth.length > 0 ? (
            <div className="flex-1 flex items-end justify-between gap-1.5 h-40">
              {byMonth.slice(-12).map((m, i) => {
                const heightPct = maxMonthVal > 0 ? (m.collected / maxMonthVal) * 100 : 0;
                const isCurrentMonth = i === new Date().getMonth();
                return (
                  <div key={`${m.month}-${i}`} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="w-full relative flex items-end h-[85%] bg-slate-900/30 rounded-t-sm">
                      <div 
                        className={`w-full rounded-t-sm transition-all duration-1000 ease-out ${isCurrentMonth ? "bg-blue-500" : "bg-slate-600 group-hover:bg-slate-400"}`}
                        style={{ height: `${m.collected > 0 ? Math.max(heightPct, 4) : 0}%` }}
                        title={`${m.month}: ${formatKES(m.collected)}`}
                      />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 group-hover:text-slate-300 transition-colors">
                      {m.month.substring(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[160px] text-center border-2 border-dashed border-slate-700/50 rounded-xl">
              <span className="text-2xl mb-2 grayscale opacity-50">📊</span>
              <p className="text-slate-500 text-sm font-medium">No monthly data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Transactions Table Section */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl flex flex-col overflow-hidden">
        
        {/* Table Header & Filters */}
        <div className="p-4 md:p-5 border-b border-slate-700/60 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
            {(meta?.total ?? 0) > 0 && (
              <span className="px-2.5 py-0.5 bg-slate-700/50 text-slate-300 text-xs font-semibold rounded-full border border-slate-600/50">
                {meta.total} records
              </span>
            )}
          </div>

          {/* Filters: 2x2 grid on mobile, single flex row on md+ */}
          <div className="grid grid-cols-2 md:flex md:flex-row md:items-center gap-3 w-full xl:w-auto">
            <select
              value={searchParams.get("status") ?? ""}
              onChange={e => setParam("status", e.target.value)}
              className="bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow w-full md:w-auto"
            >
              <option value="">All Statuses</option>
              <option value="successful">Successful</option>
              <option value="fully_allocated">Fully allocated</option>
              <option value="partially_allocated">Partially allocated</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="reversed">Reversed</option>
              <option value="refunded">Refunded</option>
            </select>
            
            <select
              value={searchParams.get("method") ?? ""}
              onChange={e => setParam("method", e.target.value)}
              className="bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow w-full md:w-auto"
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="bank_deposit">Bank Deposit</option>
              <option value="card">Card</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online</option>
            </select>
            
            <select
              value={searchParams.get("month") ?? ""}
              onChange={e => setParam("month", e.target.value)}
              className="bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow w-full md:w-auto"
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, index) => {
                const monthValue = index + 1;
                return (
                  <option key={monthValue} value={monthValue}>
                    {new Date(0, index).toLocaleString("en-KE", { month: "long" })}
                  </option>
                );
              })}
            </select>
            
            <select
              value={searchParams.get("year") ?? ""}
              onChange={e => setParam("year", e.target.value)}
              className="bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow w-full md:w-auto"
            >
              <option value="">All Years</option>
              {Array.from({ length: 5 }, (_, index) => {
                const yearOption = currentYear - index;
                return (
                  <option key={yearOption} value={yearOption}>
                    {yearOption}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="w-full overflow-x-auto">
          {receiptError && (
            <p role="alert" className="px-5 py-3 text-sm text-red-300 bg-red-500/10 border-b border-red-500/20">
              {receiptError}
            </p>
          )}
          <table className="w-full text-sm text-left whitespace-nowrap min-w-[900px]">
            <thead className="bg-slate-800/80 border-b border-slate-700/80">
              <tr>
                {["Payment no.", "Student", "Class", "Amount", "Method", "Date", "Status", "Actions"].map(h => (
                  <th key={h} className="py-3.5 px-4 md:px-5 text-xs text-slate-400 uppercase font-bold tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {Array.isArray(payments) && payments.length > 0 ? (
                payments.map(payment => {
                  const receiptId = payment.receipt?.id;
                  return <tr key={payment.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="py-3 px-4 md:px-5 font-mono text-xs font-semibold text-blue-400">{payment.payment_number ?? `#${payment.id}`}</td>
                    <td className="py-3 px-4 md:px-5 text-slate-200 font-medium">{payment.student?.full_name ?? "—"}</td>
                    <td className="py-3 px-4 md:px-5 text-slate-400 text-sm">{payment.student?.class_room?.name ?? "—"}</td>
                    <td className="py-3 px-4 md:px-5 font-bold text-slate-200">{formatKES(Number(payment.amount))}</td>
                    <td className="py-3 px-4 md:px-5 text-slate-400 text-sm">{payment.payment_method?.replaceAll("_", " ") ?? "—"}</td>
                    <td className="py-3 px-4 md:px-5 text-slate-400 text-sm">{formatDate(payment.payment_date)}</td>
                    <td className="py-3 px-4 md:px-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${STATUS_STYLES[payment.status] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                        {payment.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 md:px-5">
                      <div className="flex gap-2">
                        {receiptId ? (
                          <button
                            type="button"
                            onClick={() => downloadReceipt(receiptId)}
                            disabled={downloadingReceiptId === receiptId}
                            title="Download receipt PDF"
                            className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs rounded hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                          >
                            {downloadingReceiptId === receiptId ? "Preparing…" : "Receipt"}
                          </button>
                        ) : <span className="text-slate-500 text-xs">No receipt</span>}
                      </div>
                    </td>
                  </tr>
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500 bg-slate-800/30">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl mb-1">📭</span>
                      <p className="font-medium">No transactions found matching your criteria.</p>
                      <button onClick={() => setSearchParams(new URLSearchParams())} className="text-blue-400 hover:underline text-xs mt-1">Clear filters</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="p-4 md:p-5 border-t border-slate-700/60 bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400 font-medium">
              Showing <span className="text-slate-200">{meta.from}</span> to <span className="text-slate-200">{meta.to}</span> of <span className="text-slate-200">{meta.total}</span> entries
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                disabled={meta.current_page === 1} 
                onClick={() => setParam("page", String(meta.current_page - 1))} 
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <button 
                disabled={meta.current_page === meta.last_page} 
                onClick={() => setParam("page", String(meta.current_page + 1))} 
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}