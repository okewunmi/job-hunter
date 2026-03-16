// 'use client';

// import { useEffect, useState, useCallback } from 'react';
// import { useDropzone } from 'react-dropzone';
// import { Upload, Save, User, Search, Bell, FileText } from 'lucide-react';
// import toast from 'react-hot-toast';

// const SKILLS_SUGGESTIONS = [
//   'React Native', 'React.js', 'Next.js', 'TypeScript', 'JavaScript',
//   'Redux', 'Tailwind CSS', 'Firebase', 'Appwrite', 'Supabase',
//   'Node.js', 'REST APIs', 'Git', 'Figma', 'HTML5', 'CSS3', 'Expo'
// ];

// export default function SettingsPage() {
//   const [profile, setProfile] = useState<any>(null);
//   const [saving, setSaving] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [tab, setTab] = useState<'profile' | 'cv' | 'search' | 'notifications'>('profile');

//   useEffect(() => {
//     fetch('/api/jobs/profile').then(r => r.json()).then(setProfile);
//   }, []);

//   async function save() {
//     setSaving(true);
//     const res = await fetch('/api/jobs/profile', {
//       method: 'PATCH',
//       headers: { 'content-type': 'application/json' },
//       body: JSON.stringify(profile)
//     });
//     const data = await res.json();
//     setSaving(false);
//     if (data.id) toast.success('Settings saved!');
//     else toast.error(data.error || 'Save failed');
//   }

//   const onDrop = useCallback(async (files: File[]) => {
//     if (!files[0]) return;
//     setUploading(true);
//     const fd = new FormData();
//     fd.append('cv', files[0]);
//     const res = await fetch('/api/cv', { method: 'POST', body: fd });
//     const data = await res.json();
//     setUploading(false);
//     if (data.success) {
//       toast.success('CV uploaded and parsed!');
//       setProfile((p: any) => ({ ...p, cv_text: data.cv_text, cv_filename: data.filename }));
//     } else {
//       toast.error(data.error || 'Upload failed');
//     }
//   }, []);

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop, accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] }
//   });

//   function toggleSkill(skill: string) {
//     const skills = profile?.skills || [];
//     const next = skills.includes(skill) ? skills.filter((s: string) => s !== skill) : [...skills, skill];
//     setProfile((p: any) => ({ ...p, skills: next }));
//   }

//   function toggleLocation(loc: string) {
//     const locs = profile?.preferred_locations || [];
//     const next = locs.includes(loc) ? locs.filter((l: string) => l !== loc) : [...locs, loc];
//     setProfile((p: any) => ({ ...p, preferred_locations: next }));
//   }

//   const TABS = [
//     { id: 'profile', label: 'Profile', icon: User },
//     { id: 'cv', label: 'CV / Resume', icon: FileText },
//     { id: 'search', label: 'Search Config', icon: Search },
//     { id: 'notifications', label: 'Notifications', icon: Bell },
//   ];

//   if (!profile) return (
//     <div style={{ padding: 36 }}>
//       {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 10, marginBottom: 12 }} />)}
//     </div>
//   );

//   return (
//     <div style={{ padding: '32px 36px', maxWidth: 900 }}>
//       <div style={{ marginBottom: 28 }}>
//         <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Settings</h1>
//         <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Configure your job search profile and automation</p>
//       </div>

//       {/* Tabs */}
//       <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border)' }}>
//         {TABS.map(t => (
//           <button key={t.id} onClick={() => setTab(t.id as any)}
//             style={{
//               background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px',
//               fontFamily: 'var(--font-sans)', fontSize: 14,
//               fontWeight: tab === t.id ? 700 : 400,
//               color: tab === t.id ? 'var(--accent-bright)' : 'var(--text-muted)',
//               borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`,
//               display: 'flex', alignItems: 'center', gap: 6, marginBottom: -1
//             }}>
//             <t.icon size={14} />{t.label}
//           </button>
//         ))}
//       </div>

//       {/* ── Profile tab ─────────────────────────────────────────── */}
//       {tab === 'profile' && (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
//             {[
//               ['Full Name', 'full_name', 'text'],
//               ['Email', 'email', 'email'],
//               ['Phone', 'phone', 'tel'],
//               ['Location', 'location', 'text'],
//               ['Portfolio URL', 'portfolio_url', 'url'],
//               ['GitHub URL', 'github_url', 'url'],
//               ['LinkedIn URL', 'linkedin_url', 'url'],
//               ['Years of Experience', 'years_experience', 'number'],
//             ].map(([label, field, type]) => (
//               <div key={field as string}>
//                 <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>{label}</label>
//                 <input
//                   className="input-field"
//                   type={type as string}
//                   value={profile[field as string] || ''}
//                   onChange={e => setProfile((p: any) => ({ ...p, [field as string]: type === 'number' ? parseInt(e.target.value) : e.target.value }))}
//                 />
//               </div>
//             ))}
//           </div>

//           <div>
//             <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Skills</label>
//             <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
//               {SKILLS_SUGGESTIONS.map(s => (
//                 <button key={s} onClick={() => toggleSkill(s)}
//                   style={{
//                     padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
//                     background: profile.skills?.includes(s) ? 'rgba(59,130,246,0.2)' : 'var(--bg-elevated)',
//                     border: profile.skills?.includes(s) ? '1px solid rgba(59,130,246,0.4)' : '1px solid var(--border-light)',
//                     color: profile.skills?.includes(s) ? '#93c5fd' : 'var(--text-secondary)',
//                     transition: 'all 0.15s'
//                   }}>
//                   {profile.skills?.includes(s) ? '✓ ' : '+ '}{s}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <div>
//             <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Salary Range (NGN/month)</label>
//             <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
//               <input className="input-field" style={{ flex: 1 }} type="number" placeholder="300000" value={profile.salary_min || ''} onChange={e => setProfile((p: any) => ({ ...p, salary_min: parseInt(e.target.value) }))} />
//               <span style={{ color: 'var(--text-muted)' }}>–</span>
//               <input className="input-field" style={{ flex: 1 }} type="number" placeholder="600000" value={profile.salary_max || ''} onChange={e => setProfile((p: any) => ({ ...p, salary_max: parseInt(e.target.value) }))} />
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ── CV tab ──────────────────────────────────────────────── */}
//       {tab === 'cv' && (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
//           <div {...getRootProps()} style={{
//             border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border-light)'}`,
//             borderRadius: 12,
//             padding: '40px 24px',
//             textAlign: 'center',
//             cursor: 'pointer',
//             background: isDragActive ? 'var(--accent-glow)' : 'var(--bg-elevated)',
//             transition: 'all 0.2s'
//           }}>
//             <input {...getInputProps()} />
//             <Upload size={28} color={isDragActive ? 'var(--accent-bright)' : 'var(--text-muted)'} style={{ margin: '0 auto 12px' }} />
//             <p style={{ fontWeight: 700, color: uploading ? 'var(--accent-bright)' : 'var(--text-primary)', marginBottom: 6 }}>
//               {uploading ? 'Parsing your CV...' : isDragActive ? 'Drop it!' : 'Drop your CV here'}
//             </p>
//             <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>PDF, DOCX, or TXT · Max 10MB</p>
//             {profile.cv_filename && (
//               <p style={{ marginTop: 12, fontSize: 12, color: 'var(--accent-bright)', background: 'var(--accent-glow)', padding: '4px 12px', borderRadius: 99, display: 'inline-block' }}>
//                 ✓ Current: {profile.cv_filename}
//               </p>
//             )}
//           </div>

//           {profile.cv_text && (
//             <div>
//               <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 8 }}>CV Text Preview (used by AI for matching)</label>
//               <textarea
//                 className="input-field"
//                 rows={14}
//                 style={{ fontFamily: 'var(--font-mono)', fontSize: 12, resize: 'vertical' }}
//                 value={profile.cv_text}
//                 onChange={e => setProfile((p: any) => ({ ...p, cv_text: e.target.value }))}
//               />
//             </div>
//           )}
//         </div>
//       )}

//       {/* ── Search tab ──────────────────────────────────────────── */}
//       {tab === 'search' && (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
//           <div>
//             <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Preferred Locations</label>
//             <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
//               {['Remote (Worldwide)', 'Remote (Africa)', 'Lagos', 'Ibadan', 'Abuja'].map(loc => (
//                 <button key={loc} onClick={() => toggleLocation(loc)}
//                   style={{
//                     padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
//                     background: profile.preferred_locations?.includes(loc) ? 'rgba(16,185,129,0.15)' : 'var(--bg-elevated)',
//                     border: profile.preferred_locations?.includes(loc) ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border-light)',
//                     color: profile.preferred_locations?.includes(loc) ? '#34d399' : 'var(--text-secondary)',
//                     transition: 'all 0.15s'
//                   }}>
//                   {profile.preferred_locations?.includes(loc) ? '✓ ' : '+ '}{loc}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <div>
//             <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Search Interval (hours)</label>
//             <select className="input-field" style={{ maxWidth: 200 }}
//               value={profile.search_interval_hours}
//               onChange={e => setProfile((p: any) => ({ ...p, search_interval_hours: parseInt(e.target.value) }))}>
//               {[3, 6, 12, 24].map(h => <option key={h} value={h}>Every {h} hour{h > 1 ? 's' : ''}</option>)}
//             </select>
//           </div>

//           <div>
//             <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Minimum Match Score to Save (%)</label>
//             <input className="input-field" style={{ maxWidth: 200 }} type="number" min={0} max={100}
//               value={60} readOnly />
//             <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Edit via Supabase search_configs table</p>
//           </div>

//           <div>
//             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
//               <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Auto-search Active</label>
//               <div
//                 onClick={() => setProfile((p: any) => ({ ...p, search_active: !p.search_active }))}
//                 style={{
//                   width: 44, height: 24, borderRadius: 12,
//                   background: profile.search_active ? 'var(--accent)' : 'var(--bg-elevated)',
//                   border: '1px solid var(--border-light)',
//                   cursor: 'pointer', position: 'relative', transition: 'all 0.2s'
//                 }}>
//                 <div style={{
//                   width: 18, height: 18, borderRadius: 9, background: 'white',
//                   position: 'absolute', top: 2,
//                   left: profile.search_active ? 22 : 2,
//                   transition: 'left 0.2s'
//                 }} />
//               </div>
//             </div>
//             <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
//               {profile.search_active ? '🟢 AI is actively searching every ' + profile.search_interval_hours + ' hours' : '🔴 Auto-search is paused'}
//             </p>
//           </div>
//         </div>
//       )}

//       {/* ── Notifications tab ──────────────────────────────────── */}
//       {tab === 'notifications' && (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
//           <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 10, padding: 16 }}>
//             <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Email notifications go to:</p>
//             <p style={{ color: 'var(--accent-bright)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>
//               {process.env.NEXT_PUBLIC_NOTIFICATION_EMAIL || 'okewunmiafeezolaide@gmail.com'}
//             </p>
//             <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
//               Change via <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-card)', padding: '2px 6px', borderRadius: 4 }}>NOTIFICATION_EMAIL</code> in your .env.local
//             </p>
//           </div>

//           {[
//             { title: 'New jobs found', desc: 'Batch email when the AI finds new matching jobs', emoji: '🔍' },
//             { title: 'Auto-application sent', desc: 'Confirmation when an email application is sent automatically', emoji: '✉' },
//             { title: 'Manual apply needed', desc: 'Alert for jobs you need to apply to yourself (form/LinkedIn)', emoji: '👆' },
//           ].map(n => (
//             <div key={n.title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
//               <span style={{ fontSize: 24 }}>{n.emoji}</span>
//               <div style={{ flex: 1 }}>
//                 <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</p>
//                 <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{n.desc}</p>
//               </div>
//               <div style={{ width: 44, height: 24, borderRadius: 12, background: 'var(--accent)', border: '1px solid var(--border-light)', position: 'relative' }}>
//                 <div style={{ width: 18, height: 18, borderRadius: 9, background: 'white', position: 'absolute', top: 2, left: 22 }} />
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Save button */}
//       <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
//         <button onClick={save} disabled={saving} className="btn-primary" style={{ minWidth: 140 }}>
//           <Save size={15} />
//           {saving ? 'Saving...' : 'Save Changes'}
//         </button>
//       </div>
//     </div>
//   );
// }

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Save, User, Search, Bell, FileText, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const SKILLS_SUGGESTIONS = [
  'React Native', 'React.js', 'Next.js', 'TypeScript', 'JavaScript',
  'Redux', 'Tailwind CSS', 'Firebase', 'Appwrite', 'Supabase',
  'Node.js', 'REST APIs', 'Git', 'Figma', 'HTML5', 'CSS3', 'Expo'
];

// Must match ALLOWED_PROFILE_FIELDS on the server — never send extra keys to Supabase
const PROFILE_FIELDS = [
  'email', 'full_name', 'phone', 'location', 'portfolio_url',
  'github_url', 'linkedin_url', 'cv_text', 'cv_filename',
  'skills', 'years_experience', 'job_titles',
  'salary_min', 'salary_max', 'salary_currency',
  'preferred_locations', 'search_active', 'search_interval_hours',
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<'profile' | 'cv' | 'search' | 'notifications'>('profile');

  useEffect(() => {
    fetch('/api/jobs/profile').then(async r => {
      const data = await r.json();
      if (!r.ok || data.error) {
        setLoadError(data.error || 'Failed to load profile');
      } else {
        setProfile(data);
      }
    }).catch(e => setLoadError(String(e)));
  }, []);

  async function save() {
    setSaving(true);
    // Whitelist — only send known DB columns, never id/search_configs/error/etc.
    const safeBody = Object.fromEntries(
      PROFILE_FIELDS
        .filter(k => profile[k] !== undefined)
        .map(k => [k, profile[k]])
    );
    const res = await fetch('/api/jobs/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(safeBody)
    });
    const data = await res.json();
    setSaving(false);
    if (data.id) toast.success('Settings saved!');
    else toast.error(data.error || 'Save failed');
  }

  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('cv', files[0]);
    const res = await fetch('/api/cv', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.success) {
      toast.success('CV uploaded and parsed!');
      setProfile((p: any) => ({ ...p, cv_text: data.cv_text, cv_filename: data.filename }));
    } else {
      toast.error(data.error || 'Upload failed');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    }
  });

  function toggleSkill(skill: string) {
    const skills = profile?.skills || [];
    const next = skills.includes(skill) ? skills.filter((s: string) => s !== skill) : [...skills, skill];
    setProfile((p: any) => ({ ...p, skills: next }));
  }

  function toggleLocation(loc: string) {
    const locs = profile?.preferred_locations || [];
    const next = locs.includes(loc) ? locs.filter((l: string) => l !== loc) : [...locs, loc];
    setProfile((p: any) => ({ ...p, preferred_locations: next }));
  }

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'cv', label: 'CV / Resume', icon: FileText },
    { id: 'search', label: 'Search Config', icon: Search },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  // ── Error state ──────────────────────────────────────────────────────────
  if (loadError) return (
    <div style={{ padding: '32px 36px', maxWidth: 700 }}>
      <div style={{
        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
        borderRadius: 12, padding: 24
      }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <AlertTriangle size={20} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: 700, color: '#f87171', marginBottom: 4 }}>Profile not found</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{loadError}</p>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          Run this in your Supabase SQL Editor to create your profile:
        </p>
        <pre style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 8, padding: 16, fontSize: 12,
          fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)',
          overflowX: 'auto', lineHeight: 1.6, whiteSpace: 'pre-wrap'
        }}>{`INSERT INTO profiles (
  email, full_name, phone, location,
  portfolio_url, github_url, linkedin_url,
  years_experience, job_titles, skills,
  salary_min, salary_max, salary_currency,
  preferred_locations, search_active, search_interval_hours
) VALUES (
  'okewunmiafeezolaide@gmail.com',
  'Okewunmi Afeez Olaide',
  '+2348187995833',
  'Yaba, Lagos, Nigeria',
  'https://okewunmi.netlify.app',
  'https://github.com/okewunmi',
  'https://www.linkedin.com/in/okewunmi/',
  4,
  ARRAY['React Native Developer','Frontend Developer'],
  ARRAY['React Native','TypeScript','React.js','Next.js',
        'JavaScript','Redux','Tailwind CSS','Firebase',
        'Appwrite','Node.js','Git','Figma','HTML5','CSS3'],
  300000, 600000, 'NGN',
  ARRAY['Remote (Worldwide)','Remote (Africa)','Lagos','Ibadan'],
  true, 3
);`}</pre>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
          After running it, copy the UUID from the result and set{' '}
          <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-card)', padding: '2px 6px', borderRadius: 4 }}>
            PROFILE_ID=that-uuid
          </code>{' '}
          in your <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-card)', padding: '2px 6px', borderRadius: 4 }}>.env.local</code>, then restart the dev server.
        </p>
      </div>
    </div>
  );

  // ── Loading state ────────────────────────────────────────────────────────
  if (!profile) return (
    <div style={{ padding: 36 }}>
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 60, borderRadius: 10, marginBottom: 12 }} />
      ))}
    </div>
  );

  return (
    <div style={{ padding: '32px 36px', maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Configure your job search profile and automation</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px',
              fontFamily: 'var(--font-sans)', fontSize: 14,
              fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? 'var(--accent-bright)' : 'var(--text-muted)',
              borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`,
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: -1
            }}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {/* ── Profile tab ─────────────────────────────────────────── */}
      {tab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {([
              ['Full Name', 'full_name', 'text'],
              ['Email', 'email', 'email'],
              ['Phone', 'phone', 'tel'],
              ['Location', 'location', 'text'],
              ['Portfolio URL', 'portfolio_url', 'url'],
              ['GitHub URL', 'github_url', 'url'],
              ['LinkedIn URL', 'linkedin_url', 'url'],
              ['Years of Experience', 'years_experience', 'number'],
            ] as [string,string,string][]).map(([label, field, type]) => (
              <div key={field}>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>{label}</label>
                <input
                  className="input-field"
                  type={type}
                  value={profile[field] ?? ''}
                  onChange={e => setProfile((p: any) => ({
                    ...p,
                    [field]: type === 'number' ? (parseInt(e.target.value) || 0) : e.target.value
                  }))}
                />
              </div>
            ))}
          </div>

          <div>
            <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Skills</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SKILLS_SUGGESTIONS.map(s => (
                <button key={s} onClick={() => toggleSkill(s)}
                  style={{
                    padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    background: profile.skills?.includes(s) ? 'rgba(59,130,246,0.2)' : 'var(--bg-elevated)',
                    border: profile.skills?.includes(s) ? '1px solid rgba(59,130,246,0.4)' : '1px solid var(--border-light)',
                    color: profile.skills?.includes(s) ? '#93c5fd' : 'var(--text-secondary)',
                    transition: 'all 0.15s'
                  }}>
                  {profile.skills?.includes(s) ? '✓ ' : '+ '}{s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Salary Range (NGN/month)</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input className="input-field" style={{ flex: 1 }} type="number" placeholder="300000"
                value={profile.salary_min || ''}
                onChange={e => setProfile((p: any) => ({ ...p, salary_min: parseInt(e.target.value) || null }))} />
              <span style={{ color: 'var(--text-muted)' }}>–</span>
              <input className="input-field" style={{ flex: 1 }} type="number" placeholder="600000"
                value={profile.salary_max || ''}
                onChange={e => setProfile((p: any) => ({ ...p, salary_max: parseInt(e.target.value) || null }))} />
            </div>
          </div>
        </div>
      )}

      {/* ── CV tab ──────────────────────────────────────────────── */}
      {tab === 'cv' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div {...getRootProps()} style={{
            border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border-light)'}`,
            borderRadius: 12, padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
            background: isDragActive ? 'var(--accent-glow)' : 'var(--bg-elevated)', transition: 'all 0.2s'
          }}>
            <input {...getInputProps()} />
            <Upload size={28} color={isDragActive ? 'var(--accent-bright)' : 'var(--text-muted)'} style={{ margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 700, color: uploading ? 'var(--accent-bright)' : 'var(--text-primary)', marginBottom: 6 }}>
              {uploading ? 'Parsing your CV...' : isDragActive ? 'Drop it!' : 'Drop your CV here'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>PDF, DOCX, or TXT · Max 10MB</p>
            {profile.cv_filename && (
              <p style={{ marginTop: 12, fontSize: 12, color: 'var(--accent-bright)', background: 'var(--accent-glow)', padding: '4px 12px', borderRadius: 99, display: 'inline-block' }}>
                ✓ Current: {profile.cv_filename}
              </p>
            )}
          </div>
          {profile.cv_text && (
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 8 }}>CV Text (used by AI for matching)</label>
              <textarea className="input-field" rows={14}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 12, resize: 'vertical' }}
                value={profile.cv_text}
                onChange={e => setProfile((p: any) => ({ ...p, cv_text: e.target.value }))} />
            </div>
          )}
        </div>
      )}

      {/* ── Search tab ──────────────────────────────────────────── */}
      {tab === 'search' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Preferred Locations</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Remote (Worldwide)', 'Remote (Africa)', 'Lagos', 'Ibadan', 'Abuja'].map(loc => (
                <button key={loc} onClick={() => toggleLocation(loc)}
                  style={{
                    padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    background: profile.preferred_locations?.includes(loc) ? 'rgba(16,185,129,0.15)' : 'var(--bg-elevated)',
                    border: profile.preferred_locations?.includes(loc) ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border-light)',
                    color: profile.preferred_locations?.includes(loc) ? '#34d399' : 'var(--text-secondary)',
                    transition: 'all 0.15s'
                  }}>
                  {profile.preferred_locations?.includes(loc) ? '✓ ' : '+ '}{loc}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Search Interval</label>
            <select className="input-field" style={{ maxWidth: 200 }}
              value={profile.search_interval_hours}
              onChange={e => setProfile((p: any) => ({ ...p, search_interval_hours: parseInt(e.target.value) }))}>
              {[3, 6, 12, 24].map(h => <option key={h} value={h}>Every {h} hour{h > 1 ? 's' : ''}</option>)}
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Auto-search Active</label>
              <div onClick={() => setProfile((p: any) => ({ ...p, search_active: !p.search_active }))}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: profile.search_active ? 'var(--accent)' : 'var(--bg-elevated)',
                  border: '1px solid var(--border-light)', cursor: 'pointer',
                  position: 'relative', transition: 'all 0.2s'
                }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 9, background: 'white',
                  position: 'absolute', top: 2, left: profile.search_active ? 22 : 2, transition: 'left 0.2s'
                }} />
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {profile.search_active
                ? `🟢 AI is actively searching every ${profile.search_interval_hours} hours`
                : '🔴 Auto-search is paused'}
            </p>
          </div>
        </div>
      )}

      {/* ── Notifications tab ──────────────────────────────────── */}
      {tab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 10, padding: 16 }}>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Notifications sent to:</p>
            <p style={{ color: 'var(--accent-bright)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>
              okewunmiafeezolaide@gmail.com
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
              Change via <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-card)', padding: '2px 6px', borderRadius: 4 }}>NOTIFICATION_EMAIL</code> in .env.local
            </p>
          </div>
          {[
            { title: 'New jobs found', desc: 'Batch digest when the AI finds new matching jobs', emoji: '🔍' },
            { title: 'Auto-application sent', desc: 'Confirmation when an email application is auto-sent', emoji: '✉' },
            { title: 'Manual apply needed', desc: 'Alert with cover letter for jobs requiring manual apply', emoji: '👆' },
          ].map(n => (
            <div key={n.title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>{n.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{n.desc}</p>
              </div>
              <div style={{ width: 44, height: 24, borderRadius: 12, background: 'var(--accent)', border: '1px solid var(--border-light)', position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: 9, background: 'white', position: 'absolute', top: 2, left: 22 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save button */}
      <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <button onClick={save} disabled={saving} className="btn-primary" style={{ minWidth: 140 }}>
          <Save size={15} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}