# 🎯 Job Hunter — AI-Powered Automated Job Search

An AI agent that finds React Native & Frontend Developer jobs across LinkedIn, Indeed, We Work Remotely, Glassdoor, and company sites — then auto-applies by email, generates tailored cover letters, and sends you notifications. Built with Next.js, Supabase, Claude AI, and Resend.

---

## 🗺️ How It Works

```
Every 3 hours (Vercel Cron):
  1. Claude AI searches the web for jobs matching your profile
  2. Each job is AI-scored for match quality (0–100%)
  3. Low-score jobs (<60%) are discarded
  4. A tailored cover letter is generated for each job
  5. If the job accepts email applications → auto-applies
  6. If the job needs manual apply (form/LinkedIn) → emails YOU with cover letter
  7. Everything is logged to your dashboard
```

---

## 🚀 Setup (Step by Step)

### Step 1 — Install dependencies
```bash
cd job-hunter
npm install
```

### Step 2 — Set up Supabase
1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to **SQL Editor** → paste the entire contents of `supabase-schema.sql` → Run
3. Go to **Project Settings → API** and copy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 3 — Set up Resend
1. Go to [resend.com](https://resend.com) and create an account
2. Add and verify your domain (or use their free test domain)
3. Create an API key → `RESEND_API_KEY`
4. Set `RESEND_FROM_EMAIL` to a verified sender email
5. Set `NOTIFICATION_EMAIL` to `okewunmiafeezolaide@gmail.com`

### Step 4 — Get Anthropic API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key → `ANTHROPIC_API_KEY`
3. Make sure you have web search enabled (it's a beta feature — add billing to enable)

### Step 5 — Create your .env.local
```bash
cp .env.local.example .env.local
# Fill in all values
```

### Step 6 — Create your profile in Supabase
Run this in Supabase SQL Editor (replace with your real details):
```sql
INSERT INTO profiles (
  email, full_name, phone, location, portfolio_url,
  github_url, linkedin_url, years_experience,
  job_titles, skills, salary_min, salary_max, salary_currency,
  preferred_locations, search_active, search_interval_hours
) VALUES (
  'okewunmiafeezolaide@gmail.com',
  'Okewunmi Afeez Olaide',
  '+2348187995833',
  'Yaba, Lagos, Nigeria',
  'https://okewunmi.netlify.app',
  'https://github.com/okewunmi',
  'https://www.linkedin.com/in/okewunmi/',
  4,
  ARRAY['React Native Developer', 'Frontend Developer', 'Mobile Developer'],
  ARRAY['React Native', 'TypeScript', 'React.js', 'Next.js', 'JavaScript', 'Redux', 'Tailwind CSS', 'Firebase', 'Appwrite', 'Node.js', 'Git', 'Figma', 'HTML5', 'CSS3', 'Expo'],
  300000, 600000, 'NGN',
  ARRAY['Remote (Worldwide)', 'Remote (Africa)', 'Lagos', 'Ibadan'],
  true, 3
);
```

Then copy the UUID from the result and paste it into `.env.local`:
```
PROFILE_ID=paste-uuid-here
```

### Step 7 — Upload your CV
```bash
npm run dev
```
Go to `http://localhost:3000/dashboard/settings` → CV tab → upload your PDF or DOCX.

### Step 8 — Test the search manually
```bash
curl -X POST http://localhost:3000/api/cron \
  -H "Authorization: Bearer your-CRON_SECRET-value"
```
This triggers a full search cycle. Check your dashboard for results.

### Step 9 — Deploy to Vercel
```bash
npm install -g vercel
vercel
```
Add all `.env.local` variables as **Environment Variables** in the Vercel dashboard.

The `vercel.json` cron config will automatically run the search every 3 hours.

---

## 📁 Project Structure

```
job-hunter/
├── app/
│   ├── api/
│   │   ├── cron/route.ts          ← Main automated search engine
│   │   ├── jobs/route.ts           ← Jobs API (list, filter)
│   │   ├── jobs/[id]/route.ts      ← Update/delete job
│   │   ├── jobs/profile/route.ts   ← Profile CRUD
│   │   ├── cover-letter/route.ts   ← Generate cover letters
│   │   ├── apply/route.ts          ← Send email applications
│   │   ├── cv/route.ts             ← Upload & parse CV
│   │   └── dashboard/jobs/route.ts ← Stats API
│   ├── dashboard/
│   │   ├── page.tsx                ← Overview with stats
│   │   ├── jobs/page.tsx           ← Jobs list with filters
│   │   ├── cover-letters/page.tsx  ← All cover letters
│   │   └── settings/page.tsx       ← Profile & config
│   ├── globals.css
│   └── layout.tsx
├── lib/
│   ├── supabase/client.ts          ← DB clients
│   ├── claude/agent.ts             ← AI search + scoring + cover letters
│   └── resend/email.ts             ← Email notifications
├── types/index.ts                  ← All TypeScript types
├── supabase-schema.sql             ← Run this in Supabase
└── vercel.json                     ← Cron schedule config
```

---

## 🔄 Cron Schedule

The cron runs automatically on Vercel:
- **Free plan**: Cron jobs are supported
- **Schedule**: `0 */3 * * *` = every 3 hours at :00

To change interval, edit `vercel.json`:
```json
"schedule": "0 */6 * * *"   // every 6 hours
"schedule": "0 0 * * *"     // once daily at midnight
```

---

## 📧 Email Flows

| Trigger | Email sent to |
|---------|--------------|
| New jobs found (batch) | You (notification digest) |
| Job auto-applied via email | Application email → company + confirmation to you |
| Job needs manual apply | You (with cover letter to copy) |

---

## 🔑 Environment Variables Reference

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `RESEND_API_KEY` | resend.com → API Keys |
| `RESEND_FROM_EMAIL` | Your verified Resend sender email |
| `NOTIFICATION_EMAIL` | Your personal email for alerts |
| `CRON_SECRET` | Any random string (protect the cron endpoint) |
| `PROFILE_ID` | Your profile UUID from Supabase |

---

## 💡 Tips to Get Hired Faster

1. **Upload your best CV** in Settings → the AI uses it for matching and cover letters
2. **Check "Action Needed" jobs** daily — these are the ones where you can apply directly
3. **High match score jobs (80%+)** are your best bets — prioritize them
4. **Customize cover letters** before applying manually — click Regenerate if the first one isn't right
5. **Update your status** to "Interview" or "Offer" to track your pipeline

---

## 🛠 Built With

- **Next.js 14** — App Router, API Routes, Server Components
- **Supabase** — PostgreSQL database, Row Level Security
- **Anthropic Claude** — Job search agent, scoring, cover letter generation
- **Resend** — Email delivery for notifications and applications
- **Vercel** — Hosting + Cron jobs
- **Tailwind CSS** — Styling
