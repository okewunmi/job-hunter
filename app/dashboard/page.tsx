'use client';

import { useEffect, useState } from 'react';
import { Briefcase, Send, Users, Trophy, AlertCircle, TrendingUp, Clock, Target } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Stats {
  total_found: number;
  total_applied: number;
  total_interviews: number;
  total_offers: number;
  needs_manual_apply: number;
  avg_match_score: number;
  this_week_found: number;
  this_week_applied: number;
  recent_jobs: any[];
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  found: { label: 'Found', color: '#60a5fa', bg: 'rgba(59,130,246,0.15)' },
  reviewing: { label: 'Reviewing', color: '#fbbf24', bg: 'rgba(245,158,11,0.15)' },
  applied: { label: 'Applied', color: '#34d399', bg: 'rgba(16,185,129,0.15)' },
  email_sent: { label: 'Applied', color: '#34d399', bg: 'rgba(16,185,129,0.15)' },
  needs_manual_apply: { label: 'Action Needed', color: '#fbbf24', bg: 'rgba(245,158,11,0.15)' },
  interview: { label: 'Interview', color: '#a78bfa', bg: 'rgba(139,92,246,0.15)' },
  offer: { label: 'Offer! 🎉', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  rejected: { label: 'Rejected', color: '#f87171', bg: 'rgba(239,68,68,0.15)' },
};

function StatCard({ icon: Icon, label, value, sub, color, href }: any) {
  const inner = (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '20px',
      transition: 'all 0.2s',
      cursor: href ? 'pointer' : 'default',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={e => { if (href) { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}}
    onMouseLeave={e => { if (href) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at 80% 20%, ${color}18, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</p>}
        </div>
        <div style={{ background: `${color}20`, border: `1px solid ${color}30`, borderRadius: 10, padding: 10 }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/jobs')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200 }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 4 }}>{greeting}, Afeez 👋</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          Your Job Hunt Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
          AI is searching for React Native & Frontend roles across LinkedIn, Indeed, We Work Remotely, and more.
        </p>
      </div>

      {/* ── Action needed banner ──────────────────────────────────── */}
      {stats && stats.needs_manual_apply > 0 && (
        <Link href="/dashboard/jobs?status=needs_manual_apply" style={{ textDecoration: 'none' }}>
          <div className="animate-fade-up" style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <AlertCircle size={16} color="#fbbf24" />
            <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: 14 }}>
              {stats.needs_manual_apply} job{stats.needs_manual_apply > 1 ? 's' : ''} need your manual application — click to view →
            </span>
          </div>
        </Link>
      )}

      {/* ── Stats grid ────────────────────────────────────────────── */}
      <div className="animate-fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />
          ))
        ) : (
          <>
            <StatCard icon={Briefcase} label="Total Jobs Found" value={stats?.total_found || 0}
              sub={`+${stats?.this_week_found || 0} this week`} color="#3b82f6" href="/dashboard/jobs" />
            <StatCard icon={Send} label="Applications Sent" value={stats?.total_applied || 0}
              sub={`+${stats?.this_week_applied || 0} this week`} color="#10b981" href="/dashboard/jobs?status=applied" />
            <StatCard icon={Users} label="Interviews" value={stats?.total_interviews || 0}
              sub="Keep going!" color="#8b5cf6" href="/dashboard/jobs?status=interview" />
            <StatCard icon={Target} label="Avg Match Score" value={`${stats?.avg_match_score || 0}%`}
              sub="AI-rated compatibility" color="#f59e0b" />
          </>
        )}
      </div>

      {/* ── Secondary stats ───────────────────────────────────────── */}
      <div className="animate-fade-up-delay" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard icon={AlertCircle} label="Needs Your Action" value={stats?.needs_manual_apply || 0}
          sub="Manual apply required" color="#f59e0b" href="/dashboard/jobs?status=needs_manual_apply" />
        <StatCard icon={Trophy} label="Offers Received" value={stats?.total_offers || 0}
          sub="🎯 Getting closer!" color="#fbbf24" href="/dashboard/jobs?status=offer" />
        <StatCard icon={TrendingUp} label="Success Rate" 
          value={stats && stats.total_applied > 0 ? `${Math.round((stats.total_interviews / stats.total_applied) * 100)}%` : '—'}
          sub="Interview conversion" color="#10b981" />
      </div>

      {/* ── Recent Jobs ───────────────────────────────────────────── */}
      <div className="animate-fade-up-delay" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="var(--text-secondary)" />
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Recent Jobs Found</span>
          </div>
          <Link href="/dashboard/jobs" style={{ color: 'var(--accent-bright)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            View all →
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: 20 }}>
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8, marginBottom: 8 }} />
            ))}
          </div>
        ) : !stats?.recent_jobs?.length ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Briefcase size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>No jobs found yet</p>
            <p style={{ fontSize: 13 }}>Click "Scan Now" in the sidebar to start searching</p>
          </div>
        ) : (
          <div>
            {stats.recent_jobs.map((job: any, i: number) => {
              const st = STATUS_LABELS[job.status] || STATUS_LABELS.found;
              return (
                <Link key={job.id} href={`/dashboard/jobs`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '14px 20px',
                    borderBottom: i < stats.recent_jobs.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 16,
                    transition: 'background 0.15s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div style={{
                      width: 40, height: 40,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 14, color: 'var(--accent-bright)',
                      flexShrink: 0
                    }}>
                      {job.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {job.title}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {job.company} · {job.location}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 700,
                        color: job.match_score >= 80 ? '#34d399' : job.match_score >= 60 ? '#fbbf24' : '#f87171'
                      }}>
                        {job.match_score}%
                      </div>
                      <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                        {st.label}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {formatDistanceToNow(new Date(job.found_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
