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
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(
    loaderError ? { type: 'error', text: loaderError } : null
  );

  // Derive "Select All" state dynamically so it never falls out of sync
  const isAllSelected = parents.length > 0 && selected.length === parents.length;

  const toggle = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelected([]);
    } else {
      setSelected(parents.map(p => p.id));
    }
  };

  const send = async () => {
    if (!message.trim()) return setResult({ type: 'error', text: "Please enter a message." });
    if (selected.length === 0 && !isAllSelected) return setResult({ type: 'error', text: "Please select at least one recipient." });
    
    setIsSending(true);
    setResult(null);

    try {
      const payload: any = { message };
      if (isAllSelected) {
        payload.send_to_all = true;
      } else {
        payload.parent_ids = selected;
      }

      console.log('Sending SMS payload:', payload);
      const res = await api.parents.bulkSms(payload);
      console.log('SMS response:', res);
      
      const count = res?.data?.results?.length ?? selected.length;
      setResult({ type: 'success', text: `✓ Successfully queued ${count} SMS messages.` });
      setMessage("");
      setSelected([]);
    } catch (err: unknown) {
      const errMsg = (err as any)?.message || (err as any)?.response?.data?.message || JSON.stringify(err);
      console.error('SMS send error:', errMsg, err);
      setResult({ type: 'error', text: `✗ Error: ${errMsg}` });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ color: "#f8fafc", fontFamily: "'Sora', sans-serif", padding: "24px", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24, borderBottom: '1px solid #1e293b', paddingBottom: 16 }}>
        <h1 style={{ margin: "0 0 8px 0", fontSize: "clamp(24px, 4vw, 28px)", fontWeight: 600 }}>Bulk SMS</h1>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: "15px" }}>Compose and broadcast announcements to parent phone numbers.</p>
      </div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: Compose Card */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#e2e8f0' }}>Compose Message</h2>
          
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your announcement here..."
            rows={8}
            style={{ 
              width: '100%', padding: 14, borderRadius: 8, background: '#0b1220', 
              color: '#f8fafc', border: '1px solid #334155', boxSizing: 'border-box', 
              outline: 'none', fontSize: '14px', resize: 'vertical', lineHeight: '1.5'
            }}
          />
          
          {/* SMS Character Counter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 20 }}>
            <span style={{ fontSize: '12px', color: message.length > 160 ? '#fbbf24' : '#64748b' }}>
              {message.length} / 160 characters {message.length > 160 && '(Will send as multiple parts)'}
            </span>
          </div>

          <button 
            onClick={send} 
            disabled={isSending} 
            style={{ 
              width: '100%', background: isSending ? '#1d4ed8' : '#2563eb', color: '#fff', 
              padding: '12px 16px', borderRadius: 8, border: 'none', cursor: isSending ? 'not-allowed' : 'pointer', 
              fontWeight: 600, fontSize: '15px', transition: 'background 0.2s',
              opacity: isSending ? 0.8 : 1
            }}
          >
            {isSending ? 'Sending messages...' : `Send SMS to ${selected.length} recipient${selected.length !== 1 ? 's' : ''}`}
          </button>

          {/* Status Result Box */}
          {result && (
            <div style={{ 
              marginTop: 16, padding: '12px 16px', borderRadius: 8, fontSize: '14px', wordBreak: 'break-word',
              background: result.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${result.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              color: result.type === 'success' ? '#4ade80' : '#f87171'
            }}>
              {result.text}
            </div>
          )}
        </div>

        {/* Right Column: Recipients Card */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', maxHeight: '600px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#e2e8f0' }}>
              Recipients <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 400 }}>({selected.length} selected)</span>
            </h2>
            
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', background: '#1e293b', padding: '6px 12px', borderRadius: 6 }}>
              <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} style={{ margin: 0, cursor: 'pointer' }} />
              <span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 500 }}>Select All</span>
            </label>
          </div>

          {/* Scrollable Parent List */}
          <div style={{ overflowY: 'auto', background: '#0b1220', border: '1px solid #1e293b', borderRadius: 8, WebkitOverflowScrolling: 'touch', flex: 1 }}>
            {parents.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                No parents found.
              </div>
            ) : (
              parents.map(p => (
                <label 
                  key={p.id} 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', 
                    cursor: 'pointer', borderBottom: '1px solid #1e293b', transition: 'background 0.2s',
                    backgroundColor: selected.includes(p.id) ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selected.includes(p.id) ? 'rgba(59, 130, 246, 0.05)' : 'transparent'}
                >
                  <input 
                    type="checkbox" 
                    checked={selected.includes(p.id)} 
                    onChange={() => toggle(p.id)} 
                    style={{ width: 16, height: 16, cursor: 'pointer' }} 
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
                    <span style={{ color: selected.includes(p.id) ? '#fff' : '#e2e8f0', fontWeight: 500, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.user?.name ?? '—'}
                    </span>
                    <span style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                      {p.phone ?? 'No phone number'}
                    </span>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}