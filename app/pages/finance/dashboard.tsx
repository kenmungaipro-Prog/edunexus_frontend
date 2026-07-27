// ============================================================
// app/pages/finance/dashboard.tsx
// ============================================================

import { Link } from "react-router";
import { api, type FinanceDashboardSummary, type FinancePayment } from "~/lib/api";

export async function clientLoader() {
  const [summary, recent] = await Promise.all([
    api.finance.dashboardSummary(),
    api.finance.recentPayments(),
  ]);

  return {
    summary: summary.data,
    recentPayments: recent.data,
  };
}

function money(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return `KES ${amount.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

function date(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" }) : "-";
}

export default function FinanceDashboardPage({ loaderData }: { loaderData: { summary: FinanceDashboardSummary; recentPayments: FinancePayment[] } }) {
  const { summary, recentPayments } = loaderData;

  const cards = [
    { label: "Today Collections", value: money(summary.today_collections), tone: "text-emerald-400" },
    { label: "Total Invoiced", value: money(summary.total_invoiced), tone: "text-blue-400" },
    { label: "Total Collected", value: money(summary.total_collected), tone: "text-violet-400" },
    { label: "Outstanding", value: money(summary.outstanding_balance), tone: "text-amber-400" },
    { label: "Overdue", value: money(summary.overdue_balance), tone: "text-red-400" },
    { label: "Due Soon", value: money(summary.due_soon_balance), tone: "text-sky-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Finance Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Collections, invoices, and student balances</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link to="/finance/payments/collect" className="w-full sm:w-auto text-center rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors">
            Collect Payment
          </Link>
          <Link to="/finance/invoices" className="w-full sm:w-auto text-center rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors">
            View Invoices
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:p-5">
            <div className={`text-xl sm:text-2xl font-bold ${card.tone}`}>{card.value}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Collection Rate</h2>
            <span className="font-mono text-sm font-semibold text-emerald-400">{summary.collection_rate}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-700">
            <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${Math.min(summary.collection_rate, 100)}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Quick Actions</h2>
          <div className="grid gap-2">
            <Link to="/finance/payments" className="rounded-lg bg-slate-900 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors">Payment Register</Link>
            <Link to="/finance/invoices" className="rounded-lg bg-slate-900 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors">Invoice Register</Link>
            <Link to="/students" className="rounded-lg bg-slate-900 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors">Student Finance Profiles</Link>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recent Payments</h2>
          <Link to="/finance/payments" className="text-xs font-semibold text-blue-400 hover:text-blue-300">View all</Link>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2.5 pr-3">Payment</th>
                <th className="py-2.5 pr-3">Student</th>
                <th className="py-2.5 pr-3">Method</th>
                <th className="py-2.5 pr-3">Amount</th>
                <th className="py-2.5 pr-3">Date</th>
                <th className="py-2.5 pr-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {recentPayments.length > 0 ? recentPayments.map((payment) => (
                <tr key={payment.id} className="text-slate-300">
                  <td className="py-3 pr-3 font-mono text-xs text-blue-400">{payment.payment_number}</td>
                  <td className="py-3 pr-3">{payment.student?.full_name ?? "-"}</td>
                  <td className="py-3 pr-3 capitalize">{payment.payment_method.replace("_", " ")}</td>
                  <td className="py-3 pr-3 font-semibold text-white">{money(payment.amount)}</td>
                  <td className="py-3 pr-3 text-slate-400">{date(payment.payment_date)}</td>
                  <td className="py-3 pr-3"><span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">{payment.status}</span></td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500">No payments recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}