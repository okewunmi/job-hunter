import { Resend } from 'resend';
import type { UserProfile } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);
const RAW_FROM = process.env.RESEND_FROM_EMAIL || '';
const FROM = (RAW_FROM.includes('gmail.com') || RAW_FROM.includes('yahoo.com') || RAW_FROM.includes('hotmail.com'))
  ? 'onboarding@resend.dev'
  : RAW_FROM;
const NOTIFY_EMAIL = process.env.NOTIFICATION_EMAIL!;

// ─── FOLLOW-UP EMAIL ──────────────────────────────────────────────────────
// Sends a short, professional follow-up 5 days after applying

export async function sendFollowUpEmail(params: {
  to: string;
  jobTitle: string;
  company: string;
  profile: UserProfile;
  originalSubject: string;
  originalAppliedAt: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const { to, jobTitle, company, profile, originalSubject, originalAppliedAt } = params;
  const appliedDate = new Date(originalAppliedAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const body = `Dear Hiring Manager,

I hope this message finds you well. I wanted to follow up on my application for the ${jobTitle} position at ${company}, which I submitted on ${appliedDate}.

I remain very interested in this opportunity and am confident that my ${profile.years_experience}+ years of React Native and frontend development experience would be a strong fit for your team.

Please let me know if you need any additional information or materials. I look forward to hearing from you.

Best regards,
${profile.full_name}
${profile.email} | ${profile.phone || ''}
Portfolio: ${profile.portfolio_url || ''} | GitHub: ${profile.github_url || ''}`;

  try {
    const result = await resend.emails.send({
      from: `${profile.full_name} <${FROM}>`,
      to: [to],
      replyTo: profile.email,
      subject: `Re: ${originalSubject}`,
      text: body,
    });

    if (result.error) return { success: false, error: result.error.message };
    return { success: true, id: result.data?.id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─── WEEKLY SUMMARY EMAIL ─────────────────────────────────────────────────

export interface WeeklyStats {
  jobs_found: number;
  jobs_applied: number;
  interviews: number;
  offers: number;
  follow_ups_sent: number;
  top_sources: Array<{ source: string; count: number }>;
  top_jobs: Array<{ title: string; company: string; score: number; status: string }>;
  response_rate: number;
}

export async function sendWeeklySummary(
  profile: UserProfile,
  stats: WeeklyStats
): Promise<void> {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekLabel = weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

  const sourceRows = stats.top_sources
    .slice(0, 6)
    .map(s => `<tr><td style="padding:8px;color:#374151">${s.source}</td><td style="padding:8px;text-align:right;color:#1d4ed8;font-weight:600">${s.count} jobs</td></tr>`)
    .join('');

  const topJobRows = stats.top_jobs
    .slice(0, 5)
    .map(j => `
      <tr style="border-bottom:1px solid #e5e7eb">
        <td style="padding:10px 8px;color:#111928;font-weight:500">${j.title}</td>
        <td style="padding:10px 8px;color:#374151">${j.company}</td>
        <td style="padding:10px 8px;text-align:center">
          <span style="background:${j.score >= 80 ? '#dcfce7' : '#fef9c3'};color:${j.score >= 80 ? '#166534' : '#854d0e'};padding:2px 8px;border-radius:99px;font-size:12px;font-weight:600">${j.score}%</span>
        </td>
        <td style="padding:10px 8px;color:#6b7280;font-size:13px">${j.status}</td>
      </tr>
    `).join('');

  const performanceColor = stats.response_rate >= 10 ? '#166534' : stats.response_rate >= 5 ? '#854d0e' : '#991b1b';
  const performanceBg = stats.response_rate >= 10 ? '#dcfce7' : stats.response_rate >= 5 ? '#fef9c3' : '#fee2e2';

  await resend.emails.send({
    from: `Job Hunter <${FROM}>`,
    to: [NOTIFY_EMAIL],
    subject: `📊 Weekly Job Hunt Summary — week of ${weekLabel}`,
    html: `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:680px;margin:0 auto;padding:20px;color:#111928">

  <div style="background:linear-gradient(135deg,#1a56db,#1e40af);padding:28px 32px;border-radius:12px;margin-bottom:24px">
    <h1 style="color:white;margin:0;font-size:22px">📊 Weekly Job Hunt Summary</h1>
    <p style="color:#bfdbfe;margin:8px 0 0">Week of ${weekLabel} · ${profile.full_name}</p>
  </div>

  <!-- Stats row -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">
    <div style="background:#dbeafe;border-radius:10px;padding:16px;text-align:center">
      <div style="font-size:30px;font-weight:800;color:#1d4ed8">${stats.jobs_found}</div>
      <div style="color:#1e40af;font-size:13px;margin-top:4px">Jobs Found</div>
    </div>
    <div style="background:#dcfce7;border-radius:10px;padding:16px;text-align:center">
      <div style="font-size:30px;font-weight:800;color:#166534">${stats.jobs_applied}</div>
      <div style="color:#15803d;font-size:13px;margin-top:4px">Applied</div>
    </div>
    <div style="background:${performanceBg};border-radius:10px;padding:16px;text-align:center">
      <div style="font-size:30px;font-weight:800;color:${performanceColor}">${stats.response_rate}%</div>
      <div style="color:${performanceColor};font-size:13px;margin-top:4px">Response Rate</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">
    <div style="background:#f3f4f6;border-radius:10px;padding:14px;text-align:center">
      <div style="font-size:24px;font-weight:700;color:#374151">${stats.interviews}</div>
      <div style="color:#6b7280;font-size:12px">Interviews</div>
    </div>
    <div style="background:#fef9c3;border-radius:10px;padding:14px;text-align:center">
      <div style="font-size:24px;font-weight:700;color:#854d0e">${stats.offers}</div>
      <div style="color:#92400e;font-size:12px">Offers</div>
    </div>
    <div style="background:#ede9fe;border-radius:10px;padding:14px;text-align:center">
      <div style="font-size:24px;font-weight:700;color:#5b21b6">${stats.follow_ups_sent}</div>
      <div style="color:#6d28d9;font-size:12px">Follow-ups Sent</div>
    </div>
  </div>

  <!-- Top sources -->
  ${sourceRows ? `
  <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:24px">
    <div style="background:#f9fafb;padding:12px 16px;font-weight:700;font-size:14px">Best Performing Sources This Week</div>
    <table style="width:100%;border-collapse:collapse">
      ${sourceRows}
    </table>
  </div>` : ''}

  <!-- Top jobs -->
  ${topJobRows ? `
  <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:24px">
    <div style="background:#f9fafb;padding:12px 16px;font-weight:700;font-size:14px">Top Matched Jobs This Week</div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f9fafb">
          <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase">Job</th>
          <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase">Company</th>
          <th style="padding:8px;text-align:center;font-size:11px;color:#6b7280;text-transform:uppercase">Match</th>
          <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase">Status</th>
        </tr>
      </thead>
      <tbody>${topJobRows}</tbody>
    </table>
  </div>` : ''}

  <!-- Motivation tip -->
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin-bottom:24px">
    <p style="margin:0;color:#166534;font-size:14px">
      💡 <strong>Tip:</strong> ${stats.response_rate < 5
        ? 'Response rate is low — try personalising your cover letter opening with something specific about each company.'
        : stats.response_rate < 10
        ? 'Good progress! Follow up on any applications older than 5 days — a short email 2x\'s your callback rate.'
        : 'Excellent response rate! Keep the momentum — apply to at least 5 more roles this week.'
      }
    </p>
  </div>

  <div style="text-align:center;margin-top:24px">
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
       style="background:#1a56db;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
      Open Dashboard →
    </a>
  </div>

  <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:20px">
    Job Hunter sends this every Monday · <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color:#1a56db">Settings</a>
  </p>
</body>
</html>`
  });

  console.log('[email] Weekly summary sent');
}