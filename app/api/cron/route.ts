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
//         const rawJobs = await searchForJobs(profile);
//         results.jobs_found += rawJobs.length;

//         // ── Get search config for this profile ───────────────────────────
//         const { data: config } = await supabaseAdmin
//           .from('search_configs')
//           .select('*')
//           .eq('user_id', profile.id)
//           .eq('is_active', true)
//           .single();

//         const minScore = config?.min_match_score ?? 60;
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
//           const { data: savedJob, error: saveError } = await supabaseAdmin
//             .from('jobs')
//             .insert({
//               user_id: profile.id,
//               ...rawJob,
//               match_score: score,
//               match_reasons: reasons,
//               status: rawJob.application_method === 'email'
//                 ? 'email_sent'
//                 : 'needs_manual_apply'
//             })
//             .select()
//             .single();

//           if (saveError) {
//             // Might be duplicate constraint, skip
//             console.log(`[CRON] Skipped duplicate job: ${rawJob.title}`);
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



