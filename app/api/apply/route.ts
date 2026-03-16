import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { sendApplicationEmail } from '@/lib/resend/email';
import type { Job, UserProfile, CoverLetter } from '@/types';

export async function POST(request: NextRequest) {
  const { job_id, cover_letter_id } = await request.json();
  const profileId = process.env.PROFILE_ID;

  const [{ data: job }, { data: profile }, { data: cl }] = await Promise.all([
    supabaseAdmin.from('jobs').select('*').eq('id', job_id).single(),
    supabaseAdmin.from('profiles').select('*').eq('id', profileId).single(),
    supabaseAdmin.from('cover_letters').select('*').eq('id', cover_letter_id).single()
  ]);

  if (!job || !profile || !cl) {
    return NextResponse.json({ error: 'Missing data' }, { status: 404 });
  }

  if (!job.apply_email) {
    return NextResponse.json({ error: 'Job has no email address — apply manually at the link' }, { status: 400 });
  }

  const { success, id: emailId, error: emailError } = await sendApplicationEmail(
    job as Job,
    profile as UserProfile,
    cl as CoverLetter
  );

  if (!success) {
    return NextResponse.json({ error: emailError }, { status: 500 });
  }

  // Update job status
  await supabaseAdmin
    .from('jobs')
    .update({ status: 'applied', applied_at: new Date().toISOString() })
    .eq('id', job_id);

  // Create application record
  await supabaseAdmin.from('applications').insert({
    user_id: profileId,
    job_id,
    cover_letter_id,
    status: 'applied',
    applied_at: new Date().toISOString(),
    email_sent_at: new Date().toISOString(),
    email_message_id: emailId
  });

  return NextResponse.json({ success: true, email_id: emailId });
}
