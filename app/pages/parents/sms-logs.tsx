// ============================================================
// app/pages/parents/sms-logs.tsx
// Admin UI: View sms_logs and retry failed messages
// ============================================================
import { useEffect, useState } from 'react';
import api, { type ApiResponse } from '~/lib/api';

export async function clientLoader() {
  // initial load handled client-side for simplicity
  return {};
}

export default function SmsLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.smsAdmin.logs({ page, per_page: perPage });
      
      // DEFENSIVE EXTRACTION:
      // The '?.' ensures that if res, res.data, or res.data.data is undefined (like in a 204 response),
      // it won't crash. It will just cleanly fall back to the empty array `[]`.
      
      const fetchedLogs = res?.data?.logs 
                       || res?.data?.data?.data 
                       || res?.data?.data 
                       || [];

      // Final safety check to ensure React gets an array
      if (Array.isArray(fetchedLogs)) {
        setLogs(fetchedLogs);
      } else {
        setLogs([]);
      }

    } catch (err) {
      console.error("Failed to fetch SMS logs:", err);
      setLogs([]); // Ensure the UI doesn't break if the API fails entirely
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [page]);

  const retry = async (id: number) => {
    try {
      await api.smsAdmin.retry(id);
      fetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>SMS Logs</h1>
      </div>

      <div style={{ marginTop: 12 }}>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Phone</th>
                <th>Message</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l: any) => (
                <tr key={l.id} style={{ borderTop: '1px solid #222' }}>
                  <td style={{ padding: 8 }}>{l.id}</td>
                  <td style={{ padding: 8 }}>{l.phone}</td>
                  <td style={{ padding: 8, maxWidth: 420 }}>{l.message}</td>
                  <td style={{ padding: 8 }}>{l.status}</td>
                  <td style={{ padding: 8 }}>{l.created_at}</td>
                  <td style={{ padding: 8 }}>
                    {l.status !== 'sent' && (
                      <button onClick={() => retry(l.id)} style={{ background: '#3b82f6', color: '#fff', padding: '6px 8px', borderRadius: 6 }}>Retry</button>
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
