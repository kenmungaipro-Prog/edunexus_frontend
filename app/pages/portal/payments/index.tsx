// Route Path: /portal/payments
// Path: frontend/app/pages/portal/payments/index.tsx

import { useState, type FormEvent } from "react";
import { Link, useFetcher } from "react-router";
import { api, type ApiResponse, type ParentProfile, type Student } from "~/lib/api";

interface ParentChild extends Student {
  finance_balance?: { balance: number };
}

function isParentProfileResponse(value: unknown): value is ApiResponse<ParentProfile> {
  return typeof value === "object" && value !== null && "success" in value && "data" in value;
}

export async function clientLoader() {
  const response = await api.portal.myChildren();
  const payload = isParentProfileResponse(response) ? response.data : response;
  const children = (payload.children ?? []) as ParentChild[];
  return { children };
}

function money(value: string | number) {
  return `KES ${Number(value).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

export default function ParentPaymentPortal({ loaderData }: { loaderData: { children: ParentChild[] } }) {
  const { children } = loaderData;
  const fetcher = useFetcher();
  
  const [selectedChildId, setSelectedChildId] = useState<number | "">(children[0]?.id ?? "");
  const [amount, setAmount] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  const selectedChild = children.find(c => c.id === Number(selectedChildId));
  const isSubmitting = fetcher.state !== "idle";

  async function handlePay(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedChildId || !amount || !phone) return;

    fetcher.submit(
      { 
        student_id: String(selectedChildId), 
        amount: amount, 
        phone_number: phone 
      },
      { method: "post", action: "/api/v1/portal/payments/mpesa/stk-push" }
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pt-4 sm:pt-8 px-4 sm:px-0 box-border">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Pay School Fees</h1>
        <p className="text-sm text-slate-400 mt-1">
          Instantly pay via M-Pesa. A prompt will be sent to your phone.
        </p>
      </div>

      {fetcher.data?.success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            ✓
          </div>
          <h3 className="font-bold text-white">Check Your Phone</h3>
          <p className="text-sm text-emerald-200 mt-1">
            {fetcher.data.message}
          </p>
        </div>
      )}

      {fetcher.data?.success === false && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {fetcher.data.message}
        </div>
      )}

      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden shadow-lg">
        <form onSubmit={handlePay} className="p-4 sm:p-6 space-y-5">
          {/* Student Selector */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Select Child
            </label>
            <select
              required
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="" disabled>Select your child...</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.full_name} (Adm: {child.admission_no})
                </option>
              ))}
            </select>
          </div>

          {/* Balance Display */}
          {selectedChild && (
            <div className="rounded-lg bg-slate-900/50 p-4 border border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Current Balance</p>
                <p className="text-sm text-slate-300">Outstanding fees</p>
              </div>
              <div className="text-left sm:text-right">
                <p className={`text-lg sm:text-xl font-bold break-words ${Number(selectedChild.finance_balance?.balance) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {money(selectedChild.finance_balance?.balance ?? 0)}
                </p>
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Amount to Pay
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">KES</span>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 py-3 pl-12 pr-3 text-sm font-bold text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                M-Pesa Number
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedChildId}
            className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            {isSubmitting ? "Sending Request to Safaricom..." : "Pay via M-Pesa"}
          </button>
        </form>
      </div>
      
      <div className="text-center text-xs text-slate-500 px-2">
        <p>Payments are processed instantly and will automatically reflect on your child's statement.</p>
        <p className="mt-1">Powered by Safaricom Daraja</p>
      </div>
    </div>
  );
}