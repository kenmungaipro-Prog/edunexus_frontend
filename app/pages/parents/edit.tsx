// ============================================================
// app/pages/parents/edit.tsx
// ============================================================
import { Link, Form, useNavigation, redirect } from "react-router";
import type { Route } from "./+types/edit";
import api, { type ParentProfile, type UpdateParentPayload } from "~/lib/api";

export async function clientLoader({ params }: Route.LoaderArgs) {
  // This calls GET /api/v1/parents/{id}
  const response = await api.parents.get(Number(params.id));
  
  // FIX: Drop the second '.data'. response.data maps exactly to the parent object.
  return { parent: response.data };
}

export async function clientAction({ request, params }: Route.ActionArgs) {
  if (request.method !== "POST") throw new Error("Method not supported");

  const form = await request.formData();
  const raw = Object.fromEntries(form.entries()) as Record<string, string>;
  const payload: UpdateParentPayload = {};

  for (const [key, value] of Object.entries(raw)) {
    if (value === "" || value === undefined) continue;
    (payload as Record<string, unknown>)[key] = value;
  }

  try {
    await api.parents.update(Number(params.id), payload);
    return redirect(`/parents/${params.id}`);
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { error: err?.message ?? "Failed to save profile modifications." };
  }
}

export default function ParentEditPage({ loaderData, actionData }: Route.ComponentProps) {
  const { parent } = loaderData as { parent: ParentProfile };
  const actionResult = actionData as { error?: string } | undefined;
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#1e293b",
    color: "#f8fafc",
    fontSize: "14px",
    boxSizing: "border-box" as const,
    marginBottom: "16px"
  };

  const labelStyle = {
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "6px",
    display: "block",
  };

  return (
    <div style={{ color: "#f8fafc", fontFamily: "'Sora', sans-serif", maxWidth: "700px", margin: "0 auto", padding: "20px" }}>
      
      <div style={{ marginBottom: "20px" }}>
        <Link to={`/parents/${parent.id}`} style={{ color: "#3b82f6", textDecoration: "none", fontSize: "14px" }}>
          ← Cancel Changes
        </Link>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", margin: 0 }}>Edit Info: {parent.user?.name}</h1>
      </div>

      {actionResult?.error && (
        <div style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
          {actionResult.error}
        </div>
      )}

      <Form method="post" style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "24px" }}>
        
        <div>
          <label style={labelStyle}>Relationship</label>
          <input name="relationship" defaultValue={parent.relationship ?? ""} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Phone Number</label>
          <input name="phone" defaultValue={parent.phone ?? ""} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Occupation</label>
          <input name="occupation" defaultValue={parent.occupation ?? ""} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Home Address</label>
          <textarea name="address" defaultValue={parent.address ?? ""} rows={3} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Administrative Notes</label>
          <textarea name="notes" defaultValue={parent.notes ?? ""} rows={3} style={inputStyle} />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #1e293b", paddingTop: "16px" }}>
          <button type="submit" disabled={submitting} style={{ padding: "10px 20px", borderRadius: "8px", background: "#3b82f6", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}>
            {submitting ? "Saving Parameters..." : "Save Profile"}
          </button>
        </div>
      </Form>
    </div>
  );
}