// ============================================================
// app/pages/finance/payments/collect.tsx
// ============================================================

import { Form, Link, redirect, useActionData } from "react-router";
import { api, type Student } from "~/lib/api";

export async function clientLoader() {
  const students = await api.students.list({ per_page: 300, status: "active" });
  return { students: students.data.data };
}

export async function clientAction({ request }: { request: Request }) {
  const form = await request.formData();

  const studentId = Number(form.get("student_id"));
  const amount = Number(form.get("amount"));
  const paymentMethod = String(form.get("payment_method"));

  try {
    const res = await api.finance.collectPayment({
      student_id: studentId,
      amount,
      payment_method: paymentMethod as any,
      reference_number: String(form.get("reference_number") ?? ""),
      payer_name: String(form.get("payer_name") ?? ""),
      payer_phone: String(form.get("payer_phone") ?? ""),
      currency: "KES",
      auto_allocate: form.get("auto_allocate") === "on",
    });

    return redirect(`/finance/students/${res.data.student_id}/statement`);
  } catch (error: any) {
    return { error: error?.message ?? "Payment could not be recorded." };
  }
}

export default function FinanceCollectPaymentPage({ loaderData }: { loaderData: { students: Student[] } }) {
  const actionData = useActionData() as { error?: string } | undefined;

  return (
    <div className="max-w-3xl space-y-5 p-2 sm:p-0 mx-auto">
      <div>
        <Link to="/finance/payments" className="text-sm text-slate-400 hover:text-white">← Back to payments</Link>
        <h1 className="mt-2 text-xl sm:text-2xl font-bold text-white">Collect Payment</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Record a school fee payment and allocate it to the oldest invoices</p>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:p-6">
        {actionData?.error && (
          <div className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{actionData.error}</div>
        )}

        <Form method="post" className="grid gap-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Student</label>
            <select name="student_id" required className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500">
              <option value="">Select student</option>
              {loaderData.students.map((student) => (
                <option key={student.id} value={student.id}>{student.full_name} ({student.admission_no})</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</label>
              <input name="amount" type="number" min="1" step="0.01" required placeholder="15000" className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Method</label>
              <select name="payment_method" required className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500">
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

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Reference</label>
              <input name="reference_number" placeholder="M-Pesa or bank reference" className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Payer Name</label>
              <input name="payer_name" placeholder="Full name" className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Payer Phone</label>
              <input name="payer_phone" placeholder="2547..." className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500" />
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-300 py-1">
            <input name="auto_allocate" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-600 bg-slate-900" />
            Allocate to oldest unpaid invoices
          </label>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-700 pt-5">
            <Link to="/finance/payments" className="w-full sm:w-auto text-center rounded-lg bg-slate-700 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-600">Cancel</Link>
            <button type="submit" className="w-full sm:w-auto rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600">Record Payment</button>
          </div>
        </Form>
      </div>
    </div>
  );
}