import { Link, useNavigate, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import api, { type FeeStructure, type FeeCategory, type AcademicSession, type ClassRoom, type PaginationMeta } from "~/lib/api";

export async function clientLoader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const status = url.searchParams.get("status") ?? undefined;
  const class_id = url.searchParams.get("class_id") ? Number(url.searchParams.get("class_id")) : undefined;

  const [structuresRes, classesRes, sessionsRes] = await Promise.all([
    api.finance.feeStructures({ page, per_page: 20, status: status || undefined, class_id }),
    api.classes.list({ per_page: 200 }),
    api.academicSessions.list(),
  ]);

  return {
    structures: structuresRes.data.data,
    meta: structuresRes.data.meta,
    classes: classesRes.data,
    sessions: sessionsRes.data,
  };
}

function money(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  const valid = Number.isFinite(parsed) ? parsed : 0;
  return `KES ${valid.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

function statusClass(status: string) {
  if (status === "active") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
  if (status === "inactive") return "bg-slate-600/50 text-slate-400 border-slate-500/25";
  return "bg-amber-500/15 text-amber-400 border-amber-500/25";
}

export default function FeeStructuresPage({
  loaderData,
}: {
  loaderData: {
    structures: FeeStructure[];
    meta: PaginationMeta;
    classes: ClassRoom[];
    sessions: AcademicSession[];
  };
}) {
  const { structures, meta, classes, sessions } = loaderData;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch categories for the modal
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  useEffect(() => {
    api.finance.feeCategories({ per_page: 200 }).then((r) => setCategories(r.data.data));
  }, []);

  function setParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      value ? next.set(key, value) : next.delete(key);
      if (key !== "page") next.delete("page");
      return next;
    });
  }

  const handleDelete = async (structure: FeeStructure) => {
    if (!confirm(`Delete "${structure.name}"? This cannot be undone.`)) return;
    setDeletingId(structure.id);
    try {
      await api.finance.deleteFeeStructure(structure.id);
      navigate(".");
    } catch {
      alert("Failed to delete. The structure may be in use.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Fee Structures</h1>
          <p className="text-sm text-slate-400 mt-1">
            Define billing templates per class, session, and term
          </p>
        </div>
        <button
          onClick={() => { setEditingStructure(null); setShowModal(true); }}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
        >
          + Create Structure
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={searchParams.get("status") ?? ""}
          onChange={(e) => setParam("status", e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={searchParams.get("class_id") ?? ""}
          onChange={(e) => setParam("class_id", e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Structures Table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Session</th>
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3">Items</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {structures.length > 0 ? structures.map((structure) => {
                const total = structure.items?.reduce((sum, item) => sum + Number(item.amount ?? 0), 0) ?? 0;
                return (
                  <tr key={structure.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="px-5 py-3 font-medium text-white">{structure.name}</td>
                    <td className="px-5 py-3 text-slate-300">{structure.class_room?.name ?? "All Classes"}</td>
                    <td className="px-5 py-3 text-slate-300">{structure.session?.name ?? "-"}</td>
                    <td className="px-5 py-3 text-slate-400 capitalize">{structure.billing_period}</td>
                    <td className="px-5 py-3 text-slate-300">{structure.items?.length ?? 0} items</td>
                    <td className="px-5 py-3 font-semibold text-white">{money(total)}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusClass(structure.status)}`}>
                        {structure.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/finance/fee-structures/${structure.id}`}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors"
                          title="View"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => { setEditingStructure(structure); setShowModal(true); }}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(structure)}
                          disabled={deletingId === structure.id}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                    No fee structures found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {meta?.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-slate-700 px-5 py-4 text-xs text-slate-400">
            <span>Showing {meta.from}-{meta.to} of {meta.total}</span>
            <div className="flex gap-2">
              <button
                disabled={meta.current_page === 1}
                onClick={() => setParam("page", String(meta.current_page - 1))}
                className="rounded bg-slate-700 px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={meta.current_page === meta.last_page}
                onClick={() => setParam("page", String(meta.current_page + 1))}
                className="rounded bg-blue-500 px-3 py-1 text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <FeeStructureModal
          structure={editingStructure}
          categories={categories}
          classes={classes}
          sessions={sessions}
          onClose={() => { setShowModal(false); setEditingStructure(null); }}
          onSaved={() => { setShowModal(false); setEditingStructure(null); navigate("."); }}
        />
      )}
    </div>
  );
}

// ─── Fee Structure Modal ────────────────────────────────────────────────────────────

interface FeeStructureItem {
  fee_category_id: number;
  description: string;
  amount: number;
  is_mandatory: boolean;
  is_recurring: boolean;
}

interface FeeStructureModalProps {
  structure: FeeStructure | null;
  categories: FeeCategory[];
  classes: ClassRoom[];
  sessions: AcademicSession[];
  onClose: () => void;
  onSaved: () => void;
}

function FeeStructureModal({ structure, categories, classes, sessions, onClose, onSaved }: FeeStructureModalProps) {
  const isEdit = !!structure;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    session_id: structure?.session_id ?? (sessions[0]?.id ?? 0),
    class_id: structure?.class_id ?? null as number | null,
    name: structure?.name ?? "",
    billing_period: structure?.billing_period ?? "term",
    currency: structure?.currency ?? "KES",
    status: structure?.status ?? "draft",
    effective_from: structure?.effective_from ?? "",
    effective_to: structure?.effective_to ?? "",
    items: structure?.items?.map((item) => ({
      fee_category_id: item.fee_category_id,
      description: item.description ?? "",
      amount: item.amount,
      is_mandatory: item.is_mandatory,
      is_recurring: item.is_recurring,
    })) ?? [] as FeeStructureItem[],
  });

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { fee_category_id: 0, description: "", amount: 0, is_mandatory: true, is_recurring: true },
      ],
    });
  };

  const updateItem = (index: number, field: keyof FeeStructureItem, value: unknown) => {
    const newItems = [...formData.items];
    (newItems[index] as Record<string, unknown>)[field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      setError("Add at least one item");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        items: formData.items.filter((item) => item.fee_category_id > 0 && item.amount > 0),
      };
      if (isEdit) {
        await api.finance.updateFeeStructure(structure.id, payload);
      } else {
        await api.finance.createFeeStructure(payload);
      }
      onSaved();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Failed to save. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const total = formData.items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4 sticky top-0 bg-slate-800">
          <h2 className="text-base font-semibold text-white">
            {isEdit ? "Edit Fee Structure" : "New Fee Structure"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Session
              </label>
              <select
                required
                value={formData.session_id}
                onChange={(e) => setFormData({ ...formData, session_id: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Class (optional)
              </label>
              <select
                value={formData.class_id ?? ""}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="e.g. Term 1 2026"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Billing Period
              </label>
              <select
                value={formData.billing_period}
                onChange={(e) => setFormData({ ...formData, billing_period: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="term">Term</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
                <option value="once">One-time</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "draft" | "active" | "inactive" })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Currency
              </label>
              <input
                type="text"
                required
                maxLength={3}
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="KES"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Fee Items
              </label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 p-2">
                  <select
                    value={item.fee_category_id}
                    onChange={(e) => updateItem(index, "fee_category_id", Number(e.target.value))}
                    className="flex-1 rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white"
                  >
                    <option value={0}>Select category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(e) => updateItem(index, "amount", Number(e.target.value))}
                    className="w-24 rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="rounded p-1 text-slate-400 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 text-right">
              <span className="text-sm text-slate-400">Total: </span>
              <span className="text-lg font-bold text-white">{money(total)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}