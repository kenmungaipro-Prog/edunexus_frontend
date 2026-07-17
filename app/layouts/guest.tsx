// ============================================================
// app/layouts/guest.tsx
// ============================================================
import { Outlet, redirect } from "react-router";

export async function clientLoader() {
  const token = typeof window !== "undefined" ? localStorage.getItem("edunexus_token") : null;
  if (token) throw redirect("/");
  return null;
}

export function GuestLayout() {
  return <Outlet />;
}
