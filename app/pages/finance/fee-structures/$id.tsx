import { Link } from "react-router";
import type { Route } from "./+types/$id";
import api, { type FeeStructure } from "~/lib/api";

export async function clientLoader({ params }: Route.LoaderArgs) {
  const id = Number(params.id);
  const response = await api.finance.feeStructure(id);
  return { structure: response.data };
}

function money(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  const valid = Number.isFinite(parsed) ? parsed : 0;
  return `KES ${valid.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

function statusClass(status: string) {
  if (status === "active") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
  if (status === "inactive") return "bg-slate-600/50 text-slate-400 border-slate-500/25";
  return "bg-amber-500/15 text-amber-400 border-amber-500/25";
}

export default function FeeStructureShowPage({ loaderData }: Route.ComponentProps) {
  const { structure } = loaderData as { structure: FeeStructure };
  const total = structure.items?.reduce((sum, item) => sum + Number(item.amount ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Link to="/finance/fee-structures" className="text-slate-400 hover:text-slate-200 text-sm font-medium">
            ← Back to Fee Structures
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-white">{structure.name}</h1>
          <p className="text-sm text-slate-400 mt-2">
            {structure.class_room?.name ?? "All Classes"} · {structure.session?.name ?? "No session"} · {structure.billing_period}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(structure.status)}`}>
            {structure.status}
          </span>
          <div className="rounded-2xl bg-slate-800 border border-slate-700 px-4 py-2 text-sm text-white">
            {structure.items?.length ?? 0} items · {money(total)}
          </div>
          <Link
            to={`/finance/fee-structures/${structure.id}/edit`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Edit Structure
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Session</p>
          <p className="mt-2 text-sm text-slate-200">{structure.session?.name ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Class</p>
          <p className="mt-2 text-sm text-slate-200">{structure.class_room?.name ?? "All Classes"}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Billing period</p>
          <p className="mt-2 text-sm text-slate-200 capitalize">{structure.billing_period}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Item</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Recurring</th>
                <th className="px-5 py-3">Mandatory</th>
                <th className="px-5 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {structure.items && structure.items.length > 0 ? (
                structure.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-700/40 transition-colors">
                    <td className="px-5 py-4 text-slate-200">
                      {item.description ?? item.fee_category?.name ?? "Untitled item"}
                    </td>
                    <td className="px-5 py-4 text-slate-300">{item.fee_category?.name ?? "—"}</td>
                    <td className="px-5 py-4 text-slate-300">{item.is_recurring ? "Yes" : "No"}</td>
                    <td className="px-5 py-4 text-slate-300">{item.is_mandatory ? "Yes" : "No"}</td>
                    <td className="px-5 py-4 text-right font-semibold text-white">{money(item.amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    No fee items found for this structure.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Notes</h2>
        <p className="mt-3 text-sm text-slate-300">
          Effective from {structure.effective_from ?? "N/A"} to {structure.effective_to ?? "N/A"}.
        </p>
      </div>
    </div>
  );
}
