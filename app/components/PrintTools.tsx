import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api, publicStorageUrl, type School } from "~/lib/api";

export function PrintTools({ title }: { title: string }) {
  const [school, setSchool] = useState<Pick<School, "name" | "address" | "phone" | "email" | "logo"> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void api.settings.branding()
      .then((response) => {
        if (active) setSchool(response.data);
      })
      .catch((error: unknown) => {
        console.error("Failed to load school print branding:", error);
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retry]);

  const printDocument = async () => {
    const logo = document.querySelector<HTMLImageElement>(".print-branding img");
    if (logo && !logo.complete) {
      await new Promise<void>((resolve) => {
        logo.addEventListener("load", () => resolve(), { once: true });
        logo.addEventListener("error", () => resolve(), { once: true });
      });
    }
    window.print();
  };

  const logoUrl = publicStorageUrl(school?.logo);

  return (
    <>
      <div className="print-branding" aria-hidden="true">
        {logoUrl && <img src={logoUrl} alt="" onLoad={() => setLogoError(false)} onError={() => setLogoError(true)} />}
        <div className="print-branding-school">
          <strong>{school?.name || "School"}</strong>
          {[school?.address, school?.phone, school?.email].filter(Boolean).join(" · ")}
        </div>
        <strong className="print-branding-title">{title}</strong>
      </div>
      <div className="print-tools print:hidden">
        <button
          type="button"
          aria-label={loading ? "Loading print branding" : "Print"}
          disabled={loading || loadError || logoError}
          onClick={() => void printDocument()}
          className="print-tools-button"
        >
          <svg aria-hidden="true" className="print-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12h.01" />
          </svg>
          <span className="print-button-label" aria-hidden="true">{loading ? "Loading…" : "Print"}</span>
        </button>
        {loadError ? (
          <span role="alert" className="print-tools-message">
            School branding could not be loaded. <button type="button" onClick={() => { setLoading(true); setLoadError(false); setRetry((value) => value + 1); }}>Retry</button>
          </span>
        ) : logoError ? (
          <span role="alert" className="print-tools-message">
            The saved logo could not be loaded. <Link to="/settings">Update the logo in Settings</Link>.
          </span>
        ) : !school?.logo ? (
          <span className="print-tools-message">
            <Link to="/settings">Add a school logo in Settings</Link> to include it on printouts.
          </span>
        ) : null}
      </div>
    </>
  );
}
