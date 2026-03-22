// // 'use client';

// // import { useEffect, useState, useCallback } from 'react';
// // import { useSearchParams, useRouter } from 'next/navigation';
// // import { ExternalLink, RefreshCw, Mail, Globe, ChevronDown, Filter, Search, X } from 'lucide-react';
// // import { formatDistanceToNow } from 'date-fns';
// // import toast from 'react-hot-toast';

// // const STATUSES = [
// //   { value: 'all', label: 'All Jobs' },
// //   { value: 'needs_manual_apply', label: '⚡ Action Needed' },
// //   { value: 'found', label: 'Found' },
// //   { value: 'applied', label: 'Applied' },
// //   { value: 'email_sent', label: 'Email Sent' },
// //   { value: 'interview', label: 'Interview' },
// //   { value: 'offer', label: 'Offer' },
// //   { value: 'rejected', label: 'Rejected' },
// // ];

// // const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
// //   found: { label: 'Found', color: '#60a5fa', bg: 'rgba(59,130,246,0.12)' },
// //   reviewing: { label: 'Reviewing', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
// //   applied: { label: 'Applied', color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
// //   email_sent: { label: 'Email Sent', color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
// //   needs_manual_apply: { label: 'Needs Action', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
// //   interview: { label: 'Interview 🎯', color: '#a78bfa', bg: 'rgba(139,92,246,0.12)' },
// //   offer: { label: 'Offer 🎉', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
// //   rejected: { label: 'Rejected', color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
// // };

// // const SOURCE_LABELS: Record<string, string> = {
// //   linkedin: 'LinkedIn',
// //   indeed: 'Indeed',
// //   weworkremotely: 'We Work Remotely',
// //   glassdoor: 'Glassdoor',
// //   remotive: 'Remotive',
// //   company_site: 'Company Site',
// //   remote_co: 'Remote.co',
// // };

// // function JobCard({ job, onStatusChange, onGenerateCoverLetter }: {
// //   job: any;
// //   onStatusChange: (id: string, status: string) => void;
// //   onGenerateCoverLetter: (jobId: string) => void;
// // }) {
// //   const [expanded, setExpanded] = useState(false);
// //   const [applying, setApplying] = useState(false);
// //   const st = STATUS_META[job.status] || STATUS_META.found;

// //   async function handleApplyEmail() {
// //     if (!job.cover_letters?.[0]) {
// //       toast.error('Generating cover letter first...');
// //       await onGenerateCoverLetter(job.id);
// //       return;
// //     }
// //     setApplying(true);
// //     try {
// //       const res = await fetch('/api/apply', {
// //         method: 'POST',
// //         headers: { 'content-type': 'application/json' },
// //         body: JSON.stringify({ job_id: job.id, cover_letter_id: job.cover_letters[0].id })
// //       });
// //       const data = await res.json();
// //       if (data.success) {
// //         toast.success('Application sent! ✉');
// //         onStatusChange(job.id, 'applied');
// //       } else {
// //         toast.error(data.error || 'Failed to send application');
// //       }
// //     } finally {
// //       setApplying(false);
// //     }
// //   }

// //   return (
// //     <div style={{
// //       background: 'var(--bg-card)',
// //       border: `1px solid ${expanded ? 'var(--border-light)' : 'var(--border)'}`,
// //       borderRadius: 12,
// //       overflow: 'hidden',
// //       transition: 'all 0.2s',
// //       marginBottom: 10
// //     }}>
// //       {/* Job header row */}
// //       <div
// //         style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
// //         onClick={() => setExpanded(!expanded)}
// //       >
// //         {/* Company avatar */}
// //         <div style={{
// //           width: 44, height: 44, borderRadius: 10,
// //           background: 'linear-gradient(135deg, #1e3a5f, #1e40af)',
// //           border: '1px solid rgba(59,130,246,0.2)',
// //           display: 'flex', alignItems: 'center', justifyContent: 'center',
// //           fontWeight: 800, fontSize: 14, color: '#93c5fd', flexShrink: 0
// //         }}>
// //           {job.company.slice(0, 2).toUpperCase()}
// //         </div>

// //         {/* Title & company */}
// //         <div style={{ flex: 1, minWidth: 0 }}>
// //           <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
// //             {job.title}
// //           </p>
// //           <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
// //             {job.company} · {job.location}
// //           </p>
// //         </div>

// //         {/* Meta */}
// //         <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
// //           {/* Match score */}
// //           <div style={{
// //             fontSize: 13, fontWeight: 700,
// //             color: job.match_score >= 80 ? '#34d399' : job.match_score >= 60 ? '#fbbf24' : '#f87171',
// //             background: job.match_score >= 80 ? 'rgba(16,185,129,0.1)' : job.match_score >= 60 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
// //             padding: '3px 8px', borderRadius: 6
// //           }}>
// //             {job.match_score}%
// //           </div>

// //           {/* Source badge */}
// //           <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 6 }}>
// //             {SOURCE_LABELS[job.source] || job.source}
// //           </span>

// //           {/* Status */}
// //           <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
// //             {st.label}
// //           </span>

// //           {/* Time */}
// //           <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
// //             {formatDistanceToNow(new Date(job.found_at), { addSuffix: true })}
// //           </span>

// //           <ChevronDown size={16} color="var(--text-muted)" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
// //         </div>
// //       </div>

// //       {/* Expanded detail */}
// //       {expanded && (
// //         <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
// //           {/* Match reasons */}
// //           {job.match_reasons?.length > 0 && (
// //             <div style={{ marginTop: 14, marginBottom: 14 }}>
// //               <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Why it matches you</p>
// //               <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
// //                 {job.match_reasons.map((r: string, i: number) => (
// //                   <span key={i} style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#93c5fd', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>
// //                     ✓ {r}
// //                   </span>
// //                 ))}
// //               </div>
// //             </div>
// //           )}

// //           {/* Requirements */}
// //           {job.requirements?.length > 0 && (
// //             <div style={{ marginBottom: 14 }}>
// //               <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Requirements</p>
// //               <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
// //                 {job.requirements.slice(0, 8).map((r: string, i: number) => (
// //                   <span key={i} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', padding: '3px 8px', borderRadius: 6, fontSize: 12 }}>
// //                     {r}
// //                   </span>
// //                 ))}
// //               </div>
// //             </div>
// //           )}

// //           {/* Description preview */}
// //           <div style={{ marginBottom: 16 }}>
// //             <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
// //               {job.description?.slice(0, 300)}{job.description?.length > 300 ? '...' : ''}
// //             </p>
// //           </div>

// //           {/* Cover letter preview */}
// //           {job.cover_letters?.[0] && (
// //             <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
// //               <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
// //                 Cover Letter — {job.cover_letters[0].subject_line}
// //               </p>
// //               <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
// //                 {job.cover_letters[0].content.slice(0, 200)}...
// //               </p>
// //             </div>
// //           )}

// //           {/* Actions */}
// //           <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
// //             <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
// //               style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #1e40af, #1d4ed8)', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
// //               <Globe size={14} /> View Job
// //             </a>

// //             {(job.status === 'found' || job.status === 'needs_manual_apply') && job.apply_email && (
// //               <button onClick={handleApplyEmail} disabled={applying}
// //                 style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
// //                 <Mail size={14} />{applying ? 'Sending...' : 'Send Application Email'}
// //               </button>
// //             )}

// //             {!job.cover_letters?.[0] && (
// //               <button onClick={() => onGenerateCoverLetter(job.id)}
// //                 style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
// //                 Generate Cover Letter
// //               </button>
// //             )}

// //             {/* Status updater */}
// //             <select
// //               value={job.status}
// //               onChange={e => onStatusChange(job.id, e.target.value)}
// //               style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', padding: '8px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
// //               {Object.entries(STATUS_META).map(([val, meta]) => (
// //                 <option key={val} value={val}>{meta.label}</option>
// //               ))}
// //             </select>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // export default function JobsPage() {
// //   const searchParams = useSearchParams();
// //   const router = useRouter();
// //   const [jobs, setJobs] = useState<any[]>([]);
// //   const [total, setTotal] = useState(0);
// //   const [loading, setLoading] = useState(true);
// //   const [page, setPage] = useState(1);
// //   const [search, setSearch] = useState('');

// //   const statusFilter = searchParams.get('status') || 'all';

// //   const fetchJobs = useCallback(async () => {
// //     setLoading(true);
// //     const params = new URLSearchParams({ page: String(page), limit: '20' });
// //     if (statusFilter !== 'all') params.set('status', statusFilter);
// //     const res = await fetch(`/api/jobs?${params}`);
// //     const data = await res.json();
// //     setJobs(data.jobs || []);
// //     setTotal(data.total || 0);
// //     setLoading(false);
// //   }, [statusFilter, page]);

// //   useEffect(() => { fetchJobs(); }, [fetchJobs]);

// //   async function handleStatusChange(id: string, status: string) {
// //     await fetch(`/api/jobs/${id}`, {
// //       method: 'PATCH',
// //       headers: { 'content-type': 'application/json' },
// //       body: JSON.stringify({ status })
// //     });
// //     toast.success('Status updated');
// //     fetchJobs();
// //   }

// //   async function handleGenerateCoverLetter(jobId: string) {
// //     const toastId = toast.loading('Generating cover letter with AI...');
// //     const res = await fetch('/api/cover-letter', {
// //       method: 'POST',
// //       headers: { 'content-type': 'application/json' },
// //       body: JSON.stringify({ job_id: jobId })
// //     });
// //     const data = await res.json();
// //     toast.dismiss(toastId);
// //     if (data.id) {
// //       toast.success('Cover letter generated!');
// //       fetchJobs();
// //     } else {
// //       toast.error('Failed to generate cover letter');
// //     }
// //   }

// //   const filtered = search
// //     ? jobs.filter(j =>
// //         j.title.toLowerCase().includes(search.toLowerCase()) ||
// //         j.company.toLowerCase().includes(search.toLowerCase())
// //       )
// //     : jobs;

// //   return (
// //     <div style={{ padding: '32px 36px' }}>

// //       {/* Header */}
// //       <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
// //         <div>
// //           <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Jobs</h1>
// //           <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{total} total jobs found by the AI agent</p>
// //         </div>
// //       </div>

// //       {/* Tabs */}
// //       <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0, overflowX: 'auto' }}>
// //         {STATUSES.map(s => {
// //           const active = statusFilter === s.value;
// //           return (
// //             <button key={s.value} onClick={() => router.push(`/dashboard/jobs${s.value !== 'all' ? `?status=${s.value}` : ''}`)}
// //               style={{
// //                 background: 'none', border: 'none', cursor: 'pointer',
// //                 padding: '8px 14px', fontSize: 13, fontWeight: active ? 700 : 500,
// //                 color: active ? 'var(--accent-bright)' : 'var(--text-muted)',
// //                 borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
// //                 whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)',
// //                 transition: 'all 0.15s', marginBottom: -1
// //               }}>
// //               {s.label}
// //             </button>
// //           );
// //         })}
// //       </div>

// //       {/* Search */}
// //       <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
// //         <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
// //         <input
// //           className="input-field"
// //           style={{ paddingLeft: 36 }}
// //           placeholder="Search jobs or companies..."
// //           value={search}
// //           onChange={e => setSearch(e.target.value)}
// //         />
// //         {search && (
// //           <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
// //             <X size={14} color="var(--text-muted)" />
// //           </button>
// //         )}
// //       </div>

// //       {/* Jobs list */}
// //       {loading ? (
// //         <div>{Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12, marginBottom: 10 }} />)}</div>
// //       ) : filtered.length === 0 ? (
// //         <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
// //           <Filter size={36} style={{ margin: '0 auto 12px', opacity: 0.25 }} />
// //           <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>No jobs found</p>
// //           <p style={{ fontSize: 13 }}>Try a different filter or click "Scan Now" to search for new jobs</p>
// //         </div>
// //       ) : (
// //         <>
// //           {filtered.map(job => (
// //             <JobCard key={job.id} job={job} onStatusChange={handleStatusChange} onGenerateCoverLetter={handleGenerateCoverLetter} />
// //           ))}

// //           {/* Pagination */}
// //           {total > 20 && (
// //             <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
// //               <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost">← Prev</button>
// //               <span style={{ color: 'var(--text-muted)', fontSize: 14, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
// //                 Page {page} of {Math.ceil(total / 20)}
// //               </span>
// //               <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)} className="btn-ghost">Next →</button>
// //             </div>
// //           )}
// //         </>
// //       )}
// //     </div>
// //   );
// // }






// 'use client';

// import { Suspense, useEffect, useState, useCallback } from 'react';
// import { useSearchParams, useRouter } from 'next/navigation';
// import { Mail, Globe, ChevronDown, Filter, Search, X } from 'lucide-react';
// import { formatDistanceToNow } from 'date-fns';
// import toast from 'react-hot-toast';

// const STATUSES = [
//   { value: 'all', label: 'All Jobs' },
//   { value: 'needs_manual_apply', label: '⚡ Action Needed' },
//   { value: 'found', label: 'Found' },
//   { value: 'applied', label: 'Applied' },
//   { value: 'email_sent', label: 'Email Sent' },
//   { value: 'interview', label: 'Interview' },
//   { value: 'offer', label: 'Offer' },
//   { value: 'rejected', label: 'Rejected' },
// ];

// const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
//   found: { label: 'Found', color: '#60a5fa', bg: 'rgba(59,130,246,0.12)' },
//   reviewing: { label: 'Reviewing', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
//   applied: { label: 'Applied', color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
//   email_sent: { label: 'Email Sent', color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
//   needs_manual_apply: { label: 'Needs Action', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
//   interview: { label: 'Interview 🎯', color: '#a78bfa', bg: 'rgba(139,92,246,0.12)' },
//   offer: { label: 'Offer 🎉', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
//   rejected: { label: 'Rejected', color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
// };

// const SOURCE_LABELS: Record<string, string> = {
//   linkedin: 'LinkedIn',
//   indeed: 'Indeed',
//   weworkremotely: 'We Work Remotely',
//   glassdoor: 'Glassdoor',
//   remotive: 'Remotive',
//   jobicy: 'Jobicy',
//   remoteok: 'RemoteOK',
//   adzuna: 'Adzuna',
//   company_site: 'Company Site',
// };

// function JobCard({ job, onStatusChange, onGenerateCoverLetter }: {
//   job: any;
//   onStatusChange: (id: string, status: string) => void;
//   onGenerateCoverLetter: (jobId: string) => void;
// }) {
//   const [expanded, setExpanded] = useState(false);
//   const [applying, setApplying] = useState(false);
//   const st = STATUS_META[job.status] || STATUS_META.found;

//   async function handleApplyEmail() {
//     if (!job.cover_letters?.[0]) {
//       toast.error('No cover letter yet — generating...');
//       onGenerateCoverLetter(job.id);
//       return;
//     }
//     setApplying(true);
//     try {
//       const res = await fetch('/api/apply', {
//         method: 'POST',
//         headers: { 'content-type': 'application/json' },
//         body: JSON.stringify({ job_id: job.id, cover_letter_id: job.cover_letters[0].id })
//       });
//       const data = await res.json();
//       if (data.success) {
//         toast.success('Application sent! ✉');
//         onStatusChange(job.id, 'applied');
//       } else {
//         toast.error(data.error || 'Failed to send');
//       }
//     } finally {
//       setApplying(false);
//     }
//   }

//   return (
//     <div style={{
//       background: 'var(--bg-card)',
//       border: `1px solid ${expanded ? 'var(--border-light)' : 'var(--border)'}`,
//       borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s', marginBottom: 10
//     }}>
//       {/* Header row */}
//       <div style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
//         onClick={() => setExpanded(!expanded)}>
//         <div style={{
//           width: 44, height: 44, borderRadius: 10, flexShrink: 0,
//           background: 'linear-gradient(135deg, #1e3a5f, #1e40af)',
//           border: '1px solid rgba(59,130,246,0.2)',
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//           fontWeight: 800, fontSize: 14, color: '#93c5fd'
//         }}>
//           {job.company.slice(0, 2).toUpperCase()}
//         </div>

//         <div style={{ flex: 1, minWidth: 0 }}>
//           <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
//             {job.title}
//           </p>
//           <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
//             {job.company} · {job.location}
//           </p>
//         </div>

//         <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
//           <div style={{
//             fontSize: 13, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
//             color: job.match_score >= 80 ? '#34d399' : job.match_score >= 60 ? '#fbbf24' : '#f87171',
//             background: job.match_score >= 80 ? 'rgba(16,185,129,0.1)' : job.match_score >= 60 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
//           }}>
//             {job.match_score}%
//           </div>
//           <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 6 }}>
//             {SOURCE_LABELS[job.source] || job.source}
//           </span>
//           <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
//             {st.label}
//           </span>
//           <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
//             {formatDistanceToNow(new Date(job.found_at), { addSuffix: true })}
//           </span>
//           <ChevronDown size={16} color="var(--text-muted)"
//             style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
//         </div>
//       </div>

//       {/* Expanded detail */}
//       {expanded && (
//         <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>

//           {job.match_reasons?.length > 0 && (
//             <div style={{ marginTop: 14, marginBottom: 14 }}>
//               <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Why it matches you</p>
//               <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
//                 {job.match_reasons.map((r: string, i: number) => (
//                   <span key={i} style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#93c5fd', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>
//                     ✓ {r}
//                   </span>
//                 ))}
//               </div>
//             </div>
//           )}

//           {job.requirements?.length > 0 && (
//             <div style={{ marginBottom: 14 }}>
//               <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Requirements</p>
//               <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
//                 {job.requirements.slice(0, 10).map((r: string, i: number) => (
//                   <span key={i} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', padding: '3px 8px', borderRadius: 6, fontSize: 12 }}>
//                     {r}
//                   </span>
//                 ))}
//               </div>
//             </div>
//           )}

//           <div style={{ marginBottom: 16 }}>
//             <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
//               {job.description?.slice(0, 400)}{job.description?.length > 400 ? '...' : ''}
//             </p>
//           </div>

//           {job.cover_letters?.[0] && (
//             <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
//               <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
//                 Cover Letter
//               </p>
//               <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
//                 {job.cover_letters[0].content.slice(0, 300)}...
//               </p>
//             </div>
//           )}

//           <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
//             <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
//               style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #1e40af, #1d4ed8)', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
//               <Globe size={14} /> View Job
//             </a>

//             {job.apply_email && (job.status === 'found' || job.status === 'needs_manual_apply') && (
//               <button onClick={handleApplyEmail} disabled={applying}
//                 style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
//                 <Mail size={14} />{applying ? 'Sending...' : 'Send Application Email'}
//               </button>
//             )}

//             {!job.cover_letters?.[0] && (
//               <button onClick={() => onGenerateCoverLetter(job.id)}
//                 style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
//                 Generate Cover Letter
//               </button>
//             )}

//             <select value={job.status} onChange={e => onStatusChange(job.id, e.target.value)}
//               style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', padding: '8px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
//               {Object.entries(STATUS_META).map(([val, meta]) => (
//                 <option key={val} value={val}>{meta.label}</option>
//               ))}
//             </select>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // Inner component that uses useSearchParams — must be inside Suspense
// function JobsInner() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const [jobs, setJobs] = useState<any[]>([]);
//   const [total, setTotal] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(1);
//   const [search, setSearch] = useState('');

//   const statusFilter = searchParams.get('status') || 'all';

//   const fetchJobs = useCallback(async () => {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams({ page: String(page), limit: '20' });
//       if (statusFilter !== 'all') params.set('status', statusFilter);
//       const res = await fetch(`/api/jobs?${params}`);
//       const data = await res.json();
//       setJobs(data.jobs || []);
//       setTotal(data.total || 0);
//     } catch (e) {
//       toast.error('Failed to load jobs');
//     } finally {
//       setLoading(false);
//     }
//   }, [statusFilter, page]);

//   useEffect(() => { fetchJobs(); }, [fetchJobs]);

//   async function handleStatusChange(id: string, status: string) {
//     await fetch(`/api/jobs/${id}`, {
//       method: 'PATCH',
//       headers: { 'content-type': 'application/json' },
//       body: JSON.stringify({ status })
//     });
//     toast.success('Status updated');
//     fetchJobs();
//   }

//   async function handleGenerateCoverLetter(jobId: string) {
//     const toastId = toast.loading('Generating cover letter...');
//     const res = await fetch('/api/cover-letter', {
//       method: 'POST',
//       headers: { 'content-type': 'application/json' },
//       body: JSON.stringify({ job_id: jobId })
//     });
//     const data = await res.json();
//     toast.dismiss(toastId);
//     if (data.id) { toast.success('Cover letter generated!'); fetchJobs(); }
//     else toast.error('Failed to generate');
//   }

//   const filtered = search
//     ? jobs.filter(j =>
//         j.title.toLowerCase().includes(search.toLowerCase()) ||
//         j.company.toLowerCase().includes(search.toLowerCase())
//       )
//     : jobs;

//   return (
//     <div style={{ padding: '32px 36px' }}>
//       <div style={{ marginBottom: 24 }}>
//         <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Jobs</h1>
//         <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{total} total jobs found by the AI agent</p>
//       </div>

//       {/* Status tabs */}
//       <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
//         {STATUSES.map(s => {
//           const active = statusFilter === s.value;
//           return (
//             <button key={s.value}
//               onClick={() => router.push(`/dashboard/jobs${s.value !== 'all' ? `?status=${s.value}` : ''}`)}
//               style={{
//                 background: 'none', border: 'none', cursor: 'pointer',
//                 padding: '8px 14px', fontSize: 13,
//                 fontWeight: active ? 700 : 500,
//                 color: active ? 'var(--accent-bright)' : 'var(--text-muted)',
//                 borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
//                 whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)',
//                 transition: 'all 0.15s', marginBottom: -1
//               }}>
//               {s.label}
//             </button>
//           );
//         })}
//       </div>

//       {/* Search */}
//       <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
//         <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
//         <input className="input-field" style={{ paddingLeft: 36 }}
//           placeholder="Search jobs or companies..."
//           value={search} onChange={e => setSearch(e.target.value)} />
//         {search && (
//           <button onClick={() => setSearch('')}
//             style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
//             <X size={14} color="var(--text-muted)" />
//           </button>
//         )}
//       </div>

//       {/* List */}
//       {loading ? (
//         <div>{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12, marginBottom: 10 }} />)}</div>
//       ) : filtered.length === 0 ? (
//         <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
//           <Filter size={36} style={{ margin: '0 auto 12px', opacity: 0.25 }} />
//           <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>No jobs found</p>
//           <p style={{ fontSize: 13 }}>Try a different filter or click "Scan Now" in the sidebar</p>
//         </div>
//       ) : (
//         <>
//           {filtered.map(job => (
//             <JobCard key={job.id} job={job}
//               onStatusChange={handleStatusChange}
//               onGenerateCoverLetter={handleGenerateCoverLetter} />
//           ))}
//           {total > 20 && (
//             <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
//               <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost">← Prev</button>
//               <span style={{ color: 'var(--text-muted)', fontSize: 14, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
//                 Page {page} of {Math.ceil(total / 20)}
//               </span>
//               <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)} className="btn-ghost">Next →</button>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// }

// // Outer component wraps in Suspense — required for useSearchParams in Next.js 14
// export default function JobsPage() {
//   return (
//     <Suspense fallback={
//       <div style={{ padding: 36 }}>
//         {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12, marginBottom: 10 }} />)}
//       </div>
//     }>
//       <JobsInner />
//     </Suspense>
//   );
// }








'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, Globe, ChevronDown, Filter, Search, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const STATUSES = [
  { value: 'all', label: 'All Jobs' },
  { value: 'needs_manual_apply', label: '⚡ Action Needed' },
  { value: 'found', label: 'Found' },
  { value: 'applied', label: 'Applied' },
  { value: 'email_sent', label: 'Email Sent' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  found: { label: 'Found', color: '#60a5fa', bg: 'rgba(59,130,246,0.12)' },
  reviewing: { label: 'Reviewing', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
  applied: { label: 'Applied', color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
  email_sent: { label: 'Email Sent', color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
  needs_manual_apply: { label: 'Needs Action', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
  interview: { label: 'Interview 🎯', color: '#a78bfa', bg: 'rgba(139,92,246,0.12)' },
  offer: { label: 'Offer 🎉', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  rejected: { label: 'Rejected', color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
};

const SOURCE_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  weworkremotely: 'We Work Remotely',
  glassdoor: 'Glassdoor',
  remotive: 'Remotive',
  jobicy: 'Jobicy',
  remoteok: 'RemoteOK',
  adzuna: 'Adzuna',
  company_site: 'Company Site',
};

function JobCard({ job, onStatusChange, onGenerateCoverLetter }: {
  job: any;
  onStatusChange: (id: string, status: string) => void;
  onGenerateCoverLetter: (jobId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [applying, setApplying] = useState(false);
  const st = STATUS_META[job.status] || STATUS_META.found;

  async function handleApplyEmail() {
    if (!job.cover_letters?.[0]) {
      toast.error('No cover letter yet — generating...');
      onGenerateCoverLetter(job.id);
      return;
    }
    setApplying(true);
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ job_id: job.id, cover_letter_id: job.cover_letters[0].id })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Application sent! ✉');
        onStatusChange(job.id, 'applied');
      } else {
        toast.error(data.error || 'Failed to send');
      }
    } finally {
      setApplying(false);
    }
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${expanded ? 'var(--border-light)' : 'var(--border)'}`,
      borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s', marginBottom: 10
    }}>
      {/* Header row */}
      <div style={{ padding: 'clamp(12px, 2vw, 18px)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
        onClick={() => setExpanded(!expanded)}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #1e3a5f, #1e40af)',
          border: '1px solid rgba(59,130,246,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 14, color: '#93c5fd'
        }}>
          {job.company.slice(0, 2).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {job.title}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {job.company} · {job.location}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{
            fontSize: 13, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
            color: job.match_score >= 80 ? '#34d399' : job.match_score >= 60 ? '#fbbf24' : '#f87171',
            background: job.match_score >= 80 ? 'rgba(16,185,129,0.1)' : job.match_score >= 60 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
          }}>
            {job.match_score}%
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 6 }}>
            {SOURCE_LABELS[job.source] || job.source}
          </span>
          <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
            {st.label}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {formatDistanceToNow(new Date(job.found_at), { addSuffix: true })}
          </span>
          <ChevronDown size={16} color="var(--text-muted)"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>

          {job.match_reasons?.length > 0 && (
            <div style={{ marginTop: 14, marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Why it matches you</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {job.match_reasons.map((r: string, i: number) => (
                  <span key={i} style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#93c5fd', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>
                    ✓ {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {job.requirements?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Requirements</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {job.requirements.slice(0, 10).map((r: string, i: number) => (
                  <span key={i} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', padding: '3px 8px', borderRadius: 6, fontSize: 12 }}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {job.description?.slice(0, 400)}{job.description?.length > 400 ? '...' : ''}
            </p>
          </div>

          {job.cover_letters?.[0] && (
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Cover Letter
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {job.cover_letters[0].content.slice(0, 300)}...
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #1e40af, #1d4ed8)', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              <Globe size={14} /> View Job
            </a>

            {job.apply_email && (job.status === 'found' || job.status === 'needs_manual_apply') && (
              <button onClick={handleApplyEmail} disabled={applying}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                <Mail size={14} />{applying ? 'Sending...' : 'Send Application Email'}
              </button>
            )}

            {!job.cover_letters?.[0] && (
              <button onClick={() => onGenerateCoverLetter(job.id)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                Generate Cover Letter
              </button>
            )}

            <select value={job.status} onChange={e => onStatusChange(job.id, e.target.value)}
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', padding: '8px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              {Object.entries(STATUS_META).map(([val, meta]) => (
                <option key={val} value={val}>{meta.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// Inner component that uses useSearchParams — must be inside Suspense
function JobsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const statusFilter = searchParams.get('status') || 'all';

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
    } catch (e) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status })
    });
    toast.success('Status updated');
    fetchJobs();
  }

  async function handleGenerateCoverLetter(jobId: string) {
    const toastId = toast.loading('Generating cover letter...');
    const res = await fetch('/api/cover-letter', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ job_id: jobId })
    });
    const data = await res.json();
    toast.dismiss(toastId);
    if (data.id) { toast.success('Cover letter generated!'); fetchJobs(); }
    else toast.error('Failed to generate');
  }

  const filtered = search
    ? jobs.filter(j =>
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.company.toLowerCase().includes(search.toLowerCase())
      )
    : jobs;

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 36px)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Jobs</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{total} total jobs found by the AI agent</p>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {STATUSES.map(s => {
          const active = statusFilter === s.value;
          return (
            <button key={s.value}
              onClick={() => router.push(`/dashboard/jobs${s.value !== 'all' ? `?status=${s.value}` : ''}`)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 14px', fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? 'var(--accent-bright)' : 'var(--text-muted)',
                borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s', marginBottom: -1
              }}>
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input className="input-field" style={{ paddingLeft: 36 }}
          placeholder="Search jobs or companies..."
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && (
          <button onClick={() => setSearch('')}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={14} color="var(--text-muted)" />
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div>{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12, marginBottom: 10 }} />)}</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Filter size={36} style={{ margin: '0 auto 12px', opacity: 0.25 }} />
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>No jobs found</p>
          <p style={{ fontSize: 13 }}>Try a different filter or click "Scan Now" in the sidebar</p>
        </div>
      ) : (
        <>
          {filtered.map(job => (
            <JobCard key={job.id} job={job}
              onStatusChange={handleStatusChange}
              onGenerateCoverLetter={handleGenerateCoverLetter} />
          ))}
          {total > 20 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost">← Prev</button>
              <span style={{ color: 'var(--text-muted)', fontSize: 14, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)} className="btn-ghost">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Outer component wraps in Suspense — required for useSearchParams in Next.js 14
export default function JobsPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: 36 }}>
        {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12, marginBottom: 10 }} />)}
      </div>
    }>
      <JobsInner />
    </Suspense>
  );
}