// ============================================================
// app/pages/reports/index.tsx
// ============================================================

import { useState } from "react";
import { useNavigate } from "react-router";
import { api, type TrialBalanceData, type TrialBalanceAccount } from "~/lib/api";

export async function clientLoader() {
  try {
    const response = await api.accounting.trialBalance({});
    return { report: response.data };
  } catch (error) {
    throw new Error("The accounting server failed to generate the report. Please check server logs.");
  }
}

function money(value: number | string | null | undefined) {
  return `KES ${Number(value ?? 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function date(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" }) : "-";
}

const accountTypeColors: Record<string, string> = {
  asset: "text-blue-400",
  liability: "text-rose-400",
  equity: "text-purple-400",
  revenue: "text-emerald-400",
  expense: "text-amber-400",
};

export default function AccountingReportsPage({
  loaderData,
}: {
  loaderData: { report: TrialBalanceData };
}) {
  const navigate = useNavigate();
  const [report, setReport] = useState<TrialBalanceData>(loaderData.report);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState(report.from_date);
  const [toDate, setToDate] = useState(report.to_date);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await api.accounting.trialBalance({ from_date: fromDate, to_date: toDate });
      setReport(response.data);
    } catch (error) {
      console.error("Failed to load report:", error);
      alert("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const accountsByType = report.accounts.reduce((acc, account) => {
    if (!acc[account.account_type]) {
      acc[account.account_type] = [];
    }
    acc[account.account_type].push(account);
    return acc;
  }, {} as Record<string, TrialBalanceAccount[]>);

  const typeTotals = Object.entries(accountsByType).reduce((acc, [type, accounts]) => {
    acc[type] = {
      debit: accounts.reduce((sum, a) => sum + a.debit, 0),
      credit: accounts.reduce((sum, a) => sum + a.credit, 0),
    };
    return acc;
  }, {} as Record<string, { debit: number; credit: number }>);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Trial Balance</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            General ledger trial balance for the selected reporting period.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[repeat(3,minmax(180px,1fr))]">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="w-full rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "Loading..." : "Generate Report"}
            </button>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl border p-4 ${report.is_balanced ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10"}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <p className={`text-sm font-semibold ${report.is_balanced ? "text-emerald-400" : "text-red-400"}`}>
              {report.is_balanced ? "Balanced" : "Out of Balance"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Total Debits: {money(report.total_debit)} | Total Credits: {money(report.total_credit)}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-2xl font-bold text-white">
              {money(Math.abs(report.total_debit - report.total_credit))}
            </p>
            <p className="text-xs text-slate-500">difference</p>
          </div>
        </div>
      </div>

      {/* Accounts by Type */}
        <div className="space-y-6">
          {Object.entries(accountsByType).map(([type, accounts]) => (
            <div key={type} className="rounded-lg border border-slate-700 bg-slate-900/50 overflow-hidden">
              {/* Type Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-700 bg-slate-800 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${accountTypeColors[type]?.replace("text-", "bg-")}`} />
                  <h3 className={`font-semibold capitalize text-sm sm:text-base ${accountTypeColors[type]}`}>{type}</h3>
                </div>
                <div className="text-left sm:text-right text-xs sm:text-sm">
                  <span className="text-slate-400">Dr: </span>
                  <span className="font-semibold text-white">{money(typeTotals[type]?.debit ?? 0)}</span>
                  <span className="mx-2 text-slate-600">|</span>
                  <span className="text-slate-400">Cr: </span>
                  <span className="font-semibold text-white">{money(typeTotals[type]?.credit ?? 0)}</span>
                </div>
              </div>

              {/* Accounts Table */}
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="w-full min-w-[650px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-2.5">Code</th>
                      <th className="px-4 py-2.5">Account</th>
                      <th className="px-4 py-2.5 text-right">Debit</th>
                      <th className="px-4 py-2.5 text-right">Credit</th>
                      <th className="px-4 py-2.5 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {accounts.map((account) => (
                      <tr key={account.id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{account.account_code}</td>
                        <td className="px-4 py-3 text-slate-200">{account.account_name}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{account.debit > 0 ? money(account.debit) : "-"}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{account.credit > 0 ? money(account.credit) : "-"}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${account.balance >= 0 ? "text-white" : "text-red-400"}`}>
                          {money(account.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {report.accounts.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-sm">
            No posted journal entries found for this period. Post and post entries to see the trial balance.
          </div>
        )}
      </div>
  );
}