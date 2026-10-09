// ============================================================
// app/pages/fees/collect.tsx
// EduNexus — Enterprise Payment Collection & Auto-Allocation
// ============================================================
import { Form, Link, useNavigation } from "react-router";
import { useState, useEffect } from "react";
import { api } from "~/lib/api";
import type { PaymentMethod } from "~/lib/api";

export async function clientLoader() {
  const studentsRes = await api.students.list({ per_page: 500, status: 'active' });
  return {
    students: studentsRes.data?.data ?? studentsRes.data ?? [],
  };
}

export async function clientAction({ request }: { request: Request }) {
  const form = await request.formData();
  try {
    const res = await api.finance.collectPayment({
      student_id: Number(form.get("student_id")),
      amount: Number(form.get("amount")),
      payment_method: form.get("payment_method") as PaymentMethod,
      reference_number: form.get("reference_number") as string,
      payer_name: form.get("payer_name") as string,
      auto_allocate: true,
    });
    
    const receiptRes = await api.finance.paymentReceipt(res.data.id);
    
    return { 
      success: true, 
      payment: res.data, 
      receiptId: receiptRes.data.id 
    };
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to process payment." };
  }
}

export default function CollectPaymentPage({ loaderData, actionData }: any) {
  const { students } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [balanceData, setBalanceData] = useState<{ balance: number; overdue: number } | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [receiptDownloadError, setReceiptDownloadError] = useState("");
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);

  async function downloadReceipt(receiptId: number) {
    setIsDownloadingReceipt(true);
    setReceiptDownloadError("");
    try {
      const response = await api.finance.receiptPdf(receiptId);
      const url = URL.createObjectURL(response);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${receiptId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: unknown) {
      setReceiptDownloadError(
        error && typeof error === "object" && "message" in error && typeof error.message === "string"
          ? error.message
          : "Could not download the receipt. Please try again.",
      );
    } finally {
      setIsDownloadingReceipt(false);
    }
  }

  useEffect(() => {
    let isCurrentRequest = true;
    if (!selectedStudent) {
      setBalanceData(null);
      setBalanceError("");
      setIsLoadingBalance(false);
      return () => {
        isCurrentRequest = false;
      };
    }
    
    setIsLoadingBalance(true);
    setBalanceError("");
    setBalanceData(null);
    api.finance.studentSummary(Number(selectedStudent))
      .then((res) => {
        if (!isCurrentRequest) return;
        setBalanceData({
          balance: Number(res.data.balance?.balance ?? 0),
          overdue: Number(res.data.overdue_balance ?? 0),
        });
      })
      .catch((error: unknown) => {
        if (!isCurrentRequest) return;
        setBalanceError(
          error && typeof error === "object" && "message" in error && typeof error.message === "string"
            ? error.message
            : "Could not load this student's outstanding balance.",
        );
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoadingBalance(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [selectedStudent]);

  if (actionData?.success) {
    return (
      <div className="max-w-md mx-auto text-center py-12 px-4">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-white mb-2">Payment Successfully Allocated</h2>
        <p className="text-slate-400 mb-6 text-sm">
          Transaction <span className="font-mono text-blue-400">{actionData.payment.payment_number}</span> has been processed and allocated to open invoices.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/fees" className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm bg-slate-700 text-slate-300 hover:bg-slate-600 transition text-center">
            ← Back to Dashboard
          </Link>
          <button
            type="button"
            onClick={() => downloadReceipt(actionData.receiptId)}
            disabled={isDownloadingReceipt}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm bg-blue-500 text-white hover:bg-blue-600 transition text-center disabled:cursor-wait disabled:opacity-60"
          >
            {isDownloadingReceipt ? "Preparing receipt…" : "🖨 Download / Print Receipt"}
          </button>
        </div>
        {receiptDownloadError && (
          <p role="alert" className="mt-4 text-sm text-red-400">{receiptDownloadError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0 py-4">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white">💳 Receive Payment</h1>
        <p className="text-slate-400 text-sm mt-1">Record funds received and auto-allocate to open invoices.</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
        {actionData?.error && (
          <div className="m-4 sm:m-6 mb-0 bg-red-500/10 border border-red-500/25 text-red-400 text-sm rounded-lg p-4">
            <strong>Error:</strong> {actionData.error}
          </div>
        )}

        <Form method="post" className="p-4 sm:p-6 space-y-6">
          <div className="space-y-4 pb-6 border-b border-slate-700">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Student</label>
              <select 
                name="student_id" 
                required 
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              >
                <option value="">Search or select student...</option>
                {students.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</option>
                ))}
              </select>
            </div>

            <div className={`transition-all duration-300 overflow-hidden ${selectedStudent ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="bg-slate-900/50 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-slate-700/50">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Total Outstanding Balance</p>
                  {isLoadingBalance ? (
                    <div className="h-6 w-24 bg-slate-700 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-lg font-bold text-slate-200">
                      KES {balanceData && Number.isFinite(balanceData.balance)
                        ? balanceData.balance.toLocaleString("en-KE")
                        : "—"}
                    </p>
                  )}
                </div>
                <div className="sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Overdue Amount</p>
                  {isLoadingBalance ? (
                    <div className="h-6 w-24 bg-slate-700 animate-pulse rounded sm:ml-auto"></div>
                  ) : (
                    <p className={`text-sm font-bold ${balanceData?.overdue ? 'text-red-400' : 'text-emerald-400'}`}>
                      KES {balanceData && Number.isFinite(balanceData.overdue)
                        ? balanceData.overdue.toLocaleString("en-KE")
                        : "—"}
                    </p>
                  )}
                </div>
              </div>
              {balanceError && (
                <p role="alert" className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                  {balanceError}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 pb-6 border-b border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Amount Received (KES)</label>
                <input 
                  type="number" 
                  name="amount" 
                  required 
                  min="0.01" 
                  step="0.01"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" 
                  placeholder="e.g. 15000" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Method</label>
                <select 
                  name="payment_method" 
                  required 
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="bank_deposit">Bank Deposit</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="card">Card</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Transaction Reference / ID</label>
              <input 
                type="text" 
                name="reference_number" 
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition" 
                placeholder="Bank receipt No, M-Pesa Code, or Cheque No." 
              />
              <p className="text-[10px] text-slate-500 mt-1.5">Required for M-Pesa, Bank, and Card payments.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payer Name (Optional)</label>
            <input 
              type="text" 
              name="payer_name" 
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition" 
              placeholder="e.g. John Doe (Father)" 
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link to="/fees" className="w-full sm:w-auto px-6 py-3 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600 transition text-center">
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-bold hover:opacity-90 transition disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin text-lg">↻</span> Processing...
                </>
              ) : (
                <>💰 Confirm & Allocate Payment</>
              )}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}