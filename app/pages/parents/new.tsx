// ============================================================
// app/pages/parents/new.tsx
// ============================================================
import { useState } from "react";
import { Form, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/new";
import { api } from "~/lib/api";

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

  const inputStyle = {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #2a3350",
    background: "#0f1424",
    color: "#e8edf8",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box" as const,
    outline: "none"
  };

  return (
    <div style={{ color: "#e8edf8", fontFamily: "'Sora', sans-serif", maxWidth: "620px", margin: "0 auto", padding: "12px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 24px)", margin: 0 }}>New Parent</h1>
          <p style={{ color: "#94a3b8", marginTop: "8px", fontSize: "14px" }}>Create a parent user account and guardian profile.</p>
        </div>
      </div>

      <Form method="post" style={{ display: "grid", gap: "16px", background: "#0b1220", padding: "16px", borderRadius: "12px", border: "1px solid #1e293b", boxSizing: "border-box" }}>
        <div style={{ display: "grid", gap: "8px" }}>
          <label style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>Full Name</label>
          <input name="name" required placeholder="Parent name" style={inputStyle} />
        </div>

        <div style={{ display: "grid", gap: "8px" }}>
          <label style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>Email address</label>
          <input name="email" type="email" required placeholder="parent@example.com" style={inputStyle} />
        </div>

        <div style={{ display: "grid", gap: "8px" }}>
          <label style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>Password</label>
          <input name="password" type="password" placeholder="Leave empty for default" style={inputStyle} />
        </div>

        <div style={{ display: "grid", gap: "8px" }}>
          <label style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>Relationship</label>
          <input name="relationship" placeholder="Mother, Father, Guardian" style={inputStyle} />
        </div>

        <div style={{ display: "grid", gap: "8px" }}>
          <label style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>Phone</label>
          <input name="phone" placeholder="0712345678" style={inputStyle} />
        </div>

        <div style={{ display: "grid", gap: "8px" }}>
          <label style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>Occupation</label>
          <input name="occupation" placeholder="Occupation" style={inputStyle} />
        </div>

        <div style={{ display: "grid", gap: "8px" }}>
          <label style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>Address</label>
          <textarea name="address" rows={4} placeholder="Address" style={inputStyle} />
        </div>

        <div style={{ display: "grid", gap: "8px" }}>
          <label style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>Notes</label>
          <textarea name="notes" rows={3} placeholder="Optional notes" style={inputStyle} />
        </div>

        <button type="submit" disabled={isSubmitting} style={{ width: "100%", padding: "12px 20px", borderRadius: "10px", border: "none", background: "#4f8ef7", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>
          {isSubmitting ? "Creating…" : "Create Parent"}
        </button>
      </Form>
    </div>
  );
}