import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { generateCoverLetter } from '@/lib/claude/agent';
import type { Job, UserProfile } from '@/types';

export async function POST(request: NextRequest) {
  const { job_id } = await request.json();
  const profileId = process.env.PROFILE_ID;

  const [{ data: job }, { data: profile }] = await Promise.all([
    supabaseAdmin.from('jobs').select('*').eq('id', job_id).single(),
    supabaseAdmin.from('profiles').select('*').eq('id', profileId).single()
  ]);

  if (!job || !profile) {
    return NextResponse.json({ error: 'Job or profile not found' }, { status: 404 });
  }

  // Get current version to increment
  const { data: existing } = await supabaseAdmin
    .from('cover_letters')
    .select('version')
    .eq('job_id', job_id)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  const newVersion = (existing?.version || 0) + 1;

  // Deactivate old cover letters for this job
  await supabaseAdmin
    .from('cover_letters')
    .update({ is_active: false })
    .eq('job_id', job_id);

  const { content, subject_line } = await generateCoverLetter(job as Job, profile as UserProfile);

  const { data: cl, error } = await supabaseAdmin
    .from('cover_letters')
    .insert({
      user_id: profileId,
      job_id,
      content,
      subject_line,
      version: newVersion,
      is_active: true
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(cl);
}

export async function GET(request: NextRequest) {
  const profileId = process.env.PROFILE_ID;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const { data, error, count } = await supabaseAdmin
    .from('cover_letters')
    .select('*, jobs(title, company, location, status, match_score)', { count: 'exact' })
    .eq('user_id', profileId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cover_letters: data, total: count });
}
