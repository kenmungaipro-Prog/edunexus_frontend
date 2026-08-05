import { useState } from "react";
import { useNavigate } from "react-router";
import { api, type IncomeStatementData, type IncomeStatementAccount } from "~/lib/api";

export async function clientLoader() {
  try {
    const response = await api.accounting.incomeStatement({});
    return { report: response.data };
  } catch (error) {
    throw new Error("Failed to load income statement");
  }
}

function money(value: number | string | null | undefined) {
  return `KES ${Number(value ?? 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function IncomeStatementPage({ loaderData }: { loaderData: { report: IncomeStatementData } }) {
  const navigate = useNavigate();
  const [report, setReport] = useState<IncomeStatementData>(loaderData.report);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState(report.from_date);
  const [toDate, setToDate] = useState(report.to_date);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await api.accounting.incomeStatement({ from_date: fromDate, to_date: toDate });
      setReport(response.data);
    } catch (error) {
      console.error(error);
      alert("Failed to load income statement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Income Statement</h1>
          <p className="text-xs text-slate-400">From {report.from_date} to {report.to_date}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/accounting/reports')} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">Back</button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white" />
          <button onClick={fetchReport} disabled={loading} className="rounded-lg bg-blue-500 px-4 py-2 text-white">{loading ? 'Loading...' : 'Refresh'}</button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <h3 className="font-semibold text-white mb-2">Revenues</h3>
            <div className="divide-y divide-slate-700/30 text-sm">
              {report.revenues.map((r: IncomeStatementAccount) => (
                <div key={r.id} className="py-2 flex justify-between">
                  <div className="text-slate-200">{r.account_name}</div>
                  <div className="font-semibold text-white">{money(r.amount)}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right text-sm text-slate-400">Total: <span className="font-semibold text-white">{money(report.total_revenue)}</span></div>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <h3 className="font-semibold text-white mb-2">Expenses</h3>
            <div className="divide-y divide-slate-700/30 text-sm">
              {report.expenses.map((e: IncomeStatementAccount) => (
                <div key={e.id} className="py-2 flex justify-between">
                  <div className="text-slate-200">{e.account_name}</div>
                  <div className="font-semibold text-white">{money(e.amount)}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right text-sm text-slate-400">Total: <span className="font-semibold text-white">{money(report.total_expense)}</span></div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-slate-700 bg-slate-900 p-4 text-right">
          <div className="text-slate-400">Net Income</div>
          <div className="text-2xl font-bold text-white">{money(report.net_income)}</div>
        </div>
      </div>
    </div>
  );
}
