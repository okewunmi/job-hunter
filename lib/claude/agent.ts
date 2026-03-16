// // ─── FREE ALTERNATIVE: Google Gemini 1.5 Flash + Job Board APIs ──────────
// // Replace lib/claude/agent.ts with this file.
// // Get free Gemini key at: https://aistudio.google.com/app/apikey (no card needed)
// // Add GOOGLE_API_KEY to your .env.local

// import type { UserProfile, Job } from '@/types';

// const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`;

// // ─── GEMINI HELPER ────────────────────────────────────────────────────────

// async function gemini(prompt: string, maxTokens = 2000): Promise<string> {
//   const res = await fetch(GEMINI_URL, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       contents: [{ parts: [{ text: prompt }] }],
//       generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
//     })
//   });

//   if (!res.ok) {
//     if (res.status === 429 && process.env.GROQ_API_KEY) {
//       return groqFallback(prompt, maxTokens);
//     }
//     throw new Error(`Gemini error ${res.status}`);
//   }

//   const data = await res.json();
//   return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
// }

// // ─── GROQ FALLBACK (also free) ────────────────────────────────────────────
// // Sign up at groq.com — Llama 3.3 70B, 30 req/min free

// async function groqFallback(prompt: string, maxTokens = 2000): Promise<string> {
//   const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
//     },
//     body: JSON.stringify({
//       model: 'llama-3.3-70b-versatile',
//       messages: [{ role: 'user', content: prompt }],
//       max_tokens: maxTokens,
//       temperature: 0.7
//     })
//   });

//   if (!res.ok) throw new Error(`Groq error ${res.status}`);
//   const data = await res.json();
//   return data.choices?.[0]?.message?.content || '';
// }

// // ─── JOB BOARD APIs (FREE, no scraping) ──────────────────────────────────

// interface RawJobData {
//   title: string;
//   company: string;
//   location: string;
//   job_type: 'remote' | 'onsite' | 'hybrid';
//   description: string;
//   requirements: string[];
//   nice_to_have: string[];
//   apply_url: string;
//   apply_email?: string;
//   application_method: 'email' | 'form' | 'linkedin' | 'manual';
//   source: string;
//   source_id: string;
//   salary_min?: number;
//   salary_max?: number;
//   salary_currency?: string;
// }

// async function fetchRemotive(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   for (const kw of keywords.slice(0, 3)) {
//     try {
//       const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(kw)}&limit=20`;
//       const res = await fetch(url, { headers: { 'User-Agent': 'JobHunterApp/1.0' } });
//       if (!res.ok) continue;
//       const data = await res.json();
//       for (const job of data.jobs || []) {
//         results.push({
//           title: job.title,
//           company: job.company_name,
//           location: job.candidate_required_location || 'Remote',
//           job_type: 'remote',
//           description: job.description?.replace(/<[^>]*>/g, '').slice(0, 1500) || '',
//           requirements: extractRequirements(job.description || ''),
//           nice_to_have: [],
//           apply_url: job.url,
//           apply_email: undefined,
//           application_method: 'form',
//           source: 'remotive',
//           source_id: String(job.id),
//           salary_min: job.salary ? parseSalaryMin(job.salary) : undefined,
//           salary_max: job.salary ? parseSalaryMax(job.salary) : undefined,
//           salary_currency: job.salary ? detectCurrency(job.salary) : undefined,
//         });
//       }
//     } catch (e) { console.warn('[Remotive] error:', e); }
//   }
//   return dedupeJobs(results);
// }

// async function fetchJobicy(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   for (const kw of keywords.slice(0, 2)) {
//     try {
//       const url = `https://jobicy.com/api/v2/remote-jobs?tag=${encodeURIComponent(kw)}&count=20`;
//       const res = await fetch(url, { headers: { 'User-Agent': 'JobHunterApp/1.0' } });
//       if (!res.ok) continue;
//       const data = await res.json();
//       for (const job of data.jobs || []) {
//         results.push({
//           title: job.jobTitle,
//           company: job.companyName,
//           location: job.jobGeo || 'Remote',
//           job_type: 'remote',
//           description: job.jobDescription?.replace(/<[^>]*>/g, '').slice(0, 1500) || '',
//           requirements: extractRequirements(job.jobDescription || ''),
//           nice_to_have: [],
//           apply_url: job.url,
//           apply_email: undefined,
//           application_method: 'form',
//           source: 'jobicy',
//           source_id: String(job.id),
//         });
//       }
//     } catch (e) { console.warn('[Jobicy] error:', e); }
//   }
//   return dedupeJobs(results);
// }

// async function fetchRemoteOK(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   try {
//     const tags = keywords.slice(0, 2).map(k => k.toLowerCase().replace(/\s+/g, '-')).join(',');
//     const res = await fetch(`https://remoteok.com/api?tag=${encodeURIComponent(tags)}`, {
//       headers: { 'User-Agent': 'JobHunterApp/1.0', 'Accept': 'application/json' }
//     });
//     if (!res.ok) return results;
//     const data = await res.json();
//     for (const job of (data || []).slice(1, 20)) {
//       if (!job.position) continue;
//       const isEmail = job.apply_url?.startsWith('mailto:');
//       results.push({
//         title: job.position,
//         company: job.company || 'Unknown',
//         location: job.location || 'Remote',
//         job_type: 'remote',
//         description: job.description?.replace(/<[^>]*>/g, '').slice(0, 1500) || '',
//         requirements: job.tags || [],
//         nice_to_have: [],
//         apply_url: isEmail ? job.url : (job.apply_url || job.url),
//         apply_email: isEmail ? job.apply_url.replace('mailto:', '') : undefined,
//         application_method: isEmail ? 'email' : 'form',
//         source: 'remoteok',
//         source_id: String(job.id),
//         salary_min: job.salary_min,
//         salary_max: job.salary_max,
//         salary_currency: 'USD',
//       });
//     }
//   } catch (e) { console.warn('[RemoteOK] error:', e); }
//   return results;
// }

// async function fetchAdzuna(keywords: string[], locations: string[]): Promise<RawJobData[]> {
//   const appId = process.env.ADZUNA_APP_ID;
//   const appKey = process.env.ADZUNA_APP_KEY;
//   if (!appId || !appKey) return [];
//   const results: RawJobData[] = [];
//   const country = locations.some(l => l.toLowerCase().includes('nigeria') || l.toLowerCase().includes('lagos')) ? 'ng' : 'gb';
//   for (const kw of keywords.slice(0, 2)) {
//     try {
//       const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(kw)}&results_per_page=15&content-type=application/json`;
//       const res = await fetch(url);
//       if (!res.ok) continue;
//       const data = await res.json();
//       for (const job of data.results || []) {
//         const emailMatch = job.description?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
//         results.push({
//           title: job.title,
//           company: job.company?.display_name || 'Unknown',
//           location: job.location?.display_name || 'Nigeria',
//           job_type: job.title?.toLowerCase().includes('remote') ? 'remote' : 'onsite',
//           description: job.description?.slice(0, 1500) || '',
//           requirements: extractRequirements(job.description || ''),
//           nice_to_have: [],
//           apply_url: job.redirect_url,
//           apply_email: emailMatch?.[0],
//           application_method: emailMatch ? 'email' : 'manual',
//           source: 'adzuna',
//           source_id: String(job.id),
//           salary_min: job.salary_min,
//           salary_max: job.salary_max,
//           salary_currency: country === 'ng' ? 'NGN' : 'USD',
//         });
//       }
//     } catch (e) { console.warn('[Adzuna] error:', e); }
//   }
//   return results;
// }

// // ─── MAIN SEARCH FUNCTION ─────────────────────────────────────────────────

// export async function searchForJobs(profile: UserProfile): Promise<
//   Array<Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
// > {
//   const keywords = ['React Native', 'React Native Developer', 'Frontend Developer', 'Mobile Developer'];
//   console.log('[search] Fetching from Remotive, Jobicy, RemoteOK, Adzuna...');

//   const [remotive, jobicy, remoteok, adzuna] = await Promise.allSettled([
//     fetchRemotive(keywords),
//     fetchJobicy(keywords),
//     fetchRemoteOK(keywords),
//     fetchAdzuna(keywords, profile.preferred_locations)
//   ]);

//   const all: RawJobData[] = [
//     ...(remotive.status === 'fulfilled' ? remotive.value : []),
//     ...(jobicy.status === 'fulfilled' ? jobicy.value : []),
//     ...(remoteok.status === 'fulfilled' ? remoteok.value : []),
//     ...(adzuna.status === 'fulfilled' ? adzuna.value : []),
//   ];

//   console.log(`[search] Found ${all.length} raw jobs`);
//   return all.map(j => ({
//     ...j, match_score: 0, match_reasons: [],
//     status: 'found' as const, found_at: new Date().toISOString(),
//   }));
// }

// // ─── JOB MATCH SCORING (Gemini) ───────────────────────────────────────────

// export async function scoreJobMatch(
//   job: Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
//   profile: UserProfile
// ): Promise<{ score: number; reasons: string[] }> {
//   const prompt = `Rate how well this job matches this candidate. Return ONLY valid JSON.

// CANDIDATE SKILLS: ${profile.skills.join(', ')}
// EXPERIENCE: ${profile.years_experience} years
// JOB: ${job.title} at ${job.company}
// REQUIREMENTS: ${job.requirements.join(', ')}
// DESCRIPTION: ${job.description.slice(0, 500)}

// Return: {"score": 75, "reasons": ["reason 1", "reason 2"]}`;

//   try {
//     const text = await gemini(prompt, 300);
//     const match = text.match(/\{[\s\S]*\}/);
//     if (!match) return keywordScore(job, profile);
//     return JSON.parse(match[0]);
//   } catch {
//     return keywordScore(job, profile);
//   }
// }

// // ─── COVER LETTER GENERATOR (Gemini) ─────────────────────────────────────

// export async function generateCoverLetter(job: Job, profile: UserProfile): Promise<{ content: string; subject_line: string }> {
//   const prompt = `Write a compelling cover letter. Return ONLY valid JSON (no markdown).

// CANDIDATE: ${profile.full_name}, ${profile.years_experience} yrs exp, skills: ${profile.skills.join(', ')}
// EMAIL: ${profile.email} | PHONE: ${profile.phone || ''} | PORTFOLIO: ${profile.portfolio_url || ''} | GITHUB: ${profile.github_url || ''}
// JOB: ${job.title} at ${job.company}
// REQUIREMENTS: ${job.requirements.slice(0, 6).join(', ')}
// DESCRIPTION: ${job.description.slice(0, 600)}

// Write 3-4 paragraphs. Be specific. End with signature. No clichés.
// Return: {"content": "Dear Hiring Manager,\\n\\n...", "subject_line": "Subject here"}`;

//   try {
//     const text = await gemini(prompt, 1200);
//     const match = text.match(/\{[\s\S]*\}/);
//     if (!match) return fallbackCoverLetter(job, profile);
//     return JSON.parse(match[0]);
//   } catch {
//     return fallbackCoverLetter(job, profile);
//   }
// }

// export async function optimizeCVForJob(cvText: string, job: Job): Promise<string> {
//   const prompt = `Optimize this CV for the job below. Keep facts accurate. Return only CV text.\n\nJOB: ${job.title} at ${job.company}\nREQUIREMENTS: ${job.requirements.slice(0, 6).join(', ')}\n\nCV:\n${cvText}`;
//   try { return await gemini(prompt, 2000); } catch { return cvText; }
// }

// // ─── UTILS ────────────────────────────────────────────────────────────────

// function extractRequirements(description: string): string[] {
//   const keywords = ['React Native','TypeScript','JavaScript','Next.js','React','Redux','Node.js','Firebase','Expo','iOS','Android','Git','Figma','REST API','GraphQL','Tailwind'];
//   return keywords.filter(k => description.toLowerCase().includes(k.toLowerCase())).slice(0, 10);
// }

// function parseSalaryMin(s: string): number | undefined {
//   const nums = s.match(/[\d,]+/g);
//   return nums ? parseInt(nums[0].replace(/,/g, '')) : undefined;
// }

// function parseSalaryMax(s: string): number | undefined {
//   const nums = s.match(/[\d,]+/g);
//   return nums && nums.length > 1 ? parseInt(nums[nums.length - 1].replace(/,/g, '')) : undefined;
// }

// function detectCurrency(s: string): string {
//   if (s.includes('$')) return 'USD';
//   if (s.includes('£')) return 'GBP';
//   if (s.includes('₦')) return 'NGN';
//   return 'USD';
// }

// function dedupeJobs(jobs: RawJobData[]): RawJobData[] {
//   const seen = new Set<string>();
//   return jobs.filter(j => {
//     const key = `${j.source}:${j.source_id}`;
//     if (seen.has(key)) return false;
//     seen.add(key);
//     return true;
//   });
// }

// function keywordScore(job: Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>, profile: UserProfile): { score: number; reasons: string[] } {
//   const desc = (job.description + ' ' + job.requirements.join(' ')).toLowerCase();
//   let score = 30;
//   const reasons: string[] = [];
//   for (const skill of ['react native', 'typescript', 'javascript', 'react']) {
//     if (desc.includes(skill) && profile.skills.some(s => s.toLowerCase().includes(skill))) {
//       score += 15; reasons.push(`Matches ${skill}`);
//     }
//   }
//   for (const skill of ['next.js', 'redux', 'tailwind', 'firebase', 'expo']) {
//     if (desc.includes(skill) && profile.skills.some(s => s.toLowerCase().includes(skill))) score += 4;
//   }
//   if (job.location?.toLowerCase().includes('remote')) { score += 5; reasons.push('Remote position'); }
//   return { score: Math.min(score, 92), reasons };
// }

// function fallbackCoverLetter(job: Job, profile: UserProfile): { content: string; subject_line: string } {
//   return {
//     content: `Dear Hiring Manager,\n\nI am excited to apply for the ${job.title} role at ${job.company}. With ${profile.years_experience}+ years of hands-on experience in React Native and frontend development, I have built production-grade mobile and web applications that are both performant and user-focused.\n\nMy core skills — ${profile.skills.slice(0, 5).join(', ')} — align directly with your requirements. Across my roles, I have integrated complex APIs, enforced mobile security best practices, and worked closely with designers and backend teams to ship high-quality features on time.\n\nI am drawn to ${job.company} and believe my technical background and product instincts would make a genuine contribution to your team.\n\nThank you for your time and consideration. I would love the opportunity to discuss further.\n\nBest regards,\n${profile.full_name}\n${profile.email} | ${profile.phone || ''}\nPortfolio: ${profile.portfolio_url || ''} | GitHub: ${profile.github_url || ''}`,
//     subject_line: `${job.title} Application — ${profile.full_name}`
//   };
// }

import type { UserProfile, Job } from '@/types';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`;

// ─── AI HELPERS ───────────────────────────────────────────────────────────

async function gemini(prompt: string, maxTokens = 2000): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
    })
  });
  if (!res.ok) {
    if (res.status === 429 && process.env.GROQ_API_KEY) return groqFallback(prompt, maxTokens);
    throw new Error(`Gemini error ${res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function groqFallback(prompt: string, maxTokens = 2000): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens, temperature: 0.7
    })
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ─── TYPES ────────────────────────────────────────────────────────────────

interface RawJobData {
  title: string;
  company: string;
  location: string;
  job_type: 'remote' | 'onsite' | 'hybrid';
  description: string;
  requirements: string[];
  nice_to_have: string[];
  apply_url: string;
  apply_email?: string;
  application_method: 'email' | 'form' | 'linkedin' | 'manual';
  source: string;
  source_id: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
}

// ─── SOURCE 1: REMOTIVE ───────────────────────────────────────────────────
// Free, no key. 100s of remote jobs.

async function fetchRemotive(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords) {
    try {
      const res = await fetch(
        `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(kw)}&limit=30`,
        { headers: { 'User-Agent': 'JobHunterApp/1.0' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of data.jobs || []) {
        results.push({
          title: job.title,
          company: job.company_name,
          location: job.candidate_required_location || 'Remote',
          job_type: 'remote',
          description: job.description?.replace(/<[^>]*>/g, '').slice(0, 2000) || '',
          requirements: extractRequirements(job.description || ''),
          nice_to_have: [],
          apply_url: job.url,
          apply_email: extractEmail(job.description || ''),
          application_method: extractEmail(job.description || '') ? 'email' : 'form',
          source: 'remotive',
          source_id: String(job.id),
          salary_min: job.salary ? parseSalaryMin(job.salary) : undefined,
          salary_max: job.salary ? parseSalaryMax(job.salary) : undefined,
          salary_currency: job.salary ? detectCurrency(job.salary) : 'USD',
        });
      }
    } catch (e) { console.warn('[Remotive] error:', e); }
  }
  return results;
}

// ─── SOURCE 2: JOBICY ─────────────────────────────────────────────────────
// Free, no key.

async function fetchJobicy(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords) {
    try {
      const res = await fetch(
        `https://jobicy.com/api/v2/remote-jobs?tag=${encodeURIComponent(kw)}&count=30`,
        { headers: { 'User-Agent': 'JobHunterApp/1.0' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of data.jobs || []) {
        results.push({
          title: job.jobTitle,
          company: job.companyName,
          location: job.jobGeo || 'Remote',
          job_type: 'remote',
          description: job.jobDescription?.replace(/<[^>]*>/g, '').slice(0, 2000) || '',
          requirements: extractRequirements(job.jobDescription || ''),
          nice_to_have: [],
          apply_url: job.url,
          apply_email: extractEmail(job.jobDescription || ''),
          application_method: extractEmail(job.jobDescription || '') ? 'email' : 'form',
          source: 'jobicy',
          source_id: String(job.id),
        });
      }
    } catch (e) { console.warn('[Jobicy] error:', e); }
  }
  return results;
}

// ─── SOURCE 3: REMOTEOK ───────────────────────────────────────────────────
// Free, no key.

async function fetchRemoteOK(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords.slice(0, 2)) {
    try {
      const tag = kw.toLowerCase().replace(/\s+/g, '-');
      const res = await fetch(
        `https://remoteok.com/api?tag=${encodeURIComponent(tag)}`,
        { headers: { 'User-Agent': 'JobHunterApp/1.0', 'Accept': 'application/json' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of (data || []).slice(1, 30)) {
        if (!job.position) continue;
        const isEmail = job.apply_url?.startsWith('mailto:');
        results.push({
          title: job.position,
          company: job.company || 'Unknown',
          location: job.location || 'Remote',
          job_type: 'remote',
          description: job.description?.replace(/<[^>]*>/g, '').slice(0, 2000) || '',
          requirements: job.tags || [],
          nice_to_have: [],
          apply_url: isEmail ? job.url : (job.apply_url || job.url),
          apply_email: isEmail ? job.apply_url.replace('mailto:', '') : extractEmail(job.description || ''),
          application_method: isEmail ? 'email' : 'form',
          source: 'remoteok',
          source_id: String(job.id),
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          salary_currency: 'USD',
        });
      }
    } catch (e) { console.warn('[RemoteOK] error:', e); }
  }
  return results;
}

// ─── SOURCE 4: WE WORK REMOTELY (RSS → JSON) ──────────────────────────────
// Free, no key. One of the best remote job boards.

async function fetchWeWorkRemotely(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  const categories = ['programming', 'front-end', 'mobile-programming'];

  for (const cat of categories) {
    try {
      const res = await fetch(
        `https://weworkremotely.com/categories/remote-${cat}-jobs.rss`,
        { headers: { 'User-Agent': 'JobHunterApp/1.0' } }
      );
      if (!res.ok) continue;
      const xml = await res.text();

      // Parse RSS items
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
      for (const item of items.slice(0, 20)) {
        const title = stripCDATA(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
        const company = stripCDATA(item.match(/<company>([\s\S]*?)<\/company>/)?.[1] || 'Unknown');
        const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || '';
        const desc = stripCDATA(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '');
        const region = stripCDATA(item.match(/<region>([\s\S]*?)<\/region>/)?.[1] || 'Worldwide');
        const guid = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1]?.trim() || link;

        // Only include if matches our keywords
        const combined = (title + ' ' + desc).toLowerCase();
        const matches = keywords.some(kw => combined.includes(kw.toLowerCase()));
        if (!matches) continue;

        const cleanDesc = desc.replace(/<[^>]*>/g, '').slice(0, 2000);
        results.push({
          title,
          company,
          location: region || 'Remote',
          job_type: 'remote',
          description: cleanDesc,
          requirements: extractRequirements(cleanDesc),
          nice_to_have: [],
          apply_url: link,
          apply_email: extractEmail(cleanDesc),
          application_method: extractEmail(cleanDesc) ? 'email' : 'form',
          source: 'weworkremotely',
          source_id: guid.split('/').pop() || guid,
        });
      }
    } catch (e) { console.warn('[WeWorkRemotely] error:', e); }
  }
  return results;
}

// ─── SOURCE 5: HIMALAYAS ──────────────────────────────────────────────────
// Free JSON API, no key needed.

async function fetchHimalayas(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords.slice(0, 3)) {
    try {
      const res = await fetch(
        `https://himalayas.app/jobs/api?q=${encodeURIComponent(kw)}&limit=20`,
        { headers: { 'User-Agent': 'JobHunterApp/1.0' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of data.jobs || []) {
        results.push({
          title: job.title,
          company: job.company?.name || 'Unknown',
          location: job.locationRestrictions?.join(', ') || 'Remote',
          job_type: 'remote',
          description: job.description?.replace(/<[^>]*>/g, '').slice(0, 2000) || '',
          requirements: extractRequirements(job.description || ''),
          nice_to_have: [],
          apply_url: job.applicationLink || `https://himalayas.app/jobs/${job.slug}`,
          apply_email: extractEmail(job.description || ''),
          application_method: extractEmail(job.description || '') ? 'email' : 'form',
          source: 'himalayas',
          source_id: job.id || job.slug,
        });
      }
    } catch (e) { console.warn('[Himalayas] error:', e); }
  }
  return results;
}

// ─── SOURCE 6: ARBEITNOW ──────────────────────────────────────────────────
// Free JSON API, no key. Good for remote + visa-sponsored roles.

async function fetchArbeitnow(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords.slice(0, 2)) {
    try {
      const res = await fetch(
        `https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(kw)}&remote=true`,
        { headers: { 'User-Agent': 'JobHunterApp/1.0' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of (data.data || []).slice(0, 20)) {
        results.push({
          title: job.title,
          company: job.company_name || 'Unknown',
          location: job.location || 'Remote',
          job_type: job.remote ? 'remote' : 'onsite',
          description: job.description?.replace(/<[^>]*>/g, '').slice(0, 2000) || '',
          requirements: extractRequirements(job.description || ''),
          nice_to_have: [],
          apply_url: job.url,
          apply_email: extractEmail(job.description || ''),
          application_method: extractEmail(job.description || '') ? 'email' : 'form',
          source: 'arbeitnow',
          source_id: job.slug || String(job.id),
        });
      }
    } catch (e) { console.warn('[Arbeitnow] error:', e); }
  }
  return results;
}

// ─── SOURCE 7: FINDWORK ───────────────────────────────────────────────────
// Free, no key.

async function fetchFindwork(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords.slice(0, 2)) {
    try {
      const res = await fetch(
        `https://findwork.dev/api/jobs/?search=${encodeURIComponent(kw)}&remote=true`,
        { headers: { 'User-Agent': 'JobHunterApp/1.0' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of (data.results || []).slice(0, 20)) {
        results.push({
          title: job.role,
          company: job.company_name || 'Unknown',
          location: job.location || 'Remote',
          job_type: job.remote ? 'remote' : 'onsite',
          description: job.text?.replace(/<[^>]*>/g, '').slice(0, 2000) || '',
          requirements: job.keywords || [],
          nice_to_have: [],
          apply_url: job.url,
          apply_email: extractEmail(job.text || ''),
          application_method: extractEmail(job.text || '') ? 'email' : 'form',
          source: 'findwork',
          source_id: String(job.id),
        });
      }
    } catch (e) { console.warn('[Findwork] error:', e); }
  }
  return results;
}

// ─── SOURCE 8: ADZUNA ─────────────────────────────────────────────────────
// Free tier 250 calls/day. Sign up at developer.adzuna.com

async function fetchAdzuna(keywords: string[], locations: string[]): Promise<RawJobData[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const results: RawJobData[] = [];
  const isNigeria = locations.some(l => l.toLowerCase().includes('nigeria') || l.toLowerCase().includes('lagos'));
  const countries = isNigeria ? ['ng', 'gb', 'us'] : ['gb', 'us'];

  for (const country of countries) {
    for (const kw of keywords.slice(0, 2)) {
      try {
        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(kw)}&results_per_page=20&content-type=application/json`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        for (const job of data.results || []) {
          const emailMatch = job.description?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          results.push({
            title: job.title,
            company: job.company?.display_name || 'Unknown',
            location: job.location?.display_name || (country === 'ng' ? 'Nigeria' : 'Remote'),
            job_type: job.title?.toLowerCase().includes('remote') ? 'remote' : 'onsite',
            description: job.description?.slice(0, 2000) || '',
            requirements: extractRequirements(job.description || ''),
            nice_to_have: [],
            apply_url: job.redirect_url,
            apply_email: emailMatch?.[0],
            application_method: emailMatch ? 'email' : 'manual',
            source: 'adzuna',
            source_id: String(job.id),
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            salary_currency: country === 'ng' ? 'NGN' : 'USD',
          });
        }
      } catch (e) { console.warn('[Adzuna] error:', e); }
    }
  }
  return results;
}

// ─── SOURCE 9: THE MUSE ───────────────────────────────────────────────────
// Free, no key needed.

async function fetchTheMuse(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords.slice(0, 2)) {
    try {
      const res = await fetch(
        `https://www.themuse.com/api/public/jobs?category=Software%20Engineer&level=Mid%20Level&location=Flexible%20%2F%20Remote&page=1&descending=true`,
        { headers: { 'User-Agent': 'JobHunterApp/1.0' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of (data.results || []).slice(0, 15)) {
        const desc = job.contents?.replace(/<[^>]*>/g, '') || '';
        const combined = (job.name + ' ' + desc).toLowerCase();
        if (!keywords.some(k => combined.includes(k.toLowerCase()))) continue;
        results.push({
          title: job.name,
          company: job.company?.name || 'Unknown',
          location: job.locations?.map((l: any) => l.name).join(', ') || 'Remote',
          job_type: 'remote',
          description: desc.slice(0, 2000),
          requirements: extractRequirements(desc),
          nice_to_have: [],
          apply_url: job.refs?.landing_page || `https://www.themuse.com/jobs/${job.id}`,
          apply_email: extractEmail(desc),
          application_method: extractEmail(desc) ? 'email' : 'form',
          source: 'themuse',
          source_id: String(job.id),
        });
      }
    } catch (e) { console.warn('[TheMuse] error:', e); }
  }
  return results;
}

// ─── SOURCE 10: GREENHOUSE (via public API) ───────────────────────────────
// Scrapes job boards of companies that use Greenhouse ATS — many tech startups.

async function fetchGreenhouse(): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  // Companies known to hire React Native developers
  const companies = [
    'flutterwave', 'andela', 'paystack', 'interswitch',
    'stripe', 'shopify', 'gitlab', 'hashicorp', 'notion'
  ];

  for (const company of companies) {
    try {
      const res = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`,
        { headers: { 'User-Agent': 'JobHunterApp/1.0' } }
      );
      if (!res.ok) continue;
      const data = await res.json();

      for (const job of (data.jobs || []).slice(0, 10)) {
        const title = (job.title || '').toLowerCase();
        // Only include frontend/mobile roles
        if (!['react', 'native', 'frontend', 'front-end', 'mobile', 'javascript'].some(k => title.includes(k))) continue;

        const desc = job.content?.replace(/<[^>]*>/g, '') || '';
        results.push({
          title: job.title,
          company: data.name || company,
          location: job.location?.name || 'Remote',
          job_type: job.location?.name?.toLowerCase().includes('remote') ? 'remote' : 'onsite',
          description: desc.slice(0, 2000),
          requirements: extractRequirements(desc),
          nice_to_have: [],
          apply_url: job.absolute_url || `https://boards.greenhouse.io/${company}/jobs/${job.id}`,
          apply_email: extractEmail(desc),
          application_method: extractEmail(desc) ? 'email' : 'form',
          source: 'greenhouse',
          source_id: `${company}-${job.id}`,
        });
      }
    } catch (e) { /* silent — many companies won't have a board */ }
  }
  return results;
}

// ─── MAIN SEARCH FUNCTION ─────────────────────────────────────────────────

export async function searchForJobs(profile: UserProfile): Promise<
  Array<Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
> {
  // Broad keywords — mobile-focused to cast the widest net
  const keywords = [
    'React Native',
    'React Native Developer',
    'Mobile App Developer',
    'Mobile Developer',
    'Mobile Engineer',
    'iOS Android Developer',
    'Cross Platform Developer',
    'Expo React Native',
    'Frontend Developer',
    'React Developer',
    'JavaScript Developer',
    'TypeScript Developer',
  ];

  console.log('[search] Fetching from 10 sources in parallel...');

  const [
    remotive, jobicy, remoteok, wwr, himalayas,
    arbeitnow, findwork, adzuna, themuse, greenhouse
  ] = await Promise.allSettled([
    fetchRemotive(keywords.slice(0, 6)),
    fetchJobicy(keywords.slice(0, 6)),
    fetchRemoteOK(keywords.slice(0, 4)),
    fetchWeWorkRemotely(keywords),
    fetchHimalayas(keywords.slice(0, 5)),
    fetchArbeitnow(keywords.slice(0, 4)),
    fetchFindwork(keywords.slice(0, 4)),
    fetchAdzuna(keywords.slice(0, 4), profile.preferred_locations),
    fetchTheMuse(keywords.slice(0, 4)),
    fetchGreenhouse(),
  ]);

  const all: RawJobData[] = [
    ...(remotive.status === 'fulfilled' ? remotive.value : []),
    ...(jobicy.status === 'fulfilled' ? jobicy.value : []),
    ...(remoteok.status === 'fulfilled' ? remoteok.value : []),
    ...(wwr.status === 'fulfilled' ? wwr.value : []),
    ...(himalayas.status === 'fulfilled' ? himalayas.value : []),
    ...(arbeitnow.status === 'fulfilled' ? arbeitnow.value : []),
    ...(findwork.status === 'fulfilled' ? findwork.value : []),
    ...(adzuna.status === 'fulfilled' ? adzuna.value : []),
    ...(themuse.status === 'fulfilled' ? themuse.value : []),
    ...(greenhouse.status === 'fulfilled' ? greenhouse.value : []),
  ];

  const deduped = dedupeJobs(all);
  console.log(`[search] Raw: ${all.length} → After dedupe: ${deduped.length} jobs from 10 sources`);

  return deduped.map(j => ({
    ...j,
    match_score: 0,
    match_reasons: [],
    status: 'found' as const,
    found_at: new Date().toISOString(),
  }));
}

// ─── SCORING, COVER LETTER, CV OPTIMIZER (unchanged) ─────────────────────

export async function scoreJobMatch(
  job: Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  profile: UserProfile
): Promise<{ score: number; reasons: string[] }> {
  const prompt = `Rate how well this job matches this candidate. Return ONLY valid JSON.

CANDIDATE SKILLS: ${profile.skills.join(', ')}
EXPERIENCE: ${profile.years_experience} years
JOB: ${job.title} at ${job.company}
REQUIREMENTS: ${job.requirements.join(', ')}
DESCRIPTION: ${job.description.slice(0, 500)}

Return: {"score": 75, "reasons": ["reason 1", "reason 2"]}`;

  try {
    const text = await gemini(prompt, 300);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return keywordScore(job, profile);
    return JSON.parse(match[0]);
  } catch {
    return keywordScore(job, profile);
  }
}

export async function generateCoverLetter(job: Job, profile: UserProfile): Promise<{ content: string; subject_line: string }> {
  const prompt = `Write a compelling cover letter. Return ONLY valid JSON (no markdown).

CANDIDATE: ${profile.full_name}, ${profile.years_experience} yrs exp, skills: ${profile.skills.join(', ')}
EMAIL: ${profile.email} | PHONE: ${profile.phone || ''} | PORTFOLIO: ${profile.portfolio_url || ''} | GITHUB: ${profile.github_url || ''}
JOB: ${job.title} at ${job.company}
REQUIREMENTS: ${job.requirements.slice(0, 6).join(', ')}
DESCRIPTION: ${job.description.slice(0, 600)}

Write 3-4 paragraphs. Be specific. End with signature. No clichés.
Return: {"content": "Dear Hiring Manager,\\n\\n...", "subject_line": "Subject here"}`;

  try {
    const text = await gemini(prompt, 1200);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return fallbackCoverLetter(job, profile);
    return JSON.parse(match[0]);
  } catch {
    return fallbackCoverLetter(job, profile);
  }
}

export async function optimizeCVForJob(cvText: string, job: Job): Promise<string> {
  const prompt = `Optimize this CV for the job below. Keep facts accurate. Return only CV text.\n\nJOB: ${job.title} at ${job.company}\nREQUIREMENTS: ${job.requirements.slice(0, 6).join(', ')}\n\nCV:\n${cvText}`;
  try { return await gemini(prompt, 2000); } catch { return cvText; }
}

// ─── UTILITIES ────────────────────────────────────────────────────────────

function extractRequirements(description: string): string[] {
  const keywords = [
    'React Native', 'TypeScript', 'JavaScript', 'Next.js', 'React',
    'Redux', 'Node.js', 'Firebase', 'Expo', 'iOS', 'Android', 'Git',
    'Figma', 'REST API', 'GraphQL', 'Tailwind', 'MobX', 'Context API',
    'React Navigation', 'CI/CD', 'App Store', 'Google Play', 'AWS',
  ];
  return keywords.filter(k => description.toLowerCase().includes(k.toLowerCase())).slice(0, 12);
}

function extractEmail(text: string): string | undefined {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  // Exclude common non-apply emails
  if (!match) return undefined;
  const email = match[0].toLowerCase();
  if (email.includes('example') || email.includes('noreply') || email.includes('support')) return undefined;
  return match[0];
}

function stripCDATA(str: string): string {
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim();
}

function parseSalaryMin(s: string): number | undefined {
  const nums = s.match(/[\d,]+/g);
  return nums ? parseInt(nums[0].replace(/,/g, '')) : undefined;
}

function parseSalaryMax(s: string): number | undefined {
  const nums = s.match(/[\d,]+/g);
  return nums && nums.length > 1 ? parseInt(nums[nums.length - 1].replace(/,/g, '')) : undefined;
}

function detectCurrency(s: string): string {
  if (s.includes('$')) return 'USD';
  if (s.includes('£')) return 'GBP';
  if (s.includes('₦')) return 'NGN';
  return 'USD';
}

function dedupeJobs(jobs: RawJobData[]): RawJobData[] {
  const seen = new Set<string>();
  return jobs.filter(j => {
    const key = `${j.source}:${j.source_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function keywordScore(
  job: Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  profile: UserProfile
): { score: number; reasons: string[] } {
  const desc = (job.description + ' ' + job.requirements.join(' ')).toLowerCase();
  let score = 30;
  const reasons: string[] = [];
  for (const skill of ['react native', 'typescript', 'javascript', 'react']) {
    if (desc.includes(skill) && profile.skills.some(s => s.toLowerCase().includes(skill))) {
      score += 15; reasons.push(`Matches ${skill}`);
    }
  }
  for (const skill of ['next.js', 'redux', 'tailwind', 'firebase', 'expo', 'node.js']) {
    if (desc.includes(skill) && profile.skills.some(s => s.toLowerCase().includes(skill))) score += 4;
  }
  if (job.location?.toLowerCase().includes('remote')) { score += 5; reasons.push('Remote position'); }
  return { score: Math.min(score, 92), reasons };
}

function fallbackCoverLetter(job: Job, profile: UserProfile): { content: string; subject_line: string } {
  return {
    content: `Dear Hiring Manager,\n\nI am excited to apply for the ${job.title} role at ${job.company}. With ${profile.years_experience}+ years of hands-on experience in React Native and frontend development, I have built production-grade mobile and web applications that are both performant and user-focused.\n\nMy core skills — ${profile.skills.slice(0, 5).join(', ')} — align directly with your requirements. Across my roles, I have integrated complex APIs, enforced mobile security best practices, and worked closely with designers and backend teams to ship high-quality features on time.\n\nI am drawn to ${job.company} and believe my technical background and product instincts would make a genuine contribution to your team.\n\nThank you for your time and consideration.\n\nBest regards,\n${profile.full_name}\n${profile.email} | ${profile.phone || ''}\nPortfolio: ${profile.portfolio_url || ''} | GitHub: ${profile.github_url || ''}`,
    subject_line: `${job.title} Application — ${profile.full_name}`
  };
}