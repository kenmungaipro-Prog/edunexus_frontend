// ============================================================
// app/pages/finance/fee-categories/index.tsx
// ============================================================

import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { api, type FeeCategory } from "~/lib/api";

export async function clientLoader() {
  const response = await api.finance.feeCategories({ per_page: 100 });
  return { categories: response.data.data };
}

function money(value: number | string | null | undefined) {
  return `KES ${Number(value ?? 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

export default function FeeCategoriesPage({
  loaderData,
}: {
  loaderData: { categories: FeeCategory[] };
}) {
  const { categories } = loaderData;
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FeeCategory | null>(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = categories.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (category: FeeCategory) => {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) return;
    setDeletingId(category.id);
    try {
      await api.finance.deleteFeeCategory(category.id);
      navigate(".");
    } catch {
      alert("Failed to delete category. It may be in use.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Fee Categories</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Define chargeable items like tuition, boarding, books, transport
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => { setEditingCategory(null); setShowModal(true); }}
            className="w-full sm:w-auto rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{categories.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">categories</p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-slate-800/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Active</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{categories.filter((c) => c.is_active).length}</p>
          <p className="text-xs text-slate-500 mt-0.5">active</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Default</p>
          <p className="text-xl sm:text-2xl font-bold text-white truncate">
            {money(categories.reduce((sum, c) => sum + c.default_amount, 0))}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">total value</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Categories Table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 sm:px-5 py-3">Code</th>
                <th className="px-4 sm:px-5 py-3">Name</th>
                <th className="px-4 sm:px-5 py-3">Default Amount</th>
                <th className="px-4 sm:px-5 py-3">Description</th>
                <th className="px-4 sm:px-5 py-3">Status</th>
                <th className="px-4 sm:px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filtered.length > 0 ? filtered.map((category) => (
                <tr key={category.id} className="hover:bg-slate-700/30 transition-colors group">
                  <td className="px-4 sm:px-5 py-3">
                    <span className="font-mono text-sm font-medium text-blue-400">{category.code}</span>
                  </td>
                  <td className="px-4 sm:px-5 py-3 font-medium text-white">{category.name}</td>
                  <td className="px-4 sm:px-5 py-3 text-slate-300">{money(category.default_amount)}</td>
                  <td className="px-4 sm:px-5 py-3 text-slate-400 max-w-xs truncate">{category.description ?? "-"}</td>
                  <td className="px-4 sm:px-5 py-3">
                    {category.is_active ? (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-400">Active</span>
                    ) : (
                      <span className="rounded-full bg-slate-600/50 px-2 py-1 text-xs font-semibold text-slate-400">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingCategory(category); setShowModal(true); }}
                        className="rounded p-2 sm:p-1.5 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors"
                        title="Edit"
                      >
                        <svg className="h-4 w-4 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        disabled={deletingId === category.id}
                        className="rounded p-2 sm:p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <svg className="h-4 w-4 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    {search ? "No categories match your search" : "No fee categories yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <FeeCategoryModal
          category={editingCategory}
          onClose={() => { setShowModal(false); setEditingCategory(null); }}
          onSaved={() => { setShowModal(false); setEditingCategory(null); navigate("."); }}
        />
      )}
    </div>
  );
}

interface FeeCategoryModalProps {
  category: FeeCategory | null;
  onClose: () => void;
  onSaved: () => void;
}

function FeeCategoryModal({ category, onClose, onSaved }: FeeCategoryModalProps) {
  const isEdit = !!category;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: category?.code ?? "",
    name: category?.name ?? "",
    description: category?.description ?? "",
    default_amount: category?.default_amount ?? 0,
    is_active: category?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await api.finance.updateFeeCategory(category.id, formData);
      } else {
        await api.finance.createFeeCategory(formData);
      }
      onSaved();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Failed to save. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md my-auto rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-4 sm:px-6 py-4">
          <h2 className="text-base font-semibold text-white">
            {isEdit ? "Edit Category" : "New Fee Category"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/15 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Code
              </label>
              <input
                type="text"
                required
                disabled={isEdit}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                placeholder="e.g. TUITION"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Default Amount
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.default_amount}
                onChange={(e) => setFormData({ ...formData, default_amount: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="e.g. Tuition Fees"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="Optional description..."
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
            />
            <span className="text-sm text-slate-200">Active</span>
          </label>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto rounded-lg border border-slate-600 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}