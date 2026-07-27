// ============================================================
// app/pages/Journals/index.tsx
// ============================================================

import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { accounting, type JournalEntry, type JournalEntryLine, type ChartOfAccount, type JournalEntryStatus } from "~/lib/api";

export async function clientLoader() {
  const [entries, accounts] = await Promise.all([
    accounting.journalEntries(),
    accounting.accountTree(),
  ]);
  return {
    entries: entries.data as JournalEntry[],
    accounts: accounts.data as ChartOfAccount[],
  };
}

function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function money(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function sumLines(lines: JournalEntryLine[] | undefined, field: "debit" | "credit") {
  return (lines ?? []).reduce((s, l) => s + (Number(l[field]) || 0), 0);
}

const STATUS_CFG: Record<JournalEntryStatus, { bg: string; text: string; label: string }> = {
  draft:     { bg: "bg-slate-500/15",   text: "text-slate-400",   label: "Draft" },
  posted:    { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Posted" },
  reversed:  { bg: "bg-red-500/15",     text: "text-red-400",     label: "Reversed" },
  cancelled: { bg: "bg-amber-500/15",   text: "text-amber-400",   label: "Cancelled" },
};

export default function JournalEntriesPage({
  loaderData,
}: {
  loaderData: { entries: JournalEntry[]; accounts: ChartOfAccount[] };
}) {
  const { entries, accounts } = loaderData;
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<JournalEntryStatus | "all">("all");

  const filtered = entries.filter((e) => {
    const matchesSearch =
      !search ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.reference ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openNew = () => { setSelectedEntry(null); setShowModal(true); };
  const openView = (entry: JournalEntry) => { setSelectedEntry(entry); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setSelectedEntry(null); };

  const counts = (["draft", "posted", "reversed", "cancelled"] as JournalEntryStatus[]).reduce(
    (acc, s) => { acc[s] = entries.filter((e) => e.status === s).length; return acc; },
    {} as Record<JournalEntryStatus, number>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Journal Entries</h1>
          <p className="text-sm text-slate-400 mt-1">General ledger double-entry records</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
          <Link
            to="/accounting/accounts"
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors text-center"
          >
            Chart of Accounts
          </Link>
          <button
            onClick={openNew}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors text-center"
          >
            + New Entry
          </button>
        </div>
      </div>

      {/* Status Summary Chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            statusFilter === "all"
              ? "bg-slate-600 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          All ({entries.length})
        </button>
        {(["draft", "posted", "reversed", "cancelled"] as JournalEntryStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === s
                ? `${STATUS_CFG[s].bg} ${STATUS_CFG[s].text} ring-1 ring-current`
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {STATUS_CFG[s].label} ({counts[s]})
          </button>
        ))}
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
          placeholder="Search by description or reference..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 w-28">Date</th>
                <th className="px-3 py-3 w-32">Reference</th>
                <th className="px-3 py-3">Description</th>
                <th className="px-3 py-3 text-right w-36">Debit</th>
                <th className="px-3 py-3 text-right w-36">Credit</th>
                <th className="px-3 py-3 w-24">Status</th>
                <th className="px-3 py-3 w-16 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.length > 0 ? (
                filtered.map((entry) => {
                  const debit  = sumLines(entry.lines, "debit");
                  const credit = sumLines(entry.lines, "credit");
                  const cfg    = STATUS_CFG[entry.status];
                  return (
                    <tr key={entry.id} className="group text-slate-300 hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3 text-slate-400 text-xs tabular-nums whitespace-nowrap">
                        {formatDate(entry.entry_date)}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-400">
                        {entry.reference ?? "—"}
                      </td>
                      <td className="px-3 py-3 max-w-xs">
                        <span className="block truncate text-slate-200" title={entry.description}>
                          {entry.description}
                        </span>
                        {entry.source_module && (
                          <span className="text-xs text-slate-500 capitalize">
                            via {entry.source_module}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-white tabular-nums">
                        {money(debit)}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-white tabular-nums">
                        {money(credit)}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => openView(entry)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors py-1 px-2 rounded hover:bg-slate-700"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    {search || statusFilter !== "all"
                      ? "No entries match your filters."
                      : "No journal entries yet. Create your first entry."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <JournalEntryModal
          entry={selectedEntry}
          accounts={accounts}
          onClose={closeModal}
          onSaved={() => { closeModal(); navigate("."); }}
        />
      )}
    </div>
  );
}

function flattenAccounts(
  accs: ChartOfAccount[],
  depth = 0
): Array<{ id: number; code: string; name: string; depth: number }> {
  let result: Array<{ id: number; code: string; name: string; depth: number }> = [];
  for (const acc of accs) {
    if (acc.is_active !== false) {
      result.push({ id: acc.id, code: acc.account_code, name: acc.account_name, depth });
    }
    if (acc.children?.length) {
      result = result.concat(flattenAccounts(acc.children, depth + 1));
    }
  }
  return result;
}

interface JournalEntryModalProps {
  entry: JournalEntry | null;
  accounts: ChartOfAccount[];
  onClose: () => void;
  onSaved: () => void;
}

function JournalEntryModal({ entry, accounts, onClose, onSaved }: JournalEntryModalProps) {
  const isView   = !!entry;
  const flatAccs = flattenAccounts(accounts);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const [formData, setFormData] = useState({
    entry_date:  new Date().toISOString().split("T")[0],
    description: "",
    reference:   "",
    lines: [
      { chart_of_account_id: 0, debit: 0, credit: 0, memo: "" },
      { chart_of_account_id: 0, debit: 0, credit: 0, memo: "" },
    ],
  });

  const totalDebit  = formData.lines.reduce((s, l) => s + (Number(l.debit)  || 0), 0);
  const totalCredit = formData.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced  = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.01;

  const addLine = () =>
    setFormData((f) => ({
      ...f,
      lines: [...f.lines, { chart_of_account_id: 0, debit: 0, credit: 0, memo: "" }],
    }));

  const removeLine = (i: number) => {
    if (formData.lines.length > 2) {
      setFormData((f) => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }));
    }
  };

  const updateLine = (i: number, field: string, value: string | number) => {
    setFormData((f) => {
      const lines = [...f.lines];
      (lines[i] as Record<string, string | number>)[field] = value;
      return { ...f, lines };
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;
    setSaving(true);
    setError(null);
    try {
      await accounting.createJournalEntry({
        entry_date:  formData.entry_date,
        description: formData.description,
        reference:   formData.reference || undefined,
        lines: formData.lines.map((l) => ({
          chart_of_account_id: Number(l.chart_of_account_id),
          debit:  Number(l.debit),
          credit: Number(l.credit),
          memo:   l.memo || undefined,
        })),
      });
      onSaved();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Failed to create entry.");
    } finally {
      setSaving(false);
    }
  };

  const handlePost = async () => {
    if (!entry) return;
    setPosting(true);
    setError(null);
    try {
      await accounting.submitJournalEntry(entry.id);
      onSaved();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Failed to post entry.");
    } finally {
      setPosting(false);
    }
  };

  const handleReverse = async () => {
    if (!entry) return;
    const reason = prompt("Enter reversal reason:");
    if (!reason) return;
    setPosting(true);
    setError(null);
    try {
      await accounting.reverseJournalEntry(entry.id, reason);
      onSaved();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Failed to reverse entry.");
    } finally {
      setPosting(false);
    }
  };

  // ── View mode ──
  if (isView && entry) {
    const debit  = sumLines(entry.lines, "debit");
    const credit = sumLines(entry.lines, "credit");
    const cfg    = STATUS_CFG[entry.status];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl max-h-[90vh] flex flex-col my-auto overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-700 px-6 py-4 shrink-0">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-base font-semibold text-white">Journal Entry</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatDate(entry.entry_date)}
                {entry.reference && <span className="ml-2 font-mono">· {entry.reference}</span>}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <p className="text-sm text-slate-300">{entry.description}</p>

            {/* Lines Table */}
            <div className="rounded-lg border border-slate-700 overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-xs uppercase text-slate-500">
                    <th className="px-4 py-2.5">Account</th>
                    <th className="px-4 py-2.5 text-right w-32">Debit</th>
                    <th className="px-4 py-2.5 text-right w-32">Credit</th>
                    <th className="px-4 py-2.5 w-36">Memo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {(entry.lines ?? []).map((line, i) => (
                    <tr key={i} className="text-slate-300">
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs text-slate-500 mr-2">
                          {line.account?.account_code}
                        </span>
                        {line.account?.account_name ?? `Account #${line.chart_of_account_id}`}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-white">
                        {line.debit ? money(line.debit) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-white">
                        {line.credit ? money(line.credit) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 text-xs">{line.memo ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-700 bg-slate-900/50 font-semibold text-white">
                    <td className="px-4 py-2.5 text-slate-400 text-xs uppercase">Total</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{money(debit)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{money(credit)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Balanced indicator */}
            <div className={`flex items-center gap-2 text-xs ${
              Math.abs(debit - credit) < 0.01 ? "text-emerald-400" : "text-red-400"
            }`}>
              <span>{Math.abs(debit - credit) < 0.01 ? "✓ Balanced" : "✗ Unbalanced"}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-700 px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 shrink-0">
            <button
              onClick={onClose}
              className="w-full sm:w-auto rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors text-center"
            >
              Close
            </button>
            {entry.status === "draft" && (
              <button
                onClick={handlePost}
                disabled={posting}
                className="w-full sm:w-auto rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors text-center"
              >
                {posting ? "Posting…" : "Post Entry"}
              </button>
            )}
            {entry.status === "posted" && (
              <button
                onClick={handleReverse}
                disabled={posting}
                className="w-full sm:w-auto rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/30 disabled:opacity-50 transition-colors text-center"
              >
                {posting ? "Reversing…" : "Reverse Entry"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Create mode ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl max-h-[90vh] flex flex-col my-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4 shrink-0">
          <h2 className="text-base font-semibold text-white">New Journal Entry</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Entry Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.entry_date}
                  onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Reference
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="e.g. INV-001"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Description
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="e.g. Tuition fees collected for Term 1"
              />
            </div>

            {/* Lines */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Journal Lines
                </label>
                <button
                  type="button"
                  onClick={addLine}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  + Add Line
                </button>
              </div>

              <div className="rounded-lg border border-slate-700 overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-xs uppercase text-slate-500">
                      <th className="px-3 py-2">Account</th>
                      <th className="px-3 py-2 w-28 text-right">Debit</th>
                      <th className="px-3 py-2 w-28 text-right">Credit</th>
                      <th className="px-2 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {formData.lines.map((line, i) => (
                      <tr key={i} className="bg-slate-900/20">
                        <td className="px-2 py-1.5">
                          <select
                            required
                            value={line.chart_of_account_id}
                            onChange={(e) => updateLine(i, "chart_of_account_id", Number(e.target.value))}
                            className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                          >
                            <option value={0} disabled>Select account…</option>
                            {flatAccs.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {"  ".repeat(acc.depth)}{acc.code} — {acc.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.debit || ""}
                            onChange={(e) => updateLine(i, "debit", e.target.value)}
                            placeholder="0.00"
                            className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-white text-right placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.credit || ""}
                            onChange={(e) => updateLine(i, "credit", e.target.value)}
                            placeholder="0.00"
                            className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-white text-right placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-1 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeLine(i)}
                            disabled={formData.lines.length <= 2}
                            className="rounded p-1 text-slate-500 hover:text-red-400 disabled:opacity-30 transition-colors"
                            title="Remove line"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-700 bg-slate-900/50 font-semibold text-white text-sm">
                      <td className="px-3 py-2.5 text-slate-400 text-xs uppercase">Total</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{money(totalDebit)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{money(totalCredit)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Balance indicator */}
              {(totalDebit > 0 || totalCredit > 0) && (
                <p className={`mt-1.5 text-xs ${isBalanced ? "text-emerald-400" : "text-red-400"}`}>
                  {isBalanced
                    ? "✓ Debits equal credits — entry is balanced"
                    : `✗ Difference of ${money(Math.abs(totalDebit - totalCredit))} — debits must equal credits`}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-700 px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !isBalanced}
              className="w-full sm:w-auto rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors text-center"
              title={!isBalanced ? "Entry must be balanced before saving" : undefined}
            >
              {saving ? "Saving…" : "Save as Draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}