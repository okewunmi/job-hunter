// ─── ATS SCORER ──────────────────────────────────────────────────────────
// Scores your CV against a job description the way ATS software does.
// Returns a 0-100 score + keyword gaps + rewrite suggestions.

import type { Job, UserProfile } from '@/types';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`;

export interface ATSResult {
  score: number;              // 0-100
  grade: string;              // A, B, C, D, F
  keyword_matches: string[];  // keywords found in both CV and JD
  missing_keywords: string[]; // important JD keywords missing from CV
  suggestions: string[];      // specific rewrite suggestions
  summary: string;            // one-line verdict
}

export async function scoreATSMatch(
  job: Job,
  profile: UserProfile
): Promise<ATSResult> {
  const prompt = `You are an expert ATS (Applicant Tracking System) analyzer.

Score how well this CV matches the job description, exactly like ATS software does.
Focus on: keyword density, required skills presence, experience level match, title match.

JOB TITLE: ${job.title}
COMPANY: ${job.company}
JOB DESCRIPTION:
${job.description.slice(0, 1200)}

REQUIREMENTS: ${job.requirements.join(', ')}

CANDIDATE CV:
${profile.cv_text.slice(0, 1500)}

CANDIDATE SKILLS: ${profile.skills.join(', ')}
YEARS EXPERIENCE: ${profile.years_experience}

Return ONLY valid JSON (no markdown):
{
  "score": 72,
  "grade": "B",
  "keyword_matches": ["React Native", "TypeScript", "Expo"],
  "missing_keywords": ["GraphQL", "AWS", "CI/CD"],
  "suggestions": [
    "Add 'Expo' to your skills section — it's mentioned 3 times in the JD",
    "Include a CI/CD pipeline example in your BONDAH bullet points"
  ],
  "summary": "Strong React Native match but missing cloud/DevOps keywords"
}

Grade scale: 85-100=A, 70-84=B, 55-69=C, 40-54=D, <40=F`;

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 600, temperature: 0.3 }
      })
    });

    if (!res.ok) return fallbackATS(job, profile);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return fallbackATS(job, profile);
    const parsed = JSON.parse(match[0]);
    return {
      score: Math.min(100, Math.max(0, parsed.score || 0)),
      grade: parsed.grade || gradeFromScore(parsed.score),
      keyword_matches: parsed.keyword_matches || [],
      missing_keywords: parsed.missing_keywords || [],
      suggestions: parsed.suggestions || [],
      summary: parsed.summary || '',
    };
  } catch (e) {
    console.warn('[ATS scorer] error:', e);
    return fallbackATS(job, profile);
  }
}

function gradeFromScore(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function fallbackATS(job: Job, profile: UserProfile): ATSResult {
  // Simple keyword overlap scoring as fallback
  const cvText = (profile.cv_text + ' ' + profile.skills.join(' ')).toLowerCase();
  const jdText = (job.description + ' ' + job.requirements.join(' ')).toLowerCase();
  const jdWords = jdText.match(/\b[a-z][a-z.+#]{2,}\b/g) || [];
  const uniqueJdKeywords = jdWords.filter((w, i, arr) => arr.indexOf(w) === i).filter(w => w.length > 3);
  const matches = uniqueJdKeywords.filter(w => cvText.includes(w)).slice(0, 8);
  const missing = job.requirements.filter(r => !cvText.includes(r.toLowerCase())).slice(0, 5);
  const score = Math.min(85, 30 + matches.length * 4);
  return {
    score,
    grade: gradeFromScore(score),
    keyword_matches: matches,
    missing_keywords: missing,
    suggestions: missing.slice(0, 3).map(m => `Consider adding "${m}" to your CV`),
    summary: `${matches.length} keyword matches found`,
  };
}