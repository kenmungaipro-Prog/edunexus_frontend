import { useState } from "react";
import { Link } from "react-router";
import { api, publicStorageUrl, type PaginatedResponse, type School } from "~/lib/api";

type PrintColumn<T> = {
  label: string;
  value: (row: T) => string | number | null | undefined;
};

type PrintListButtonProps<T> = {
  title: string;
  columns: PrintColumn<T>[];
  loadRows: () => Promise<T[]>;
  filterSummary?: string;
};

type SchoolBranding = Pick<School, "name" | "address" | "phone" | "email" | "logo">;

export async function fetchAllPages<T>(
  loadPage: (page: number, perPage: number) => Promise<PaginatedResponse<T>>,
): Promise<T[]> {
  const perPage = 100;
  const firstPage = await loadPage(1, perPage);
  const firstPageData = firstPage?.data;
  if (!Array.isArray(firstPageData?.data)) {
    throw new Error("The server returned an invalid paginated response. Please try again.");
  }

  const rows = [...firstPageData.data];
  const reportedLastPage = firstPageData.meta?.last_page
    ?? firstPageData.last_page
    ?? (firstPageData.total != null
      ? Math.ceil(firstPageData.total / (firstPageData.per_page || perPage))
      : 1);
  if (!Number.isInteger(reportedLastPage) || reportedLastPage < 1) {
    throw new Error("The server returned invalid pagination details. Please try again.");
  }

  for (let firstPageInBatch = 2; firstPageInBatch <= reportedLastPage; firstPageInBatch += 4) {
    const pageNumbers = Array.from(
      { length: Math.min(4, reportedLastPage - firstPageInBatch + 1) },
      (_, index) => firstPageInBatch + index,
    );
    const pages = await Promise.all(pageNumbers.map((page) => loadPage(page, perPage)));
    pages.forEach((page) => {
      if (!Array.isArray(page?.data?.data)) {
        throw new Error("The server returned an invalid paginated response. Please try again.");
      }
      rows.push(...page.data.data);
    });
  }

  return rows;
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Could not prepare the full list for printing. Please try again.";
}

export function PrintListButton<T>({
  title,
  columns,
  loadRows,
  filterSummary = "All records",
}: PrintListButtonProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [branding, setBranding] = useState<SchoolBranding | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const printList = async () => {
    setLoading(true);
    setError(null);
    try {
      const [allRows, response] = await Promise.all([loadRows(), api.settings.branding()]);
      setRows(allRows);
      setBranding(response.data);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const documentRoot = document.querySelector<HTMLElement>(".print-list-document");
      const logo = documentRoot?.querySelector<HTMLImageElement>("img");
      if (logo) {
        if (!logo.complete) {
          await new Promise<void>((resolve) => {
            logo.addEventListener("load", () => resolve(), { once: true });
            logo.addEventListener("error", () => resolve(), { once: true });
          });
        }
        if (logo.naturalWidth === 0) {
          throw new Error("The school logo could not be loaded. Update it in Settings before printing.");
        }
      }

      document.body.classList.add("print-list-mode");
      window.print();
    } catch (caught: unknown) {
      console.error(`Failed to prepare ${title} print list:`, caught);
      setError(errorMessage(caught));
    } finally {
      document.body.classList.remove("print-list-mode");
      setLoading(false);
    }
  };

  const logoUrl = publicStorageUrl(branding?.logo);

  return (
    <>
      <div className="print-list-document" aria-hidden="true">
        <header className="print-list-header">
          {logoUrl && <img src={logoUrl} alt="" />}
          <div className="print-list-school">
            <strong>{branding?.name || "School"}</strong>
            <span>{[branding?.address, branding?.phone, branding?.email].filter(Boolean).join(" · ")}</span>
          </div>
          <div className="print-list-heading">
            <h1>{title}</h1>
            <span>{filterSummary} · {rows.length.toLocaleString()} records · Printed {new Date().toLocaleString()}</span>
          </div>
        </header>
        {rows.length === 0 ? (
          <p>No records match the current filters.</p>
        ) : (
          <table>
            <thead>
              <tr>{columns.map((column) => <th key={column.label}>{column.label}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column.label}>{column.value(row) ?? "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="print-list-actions print:hidden">
        <button
          type="button"
          aria-label={loading ? "Preparing full list for printing" : `Print full list${rows.length > 0 ? ` (${rows.length.toLocaleString()} records)` : ""}`}
          onClick={() => void printList()}
          disabled={loading}
        >
          <svg aria-hidden="true" className="print-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12h.01" />
          </svg>
          <span className="print-button-label" aria-hidden="true">
            {loading ? "Preparing full list…" : `Print full list${rows.length > 0 ? ` (${rows.length.toLocaleString()})` : ""}`}
          </span>
        </button>
        {!branding?.logo && branding && (
          <span><Link to="/settings">Add a school logo in Settings</Link> to include it on the printout.</span>
        )}
        {error && <span role="alert">{error}</span>}
      </div>
    </>
  );
}
