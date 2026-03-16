// 'use client';

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import {
//   LayoutDashboard, Briefcase, FileText, Settings,
//   Zap, RefreshCw, Bell, ChevronRight
// } from 'lucide-react';
// import { useState } from 'react';
// import toast from 'react-hot-toast';

// const navItems = [
//   { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
//   { href: '/dashboard/jobs', label: 'Jobs', icon: Briefcase },
//   { href: '/dashboard/cover-letters', label: 'Cover Letters', icon: FileText },
//   { href: '/dashboard/settings', label: 'Settings', icon: Settings },
// ];

// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname();
//   const [scanning, setScanning] = useState(false);

//   async function triggerScan() {
//     setScanning(true);
//     try {
//       const res = await fetch('/api/cron', {
//         method: 'POST',
//         headers: { authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}` }
//       });
//       const data = await res.json();
//       if (data.success) {
//         toast.success(`Scan complete — ${data.jobs_saved} new jobs found`);
//       } else {
//         toast.error(data.error || 'Scan failed');
//       }
//     } catch {
//       toast.error('Scan failed — check console');
//     } finally {
//       setScanning(false);
//     }
//   }

//   return (
//     <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
//       {/* ── Sidebar ─────────────────────────────────────────────────── */}
//       <aside style={{
//         width: 240,
//         background: 'var(--bg-card)',
//         borderRight: '1px solid var(--border)',
//         display: 'flex',
//         flexDirection: 'column',
//         position: 'fixed',
//         top: 0, left: 0, bottom: 0,
//         zIndex: 50
//       }}>
//         {/* Logo */}
//         <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//             <div style={{
//               width: 36, height: 36,
//               background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
//               borderRadius: 10,
//               display: 'flex', alignItems: 'center', justifyContent: 'center'
//             }}>
//               <Zap size={18} color="white" fill="white" />
//             </div>
//             <div>
//               <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1 }}>JobHunter</div>
//               <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>AI-Powered</div>
//             </div>
//           </div>
//         </div>

//         {/* Nav */}
//         <nav style={{ padding: '12px 12px', flex: 1 }}>
//           <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 8px 4px' }}>
//             Navigation
//           </div>
//           {navItems.map(item => {
//             const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
//             return (
//               <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
//                 <div style={{
//                   display: 'flex', alignItems: 'center', gap: 10,
//                   padding: '9px 12px', borderRadius: 8, marginBottom: 2,
//                   background: active ? 'var(--accent-glow)' : 'transparent',
//                   color: active ? 'var(--accent-bright)' : 'var(--text-secondary)',
//                   border: active ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
//                   fontWeight: active ? 600 : 400,
//                   fontSize: 14,
//                   transition: 'all 0.15s',
//                   cursor: 'pointer'
//                 }}>
//                   <item.icon size={16} />
//                   {item.label}
//                   {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
//                 </div>
//               </Link>
//             );
//           })}
//         </nav>

//         {/* Manual scan trigger */}
//         <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
//           <button
//             onClick={triggerScan}
//             disabled={scanning}
//             style={{
//               width: '100%',
//               background: scanning ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #1e40af, #1d4ed8)',
//               border: '1px solid var(--border-light)',
//               borderRadius: 8,
//               padding: '10px 14px',
//               color: scanning ? 'var(--text-muted)' : 'white',
//               fontFamily: 'var(--font-sans)',
//               fontWeight: 600,
//               fontSize: 13,
//               cursor: scanning ? 'not-allowed' : 'pointer',
//               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
//               transition: 'all 0.2s'
//             }}
//           >
//             <RefreshCw size={14} style={{ animation: scanning ? 'spin 1s linear infinite' : 'none' }} />
//             {scanning ? 'Scanning...' : 'Scan Now'}
//           </button>
//           <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//           <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
//             Auto-scans every 3 hours
//           </p>
//         </div>
//       </aside>

//       {/* ── Main content ────────────────────────────────────────────── */}
//       <main style={{ marginLeft: 240, flex: 1, minWidth: 0 }}>
//         {children}
//       </main>
//     </div>
//   );
// }


'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Briefcase, FileText, Settings,
  Zap, RefreshCw, Bell, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/dashboard/cover-letters', label: 'Cover Letters', icon: FileText },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [scanning, setScanning] = useState(false);

  async function triggerScan() {
    setScanning(true);
    try {
      const res = await fetch('/api/cron', {
        method: 'POST',
        headers: { authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Scan complete — ${data.jobs_saved} new jobs found`);
        // Refresh the page so dashboard and jobs list update automatically
        window.location.reload();
      } else {
        toast.error(data.error || 'Scan failed');
      }
    } catch {
      toast.error('Scan failed — check console');
    } finally {
      setScanning(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside style={{
        width: 240,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 50
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Zap size={18} color="white" fill="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1 }}>JobHunter</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>AI-Powered</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 12px', flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 8px 4px' }}>
            Navigation
          </div>
          {navItems.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                  background: active ? 'var(--accent-glow)' : 'transparent',
                  color: active ? 'var(--accent-bright)' : 'var(--text-secondary)',
                  border: active ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                  transition: 'all 0.15s',
                  cursor: 'pointer'
                }}>
                  <item.icon size={16} />
                  {item.label}
                  {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Manual scan trigger */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={triggerScan}
            disabled={scanning}
            style={{
              width: '100%',
              background: scanning ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #1e40af, #1d4ed8)',
              border: '1px solid var(--border-light)',
              borderRadius: 8,
              padding: '10px 14px',
              color: scanning ? 'var(--text-muted)' : 'white',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: 13,
              cursor: scanning ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={14} style={{ animation: scanning ? 'spin 1s linear infinite' : 'none' }} />
            {scanning ? 'Scanning...' : 'Scan Now'}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
            Auto-scans every 3 hours
          </p>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────── */}
      <main style={{ marginLeft: 240, flex: 1, minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}