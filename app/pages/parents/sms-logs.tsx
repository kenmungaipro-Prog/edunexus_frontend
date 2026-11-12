// ============================================================
// app/pages/parents/sms-logs.tsx
// Admin UI: View sms_logs and retry failed messages
// ============================================================
import { useEffect, useState } from 'react';
import { api, type ApiResponse } from "~/lib/api";
import { PrintListButton } from "~/components/PrintListButton";

interface SmsLog {
  id: number;
  phone: string;
  message: string;
  status: string;
  created_at: string;
}

async function fetchAllSmsLogs(status: string, phone: string): Promise<SmsLog[]> {
  const perPage = 100;
  const loadPage = async (page: number) => api.smsAdmin.logs({
    page,
    per_page: perPage,
    status: status || undefined,
    phone: phone || undefined,
  });
  const firstResponse = await loadPage(1);
  const paginator = firstResponse.data?.data;
  if (!paginator || !Array.isArray(paginator.data) || !Number.isInteger(paginator.last_page)) {
    throw new Error("The SMS log response did not include complete pagination data.");
  }

  const rows = [...paginator.data] as SmsLog[];
  for (let firstPage = 2; firstPage <= paginator.last_page; firstPage += 4) {
    const pageNumbers = Array.from(
      { length: Math.min(4, paginator.last_page - firstPage + 1) },
      (_, index) => firstPage + index,
    );
    const pages = await Promise.all(pageNumbers.map(loadPage));
    for (const response of pages) {
      const pageData = response.data?.data;
      if (!pageData || !Array.isArray(pageData.data)) {
        throw new Error("An SMS log page could not be loaded completely.");
      }
      rows.push(...pageData.data as SmsLog[]);
    }
  }
  return rows;
}

export async function clientLoader() {
  return {};
}

export default function SmsLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const [status, setStatus] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.smsAdmin.logs({ page, per_page: perPage, status: status || undefined, phone: phone || undefined });
      
      const fetchedLogs = res?.data?.logs 
                       || res?.data?.data?.data 
                       || res?.data?.data 
                       || [];

      if (Array.isArray(fetchedLogs)) {
        setLogs(fetchedLogs);
      } else {
        setLogs([]);
      }

    } catch (err) {
      console.error("Failed to fetch SMS logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [page, status, phone]);

  const retry = async (id: number) => {
    try {
      await api.smsAdmin.retry(id);
      fetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ color: "#f8fafc", fontFamily: "'Sora', sans-serif", padding: "12px", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "16px", flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: "clamp(22px, 4vw, 26px)", margin: 0 }}>SMS Logs</h1>
        <PrintListButton
          title="SMS Log Register"
          filterSummary={[status && `Status: ${status}`, phone && `Phone: ${phone}`].filter(Boolean).join(" · ") || "All SMS logs"}
          loadRows={() => fetchAllSmsLogs(status, phone)}
          columns={[
            { label: "ID", value: (log) => log.id },
            { label: "Phone", value: (log) => log.phone },
            { label: "Message", value: (log) => log.message },
            { label: "Status", value: (log) => log.status },
            { label: "Created", value: (log) => log.created_at },
          ]}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <input
          type="search"
          aria-label="Filter by phone number"
          placeholder="Filter by phone..."
          value={phone}
          onChange={(event) => { setPhone(event.target.value); setPage(1); }}
          style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #334155", background: "#0f172a", color: "#f8fafc" }}
        />
        <select
          aria-label="Filter by SMS status"
          value={status}
          onChange={(event) => { setStatus(event.target.value); setPage(1); }}
          style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #334155", background: "#0f172a", color: "#f8fafc" }}
        >
          <option value="">All statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div style={{ marginTop: 12, overflowX: 'auto', borderRadius: '12px', border: '1px solid #1e293b', background: '#0f172a', WebkitOverflowScrolling: 'touch' }}>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>Loading logs...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: '#1e293b', textAlign: 'left', color: '#cbd5e1', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 16px' }}>ID</th>
                <th style={{ padding: '12px 16px' }}>Phone</th>
                <th style={{ padding: '12px 16px' }}>Message</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Created</th>
                <th style={{ padding: '12px 16px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                    No SMS logs found.
                  </td>
                </tr>
              ) : logs.map((l: any) => (
                <tr key={l.id} style={{ borderTop: '1px solid #1e293b', fontSize: '14px' }}>
                  <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{l.id}</td>
                  <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{l.phone}</td>
                  <td style={{ padding: '12px 16px', maxWidth: 420, color: '#f8fafc', wordBreak: 'break-word' }}>{l.message}</td>
                  <td style={{ padding: '12px 16px', textTransform: 'capitalize', color: l.status === 'sent' ? '#10b981' : '#ef4444' }}>{l.status}</td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px' }}>{l.created_at}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {l.status !== 'sent' && (
                      <button onClick={() => retry(l.id)} style={{ background: '#3b82f6', color: '#fff', padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}>Retry</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}