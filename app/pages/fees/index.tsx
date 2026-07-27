// ============================================================
// app/pages/fees/index.tsx
// EduNexus — Fee Management Dashboard
// ============================================================
import { Link, useSearchParams, useNavigation } from "react-router";
import type { Route } from "./+types/index";
import api, {
  type Fee,
  type FeeStatus,
  type PaymentMethod,
  type PaginationMeta,
} from "~/lib/api";

interface ByTypeRow {
  name:      string;
  collected: number;
  amount:    number;
  rate:      number;
}

interface ByMonthRow {
  month:     string;
  collected: number;
}

interface SummaryData {
  total_collected: number;
  total_pending:   number;
  total_budget:    number;
  defaulters:      number;
  collection_rate: number;
  by_type:         ByTypeRow[];
  by_month:        ByMonthRow[];
}

interface LoaderData {
  fees:    Fee[];
  summary: SummaryData;
  meta:    PaginationMeta;
}

export async function clientLoader({ request }: Route.LoaderArgs) {
  const url    = new URL(request.url);
  const page   = Number(url.searchParams.get("page")   ?? 1);
  const status = url.searchParams.get("status") as FeeStatus | null;
  const method = url.searchParams.get("method") as PaymentMethod | null;
  const month  = url.searchParams.get("month") ? Number(url.searchParams.get("month"))  : undefined;
  const year   = url.searchParams.get("year")  ? Number(url.searchParams.get("year"))   : undefined;

  const [feesRes, summaryRes] = await Promise.all([
    api.fees.list({ page, per_page: 15, status: status ?? undefined, method: method ?? undefined, month, year }),
    api.fees.summary(),
  ]);

  const feesData = feesRes.data.data;
  const metaData = feesRes.data.meta ?? feesRes.data; 
  const summaryData = summaryRes.data;

  return {
    fees:    feesData,
    meta:    metaData,
    summary: summaryData,
  };
}

const STATUS_STYLES: Record<FeeStatus, string> = {
  paid:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  pending: "bg-amber-500/15  text-amber-400  border-amber-500/20",
  overdue: "bg-red-500/15    text-red-400    border-red-500/20",
  waived:  "bg-slate-700     text-slate-400  border-slate-600",
  reversed: "bg-zinc-700     text-zinc-300  border-zinc-600",
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
  if (pct >= 80) return { text: "text-emerald-400", bar: "bg-emerald-400" };
  if (pct >= 60) return { text: "text-amber-400",   bar: "bg-amber-400"   };
  return              { text: "text-red-400",        bar: "bg-red-400"     };
}

export default function FeesPage({ loaderData }: Route.ComponentProps) {
  const { fees, summary, meta } = loaderData as LoaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading  = navigation.state === "loading";

  function setParam(key: string, value: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else       next.delete(key);
      if (key !== "page") next.delete("page");
      return next;
    });
  }

  const rate   = summary?.collection_rate ?? 0;
  const colors = rateColor(rate);
  const byMonth     = summary?.by_month ?? [];
  const maxMonthVal = byMonth.length > 0 ? Math.max(...byMonth.map(m => m.collected)) : 1;
  const currentYear  = new Date().getFullYear();
  const fyLabel      = `FY ${currentYear}–${String(currentYear + 1).slice(2)}`;

  return (
    <div className={`p-4 md:p-6 transition-opacity ${isLoading ? "opacity-60 pointer-events-none" : ""}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">💰 Fee Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Track payments, dues and generate receipts</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <Link
            to="/fees/defaulters"
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition text-center"
          >
            ⚠️ Defaulters
          </Link>
          <button
            onClick={() => window.open(`${import.meta.env.VITE_API_URL}/api/v1/fees/export`, "_blank")}
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition text-center"
          >
            📊 Export
          </button>
          <Link
            to="/fees/generate"
            className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition text-center"
          >
            🧾 Generate
          </Link>
          <Link
            to="/fees/collect"
            className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition text-center"
          >
            💳 Collect
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { icon: "💵", label: "Collected", color: "text-emerald-400", val: formatKES(summary?.total_collected), sub: `${rate.toFixed(1)}% of budget` },
          { icon: "⏳", label: "Pending", color: "text-amber-400", val: formatKES(summary?.total_pending), sub: `${(100 - rate).toFixed(1)}% outstanding` },
          { icon: "⚠️", label: "Defaulters", color: "text-red-400", val: summary?.defaulters ?? "—", sub: "View all →", subLink: "/fees/defaulters" },
          { icon: "🎯", label: "Total budget", color: "text-violet-400", val: formatKES(summary?.total_budget), sub: fyLabel },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <div className={`text-lg sm:text-xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
              <div className="text-xs text-slate-600 mt-0.5">
                {s.subLink ? <Link to={s.subLink} className="hover:text-red-400 transition">{s.sub}</Link> : s.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Overall collection rate</h3>
            <span className={`text-sm font-mono font-semibold ${colors.text}`}>{rate.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-5">
            <div className={`h-full rounded-full transition-all duration-700 ${colors.bar}`} style={{ width: `${Math.min(rate, 100)}%` }} />
          </div>

          {summary?.by_type?.length > 0 && (
            <div className="space-y-3">
              {summary.by_type.slice(0, 6).map((t, i) => (
                <div key={`${t.name}-${i}`}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 truncate pr-2">{t.name}</span>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className="hidden sm:inline text-slate-500">{formatKES(t.collected)} collected</span>
                      <span className={`font-mono font-semibold ${rateColor(t.rate).text}`}>{t.rate.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${rateColor(t.rate).bar}`} style={{ width: `${Math.min(t.rate, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-white mb-4">📈 Monthly collections</h3>
          {byMonth.length > 0 ? (
            <div className="flex items-end gap-1 h-36">
              {byMonth.slice(-12).map((m, i) => {
                const heightPct = maxMonthVal > 0 ? (m.collected / maxMonthVal) * 100 : 0;
                const isLatest  = i === byMonth.slice(-12).length - 1;
                return (
                  <div key={`${m.month}-${i}`} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full relative flex items-end" style={{ height: "112px" }}>
                      <div className={`w-full rounded-t transition-all duration-700 ${isLatest ? "bg-blue-400" : "bg-slate-600 group-hover:bg-slate-500"}`} style={{ height: `${Math.max(heightPct, 4)}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-600 truncate w-full text-center">{m.month.substring(0, 3)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-36 text-center">
              <p className="text-2xl mb-2">📊</p>
              <p className="text-slate-500 text-xs">No monthly data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h3 className="text-sm font-semibold text-white">
            Recent transactions {(meta?.total ?? 0) > 0 && <span className="ml-2 text-xs font-normal text-slate-500">({meta.total})</span>}
          </h3>
          <div className="flex flex-row gap-2">
            <select
              value={searchParams.get("status") ?? ""}
              onChange={e => setParam("status", e.target.value)}
              className="flex-1 sm:flex-none bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 transition"
            >
              <option value="">Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="waived">Waived</option>
            </select>
            <select
              value={searchParams.get("method") ?? ""}
              onChange={e => setParam("method", e.target.value)}
              className="flex-1 sm:flex-none bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 transition"
            >
              <option value="">Method</option>
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="bank_deposit">Bank Deposit</option>
              <option value="card">Card</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-700">
                {["Receipt no", "Student", "Class", "Amount", "Fee type", "Date", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left py-2.5 px-3 text-xs text-slate-500 uppercase font-semibold tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {Array.isArray(fees) && fees.length > 0 ? (
                fees.map(f => (
                  <tr key={f.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 px-3 font-mono text-xs text-blue-400">{f.receipt_no}</td>
                    <td className="py-3 px-3"><p className="font-medium text-slate-200 whitespace-nowrap">{f.student?.full_name ?? "—"}</p></td>
                    <td className="py-3 px-3 text-slate-400 text-xs">{f.student?.class_room?.name ?? "—"}</td>
                    <td className="py-3 px-3 font-semibold text-slate-100">KES {Number(f.amount).toLocaleString("en-KE")}</td>
                    <td className="py-3 px-3 text-slate-400 text-xs">{f.fee_type?.name ?? "—"}</td>
                    <td className="py-3 px-3 text-slate-500 text-xs">{formatDate(f.paid_at)}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${STATUS_STYLES[f.status]}`}>{f.status}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1.5">
                        <Link to={`/fees/${f.id}`} className="px-2.5 py-1 bg-slate-700 text-slate-300 text-xs rounded-lg hover:bg-slate-600 transition">View</Link>
                        <a href={api.fees.receiptUrl(f.id)} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs rounded-lg hover:bg-blue-500/20 transition">🖨</a>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="py-12 text-center text-slate-500">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.last_page > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-slate-700 gap-4">
            <p className="text-xs text-slate-500">Showing {meta.from}–{meta.to} of {meta.total}</p>
            <div className="flex gap-1.5 w-full sm:w-auto">
              <button disabled={meta.current_page === 1} onClick={() => setParam("page", String(meta.current_page - 1))} className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-lg hover:bg-slate-600 transition disabled:opacity-30">← Prev</button>
              <button disabled={meta.current_page === meta.last_page} onClick={() => setParam("page", String(meta.current_page + 1))} className="flex-1 sm:flex-none px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition disabled:opacity-30">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}