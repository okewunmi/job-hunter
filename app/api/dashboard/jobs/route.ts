import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const profileId = process.env.PROFILE_ID;

  const [
    { count: total_found },
    { count: total_applied },
    { count: total_interviews },
    { count: total_offers },
    { count: needs_manual },
    { data: recent_jobs },
    { data: avg_data }
  ] = await Promise.all([
    supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', profileId),
    supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', profileId).in('status', ['applied', 'email_sent']),
    supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', profileId).eq('status', 'interview'),
    supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', profileId).eq('status', 'offer'),
    supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', profileId).eq('status', 'needs_manual_apply'),
    supabaseAdmin.from('jobs').select('*').eq('user_id', profileId).gte('found_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).order('found_at', { ascending: false }).limit(5),
    supabaseAdmin.from('jobs').select('match_score').eq('user_id', profileId)
  ]);

  const avg_match = avg_data && avg_data.length > 0
    ? Math.round(avg_data.reduce((sum: number, j: any) => sum + j.match_score, 0) / avg_data.length)
    : 0;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: this_week_applied } = await supabaseAdmin
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profileId)
    .in('status', ['applied', 'email_sent'])
    .gte('applied_at', weekAgo);

  return NextResponse.json({
    total_found: total_found || 0,
    total_applied: total_applied || 0,
    total_interviews: total_interviews || 0,
    total_offers: total_offers || 0,
    needs_manual_apply: needs_manual || 0,
    avg_match_score: avg_match,
    this_week_found: recent_jobs?.length || 0,
    this_week_applied: this_week_applied || 0,
    recent_jobs: recent_jobs || []
  });
}
