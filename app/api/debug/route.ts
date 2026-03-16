import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET() {
  const profileId = process.env.PROFILE_ID;
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select('id, title, user_id')
    .limit(5);

  return NextResponse.json({
    env_profile_id: profileId,
    env_length: profileId?.length,
    all_jobs_in_db: data,
    error: error?.message
  });
}
