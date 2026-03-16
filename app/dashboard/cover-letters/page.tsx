'use client';

import { useEffect, useState } from 'react';
import { Copy, RefreshCw, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function CoverLettersPage() {
  const [cls, setCls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/cover-letter');
    const data = await res.json();
    setCls(data.cover_letters || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function regenerate(jobId: string) {
    const id = toast.loading('Regenerating with AI...');
    const res = await fetch('/api/cover-letter', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ job_id: jobId })
    });
    const data = await res.json();
    toast.dismiss(id);
    if (data.id) { toast.success('Cover letter regenerated!'); load(); }
    else toast.error('Failed to regenerate');
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  }

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Cover Letters</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>AI-written, tailored cover letters for every job</p>
      </div>

      {loading ? (
        <div>{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12, marginBottom: 10 }} />)}</div>
      ) : cls.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>No cover letters yet</p>
          <p style={{ fontSize: 13 }}>They're auto-generated when new jobs are found</p>
        </div>
      ) : (
        cls.map(cl => {
          const open = expanded === cl.id;
          return (
            <div key={cl.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => setExpanded(open ? null : cl.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 3 }}>{cl.jobs?.title}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {cl.jobs?.company} · {cl.subject_line}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                    background: cl.jobs?.match_score >= 80 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                    color: cl.jobs?.match_score >= 80 ? '#34d399' : '#fbbf24'
                  }}>{cl.jobs?.match_score}% match</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    v{cl.version} · {formatDistanceToNow(new Date(cl.created_at), { addSuffix: true })}
                  </span>
                  <ChevronDown size={16} color="var(--text-muted)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
              </div>
              {open && (
                <div style={{ borderTop: '1px solid var(--border)', padding: 18 }}>
                  <pre style={{
                    fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)',
                    lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 14,
                    background: 'var(--bg-elevated)', padding: 16, borderRadius: 8
                  }}>{cl.content}</pre>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => copyToClipboard(cl.content)} className="btn-ghost" style={{ fontSize: 13 }}>
                      <Copy size={14} /> Copy
                    </button>
                    <button onClick={() => regenerate(cl.job_id)} className="btn-ghost" style={{ fontSize: 13 }}>
                      <RefreshCw size={14} /> Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
