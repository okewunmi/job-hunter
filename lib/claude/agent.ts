// import type { UserProfile, Job } from '@/types';

// // ─── AI HELPERS ───────────────────────────────────────────────────────────

// const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`;

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
//     if (res.status === 429 && process.env.GROQ_API_KEY) return groqFallback(prompt, maxTokens);
//     throw new Error(`Gemini error ${res.status}`);
//   }
//   const data = await res.json();
//   return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
// }

// async function groqFallback(prompt: string, maxTokens = 2000): Promise<string> {
//   const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
//     body: JSON.stringify({
//       model: 'llama-3.3-70b-versatile',
//       messages: [{ role: 'user', content: prompt }],
//       max_tokens: maxTokens, temperature: 0.7
//     })
//   });
//   if (!res.ok) throw new Error(`Groq error ${res.status}`);
//   const data = await res.json();
//   return data.choices?.[0]?.message?.content || '';
// }

// // ─── TYPES ────────────────────────────────────────────────────────────────

// export interface RawJobData {
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
//   posted_at?: string;
// }

// // ─── HTTP HELPER WITH RETRY ───────────────────────────────────────────────

// async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 1): Promise<Response> {
//   const headers = {
//     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
//     'Accept': 'application/json, text/html, */*',
//     'Accept-Language': 'en-US,en;q=0.9',
//     ...options.headers,
//   };
//   for (let i = 0; i <= retries; i++) {
//     try {
//       const controller = new AbortController();
//       const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
//       try {
//         const res = await fetch(url, { ...options, headers, signal: controller.signal });
//         clearTimeout(timeout);
//         if (res.status === 429 && i < retries) {
//           await sleep(2000 * (i + 1));
//           continue;
//         }
//         return res;
//       } finally {
//         clearTimeout(timeout);
//       }
//     } catch (e: any) {
//       // Abort/timeout = don't retry, just fail fast
//       if (e?.name === 'AbortError' || e?.code === 'UND_ERR_CONNECT_TIMEOUT') throw e;
//       if (i === retries) throw e;
//       await sleep(1000 * (i + 1));
//     }
//   }
//   throw new Error(`Failed after ${retries} retries`);
// }

// const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// // ─── JOB AGE FILTER ──────────────────────────────────────────────────────
// // Skip jobs older than 45 days

// function isRecentJob(dateStr?: string): boolean {
//   if (!dateStr) return true; // keep if no date
//   try {
//     const posted = new Date(dateStr);
//     const daysOld = (Date.now() - posted.getTime()) / (1000 * 60 * 60 * 24);
//     return daysOld <= 45;
//   } catch { return true; }
// }

// // ─── SOURCE 1: REMOTIVE ───────────────────────────────────────────────────

// async function fetchRemotive(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   for (const kw of keywords) {
//     try {
//       const res = await fetchWithRetry(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(kw)}&limit=30`);
//       if (!res.ok) continue;
//       const data = await res.json();
//       for (const job of data.jobs || []) {
//         if (!isRecentJob(job.publication_date)) continue;
//         results.push({
//           title: job.title,
//           company: job.company_name,
//           location: job.candidate_required_location || 'Remote',
//           job_type: 'remote',
//           description: clean(job.description),
//           requirements: extractRequirements(job.description || ''),
//           nice_to_have: [],
//           apply_url: job.url,
//           apply_email: extractEmail(job.description || ''),
//           application_method: extractEmail(job.description || '') ? 'email' : 'form',
//           source: 'remotive',
//           source_id: String(job.id),
//           posted_at: job.publication_date,
//           salary_min: job.salary ? parseSalaryMin(job.salary) : undefined,
//           salary_max: job.salary ? parseSalaryMax(job.salary) : undefined,
//           salary_currency: job.salary ? detectCurrency(job.salary) : 'USD',
//         });
//       }
//     } catch (e) { console.warn('[Remotive]', e); }
//   }
//   return results;
// }

// // ─── SOURCE 2: JOBICY ─────────────────────────────────────────────────────

// async function fetchJobicy(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   for (const kw of keywords) {
//     try {
//       const res = await fetchWithRetry(`https://jobicy.com/api/v2/remote-jobs?tag=${encodeURIComponent(kw)}&count=30`);
//       if (!res.ok) continue;
//       const data = await res.json();
//       for (const job of data.jobs || []) {
//         if (!isRecentJob(job.pubDate)) continue;
//         results.push({
//           title: job.jobTitle,
//           company: job.companyName,
//           location: job.jobGeo || 'Remote',
//           job_type: 'remote',
//           description: clean(job.jobDescription),
//           requirements: extractRequirements(job.jobDescription || ''),
//           nice_to_have: [],
//           apply_url: job.url,
//           apply_email: extractEmail(job.jobDescription || ''),
//           application_method: extractEmail(job.jobDescription || '') ? 'email' : 'form',
//           source: 'jobicy',
//           source_id: String(job.id),
//           posted_at: job.pubDate,
//         });
//       }
//     } catch (e) { console.warn('[Jobicy]', e); }
//   }
//   return results;
// }

// // ─── SOURCE 3: REMOTEOK ───────────────────────────────────────────────────

// async function fetchRemoteOK(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   for (const kw of keywords.slice(0, 4)) {
//     try {
//       const tag = kw.toLowerCase().replace(/\s+/g, '-');
//       const res = await fetchWithRetry(`https://remoteok.com/api?tag=${encodeURIComponent(tag)}`);
//       if (!res.ok) continue;
//       const data = await res.json();
//       for (const job of (data || []).slice(1, 30)) {
//         if (!job.position) continue;
//         if (!isRecentJob(job.date)) continue;
//         const isEmail = job.apply_url?.startsWith('mailto:');
//         results.push({
//           title: job.position,
//           company: job.company || 'Unknown',
//           location: job.location || 'Remote',
//           job_type: 'remote',
//           description: clean(job.description),
//           requirements: job.tags || [],
//           nice_to_have: [],
//           apply_url: isEmail ? job.url : (job.apply_url || job.url),
//           apply_email: isEmail ? job.apply_url.replace('mailto:', '') : extractEmail(job.description || ''),
//           application_method: isEmail ? 'email' : 'form',
//           source: 'remoteok',
//           source_id: String(job.id),
//           posted_at: job.date,
//           salary_min: job.salary_min,
//           salary_max: job.salary_max,
//           salary_currency: 'USD',
//         });
//       }
//       await sleep(500); // be polite to RemoteOK
//     } catch (e) { console.warn('[RemoteOK]', e); }
//   }
//   return results;
// }

// // ─── SOURCE 4: WE WORK REMOTELY (RSS) ────────────────────────────────────

// async function fetchWeWorkRemotely(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   const categories = ['programming', 'front-end', 'mobile-programming', 'full-stack'];
//   for (const cat of categories) {
//     try {
//       const res = await fetchWithRetry(`https://weworkremotely.com/categories/remote-${cat}-jobs.rss`, { headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' } });
//       if (!res.ok) continue;
//       const xml = await res.text();
//       const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
//       for (const item of items.slice(0, 25)) {
//         const title = stripCDATA(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
//         const company = stripCDATA(item.match(/<company>([\s\S]*?)<\/company>/)?.[1] || 'Unknown');
//         const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || '';
//         const desc = stripCDATA(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '');
//         const region = stripCDATA(item.match(/<region>([\s\S]*?)<\/region>/)?.[1] || 'Worldwide');
//         const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();
//         const guid = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1]?.trim() || link;
//         if (!isRecentJob(pubDate)) continue;
//         const combined = (title + ' ' + desc).toLowerCase();
//         if (!keywords.some(kw => combined.includes(kw.toLowerCase()))) continue;
//         const cleanDesc = desc.replace(/<[^>]*>/g, '').slice(0, 2000);
//         results.push({
//           title, company,
//           location: region || 'Remote',
//           job_type: 'remote',
//           description: cleanDesc,
//           requirements: extractRequirements(cleanDesc),
//           nice_to_have: [],
//           apply_url: link,
//           apply_email: extractEmail(cleanDesc),
//           application_method: extractEmail(cleanDesc) ? 'email' : 'form',
//           source: 'weworkremotely',
//           source_id: guid.split('/').pop() || guid,
//           posted_at: pubDate,
//         });
//       }
//     } catch (e) { console.warn('[WeWorkRemotely]', e); }
//   }
//   return results;
// }

// // ─── SOURCE 5: HIMALAYAS ──────────────────────────────────────────────────

// async function fetchHimalayas(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   for (const kw of keywords.slice(0, 5)) {
//     try {
//       const res = await fetchWithRetry(`https://himalayas.app/jobs/api?q=${encodeURIComponent(kw)}&limit=20`);
//       if (!res.ok) continue;
//       const data = await res.json();
//       for (const job of data.jobs || []) {
//         results.push({
//           title: job.title,
//           company: job.company?.name || 'Unknown',
//           location: job.locationRestrictions?.join(', ') || 'Remote',
//           job_type: 'remote',
//           description: clean(job.description),
//           requirements: extractRequirements(job.description || ''),
//           nice_to_have: [],
//           apply_url: job.applicationLink || `https://himalayas.app/jobs/${job.slug}`,
//           apply_email: extractEmail(job.description || ''),
//           application_method: extractEmail(job.description || '') ? 'email' : 'form',
//           source: 'himalayas',
//           source_id: job.id || job.slug,
//         });
//       }
//     } catch (e) { console.warn('[Himalayas]', e); }
//   }
//   return results;
// }

// // ─── SOURCE 6: ARBEITNOW ──────────────────────────────────────────────────

// async function fetchArbeitnow(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   for (const kw of keywords.slice(0, 4)) {
//     try {
//       const res = await fetchWithRetry(`https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(kw)}&remote=true`);
//       if (!res.ok) continue;
//       const data = await res.json();
//       for (const job of (data.data || []).slice(0, 20)) {
//         results.push({
//           title: job.title,
//           company: job.company_name || 'Unknown',
//           location: job.location || 'Remote',
//           job_type: job.remote ? 'remote' : 'onsite',
//           description: clean(job.description),
//           requirements: extractRequirements(job.description || ''),
//           nice_to_have: [],
//           apply_url: job.url,
//           apply_email: extractEmail(job.description || ''),
//           application_method: extractEmail(job.description || '') ? 'email' : 'form',
//           source: 'arbeitnow',
//           source_id: job.slug || String(job.id),
//           posted_at: job.created_at,
//         });
//       }
//     } catch (e) { console.warn('[Arbeitnow]', e); }
//   }
//   return results;
// }

// // ─── SOURCE 7: FINDWORK ───────────────────────────────────────────────────

// async function fetchFindwork(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   for (const kw of keywords.slice(0, 4)) {
//     try {
//       const res = await fetchWithRetry(`https://findwork.dev/api/jobs/?search=${encodeURIComponent(kw)}&remote=true`);
//       if (!res.ok) continue;
//       const data = await res.json();
//       for (const job of (data.results || []).slice(0, 20)) {
//         if (!isRecentJob(job.date_posted)) continue;
//         results.push({
//           title: job.role,
//           company: job.company_name || 'Unknown',
//           location: job.location || 'Remote',
//           job_type: job.remote ? 'remote' : 'onsite',
//           description: clean(job.text),
//           requirements: job.keywords || [],
//           nice_to_have: [],
//           apply_url: job.url,
//           apply_email: extractEmail(job.text || ''),
//           application_method: extractEmail(job.text || '') ? 'email' : 'form',
//           source: 'findwork',
//           source_id: String(job.id),
//           posted_at: job.date_posted,
//         });
//       }
//     } catch (e) { console.warn('[Findwork]', e); }
//   }
//   return results;
// }

// // ─── SOURCE 8: ADZUNA ─────────────────────────────────────────────────────

// async function fetchAdzuna(keywords: string[], locations: string[]): Promise<RawJobData[]> {
//   const appId = process.env.ADZUNA_APP_ID;
//   const appKey = process.env.ADZUNA_APP_KEY;
//   if (!appId || !appKey) return [];
//   const results: RawJobData[] = [];
//   // Nigeria only — UK/US Adzuna results show 'not available in your region'
//   const countries = ['ng'];
//   for (const country of countries) {
//     for (const kw of keywords.slice(0, 4)) {
//       try {
//         const res = await fetchWithRetry(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(kw)}&results_per_page=20&content-type=application/json`);
//         if (!res.ok) continue;
//         const data = await res.json();
//         for (const job of data.results || []) {
//           if (!isRecentJob(job.created)) continue;
//           const emailMatch = job.description?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
//           results.push({
//             title: job.title,
//             company: job.company?.display_name || 'Unknown',
//             location: job.location?.display_name || (country === 'ng' ? 'Nigeria' : 'Remote'),
//             job_type: /remote/i.test(job.title + job.description) ? 'remote' : 'onsite',
//             description: (job.description || '').slice(0, 2000),
//             requirements: extractRequirements(job.description || ''),
//             nice_to_have: [],
//             apply_url: job.redirect_url,
//             apply_email: emailMatch?.[0],
//             application_method: emailMatch ? 'email' : 'manual',
//             source: 'adzuna',
//             source_id: String(job.id),
//             posted_at: job.created,
//             salary_min: job.salary_min,
//             salary_max: job.salary_max,
//             salary_currency: country === 'ng' ? 'NGN' : 'USD',
//           });
//         }
//       } catch (e) { console.warn('[Adzuna]', e); }
//     }
//   }
//   return results;
// }

// // ─── SOURCE 9: THE MUSE ───────────────────────────────────────────────────

// async function fetchTheMuse(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   try {
//     const res = await fetchWithRetry(`https://www.themuse.com/api/public/jobs?category=Software%20Engineer&level=Mid%20Level&location=Flexible%20%2F%20Remote&page=1&descending=true`);
//     if (!res.ok) return results;
//     const data = await res.json();
//     for (const job of (data.results || []).slice(0, 20)) {
//       const desc = job.contents?.replace(/<[^>]*>/g, '') || '';
//       const combined = (job.name + ' ' + desc).toLowerCase();
//       if (!keywords.some(k => combined.includes(k.toLowerCase()))) continue;
//       results.push({
//         title: job.name,
//         company: job.company?.name || 'Unknown',
//         location: job.locations?.map((l: any) => l.name).join(', ') || 'Remote',
//         job_type: 'remote',
//         description: desc.slice(0, 2000),
//         requirements: extractRequirements(desc),
//         nice_to_have: [],
//         apply_url: job.refs?.landing_page || `https://www.themuse.com/jobs/${job.id}`,
//         apply_email: extractEmail(desc),
//         application_method: extractEmail(desc) ? 'email' : 'form',
//         source: 'themuse',
//         source_id: String(job.id),
//       });
//     }
//   } catch (e) { console.warn('[TheMuse]', e); }
//   return results;
// }

// // ─── SOURCE 10: GREENHOUSE (company ATS boards) ───────────────────────────

// async function fetchGreenhouse(): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   const companies = [
//     'flutterwave', 'andela', 'paystack', 'interswitch', 'stripe',
//     'shopify', 'gitlab', 'hashicorp', 'notion', 'vercel', 'supabase',
//     'figma', 'linear', 'loom', 'deel', 'remote', 'oyster',
//   ];
//   for (const company of companies) {
//     try {
//       const res = await fetchWithRetry(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`);
//       if (!res.ok) continue;
//       const data = await res.json();
//       for (const job of (data.jobs || []).slice(0, 10)) {
//         const title = (job.title || '').toLowerCase();
//         if (!['react', 'native', 'frontend', 'front-end', 'mobile', 'javascript', 'typescript'].some(k => title.includes(k))) continue;
//         const desc = job.content?.replace(/<[^>]*>/g, '') || '';
//         results.push({
//           title: job.title,
//           company: data.name || company,
//           location: job.location?.name || 'Remote',
//           job_type: /remote/i.test(job.location?.name || '') ? 'remote' : 'onsite',
//           description: desc.slice(0, 2000),
//           requirements: extractRequirements(desc),
//           nice_to_have: [],
//           apply_url: job.absolute_url || `https://boards.greenhouse.io/${company}/jobs/${job.id}`,
//           apply_email: extractEmail(desc),
//           application_method: extractEmail(desc) ? 'email' : 'form',
//           source: 'greenhouse',
//           source_id: `${company}-${job.id}`,
//         });
//       }
//     } catch { /* silent */ }
//   }
//   return results;
// }

// // ─── SOURCE 11: LEVER (company ATS boards) ───────────────────────────────
// // Many startups use Lever — completely public API

// async function fetchLever(): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   const companies = [
//     'andela', 'flutterwave', 'chipper', 'wave', 'kuda',
//     'coinbase', 'airbnb', 'netflix', 'discord', 'figma',
//     'brex', 'ramp', 'plaid', 'robinhood', 'chime',
//   ];
//   for (const company of companies) {
//     try {
//       const res = await fetchWithRetry(`https://api.lever.co/v0/postings/${company}?mode=json`);
//       if (!res.ok) continue;
//       const jobs = await res.json();
//       for (const job of (jobs || []).slice(0, 10)) {
//         const title = (job.text || '').toLowerCase();
//         if (!['react', 'native', 'frontend', 'mobile', 'javascript', 'typescript', 'engineer'].some(k => title.includes(k))) continue;
//         const desc = [
//           job.descriptionPlain || '',
//           ...(job.lists || []).map((l: any) => l.content?.replace(/<[^>]*>/g, '') || '')
//         ].join('\n');
//         results.push({
//           title: job.text,
//           company: company.charAt(0).toUpperCase() + company.slice(1),
//           location: job.categories?.location || job.workplaceType || 'Remote',
//           job_type: /remote/i.test(job.workplaceType || job.categories?.location || '') ? 'remote' : 'onsite',
//           description: desc.slice(0, 2000),
//           requirements: extractRequirements(desc),
//           nice_to_have: [],
//           apply_url: job.hostedUrl || `https://jobs.lever.co/${company}/${job.id}`,
//           apply_email: extractEmail(desc),
//           application_method: extractEmail(desc) ? 'email' : 'form',
//           source: 'lever',
//           source_id: `${company}-${job.id}`,
//           posted_at: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
//         });
//       }
//     } catch { /* silent */ }
//   }
//   return results;
// }

// // ─── SOURCE 12: INDEED RSS ────────────────────────────────────────────────
// // Indeed has public RSS feeds — no auth needed

// async function fetchIndeedRSS(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   const searches = [
//     ...keywords.slice(0, 4).map(kw => ({ q: kw, l: 'remote' })),
//     ...keywords.slice(0, 2).map(kw => ({ q: kw, l: 'Lagos Nigeria' })),
//     ...keywords.slice(0, 2).map(kw => ({ q: kw, l: 'Nigeria' })),
//   ];
//   for (const { q, l } of searches) {
//     try {
//       const url = `https://www.indeed.com/rss?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}&sort=date&limit=25`;
//       const res = await fetchWithRetry(url, { headers: { 'Accept': 'application/rss+xml, text/xml' } });
//       if (!res.ok) continue;
//       const xml = await res.text();
//       const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
//       for (const item of items) {
//         const title = stripXML(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
//         const link = stripXML(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '').trim();
//         const desc = stripXML(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '');
//         const company = stripXML(item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || 'Unknown');
//         const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();
//         const guid = stripXML(item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] || link);
//         if (!title || !link) continue;
//         if (!isRecentJob(pubDate)) continue;
//         const cleanDesc = desc.replace(/<[^>]*>/g, '').slice(0, 2000);
//         results.push({
//           title,
//           company,
//           location: l === 'remote' ? 'Remote' : l,
//           job_type: l === 'remote' ? 'remote' : 'onsite',
//           description: cleanDesc,
//           requirements: extractRequirements(cleanDesc),
//           nice_to_have: [],
//           apply_url: link,
//           apply_email: extractEmail(cleanDesc),
//           application_method: extractEmail(cleanDesc) ? 'email' : 'form',
//           source: 'indeed',
//           source_id: guid.replace(/https?:\/\/[^/]+\//, '').slice(0, 80),
//           posted_at: pubDate,
//         });
//       }
//     } catch (e) { console.warn('[Indeed RSS]', e); }
//   }
//   return results;
// }

// // ─── SOURCE 13: STACK OVERFLOW JOBS (RSS) ────────────────────────────────

// async function fetchStackOverflowJobs(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   for (const kw of keywords.slice(0, 3)) {
//     try {
//       const res = await fetchWithRetry(
//         `https://stackoverflow.com/jobs/feed?q=${encodeURIComponent(kw)}&r=true`,
//         { headers: { 'Accept': 'application/rss+xml, text/xml' } }
//       );
//       if (!res.ok) continue;
//       const xml = await res.text();
//       const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
//       for (const item of items.slice(0, 20)) {
//         const title = stripXML(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
//         const link = stripXML(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '').trim();
//         const desc = stripXML(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '');
//         const company = stripXML(item.match(/<author>([\s\S]*?)<\/author>/)?.[1] || 'Unknown');
//         const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
//         const guid = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] || link;
//         if (!title || !link) continue;
//         if (!isRecentJob(pubDate)) continue;
//         const cleanDesc = desc.replace(/<[^>]*>/g, '').slice(0, 2000);
//         results.push({
//           title, company,
//           location: 'Remote',
//           job_type: 'remote',
//           description: cleanDesc,
//           requirements: extractRequirements(cleanDesc),
//           nice_to_have: [],
//           apply_url: link,
//           apply_email: extractEmail(cleanDesc),
//           application_method: extractEmail(cleanDesc) ? 'email' : 'form',
//           source: 'stackoverflow',
//           source_id: String(guid).split('/').pop() || guid,
//           posted_at: pubDate,
//         });
//       }
//     } catch (e) { console.warn('[StackOverflow]', e); }
//   }
//   return results;
// }

// // ─── SOURCE 14: JOBBERMAN NIGERIA ────────────────────────────────────────
// // Africa's largest job board — critical for local Lagos/Nigeria roles

// async function fetchJobberman(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   for (const kw of keywords.slice(0, 4)) {
//     try {
//       const res = await fetchWithRetry(
//         `https://www.jobberman.com/api/v3/jobs?q=${encodeURIComponent(kw)}&location=nigeria&page=1&limit=20`,
//         { headers: { 'Accept': 'application/json', 'x-app-type': 'web' } }
//       );
//       if (!res.ok) continue;
//       const data = await res.json();
//       const jobs = data.data || data.jobs || data.results || [];
//       for (const job of jobs.slice(0, 20)) {
//         const desc = clean(job.description || job.summary || '');
//         results.push({
//           title: job.title || job.position,
//           company: job.company?.name || job.employer || 'Unknown',
//           location: job.location || 'Lagos, Nigeria',
//           job_type: /remote/i.test(job.work_type || job.location || '') ? 'remote' : 'onsite',
//           description: desc,
//           requirements: extractRequirements(desc),
//           nice_to_have: [],
//           apply_url: job.url || `https://www.jobberman.com/jobs/${job.slug || job.id}`,
//           apply_email: extractEmail(desc),
//           application_method: extractEmail(desc) ? 'email' : 'form',
//           source: 'jobberman',
//           source_id: String(job.id || job.slug),
//           posted_at: job.created_at || job.published_at,
//           salary_min: job.salary?.min,
//           salary_max: job.salary?.max,
//           salary_currency: 'NGN',
//         });
//       }
//     } catch (e) { console.warn('[Jobberman]', e); }
//   }
//   return results;
// }

// // ─── SOURCE 15: MYJOBMAG NIGERIA ─────────────────────────────────────────

// async function fetchMyJobMag(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   for (const kw of keywords.slice(0, 3)) {
//     try {
//       const res = await fetchWithRetry(
//         `https://www.myjobmag.com/jobs-in-nigeria/search/?q=${encodeURIComponent(kw)}&format=json`,
//         { headers: { 'Accept': 'application/json' } }
//       );
//       if (!res.ok) continue;
//       const data = await res.json();
//       for (const job of (data.jobs || data.results || []).slice(0, 15)) {
//         const desc = clean(job.description || '');
//         results.push({
//           title: job.title,
//           company: job.company || 'Unknown',
//           location: job.location || 'Nigeria',
//           job_type: /remote/i.test(job.job_type || '') ? 'remote' : 'onsite',
//           description: desc,
//           requirements: extractRequirements(desc),
//           nice_to_have: [],
//           apply_url: job.url || `https://www.myjobmag.com${job.path || ''}`,
//           apply_email: extractEmail(desc),
//           application_method: extractEmail(desc) ? 'email' : 'form',
//           source: 'myjobmag',
//           source_id: String(job.id),
//           salary_currency: 'NGN',
//         });
//       }
//     } catch (e) { console.warn('[MyJobMag]', e); }
//   }
//   return results;
// }

// // NgCareers removed — API returns HTML not JSON

// // ─── SOURCE 17: WELLFOUND (AngelList) ────────────────────────────────────
// // Startup jobs — great for remote React Native roles

// async function fetchWellfound(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   for (const kw of keywords.slice(0, 3)) {
//     try {
//       const res = await fetchWithRetry(
//         `https://wellfound.com/jobs?q=${encodeURIComponent(kw)}&remote=true&format=json`,
//         { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } }
//       );
//       if (!res.ok) continue;
//       const data = await res.json();
//       for (const job of (data.jobs || data.data || []).slice(0, 20)) {
//         const desc = clean(job.description || job.job_listing?.description || '');
//         results.push({
//           title: job.title || job.job_listing?.title,
//           company: job.startup?.name || job.company || 'Unknown',
//           location: job.location_names?.join(', ') || 'Remote',
//           job_type: job.remote ? 'remote' : 'onsite',
//           description: desc,
//           requirements: extractRequirements(desc),
//           nice_to_have: [],
//           apply_url: `https://wellfound.com/jobs/${job.id}`,
//           apply_email: extractEmail(desc),
//           application_method: extractEmail(desc) ? 'email' : 'form',
//           source: 'wellfound',
//           source_id: String(job.id),
//         });
//       }
//     } catch (e) { console.warn('[Wellfound]', e); }
//   }
//   return results;
// }

// // ─── SOURCE 18: WORKABLE (company ATS) ───────────────────────────────────

// async function fetchWorkable(): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   const companies = ['flutterwave', 'andela', 'paystack', 'cowrywise', 'piggyvest', 'kuda', 'risevest'];
//   for (const company of companies) {
//     try {
//       const res = await fetchWithRetry(`https://apply.workable.com/api/v3/accounts/${company}/jobs`);
//       if (!res.ok) continue;
//       const data = await res.json();
//       for (const job of (data.results || []).slice(0, 10)) {
//         const title = (job.title || '').toLowerCase();
//         if (!['react', 'native', 'frontend', 'mobile', 'javascript', 'typescript'].some(k => title.includes(k))) continue;
//         const desc = clean(job.description || '');
//         results.push({
//           title: job.title,
//           company: company.charAt(0).toUpperCase() + company.slice(1),
//           location: job.location || 'Nigeria',
//           job_type: job.workplace === 'remote' ? 'remote' : 'onsite',
//           description: desc,
//           requirements: extractRequirements(desc),
//           nice_to_have: [],
//           apply_url: `https://apply.workable.com/${company}/j/${job.shortcode}/`,
//           apply_email: extractEmail(desc),
//           application_method: extractEmail(desc) ? 'email' : 'form',
//           source: 'workable',
//           source_id: `${company}-${job.shortcode}`,
//         });
//       }
//     } catch { /* silent */ }
//   }
//   return results;
// }

// // ─── SOURCE 19: REMOTIVE NEWSLETTER RSS ──────────────────────────────────

// async function fetchDevITJobs(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   try {
//     const res = await fetchWithRetry('https://www.authenticjobs.com/api/?api_key=&method=aj.jobs.search&keywords=react+native&types=full-time&format=json');
//     if (!res.ok) return results;
//     // fallback — just return empty if API needs key
//   } catch { }

//   // DevRemote.io — free aggregator
//   for (const kw of keywords.slice(0, 2)) {
//     try {
//       const res = await fetchWithRetry(`https://devremote.io/api/jobs?q=${encodeURIComponent(kw)}`);
//       if (!res.ok) continue;
//       const data = await res.json();
//       for (const job of (data.jobs || []).slice(0, 15)) {
//         const desc = clean(job.description || '');
//         results.push({
//           title: job.title,
//           company: job.company || 'Unknown',
//           location: 'Remote',
//           job_type: 'remote',
//           description: desc,
//           requirements: extractRequirements(desc),
//           nice_to_have: [],
//           apply_url: job.url || job.apply_url,
//           apply_email: extractEmail(desc),
//           application_method: extractEmail(desc) ? 'email' : 'form',
//           source: 'devremote',
//           source_id: String(job.id),
//         });
//       }
//     } catch (e) { console.warn('[DevRemote]', e); }
//   }
//   return results;
// }

// // ─── SOURCE 20: LINKEDIN (public job search scraping) ────────────────────
// // LinkedIn has public-facing job search pages — no auth for basic listings

// async function fetchLinkedInPublic(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   const searches = [
//     { kw: 'React Native Developer', location: 'Nigeria' },
//     { kw: 'React Native Developer', location: 'Remote' },
//     { kw: 'Mobile App Developer', location: 'Nigeria' },
//     { kw: 'Frontend Developer', location: 'Lagos' },
//   ];

//   for (const { kw, location } of searches) {
//     try {
//       const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(kw)}&location=${encodeURIComponent(location)}&f_WT=2&start=0`;
//       const res = await fetchWithRetry(url, {
//         headers: {
//           'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
//           'Accept-Language': 'en-US,en;q=0.5',
//         }
//       });
//       if (!res.ok) continue;
//       const html = await res.text();

//       // Extract job cards from LinkedIn's HTML
//       const jobCards = html.match(/<li[^>]*class="[^"]*result-card[^"]*"[^>]*>([\s\S]*?)<\/li>/g) || [];
//       // Also try alternate structure
//       const jobDivs = html.match(/<div[^>]*class="[^"]*job-search-card[^"]*"[^>]*>([\s\S]*?)<\/div>/g) || [];
//       const allCards = [...jobCards, ...jobDivs];

//       for (const card of allCards.slice(0, 15)) {
//         const title = card.match(/class="[^"]*result-card__title[^"]*"[^>]*>([^<]+)</)?.[1]?.trim()
//           || card.match(/<h3[^>]*>([^<]+)<\/h3>/)?.[1]?.trim() || '';
//         const company = card.match(/class="[^"]*result-card__subtitle[^"]*"[^>]*>([^<]+)</)?.[1]?.trim()
//           || card.match(/class="[^"]*job-result-card__subtitle[^"]*"[^>]*>([^<]+)</)?.[1]?.trim() || 'Unknown';
//         const loc = card.match(/class="[^"]*job-result-card__location[^"]*"[^>]*>([^<]+)</)?.[1]?.trim() || location;
//         const link = card.match(/href="(https:\/\/www\.linkedin\.com\/jobs\/view\/[^"]+)"/)?.[1] || '';
//         const jobId = link.match(/\/view\/[^/]*-(\d+)/)?.[1] || link.split('/').pop() || '';
//         if (!title || !link) continue;
//         results.push({
//           title,
//           company,
//           location: loc,
//           job_type: /remote/i.test(loc) ? 'remote' : 'onsite',
//           description: `${title} at ${company} — ${loc}. Apply on LinkedIn for full details.`,
//           requirements: extractRequirements(title),
//           nice_to_have: [],
//           apply_url: link,
//           application_method: 'linkedin',
//           source: 'linkedin',
//           source_id: jobId || `li-${title.slice(0, 20)}-${company.slice(0, 10)}`.replace(/\s/g, '-'),
//         });
//       }
//       await sleep(1000); // be respectful to LinkedIn
//     } catch (e) { console.warn('[LinkedIn]', e); }
//   }
//   return results;
// }

// // ─── SOURCE 21: WORKING NOMADS (global RSS) ──────────────────────────────
// // Covers North America, Europe, LATAM, APAC, Africa — excellent global reach

// async function fetchWorkingNomads(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   const categories = ['development', 'design', 'engineering'];
//   for (const cat of categories) {
//     try {
//       const res = await fetchWithRetry(`https://www.workingnomads.com/jobs?category=${cat}&format=rss`,
//         { headers: { 'Accept': 'application/rss+xml, text/xml' } });
//       if (!res.ok) continue;
//       const xml = await res.text();
//       const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
//       for (const item of items.slice(0, 25)) {
//         const title = stripXML(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
//         const link = stripXML(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '').trim();
//         const desc = stripXML(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '');
//         const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
//         const guid = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] || link;
//         if (!title || !link) continue;
//         if (!isRecentJob(pubDate)) continue;
//         const combined = (title + ' ' + desc).toLowerCase();
//         if (!keywords.some(k => combined.includes(k.toLowerCase()))) continue;
//         const cleanDesc = desc.replace(/<[^>]*>/g, '').slice(0, 2000);
//         results.push({
//           title, company: 'See listing',
//           location: 'Remote / Worldwide',
//           job_type: 'remote',
//           description: cleanDesc,
//           requirements: extractRequirements(cleanDesc),
//           nice_to_have: [],
//           apply_url: link,
//           apply_email: extractEmail(cleanDesc),
//           application_method: extractEmail(cleanDesc) ? 'email' : 'form',
//           source: 'workingnomads',
//           source_id: guid.split('/').pop() || guid,
//           posted_at: pubDate,
//         });
//       }
//     } catch (e) { console.warn('[WorkingNomads]', e); }
//   }
//   return results;
// }

// // ─── SOURCE 22: DAILYREMOTE ───────────────────────────────────────────────
// // 183k+ jobs, covers US, Canada, UK, Germany, India, Brazil, Philippines etc.

// async function fetchDailyRemote(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   for (const kw of keywords.slice(0, 4)) {
//     try {
//       const res = await fetchWithRetry(
//         `https://dailyremote.com/rss/category/developer?q=${encodeURIComponent(kw)}`,
//         { headers: { 'Accept': 'application/rss+xml, text/xml' } }
//       );
//       if (!res.ok) continue;
//       const xml = await res.text();
//       const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
//       for (const item of items.slice(0, 20)) {
//         const title = stripXML(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
//         const link = stripXML(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '').trim();
//         const desc = stripXML(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '');
//         const company = stripXML(item.match(/<author>([\s\S]*?)<\/author>/)?.[1] || 'Unknown');
//         const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
//         const guid = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] || link;
//         if (!title || !link) continue;
//         if (!isRecentJob(pubDate)) continue;
//         const cleanDesc = desc.replace(/<[^>]*>/g, '').slice(0, 2000);
//         results.push({
//           title, company,
//           location: 'Remote / Worldwide',
//           job_type: 'remote',
//           description: cleanDesc,
//           requirements: extractRequirements(cleanDesc),
//           nice_to_have: [],
//           apply_url: link,
//           apply_email: extractEmail(cleanDesc),
//           application_method: extractEmail(cleanDesc) ? 'email' : 'form',
//           source: 'dailyremote',
//           source_id: String(guid).split('/').pop() || guid,
//           posted_at: pubDate,
//         });
//       }
//     } catch (e) { console.warn('[DailyRemote]', e); }
//   }
//   return results;
// }

// // ─── SOURCE 23: ADZUNA GLOBAL (Europe, USA, Asia, Africa) ─────────────────
// // Extended Adzuna to cover all major regions globally

// async function fetchAdzunaGlobal(keywords: string[]): Promise<RawJobData[]> {
//   const appId = process.env.ADZUNA_APP_ID;
//   const appKey = process.env.ADZUNA_APP_KEY;
//   if (!appId || !appKey) return [];
//   const results: RawJobData[] = [];
//   // Comprehensive global country list
//   const countries = [
//     { code: 'ng', currency: 'NGN', label: 'Nigeria' },
//     { code: 'gb', currency: 'GBP', label: 'United Kingdom' },
//     { code: 'us', currency: 'USD', label: 'United States' },
//     { code: 'ca', currency: 'CAD', label: 'Canada' },
//     { code: 'au', currency: 'AUD', label: 'Australia' },
//     { code: 'de', currency: 'EUR', label: 'Germany' },
//     { code: 'fr', currency: 'EUR', label: 'France' },
//     { code: 'nl', currency: 'EUR', label: 'Netherlands' },
//     { code: 'za', currency: 'ZAR', label: 'South Africa' },
//     { code: 'in', currency: 'INR', label: 'India' },
//     { code: 'sg', currency: 'SGD', label: 'Singapore' },
//     { code: 'nz', currency: 'NZD', label: 'New Zealand' },
//   ];
//   for (const country of countries) {
//     for (const kw of keywords.slice(0, 2)) {
//       try {
//         const res = await fetchWithRetry(
//           `https://api.adzuna.com/v1/api/jobs/${country.code}/search/1?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(kw)}&results_per_page=15&content-type=application/json`
//         );
//         if (!res.ok) continue;
//         const data = await res.json();
//         for (const job of data.results || []) {
//           if (!isRecentJob(job.created)) continue;
//           const emailMatch = job.description?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
//           results.push({
//             title: job.title,
//             company: job.company?.display_name || 'Unknown',
//             location: `${job.location?.display_name || country.label}`,
//             job_type: /remote/i.test(job.title + (job.description || '')) ? 'remote' : 'onsite',
//             description: (job.description || '').slice(0, 2000),
//             requirements: extractRequirements(job.description || ''),
//             nice_to_have: [],
//             apply_url: job.redirect_url,
//             apply_email: emailMatch?.[0],
//             application_method: emailMatch ? 'email' : 'manual',
//             source: `adzuna_${country.code}`,
//             source_id: String(job.id),
//             posted_at: job.created,
//             salary_min: job.salary_min,
//             salary_max: job.salary_max,
//             salary_currency: country.currency,
//           });
//         }
//         await sleep(200); // gentle rate limiting
//       } catch (e) { console.warn(`[Adzuna ${country.code}]`, e); }
//     }
//   }
//   return results;
// }

// // ─── SOURCE 24: JOBGETHER (200k+ global remote jobs) ─────────────────────

// async function fetchJobgether(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   for (const kw of keywords.slice(0, 3)) {
//     try {
//       const res = await fetchWithRetry(
//         `https://jobgether.com/api/jobs?q=${encodeURIComponent(kw)}&remote=true&limit=20`,
//         { headers: { 'Accept': 'application/json' } }
//       );
//       if (!res.ok) continue;
//       const data = await res.json();
//       for (const job of (data.jobs || data.data || data.results || []).slice(0, 20)) {
//         const desc = clean(job.description || job.summary || '');
//         results.push({
//           title: job.title,
//           company: job.company?.name || job.company || 'Unknown',
//           location: job.location || 'Remote / Worldwide',
//           job_type: 'remote',
//           description: desc,
//           requirements: extractRequirements(desc),
//           nice_to_have: [],
//           apply_url: job.url || job.apply_url || `https://jobgether.com/offer/${job.slug || job.id}`,
//           apply_email: extractEmail(desc),
//           application_method: extractEmail(desc) ? 'email' : 'form',
//           source: 'jobgether',
//           source_id: String(job.id || job.slug),
//         });
//       }
//     } catch (e) { console.warn('[Jobgether]', e); }
//   }
//   return results;
// }

// // ─── SOURCE 25: TRULY REMOTE (worldwide, hire from anywhere) ─────────────

// async function fetchTrulyRemote(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   for (const kw of keywords.slice(0, 3)) {
//     try {
//       const res = await fetchWithRetry(
//         `https://trulyremote.co/api/jobs?q=${encodeURIComponent(kw)}&limit=20`,
//         { headers: { 'Accept': 'application/json' } }
//       );
//       if (!res.ok) continue;
//       const data = await res.json();
//       for (const job of (data.jobs || data.data || []).slice(0, 15)) {
//         const desc = clean(job.description || '');
//         results.push({
//           title: job.title,
//           company: job.company || 'Unknown',
//           location: 'Worldwide',
//           job_type: 'remote',
//           description: desc,
//           requirements: extractRequirements(desc),
//           nice_to_have: [],
//           apply_url: job.url || job.apply_url || `https://trulyremote.co/jobs/${job.slug || job.id}`,
//           apply_email: extractEmail(desc),
//           application_method: extractEmail(desc) ? 'email' : 'form',
//           source: 'trulyremote',
//           source_id: String(job.id || job.slug),
//         });
//       }
//     } catch (e) { console.warn('[TrulyRemote]', e); }
//   }
//   return results;
// }

// // ─── SOURCE 26: FREELANCE / GIG PLATFORMS ────────────────────────────────
// // Toptal, Contra, Gun.io — for contract/freelance React Native work

// async function fetchFreelancePlatforms(keywords: string[]): Promise<RawJobData[]> {
//   const results: RawJobData[] = [];
//   // Gun.io — freelance dev platform with public listings
//   try {
//     const res = await fetchWithRetry(
//       `https://gun.io/find-work/api/?q=${encodeURIComponent('react native')}&format=json`,
//       { headers: { 'Accept': 'application/json' } }
//     );
//     if (res.ok) {
//       const data = await res.json();
//       for (const job of (data.results || []).slice(0, 10)) {
//         const desc = clean(job.description || '');
//         results.push({
//           title: job.title || 'React Native Freelance',
//           company: job.client || 'Client',
//           location: 'Remote',
//           job_type: 'remote',
//           description: desc,
//           requirements: extractRequirements(desc),
//           nice_to_have: [],
//           apply_url: job.url || 'https://gun.io/find-work/',
//           application_method: 'form',
//           source: 'gunio',
//           source_id: String(job.id),
//         });
//       }
//     }
//   } catch { }

//   // Contra — freelance platform, public job listings
//   try {
//     const res = await fetchWithRetry(
//       `https://contra.com/api/opportunities?skills=react-native&limit=15`,
//       { headers: { 'Accept': 'application/json' } }
//     );
//     if (res.ok) {
//       const data = await res.json();
//       for (const job of (data.opportunities || data.data || []).slice(0, 10)) {
//         const desc = clean(job.description || '');
//         results.push({
//           title: job.title || 'React Native Contract',
//           company: job.client?.name || 'Client',
//           location: 'Remote',
//           job_type: 'remote',
//           description: desc,
//           requirements: extractRequirements(desc),
//           nice_to_have: [],
//           apply_url: job.url || `https://contra.com/opportunity/${job.slug || job.id}`,
//           application_method: 'form',
//           source: 'contra',
//           source_id: String(job.id || job.slug),
//         });
//       }
//     }
//   } catch { }

//   return results;
// }

// // ─── MAIN SEARCH FUNCTION ─────────────────────────────────────────────────

// export async function searchForJobs(profile: UserProfile): Promise<
//   Array<Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
// > {
//   // Tech + non-tech roles aligned with CV — cast the widest net
//   const keywords = [
//     // Core mobile
//     'React Native',
//     'React Native Developer',
//     'Mobile App Developer',
//     'Mobile Developer',
//     'Mobile Engineer',
//     'iOS Android Developer',
//     'Cross Platform Developer',
//     'Expo Developer',
//     // Frontend
//     'Frontend Developer',
//     'React Developer',
//     'JavaScript Developer',
//     'TypeScript Developer',
//     'Next.js Developer',
//     // Adjacent non-tech roles CV qualifies for
//     'Technical Writer',
//     'Developer Advocate',
//     'Product Manager Tech',
//     'UX Developer',
//     'No-code Developer',
//     'Customer Success Engineer',
//     'Technical Recruiter',
//     'Solutions Engineer',
//   ];

//   // Wrap every source — no single failure can crash the whole search
//   const safe = <T>(p: Promise<T[]>): Promise<T[]> => p.catch(() => [] as T[]);

//   console.log('[search] Fetching from 25 sources in parallel...');

//   // Promise.all with safe() — every source gets its own error boundary
//   const all: RawJobData[] = (await Promise.all([
//     safe(fetchRemotive(keywords.slice(0, 6))),
//     safe(fetchJobicy(keywords.slice(0, 6))),
//     safe(fetchRemoteOK(keywords.slice(0, 4))),
//     safe(fetchWeWorkRemotely(keywords)),
//     safe(fetchHimalayas(keywords.slice(0, 5))),
//     safe(fetchArbeitnow(keywords.slice(0, 4))),
//     safe(fetchFindwork(keywords.slice(0, 4))),
//     safe(fetchAdzuna(keywords.slice(0, 4), profile.preferred_locations)),
//     safe(fetchTheMuse(keywords.slice(0, 4))),
//     safe(fetchGreenhouse()),
//     safe(fetchLever()),
//     safe(fetchIndeedRSS(keywords.slice(0, 5))),
//     safe(fetchStackOverflowJobs(keywords.slice(0, 3))),
//     safe(fetchJobberman(keywords.slice(0, 4))),
//     safe(fetchMyJobMag(keywords.slice(0, 3))),
//     safe(fetchWellfound(keywords.slice(0, 3))),
//     safe(fetchWorkable()),
//     safe(fetchDevITJobs(keywords.slice(0, 2))),
//     safe(fetchLinkedInPublic(keywords.slice(0, 3))),
//     safe(fetchWorkingNomads(keywords)),
//     safe(fetchDailyRemote(keywords.slice(0, 4))),
//     safe(fetchAdzunaGlobal(keywords.slice(0, 3))),
//     safe(fetchJobgether(keywords.slice(0, 3))),
//     safe(fetchTrulyRemote(keywords.slice(0, 3))),
//     safe(fetchFreelancePlatforms(keywords.slice(0, 2))),
//   ])).flat();

//   const deduped = smartDedupe(all);
//   console.log(`[search] Raw: ${all.length} → After smart dedupe: ${deduped.length} jobs from 26 sources`);

//   return deduped.map(j => ({
//     ...j,
//     match_score: 0,
//     match_reasons: [],
//     status: 'found' as const,
//     found_at: new Date().toISOString(),
//   }));
// }

// // ─── SCORING ──────────────────────────────────────────────────────────────

// export async function scoreJobMatch(
//   job: Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
//   profile: UserProfile
// ): Promise<{ score: number; reasons: string[] }> {
//   const prompt = `Rate how well this job matches this candidate. Return ONLY valid JSON, no extra text.

// CANDIDATE:
// Skills: ${profile.skills.join(', ')}
// Experience: ${profile.years_experience} years
// Titles: ${profile.job_titles?.join(', ') || 'React Native Developer, Frontend Developer'}
// Location preference: ${profile.preferred_locations?.join(', ')}

// JOB:
// Title: ${job.title}
// Company: ${job.company}
// Location: ${job.location}
// Requirements: ${job.requirements.join(', ')}
// Description: ${job.description.slice(0, 600)}

// Score 0-100. Be generous for strong React Native/mobile matches.
// Return: {"score": 75, "reasons": ["Strong React Native match", "Remote position"]}`;

//   try {
//     const text = await gemini(prompt, 300);
//     const match = text.match(/\{[\s\S]*?\}/);
//     if (!match) return keywordScore(job, profile);
//     const parsed = JSON.parse(match[0]);
//     return { score: Math.min(100, Math.max(0, parsed.score || 0)), reasons: parsed.reasons || [] };
//   } catch {
//     return keywordScore(job, profile);
//   }
// }

// // ─── COVER LETTER ─────────────────────────────────────────────────────────

// export async function generateCoverLetter(job: Job, profile: UserProfile): Promise<{ content: string; subject_line: string }> {
//   const prompt = `Write a compelling, tailored cover letter. Return ONLY valid JSON, no markdown fences.

// CANDIDATE: ${profile.full_name}
// Experience: ${profile.years_experience} years in React Native & Frontend
// Skills: ${profile.skills.join(', ')}
// Email: ${profile.email} | Phone: ${profile.phone || ''} | Portfolio: ${profile.portfolio_url || ''} | GitHub: ${profile.github_url || ''}
// CV highlights: ${profile.cv_text?.slice(0, 800) || ''}

// JOB: ${job.title} at ${job.company} (${job.location})
// Requirements: ${job.requirements.slice(0, 8).join(', ')}
// Description: ${job.description.slice(0, 700)}

// Instructions:
// - 3-4 tight paragraphs
// - Open with something specific about this company/role — no "I am writing to apply"
// - Paragraph 2: most relevant experience for THIS role specifically
// - Paragraph 3: why THIS company excites you
// - Close with confident CTA
// - Full contact signature at end
// - Professional but human tone

// Return: {"content": "full letter text with \\n for line breaks", "subject_line": "max 60 char subject"}`;

//   try {
//     const text = await gemini(prompt, 1500);
//     const match = text.match(/\{[\s\S]*\}/);
//     if (!match) return fallbackCoverLetter(job, profile);
//     return JSON.parse(match[0]);
//   } catch {
//     return fallbackCoverLetter(job, profile);
//   }
// }

// export async function optimizeCVForJob(cvText: string, job: Job): Promise<string> {
//   const prompt = `Optimize this CV for the job. Keep all facts accurate — only reorder and rephrase. Return only CV text.\n\nJOB: ${job.title} at ${job.company}\nREQUIREMENTS: ${job.requirements.slice(0, 6).join(', ')}\n\nCV:\n${cvText}`;
//   try { return await gemini(prompt, 2000); } catch { return cvText; }
// }

// // ─── SMART DEDUPLICATION ──────────────────────────────────────────────────
// // Dedupes by source+id AND by similar title+company (catches cross-source duplicates)

// function smartDedupe(jobs: RawJobData[]): RawJobData[] {
//   const seenIds = new Set<string>();
//   const seenTitleCompany = new Set<string>();
//   return jobs.filter(j => {
//     if (!j.title || !j.apply_url) return false;
//     // Exact source+id dedup
//     const idKey = `${j.source}:${j.source_id}`;
//     if (seenIds.has(idKey)) return false;
//     seenIds.add(idKey);
//     // Fuzzy title+company dedup (catches same job posted on multiple boards)
//     const fuzzyKey = `${normalize(j.title)}::${normalize(j.company)}`;
//     if (seenTitleCompany.has(fuzzyKey)) return false;
//     seenTitleCompany.add(fuzzyKey);
//     return true;
//   });
// }

// function normalize(s: string): string {
//   return s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
// }

// // ─── UTILITIES ────────────────────────────────────────────────────────────

// function clean(html: string = ''): string {
//   return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);
// }

// function extractRequirements(description: string): string[] {
//   const keywords = [
//     'React Native', 'TypeScript', 'JavaScript', 'Next.js', 'React',
//     'Redux', 'Node.js', 'Firebase', 'Expo', 'iOS', 'Android', 'Git',
//     'Figma', 'REST API', 'GraphQL', 'Tailwind', 'MobX', 'Context API',
//     'React Navigation', 'CI/CD', 'App Store', 'Google Play', 'AWS',
//     'React Hooks', 'Agile', 'Scrum', 'Docker', 'PostgreSQL', 'MongoDB',
//   ];
//   return keywords.filter(k => description.toLowerCase().includes(k.toLowerCase())).slice(0, 12);
// }

// function extractEmail(text: string): string | undefined {
//   const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
//   if (!match) return undefined;
//   const email = match[0].toLowerCase();
//   if (/noreply|example|test@|support@|info@|hello@/.test(email)) return undefined;
//   return match[0];
// }

// function stripCDATA(str: string): string {
//   return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim();
// }

// function stripXML(str: string): string {
//   return str.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
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
//   if (s.includes('€')) return 'EUR';
//   if (s.includes('₦')) return 'NGN';
//   return 'USD';
// }

// function keywordScore(
//   job: Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
//   profile: UserProfile
// ): { score: number; reasons: string[] } {
//   const title = job.title.toLowerCase();
//   const desc = (title + ' ' + job.description + ' ' + job.requirements.join(' ')).toLowerCase();
//   const reasons: string[] = [];
//   let score = 20; // base

//   // Title is the strongest signal — if title contains core skills, big boost
//   if (/react native/i.test(job.title)) {
//     score += 40;
//     reasons.push('React Native in job title');
//   } else if (/mobile (developer|engineer|app)/i.test(job.title)) {
//     score += 25;
//     reasons.push('Mobile developer role');
//   } else if (/(frontend|front-end|front end) (developer|engineer)/i.test(job.title)) {
//     score += 20;
//     reasons.push('Frontend developer role');
//   } else if (/react (developer|engineer)/i.test(job.title)) {
//     score += 18;
//     reasons.push('React developer role');
//   }

//   // Description/requirements skill matching
//   for (const [skill, pts] of [
//     ['react native', 15], ['typescript', 8], ['javascript', 6],
//     ['react', 6], ['expo', 8], ['mobile', 4],
//   ] as [string, number][]) {
//     if (desc.includes(skill) && profile.skills.some(s => s.toLowerCase().includes(skill))) {
//       score += pts;
//       if (reasons.length < 4) reasons.push(`Matches ${skill}`);
//     }
//   }

//   // Bonus skills
//   for (const skill of ['next.js', 'redux', 'tailwind', 'firebase', 'node.js', 'figma', 'appwrite']) {
//     if (desc.includes(skill) && profile.skills.some(s => s.toLowerCase().includes(skill))) score += 3;
//   }

//   // Location bonuses
//   if (/remote/i.test(job.location || '')) { score += 5; reasons.push('Remote position'); }
//   if (/nigeria|lagos|ibadan/i.test(job.location || '')) { score += 8; reasons.push('Nigeria/local role'); }

//   // Penalize clearly irrelevant roles (non-tech that slipped through)
//   if (/beautician|kosmetik|minijob|controlling|buchhalt|marketing manager|hr manager/i.test(job.title)) {
//     score = Math.min(score, 20);
//   }

//   return { score: Math.min(95, score), reasons };
// }

// function fallbackCoverLetter(job: Job, profile: UserProfile): { content: string; subject_line: string } {
//   return {
//     content: `Dear Hiring Manager,\n\nI am excited to apply for the ${job.title} role at ${job.company}. With ${profile.years_experience}+ years of hands-on experience in React Native and frontend development, I have built production-grade mobile and web applications that are both performant and user-focused.\n\nMy core skills — ${profile.skills.slice(0, 5).join(', ')} — align directly with your requirements. Across my roles, I have integrated complex APIs, enforced mobile security best practices, and worked closely with designers and backend teams to ship high-quality features on time.\n\nI am drawn to ${job.company} and believe my technical background and product instincts would make a genuine contribution to your team.\n\nThank you for your time and consideration. I would love to discuss further.\n\nBest regards,\n${profile.full_name}\n${profile.email} | ${profile.phone || ''}\nPortfolio: ${profile.portfolio_url || ''} | GitHub: ${profile.github_url || ''}`,
//     subject_line: `${job.title} Application — ${profile.full_name}`,
//   };
// }


import type { UserProfile, Job } from '@/types';

// ─── AI HELPERS ───────────────────────────────────────────────────────────

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`;

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

export interface RawJobData {
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
  posted_at?: string;
}

// ─── HTTP HELPER WITH RETRY ───────────────────────────────────────────────

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 1): Promise<Response> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/html, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    ...options.headers,
  };
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
      try {
        const res = await fetch(url, { ...options, headers, signal: controller.signal });
        clearTimeout(timeout);
        if (res.status === 429 && i < retries) {
          await sleep(2000 * (i + 1));
          continue;
        }
        return res;
      } finally {
        clearTimeout(timeout);
      }
    } catch (e: any) {
      // Abort/timeout = don't retry, just fail fast
      if (e?.name === 'AbortError' || e?.code === 'UND_ERR_CONNECT_TIMEOUT') throw e;
      if (i === retries) throw e;
      await sleep(1000 * (i + 1));
    }
  }
  throw new Error(`Failed after ${retries} retries`);
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── JOB AGE FILTER ──────────────────────────────────────────────────────
// Skip jobs older than 45 days

function isRecentJob(dateStr?: string): boolean {
  if (!dateStr) return true; // keep if no date
  try {
    const posted = new Date(dateStr);
    const daysOld = (Date.now() - posted.getTime()) / (1000 * 60 * 60 * 24);
    return daysOld <= 45;
  } catch { return true; }
}

// ─── SOURCE 1: REMOTIVE ───────────────────────────────────────────────────

async function fetchRemotive(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords) {
    try {
      const res = await fetchWithRetry(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(kw)}&limit=30`);
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of data.jobs || []) {
        if (!isRecentJob(job.publication_date)) continue;
        results.push({
          title: job.title,
          company: job.company_name,
          location: job.candidate_required_location || 'Remote',
          job_type: 'remote',
          description: clean(job.description),
          requirements: extractRequirements(job.description || ''),
          nice_to_have: [],
          apply_url: job.url,
          apply_email: extractEmail(job.description || ''),
          application_method: extractEmail(job.description || '') ? 'email' : 'form',
          source: 'remotive',
          source_id: String(job.id),
          posted_at: job.publication_date,
          salary_min: job.salary ? parseSalaryMin(job.salary) : undefined,
          salary_max: job.salary ? parseSalaryMax(job.salary) : undefined,
          salary_currency: job.salary ? detectCurrency(job.salary) : 'USD',
        });
      }
    } catch (e) { console.warn('[Remotive]', e); }
  }
  return results;
}

// ─── SOURCE 2: JOBICY ─────────────────────────────────────────────────────

async function fetchJobicy(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords) {
    try {
      const res = await fetchWithRetry(`https://jobicy.com/api/v2/remote-jobs?tag=${encodeURIComponent(kw)}&count=30`);
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of data.jobs || []) {
        if (!isRecentJob(job.pubDate)) continue;
        results.push({
          title: job.jobTitle,
          company: job.companyName,
          location: job.jobGeo || 'Remote',
          job_type: 'remote',
          description: clean(job.jobDescription),
          requirements: extractRequirements(job.jobDescription || ''),
          nice_to_have: [],
          apply_url: job.url,
          apply_email: extractEmail(job.jobDescription || ''),
          application_method: extractEmail(job.jobDescription || '') ? 'email' : 'form',
          source: 'jobicy',
          source_id: String(job.id),
          posted_at: job.pubDate,
        });
      }
    } catch (e) { console.warn('[Jobicy]', e); }
  }
  return results;
}

// ─── SOURCE 3: REMOTEOK ───────────────────────────────────────────────────

async function fetchRemoteOK(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords.slice(0, 4)) {
    try {
      const tag = kw.toLowerCase().replace(/\s+/g, '-');
      const res = await fetchWithRetry(`https://remoteok.com/api?tag=${encodeURIComponent(tag)}`);
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of (data || []).slice(1, 30)) {
        if (!job.position) continue;
        if (!isRecentJob(job.date)) continue;
        const isEmail = job.apply_url?.startsWith('mailto:');
        results.push({
          title: job.position,
          company: job.company || 'Unknown',
          location: job.location || 'Remote',
          job_type: 'remote',
          description: clean(job.description),
          requirements: job.tags || [],
          nice_to_have: [],
          apply_url: isEmail ? job.url : (job.apply_url || job.url),
          apply_email: isEmail ? job.apply_url.replace('mailto:', '') : extractEmail(job.description || ''),
          application_method: isEmail ? 'email' : 'form',
          source: 'remoteok',
          source_id: String(job.id),
          posted_at: job.date,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          salary_currency: 'USD',
        });
      }
      await sleep(500); // be polite to RemoteOK
    } catch (e) { console.warn('[RemoteOK]', e); }
  }
  return results;
}

// ─── SOURCE 4: WE WORK REMOTELY (RSS) ────────────────────────────────────

async function fetchWeWorkRemotely(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  const categories = ['programming', 'front-end', 'mobile-programming', 'full-stack'];
  for (const cat of categories) {
    try {
      const res = await fetchWithRetry(`https://weworkremotely.com/categories/remote-${cat}-jobs.rss`, { headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' } });
      if (!res.ok) continue;
      const xml = await res.text();
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
      for (const item of items.slice(0, 25)) {
        const title = stripCDATA(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
        const company = stripCDATA(item.match(/<company>([\s\S]*?)<\/company>/)?.[1] || 'Unknown');
        const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || '';
        const desc = stripCDATA(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '');
        const region = stripCDATA(item.match(/<region>([\s\S]*?)<\/region>/)?.[1] || 'Worldwide');
        const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();
        const guid = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1]?.trim() || link;
        if (!isRecentJob(pubDate)) continue;
        const combined = (title + ' ' + desc).toLowerCase();
        if (!keywords.some(kw => combined.includes(kw.toLowerCase()))) continue;
        const cleanDesc = desc.replace(/<[^>]*>/g, '').slice(0, 2000);
        results.push({
          title, company,
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
          posted_at: pubDate,
        });
      }
    } catch (e) { console.warn('[WeWorkRemotely]', e); }
  }
  return results;
}

// ─── SOURCE 5: HIMALAYAS ──────────────────────────────────────────────────

async function fetchHimalayas(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords.slice(0, 5)) {
    try {
      const res = await fetchWithRetry(`https://himalayas.app/jobs/api?q=${encodeURIComponent(kw)}&limit=20`);
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of data.jobs || []) {
        results.push({
          title: job.title,
          company: job.company?.name || 'Unknown',
          location: job.locationRestrictions?.join(', ') || 'Remote',
          job_type: 'remote',
          description: clean(job.description),
          requirements: extractRequirements(job.description || ''),
          nice_to_have: [],
          apply_url: job.applicationLink || `https://himalayas.app/jobs/${job.slug}`,
          apply_email: extractEmail(job.description || ''),
          application_method: extractEmail(job.description || '') ? 'email' : 'form',
          source: 'himalayas',
          source_id: job.id || job.slug,
        });
      }
    } catch (e) { console.warn('[Himalayas]', e); }
  }
  return results;
}

// ─── SOURCE 6: ARBEITNOW ──────────────────────────────────────────────────

async function fetchArbeitnow(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords.slice(0, 4)) {
    try {
      const res = await fetchWithRetry(`https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(kw)}&remote=true`);
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of (data.data || []).slice(0, 20)) {
        results.push({
          title: job.title,
          company: job.company_name || 'Unknown',
          location: job.location || 'Remote',
          job_type: job.remote ? 'remote' : 'onsite',
          description: clean(job.description),
          requirements: extractRequirements(job.description || ''),
          nice_to_have: [],
          apply_url: job.url,
          apply_email: extractEmail(job.description || ''),
          application_method: extractEmail(job.description || '') ? 'email' : 'form',
          source: 'arbeitnow',
          source_id: job.slug || String(job.id),
          posted_at: job.created_at,
        });
      }
    } catch (e) { console.warn('[Arbeitnow]', e); }
  }
  return results;
}

// ─── SOURCE 7: FINDWORK ───────────────────────────────────────────────────

async function fetchFindwork(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords.slice(0, 4)) {
    try {
      const res = await fetchWithRetry(`https://findwork.dev/api/jobs/?search=${encodeURIComponent(kw)}&remote=true`);
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of (data.results || []).slice(0, 20)) {
        if (!isRecentJob(job.date_posted)) continue;
        results.push({
          title: job.role,
          company: job.company_name || 'Unknown',
          location: job.location || 'Remote',
          job_type: job.remote ? 'remote' : 'onsite',
          description: clean(job.text),
          requirements: job.keywords || [],
          nice_to_have: [],
          apply_url: job.url,
          apply_email: extractEmail(job.text || ''),
          application_method: extractEmail(job.text || '') ? 'email' : 'form',
          source: 'findwork',
          source_id: String(job.id),
          posted_at: job.date_posted,
        });
      }
    } catch (e) { console.warn('[Findwork]', e); }
  }
  return results;
}

// ─── SOURCE 8: ADZUNA ─────────────────────────────────────────────────────

async function fetchAdzuna(keywords: string[], locations: string[]): Promise<RawJobData[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];
  const results: RawJobData[] = [];
  // Nigeria only — UK/US Adzuna results show 'not available in your region'
  const countries = ['ng'];
  for (const country of countries) {
    for (const kw of keywords.slice(0, 4)) {
      try {
        const res = await fetchWithRetry(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(kw)}&results_per_page=20&content-type=application/json`);
        if (!res.ok) continue;
        const data = await res.json();
        for (const job of data.results || []) {
          if (!isRecentJob(job.created)) continue;
          const emailMatch = job.description?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          results.push({
            title: job.title,
            company: job.company?.display_name || 'Unknown',
            location: job.location?.display_name || (country === 'ng' ? 'Nigeria' : 'Remote'),
            job_type: /remote/i.test(job.title + job.description) ? 'remote' : 'onsite',
            description: (job.description || '').slice(0, 2000),
            requirements: extractRequirements(job.description || ''),
            nice_to_have: [],
            apply_url: job.redirect_url,
            apply_email: emailMatch?.[0],
            application_method: emailMatch ? 'email' : 'manual',
            source: 'adzuna',
            source_id: String(job.id),
            posted_at: job.created,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            salary_currency: country === 'ng' ? 'NGN' : 'USD',
          });
        }
      } catch (e) { console.warn('[Adzuna]', e); }
    }
  }
  return results;
}

// ─── SOURCE 9: THE MUSE ───────────────────────────────────────────────────

async function fetchTheMuse(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  try {
    const res = await fetchWithRetry(`https://www.themuse.com/api/public/jobs?category=Software%20Engineer&level=Mid%20Level&location=Flexible%20%2F%20Remote&page=1&descending=true`);
    if (!res.ok) return results;
    const data = await res.json();
    for (const job of (data.results || []).slice(0, 20)) {
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
  } catch (e) { console.warn('[TheMuse]', e); }
  return results;
}

// ─── SOURCE 10: GREENHOUSE (company ATS boards) ───────────────────────────

async function fetchGreenhouse(): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  const companies = [
    'flutterwave', 'andela', 'paystack', 'interswitch', 'stripe',
    'shopify', 'gitlab', 'hashicorp', 'notion', 'vercel', 'supabase',
    'figma', 'linear', 'loom', 'deel', 'remote', 'oyster',
  ];
  for (const company of companies) {
    try {
      const res = await fetchWithRetry(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`);
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of (data.jobs || []).slice(0, 10)) {
        const title = (job.title || '').toLowerCase();
        if (!['react', 'native', 'frontend', 'front-end', 'mobile', 'javascript', 'typescript'].some(k => title.includes(k))) continue;
        const desc = job.content?.replace(/<[^>]*>/g, '') || '';
        results.push({
          title: job.title,
          company: data.name || company,
          location: job.location?.name || 'Remote',
          job_type: /remote/i.test(job.location?.name || '') ? 'remote' : 'onsite',
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
    } catch { /* silent */ }
  }
  return results;
}

// ─── SOURCE 11: LEVER (company ATS boards) ───────────────────────────────
// Many startups use Lever — completely public API

async function fetchLever(): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  const companies = [
    'andela', 'flutterwave', 'chipper', 'wave', 'kuda',
    'coinbase', 'airbnb', 'netflix', 'discord', 'figma',
    'brex', 'ramp', 'plaid', 'robinhood', 'chime',
  ];
  for (const company of companies) {
    try {
      const res = await fetchWithRetry(`https://api.lever.co/v0/postings/${company}?mode=json`);
      if (!res.ok) continue;
      const jobs = await res.json();
      for (const job of (jobs || []).slice(0, 10)) {
        const title = (job.text || '').toLowerCase();
        if (!['react', 'native', 'frontend', 'mobile', 'javascript', 'typescript', 'engineer'].some(k => title.includes(k))) continue;
        const desc = [
          job.descriptionPlain || '',
          ...(job.lists || []).map((l: any) => l.content?.replace(/<[^>]*>/g, '') || '')
        ].join('\n');
        results.push({
          title: job.text,
          company: company.charAt(0).toUpperCase() + company.slice(1),
          location: job.categories?.location || job.workplaceType || 'Remote',
          job_type: /remote/i.test(job.workplaceType || job.categories?.location || '') ? 'remote' : 'onsite',
          description: desc.slice(0, 2000),
          requirements: extractRequirements(desc),
          nice_to_have: [],
          apply_url: job.hostedUrl || `https://jobs.lever.co/${company}/${job.id}`,
          apply_email: extractEmail(desc),
          application_method: extractEmail(desc) ? 'email' : 'form',
          source: 'lever',
          source_id: `${company}-${job.id}`,
          posted_at: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
        });
      }
    } catch { /* silent */ }
  }
  return results;
}

// ─── SOURCE 12: INDEED RSS ────────────────────────────────────────────────
// Indeed has public RSS feeds — no auth needed

async function fetchIndeedRSS(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  const searches = [
    ...keywords.slice(0, 4).map(kw => ({ q: kw, l: 'remote' })),
    ...keywords.slice(0, 2).map(kw => ({ q: kw, l: 'Lagos Nigeria' })),
    ...keywords.slice(0, 2).map(kw => ({ q: kw, l: 'Nigeria' })),
  ];
  for (const { q, l } of searches) {
    try {
      const url = `https://www.indeed.com/rss?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}&sort=date&limit=25`;
      const res = await fetchWithRetry(url, { headers: { 'Accept': 'application/rss+xml, text/xml' } });
      if (!res.ok) continue;
      const xml = await res.text();
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
      for (const item of items) {
        const title = stripXML(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
        const link = stripXML(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '').trim();
        const desc = stripXML(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '');
        const company = stripXML(item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || 'Unknown');
        const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();
        const guid = stripXML(item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] || link);
        if (!title || !link) continue;
        if (!isRecentJob(pubDate)) continue;
        const cleanDesc = desc.replace(/<[^>]*>/g, '').slice(0, 2000);
        results.push({
          title,
          company,
          location: l === 'remote' ? 'Remote' : l,
          job_type: l === 'remote' ? 'remote' : 'onsite',
          description: cleanDesc,
          requirements: extractRequirements(cleanDesc),
          nice_to_have: [],
          apply_url: link,
          apply_email: extractEmail(cleanDesc),
          application_method: extractEmail(cleanDesc) ? 'email' : 'form',
          source: 'indeed',
          source_id: guid.replace(/https?:\/\/[^/]+\//, '').slice(0, 80),
          posted_at: pubDate,
        });
      }
    } catch (e) { console.warn('[Indeed RSS]', e); }
  }
  return results;
}

// ─── SOURCE 13: STACK OVERFLOW JOBS (RSS) ────────────────────────────────

async function fetchStackOverflowJobs(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords.slice(0, 3)) {
    try {
      const res = await fetchWithRetry(
        `https://stackoverflow.com/jobs/feed?q=${encodeURIComponent(kw)}&r=true`,
        { headers: { 'Accept': 'application/rss+xml, text/xml' } }
      );
      if (!res.ok) continue;
      const xml = await res.text();
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
      for (const item of items.slice(0, 20)) {
        const title = stripXML(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
        const link = stripXML(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '').trim();
        const desc = stripXML(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '');
        const company = stripXML(item.match(/<author>([\s\S]*?)<\/author>/)?.[1] || 'Unknown');
        const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
        const guid = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] || link;
        if (!title || !link) continue;
        if (!isRecentJob(pubDate)) continue;
        const cleanDesc = desc.replace(/<[^>]*>/g, '').slice(0, 2000);
        results.push({
          title, company,
          location: 'Remote',
          job_type: 'remote',
          description: cleanDesc,
          requirements: extractRequirements(cleanDesc),
          nice_to_have: [],
          apply_url: link,
          apply_email: extractEmail(cleanDesc),
          application_method: extractEmail(cleanDesc) ? 'email' : 'form',
          source: 'stackoverflow',
          source_id: String(guid).split('/').pop() || guid,
          posted_at: pubDate,
        });
      }
    } catch (e) { console.warn('[StackOverflow]', e); }
  }
  return results;
}

// ─── SOURCE 14: JOBBERMAN (via public search page scraping) ─────────────
// Jobberman's API requires auth — scrape their public search RSS instead

async function fetchJobberman(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords.slice(0, 4)) {
    try {
      const res = await fetchWithRetry(
        `https://www.jobberman.com/jobs?q=${encodeURIComponent(kw)}&l=nigeria`,
        { headers: { 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.9' } }
      );
      if (!res.ok) continue;
      const html = await res.text();
      // Extract job cards from Jobberman HTML
      const cards = html.match(/data-job-id="([^"]+)"[\s\S]{0,2000}?<a[^>]+href="(\/jobs\/[^"]+)"[^>]*>([^<]+)<\/a>/g) || [];
      // Simple extraction: find all job links + titles
      const jobLinks: string[] = [];
      const jobTitles: string[] = [];
      const companies: string[] = [];
      let m: RegExpExecArray | null;
      const linkRx = /href="(https:\/\/www\.jobberman\.com\/jobs\/[^"?#]+)"/g;
      while ((m = linkRx.exec(html)) !== null) jobLinks.push(m[1]);
      const titleRx = /<h2[^>]*>\s*<a[^>]*>([^<]+)<\/a>/g;
      while ((m = titleRx.exec(html)) !== null) jobTitles.push(m[1].trim());
      const companyRx = /class="[^"]*company[^"]*"[^>]*>\s*([^<]{2,60})\s*</g;
      while ((m = companyRx.exec(html)) !== null) { const c = m[1].trim(); if (c.length > 1) companies.push(c); }
            for (let i = 0; i < Math.min(jobLinks.length, 15); i++) {
        const title = jobTitles[i] || kw;
        const company = companies[i] || 'Nigerian Company';
        if (!title || title.length < 3) continue;
        results.push({
          title,
          company,
          location: 'Lagos, Nigeria',
          job_type: 'onsite',
          description: `${title} at ${company} — Lagos, Nigeria. Apply on Jobberman for full details.`,
          requirements: extractRequirements(title),
          nice_to_have: [],
          apply_url: jobLinks[i],
          application_method: 'manual',
          source: 'jobberman',
          source_id: jobLinks[i].split('/').pop() || String(i),
          salary_currency: 'NGN',
        });
      }
    } catch (e) { console.warn('[Jobberman]', e); }
  }
  return results;
}

// ─── SOURCE 15: MYJOBMAG — via RSS feed ──────────────────────────────────

async function fetchMyJobMag(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords.slice(0, 3)) {
    try {
      const res = await fetchWithRetry(
        `https://www.myjobmag.com/rss/jobs-in-nigeria/?search=${encodeURIComponent(kw)}`,
        { headers: { 'Accept': 'application/rss+xml, text/xml' } }
      );
      if (!res.ok) continue;
      const xml = await res.text();
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
      for (const item of items.slice(0, 15)) {
        const title = stripXML(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
        const link = stripXML(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '').trim();
        const desc = stripXML(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '');
        const company = stripXML(item.match(/<author>([\s\S]*?)<\/author>/)?.[1] || 'Unknown');
        const guid = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] || link;
        if (!title || !link) continue;
        const cleanDesc = desc.slice(0, 2000);
        results.push({
          title, company,
          location: 'Nigeria',
          job_type: /remote/i.test(title + cleanDesc) ? 'remote' : 'onsite',
          description: cleanDesc,
          requirements: extractRequirements(cleanDesc),
          nice_to_have: [],
          apply_url: link,
          apply_email: extractEmail(cleanDesc),
          application_method: extractEmail(cleanDesc) ? 'email' : 'form',
          source: 'myjobmag',
          source_id: String(guid).split('/').pop() || String(guid).slice(-20),
          salary_currency: 'NGN',
        });
      }
    } catch (e) { console.warn('[MyJobMag]', e); }
  }
  return results;
}

// ─── SOURCE 16B: NGCAREERS — via RSS feed ────────────────────────────────
// NgCareers has a working RSS feed even though their JSON API is broken

async function fetchNgCareersRSS(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords.slice(0, 3)) {
    try {
      const res = await fetchWithRetry(
        `https://ngcareers.com/jobs/feed/?s=${encodeURIComponent(kw)}`,
        { headers: { 'Accept': 'application/rss+xml, text/xml' } }
      );
      if (!res.ok) continue;
      const xml = await res.text();
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
      for (const item of items.slice(0, 15)) {
        const title = stripXML(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
        const link = stripXML(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '').trim();
        const desc = stripXML(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '');
        const company = stripXML(item.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/)?.[1] || 'Unknown');
        const guid = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] || link;
        if (!title || !link) continue;
        const cleanDesc = desc.slice(0, 2000);
        results.push({
          title, company,
          location: 'Nigeria',
          job_type: /remote/i.test(title + cleanDesc) ? 'remote' : 'onsite',
          description: cleanDesc,
          requirements: extractRequirements(cleanDesc),
          nice_to_have: [],
          apply_url: link,
          apply_email: extractEmail(cleanDesc),
          application_method: extractEmail(cleanDesc) ? 'email' : 'form',
          source: 'ngcareers',
          source_id: String(guid).split('/').pop() || String(guid).slice(-20),
          salary_currency: 'NGN',
        });
      }
    } catch (e) { console.warn('[NgCareers RSS]', e); }
  }
  return results;
}

// ─── SOURCE AFRICA: OFFERZEN (South Africa + remote Africa) ──────────────

async function fetchOfferZen(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords.slice(0, 3)) {
    try {
      const res = await fetchWithRetry(
        `https://www.offerzen.com/api/listings?technology=${encodeURIComponent(kw)}&location=remote`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of (data.listings || data.jobs || data.data || []).slice(0, 15)) {
        const desc = clean(job.description || job.role_description || '');
        results.push({
          title: job.role || job.title || kw,
          company: job.company?.name || job.company_name || 'Unknown',
          location: job.remote ? 'Remote / Africa' : (job.location || 'South Africa'),
          job_type: job.remote ? 'remote' : 'onsite',
          description: desc,
          requirements: extractRequirements(desc),
          nice_to_have: [],
          apply_url: job.url || `https://www.offerzen.com/jobs/${job.slug || job.id}`,
          apply_email: extractEmail(desc),
          application_method: extractEmail(desc) ? 'email' : 'form',
          source: 'offerzen',
          source_id: String(job.id || job.slug),
          salary_currency: 'USD',
        });
      }
    } catch (e) { console.warn('[OfferZen]', e); }
  }
  return results;
}

// ─── SOURCE AFRICA: ANDELA TALENT NETWORK ────────────────────────────────
// Andela places African devs in global remote jobs — strong Nigeria presence

async function fetchAndela(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords.slice(0, 3)) {
    try {
      const res = await fetchWithRetry(
        `https://apply.workable.com/api/v3/accounts/andela/jobs?search=${encodeURIComponent(kw)}`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of (data.results || []).slice(0, 15)) {
        const title = job.title || '';
        const desc = clean(job.description || '');
        results.push({
          title,
          company: 'Andela (Global Remote)',
          location: 'Remote — Africa/Nigeria',
          job_type: 'remote',
          description: desc || `${title} — Remote position via Andela. Nigerian developers welcome.`,
          requirements: extractRequirements(desc),
          nice_to_have: [],
          apply_url: `https://apply.workable.com/andela/j/${job.shortcode}/`,
          apply_email: extractEmail(desc),
          application_method: extractEmail(desc) ? 'email' : 'form',
          source: 'andela',
          source_id: `andela-${job.shortcode}`,
          salary_currency: 'USD',
        });
      }
    } catch (e) { console.warn('[Andela]', e); }
  }
  return results;
}

// ─── SOURCE 17: WELLFOUND (AngelList) ────────────────────────────────────
// Startup jobs — great for remote React Native roles

async function fetchWellfound(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords.slice(0, 3)) {
    try {
      const res = await fetchWithRetry(
        `https://wellfound.com/jobs?q=${encodeURIComponent(kw)}&remote=true&format=json`,
        { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of (data.jobs || data.data || []).slice(0, 20)) {
        const desc = clean(job.description || job.job_listing?.description || '');
        results.push({
          title: job.title || job.job_listing?.title,
          company: job.startup?.name || job.company || 'Unknown',
          location: job.location_names?.join(', ') || 'Remote',
          job_type: job.remote ? 'remote' : 'onsite',
          description: desc,
          requirements: extractRequirements(desc),
          nice_to_have: [],
          apply_url: `https://wellfound.com/jobs/${job.id}`,
          apply_email: extractEmail(desc),
          application_method: extractEmail(desc) ? 'email' : 'form',
          source: 'wellfound',
          source_id: String(job.id),
        });
      }
    } catch (e) { console.warn('[Wellfound]', e); }
  }
  return results;
}

// ─── SOURCE 18: WORKABLE (company ATS) ───────────────────────────────────

async function fetchWorkable(): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  const companies = ['flutterwave', 'andela', 'paystack', 'cowrywise', 'piggyvest', 'kuda', 'risevest'];
  for (const company of companies) {
    try {
      const res = await fetchWithRetry(`https://apply.workable.com/api/v3/accounts/${company}/jobs`);
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of (data.results || []).slice(0, 10)) {
        const title = (job.title || '').toLowerCase();
        if (!['react', 'native', 'frontend', 'mobile', 'javascript', 'typescript'].some(k => title.includes(k))) continue;
        const desc = clean(job.description || '');
        results.push({
          title: job.title,
          company: company.charAt(0).toUpperCase() + company.slice(1),
          location: job.location || 'Nigeria',
          job_type: job.workplace === 'remote' ? 'remote' : 'onsite',
          description: desc,
          requirements: extractRequirements(desc),
          nice_to_have: [],
          apply_url: `https://apply.workable.com/${company}/j/${job.shortcode}/`,
          apply_email: extractEmail(desc),
          application_method: extractEmail(desc) ? 'email' : 'form',
          source: 'workable',
          source_id: `${company}-${job.shortcode}`,
        });
      }
    } catch { /* silent */ }
  }
  return results;
}

// ─── SOURCE 19: REMOTIVE NEWSLETTER RSS ──────────────────────────────────

async function fetchDevITJobs(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  try {
    const res = await fetchWithRetry('https://www.authenticjobs.com/api/?api_key=&method=aj.jobs.search&keywords=react+native&types=full-time&format=json');
    if (!res.ok) return results;
    // fallback — just return empty if API needs key
  } catch { }

  // DevRemote.io — free aggregator
  for (const kw of keywords.slice(0, 2)) {
    try {
      const res = await fetchWithRetry(`https://devremote.io/api/jobs?q=${encodeURIComponent(kw)}`);
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of (data.jobs || []).slice(0, 15)) {
        const desc = clean(job.description || '');
        results.push({
          title: job.title,
          company: job.company || 'Unknown',
          location: 'Remote',
          job_type: 'remote',
          description: desc,
          requirements: extractRequirements(desc),
          nice_to_have: [],
          apply_url: job.url || job.apply_url,
          apply_email: extractEmail(desc),
          application_method: extractEmail(desc) ? 'email' : 'form',
          source: 'devremote',
          source_id: String(job.id),
        });
      }
    } catch (e) { console.warn('[DevRemote]', e); }
  }
  return results;
}

// ─── SOURCE 20: LINKEDIN (public job search scraping) ────────────────────
// LinkedIn has public-facing job search pages — no auth for basic listings

async function fetchLinkedInPublic(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  const searches = [
    { kw: 'React Native Developer', location: 'Nigeria' },
    { kw: 'React Native Developer', location: 'Remote' },
    { kw: 'Mobile App Developer', location: 'Nigeria' },
    { kw: 'Frontend Developer', location: 'Lagos' },
  ];

  for (const { kw, location } of searches) {
    try {
      const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(kw)}&location=${encodeURIComponent(location)}&f_WT=2&start=0`;
      const res = await fetchWithRetry(url, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });
      if (!res.ok) continue;
      const html = await res.text();

      // Extract job cards from LinkedIn's HTML
      const jobCards = html.match(/<li[^>]*class="[^"]*result-card[^"]*"[^>]*>([\s\S]*?)<\/li>/g) || [];
      // Also try alternate structure
      const jobDivs = html.match(/<div[^>]*class="[^"]*job-search-card[^"]*"[^>]*>([\s\S]*?)<\/div>/g) || [];
      const allCards = [...jobCards, ...jobDivs];

      for (const card of allCards.slice(0, 15)) {
        const title = card.match(/class="[^"]*result-card__title[^"]*"[^>]*>([^<]+)</)?.[1]?.trim()
          || card.match(/<h3[^>]*>([^<]+)<\/h3>/)?.[1]?.trim() || '';
        const company = card.match(/class="[^"]*result-card__subtitle[^"]*"[^>]*>([^<]+)</)?.[1]?.trim()
          || card.match(/class="[^"]*job-result-card__subtitle[^"]*"[^>]*>([^<]+)</)?.[1]?.trim() || 'Unknown';
        const loc = card.match(/class="[^"]*job-result-card__location[^"]*"[^>]*>([^<]+)</)?.[1]?.trim() || location;
        const link = card.match(/href="(https:\/\/www\.linkedin\.com\/jobs\/view\/[^"]+)"/)?.[1] || '';
        const jobId = link.match(/\/view\/[^/]*-(\d+)/)?.[1] || link.split('/').pop() || '';
        if (!title || !link) continue;
        results.push({
          title,
          company,
          location: loc,
          job_type: /remote/i.test(loc) ? 'remote' : 'onsite',
          description: `${title} at ${company} — ${loc}. Apply on LinkedIn for full details.`,
          requirements: extractRequirements(title),
          nice_to_have: [],
          apply_url: link,
          application_method: 'linkedin',
          source: 'linkedin',
          source_id: jobId || `li-${title.slice(0, 20)}-${company.slice(0, 10)}`.replace(/\s/g, '-'),
        });
      }
      await sleep(1000); // be respectful to LinkedIn
    } catch (e) { console.warn('[LinkedIn]', e); }
  }
  return results;
}

// ─── SOURCE 21: WORKING NOMADS (global RSS) ──────────────────────────────
// Covers North America, Europe, LATAM, APAC, Africa — excellent global reach

async function fetchWorkingNomads(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  const categories = ['development', 'design', 'engineering'];
  for (const cat of categories) {
    try {
      const res = await fetchWithRetry(`https://www.workingnomads.com/jobs?category=${cat}&format=rss`,
        { headers: { 'Accept': 'application/rss+xml, text/xml' } });
      if (!res.ok) continue;
      const xml = await res.text();
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
      for (const item of items.slice(0, 25)) {
        const title = stripXML(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
        const link = stripXML(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '').trim();
        const desc = stripXML(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '');
        const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
        const guid = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] || link;
        if (!title || !link) continue;
        if (!isRecentJob(pubDate)) continue;
        const combined = (title + ' ' + desc).toLowerCase();
        if (!keywords.some(k => combined.includes(k.toLowerCase()))) continue;
        const cleanDesc = desc.replace(/<[^>]*>/g, '').slice(0, 2000);
        results.push({
          title, company: 'See listing',
          location: 'Remote / Worldwide',
          job_type: 'remote',
          description: cleanDesc,
          requirements: extractRequirements(cleanDesc),
          nice_to_have: [],
          apply_url: link,
          apply_email: extractEmail(cleanDesc),
          application_method: extractEmail(cleanDesc) ? 'email' : 'form',
          source: 'workingnomads',
          source_id: guid.split('/').pop() || guid,
          posted_at: pubDate,
        });
      }
    } catch (e) { console.warn('[WorkingNomads]', e); }
  }
  return results;
}

// ─── SOURCE 22: DAILYREMOTE ───────────────────────────────────────────────
// 183k+ jobs, covers US, Canada, UK, Germany, India, Brazil, Philippines etc.

async function fetchDailyRemote(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords.slice(0, 4)) {
    try {
      const res = await fetchWithRetry(
        `https://dailyremote.com/rss/category/developer?q=${encodeURIComponent(kw)}`,
        { headers: { 'Accept': 'application/rss+xml, text/xml' } }
      );
      if (!res.ok) continue;
      const xml = await res.text();
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
      for (const item of items.slice(0, 20)) {
        const title = stripXML(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
        const link = stripXML(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '').trim();
        const desc = stripXML(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '');
        const company = stripXML(item.match(/<author>([\s\S]*?)<\/author>/)?.[1] || 'Unknown');
        const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
        const guid = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] || link;
        if (!title || !link) continue;
        if (!isRecentJob(pubDate)) continue;
        const cleanDesc = desc.replace(/<[^>]*>/g, '').slice(0, 2000);
        results.push({
          title, company,
          location: 'Remote / Worldwide',
          job_type: 'remote',
          description: cleanDesc,
          requirements: extractRequirements(cleanDesc),
          nice_to_have: [],
          apply_url: link,
          apply_email: extractEmail(cleanDesc),
          application_method: extractEmail(cleanDesc) ? 'email' : 'form',
          source: 'dailyremote',
          source_id: String(guid).split('/').pop() || guid,
          posted_at: pubDate,
        });
      }
    } catch (e) { console.warn('[DailyRemote]', e); }
  }
  return results;
}

// ─── SOURCE 23: ADZUNA GLOBAL (Europe, USA, Asia, Africa) ─────────────────
// Extended Adzuna to cover all major regions globally

async function fetchAdzunaGlobal(keywords: string[]): Promise<RawJobData[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];
  const results: RawJobData[] = [];
  // Comprehensive global country list
  const countries = [
    { code: 'ng', currency: 'NGN', label: 'Nigeria' },
    { code: 'gb', currency: 'GBP', label: 'United Kingdom' },
    { code: 'us', currency: 'USD', label: 'United States' },
    { code: 'ca', currency: 'CAD', label: 'Canada' },
    { code: 'au', currency: 'AUD', label: 'Australia' },
    { code: 'de', currency: 'EUR', label: 'Germany' },
    { code: 'fr', currency: 'EUR', label: 'France' },
    { code: 'nl', currency: 'EUR', label: 'Netherlands' },
    { code: 'za', currency: 'ZAR', label: 'South Africa' },
    { code: 'in', currency: 'INR', label: 'India' },
    { code: 'sg', currency: 'SGD', label: 'Singapore' },
    { code: 'nz', currency: 'NZD', label: 'New Zealand' },
  ];
  for (const country of countries) {
    for (const kw of keywords.slice(0, 2)) {
      try {
        const res = await fetchWithRetry(
          `https://api.adzuna.com/v1/api/jobs/${country.code}/search/1?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(kw)}&results_per_page=15&content-type=application/json`
        );
        if (!res.ok) continue;
        const data = await res.json();
        for (const job of data.results || []) {
          if (!isRecentJob(job.created)) continue;
          const emailMatch = job.description?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          results.push({
            title: job.title,
            company: job.company?.display_name || 'Unknown',
            location: `${job.location?.display_name || country.label}`,
            job_type: /remote/i.test(job.title + (job.description || '')) ? 'remote' : 'onsite',
            description: (job.description || '').slice(0, 2000),
            requirements: extractRequirements(job.description || ''),
            nice_to_have: [],
            apply_url: job.redirect_url,
            apply_email: emailMatch?.[0],
            application_method: emailMatch ? 'email' : 'manual',
            source: `adzuna_${country.code}`,
            source_id: String(job.id),
            posted_at: job.created,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            salary_currency: country.currency,
          });
        }
        await sleep(200); // gentle rate limiting
      } catch (e) { console.warn(`[Adzuna ${country.code}]`, e); }
    }
  }
  return results;
}

// ─── SOURCE 24: JOBGETHER (200k+ global remote jobs) ─────────────────────

async function fetchJobgether(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords.slice(0, 3)) {
    try {
      const res = await fetchWithRetry(
        `https://jobgether.com/api/jobs?q=${encodeURIComponent(kw)}&remote=true&limit=20`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of (data.jobs || data.data || data.results || []).slice(0, 20)) {
        const desc = clean(job.description || job.summary || '');
        results.push({
          title: job.title,
          company: job.company?.name || job.company || 'Unknown',
          location: job.location || 'Remote / Worldwide',
          job_type: 'remote',
          description: desc,
          requirements: extractRequirements(desc),
          nice_to_have: [],
          apply_url: job.url || job.apply_url || `https://jobgether.com/offer/${job.slug || job.id}`,
          apply_email: extractEmail(desc),
          application_method: extractEmail(desc) ? 'email' : 'form',
          source: 'jobgether',
          source_id: String(job.id || job.slug),
        });
      }
    } catch (e) { console.warn('[Jobgether]', e); }
  }
  return results;
}

// ─── SOURCE 25: TRULY REMOTE (worldwide, hire from anywhere) ─────────────

async function fetchTrulyRemote(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  for (const kw of keywords.slice(0, 3)) {
    try {
      const res = await fetchWithRetry(
        `https://trulyremote.co/api/jobs?q=${encodeURIComponent(kw)}&limit=20`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of (data.jobs || data.data || []).slice(0, 15)) {
        const desc = clean(job.description || '');
        results.push({
          title: job.title,
          company: job.company || 'Unknown',
          location: 'Worldwide',
          job_type: 'remote',
          description: desc,
          requirements: extractRequirements(desc),
          nice_to_have: [],
          apply_url: job.url || job.apply_url || `https://trulyremote.co/jobs/${job.slug || job.id}`,
          apply_email: extractEmail(desc),
          application_method: extractEmail(desc) ? 'email' : 'form',
          source: 'trulyremote',
          source_id: String(job.id || job.slug),
        });
      }
    } catch (e) { console.warn('[TrulyRemote]', e); }
  }
  return results;
}

// ─── SOURCE 26: FREELANCE / GIG PLATFORMS ────────────────────────────────
// Toptal, Contra, Gun.io — for contract/freelance React Native work

async function fetchFreelancePlatforms(keywords: string[]): Promise<RawJobData[]> {
  const results: RawJobData[] = [];
  // Gun.io — freelance dev platform with public listings
  try {
    const res = await fetchWithRetry(
      `https://gun.io/find-work/api/?q=${encodeURIComponent('react native')}&format=json`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      for (const job of (data.results || []).slice(0, 10)) {
        const desc = clean(job.description || '');
        results.push({
          title: job.title || 'React Native Freelance',
          company: job.client || 'Client',
          location: 'Remote',
          job_type: 'remote',
          description: desc,
          requirements: extractRequirements(desc),
          nice_to_have: [],
          apply_url: job.url || 'https://gun.io/find-work/',
          application_method: 'form',
          source: 'gunio',
          source_id: String(job.id),
        });
      }
    }
  } catch { }

  // Contra — freelance platform, public job listings
  try {
    const res = await fetchWithRetry(
      `https://contra.com/api/opportunities?skills=react-native&limit=15`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      for (const job of (data.opportunities || data.data || []).slice(0, 10)) {
        const desc = clean(job.description || '');
        results.push({
          title: job.title || 'React Native Contract',
          company: job.client?.name || 'Client',
          location: 'Remote',
          job_type: 'remote',
          description: desc,
          requirements: extractRequirements(desc),
          nice_to_have: [],
          apply_url: job.url || `https://contra.com/opportunity/${job.slug || job.id}`,
          application_method: 'form',
          source: 'contra',
          source_id: String(job.id || job.slug),
        });
      }
    }
  } catch { }

  return results;
}

// ─── MAIN SEARCH FUNCTION ─────────────────────────────────────────────────

export async function searchForJobs(profile: UserProfile): Promise<
  Array<Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
> {
  // Broad keywords — junior/mid/senior + Nigeria-specific
  const keywords = [
    // React Native — all levels
    'React Native Developer',
    'Junior React Native Developer',
    'Mid React Native Developer',
    'React Native',
    // Mobile — all levels
    'Mobile App Developer',
    'Junior Mobile Developer',
    'Mobile Developer',
    'Mobile Engineer',
    'Cross Platform Developer',
    'Expo Developer',
    // Frontend — all levels
    'Junior Frontend Developer',
    'Frontend Developer',
    'React Developer',
    'JavaScript Developer',
    'TypeScript Developer',
    'Next.js Developer',
    // Nigeria/Africa specific
    'Software Developer Nigeria',
    'Remote Developer Nigeria',
    'React Native Lagos',
    'Frontend Developer Lagos',
    'Software Engineer Nigeria',
    // Adjacent roles
    'Technical Writer',
    'Developer Advocate',
    'Solutions Engineer',
  ];

  // Wrap every source — no single failure can crash the whole search
  const safe = <T>(p: Promise<T[]>): Promise<T[]> => p.catch(() => [] as T[]);

  console.log('[search] Fetching from 25 sources in parallel...');

  // Promise.all with safe() — every source gets its own error boundary
  const all: RawJobData[] = (await Promise.all([
    safe(fetchRemotive(keywords.slice(0, 6))),
    safe(fetchJobicy(keywords.slice(0, 6))),
    safe(fetchRemoteOK(keywords.slice(0, 4))),
    safe(fetchWeWorkRemotely(keywords)),
    safe(fetchHimalayas(keywords.slice(0, 5))),
    safe(fetchArbeitnow(keywords.slice(0, 4))),
    safe(fetchFindwork(keywords.slice(0, 4))),
    safe(fetchAdzuna(keywords.slice(0, 4), profile.preferred_locations)),
    safe(fetchTheMuse(keywords.slice(0, 4))),
    safe(fetchGreenhouse()),
    safe(fetchLever()),
    safe(fetchIndeedRSS(keywords.slice(0, 5))),
    safe(fetchStackOverflowJobs(keywords.slice(0, 3))),
    safe(fetchJobberman(keywords.slice(0, 4))),
    safe(fetchMyJobMag(keywords.slice(0, 3))),
    safe(fetchNgCareersRSS(keywords.slice(0, 3))),
    safe(fetchOfferZen(keywords.slice(0, 3))),
    safe(fetchAndela(keywords.slice(0, 3))),
    safe(fetchWellfound(keywords.slice(0, 3))),
    safe(fetchWorkable()),
    safe(fetchDevITJobs(keywords.slice(0, 2))),
    safe(fetchLinkedInPublic(keywords.slice(0, 3))),
    safe(fetchWorkingNomads(keywords)),
    safe(fetchDailyRemote(keywords.slice(0, 4))),
    safe(fetchAdzunaGlobal(keywords.slice(0, 3))),
    safe(fetchJobgether(keywords.slice(0, 3))),
    safe(fetchTrulyRemote(keywords.slice(0, 3))),
    safe(fetchFreelancePlatforms(keywords.slice(0, 2))),
  ])).flat();

  const deduped = smartDedupe(all);
  console.log(`[search] Raw: ${all.length} → After smart dedupe: ${deduped.length} jobs from 26 sources`);

  return deduped.map(j => ({
    ...j,
    match_score: 0,
    match_reasons: [],
    status: 'found' as const,
    found_at: new Date().toISOString(),
  }));
}

// ─── SCORING ──────────────────────────────────────────────────────────────

export async function scoreJobMatch(
  job: Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  profile: UserProfile
): Promise<{ score: number; reasons: string[] }> {
  const prompt = `Rate how well this job matches this candidate. Return ONLY valid JSON, no extra text.

CANDIDATE:
Skills: ${profile.skills.join(', ')}
Experience: ${profile.years_experience} years
Titles: ${profile.job_titles?.join(', ') || 'React Native Developer, Frontend Developer'}
Location preference: ${profile.preferred_locations?.join(', ')}

JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Requirements: ${job.requirements.join(', ')}
Description: ${job.description.slice(0, 600)}

Score 0-100. Be generous for strong React Native/mobile matches.
Return: {"score": 75, "reasons": ["Strong React Native match", "Remote position"]}`;

  try {
    const text = await gemini(prompt, 300);
    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) return keywordScore(job, profile);
    const parsed = JSON.parse(match[0]);
    return { score: Math.min(100, Math.max(0, parsed.score || 0)), reasons: parsed.reasons || [] };
  } catch {
    return keywordScore(job, profile);
  }
}

// ─── COVER LETTER ─────────────────────────────────────────────────────────

export async function generateCoverLetter(job: Job, profile: UserProfile): Promise<{ content: string; subject_line: string }> {
  const prompt = `Write a compelling, tailored cover letter. Return ONLY valid JSON, no markdown fences.

CANDIDATE: ${profile.full_name}
Experience: ${profile.years_experience} years in React Native & Frontend
Skills: ${profile.skills.join(', ')}
Email: ${profile.email} | Phone: ${profile.phone || ''} | Portfolio: ${profile.portfolio_url || ''} | GitHub: ${profile.github_url || ''}
CV highlights: ${profile.cv_text?.slice(0, 800) || ''}

JOB: ${job.title} at ${job.company} (${job.location})
Requirements: ${job.requirements.slice(0, 8).join(', ')}
Description: ${job.description.slice(0, 700)}

Instructions:
- 3-4 tight paragraphs
- Open with something specific about this company/role — no "I am writing to apply"
- Paragraph 2: most relevant experience for THIS role specifically
- Paragraph 3: why THIS company excites you
- Close with confident CTA
- Full contact signature at end
- Professional but human tone

Return: {"content": "full letter text with \\n for line breaks", "subject_line": "max 60 char subject"}`;

  try {
    const text = await gemini(prompt, 1500);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return fallbackCoverLetter(job, profile);
    return JSON.parse(match[0]);
  } catch {
    return fallbackCoverLetter(job, profile);
  }
}

export async function optimizeCVForJob(cvText: string, job: Job): Promise<string> {
  const prompt = `Optimize this CV for the job. Keep all facts accurate — only reorder and rephrase. Return only CV text.\n\nJOB: ${job.title} at ${job.company}\nREQUIREMENTS: ${job.requirements.slice(0, 6).join(', ')}\n\nCV:\n${cvText}`;
  try { return await gemini(prompt, 2000); } catch { return cvText; }
}

// ─── SMART DEDUPLICATION ──────────────────────────────────────────────────
// Dedupes by source+id AND by similar title+company (catches cross-source duplicates)

function smartDedupe(jobs: RawJobData[]): RawJobData[] {
  const seenIds = new Set<string>();
  const seenTitleCompany = new Set<string>();
  return jobs.filter(j => {
    if (!j.title || !j.apply_url) return false;
    // Exact source+id dedup
    const idKey = `${j.source}:${j.source_id}`;
    if (seenIds.has(idKey)) return false;
    seenIds.add(idKey);
    // Fuzzy title+company dedup (catches same job posted on multiple boards)
    const fuzzyKey = `${normalize(j.title)}::${normalize(j.company)}`;
    if (seenTitleCompany.has(fuzzyKey)) return false;
    seenTitleCompany.add(fuzzyKey);
    return true;
  });
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
}

// ─── UTILITIES ────────────────────────────────────────────────────────────

function clean(html: string = ''): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);
}

function extractRequirements(description: string): string[] {
  const keywords = [
    'React Native', 'TypeScript', 'JavaScript', 'Next.js', 'React',
    'Redux', 'Node.js', 'Firebase', 'Expo', 'iOS', 'Android', 'Git',
    'Figma', 'REST API', 'GraphQL', 'Tailwind', 'MobX', 'Context API',
    'React Navigation', 'CI/CD', 'App Store', 'Google Play', 'AWS',
    'React Hooks', 'Agile', 'Scrum', 'Docker', 'PostgreSQL', 'MongoDB',
  ];
  return keywords.filter(k => description.toLowerCase().includes(k.toLowerCase())).slice(0, 12);
}

function extractEmail(text: string): string | undefined {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (!match) return undefined;
  const email = match[0].toLowerCase();
  if (/noreply|example|test@|support@|info@|hello@/.test(email)) return undefined;
  return match[0];
}

function stripCDATA(str: string): string {
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim();
}

function stripXML(str: string): string {
  return str.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
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
  if (s.includes('€')) return 'EUR';
  if (s.includes('₦')) return 'NGN';
  return 'USD';
}

function keywordScore(
  job: Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  profile: UserProfile
): { score: number; reasons: string[] } {
  const title = job.title.toLowerCase();
  const desc = (title + ' ' + job.description + ' ' + job.requirements.join(' ')).toLowerCase();
  const reasons: string[] = [];
  let score = 20; // base

  // Title is the strongest signal — if title contains core skills, big boost
  if (/react native/i.test(job.title)) {
    score += 40;
    reasons.push('React Native in job title');
  } else if (/mobile (developer|engineer|app)/i.test(job.title)) {
    score += 25;
    reasons.push('Mobile developer role');
  } else if (/(frontend|front-end|front end) (developer|engineer)/i.test(job.title)) {
    score += 20;
    reasons.push('Frontend developer role');
  } else if (/react (developer|engineer)/i.test(job.title)) {
    score += 18;
    reasons.push('React developer role');
  }

  // Description/requirements skill matching
  for (const [skill, pts] of [
    ['react native', 15], ['typescript', 8], ['javascript', 6],
    ['react', 6], ['expo', 8], ['mobile', 4],
  ] as [string, number][]) {
    if (desc.includes(skill) && profile.skills.some(s => s.toLowerCase().includes(skill))) {
      score += pts;
      if (reasons.length < 4) reasons.push(`Matches ${skill}`);
    }
  }

  // Bonus skills
  for (const skill of ['next.js', 'redux', 'tailwind', 'firebase', 'node.js', 'figma', 'appwrite']) {
    if (desc.includes(skill) && profile.skills.some(s => s.toLowerCase().includes(skill))) score += 3;
  }

  // Location bonuses
  if (/remote/i.test(job.location || '')) { score += 5; reasons.push('Remote position'); }
  if (/nigeria|lagos|ibadan|abuja|west africa|africa/i.test(job.location || '')) { score += 12; reasons.push('Nigeria/Africa role'); }

  // Level matching — junior/mid roles are good fits
  if (/junior|entry.level|associate|graduate|mid.level|middle/i.test(job.title)) {
    score += 8; reasons.push('Junior/mid level role');
  }

  // Penalize clearly irrelevant roles (non-tech that slipped through)
  if (/beautician|kosmetik|minijob|controlling|buchhalt|marketing manager|hr manager/i.test(job.title)) {
    score = Math.min(score, 20);
  }

  return { score: Math.min(95, score), reasons };
}

function fallbackCoverLetter(job: Job, profile: UserProfile): { content: string; subject_line: string } {
  return {
    content: `Dear Hiring Manager,\n\nI am excited to apply for the ${job.title} role at ${job.company}. With ${profile.years_experience}+ years of hands-on experience in React Native and frontend development, I have built production-grade mobile and web applications that are both performant and user-focused.\n\nMy core skills — ${profile.skills.slice(0, 5).join(', ')} — align directly with your requirements. Across my roles, I have integrated complex APIs, enforced mobile security best practices, and worked closely with designers and backend teams to ship high-quality features on time.\n\nI am drawn to ${job.company} and believe my technical background and product instincts would make a genuine contribution to your team.\n\nThank you for your time and consideration. I would love to discuss further.\n\nBest regards,\n${profile.full_name}\n${profile.email} | ${profile.phone || ''}\nPortfolio: ${profile.portfolio_url || ''} | GitHub: ${profile.github_url || ''}`,
    subject_line: `${job.title} Application — ${profile.full_name}`,
  };
}