import { useState } from "react";
import { useNavigate } from "react-router";
import { api, type CashFlowData, type CashFlowAccount } from "~/lib/api";

export async function clientLoader() {
  try {
    const response = await api.accounting.cashFlow({});
    return { report: response.data };
  } catch (error) {
    throw new Error("Failed to load cash flow report");
  }
}

function money(value: number | string | null | undefined) {
  return `KES ${Number(value ?? 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function CashFlowPage({ loaderData }: { loaderData: { report: CashFlowData } }) {
  const navigate = useNavigate();
  const [report, setReport] = useState<CashFlowData>(loaderData.report);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState(report.from_date);
  const [toDate, setToDate] = useState(report.to_date);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await api.accounting.cashFlow({ from_date: fromDate, to_date: toDate });
      setReport(response.data);
    } catch (error) {
      console.error(error);
      alert("Failed to load cash flow report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Cash Flow Statement</h1>
          <p className="text-xs text-slate-400">From {report.from_date} to {report.to_date}</p>
        </div>
        <button
          onClick={() => navigate('/accounting/reports')}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
        >
          Back
        </button>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
          />
          <button
            onClick={fetchReport}
            disabled={loading}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
            <div>
              <p className="font-semibold text-slate-200">Total Starting Balance</p>
              <p>{money(report.total_starting_balance)}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-200">Total Inflows</p>
              <p>{money(report.total_inflows)}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-200">Total Outflows</p>
              <p>{money(report.total_outflows)}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-200">Total Ending Balance</p>
              <p>{money(report.total_ending_balance)}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900 text-sm">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-slate-700/50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3 text-right">Starting Balance</th>
                <th className="px-4 py-3 text-right">Inflows</th>
                <th className="px-4 py-3 text-right">Outflows</th>
                <th className="px-4 py-3 text-right">Net Change</th>
                <th className="px-4 py-3 text-right">Ending Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {report.cash_accounts.map((account: CashFlowAccount) => (
                <tr key={account.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3 text-slate-200">{account.account_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{account.account_code}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{money(account.starting_balance)}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{money(account.inflows)}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{money(account.outflows)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${account.net_change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {money(account.net_change)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-white">{money(account.ending_balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
