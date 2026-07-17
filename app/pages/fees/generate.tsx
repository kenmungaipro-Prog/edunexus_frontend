// ============================================================
// app/pages/fees/generate.tsx
// EduNexus — Automated Invoice Generation
// ============================================================
import { Form, Link, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import api from "~/lib/api";

export async function clientLoader() {
  // Fetch available fee structures and active students
  const [structuresRes, studentsRes] = await Promise.all([
    api.finance.feeStructures(), // Adjust this to match your api client method
    api.students.list({ per_page: 500, status: 'active' })
  ]);
  
  return {
    feeStructures: structuresRes.data?.data ?? structuresRes.data ?? [],
    students: studentsRes.data?.data ?? studentsRes.data ?? [],
  };
}

export async function clientAction({ request }: { request: Request }) {
  const form = await request.formData();
  
  const payload: any = {
    fee_structure_id: Number(form.get("fee_structure_id")),
    due_date: form.get("due_date") ? form.get("due_date") as string : undefined,
  };

  const targetType = form.get("target_type");
  if (targetType === "single" && form.get("student_id")) {
    payload.student_id = Number(form.get("student_id"));
  }

  try {
    const res = await api.finance.generateInvoices(payload);
    
    return { 
      success: true, 
      data: res.data,
      isBulk: targetType === "bulk"
    };
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to generate invoices." };
  }
}

export default function GenerateInvoicesPage({ loaderData, actionData }: any) {
  const { feeStructures, students } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  const [targetType, setTargetType] = useState<"bulk" | "single">("bulk");

  if (actionData?.success) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="text-5xl mb-4">🧾</div>
        <h2 className="text-xl font-bold text-white mb-2">Generation Complete!</h2>
        <p className="text-slate-400 mb-6">
          {actionData.isBulk 
            ? `Successfully generated ${actionData.data.created} invoices for the class.` 
            : `Successfully generated Invoice #${actionData.data.invoice_number} for the student.`}
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/fees" className="px-4 py-2 rounded-lg text-sm bg-slate-700 text-slate-300 hover:bg-slate-600 transition">
            ← Back to Dashboard
          </Link>
          <Link to="/fees/collect" className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-500 transition">
            Collect Payments →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white">🧾 Generate Invoices</h1>
        <p className="text-slate-400 text-sm mt-1">Issue fee structures to single students or bulk-bill entire classes.</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
        {actionData?.error && (
          <div className="m-6 mb-0 bg-red-500/10 border border-red-500/25 text-red-400 text-sm rounded-lg p-4">
            <strong>Error:</strong> {actionData.error}
          </div>
        )}

        <Form method="post" className="p-6 space-y-6">
          {/* Section 1: Fee Structure Selection */}
          <div className="space-y-4 pb-6 border-b border-slate-700">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Fee Structure</label>
              <select 
                name="fee_structure_id" 
                required 
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
              >
                <option value="">Select a billing structure...</option>
                {feeStructures.map((fs: any) => (
                  <option key={fs.id} value={fs.id}>
                    {fs.name} ({fs.currency}) - {fs.class_room ? `Class: ${fs.class_room.name}` : 'All Classes'}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1.5">This determines the line items and total amounts billed.</p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Due Date (Optional)</label>
              <input 
                type="date" 
                name="due_date" 
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition" 
              />
            </div>
          </div>

          {/* Section 2: Target Selection */}
          <div className="space-y-4 pb-6 border-b border-slate-700">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Billing Target</label>
            
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input 
                  type="radio" 
                  name="target_type" 
                  value="bulk" 
                  checked={targetType === "bulk"} 
                  onChange={() => setTargetType("bulk")}
                  className="accent-blue-500"
                />
                Entire Class (Bulk)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input 
                  type="radio" 
                  name="target_type" 
                  value="single" 
                  checked={targetType === "single"} 
                  onChange={() => setTargetType("single")}
                  className="accent-blue-500"
                />
                Single Student
              </label>
            </div>

            {targetType === "bulk" && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-200">
                ℹ️ The system will automatically find all students enrolled in the class associated with the selected Fee Structure and generate an invoice for each student.
              </div>
            )}

            {targetType === "single" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Student</label>
                <select 
                  name="student_id" 
                  required={targetType === "single"}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
                >
                  <option value="">Search or select student...</option>
                  {students.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex gap-3 pt-4">
            <Link to="/fees" className="px-6 py-3 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600 transition">
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-bold hover:opacity-90 transition disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin text-lg">↻</span> Generating...
                </>
              ) : (
                <>⚙️ Generate {targetType === "bulk" ? "Batch Invoices" : "Invoice"}</>
              )}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}