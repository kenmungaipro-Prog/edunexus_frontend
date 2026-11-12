// ============================================================
// app/pages/accounts/index.tsx
// ============================================================

import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { accounting, type ChartOfAccount, type AccountType, type NormalBalance } from "~/lib/api";
import { PrintListButton } from "~/components/PrintListButton";

export async function clientLoader() {
  const response = await accounting.accounts();
  return { accounts: response.data };
}

export default function ChartOfAccountsPage({
  loaderData,
}: {
  loaderData: { accounts: ChartOfAccount[] };
}) {
  const { accounts } = loaderData;
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [draggedAccount, setDraggedAccount] = useState<ChartOfAccount | null>(null);
  const [dragOverAccountId, setDragOverAccountId] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const accountTypes: AccountType[] = ["asset", "liability", "equity", "revenue", "expense"];

  const typeConfig: Record<AccountType, { label: string; color: string; accent: string; dot: string }> = {
    asset:     { label: "Assets",      color: "text-blue-400",    accent: "border-blue-500/40",   dot: "bg-blue-400" },
    liability: { label: "Liabilities", color: "text-rose-400",    accent: "border-rose-500/40",   dot: "bg-rose-400" },
    equity:    { label: "Equity",      color: "text-purple-400",  accent: "border-purple-500/40", dot: "bg-purple-400" },
    revenue:   { label: "Revenue",     color: "text-emerald-400", accent: "border-emerald-500/40",dot: "bg-emerald-400" },
    expense:   { label: "Expenses",    color: "text-amber-400",   accent: "border-amber-500/40",  dot: "bg-amber-400" },
  };

  const childrenByParent = new Map<number | null, ChartOfAccount[]>();
  for (const account of accounts) {
    const siblings = childrenByParent.get(account.parent_account_id) ?? [];
    siblings.push(account);
    childrenByParent.set(account.parent_account_id, siblings);
  }
  for (const siblings of childrenByParent.values()) {
    siblings.sort((a, b) => a.sort_order - b.sort_order || a.account_code.localeCompare(b.account_code));
  }

  const matchingAccounts = new Set(
    accounts
      .filter((account) =>
        !search ||
        account.account_name.toLowerCase().includes(search.toLowerCase()) ||
        account.account_code.toLowerCase().includes(search.toLowerCase())
      )
      .map((account) => account.id)
  );
  const visibleAccountIds = new Set<number>();
  if (!search) {
    accounts.forEach((account) => visibleAccountIds.add(account.id));
  } else {
    for (const account of accounts) {
      if (!matchingAccounts.has(account.id)) continue;
      let current: ChartOfAccount | undefined = account;
      while (current) {
        visibleAccountIds.add(current.id);
        current = current.parent_account_id === null
          ? undefined
          : accounts.find((candidate) => candidate.id === current?.parent_account_id);
      }
    }
  }

  const totals = accountTypes.reduce((acc, type) => {
    acc[type] = accounts.filter((a) => a.account_type === type).length;
    return acc;
  }, {} as Record<AccountType, number>);

  const accountDepth = (account: ChartOfAccount): number => {
    let depth = 0;
    let parentId = account.parent_account_id;
    while (parentId !== null) {
      depth++;
      parentId = accounts.find((candidate) => candidate.id === parentId)?.parent_account_id ?? null;
    }
    return depth;
  };

  const reorderSiblings = async (target: ChartOfAccount) => {
    if (!draggedAccount || savingOrder) return;
    const parentId = target.parent_account_id;
    if (
      draggedAccount.id === target.id ||
      draggedAccount.parent_account_id !== parentId ||
      draggedAccount.account_type !== target.account_type
    ) {
      setDraggedAccount(null);
      setDragOverAccountId(null);
      return;
    }

    const siblings = (childrenByParent.get(parentId) ?? [])
      .filter((account) => account.account_type === target.account_type);
    const from = siblings.findIndex((account) => account.id === draggedAccount.id);
    const to = siblings.findIndex((account) => account.id === target.id);
    if (from < 0 || to < 0 || from === to) {
      setDraggedAccount(null);
      setDragOverAccountId(null);
      return;
    }

    const reordered = [...siblings];
    const [movingAccount] = reordered.splice(from, 1);
    const targetIndex = reordered.findIndex((account) => account.id === target.id);
    reordered.splice(targetIndex, 0, movingAccount);
    setSavingOrder(true);
    setOrderError(null);
    try {
      await accounting.reorderAccounts({
        parent_account_id: parentId,
        account_type: target.account_type,
        account_ids: reordered.map((account) => account.id),
      });
      setDraggedAccount(null);
      setDragOverAccountId(null);
      navigate(".");
    } catch (error) {
      const message = (error as { message?: string })?.message;
      setOrderError(message ?? "Could not save the account order. Refresh and try again.");
    } finally {
      setDraggedAccount(null);
      setDragOverAccountId(null);
      setSavingOrder(false);
    }
  };

  const renderAccountBranch = (account: ChartOfAccount, depth: number): React.ReactNode => {
    const siblings = (childrenByParent.get(account.parent_account_id) ?? [])
      .filter((sibling) => sibling.account_type === account.account_type);
    const children = (childrenByParent.get(account.id) ?? [])
      .filter((child) => visibleAccountIds.has(child.id));
    if (!visibleAccountIds.has(account.id)) return null;

    return (
      <div key={account.id} className="divide-y divide-slate-700/50">
        <div
          draggable={!search && !savingOrder && siblings.length > 1}
          onDragStart={(event) => {
            if (search || savingOrder || siblings.length < 2) {
              event.preventDefault();
              return;
            }
            event.dataTransfer.effectAllowed = "move";
            setDraggedAccount(account);
          }}
          onDragEnd={() => {
            setDraggedAccount(null);
            setDragOverAccountId(null);
          }}
          onDragOver={(event) => {
            if (!search && draggedAccount && draggedAccount.parent_account_id === account.parent_account_id
              && draggedAccount.account_type === account.account_type) {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDragOverAccountId(account.id);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void reorderSiblings(account);
          }}
          className={`flex items-center justify-between py-3 pr-5 hover:bg-slate-700/30 transition-colors group ${dragOverAccountId === account.id ? "border-t-2 border-blue-400 bg-blue-500/10" : ""} ${draggedAccount?.id === account.id ? "opacity-40" : ""}`}
          style={{ paddingLeft: "20px" }}
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <span className={`inline-flex w-4 shrink-0 justify-center ${!search && siblings.length > 1 ? "cursor-grab touch-none text-slate-500 hover:text-slate-200" : ""}`}
              {...(!search && siblings.length > 1 ? { title: "Drag to reorder", "aria-label": "Drag to reorder account" } : {})}
            >
              {!search && siblings.length > 1 ? "⋮⋮" : ""}
            </span>
            <span className="font-mono text-xs sm:text-sm font-medium text-slate-400 w-14 sm:w-16 shrink-0">
              {account.account_code}
            </span>
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <div
                className="min-w-0"
                style={{
                  marginLeft: `${depth * 16}px`,
                  maxWidth: `calc(100% - ${depth * 16}px)`,
                }}
              >
                {depth > 0 && (
                  <span className="mr-1 text-slate-500" aria-hidden="true">↳</span>
                )}
                <span className={`truncate ${depth === 0
                  ? "text-sm sm:text-base font-bold text-white"
                  : depth === 1
                    ? "text-xs sm:text-sm font-semibold text-blue-300"
                    : depth === 2
                      ? "text-xs sm:text-sm font-medium text-violet-300"
                      : "text-xs font-medium text-slate-300"}`}>
                  {account.account_name}
                </span>
                {account.parent && (
                  <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                    Sub-account of {account.parent.account_code} — {account.parent.account_name}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                {account.is_system && (
                  <span className="rounded bg-slate-600/80 px-1.5 py-0.5 text-[10px] sm:text-xs text-slate-300">System</span>
                )}
                {account.is_bank_account && (
                  <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] sm:text-xs text-blue-400">Bank</span>
                )}
                {account.is_control_account && (
                  <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[10px] sm:text-xs text-purple-400">Control</span>
                )}
                {!account.is_active && (
                  <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] sm:text-xs text-red-400">Inactive</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
            <span className="hidden sm:block text-xs text-slate-500 capitalize w-12 text-right">{account.normal_balance}</span>
            <span className="hidden md:block text-xs text-slate-600 w-10 text-right">{account.currency}</span>
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => { setEditingAccount(account); setShowModal(true); }}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors"
                title="Edit"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              {!account.is_system && (
                <button
                  onClick={() => handleDelete(account)}
                  disabled={deletingId === account.id}
                  className="rounded p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        {children.length > 0 && (
          <div>
            {children.map((child) => renderAccountBranch(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleDelete = async (account: ChartOfAccount) => {
    if (!confirm(`Delete "${account.account_name}"? This cannot be undone.`)) return;
    setDeletingId(account.id);
    try {
      await accounting.deleteAccount(account.id);
      navigate(".");
    } catch {
      alert("Failed to delete account. It may have associated transactions.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Chart of Accounts</h1>
          <p className="text-sm text-slate-400 mt-1">
            {accounts.length} accounts across {accountTypes.length} categories
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 w-full sm:w-auto">
          <PrintListButton
            title="Chart of Accounts Register"
            filterSummary={search ? `Search: ${search}` : "All accounts"}
            loadRows={() => accounting.accounts().then((response) =>
              response.data.filter((account) =>
                !search ||
                account.account_name.toLowerCase().includes(search.toLowerCase()) ||
                account.account_code.toLowerCase().includes(search.toLowerCase())
              )
            )}
            columns={[
              { label: "Code", value: (account) => account.account_code },
              { label: "Account", value: (account) => account.account_name },
              { label: "Main Account", value: (account) => account.parent?.account_name ?? "—" },
              { label: "Type", value: (account) => account.account_type },
              { label: "Normal Balance", value: (account) => account.normal_balance },
              { label: "Currency", value: (account) => account.currency },
              { label: "Status", value: (account) => account.is_active ? "Active" : "Inactive" },
            ]}
          />
          <Link
            to="/accounting/journals"
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors text-center"
          >
            Journal Entries
          </Link>
          <button
            onClick={() => { setEditingAccount(null); setShowModal(true); }}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors text-center"
          >
            + Add Account
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {accountTypes.map((type, idx) => (
          <div
            key={type}
            className={`rounded-xl border bg-slate-800/60 px-4 py-3 ${typeConfig[type].accent} ${
              idx === accountTypes.length - 1 && accountTypes.length % 2 !== 0 ? "col-span-2 sm:col-span-1" : ""
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`h-2 w-2 rounded-full ${typeConfig[type].dot}`} />
              <span className={`text-xs font-semibold uppercase tracking-wide ${typeConfig[type].color}`}>
                {typeConfig[type].label}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{totals[type]}</p>
            <p className="text-xs text-slate-500 mt-0.5">accounts</p>
          </div>
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
          placeholder="Search by name or code..."
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

      {orderError && (
        <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {orderError}
        </div>
      )}
      {!search && (
        <p className="text-xs text-slate-500">
          Drag the ⋮⋮ handle to reorder accounts among items at the same level. Clear search to enable dragging.
        </p>
      )}

      {/* Accounts by Type */}
      <div className="space-y-4">
        {accountTypes.map((type) => {
          const list = (childrenByParent.get(null) ?? [])
            .filter((account) => account.account_type === type && visibleAccountIds.has(account.id));
          const visibleCount = accounts.filter(
            (account) => account.account_type === type && visibleAccountIds.has(account.id)
          ).length;
          const cfg = typeConfig[type];
          return (
            <div key={type} className={`rounded-xl border bg-slate-800 overflow-hidden ${cfg.accent}`}>
              {/* Section Header */}
              <div className="flex items-center justify-between border-b border-slate-700 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                  <h2 className={`font-semibold ${cfg.color}`}>{cfg.label}</h2>
                  <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                    {visibleCount}
                  </span>
                </div>
              </div>

              {/* Rows */}
              {list.length > 0 ? (
                <div className="divide-y divide-slate-700/50">
                  {list.map((account) => renderAccountBranch(account, 0))}
                </div>
              ) : (
                <div className="px-5 py-6 text-center text-sm text-slate-500">
                  {search
                    ? `No ${cfg.label.toLowerCase()} match your search`
                    : `No ${cfg.label.toLowerCase()} yet`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <AccountModal
          account={editingAccount}
          accounts={accounts}
          onClose={() => { setShowModal(false); setEditingAccount(null); }}
          onSaved={() => { setShowModal(false); setEditingAccount(null); navigate("."); }}
        />
      )}
    </div>
  );
}

// ─── Account Modal ────────────────────────────────────────────────────────────

interface AccountModalProps {
  account: ChartOfAccount | null;
  accounts: ChartOfAccount[];
  onClose: () => void;
  onSaved: () => void;
}

function AccountModal({ account, accounts, onClose, onSaved }: AccountModalProps) {
  const isEdit = !!account;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubAccount, setIsSubAccount] = useState(!!account?.parent_account_id);

  const [formData, setFormData] = useState({
    account_code:       account?.account_code       ?? "",
    account_name:       account?.account_name       ?? "",
    account_type:       account?.account_type       ?? ("expense" as AccountType),
    normal_balance:     account?.normal_balance     ?? ("debit" as NormalBalance),
    parent_account_id:  account?.parent_account_id  ?? null as number | null,
    currency:           account?.currency           ?? "KES",
    is_control_account: account?.is_control_account ?? false,
    is_bank_account:    account?.is_bank_account    ?? false,
    is_active:          account?.is_active          ?? true,
  });

  const accountDepth = (candidate: ChartOfAccount): number => {
    let depth = 0;
    let parentId = candidate.parent_account_id;
    while (parentId !== null) {
      depth++;
      parentId = accounts.find((item) => item.id === parentId)?.parent_account_id ?? null;
    }
    return depth;
  };
  const subtreeHeight = (accountId: number): number => {
    const childHeights = accounts
      .filter((item) => item.parent_account_id === accountId)
      .map((child) => subtreeHeight(child.id) + 1);
    return childHeights.length ? Math.max(...childHeights) : 0;
  };
  const isDescendant = (candidate: ChartOfAccount, ancestorId: number): boolean => {
    let parentId = candidate.parent_account_id;
    while (parentId !== null) {
      if (parentId === ancestorId) return true;
      parentId = accounts.find((item) => item.id === parentId)?.parent_account_id ?? null;
    }
    return false;
  };
  const existingSubtreeHeight = account ? subtreeHeight(account.id) : 0;
  const eligibleParents = accounts.filter((candidate) =>
    candidate.account_type === formData.account_type &&
    candidate.id !== account?.id &&
    (!account || !isDescendant(candidate, account.id)) &&
    accountDepth(candidate) + 1 + existingSubtreeHeight <= 2
  );
  const canBeSubAccount = eligibleParents.length > 0;

  const handleTypeChange = (type: AccountType) => {
    const defaultBalance: Record<AccountType, NormalBalance> = {
      asset:     "debit",
      expense:   "debit",
      liability: "credit",
      equity:    "credit",
      revenue:   "credit",
    };
    setFormData((f) => ({
      ...f,
      account_type: type,
      normal_balance: defaultBalance[type],
      parent_account_id: null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubAccount && formData.parent_account_id === null) {
      setError("Select the main account this sub-account belongs to.");
      return;
    }

    setSaving(true);
    setError(null);
    const payload = {
      ...formData,
      parent_account_id: isSubAccount ? formData.parent_account_id : null,
    };
    try {
      if (isEdit) {
        await accounting.updateAccount(account.id, payload);
      } else {
        await accounting.createAccount(payload);
      }
      onSaved();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? "Failed to save account. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl max-h-[90vh] flex flex-col my-auto overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4 shrink-0">
          <h2 className="text-base font-semibold text-white">
            {isEdit ? "Edit Account" : "New Account"}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Account Code
              </label>
              <input
                type="text"
                required
                disabled={isEdit}
                value={formData.account_code}
                onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                placeholder="e.g. 5110"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Currency
              </label>
              <input
                type="text"
                required
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                maxLength={3}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="KES"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Account Name
            </label>
            <input
              type="text"
              required
              value={formData.account_name}
              onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="e.g. Salaries & Wages"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Account Type
              </label>
              <select
                required
                disabled={isEdit}
                value={formData.account_type}
                onChange={(e) => handleTypeChange(e.target.value as AccountType)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="equity">Equity</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Normal Balance
              </label>
              <select
                required
                value={formData.normal_balance}
                onChange={(e) => setFormData({ ...formData, normal_balance: e.target.value as NormalBalance })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isSubAccount}
                disabled={!canBeSubAccount}
                onChange={(e) => {
                  setIsSubAccount(e.target.checked);
                  setFormData((current) => ({ ...current, parent_account_id: null }));
                  setError(null);
                }}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 shrink-0 disabled:opacity-50"
              />
              <div>
                <span className="text-sm text-slate-200">Make this a sub-account</span>
                <p className="text-xs text-slate-500">
                  {canBeSubAccount
                    ? "Choose a parent account of the same type. Leave unchecked to make this a main account."
                    : "No valid parent is available without exceeding three levels."}
                </p>
              </div>
            </label>
            {isSubAccount && (
              <div>
                <label htmlFor="parent-account" className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Parent Account
                </label>
                <select
                  id="parent-account"
                  required
                  value={formData.parent_account_id ?? ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    parent_account_id: e.target.value ? Number(e.target.value) : null,
                  })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select a parent account</option>
                  {eligibleParents.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.account_code} — {candidate.account_name}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Account trees can be up to three levels deep.
                </p>
              </div>
            )}
          </div>

          {/* Flags */}
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 space-y-2.5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_control_account}
                onChange={(e) => setFormData({ ...formData, is_control_account: e.target.checked })}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 shrink-0"
              />
              <div>
                <span className="text-sm text-slate-200">Control Account</span>
                <p className="text-xs text-slate-500">Summarises balances from subsidiary ledgers</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_bank_account}
                onChange={(e) => setFormData({ ...formData, is_bank_account: e.target.checked })}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 shrink-0"
              />
              <div>
                <span className="text-sm text-slate-200">Bank Account</span>
                <p className="text-xs text-slate-500">Linked to a real bank or M-Pesa account</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 shrink-0"
              />
              <div>
                <span className="text-sm text-slate-200">Active</span>
                <p className="text-xs text-slate-500">Inactive accounts cannot be used in journal entries</p>
              </div>
            </label>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors text-center"
            >
              {saving ? "Saving…" : isEdit ? "Update Account" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}