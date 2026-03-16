import { Resend } from 'resend';
import type { Job, UserProfile, CoverLetter } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL!;
const NOTIFY_EMAIL = process.env.NOTIFICATION_EMAIL!;

// ─── SEND APPLICATION EMAIL ───────────────────────────────────────────────
// Auto-applies to jobs that accept email applications

export async function sendApplicationEmail(
  job: Job,
  profile: UserProfile,
  coverLetter: CoverLetter
): Promise<{ id: string; success: boolean; error?: string }> {
  if (!job.apply_email) {
    return { id: '', success: false, error: 'No application email found' };
  }

  const emailBody = `${coverLetter.content}

---
${profile.full_name}
${profile.email} | ${profile.phone || ''}
Portfolio: ${profile.portfolio_url || ''}
GitHub: ${profile.github_url || ''}
LinkedIn: ${profile.linkedin_url || ''}`;

  try {
    const result = await resend.emails.send({
      from: `${profile.full_name} <${FROM}>`,
      to: [job.apply_email],
      reply_to: profile.email,
      subject: coverLetter.subject_line,
      text: emailBody,
    });

    return { id: result.data?.id || '', success: true };
  } catch (error: any) {
    return { id: '', success: false, error: error.message };
  }
}

// ─── NOTIFY: NEW JOBS FOUND ──────────────────────────────────────────────

export async function notifyNewJobsFound(
  jobs: Job[],
  profile: UserProfile
): Promise<void> {
  if (jobs.length === 0) return;

  const jobRows = jobs
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 10)
    .map(j => `
      <tr style="border-bottom:1px solid #e5e7eb">
        <td style="padding:12px 8px">
          <strong style="color:#1a56db">${j.title}</strong><br/>
          <span style="color:#374151">${j.company}</span>
        </td>
        <td style="padding:12px 8px;color:#6b7280">${j.location}</td>
        <td style="padding:12px 8px">
          <span style="background:${j.match_score >= 80 ? '#dcfce7' : j.match_score >= 60 ? '#fef9c3' : '#fee2e2'};
                        color:${j.match_score >= 80 ? '#166534' : j.match_score >= 60 ? '#854d0e' : '#991b1b'};
                        padding:2px 8px;border-radius:999px;font-size:13px;font-weight:600">
            ${j.match_score}% match
          </span>
        </td>
        <td style="padding:12px 8px">
          <span style="background:${j.application_method === 'email' ? '#dbeafe' : '#f3f4f6'};
                        color:${j.application_method === 'email' ? '#1d4ed8' : '#374151'};
                        padding:2px 8px;border-radius:4px;font-size:12px">
            ${j.application_method === 'email' ? '✉ Auto-applying' : '👆 Manual apply'}
          </span>
        </td>
        <td style="padding:12px 8px">
          <a href="${j.apply_url}" style="color:#1a56db;text-decoration:none">View →</a>
        </td>
      </tr>
    `).join('');

  const autoApplied = jobs.filter(j => j.application_method === 'email').length;
  const manualNeeded = jobs.filter(j => j.application_method !== 'email').length;

  await resend.emails.send({
    from: `Job Hunter <${FROM}>`,
    to: [NOTIFY_EMAIL],
    subject: `🎯 ${jobs.length} new job${jobs.length > 1 ? 's' : ''} found — ${autoApplied} auto-applied`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:700px;margin:0 auto;padding:20px;color:#111928">
  
  <div style="background:linear-gradient(135deg,#1a56db,#1e40af);padding:28px 32px;border-radius:12px;margin-bottom:24px">
    <h1 style="color:white;margin:0;font-size:22px">🎯 New Jobs Found</h1>
    <p style="color:#bfdbfe;margin:8px 0 0">Job Hunter searched and found ${jobs.length} matching positions</p>
  </div>

  <div style="display:flex;gap:12px;margin-bottom:24px">
    <div style="flex:1;background:#dbeafe;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:700;color:#1d4ed8">${jobs.length}</div>
      <div style="color:#1e40af;font-size:14px">Jobs Found</div>
    </div>
    <div style="flex:1;background:#dcfce7;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:700;color:#166534">${autoApplied}</div>
      <div style="color:#15803d;font-size:14px">Auto-Applied</div>
    </div>
    <div style="flex:1;background:#fef9c3;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:700;color:#854d0e">${manualNeeded}</div>
      <div style="color:#a16207;font-size:14px">Need Your Action</div>
    </div>
  </div>

  <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
    <thead>
      <tr style="background:#f9fafb">
        <th style="padding:10px 8px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase">Job</th>
        <th style="padding:10px 8px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase">Location</th>
        <th style="padding:10px 8px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase">Match</th>
        <th style="padding:10px 8px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase">Status</th>
        <th style="padding:10px 8px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase">Link</th>
      </tr>
    </thead>
    <tbody>${jobRows}</tbody>
  </table>

  <div style="margin-top:24px;text-align:center">
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
       style="background:#1a56db;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
      Open Dashboard →
    </a>
  </div>

  <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px">
    Job Hunter searches every ${profile.search_interval_hours} hours · 
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color:#1a56db">Manage settings</a>
  </p>
</body>
</html>`
  });
}

// ─── NOTIFY: MANUAL APPLY NEEDED ─────────────────────────────────────────

export async function notifyManualApplyNeeded(
  job: Job,
  profile: UserProfile,
  coverLetter: CoverLetter
): Promise<void> {
  console.log(`[email] Sending manual-apply notification to ${NOTIFY_EMAIL} from ${FROM}`);
  const result = await resend.emails.send({
    from: `Job Hunter <${FROM}>`,
    to: [NOTIFY_EMAIL],
    subject: `👆 Action needed: Apply to ${job.title} at ${job.company}`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#111928">
  
  <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:12px;padding:20px;margin-bottom:20px">
    <h2 style="margin:0;color:#92400e">👆 Manual Application Required</h2>
    <p style="color:#78350f;margin:8px 0 0">This job requires you to apply directly (form/LinkedIn — bots blocked)</p>
  </div>

  <div style="border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px">
    <h3 style="margin:0 0 12px;color:#111928">${job.title}</h3>
    <p style="margin:0;color:#374151"><strong>Company:</strong> ${job.company}</p>
    <p style="margin:4px 0;color:#374151"><strong>Location:</strong> ${job.location}</p>
    <p style="margin:4px 0;color:#374151"><strong>Match Score:</strong> <strong style="color:#1a56db">${job.match_score}%</strong></p>
    <p style="margin:4px 0;color:#374151"><strong>Source:</strong> ${job.source}</p>
    <br/>
    <a href="${job.apply_url}" style="background:#1a56db;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
      Apply Now →
    </a>
  </div>

  <div style="border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px">
    <h4 style="margin:0 0 12px;color:#374151">📝 Your Cover Letter (ready to copy)</h4>
    <div style="background:#f9fafb;padding:16px;border-radius:6px;white-space:pre-wrap;font-size:14px;line-height:1.6;color:#374151">
${coverLetter.content}
    </div>
  </div>

  <div style="border:1px solid #e5e7eb;border-radius:8px;padding:20px">
    <h4 style="margin:0 0 12px;color:#374151">📋 Key Requirements</h4>
    <ul style="margin:0;padding-left:20px;color:#374151">
      ${job.requirements.slice(0, 6).map(r => `<li style="margin-bottom:4px">${r}</li>`).join('')}
    </ul>
  </div>

  <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:20px">
    Job Hunter · <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color:#1a56db">Dashboard</a>
  </p>
</body>
</html>`
  });
  if (result.error) {
    console.error('[email] notifyManualApplyNeeded failed:', result.error);
  } else {
    console.log('[email] notifyManualApplyNeeded sent, id:', result.data?.id);
  }
}