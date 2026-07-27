// ============================================================
// app/pages/fees/receipt.tsx
// ============================================================
import { Link, useParams } from "react-router";

export default function FeeReceiptPage() {
  const { receiptId } = useParams();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0 py-4">
      <div className="flex items-center gap-3 mb-6 overflow-x-auto whitespace-nowrap">
        <Link to="/fees" className="text-slate-400 hover:text-white text-sm transition">← Back to Fees</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-300">Receipt {receiptId}</span>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-700/60">
          <div>
            <h1 className="text-xl font-bold text-white">Fee Receipt</h1>
            <p className="text-slate-400 text-sm">Receipt details for <span className="font-mono text-blue-300">{receiptId}</span></p>
          </div>
          <button className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition flex items-center justify-center gap-2">
            <span>🖨</span> Print
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Student</p>
            <p className="font-semibold text-slate-100">Student Name</p>
            <p className="text-slate-500 text-sm">Class / Admission No.</p>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Date</p>
            <p className="font-semibold text-slate-100">Apr 14, 2025</p>
            <p className="text-slate-500 text-sm">Paid via M-Pesa</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 sm:p-5 overflow-x-auto">
          <div className="flex items-center justify-between mb-4 min-w-[280px]">
            <p className="text-sm text-slate-500">Description</p>
            <p className="text-sm text-slate-500">Amount</p>
          </div>
          <div className="flex items-center justify-between py-3 border-t border-slate-700 min-w-[280px]">
            <p className="text-slate-100 text-sm">Tuition Fee</p>
            <p className="font-semibold text-slate-100 text-sm">KES 12,500</p>
          </div>
          <div className="flex items-center justify-between py-3 border-t border-slate-700 min-w-[280px]">
            <p className="text-slate-100 text-sm">Transport Fee</p>
            <p className="font-semibold text-slate-100 text-sm">KES 4,200</p>
          </div>
          <div className="flex items-center justify-between py-3 border-t border-slate-700 font-semibold text-slate-100 min-w-[280px]">
            <p className="text-sm">Total</p>
            <p className="text-sm">KES 16,700</p>
          </div>
        </div>
      </div>
    </div>
  );
}