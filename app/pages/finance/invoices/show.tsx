// ============================================================
// app/pages/finance/invoices/show.tsx
// ============================================================
import { Link, useNavigation } from "react-router";
import type { Route } from "./+types/show";
import { api, type Invoice, type InvoiceItem } from "~/lib/api";

export async function clientLoader({ params }: Route.LoaderArgs) {
  const res = await api.finance.invoice(Number(params.id));
  return { invoice: res?.data ?? null };
}

function money(value: number | string | null | undefined) {
  return `KES ${Number(value ?? 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  draft:           { bg: "rgba(107,114,128,0.12)",   color: "#9ca3af",   label: "Draft" },
  issued:          { bg: "rgba(79,142,247,0.12)",    color: "#60a5fa",  label: "Issued" },
  partially_paid: { bg: "rgba(245,158,11,0.12)",    color: "#fbbf24",  label: "Partially Paid" },
  paid:           { bg: "rgba(16,185,129,0.12)",   color: "#34d399",  label: "Paid" },
  overdue:        { bg: "rgba(239,68,68,0.12)",     color: "#f87171",  label: "Overdue" },
  cancelled:      { bg: "rgba(239,68,68,0.12)",     color: "#f87171",  label: "Cancelled" },
  reversed:       { bg: "rgba(113,113,122,0.14)",  color: "#d4d4d8",  label: "Reversed" },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span style={{ background: config.bg, color: config.color, fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px" }}>
      {config.label}
    </span>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#1a2236", borderRadius: "12px", border: "1px solid #2d3555", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #2d3555", fontSize: "13px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {title}
      </div>
      <div style={{ padding: "16px 18px" }}>{children}</div>
    </div>
  );
}

export default function InvoiceShowPage({ loaderData }: Route.ComponentProps) {
  const { invoice } = loaderData as { invoice?: Invoice | null };
  const navigation = useNavigation();

  if (!invoice) {
    return (
      <div className="space-y-4 p-2 sm:p-0">
        <Link to="/finance/invoices" className="text-slate-400 hover:text-slate-200 text-sm font-medium">
          ← Back to Invoices
        </Link>
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 text-sm text-slate-300">
          Invoice not found or could not be loaded.
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 p-2 sm:p-0 ${navigation.state === "loading" ? "opacity-60" : ""}`}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <Link to="/finance/invoices" style={{ color: "#64748b", textDecoration: "none", fontSize: "20px", marginTop: "2px" }}>←</Link>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Invoice {invoice.invoice_number}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {invoice.student?.name} — {invoice.student?.class_room?.name || "No class"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", width: "100%", sm: { width: "auto" } }}>
          {invoice.status === "draft" && (
            <button
              onClick={async () => { await api.finance.issueInvoice(invoice.id); window.location.reload(); }}
              style={{ background: "linear-gradient(135deg,#4f8ef7,#6366f1)", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 600, cursor: "pointer", width: "100%" }}
            >
              Issue Invoice
            </button>
          )}
          {invoice.status === "issued" && (
            <Link
              to={`/finance/payments/collect?student_id=${invoice.student_id}&invoice_id=${invoice.id}`}
              style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", textDecoration: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%" }}
            >
              Record Payment
            </Link>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "16px" }}>
        <Card title="Invoice Total">
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>{money(invoice.total)}</div>
        </Card>
        <Card title="Amount Paid">
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#34d399" }}>{money(invoice.amount_paid)}</div>
        </Card>
        <Card title="Balance">
          <div style={{ fontSize: "20px", fontWeight: 700, color: invoice.balance > 0 ? "#f87171" : "#34d399" }}>{money(invoice.balance)}</div>
        </Card>
        <Card title="Due Date">
          <div style={{ fontSize: "16px", fontWeight: 600, color: "#e2e8f0" }}>
            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—"}
          </div>
        </Card>
      </div>

      {/* Invoice Items */}
      <Card title="Line Items">
        {(invoice.items?.length ?? 0) === 0 ? (
          <p style={{ color: "#64748b", fontSize: "14px" }}>No items</p>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2d3555" }}>
                  <th style={{ textAlign: "left", padding: "10px 0", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Description</th>
                  <th style={{ textAlign: "right", padding: "10px 0", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Qty</th>
                  <th style={{ textAlign: "right", padding: "10px 0", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Unit Price</th>
                  <th style={{ textAlign: "right", padding: "10px 0", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Discount</th>
                  <th style={{ textAlign: "right", padding: "10px 0", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items as InvoiceItem[]).map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #1e293b" }}>
                    <td style={{ padding: "12px 0", fontSize: "14px", color: "#e2e8f0" }}>
                      {item.description}
                      {item.fee_category && <span style={{ color: "#64748b", fontSize: "12px", marginLeft: "8px" }}>({item.fee_category.name})</span>}
                    </td>
                    <td style={{ textAlign: "right", padding: "12px 0", fontSize: "14px", color: "#94a3b8" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right", padding: "12px 0", fontSize: "14px", color: "#94a3b8" }}>{money(item.unit_price)}</td>
                    <td style={{ textAlign: "right", padding: "12px 0", fontSize: "14px", color: "#f87171" }}>{money(item.discount_amount)}</td>
                    <td style={{ textAlign: "right", padding: "12px 0", fontSize: "14px", color: "#e2e8f0", fontWeight: 600 }}>{money(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Summary */}
      <Card title="Summary">
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
            <span style={{ color: "#94a3b8" }}>Subtotal</span>
            <span style={{ color: "#e2e8f0", fontWeight: 500 }}>{money(invoice.subtotal)}</span>
          </div>
          {invoice.discount_total > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
              <span style={{ color: "#94a3b8" }}>Discounts</span>
              <span style={{ color: "#34d399", fontWeight: 500 }}>-{money(invoice.discount_total)}</span>
            </div>
          )}
          {invoice.waiver_total > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
              <span style={{ color: "#94a3b8" }}>Waivers</span>
              <span style={{ color: "#34d399", fontWeight: 500 }}>-{money(invoice.waiver_total)}</span>
            </div>
          )}
          {invoice.penalty_total > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
              <span style={{ color: "#94a3b8" }}>Penalties</span>
              <span style={{ color: "#f87171", fontWeight: 500 }}>+{money(invoice.penalty_total)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", paddingTop: "10px", borderTop: "1px solid #2d3555" }}>
            <span style={{ color: "#fff", fontWeight: 700 }}>Total</span>
            <span style={{ color: "#fff", fontWeight: 700 }}>{money(invoice.total)}</span>
          </div>
        </div>
      </Card>

      {/* Student Info */}
      {invoice.student && (
        <Card title="Student Details">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Name</div>
              <div style={{ fontSize: "14px", color: "#e2e8f0", fontWeight: 500 }}>{invoice.student.name}</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Admission Number</div>
              <div style={{ fontSize: "14px", color: "#e2e8f0" }}>{invoice.student.admission_number}</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Class</div>
              <div style={{ fontSize: "14px", color: "#e2e8f0" }}>{invoice.student.class_room?.name || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Parent Contact</div>
              <div style={{ fontSize: "14px", color: "#e2e8f0" }}>{invoice.student.parent_phone || "—"}</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}