import { redirect } from 'next/navigation';

// Catch-all for any /dashboard/[token] URLs (e.g. from Supabase auth redirects)
// Redirect cleanly to /dashboard
export default function DashboardCatchAll() {
  redirect('/dashboard');
}