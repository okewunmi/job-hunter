// import { NextRequest, NextResponse } from 'next/server';
// import { supabaseAdmin } from '@/lib/supabase/client';
// import { searchForJobs, scoreJobMatch, generateCoverLetter } from '@/lib/claude/agent';
// import { sendApplicationEmail, notifyNewJobsFound, notifyManualApplyNeeded } from '@/lib/resend/email';
// import type { Job, UserProfile, CoverLetter } from '@/types';

// export const maxDuration = 300; // 5 minutes (Vercel Pro: up to 300s)
// export const dynamic = 'force-dynamic';

// export async function GET(request: NextRequest) {
//   // ── Security: validate cron secret ─────────────────────────────────────
//   const authHeader = request.headers.get('authorization');
//   const cronSecret = process.env.CRON_SECRET;
  
//   if (authHeader !== `Bearer ${cronSecret}`) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }

//   const startTime = Date.now();
//   const results = {
//     profiles_processed: 0,
//     jobs_found: 0,
//     jobs_saved: 0,
//     jobs_auto_applied: 0,
//     jobs_manual_needed: 0,
//     emails_sent: 0,
//     errors: [] as string[]
//   };

//   try {
//     // ── Get all active profiles ─────────────────────────────────────────
//     const { data: profiles, error: profilesError } = await supabaseAdmin
//       .from('profiles')
//       .select('*')
//       .eq('search_active', true);

//     if (profilesError) throw profilesError;
//     if (!profiles || profiles.length === 0) {
//       return NextResponse.json({ message: 'No active profiles', ...results });
//     }

//     for (const profile of profiles as UserProfile[]) {
//       try {
//         results.profiles_processed++;

//         // ── Search for jobs ──────────────────────────────────────────────
//         console.log(`[CRON] Searching jobs for ${profile.full_name}...`);
//         // Catch any unexpected error from searchForJobs itself
//         let rawJobs: any[] = [];
//         try {
//           rawJobs = await searchForJobs(profile);
//         } catch (searchErr: any) {
//           console.error('[CRON] searchForJobs crashed:', searchErr.message);
//           results.errors.push(`Search failed: ${searchErr.message}`);
//         }
//         results.jobs_found += rawJobs.length;
//         console.log(`[CRON] Raw jobs from search: ${rawJobs.length}`);

//         // ── Get search config for this profile ───────────────────────────
//         const { data: config } = await supabaseAdmin
//           .from('search_configs')
//           .select('*')
//           .eq('user_id', profile.id)
//           .eq('is_active', true)
//           .single();

//         const minScore = config?.min_match_score ?? 45;
//         const newJobs: Job[] = [];

//         for (const rawJob of rawJobs) {
//           // ── Score job match ────────────────────────────────────────────
//           const { score, reasons } = await scoreJobMatch(rawJob, profile);

//           if (score < minScore) {
//             console.log(`[CRON] Skipping ${rawJob.title} at ${rawJob.company} (score: ${score})`);
//             continue;
//           }

//           // ── Check for duplicate (same source + source_id) ──────────────
//           if (rawJob.source_id) {
//             const { data: existing } = await supabaseAdmin
//               .from('jobs')
//               .select('id')
//               .eq('user_id', profile.id)
//               .eq('source', rawJob.source)
//               .eq('source_id', rawJob.source_id)
//               .single();

//             if (existing) continue; // Already seen this job
//           }

//           // ── Save job to database ───────────────────────────────────────
//           // Only include columns that exist in the DB schema — strip extras like posted_at
//           const jobRow = {
//             user_id:            profile.id,
//             title:              rawJob.title,
//             company:            rawJob.company,
//             location:           rawJob.location,
//             job_type:           rawJob.job_type,
//             description:        rawJob.description,
//             requirements:       rawJob.requirements,
//             nice_to_have:       rawJob.nice_to_have,
//             apply_url:          rawJob.apply_url,
//             apply_email:        rawJob.apply_email ?? null,
//             application_method: rawJob.application_method,
//             source:             rawJob.source,
//             source_id:          rawJob.source_id,
//             salary_min:         rawJob.salary_min ?? null,
//             salary_max:         rawJob.salary_max ?? null,
//             salary_currency:    rawJob.salary_currency ?? null,
//             match_score:        score,
//             match_reasons:      reasons,
//             found_at:           rawJob.found_at,
//             status:             rawJob.application_method === 'email'
//                                   ? 'email_sent'
//                                   : 'needs_manual_apply',
//           };

//           const { data: savedJob, error: saveError } = await supabaseAdmin
//             .from('jobs')
//             .insert(jobRow)
//             .select()
//             .single();

//           if (saveError) {
//             console.error(`[CRON] Save error for "${rawJob.title}": ${saveError.message} (code: ${saveError.code})`);
//             continue;
//           }

//           results.jobs_saved++;
//           newJobs.push(savedJob as Job);

//           // ── Generate cover letter ──────────────────────────────────────
//           const { content, subject_line } = await generateCoverLetter(savedJob as Job, profile);

//           const { data: coverLetter } = await supabaseAdmin
//             .from('cover_letters')
//             .insert({
//               user_id: profile.id,
//               job_id: savedJob.id,
//               content,
//               subject_line,
//               version: 1,
//               is_active: true
//             })
//             .select()
//             .single();

//           if (!coverLetter) continue;

//           // ── Auto-apply if email-based ──────────────────────────────────
//           if (rawJob.application_method === 'email' && rawJob.apply_email) {
//             const { success, id: emailId, error: emailError } = await sendApplicationEmail(
//               savedJob as Job,
//               profile,
//               coverLetter as CoverLetter
//             );

//             if (success) {
//               results.jobs_auto_applied++;
//               results.emails_sent++;

//               // Record application
//               await supabaseAdmin.from('applications').insert({
//                 user_id: profile.id,
//                 job_id: savedJob.id,
//                 cover_letter_id: coverLetter.id,
//                 status: 'applied',
//                 applied_at: new Date().toISOString(),
//                 email_sent_at: new Date().toISOString(),
//                 email_message_id: emailId
//               });

//               // Log notification
//               await supabaseAdmin.from('email_notifications').insert({
//                 user_id: profile.id,
//                 job_id: savedJob.id,
//                 type: 'applied',
//                 subject: subject_line,
//                 resend_id: emailId
//               });
//             } else {
//               console.error(`[CRON] Failed to send application email: ${emailError}`);
//               // Mark as needs manual apply
//               await supabaseAdmin
//                 .from('jobs')
//                 .update({ status: 'needs_manual_apply' })
//                 .eq('id', savedJob.id);
//             }
//           } else {
//             // ── Notify user to apply manually ────────────────────────────
//             results.jobs_manual_needed++;
//             await notifyManualApplyNeeded(savedJob as Job, profile, coverLetter as CoverLetter);

//             await supabaseAdmin.from('email_notifications').insert({
//               user_id: profile.id,
//               job_id: savedJob.id,
//               type: 'manual_apply_needed',
//               subject: `Apply to: ${rawJob.title} at ${rawJob.company}`
//             });
//           }
//         }

//         // ── Send batch notification for new jobs found ───────────────────
//         if (newJobs.length > 0) {
//           await notifyNewJobsFound(newJobs, profile);
//           results.emails_sent++;
//         }

//         // ── Update last_search_at ────────────────────────────────────────
//         await supabaseAdmin
//           .from('profiles')
//           .update({ last_search_at: new Date().toISOString() })
//           .eq('id', profile.id);

//       } catch (profileError: any) {
//         results.errors.push(`Profile ${profile.id}: ${profileError.message}`);
//         console.error(`[CRON] Error processing profile ${profile.id}:`, profileError);
//       }
//     }

//     const duration = Date.now() - startTime;
//     console.log(`[CRON] Completed in ${duration}ms`, results);

//     return NextResponse.json({
//       success: true,
//       duration_ms: duration,
//       ...results
//     });

//   } catch (error: any) {
//     console.error('[CRON] Fatal error:', error);
//     return NextResponse.json(
//       { success: false, error: error.message, ...results },
//       { status: 500 }
//     );
//   }
// }

// // Also support POST for manual triggers from dashboard
// export async function POST(request: NextRequest) {
//   return GET(request);
// }




import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { searchForJobs, scoreJobMatch, generateCoverLetter } from '@/lib/claude/agent';
import { scoreATSMatch } from '@/lib/ats/scorer';
import { findRecruiterEmail } from '@/lib/recruiter/finder';
import { sendApplicationEmail, notifyNewJobsFound, notifyManualApplyNeeded } from '@/lib/resend/email';
import { sendFollowUpEmail, sendWeeklySummary } from '@/lib/resend/followup';
import type { Job, UserProfile, CoverLetter } from '@/types';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function auth(request: NextRequest) {
  return request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

// ─── MAIN CRON ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!auth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const startTime = Date.now();
  const results = {
    profiles_processed: 0,
    jobs_found: 0,
    jobs_saved: 0,
    jobs_auto_applied: 0,
    jobs_manual_needed: 0,
    recruiters_found: 0,
    follow_ups_sent: 0,
    emails_sent: 0,
    errors: [] as string[]
  };

  try {
    const { data: profiles } = await supabaseAdmin
      .from('profiles').select('*').eq('search_active', true);

    if (!profiles?.length) return NextResponse.json({ message: 'No active profiles', ...results });

    for (const profile of profiles as UserProfile[]) {
      try {
        results.profiles_processed++;

        // ── 1. Search for jobs ───────────────────────────────────────────
        console.log(`[CRON] Searching jobs for ${profile.full_name}...`);
        let rawJobs: any[] = [];
        try {
          rawJobs = await searchForJobs(profile);
        } catch (e: any) {
          results.errors.push(`Search: ${e.message}`);
        }
        results.jobs_found += rawJobs.length;
        console.log(`[CRON] Raw jobs: ${rawJobs.length}`);

        const { data: config } = await supabaseAdmin
          .from('search_configs').select('*')
          .eq('user_id', profile.id).eq('is_active', true).single();

        const minScore = config?.min_match_score ?? 45;
        const newJobs: Job[] = [];

        for (const rawJob of rawJobs) {
          // ── Score match ────────────────────────────────────────────────
          const { score, reasons } = await scoreJobMatch(rawJob, profile);
          if (score < minScore) {
            console.log(`[CRON] Skipping ${rawJob.title} at ${rawJob.company} (score: ${score})`);
            continue;
          }

          // ── Dedup check ────────────────────────────────────────────────
          if (rawJob.source_id) {
            const { data: existing } = await supabaseAdmin.from('jobs')
              .select('id').eq('user_id', profile.id)
              .eq('source', rawJob.source).eq('source_id', rawJob.source_id).single();
            if (existing) continue;
          }

          // ── 2. ATS Score ───────────────────────────────────────────────
          let atsScore: number | null = null;
          try {
            const atsResult = await scoreATSMatch(rawJob as unknown as Job, profile);
            atsScore = atsResult.score;
            console.log(`[CRON] ATS score for "${rawJob.title}": ${atsScore} (${atsResult.grade})`);
          } catch (e) {
            console.warn('[CRON] ATS scoring failed:', e);
          }

          // ── 3. Find recruiter email ────────────────────────────────────
          let recruiterEmail: string | null = null;
          let recruiterName: string | null = null;
          try {
            const recruiter = await findRecruiterEmail(rawJob.company, rawJob.apply_url);
            if (recruiter && recruiter.confidence >= 30) {
              recruiterEmail = recruiter.email;
              recruiterName = recruiter.name || null;
              results.recruiters_found++;
              console.log(`[CRON] Found recruiter: ${recruiterEmail} (${recruiter.confidence}% confidence)`);
            }
          } catch (e) {
            console.warn('[CRON] Recruiter finder failed:', e);
          }

          // ── Save job ───────────────────────────────────────────────────
          const jobRow = {
            user_id:            profile.id,
            title:              rawJob.title,
            company:            rawJob.company,
            location:           rawJob.location,
            job_type:           rawJob.job_type,
            description:        rawJob.description,
            requirements:       rawJob.requirements,
            nice_to_have:       rawJob.nice_to_have,
            apply_url:          rawJob.apply_url,
            apply_email:        rawJob.apply_email ?? recruiterEmail ?? null,
            application_method: rawJob.apply_email ? rawJob.application_method
                                  : recruiterEmail ? 'email' : rawJob.application_method,
            source:             rawJob.source,
            source_id:          rawJob.source_id,
            salary_min:         rawJob.salary_min ?? null,
            salary_max:         rawJob.salary_max ?? null,
            salary_currency:    rawJob.salary_currency ?? null,
            match_score:        score,
            match_reasons:      reasons,
            found_at:           rawJob.found_at,
            ats_score:          atsScore,
            recruiter_email:    recruiterEmail,
            recruiter_name:     recruiterName,
            recruiter_found_at: recruiterEmail ? new Date().toISOString() : null,
            status:             (rawJob.apply_email || recruiterEmail)
                                  ? 'email_sent' : 'needs_manual_apply',
          };

          const { data: savedJob, error: saveError } = await supabaseAdmin
            .from('jobs').insert(jobRow).select().single();

          if (saveError) {
            console.error(`[CRON] Save error for "${rawJob.title}": ${saveError.message}`);
            continue;
          }

          results.jobs_saved++;
          newJobs.push(savedJob as Job);

          // ── Generate cover letter ──────────────────────────────────────
          const { content, subject_line } = await generateCoverLetter(savedJob as Job, profile);
          const { data: coverLetter } = await supabaseAdmin.from('cover_letters').insert({
            user_id: profile.id,
            job_id: savedJob.id,
            content, subject_line, version: 1, is_active: true
          }).select().single();

          if (!coverLetter) continue;

          // ── Auto-apply (email-based) ───────────────────────────────────
          const applyEmail = savedJob.apply_email || recruiterEmail;
          if (applyEmail) {
            const { success, id: emailId, error: emailError } = await sendApplicationEmail(
              { ...savedJob, apply_email: applyEmail } as Job,
              profile,
              coverLetter as CoverLetter
            );

            if (success) {
              results.jobs_auto_applied++;
              results.emails_sent++;
              await supabaseAdmin.from('applications').insert({
                user_id: profile.id,
                job_id: savedJob.id,
                cover_letter_id: coverLetter.id,
                status: 'applied',
                applied_at: new Date().toISOString(),
                email_sent_at: new Date().toISOString(),
                email_message_id: emailId,
                last_activity_at: new Date().toISOString(),
              });
              await supabaseAdmin.from('jobs').update({ status: 'applied', applied_at: new Date().toISOString() }).eq('id', savedJob.id);
            } else {
              console.error(`[CRON] Email failed: ${emailError}`);
              await supabaseAdmin.from('jobs').update({ status: 'needs_manual_apply' }).eq('id', savedJob.id);
              await notifyManualApplyNeeded(savedJob as Job, profile, coverLetter as CoverLetter);
            }
          } else {
            results.jobs_manual_needed++;
            await notifyManualApplyNeeded(savedJob as Job, profile, coverLetter as CoverLetter);
          }
        }

        // ── Batch notification for new jobs ───────────────────────────────
        if (newJobs.length > 0) {
          await notifyNewJobsFound(newJobs, profile);
          results.emails_sent++;
        }

        // ── 4a. Follow-up sequence (5 days after applying) ────────────────
        const followUpResults = await runFollowUpSequence(profile);
        results.follow_ups_sent += followUpResults;

        // ── 4b. Weekly summary (runs every Monday) ────────────────────────
        const today = new Date();
        if (today.getDay() === 1) { // Monday = 1
          await runWeeklySummary(profile);
        }

        // ── Update last_search_at ──────────────────────────────────────────
        await supabaseAdmin.from('profiles')
          .update({ last_search_at: new Date().toISOString() })
          .eq('id', profile.id);

      } catch (profileError: any) {
        results.errors.push(`Profile ${profile.id}: ${profileError.message}`);
        console.error('[CRON] Profile error:', profileError);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[CRON] Done in ${duration}ms`, results);
    return NextResponse.json({ success: true, duration_ms: duration, ...results });

  } catch (error: any) {
    console.error('[CRON] Fatal:', error);
    return NextResponse.json({ success: false, error: error.message, ...results }, { status: 500 });
  }
}

// ─── FOLLOW-UP SEQUENCE ───────────────────────────────────────────────────

async function runFollowUpSequence(profile: UserProfile): Promise<number> {
  let sent = 0;
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

  // Find applications: applied 5-10 days ago, no follow-up yet, have an email
  const { data: apps } = await supabaseAdmin
    .from('applications')
    .select('*, jobs(title, company, apply_email, recruiter_email), cover_letters(subject_line)')
    .eq('user_id', profile.id)
    .eq('status', 'applied')
    .lte('applied_at', fiveDaysAgo)
    .gte('applied_at', tenDaysAgo)
    .is('follow_up_sent_at', null);

  if (!apps?.length) return 0;

  for (const app of apps) {
    const job = app.jobs as any;
    const cl = app.cover_letters as any;
    const toEmail = job?.apply_email || job?.recruiter_email;

    if (!toEmail || !job) continue;

    console.log(`[CRON] Sending follow-up to ${toEmail} for ${job.title}`);
    const { success, id } = await sendFollowUpEmail({
      to: toEmail,
      jobTitle: job.title,
      company: job.company,
      profile,
      originalSubject: cl?.subject_line || `${job.title} Application`,
      originalAppliedAt: app.applied_at,
    });

    if (success) {
      sent++;
      await supabaseAdmin.from('applications').update({
        follow_up_sent_at: new Date().toISOString(),
        follow_up_count: (app.follow_up_count || 0) + 1,
        last_activity_at: new Date().toISOString(),
      }).eq('id', app.id);

      await supabaseAdmin.from('email_notifications').insert({
        user_id: profile.id,
        job_id: app.job_id,
        type: 'applied',
        subject: `Follow-up: ${job.title} at ${job.company}`,
        resend_id: id,
      });
    }
  }

  if (sent > 0) console.log(`[CRON] Sent ${sent} follow-up emails`);
  return sent;
}

// ─── WEEKLY SUMMARY ───────────────────────────────────────────────────────

async function runWeeklySummary(profile: UserProfile): Promise<void> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Check if already sent this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const { data: existing } = await supabaseAdmin
    .from('weekly_summaries')
    .select('id')
    .eq('user_id', profile.id)
    .eq('week_start', weekStartStr)
    .single();

  if (existing) return; // already sent this week

  const [
    { count: jobs_found },
    { count: jobs_applied },
    { count: interviews },
    { count: offers },
    { count: follow_ups },
    { data: recentJobs },
  ] = await Promise.all([
    supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).gte('found_at', weekAgo),
    supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).in('status', ['applied', 'email_sent']).gte('applied_at', weekAgo),
    supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).eq('status', 'interview').gte('updated_at', weekAgo),
    supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).eq('status', 'offer'),
    supabaseAdmin.from('applications').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).not('follow_up_sent_at', 'is', null).gte('follow_up_sent_at', weekAgo),
    supabaseAdmin.from('jobs').select('title, company, match_score, status, source').eq('user_id', profile.id).gte('found_at', weekAgo).order('match_score', { ascending: false }).limit(50),
  ]);

  // Aggregate sources
  const sourceCounts: Record<string, number> = {};
  for (const job of recentJobs || []) {
    sourceCounts[job.source] = (sourceCounts[job.source] || 0) + 1;
  }
  const top_sources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([source, count]) => ({ source, count }));

  const top_jobs = (recentJobs || [])
    .slice(0, 5)
    .map(j => ({ title: j.title, company: j.company, score: j.match_score, status: j.status }));

  const response_rate = jobs_applied && jobs_applied > 0
    ? Math.round(((interviews || 0) / jobs_applied) * 100)
    : 0;

  await sendWeeklySummary(profile, {
    jobs_found: jobs_found || 0,
    jobs_applied: jobs_applied || 0,
    interviews: interviews || 0,
    offers: offers || 0,
    follow_ups_sent: follow_ups || 0,
    top_sources,
    top_jobs,
    response_rate,
  });

  // Record that we sent it
  await supabaseAdmin.from('weekly_summaries').insert({
    user_id: profile.id,
    week_start: weekStartStr,
    jobs_found: jobs_found || 0,
    jobs_applied: jobs_applied || 0,
    interviews: interviews || 0,
    offers: offers || 0,
    top_sources,
  });

  console.log('[CRON] Weekly summary sent');
}

export async function POST(request: NextRequest) {
  return GET(request);
}