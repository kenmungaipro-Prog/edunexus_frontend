import { Link, useParams } from "react-router";

export default function FeeReceiptPage() {
  const { receiptId } = useParams();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/fees" className="text-slate-400 hover:text-white text-sm transition">← Back to Fees</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm">Receipt {receiptId}</span>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Fee Receipt</h1>
            <p className="text-slate-400 text-sm">Receipt details for <span className="font-mono text-blue-300">{receiptId}</span></p>
          </div>
          <button className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition">🖨 Print</button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Student</p>
            <p className="font-semibold text-slate-100">Student Name</p>
            <p className="text-slate-500 text-sm">Class / Admission No.</p>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Date</p>
            <p className="font-semibold text-slate-100">Apr 14, 2025</p>
            <p className="text-slate-500 text-sm">Paid via M-Pesa</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">Description</p>
            <p className="text-sm text-slate-500">Amount</p>
          </div>
          <div className="flex items-center justify-between py-3 border-t border-slate-700">
            <p className="text-slate-100">Tuition Fee</p>
            <p className="font-semibold text-slate-100">KES 12,500</p>
          </div>
          <div className="flex items-center justify-between py-3 border-t border-slate-700">
            <p className="text-slate-100">Transport Fee</p>
            <p className="font-semibold text-slate-100">KES 4,200</p>
          </div>
          <div className="flex items-center justify-between py-3 border-t border-slate-700 font-semibold text-slate-100">
            <p>Total</p>
            <p>KES 16,700</p>
          </div>
        </div>
      </div>
    </div>
  );
}
