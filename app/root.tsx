// ============================================================
// app/root.tsx
// ============================================================
import {
  isRouteErrorResponse,
  Links, Meta, Outlet,
  Scripts, ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import "./app.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <Meta />
        <Links />
      </head>
      <body className="bg-slate-900 text-slate-100 font-sora antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404 – Not Found" : "Error " + error.status;
    details = error.data;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-blue-400 mb-4">{message}</h1>
        <p className="text-slate-400 mb-8">{details}</p>
        <a href="/" className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
