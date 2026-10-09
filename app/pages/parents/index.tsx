// ============================================================
// app/pages/parents/index.tsx
// ============================================================
import { useMemo, useState } from "react";
import { Link, Form, useNavigation } from "react-router";
import type { Route } from "./+types/index";
import { api, type ParentProfile, type PaginationMeta, type ParentStats } from "~/lib/api";

export async function clientLoader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const filters = {
    page: Number(url.searchParams.get("page") ?? 1),
    per_page: Number(url.searchParams.get("per_page") ?? 20),
    search: url.searchParams.get("search") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    has_children: url.searchParams.get("has_children") ?? undefined,
  };

  const [response, statsResponse] = await Promise.all([
    api.parents.list(filters),
    api.parents.stats(),
  ]);

  const payload = response.data.data;
  const parents = Array.isArray(payload) ? payload : [payload];
  const meta = response.data.meta ?? {
    current_page: 1,
    last_page: 1,
    per_page: filters.per_page,
    total: parents.length,
    from: parents.length > 0 ? 1 : 0,
    to: parents.length,
  };

  return {
    parents,
    meta,
    filters,
    stats: statsResponse.data,
  };
}

export async function clientAction({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "delete") {
    await api.parents.delete(Number(form.get("id")));
    return { ok: true, message: "Parent profile removed successfully." };
  }

  return null;
}

function statusPill(status: string) {
  const config = {
    active: { bg: "rgba(16,185,129,0.15)", text: "#10b981", border: "1px solid rgba(16,185,129,0.3)" },
    inactive: { bg: "rgba(239,68,68,0.15)", text: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" },
  };
  return config[status as keyof typeof config] ?? config.active;
}

const DEFAULT_META: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
  from: 0,
  to: 0,
};

export default function ParentsIndexPage({ loaderData, actionData }: Route.ComponentProps) {
  const {
    parents = [],
    meta = DEFAULT_META,
    filters = { page: 1, per_page: 20, search: undefined },
    stats,
  } = loaderData as {
    parents?: ParentProfile[];
    meta?: PaginationMeta;
    filters?: { page: number; per_page: number; search?: string; status?: string | undefined; has_children?: string | undefined };
    stats?: ParentStats;
  };
  
  const navigation = useNavigation();
  const [search, setSearch] = useState(filters.search ?? "");
  const [status, setStatus] = useState<string | "">(filters.status ?? "");
  const [hasChildren, setHasChildren] = useState<string | "">(filters.has_children ?? "");
  const [perPage, setPerPage] = useState<number>(filters.per_page ?? 20);
  const isSearching = navigation.state === "loading";

  const actionResult = actionData as { ok?: boolean; message?: string } | undefined;
  const rows = useMemo(() => parents, [parents]);
  const relationshipBreakdown = useMemo(() => {
    const raw = (stats as any)?.relationship_breakdown;
    if (!raw) return [] as Array<[string, number]>;
    if (Array.isArray(raw)) {
      // if it's an array of [key, count] or objects, normalize to [label, count]
      if (raw.length === 0) return [];
      if (Array.isArray(raw[0]) && raw[0].length >= 2) return raw as Array<[string, number]>;
      return (raw as any[]).map((r) => [r[0] ?? r.relationship ?? 'Other', r[1] ?? r.count ?? 0]);
    }
    // object map: { relationship: count }
    return Object.entries(raw).map(([k, v]) => [k, Number(v)]);
  }, [stats]);

  return (
    <div style={{ color: "#f8fafc", fontFamily: "'Sora', sans-serif", maxWidth: "1200px", margin: "0 auto", padding: "12px", boxSizing: "border-box" }}>
      
      {/* ── Header Section ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "clamp(22px, 4vw, 28px)", margin: 0, fontWeight: 700, letterSpacing: "-0.02em" }}>Parents Directory</h1>
          <p style={{ color: "#94a3b8", marginTop: "6px", fontSize: "14px" }}>Manage guardian relationships, accounts, and communications.</p>
        </div>
        <div style={{ display: "flex", gap: "12px", justifyContent: 'flex-end', flexWrap: "wrap", minWidth: 0 }}>
          <Link 
            to="/parents/bulk-sms" 
            style={{ minWidth: 140, maxWidth: 160, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#1e293b", color: "#f8fafc", padding: "10px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: 600, fontSize: "14px", border: "1px solid #334155", transition: "all 0.2s" }}
          >
            <span style={{ fontSize: "16px" }}>💬</span> Bulk SMS
          </Link>
          <Link 
            to="/parents/new" 
            style={{ minWidth: 140, maxWidth: 160, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#3b82f6", color: "#ffffff", padding: "10px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: 600, fontSize: "14px", border: "none", boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.2)" }}
          >
            <span>+</span> New Parent
          </Link>
        </div>
      </div>

      {actionResult?.message && (
        <div style={{ marginBottom: "24px", padding: "16px", borderRadius: "8px", background: actionResult.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: actionResult.ok ? "#34d399" : "#f87171", border: `1px solid ${actionResult.ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`, display: "flex", alignItems: "center", gap: "12px", fontSize: "14px" }}>
          {actionResult.message}
        </div>
      )}

      {/* ── Stats Cards ── */}
      {stats && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px", marginBottom: "16px" }}>
            {[
              { label: "Total Parents", value: stats.total, color: "#3b82f6" },
              { label: "Active Accounts", value: stats.active, color: "#10b981" },
              { label: "Inactive Accounts", value: stats.inactive, color: "#ef4444" },
              { label: "Total Children Assigned", value: stats.total_children, color: "#8b5cf6" },
              { label: "Parents (No Children)", value: (stats as any).parents_with_no_children ?? 0, color: "#f59e0b" },
              { label: "Parents (Multiple Children)", value: (stats as any).parents_with_multiple_children ?? 0, color: "#06b6d4" },
            ].map((card) => (
              <div key={card.label} style={{ padding: "16px", borderRadius: "12px", background: "#0f172a", border: "1px solid #1e293b", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
                <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>{card.label}</div>
                <div style={{ color: card.color, fontSize: "24px", fontWeight: 700 }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Relationship & Occupation breakdowns */}
          {relationshipBreakdown.length > 0 && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240, padding: '12px', borderRadius: 12, background: '#071330', border: '1px solid #0f172a' }}>
                <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Relationship Breakdown</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', color: '#cbd5e1', fontSize: 13 }}>
                  {relationshipBreakdown.map((item: any) => (
                    <li key={String(item[0])} style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{item[0]}</span>
                      <strong style={{ color: '#f8fafc' }}>{item[1]}</strong>
                    </li>
                  ))}
                </ul>
              </div>

              {((stats as any).occupation_breakdown || []).length > 0 && (
                <div style={{ minWidth: 260, maxWidth: 420, padding: '12px', borderRadius: 12, background: '#071330', border: '1px solid #0f172a' }}>
                  <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Top Occupations</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', color: '#cbd5e1', fontSize: 13 }}>
                    {((stats as any).occupation_breakdown || []).slice(0, 8).map((occ: any) => (
                      <li key={occ.occupation} style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{occ.occupation}</span>
                        <strong style={{ color: '#f8fafc' }}>{occ.count}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Search & Filter Bar ── */}
      <div style={{ background: "#0f172a", padding: "12px", borderRadius: "12px", border: "1px solid #1e293b", marginBottom: "24px", display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '980px' }}>
          <Form method="get" style={{ display: "flex", gap: "12px", width: "100%", flexWrap: "wrap", alignItems: 'center' }}>
            <input
              name="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search parents by name, email, or phone..."
              style={{ flex: "1 1 360px", minWidth: '220px', padding: "12px 16px", borderRadius: "8px", border: "1px solid #334155", background: "#1e293b", color: "#f8fafc", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            />

            <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '10px 12px', borderRadius: '8px', background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', minWidth: 140, maxWidth: 160 }}>
              <option value="">Any status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select name="has_children" value={hasChildren} onChange={(e) => setHasChildren(e.target.value)} style={{ padding: '10px 12px', borderRadius: '8px', background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', minWidth: 140, maxWidth: 160 }}>
              <option value="">Any children</option>
              <option value="has">Has children</option>
              <option value="none">No children</option>
            </select>

            <select name="per_page" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} style={{ padding: '10px 12px', borderRadius: '8px', background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', minWidth: 110, maxWidth: 140 }}>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>

            <button type="submit" disabled={isSearching} style={{ padding: "10px 14px", borderRadius: "8px", background: "#3b82f6", color: "#ffffff", border: "none", fontWeight: 600, fontSize: "14px", cursor: "pointer", opacity: isSearching ? 0.7 : 1, minWidth: 90, maxWidth: 120 }}>
              {isSearching ? "Searching..." : "Apply"}
            </button>
          </Form>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #1e293b", background: "#0f172a", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "750px" }}>
          <thead>
            <tr style={{ background: "#1e293b", textAlign: "left", color: "#cbd5e1", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <th style={{ padding: "12px 16px", fontWeight: 600 }}>Parent Name</th>
              <th style={{ padding: "12px 16px", fontWeight: 600 }}>Contact Info</th>
              <th style={{ padding: "12px 16px", fontWeight: 600 }}>Relationship</th>
              <th style={{ padding: "12px 16px", fontWeight: 600 }}>Children</th>
              <th style={{ padding: "12px 16px", fontWeight: 600 }}>Status</th>
              <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "48px 20px", textAlign: "center", color: "#64748b" }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔍</div>
                  No parents found matching your criteria.
                </td>
              </tr>
            ) : rows.map((parent) => {
              const pill = statusPill(parent.user?.status ?? 'active');
              return (
                <tr key={parent.id} style={{ borderTop: "1px solid #1e293b", transition: "background 0.2s" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <Link to={`/parents/${parent.id}`} style={{ color: "#f8fafc", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>
                      {parent.user?.name ?? "—"}
                    </Link>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ color: "#cbd5e1", fontSize: "13px" }}>{parent.user?.email ?? "No Email"}</div>
                    <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>{parent.phone ?? "No Phone"}</div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#cbd5e1", fontSize: "14px" }}>
                    <span style={{ background: "#1e293b", padding: "4px 8px", borderRadius: "6px", fontSize: "12px" }}>
                      {parent.relationship ?? "Guardian"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#cbd5e1", fontSize: "14px", fontWeight: 600 }}>
                    {parent.children_count ?? parent.children?.length ?? 0}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: pill.bg, color: pill.text, border: pill.border, padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, textTransform: "capitalize" }}>
                      {parent.user?.status ?? 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", alignItems: "center" }}>
                      <Link to={`/parents/${parent.id}`} style={{ color: "#3b82f6", fontWeight: 600, fontSize: "13px", textDecoration: "none" }}>View</Link>
                      <Link to={`/parents/${parent.id}/edit`} style={{ color: "#10b981", fontWeight: 600, fontSize: "13px", textDecoration: "none" }}>Edit</Link>
                      <Form method="post" onSubmit={(e) => !confirm('Are you sure you want to completely remove this parent profile?') && e.preventDefault()}>
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="id" value={parent.id.toString()} />
                        <button type="submit" style={{ background: "none", border: "none", color: "#ef4444", fontWeight: 600, fontSize: "13px", cursor: "pointer", padding: 0 }}>Delete</button>
                      </Form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {meta.last_page > 1 && (
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#94a3b8", fontSize: "13px", flexWrap: "wrap", gap: "12px" }}>
          <span>Showing <strong style={{ color: "#f8fafc" }}>{meta.from}</strong> to <strong style={{ color: "#f8fafc" }}>{meta.to}</strong> of <strong style={{ color: "#f8fafc" }}>{meta.total}</strong> results</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link 
              to={`?page=${Math.max(1, meta.current_page - 1)}&per_page=${meta.per_page}${search ? `&search=${search}` : ''}`} 
              style={{ padding: "8px 12px", borderRadius: "6px", background: meta.current_page === 1 ? "#1e293b" : "#3b82f6", color: meta.current_page === 1 ? "#64748b" : "#ffffff", textDecoration: "none", pointerEvents: meta.current_page === 1 ? "none" : "auto", fontWeight: 600 }}
            >
              Previous
            </Link>
            <Link 
              to={`?page=${Math.min(meta.last_page, meta.current_page + 1)}&per_page=${meta.per_page}${search ? `&search=${search}` : ''}`} 
              style={{ padding: "8px 12px", borderRadius: "6px", background: meta.current_page === meta.last_page ? "#1e293b" : "#3b82f6", color: meta.current_page === meta.last_page ? "#64748b" : "#ffffff", textDecoration: "none", pointerEvents: meta.current_page === meta.last_page ? "none" : "auto", fontWeight: 600 }}
            >
              Next
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}