// ============================================================
// app/pages/finance/students/statement.tsx
// ============================================================

import { Link } from "react-router";
import { api, type FinancePayment, type Invoice, type Student, type StudentFinanceBalance } from "~/lib/api";

export async function clientLoader({ params }: { params: { id: string } }) {
  const res = await api.finance.studentStatement(Number(params.id));
  return res.data;
}

function money(value: number | string | null | undefined) {
  return `KES ${Number(value ?? 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

function date(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" }) : "-";
}

export default function StudentStatementPage({ loaderData }: { loaderData: { student: Student; balance: StudentFinanceBalance; overdue_balance: number; due_soon_balance: number; invoices: Invoice[]; payments: FinancePayment[] } }) {
  const { student, balance, overdue_balance, due_soon_balance, invoices, payments } = loaderData;

  const openingBalance = Number(balance?.opening_balance ?? 0);
  const invoicedTotal = Number(balance?.invoiced_total ?? 0);
  const paidTotal = Number(balance?.paid_total ?? 0);
  const currentBalance = Number(balance?.balance ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/finance/dashboard" className="text-sm text-slate-400 hover:text-white">← Back to finance</Link>
          <h1 className="mt-2 text-xl sm:text-2xl font-bold text-white">Student Statement</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs sm:text-sm text-slate-400">
            <span className="font-medium text-slate-300">{student.full_name}</span>
            <span>•</span>
            <span>{student.admission_no}</span>
            <span>•</span>
            <span>{student.class_room?.name ?? "No class"}</span>
          </div>
        </div>
        <Link 
          to="/finance/payments/collect" 
          className="w-full sm:w-auto text-center rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors shadow-sm"
        >
          Collect Payment
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
        <SummaryCard label="Opening Balance" value={money(openingBalance)} />
        <SummaryCard label="Total Invoiced" value={money(invoicedTotal)} />
        <SummaryCard label="Total Paid" value={money(paidTotal)} />
        <SummaryCard label="Current Balance" value={money(currentBalance)} tone={currentBalance > 0 ? "text-amber-400" : "text-emerald-400"} />
        <SummaryCard label="Overdue Balance" value={money(overdue_balance)} tone="text-red-400" />
        <SummaryCard label="Due Soon Balance" value={money(due_soon_balance)} tone="text-yellow-400" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-white">Invoices</h2>
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2.5 pr-3">Invoice</th>
                  <th className="py-2.5 pr-3">Total</th>
                  <th className="py-2.5 pr-3">Paid</th>
                  <th className="py-2.5 pr-3">Balance</th>
                  <th className="py-2.5 pr-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {invoices.length > 0 ? invoices.map((invoice) => (
                  <tr key={invoice.id} className="text-slate-300">
                    <td className="py-3 pr-3 font-mono text-xs text-blue-400">{invoice.invoice_number}</td>
                    <td className="py-3 pr-3">{money(invoice.total)}</td>
                    <td className="py-3 pr-3">{money(invoice.amount_paid)}</td>
                    <td className="py-3 pr-3 font-semibold text-white">{money(invoice.balance)}</td>
                    <td className="py-3 pr-3 capitalize">{invoice.status.replace("_", " ")}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-500">No invoices yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-white">Payments</h2>
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2.5 pr-3">Payment</th>
                  <th className="py-2.5 pr-3">Receipt</th>
                  <th className="py-2.5 pr-3">Method</th>
                  <th className="py-2.5 pr-3">Amount</th>
                  <th className="py-2.5 pr-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {payments.length > 0 ? payments.map((payment) => (
                  <tr key={payment.id} className="text-slate-300">
                    <td className="py-3 pr-3 font-mono text-xs text-blue-400">{payment.payment_number}</td>
                    <td className="py-3 pr-3 font-mono text-xs">{payment.receipt?.receipt_number ?? "-"}</td>
                    <td className="py-3 pr-3 capitalize">{payment.payment_method.replace("_", " ")}</td>
                    <td className="py-3 pr-3 font-semibold text-white">{money(payment.amount)}</td>
                    <td className="py-3 pr-3 text-slate-400">{date(payment.payment_date)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-500">No payments yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone = "text-white" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:p-5">
      <div className={`text-xl sm:text-2xl font-bold ${tone}`}>{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}