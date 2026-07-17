// ============================================================
// app/pages/parents/show.tsx
// ============================================================
import { Link, Form } from "react-router";
import type { Route } from "./+types/show";
import api, { type ParentProfile } from "~/lib/api";

export async function clientLoader({ params }: Route.LoaderArgs) {
  const id = Number(params.id);
  // This calls GET /api/v1/parents/{id}
  const response = await api.parents.get(id);
  
  // FIX: Drop the second '.data'. response.data is the parent profile object.
  return { parent: response.data };
}

export async function clientAction({ request, params }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "delete") {
    await api.parents.delete(Number(params.id));
    return { redirect: "/parents" };
  }
  return null;
}

export default function ParentShowPage({ loaderData }: Route.ComponentProps) {
  // Safe parsing of loader data
  const parent = (loaderData as { parent?: ParentProfile } | undefined)?.parent ?? null;

  if (!parent) {
    return (
      <div style={{ color: "#f8fafc", fontFamily: "'Sora', sans-serif", display: "flex", justifyContent: "center", padding: "40px" }}>
        <h2 style={{ fontSize: 14, color: "#94a3b8" }}>Loading parent profile...</h2>
      </div>
    );
  }

  return (
    <div style={{ color: "#f8fafc", fontFamily: "'Sora', sans-serif", maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      
      {/* Navigation */}
      <div style={{ marginBottom: "20px" }}>
        <Link to="/parents" style={{ color: "#3b82f6", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
          ← Back to Parents Directory
        </Link>
      </div>

      {/* Header Profile Area */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", borderBottom: "1px solid #1e293b", paddingBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", margin: 0, fontWeight: 700 }}>
            {parent.user?.name ?? "Unnamed Parent"}
          </h1>
          <span style={{ display: "inline-block", background: "rgba(16,185,129,0.15)", color: "#10b981", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", marginTop: "8px" }}>
            Account Status: {parent.user?.status ?? "Active"}
          </span>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <Link to={`/parents/${parent.id}/edit`} style={{ background: "#3b82f6", color: "#ffffff", padding: "10px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>
            Edit Profile
          </Link>
          <Form method="post" onSubmit={(e) => !confirm("Delete this profile permanent?") && e.preventDefault()}>
            <input type="hidden" name="intent" value="delete" />
            <button type="submit" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "10px 16px", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>
              Delete Account
            </button>
          </Form>
        </div>
      </div>

      {/* Data Layout Split */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        
        {/* Profile Card Info */}
        <section style={{ padding: "24px", borderRadius: "12px", background: "#0f172a", border: "1px solid #1e293b" }}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "16px", borderBottom: "1px solid #1e293b", paddingBottom: "10px" }}>Account Details</h2>
          <div style={{ display: "grid", gap: "16px", fontSize: "14px" }}>
            <div><span style={{ color: "#64748b" }}>Email: </span>{parent.user?.email ?? "—"}</div>
            <div><span style={{ color: "#64748b" }}>Phone: </span>{parent.phone ?? "—"}</div>
            <div><span style={{ color: "#64748b" }}>Relationship: </span>{parent.relationship ?? "—"}</div>
            <div><span style={{ color: "#64748b" }}>Occupation: </span>{parent.occupation ?? "—"}</div>
            <div><span style={{ color: "#64748b" }}>Address: </span>{parent.address ?? "—"}</div>
            {parent.notes && (
              <div style={{ marginTop: "12px", padding: "12px", background: "#1e293b", borderRadius: "8px" }}>
                <strong style={{ fontSize: "12px", color: "#94a3b8" }}>Notes:</strong>
                <p style={{ margin: "4px 0 0 0" }}>{parent.notes}</p>
              </div>
            )}
          </div>
        </section>

        {/* Linked Children Card */}
        <section style={{ padding: "24px", borderRadius: "12px", background: "#0f172a", border: "1px solid #1e293b" }}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "16px", borderBottom: "1px solid #1e293b", paddingBottom: "10px" }}>
            Linked Students ({parent.children?.length ?? 0})
          </h2>
          {parent.children && parent.children.length > 0 ? (
            <div style={{ display: "grid", gap: "12px" }}>
              {parent.children.map((child) => (
                <div key={child.id} style={{ display: "flex", justifyContent: "space-between", padding: "14px", borderRadius: "8px", background: "#1e293b" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{child.full_name}</div>
                    <div style={{ color: "#64748b", fontSize: "12px" }}>Adm No: {child.admission_no}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#64748b", fontSize: "14px" }}>No students linked to this profile.</p>
          )}
        </section>
      </div>

    </div>
  );
}