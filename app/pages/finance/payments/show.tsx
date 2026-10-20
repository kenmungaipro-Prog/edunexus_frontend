import { Link } from "react-router";
import { api, type FinancePayment } from "~/lib/api";

export async function clientLoader({ params }: { params: { id: string } }) {
  const res = await api.finance.payment(Number(params.id));
  return { payment: res?.data ?? null };
}

function money(value: number | string | null | undefined, currency = "KES") {
  return `${currency} ${Number(value ?? 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

function date(value: string | null | undefined) {
  return value
    ? new Date(value).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })
    : "-";
}

export default function FinancePaymentShowPage({ loaderData }: { loaderData: { payment: FinancePayment | null } }) {
  const { payment } = loaderData;

  if (!payment) {
    return (
      <div className="space-y-4">
        <Link to="/finance/payments" className="text-sm text-slate-400 hover:text-white">← Back to payments</Link>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-sm text-slate-300">
          Payment not found or could not be loaded.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <Link to="/finance/payments" className="text-sm text-slate-400 hover:text-white">← Back to payments</Link>
        <h1 className="mt-2 text-2xl font-bold text-white">Payment {payment.payment_number}</h1>
        <p className="mt-1 text-sm capitalize text-slate-400">{payment.status.replaceAll("_", " ")}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DetailCard label="Amount" value={money(payment.amount, payment.currency)} />
        <DetailCard label="Payment date" value={date(payment.payment_date)} />
        <DetailCard label="Method" value={payment.payment_method.replaceAll("_", " ")} />
        <DetailCard label="Receipt" value={payment.receipt?.receipt_number ?? "-"} />
        <DetailCard label="Reference" value={payment.reference_number ?? payment.external_transaction_id ?? "-"} />
        <DetailCard label="Student" value={payment.student?.full_name ?? "-"} />
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">Allocated invoices</h2>
        {payment.allocations?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2.5 pr-4">Invoice</th>
                  <th className="py-2.5 pr-4">Allocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {payment.allocations.map((allocation) => (
                  <tr key={allocation.id} className="text-slate-300">
                    <td className="py-3 pr-4">
                      {allocation.invoice ? (
                        <Link
                          to={`/finance/invoices/${allocation.invoice.id}`}
                          className="font-mono text-xs text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          {allocation.invoice.invoice_number}
                        </Link>
                      ) : (
                        <span className="text-slate-500">Invoice unavailable</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-white">
                      {money(allocation.amount_allocated, payment.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400">This payment has not been allocated to an invoice.</p>
        )}
      </section>
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 break-words font-semibold capitalize text-white">{value}</div>
    </div>
  );
}
