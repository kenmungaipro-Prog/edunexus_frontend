// ============================================================
// app/pages/parents/bulk-sms.tsx
// Simple admin UI to compose and send bulk SMS to parents
// ============================================================
import { useState } from "react";
import type { Route } from "./+types/bulk-sms";
import { api, type ParentProfile } from "~/lib/api";

export async function clientLoader() {
  try {
    const res = await api.parents.list({ per_page: 1000 });
    console.log('Parents loaded:', res);
    return { parents: res?.data?.data || [] };
  } catch (err) {
    console.error('Failed to load parents:', err);
    return { parents: [], error: (err as any)?.message };
  }
}

export default function BulkSmsPage({ loaderData }: Route.ComponentProps) {
  const { parents = [], error: loaderError } = loaderData as { parents: ParentProfile[]; error?: string };

  const [selected, setSelected] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<string | null>(loaderError || null);

  const toggle = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (!selectAll) {
      setSelected(parents.map(p => p.id));
      setSelectAll(true);
    } else {
      setSelected([]);
      setSelectAll(false);
    }
  };

  const send = async () => {
    if (!message.trim()) return setResult("Please enter a message.");
    setIsSending(true);
    setResult(null);

    try {
      const payload: any = { message };
      if (!selectAll) payload.parent_ids = selected;
      else payload.send_to_all = true;

      console.log('Sending SMS payload:', payload);
      const res = await api.parents.bulkSms(payload);
      console.log('SMS response:', res);
      
      const count = res?.data?.results?.length ?? 0;
      setResult(`✓ Queued ${count} SMS messages (check logs for details)`);
      setMessage("");
      setSelected([]);
      setSelectAll(false);
    } catch (err: unknown) {
      const errMsg = (err as any)?.message || (err as any)?.response?.data?.message || JSON.stringify(err);
      console.error('SMS send error:', errMsg, err);
      setResult(`✗ Error: ${errMsg}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ color: "#f8fafc", fontFamily: "'Sora', sans-serif", padding: "12px", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "clamp(22px, 4vw, 26px)" }}>Bulk SMS</h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: "14px" }}>Send announcements to parent phone numbers.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type message to send to parents..."
            rows={6}
            style={{ width: '100%', padding: 12, borderRadius: 8, background: '#0b1220', color: '#e6eef8', border: '1px solid #233046', boxSizing: 'border-box', outline: 'none', fontSize: '14px' }}
          />

          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>Send to all parents</span>
            </label>

            <button onClick={send} disabled={isSending} style={{ marginLeft: 'auto', background: '#3b82f6', color: '#fff', padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px', width: '100%', smWidth: 'auto' }}>
              {isSending ? 'Sending...' : 'Send SMS'}
            </button>
          </div>

          {result && <div style={{ marginTop: 12, color: '#cbd5e1', fontSize: '14px', wordBreak: 'break-word' }}>{result}</div>}
        </div>

        <div style={{ flex: '1 1 280px', maxWidth: '100%', borderTop: '1px solid #1e293b', paddingTop: 16 }}>
          <div style={{ marginBottom: 8, color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>Select recipients</div>
          <div style={{ maxHeight: 440, overflow: 'auto', background: '#0b1220', border: '1px solid #233046', borderRadius: 8, padding: 8, WebkitOverflowScrolling: 'touch' }}>
            {parents.map(p => (
              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', cursor: 'pointer', borderBottom: '1px solid #1e293b' }}>
                <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.user?.name ?? '—'}</span>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>{p.phone ?? 'No phone'}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}