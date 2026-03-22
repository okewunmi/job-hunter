// ─── RECRUITER EMAIL FINDER ──────────────────────────────────────────────
// Uses Hunter.io free tier (25 searches/month) + fallback pattern guessing
// Get free key at: https://hunter.io → API (free, no card needed)

export interface RecruiterContact {
  email: string;
  name?: string;
  position?: string;
  confidence: number; // 0-100
  source: 'hunter' | 'pattern' | 'scraped';
}

// ── Hunter.io domain search ───────────────────────────────────────────────

async function searchHunterIO(domain: string): Promise<RecruiterContact[]> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}&limit=5`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const contacts: RecruiterContact[] = [];

    for (const email of (data.data?.emails || []).slice(0, 5)) {
      // Prioritise HR, talent, recruiting roles
      const pos = (email.position || '').toLowerCase();
      const isRecruiter = /recruit|talent|hr|hire|people|staffing|engineer manager|tech lead/i.test(pos);
      contacts.push({
        email: email.value,
        name: `${email.first_name || ''} ${email.last_name || ''}`.trim() || undefined,
        position: email.position || undefined,
        confidence: email.confidence || 50,
        source: 'hunter',
      });
      // Put recruiters first
      if (isRecruiter) contacts.unshift(contacts.pop()!);
    }

    // Also try the generic pattern if Hunter found it
    if (data.data?.pattern && data.data?.domain) {
      const generic = data.data.pattern
        .replace('{first}', 'jobs')
        .replace('{last}', '')
        .replace(/\.$/, '')
        + '@' + data.data.domain;
      contacts.push({ email: generic, confidence: 40, source: 'pattern' });
    }

    return contacts;
  } catch (e) {
    console.warn('[Hunter.io]', e);
    return [];
  }
}

// ── Email pattern guesser (fallback when no Hunter key) ───────────────────

function guessCompanyEmails(companyName: string, domain?: string): RecruiterContact[] {
  if (!domain) {
    // Try to derive domain from company name
    const cleaned = companyName
      .toLowerCase()
      .replace(/\s+(inc|ltd|llc|pvt|co|corp|group|technologies|solutions|labs|studio|studios|tech)\.?$/i, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 30);
    domain = `${cleaned}.com`;
  }

  const patterns = [
    `jobs@${domain}`,
    `careers@${domain}`,
    `hiring@${domain}`,
    `talent@${domain}`,
    `hr@${domain}`,
    `recruit@${domain}`,
  ];

  return patterns.slice(0, 3).map(email => ({
    email,
    confidence: 25,
    source: 'pattern' as const,
  }));
}

// ── Extract domain from job URL ───────────────────────────────────────────

function extractDomain(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    // Skip job board domains
    const boards = ['linkedin.com', 'indeed.com', 'glassdoor.com', 'remotive.com',
      'jobicy.com', 'remoteok.com', 'wellfound.com', 'greenhouse.io', 'lever.co',
      'workable.com', 'jobberman.com', 'boards.greenhouse.io', 'apply.workable.com'];
    if (boards.some(b => hostname.includes(b))) return null;
    // Remove www.
    return hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

// ── Main function ─────────────────────────────────────────────────────────

export async function findRecruiterEmail(
  companyName: string,
  applyUrl: string
): Promise<RecruiterContact | null> {
  const domain = extractDomain(applyUrl);

  // Try Hunter.io first (most accurate)
  if (domain && process.env.HUNTER_API_KEY) {
    const hunterResults = await searchHunterIO(domain);
    if (hunterResults.length > 0) {
      // Return highest confidence result
      return hunterResults.sort((a, b) => b.confidence - a.confidence)[0];
    }
  }

  // Fallback: pattern guessing
  const guessed = guessCompanyEmails(companyName, domain || undefined);
  if (guessed.length > 0) return guessed[0];

  return null;
}

// ── Check remaining Hunter.io quota ──────────────────────────────────────

export async function getHunterQuota(): Promise<{ used: number; available: number } | null> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`https://api.hunter.io/v2/account?api_key=${apiKey}`);
    if (!res.ok) return null;
    const data = await res.json();
    const searches = data.data?.requests?.searches;
    return {
      used: searches?.used || 0,
      available: searches?.available || 0,
    };
  } catch {
    return null;
  }
}