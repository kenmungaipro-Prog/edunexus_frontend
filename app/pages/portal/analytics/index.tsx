// ============================================================
// app/pages/portal/analytics/index.tsx
// ============================================================
import { Link } from "react-router";
import api from "~/lib/api";

export async function clientLoader() {
  const response = await api.portal.analytics();
  return { analytics: response.data };
}

interface ChildAnalytics {
  id: number;
  full_name: string;
  admission_no: string;
  class_name?: string | null;
  balance: number;
}

interface LoaderData {
  analytics: {
    total_children: number;
    outstanding_children: number;
    total_balance: number;
    children: ChildAnalytics[];
  };
}

const formatKES = (value: number | undefined | null) =>
  `KES ${Number(value || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

export default function ParentAnalyticsPage({ loaderData }: { loaderData: LoaderData }) {
  const { analytics } = loaderData;

  return (
    <div className="min-h-screen" style={{ color: "#e8edf8", fontFamily: "'Sora', sans-serif" }}>
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1 text-slate-100 flex items-center gap-2">
          <span className="text-blue-400">📊</span> Parent Analytics
        </h1>
        <p className="text-slate-400 text-sm">
          Overview of your child's fee balances and payment readiness.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Children</p>
          <p className="text-3xl font-semibold text-white">{analytics.total_children}</p>
          <p className="text-slate-400 text-sm mt-2">Total children linked to your account</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Outstanding</p>
          <p className="text-3xl font-semibold text-amber-400">{analytics.outstanding_children}</p>
          <p className="text-slate-400 text-sm mt-2">Children with outstanding fee balances</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Total Balance</p>
          <p className="text-3xl font-semibold text-emerald-400">{formatKES(analytics.total_balance)}</p>
          <p className="text-slate-400 text-sm mt-2">Total amount due across all children</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Children summary</h2>
            <p className="text-slate-500 text-sm">View each linked child and their current fee balance.</p>
          </div>
          <Link
            to="/portal/payments"
            className="inline-flex items-center justify-center rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition"
          >
            Go to Payments
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-500">
                <th className="px-4 py-3">Child</th>
                <th className="px-4 py-3">Admission No.</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {analytics.children.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No registered children found. Please contact the school if this looks incorrect.
                  </td>
                </tr>
              ) : (
                analytics.children.map((child) => (
                  <tr key={child.id} className="border-b border-slate-700 hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-4 text-slate-100 font-semibold">{child.full_name}</td>
                    <td className="px-4 py-4 text-slate-400">{child.admission_no}</td>
                    <td className="px-4 py-4 text-slate-400">{child.class_name ?? "—"}</td>
                    <td className="px-4 py-4 text-right font-semibold" style={{ color: child.balance > 0 ? "#fbbf24" : "#34d399" }}>
                      {formatKES(child.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
