// ============================================================
// app/layouts/dashboard.tsx — Final Merged Version
// ============================================================
import { useState } from "react";
import { NavLink, Outlet, Link, redirect, useOutletContext } from "react-router";
import type { Route } from "./+types/dashboard";
import { api } from "~/lib/api";
import { filterNavByRole, type UserRole } from "~/lib/rbac";

export async function clientLoader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  try {
    const response = await api.get("/auth/me");
    // Unwrapping Laravel's { success: true, data: { ...user } }
    return { user: response.data.data };
  } catch (error: any) {
    // Only redirect if we aren't already going to the login page
    // and wipe the token to prevent the infinite redirect loop
    if (error.response?.status === 401 && url.pathname !== "/login") {
      localStorage.removeItem("edunexus_token");
      throw redirect("/login");
    }
    throw error;
  }
}

type NavItem = { to: string; icon: string; label: string; badge?: number; end?: boolean };

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Overview",
    items: [
      { to: "/",          icon: "🏠",  label: "Dashboard",    end: true },
      { to: "/analytics", icon: "📊",  label: "Analytics" },
    ],
  },
  {
    group: "Academic",
    items: [
      { to: "/students",   icon: "🎓", label: "Students"      },
      { to: "/parents",    icon: "👪", label: "Parents"       },
      { to: "/teachers",   icon: "👨‍🏫", label: "Teachers"     },
      { to: "/classes",    icon: "📚", label: "Classes"       },
      { to: "/timetable",  icon: "📅", label: "Timetable"     },
      { to: "/attendance", icon: "✅", label: "Attendance"    },
      { to: "/exams",      icon: "📝", label: "Exams & Grades"},
    ],
  },
  {
    group: "Administration",
    items: [
      { to: "/fees",       icon: "💰", label: "Fee Management"    },
      { to: "/library",    icon: "📖", label: "Library"           },
      { to: "/transport",  icon: "🚌", label: "Transport"         },
          { to: "/events",     icon: "🎉", label: "Events",   badge: 3 },
          { to: "/parents/bulk-sms", icon: "📣", label: "Bulk SMS" },
          { to: "/parents/sms-logs", icon: "🗂️", label: "SMS Logs" },
      { to: "/messages",   icon: "💬", label: "Messages", badge: 7 },
    ],
  },
  {
    group: "Parent Portal",
    items: [
      { to: "/portal/analytics", icon: "📊", label: "Child Analytics" },
      { to: "/portal/payments",  icon: "💳", label: "Pay Fees"        },
    ],
  },
  {
    group: "Finance",
    items: [
      { to: "/finance/dashboard",        icon: "📈", label: "Finance Dashboard" },
      { to: "/finance/fee-categories",   icon: "🏷️", label: "Fee Categories"   },
      { to: "/finance/fee-structures",   icon: "🗂️", label: "Fee Structures"   },
      { to: "/finance/invoices",         icon: "🧾", label: "Invoices"         },
      { to: "/fees/generate",            icon: "🧾", label: "Generate Invoice" },
      { to: "/finance/payments",         icon: "💳", label: "Payments"         },
      { to: "/finance/payments/collect", icon: "💵", label: "Collect Payment"  },
      { to: "/finance/receipts",         icon: "🗞️", label: "Receipts"         },
    ],
  },
  {
    group: "Accounting",
    items: [
      { to: "/accounting/accounts",  icon: "📒", label: "Chart of Accounts" },
      { to: "/accounting/journals",  icon: "📓", label: "Journal Entries"   },
      { to: "/accounting/reports",   icon: "📉", label: "Trial Balance"     },
    ],
  },
  {
    group: "System",
    items: [
      { to: "/settings", icon: "⚙️", label: "Settings" },
    ],
  },
];

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData as { user: any };
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("edunexus_token");
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Sora', sans-serif", background: "#0a0e1a", color: "#e8edf8" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: collapsed ? "70px" : "260px",
        background: "#0f1424",
        borderRight: "1px solid #2a3350",
        transition: "width .3s ease",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "relative",
        zIndex: 100,
      }}>
        {/* Toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            position: "absolute", top: "22px", right: "-14px",
            width: "28px", height: "28px",
            background: "#1e2640", border: "1px solid #3a4570",
            borderRadius: "50%", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", color: "#a0aec0", zIndex: 200,
          }}
        >
          {collapsed ? "▶" : "◀"}
        </button>

        {/* Logo */}
        <div style={{ padding: "22px 20px", borderBottom: "1px solid #2a3350", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
            background: "linear-gradient(135deg,#4f8ef7,#6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "15px", color: "#fff",
          }}>EN</div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "17px", fontWeight: 700, background: "linear-gradient(135deg,#4f8ef7,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", whiteSpace: "nowrap" }}>EduNexus</div>
              <div style={{ fontSize: "10px", color: "#6b7a99", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>School Management</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "10px 0" }}>
          {filterNavByRole(NAV, user?.role as UserRole).map(group => (
            <div key={group.group}>
              {!collapsed && (
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#6b7a99", letterSpacing: "1.5px", textTransform: "uppercase", padding: "10px 20px 4px" }}>
                  {group.group}
                </div>
              )}
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  style={({ isActive }) => ({
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "10px 20px", cursor: "pointer",
                    textDecoration: "none",
                    color: isActive ? "#4f8ef7" : "#a0aec0",
                    background: isActive ? "linear-gradient(90deg,rgba(79,142,247,0.12),transparent)" : "transparent",
                    borderLeft: isActive ? "3px solid #4f8ef7" : "3px solid transparent",
                    transition: "all .15s",
                    whiteSpace: "nowrap", overflow: "hidden",
                    fontSize: "13.5px", fontWeight: 500,
                  })}
                >
                  <span style={{ width: "20px", flexShrink: 0, textAlign: "center", fontSize: "16px" }}>{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.badge && (
                        <span style={{ background: "#ef4444", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "10px" }}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User card */}
        <div style={{ padding: "14px", borderTop: "1px solid #2a3350" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: "#1a2035", borderRadius: "8px", cursor: "pointer", overflow: "hidden" }}
            onClick={handleLogout} title="Click to logout">
            <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#4f8ef7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>
              {user?.name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2)}
            </div>
            {!collapsed && (
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</div>
                <div style={{ fontSize: "11px", color: "#6b7a99", textTransform: "capitalize" }}>{user?.school?.name || user?.role}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <header style={{
          height: "65px", background: "#0f1424",
          borderBottom: "1px solid #2a3350",
          display: "flex", alignItems: "center",
          padding: "0 28px", gap: "14px", flexShrink: 0,
        }}>
          <div style={{ flex: 1 }} />

          {/* Search */}
          <div style={{ position: "relative", width: "280px" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: "#6b7a99" }}>🔍</span>
            <input
              placeholder="Search students, classes..."
              style={{
                width: "100%", background: "#1a2035", border: "1px solid #2a3350",
                borderRadius: "8px", padding: "8px 12px 8px 32px",
                fontSize: "13px", color: "#e8edf8", fontFamily: "'Sora', sans-serif",
                outline: "none",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "#4f8ef7"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#2a3350"; }}
            />
          </div>

          {/* Actions */}
          <span style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontSize: "11px", fontWeight: 600, padding: "4px 12px", borderRadius: "20px" }}>
            2024–25
          </span>
          <div style={{ width: "38px", height: "38px", background: "#1a2035", border: "1px solid #2a3350", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px", position: "relative" }}>
            🔔
            <div style={{ position: "absolute", top: "6px", right: "6px", width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%", border: "2px solid #0f1424" }} />
          </div>
          <Link to="/students/new" style={{ width: "38px", height: "38px", background: "linear-gradient(135deg,#4f8ef7,#6366f1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "18px", textDecoration: "none", color: "#fff" }}>
            ＋
          </Link>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "28px", background: "#0a0e1a" }}>
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}

export function useUser() {
  return useOutletContext<{ user: { id: number; name: string; email: string; role: string; school?: { name: string } } }>();
}
