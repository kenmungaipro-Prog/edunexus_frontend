// ============================================================
// app/layouts/dashboard.tsx — Final Merged Version
// ============================================================
import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, Link, redirect, useLocation, useOutletContext, useRevalidator } from "react-router";
import type { Route } from "./+types/dashboard";
import { api } from "~/lib/api";
import { filterNavByRole, type UserRole } from "~/lib/rbac";

export async function clientLoader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  try {
    const response = await api.auth.me();
    const user = response.data;
    const canViewSessions = ["admin", "superadmin", "teacher", "receptionist", "accountant"].includes(user.role);
    const canSelectSession = user.role === "admin";
    const sessionsResponse = canViewSessions ? await api.academicSessions.list() : null;
    const sessions = sessionsResponse?.data ?? [];
    const currentSessionId = sessions.find((session) => session.is_current)?.id ?? null;
    const savedSessionId = Number(localStorage.getItem("edunexus_academic_session_id"));
    const savedSession = sessions.find((session) => session.id === savedSessionId);
    const selectedSessionId = canSelectSession && savedSession && !savedSession.is_current
      ? savedSession.id
      : currentSessionId;

    if (!canSelectSession || !savedSession || savedSession.is_current) {
      localStorage.removeItem("edunexus_academic_session_id");
    }

    return { user, sessions, currentSessionId, selectedSessionId };
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

type NavItem = { to: string; icon: string; label: string; badge?: number; end?: boolean; children?: NavItem[] };

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Overview",
    items: [
      { to: "/",          icon: "🏠",  label: "Dashboard",    end: true },
      { to: "/account",   icon: "⚙️",  label: "Account Settings" },
      { to: "/analytics", icon: "📊",  label: "Analytics" },
    ],
  },
  {
    group: "Academic",
    items: [
      { to: "/students",   icon: "🎓", label: "Students"      },
      { to: "/parents",    icon: "👪", label: "Parents"       },
      { to: "/teachers",   icon: "👨‍🏫", label: "Teachers"     },
          { to: "/subjects",   icon: "📘", label: "Subjects"      },
      { to: "/classes",    icon: "📚", label: "Classes"       },
      { to: "/timetable",  icon: "📅", label: "Timetable"     },
      { to: "/attendance", icon: "✅", label: "Attendance"    },
      { to: "/exams",      icon: "📝", label: "Exams & Grades"},
      { to: "/lesson-plans", icon: "📖", label: "Lesson Plans" },
      { to: "/schemes-of-work", icon: "🗂️", label: "Schemes of Work" },
      { to: "/assignments", icon: "📝", label: "Assignments" },
    ],
  },
  {
    group: "Administration",
    items: [
      { to: "/fees",       icon: "💰", label: "Fee Management"    },
      { to: "/library",    icon: "📖", label: "Library"           },
      {
        to: "/transport",
        icon: "🚌",
        label: "Transport",
        children: [
          { to: "/transport", icon: "🚌", label: "Overview" },
          { to: "/transport/live", icon: "📡", label: "Live Map" },
          { to: "/transport/analytics", icon: "📊", label: "Analytics" },
          { to: "/transport/playback", icon: "▶️", label: "Playback" },
          { to: "/transport/notifications", icon: "🔔", label: "Notifications" },
          { to: "/transport/driver", icon: "🚍", label: "Driver Console" },
          { to: "/transport/vehicles", icon: "🚐", label: "Vehicles" },
          { to: "/transport/drivers", icon: "🧑‍✈️", label: "Drivers" },
          { to: "/transport/routes", icon: "🗺️", label: "Routes" },
        ],
      },
      { to: "/events",     icon: "🎉", label: "Events" },
      { to: "/parents/bulk-sms", icon: "📣", label: "Bulk SMS" },
      { to: "/parents/sms-logs", icon: "🗂️", label: "SMS Logs" },
    ],
  },
  {
    group: "Communication",
    items: [
      { to: "/messages", icon: "💬", label: "Messages" },
    ],
  },
  {
    group: "Parent Portal",
    items: [
      { to: "/assignments", icon: "📝", label: "Assignments" },
      { to: "/transport/tracker", icon: "🚌", label: "My Child's Bus" },
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
      { to: "/finance/reconciliation",  icon: "🔄", label: "Reconciliation"  },

    ],
  },
  {
    group: "Accounting",
    items: [
      { to: "/accounting/accounts",  icon: "📒", label: "Chart of Accounts" },
      { to: "/accounting/journals",  icon: "📓", label: "Journal Entries"   },
      { to: "/accounting/reports",   icon: "📉", label: "Trial Balance"     },
      { to: "/accounting/reports/income-statement", icon: "💹", label: "Income Statement" },
      { to: "/accounting/reports/balance-sheet", icon: "⚖️", label: "Balance Sheet" },
      { to: "/accounting/reports/cash-flow", icon: "💰", label: "Cash Flow" },
    ],
  },
  {
    group: "System",
    items: [
      { to: "/academic-sessions", icon: "📆", label: "Academic Sessions" },
      { to: "/settings", icon: "⚙️", label: "Settings" },
    ],
  },
];

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  const { user, sessions, currentSessionId, selectedSessionId } = loaderData as {
    user: any;
    sessions: Array<{ id: number; name: string; is_current: boolean }>;
    currentSessionId: number | null;
    selectedSessionId: number | null;
  };
  const [collapsed, setCollapsed] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(selectedSessionId);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false));
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [unreadEventCount, setUnreadEventCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const location = useLocation();
  const revalidator = useRevalidator();
  const isTransportSection = location.pathname.startsWith("/transport");
  const canSelectSession = user?.role === "admin";
  const activeSession = sessions.find((session) => session.id === activeSessionId);

  useEffect(() => {
    setActiveSessionId(selectedSessionId);
  }, [selectedSessionId]);

  function changeSession(sessionId: number) {
    if (sessionId === currentSessionId) {
      localStorage.removeItem("edunexus_academic_session_id");
    } else {
      localStorage.setItem("edunexus_academic_session_id", String(sessionId));
    }
    setActiveSessionId(sessionId);
    revalidator.revalidate();
  }

  const refreshUnreadEventCount = useCallback(async () => {
    try {
      const response = await api.notifications.eventUnreadCount();
      setUnreadEventCount(response.data.event_count);
    } catch (error) {
      console.error("Failed to load unread event notification count:", error);
    }
  }, []);

  const refreshUnreadMessageCount = useCallback(async () => {
    try {
      const response = await api.messages.unreadCount();
      setUnreadMessageCount(response.data.count);
    } catch (error) {
      console.error("Failed to load unread message count:", error);
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = () => {
      setIsMobile(mediaQuery.matches);
      if (!mediaQuery.matches) setMobileExpanded(false);
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!isMobile || !mobileExpanded) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileExpanded(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, mobileExpanded]);

  useEffect(() => {
    void refreshUnreadEventCount();
    const interval = window.setInterval(() => {
      void refreshUnreadEventCount();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [refreshUnreadEventCount]);

  useEffect(() => {
    void refreshUnreadMessageCount();
    const interval = window.setInterval(() => {
      void refreshUnreadMessageCount();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [refreshUnreadMessageCount]);

  useEffect(() => {
    void refreshUnreadEventCount();
    void refreshUnreadMessageCount();
  }, [location.pathname, refreshUnreadEventCount, refreshUnreadMessageCount]);

  const sidebarWidth = isMobile ? "min(280px, calc(100vw - 48px))" : collapsed ? "70px" : "260px";
  const isCollapsed = !isMobile && collapsed;

  const handleLogout = async () => {
    await api.auth.logout().catch(() => {});
    localStorage.removeItem("edunexus_token");
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0e1a] text-slate-100" style={{ fontFamily: "'Sora', sans-serif", color: "#e8edf8" }}>
      {/* ── Sidebar ── */}
      {isMobile && mobileExpanded && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-[110] bg-slate-950/70 md:hidden"
          onClick={() => setMobileExpanded(false)}
        />
      )}
      <aside
        id="primary-navigation"
        aria-label="Main navigation"
        className="fixed inset-y-0 left-0 z-[120] md:static md:z-auto dashboard-print-hidden"
        style={{
          width: sidebarWidth,
          maxWidth: isMobile ? "calc(100vw - 48px)" : "320px",
          background: "#0f1424",
          borderRight: "1px solid #2a3350",
          transition: "width .3s ease, transform .2s ease",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: isMobile ? "fixed" : "relative",
          transform: isMobile && !mobileExpanded ? "translateX(-100%)" : "translateX(0)",
        }}
      >
        <button
          type="button"
          className="hidden md:flex"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => {
            setCollapsed(c => !c);
            setActiveTooltip(null);
          }}
          style={{
            position: "absolute",
            top: "22px",
            right: "-14px",
            width: "28px",
            height: "28px",
            background: "#1e2640",
            border: "1px solid #3a4570",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            color: "#a0aec0",
            zIndex: 200,
          }}
        >
          {isCollapsed ? "▶" : "◀"}
        </button>
        <button
          type="button"
          className="absolute right-4 top-[22px] z-[1] inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-200 md:hidden"
          aria-label="Close navigation menu"
          onClick={() => setMobileExpanded(false)}
        >
          ×
        </button>

        {/* Logo */}
        <div style={{ padding: "22px 20px", borderBottom: "1px solid #2a3350", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
            background: "linear-gradient(135deg,#4f8ef7,#6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "15px", color: "#fff",
          }}>EN</div>
          {!isCollapsed && (
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
              {!isCollapsed && (
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#6b7a99", letterSpacing: "1.5px", textTransform: "uppercase", padding: "10px 20px 4px" }}>
                  {group.group}
                </div>
              )}
              {group.items.map(item => {
                const itemIsActive = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
                const childItems: NavItem[] = (item.children ?? []).filter((child: NavItem) =>
                  user?.role === "driver" ? child.to === "/transport/driver" : child.to !== "/transport/driver"
                );
                const showChildren = childItems.length > 0 && itemIsActive && !isCollapsed;

                return (
                  <div key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      title={item.label}
                      onMouseEnter={() => {
                        if (isCollapsed) setActiveTooltip(item.label);
                      }}
                      onMouseLeave={() => {
                        if (isCollapsed) setActiveTooltip(null);
                      }}
                      onClick={() => {
                        if (isCollapsed) setActiveTooltip(item.label);
                        if (isMobile) setMobileExpanded(false);
                        if (item.to === "/events" && unreadEventCount > 0) {
                          void api.notifications.markEventNotificationsRead()
                            .then(() => setUnreadEventCount(0))
                            .catch(error => console.error("Failed to mark event notifications as read:", error));
                        }
                      }}
                      style={({ isActive }) => ({
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        gap: "8px",
                        padding: "10px 16px",
                        cursor: "pointer",
                        textDecoration: "none",
                        color: isActive ? "#4f8ef7" : "#a0aec0",
                        background: isActive ? "linear-gradient(90deg,rgba(79,142,247,0.12),transparent)" : "transparent",
                        borderLeft: isActive ? "3px solid #4f8ef7" : "3px solid transparent",
                        transition: "all .15s",
                        whiteSpace: "nowrap", overflow: "hidden",
                        fontSize: "13.5px",
                        fontWeight: 500,
                        position: "relative",
                        textAlign: "left",
                      })}
                    >
                      <span style={{ width: "20px", flexShrink: 0, textAlign: "center", fontSize: "16px" }}>{item.icon}</span>
                      {isCollapsed && ((item.to === "/events" && unreadEventCount > 0) || (item.to === "/messages" && unreadMessageCount > 0)) && (
                        <span style={{ position: "absolute", top: "4px", right: "4px", minWidth: "8px", height: "8px", borderRadius: "999px", background: "#ef4444", border: "2px solid #0f1424" }} />
                      )}
                      {!isCollapsed && (
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: "8px", flex: 1 }}>
                          <span style={{ fontSize: "13.5px", lineHeight: 1.2 }}>{item.label}</span>
                          {(item.to === "/events" ? unreadEventCount : item.to === "/messages" ? unreadMessageCount : item.badge) ? (
                            <span style={{ background: "#ef4444", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "10px" }}>
                              {item.to === "/events" ? unreadEventCount : item.to === "/messages" ? unreadMessageCount : item.badge}
                            </span>
                          ) : null}
                        </div>
                      )}
                      {isCollapsed && activeTooltip === item.label && (
                        <span
                          style={{
                            position: "absolute",
                            left: "calc(100% + 8px)",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "#1e2640",
                            color: "#f8fafc",
                            padding: "6px 10px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                            zIndex: 300,
                          }}
                        >
                          {item.label}
                        </span>
                      )}
                    </NavLink>
                    {showChildren && (
                      <div style={{ paddingLeft: "34px", marginTop: "4px", display: "grid", gap: "4px" }}>
                        {childItems.map(child => (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            end={child.to === "/transport"}
                            style={({ isActive }) => ({
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "8px 14px",
                              textDecoration: "none",
                              color: isActive ? "#fff" : "#a0aec0",
                              background: isActive ? "rgba(79,142,247,0.16)" : "transparent",
                              borderRadius: "999px",
                              fontSize: "13px",
                              transition: "background .15s, color .15s",
                            })}
                          >
                            <span style={{ width: "18px", textAlign: "center" }}>{child.icon}</span>
                            <span>{child.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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
            {!isCollapsed && (
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
        <header
          className="flex min-h-[65px] flex-wrap items-center gap-2 border-b border-slate-800/80 bg-[#0f1424] px-4 py-2 md:h-[65px] md:flex-nowrap md:gap-3 md:px-7 md:py-0 dashboard-print-hidden"
          style={{ flexShrink: 0 }}
        >
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-lg text-slate-100 md:hidden"
            aria-label={mobileExpanded ? "Close navigation" : "Open navigation"}
            aria-controls="primary-navigation"
            aria-expanded={mobileExpanded}
            onClick={() => setMobileExpanded(expanded => !expanded)}
          >
            {mobileExpanded ? "×" : "☰"}
          </button>
          <div className="hidden md:block" style={{ flex: 1 }} />

          {/* Search */}
          <div className="order-3 w-full md:order-none md:w-auto md:flex-1" style={{ position: "relative", maxWidth: "280px", minWidth: 0 }}>
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
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            {canSelectSession ? (
              <select
                aria-label="Academic session"
                value={activeSessionId ?? ""}
                onChange={(event) => changeSession(Number(event.target.value))}
                className="max-w-40 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200"
              >
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}{session.is_current ? " (Current)" : ""}
                  </option>
                ))}
              </select>
            ) : (
              activeSession?.name && (
                <span className="hidden sm:inline-flex" style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontSize: "11px", fontWeight: 600, padding: "4px 12px", borderRadius: "20px" }}>
                  {activeSession.name}
                </span>
              )
            )}
            <div style={{ width: "38px", height: "38px", background: "#1a2035", border: "1px solid #2a3350", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", position: "relative" }}>
              🔔
            </div>
            {(user?.role === "admin" || user?.role === "receptionist")
              && currentSessionId !== null
              && activeSessionId === currentSessionId && (
                <Link to="/students/new" aria-label="Add student" style={{ width: "38px", height: "38px", background: "linear-gradient(135deg,#4f8ef7,#6366f1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "18px", textDecoration: "none", color: "#fff" }}>
                  ＋
                </Link>
              )}
          </div>
        </header>

        {isTransportSection && (
          <div className="border-b border-slate-800/80 bg-[#0f1424] px-4 py-3 sm:px-7">
            <div className="flex min-w-0 overflow-x-auto pb-1">
              {[
                { to: "/transport", label: "Overview" },
                { to: "/transport/tracker", label: "Tracker" },
                { to: "/transport/live", label: "Live Map" },
                { to: "/transport/analytics", label: "Analytics" },
                { to: "/transport/playback", label: "Playback" },
                { to: "/transport/notifications", label: "Notifications" },
                { to: "/transport/driver", label: "Driver Console" },
                { to: "/transport/vehicles", label: "Vehicles" },
                { to: "/transport/drivers", label: "Drivers" },
                { to: "/transport/routes", label: "Routes" },
              ].filter((item) => user?.role === "driver" ? item.to === "/transport/driver" : item.to !== "/transport/driver").map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/transport"}
                  className={({ isActive }) =>
                    `inline-flex flex-shrink-0 items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-xs sm:text-sm font-semibold transition mr-2 whitespace-nowrap ${isActive ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-[#0a0e1a] px-3 py-3 sm:px-4 sm:py-4 md:px-7 md:py-6" style={{ minWidth: 0 }}>
          {canSelectSession && activeSessionId !== currentSessionId && activeSession && (
            <div className="mx-auto mb-4 max-w-7xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200" role="status">
              Viewing {activeSession.name}. Historical academic data is read-only.
            </div>
          )}
          <Outlet context={{ user, selectedSessionId: activeSessionId, currentSessionId }} />
        </main>
      </div>
    </div>
  );
}

export function useUser() {
  return useOutletContext<{
    user: { id: number; name: string; email: string; role: string; school?: { name: string } };
    selectedSessionId: number | null;
    currentSessionId: number | null;
  }>();
}
