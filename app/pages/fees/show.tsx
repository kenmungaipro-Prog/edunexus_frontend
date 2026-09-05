// ============================================================
// app/pages/fees/show.tsx
// EduNexus — Dynamic Fee Transaction Details & Receipt View
// ============================================================
import { Link, useLoaderData, useParams } from "react-router";
import { api } from "~/lib/api";
import type { Fee } from "~/lib/api";

interface LoaderData {
  fee: Fee & {
    student?: {
      name: string;
      admission_number: string;
      class_room?: { name: string };
    };
    fee_type?: {
      name: string;
      description?: string;
    };
    collected_by_user?: {
      name: string;
    };
  };
}

export async function clientLoader({ params }: { params: { id: string } }) {
  try {
    const response = await api.fees.get(Number(params.id));
    return { fee: response.data };
  } catch (error: any) {
    console.error("Failed fetching fee receipt data:", error);
    throw new Response("Fee transaction record not found", { status: 404 });
  }
}

const formatCurrency = (amount: number | string) => {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(value || 0);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const formatPaymentMethod = (method?: string) => {
  if (!method) return "Unknown";
  const map: Record<string, string> = {
    mpesa: "M-Pesa",
    cash: "Cash",
    bank_deposit: "Bank Deposit",
    card: "Credit/Debit Card",
    cheque: "Cheque",
    online: "Online Payment",
  };
  return map[method.toLowerCase()] || method.toUpperCase();
};

export default function FeeShowPage() {
  const { fee } = useLoaderData<typeof clientLoader>() as unknown as LoaderData;
  const { id } = useParams();

  const handlePrint = () => window.print();

  const getStatusStyles = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "paid": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "partial": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "failed": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 selection:bg-blue-500 selection:text-white">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap">
          <Link to="/fees" className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-1.5">
            ← Back to Fees
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-slate-300 font-medium">Receipt #{id}</span>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden print:bg-white print:border-none print:shadow-none">
        <div className="p-4 sm:p-6 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/50 print:bg-white print:border-b-2 print:border-slate-300 print:p-0 print:pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-lg sm:text-xl font-bold text-slate-100 print:text-black print:text-2xl">EduNexus Receipt</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${getStatusStyles(fee.status)} print:text-black print:border-black print:px-2 print:py-0.5`}>
                {fee.status?.toUpperCase() || "PAID"}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1 print:text-slate-600">
              Official payment voucher for token: <span className="font-mono text-blue-300 font-medium print:text-black">{id}</span>
            </p>
          </div>
          
          <button onClick={handlePrint} className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition shadow-md flex items-center justify-center gap-2 print:hidden">
            <span>🖨</span> Print Receipt
          </button>
        </div>

        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 print:p-0 print:pt-6">
          <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-4 sm:p-5 print:bg-white print:border-slate-300">
            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3 print:text-slate-700">Student Details</h3>
            <div className="space-y-1">
              <p className="font-bold text-slate-100 text-base print:text-black">{fee.student?.name || "Unknown Student"}</p>
              <p className="text-slate-400 text-sm print:text-slate-700">Adm No: <span className="text-slate-200 font-medium print:text-black">{fee.student?.admission_number || "N/A"}</span></p>
              {fee.student?.class_room?.name && (
                <p className="text-slate-400 text-sm print:text-slate-700">Class: <span className="text-slate-200 font-medium print:text-black">{fee.student.class_room.name}</span></p>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-4 sm:p-5 print:bg-white print:border-slate-300">
            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3 print:text-slate-700">Payment Parameters</h3>
            <div className="space-y-1 text-sm text-slate-400 print:text-slate-700">
              <p>Date Settled: <span className="font-medium text-slate-200 print:text-black">{formatDate(fee.created_at)}</span></p>
              <p>Payment Route: <span className="font-medium text-slate-200 print:text-black">{formatPaymentMethod(fee.payment_method)}</span></p>
              {fee.transaction_id && (
                <p>Reference Ref: <span className="font-mono bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded text-xs print:bg-none print:text-black print:font-bold">{fee.transaction_id}</span></p>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-6 print:px-0">
          <div className="bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden print:bg-white print:border-slate-300">
            <div className="grid grid-cols-3 bg-slate-950/40 px-4 sm:px-5 py-3 border-b border-slate-700/60 text-xs font-bold text-slate-400 uppercase tracking-wider print:bg-slate-100 print:text-slate-700">
              <div className="col-span-2">Allocation Structure / Fee Type</div>
              <div className="text-right">Settled Subtotal</div>
            </div>

            <div className="divide-y divide-slate-700/40 print:divide-slate-300">
              <div className="grid grid-cols-3 px-4 sm:px-5 py-4 items-center text-sm">
                <div className="col-span-2">
                  <p className="font-semibold text-slate-200 print:text-black">{fee.fee_type?.name || "General Fee Category"}</p>
                  {fee.fee_type?.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 print:text-slate-600">{fee.fee_type.description}</p>
                  )}
                </div>
                <div className="text-right font-medium text-slate-200 print:text-black">{formatCurrency(fee.amount)}</div>
              </div>
            </div>

            <div className="bg-slate-950/20 px-4 sm:px-5 py-4 border-t border-slate-700/60 space-y-2 print:bg-white print:border-slate-300">
              <div className="flex justify-between items-center text-sm text-slate-400 print:text-slate-700">
                <span>Gross Statement Amount</span>
                <span className="text-slate-300 print:text-black">{formatCurrency(fee.amount)}</span>
              </div>
              <div className="flex justify-between items-center text-base font-bold pt-2 border-t border-slate-700/60 print:border-slate-300">
                <span className="text-slate-200 print:text-black">Total Paid (Net)</span>
                <span className="text-blue-400 text-lg print:text-black">{formatCurrency(fee.amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {fee.remarks && (
          <div className="mx-4 sm:mx-6 mb-6 p-4 bg-slate-900/40 border border-dashed border-slate-700 rounded-xl text-xs text-slate-400 print:bg-white print:border-slate-300 print:text-slate-700">
            <span className="font-bold text-slate-300 block mb-1 print:text-black">Accounting Remarks:</span>
            {fee.remarks}
          </div>
        )}

        <div className="hidden print:block mt-16 px-4">
          <div className="flex justify-between items-end text-xs text-slate-600">
            <div>
              <p>Issued By: {fee.collected_by_user?.name || "System Automated Teller"}</p>
              <p>Date Printed: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-center w-48">
              <div className="border-b border-black h-8 mb-1"></div>
              <p className="font-medium">Finance Officer Stamp / Signature</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background-color: #ffffff !important; color: #000000 !important; }
          header, sidebar, nav, footer { display: none !important; }
        }
      `}</style>
    </div>
  );
}