// ============================================================
// app/pages/finance/fee-structures/edit-$id.tsx
// ============================================================

import { useState } from "react";
import { useNavigate, Link } from "react-router";
import type { Route } from "./+types/edit-$id";
import { api, type FeeStructure, type FeeStructureItem } from "~/lib/api";

export async function clientLoader({ params }: Route.LoaderArgs) {
  const id = Number(params.id);
  const response = await api.finance.feeStructure(id);
  return { structure: response.data };
}

function money(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  const valid = Number.isFinite(parsed) ? parsed : 0;
  return `KES ${valid.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

export default function FeeStructureEditPage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { structure: initialStructure } = loaderData as { structure: FeeStructure };
  
  const [formData, setFormData] = useState({
    name: initialStructure.name,
    status: initialStructure.status,
    billing_period: initialStructure.billing_period,
    effective_from: initialStructure.effective_from,
    effective_to: initialStructure.effective_to,
  });

  const [items, setItems] = useState<Array<FeeStructureItem & { _isEditing?: boolean }>>(
    initialStructure.items || []
  );

  const [editingAmounts, setEditingAmounts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const total = items.reduce((sum, item) => {
    const amount = editingAmounts[item.id]
      ? Number(editingAmounts[item.id])
      : Number(item.amount ?? 0);
    const valid = Number.isFinite(amount) ? amount : 0;
    return sum + valid;
  }, 0);

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAmountChange = (itemId: number, value: string) => {
    setEditingAmounts((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const toggleItemEdit = (itemId: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, _isEditing: !item._isEditing } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatePayload = {
        ...formData,
        items: items.map((item) => ({
          ...item,
          amount: editingAmounts[item.id] !== undefined 
            ? Number(editingAmounts[item.id]) 
            : item.amount,
        })),
      };

      await api.finance.updateFeeStructure(initialStructure.id, updatePayload);
      setSuccess("Fee structure updated successfully!");
      
      setEditingAmounts({});
      setItems(
        items.map((item) => ({
          ...item,
          _isEditing: false,
        }))
      );

      setTimeout(() => {
        navigate(`/finance/fee-structures/${initialStructure.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update fee structure");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-2 sm:p-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to={`/finance/fee-structures/${initialStructure.id}`}
            className="text-slate-400 hover:text-slate-200 text-sm font-medium"
          >
            ← Back to Fee Structure
          </Link>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white">Edit Fee Structure</h1>
          <p className="text-sm text-slate-400 mt-1">{initialStructure.name}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Fields */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4 sm:p-6 space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-white">Structure Details</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Structure Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleFormChange("status", e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                disabled={loading}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Billing Period
              </label>
              <select
                value={formData.billing_period}
                onChange={(e) => handleFormChange("billing_period", e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                disabled={loading}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semester">Semester</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Effective From
              </label>
              <input
                type="date"
                value={formData.effective_from || ""}
                onChange={(e) => handleFormChange("effective_from", e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Effective To
              </label>
              <input
                type="date"
                value={formData.effective_to || ""}
                onChange={(e) => handleFormChange("effective_to", e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Fee Items */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-white">Fee Items</h2>
              <div className="text-sm font-semibold text-slate-300">
                Total: <span className="text-white">{money(total)}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 sm:px-5 py-3">Item</th>
                  <th className="px-4 sm:px-5 py-3">Category</th>
                  <th className="px-4 sm:px-5 py-3">Recurring</th>
                  <th className="px-4 sm:px-5 py-3">Mandatory</th>
                  <th className="px-4 sm:px-5 py-3 text-right">Amount</th>
                  <th className="px-4 sm:px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {items && items.length > 0 ? (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-700/40 transition-colors">
                      <td className="px-4 sm:px-5 py-4 text-slate-200">
                        {item.description || item.fee_category?.name || "Untitled item"}
                      </td>
                      <td className="px-4 sm:px-5 py-4 text-slate-300">
                        {item.fee_category?.name || "—"}
                      </td>
                      <td className="px-4 sm:px-5 py-4 text-slate-300">
                        {item.is_recurring ? "Yes" : "No"}
                      </td>
                      <td className="px-4 sm:px-5 py-4 text-slate-300">
                        {item.is_mandatory ? "Yes" : "No"}
                      </td>
                      <td className="px-4 sm:px-5 py-4 text-right">
                        {item._isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editingAmounts[item.id] !== undefined ? editingAmounts[item.id] : item.amount}
                            onChange={(e) => handleAmountChange(item.id, e.target.value)}
                            className="w-24 rounded border border-slate-500 bg-slate-700 px-2 py-1.5 text-right text-white focus:border-blue-500 focus:outline-none"
                            disabled={loading}
                          />
                        ) : (
                          <span className="font-semibold text-white">
                            {money(
                              editingAmounts[item.id] !== undefined
                                ? editingAmounts[item.id]
                                : item.amount
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-4 sm:px-5 py-4">
                        <button
                          type="button"
                          onClick={() => toggleItemEdit(item.id)}
                          className="text-xs font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50 py-1 px-2"
                          disabled={loading}
                        >
                          {item._isEditing ? "Done" : "Edit"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                      No fee items found for this structure.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
          <Link
            to={`/finance/fee-structures/${initialStructure.id}`}
            className="w-full sm:w-auto text-center rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}