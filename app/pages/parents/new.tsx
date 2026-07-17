// ============================================================
// app/pages/parents/new.tsx
// ============================================================
import { useState } from "react";
import { Form, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/new";
import api from "~/lib/api";

export async function clientLoader() {
  return {};
}

export async function clientAction({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const payload = {
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
    relationship: form.get("relationship"),
    phone: form.get("phone"),
    address: form.get("address"),
    occupation: form.get("occupation"),
    notes: form.get("notes"),
  };

  await api.parents.create(payload as any);
  return redirect("/parents");
}

export default function ParentNewPage() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div style={{ color: "#e8edf8", fontFamily: "'Sora', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "24px", margin: 0 }}>New Parent</h1>
          <p style={{ color: "#94a3b8", marginTop: "8px" }}>Create a parent user account and guardian profile.</p>
        </div>
      </div>

      <Form method="post" style={{ display: "grid", gap: "16px", maxWidth: "620px" }}>
        <div style={{ display: "grid", gap: "10px" }}>
          <label style={{ color: "#94a3b8", fontSize: "13px" }}>Full Name</label>
          <input name="name" required placeholder="Parent name" style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #2a3350", background: "#0f1424", color: "#e8edf8" }} />
        </div>

        <div style={{ display: "grid", gap: "10px" }}>
          <label style={{ color: "#94a3b8", fontSize: "13px" }}>Email address</label>
          <input name="email" type="email" required placeholder="parent@example.com" style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #2a3350", background: "#0f1424", color: "#e8edf8" }} />
        </div>

        <div style={{ display: "grid", gap: "10px" }}>
          <label style={{ color: "#94a3b8", fontSize: "13px" }}>Password</label>
          <input name="password" type="password" placeholder="Leave empty for default" style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #2a3350", background: "#0f1424", color: "#e8edf8" }} />
        </div>

        <div style={{ display: "grid", gap: "10px" }}>
          <label style={{ color: "#94a3b8", fontSize: "13px" }}>Relationship</label>
          <input name="relationship" placeholder="Mother, Father, Guardian" style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #2a3350", background: "#0f1424", color: "#e8edf8" }} />
        </div>

        <div style={{ display: "grid", gap: "10px" }}>
          <label style={{ color: "#94a3b8", fontSize: "13px" }}>Phone</label>
          <input name="phone" placeholder="0712345678" style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #2a3350", background: "#0f1424", color: "#e8edf8" }} />
        </div>

        <div style={{ display: "grid", gap: "10px" }}>
          <label style={{ color: "#94a3b8", fontSize: "13px" }}>Occupation</label>
          <input name="occupation" placeholder="Occupation" style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #2a3350", background: "#0f1424", color: "#e8edf8" }} />
        </div>

        <div style={{ display: "grid", gap: "10px" }}>
          <label style={{ color: "#94a3b8", fontSize: "13px" }}>Address</label>
          <textarea name="address" rows={4} placeholder="Address" style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #2a3350", background: "#0f1424", color: "#e8edf8" }} />
        </div>

        <div style={{ display: "grid", gap: "10px" }}>
          <label style={{ color: "#94a3b8", fontSize: "13px" }}>Notes</label>
          <textarea name="notes" rows={3} placeholder="Optional notes" style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #2a3350", background: "#0f1424", color: "#e8edf8" }} />
        </div>

        <button type="submit" disabled={isSubmitting} style={{ width: "fit-content", padding: "12px 20px", borderRadius: "10px", border: "none", background: "#4f8ef7", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
          {isSubmitting ? "Creating…" : "Create Parent"}
        </button>
      </Form>
    </div>
  );
}
