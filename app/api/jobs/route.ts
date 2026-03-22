import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const profileId = process.env.PROFILE_ID;
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const sort = searchParams.get('sort') || 'found_at';
  const order = searchParams.get('order') || 'desc';

  if (!profileId) {
    return NextResponse.json({ error: 'PROFILE_ID not set', jobs: [], total: 0 }, { status: 500 });
  }

  let query = supabaseAdmin
    .from('jobs')
    .select('*', { count: 'exact' })
    .eq('user_id', profileId)
    .order(sort, { ascending: order === 'asc' })
    .range((page - 1) * limit, page * limit - 1);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: jobs, error, count } = await query;

  if (error) {
    console.error('[jobs API] query error:', error.message);
    return NextResponse.json({ error: error.message, jobs: [], total: 0 }, { status: 500 });
  }

  console.log(`[jobs API] found=${count}`);

  const jobIds = (jobs ?? []).map((j: any) => j.id);

  const { data: coverLetters } = jobIds.length > 0
    ? await supabaseAdmin
        .from('cover_letters')
        .select('id, job_id, content, subject_line, version')
        .in('job_id', jobIds)
        .eq('is_active', true)
    : { data: [] };

  const jobsWithCL = (jobs ?? []).map((j: any) => ({
    ...j,
    cover_letters: (coverLetters ?? []).filter((cl: any) => cl.job_id === j.id)
  }));

  return NextResponse.json({ jobs: jobsWithCL, total: count ?? 0, page, limit }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  });
}