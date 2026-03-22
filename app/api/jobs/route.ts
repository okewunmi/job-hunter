
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const profileId = process.env.PROFILE_ID;

  if (!profileId) {
    return NextResponse.json({ error: 'PROFILE_ID not set' }, { status: 500 });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: total_found },
    { count: total_applied },
    { count: total_interviews },
    { count: total_offers },
    { count: needs_manual },
    { count: this_week_found },   // ← separate query, not capped at 5
    { count: this_week_applied },
    { data: recent_jobs },
    { data: avg_data }
  ] = await Promise.all([
    supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', profileId),
    supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', profileId).in('status', ['applied', 'email_sent']),
    supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', profileId).eq('status', 'interview'),
    supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', profileId).eq('status', 'offer'),
    supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', profileId).eq('status', 'needs_manual_apply'),
    supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', profileId).gte('found_at', weekAgo),
    supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', profileId).in('status', ['applied', 'email_sent']).gte('applied_at', weekAgo),
    supabaseAdmin.from('jobs').select('id, title, company, location, status, match_score, found_at, source, ats_score, recruiter_email').eq('user_id', profileId).order('found_at', { ascending: false }).limit(8),
    supabaseAdmin.from('jobs').select('match_score').eq('user_id', profileId),
  ]);

  const avg_match = avg_data && avg_data.length > 0
    ? Math.round(avg_data.reduce((sum: number, j: any) => sum + j.match_score, 0) / avg_data.length)
    : 0;

  return NextResponse.json({
    total_found:        total_found       ?? 0,
    total_applied:      total_applied     ?? 0,
    total_interviews:   total_interviews  ?? 0,
    total_offers:       total_offers      ?? 0,
    needs_manual_apply: needs_manual      ?? 0,
    avg_match_score:    avg_match,
    this_week_found:    this_week_found   ?? 0,
    this_week_applied:  this_week_applied ?? 0,
    recent_jobs:        recent_jobs       ?? [],
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    }
  });
}