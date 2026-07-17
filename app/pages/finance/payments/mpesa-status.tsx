import { useEffect, useState } from "react";
import { Link } from "react-router";
import api, { type MpesaStatusEntry } from "~/lib/api";

function money(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? `KES ${numeric.toLocaleString("en-KE")}` : "KES 0";
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString("en-KE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";
}

function gatewayLabel(gatewayName: string | null) {
  if (!gatewayName) return "UNKNOWN";
  if (gatewayName === "coop_400222") return "CO-OP BANK 400222";
  return gatewayName.replace(/_/g, " ").toUpperCase();
}

function badgeClass(status: string) {
  switch (status) {
    case "successful":
      return "bg-emerald-500/15 text-emerald-400";
    case "failed":
      return "bg-rose-500/15 text-rose-400";
    case "pending":
      return "bg-amber-500/15 text-amber-400";
    default:
      return "bg-slate-700/70 text-slate-300";
  }
}

export default function MpesaStatusPage() {
  const [entries, setEntries] = useState<MpesaStatusEntry[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filteredEntries = selectedGateway === "all"
    ? entries
    : entries.filter((entry) => entry.gateway_name === selectedGateway);

  useEffect(() => {
    let mounted = true;

    api.finance.mpesaStatus()
      .then((res) => {
        if (mounted) {
          setEntries(res.data ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setError("Unable to load M-Pesa status right now.");
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gateway Status</h1>
          <p className="mt-1 text-sm text-slate-400">Recent payment gateway activity, callbacks, and processing state across M-Pesa and bank integrations.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={selectedGateway} onChange={(e) => setSelectedGateway(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
            <option value="all">All Gateways</option>
            <option value="mpesa">M-Pesa</option>
            <option value="coop_400222">Co-op Bank 400222</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
          <span className="rounded-full bg-slate-700/60 px-3 py-1 text-xs font-semibold text-slate-200">Includes Co-op Bank 400222</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        {loading ? (
          <p className="text-sm text-slate-400">Loading gateway activity…</p>
        ) : error ? (
          <p className="text-sm text-rose-400">{error}</p>
        ) : filteredEntries.length === 0 ? (
          <p className="text-sm text-slate-400">No gateway activity found for the selected filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Gateway</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Merchant</th>
                  <th className="py-2 pr-3">Checkout</th>
                  <th className="py-2 pr-3">Reference</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Receipt</th>
                  <th className="py-2 pr-3">Callback</th>
                  <th className="py-2 pr-3">Processed</th>
                  <th className="py-2 pr-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredEntries.map((entry) => (
                  <tr key={entry.gateway_transaction_id} className="text-slate-300">
                    <td className="py-3 pr-3 text-slate-400">{gatewayLabel(entry.gateway_name)}</td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(entry.status)}`}>{entry.status}</span>
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs text-slate-400">{entry.merchant_request_id ?? "-"}</td>
                    <td className="py-3 pr-3 font-mono text-xs text-slate-400">{entry.checkout_request_id ?? "-"}</td>
                    <td className="py-3 pr-3 text-slate-400">{entry.account_reference ?? "-"}</td>
                    <td className="py-3 pr-3 font-semibold text-white">{money(entry.gateway_amount)}</td>
                    <td className="py-3 pr-3 text-slate-400">{entry.mpesa_receipt_number ?? "-"}</td>
                    <td className="py-3 pr-3 text-slate-400">{entry.callback_result_code ? `${entry.callback_result_code}: ${entry.callback_result_desc ?? "-"}` : "Pending"}</td>
                    <td className="py-3 pr-3 text-slate-400">{entry.callback_processed ? "Yes" : "No"}</td>
                    <td className="py-3 pr-3 text-slate-400">{formatDate(entry.gateway_updated_at ?? entry.callback_updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
