import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // ── Guest (unauthenticated) ─────────────────────────────────
  layout("layouts/guest.tsx", [
    route("login", "pages/auth/login.tsx"),
    route("login2", "pages/auth/logi.tsx"),
  ]),

  // ── Dashboard (authenticated) ───────────────────────────────
  layout("layouts/dashboard.tsx", [
    index("pages/dashboard/index.tsx"),
    route("analytics", "pages/analytics/index.tsx"),

    // ── Students ──────────────────────────────────────────────
    // NOTE: "new" must be a sibling route, NOT a child of the index,
    // otherwise it renders inside the students list outlet.
    route("students", "pages/students/index.tsx"),
    route("students/new", "pages/students/new.tsx"),
    route("students/:id", "pages/students/show.tsx"),
    route("students/:id/edit", "pages/students/edit.tsx"),

    // ── Parents ────────────────────────────────────────────────────
    route("parents", "pages/parents/index.tsx"),
    route("parents/new", "pages/parents/new.tsx"),
    route("parents/bulk-sms", "pages/parents/bulk-sms.tsx"),
    route("parents/sms-logs", "pages/parents/sms-logs.tsx"),
    route("parents/:id/edit", "pages/parents/edit.tsx"),
    route("parents/:id", "pages/parents/show.tsx"),

    // ── Teachers ──────────────────────────────────────────────
    // Added missing "new" and "edit" routes to match the improved pages.
    route("teachers", "pages/teachers/index.tsx"),
    route("teachers/new", "pages/teachers/new.tsx"),
    route("teachers/:id", "pages/teachers/show.tsx"),
    route("teachers/:id/edit", "pages/teachers/edit.tsx"),
    route("teachers/:id/timetable", "pages/teachers/timetable.tsx"),

    route("portal/analytics", "pages/portal/analytics/index.tsx"),
    route("portal/payments", "pages/portal/payments/index.tsx"),

    // ── Classes ───────────────────────────────────────────────
    route("classes", "pages/classes/index.tsx"),
    route("classes/new", "pages/classes/new.tsx"),
    route("classes/:id", "pages/classes/show.tsx"),
    route("classes/:id/edit", "pages/classes/edit.tsx"),

    // ── Subjects ──────────────────────────────────────────────
    route("subjects", "pages/subjects/index.tsx"),
    route("subjects/new", "pages/subjects/new.tsx"),
    route("subjects/:id/edit", "pages/subjects/[id]/edit.tsx"),

    // ── Timetable ─────────────────────────────────────────────
    route("timetable", "pages/timetable/index.tsx"),

    // ── Attendance ────────────────────────────────────────────
    route("attendance", "pages/attendance/index.tsx"),
    route("attendance/mark", "pages/attendance/mark.tsx"),

    // ── Exams ─────────────────────────────────────────────────
    route("exams", "pages/exams/index.tsx"),
    route("exams/new", "pages/exams/new.tsx"),
    route("exams/:id", "pages/exams/show.tsx"),

    // ── Fees ──────────────────────────────────────────────────
    // "collect" and "receipt" must come before ":id" to avoid
    // the literal strings being matched as dynamic segments.
    route("fees", "pages/fees/index.tsx"),
    route("fees/generate", "pages/fees/generate.tsx"),
    route("fees/collect", "pages/fees/collect.tsx"),
    route("fees/receipt/:receiptId", "pages/fees/receipt.tsx"),
    route("fees/defaulters", "pages/fees/defaulters.tsx"),
    route("fees/:id", "pages/fees/show.tsx"),
    

    route("finance/dashboard", "pages/finance/dashboard.tsx"),
    route("finance/fee-categories", "pages/finance/fee-categories/index.tsx"),
    route("finance/fee-structures", "pages/finance/fee-structures/index.tsx"),
    route("finance/fee-structures/:id", "pages/finance/fee-structures/$id.tsx"),
    route("finance/fee-structures/:id/edit", "pages/finance/fee-structures/edit-$id.tsx"),
    route("finance/invoices", "pages/finance/invoices/index.tsx"),
    route("finance/invoices/:id", "pages/finance/invoices/show.tsx"),
    route("finance/payments", "pages/finance/payments/index.tsx"),
    route("finance/payments/mpesa-status", "pages/finance/payments/mpesa-status.tsx"),
    route("finance/payments/collect", "pages/finance/payments/collect.tsx"),
    route("finance/receipts", "pages/finance/receipts/index.tsx"),
    route("finance/reconciliation", "pages/finance/reconciliation/index.tsx"),
    route("finance/students/:id/statement", "pages/finance/students/statement.tsx"),

    // ── Accounting ───────────────────────────────────────────
    route("accounting/accounts", "pages/accounting/accounts/index.tsx"),
    route("accounting/journals", "pages/accounting/journals/index.tsx"),
    route("accounting/reports", "pages/accounting/reports/index.tsx"),
    route("accounting/reports/income-statement", "pages/accounting/reports/income-statement.tsx"),
    route("accounting/reports/balance-sheet", "pages/accounting/reports/balance-sheet.tsx"),
    route("accounting/reports/cash-flow", "pages/accounting/reports/cash-flow.tsx"),

    // ── Library ───────────────────────────────────────────────
    route("library", "pages/library/index.tsx"),
    route("library/new", "pages/library/new.tsx"),
    route("library/books/:id/edit", "pages/library/books/edit-$id.tsx"),
    route("library/books/:id", "pages/library/books/$id.tsx"),
    route("library/books/:id/circulation", "pages/library/books/circulation.tsx"),
    route("library/books/:id/history", "pages/library/books/history.tsx"),

    // ── Transport ─────────────────────────────────────────────
    // Replaced the simple routes with our comprehensive transport suite
    route("transport", "pages/transport/index.tsx"),
    route("transport/tracker", "pages/transport/parent-tracker.tsx"),
    route("transport/live", "pages/transport/live-map.tsx"),
    route("transport/analytics", "pages/transport/analytics.tsx"),
    route("transport/playback", "pages/transport/playback.tsx"),
    route("transport/notifications", "pages/transport/notifications.tsx"),
    route("transport/driver", "pages/transport/driver.tsx"),
    route("transport/new", "pages/transport/new.tsx"),
    
    // Fleet & Driver Management
    route("transport/vehicles", "pages/transport/vehicles/index.tsx"),
    route("transport/vehicles/:id/edit", "pages/transport/vehicles/$id.edit.tsx"),
    route("transport/vehicles/new", "pages/transport/vehicles/new2.tsx"),
    route("transport/drivers", "pages/transport/drivers/index.tsx"),
    route("transport/drivers/:id/edit", "pages/transport/drivers/$id.edit.tsx"),
    route("transport/drivers/new", "pages/transport/drivers/new3.tsx"),
    
    // Route Management (Static actions first, dynamic ID matching last)
    route("transport/routes", "pages/transport/routes/index.tsx"),
    route("transport/routes/:id/assign", "pages/transport/routes/assign.tsx"),
    route("transport/routes/:id/edit", "pages/transport/routes/edit.tsx"),
    route("transport/routes/:id", "pages/transport/routes/$id.tsx"),

    // ── Events ────────────────────────────────────────────────
    route("events", "pages/events/index.tsx"),
    route("events/new", "pages/events/new.tsx"),
    route("events/:id/edit", "pages/events/edit-$id.tsx"),
    route("events/:id", "pages/events/$id.tsx"),

    // ── Messages ──────────────────────────────────────────────
    // Flattened: "thread/:id" must be a sibling, not a child,
    // so the messages list doesn't try to render an outlet.
    route("messages", "pages/messages/index.tsx"),
    route("messages/thread/:id", "pages/messages/thread.tsx"),

    // ── Settings ──────────────────────────────────────────────
    route("settings", "pages/settings/index.tsx"),
  ]),
] satisfies RouteConfig;
