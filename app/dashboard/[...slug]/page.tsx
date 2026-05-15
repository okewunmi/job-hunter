import { redirect, notFound } from 'next/navigation';

interface Props {
  params: { slug: string[] };
}

export default function DashboardCatchAll({ params }: Props) {
  const slug = params.slug ?? [];

  // Known real dashboard routes — let Next.js handle these normally
  const realRoutes = ['jobs', 'settings', 'cover-letters'];
  if (realRoutes.includes(slug[0])) notFound();

  // Supabase JWT tokens always start with "eyJ" and contain dots
  const looksLikeJWT = slug.some(s => s.startsWith('eyJ') && s.includes('.'));
  if (looksLikeJWT) redirect('/dashboard');

  // Everything else is a genuine 404
  notFound();
}