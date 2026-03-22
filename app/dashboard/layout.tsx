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
//         // Refresh the page so dashboard and jobs list update automatically
//         window.location.reload();
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
  Zap, RefreshCw, ChevronRight, Menu, X
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
  const [mobileOpen, setMobileOpen] = useState(false);

  async function triggerScan() {
    setScanning(true);
    setMobileOpen(false);
    try {
      const res = await fetch('/api/cron', {
        method: 'POST',
        headers: { authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Scan complete — ${data.jobs_saved} new jobs found`);
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

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={17} color="white" fill="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1 }}>JobHunter</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>AI-Powered</div>
          </div>
        </div>
        <button onClick={() => setMobileOpen(false)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} className="mobile-close">
          <X size={18} color="var(--text-muted)" />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: '10px 10px', flex: 1 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 8px 4px' }}>
          Navigation
        </div>
        {navItems.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                background: active ? 'var(--accent-glow)' : 'transparent',
                color: active ? 'var(--accent-bright)' : 'var(--text-secondary)',
                border: active ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                fontWeight: active ? 600 : 400, fontSize: 14, transition: 'all 0.15s', cursor: 'pointer'
              }}>
                <item.icon size={16} />
                {item.label}
                {active && <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Scan button */}
      <div style={{ padding: '14px', borderTop: '1px solid var(--border)' }}>
        <button onClick={triggerScan} disabled={scanning} style={{
          width: '100%', background: scanning ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #1e40af, #1d4ed8)',
          border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 14px',
          color: scanning ? 'var(--text-muted)' : 'white', fontFamily: 'var(--font-sans)',
          fontWeight: 600, fontSize: 13, cursor: scanning ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s'
        }}>
          <RefreshCw size={13} style={{ animation: scanning ? 'spin 1s linear infinite' : 'none' }} />
          {scanning ? 'Scanning...' : 'Scan Now'}
        </button>
        <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 6 }}>
          Auto-scans every 3 hours
        </p>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }

        .desktop-sidebar { display: flex; }
        .mobile-topbar { display: none; }
        .main-content { margin-left: 232px; }
        .mobile-overlay { display: none; }

        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .main-content { margin-left: 0 !important; padding-top: 56px; }
          .mobile-sidebar {
            position: fixed; top: 0; left: 0; bottom: 0; z-index: 200;
            width: 260px; background: var(--bg-card);
            border-right: 1px solid var(--border);
            display: flex; flex-direction: column;
            animation: slideIn 0.25s ease;
          }
          .mobile-close { display: flex !important; }
          .mobile-overlay {
            display: block !important; position: fixed; inset: 0;
            background: rgba(0,0,0,0.5); z-index: 199;
          }
        }
      `}</style>

      {/* Desktop sidebar */}
      <aside className="desktop-sidebar" style={{
        width: 232, background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
        flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50
      }}>
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="mobile-topbar" style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56, zIndex: 100,
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        alignItems: 'center', padding: '0 16px', gap: 12
      }}>
        <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <Menu size={22} color="var(--text-primary)" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={14} color="white" fill="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>JobHunter</span>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={triggerScan} disabled={scanning} style={{
          background: scanning ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #1e40af, #1d4ed8)',
          border: 'none', borderRadius: 7, padding: '7px 12px',
          color: scanning ? 'var(--text-muted)' : 'white',
          fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 12,
          cursor: scanning ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          <RefreshCw size={12} style={{ animation: scanning ? 'spin 1s linear infinite' : 'none' }} />
          {scanning ? '...' : 'Scan'}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Mobile drawer */}
      {mobileOpen && (
        <aside className="mobile-sidebar">
          <SidebarContent />
        </aside>
      )}

      {/* Main content */}
      <main className="main-content" style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>
    </>
  );
}