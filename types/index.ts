// ─── Database Types ────────────────────────────────────────────────────────

export type JobStatus =
  | 'found'
  | 'reviewing'
  | 'applied'
  | 'email_sent'
  | 'needs_manual_apply'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export type JobType = 'remote' | 'onsite' | 'hybrid';
export type ApplicationMethod = 'email' | 'form' | 'linkedin' | 'manual';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  location: string;
  portfolio_url?: string;
  github_url?: string;
  linkedin_url?: string;
  cv_text: string;           // extracted plain text from CV
  cv_filename?: string;
  skills: string[];
  years_experience: number;
  job_titles: string[];      // e.g. ["React Native Developer", "Frontend Developer"]
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;   // NGN, USD
  preferred_locations: string[];  // e.g. ["Remote", "Lagos", "Ibadan"]
  search_active: boolean;
  search_interval_hours: number;
  last_search_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  user_id: string;
  title: string;
  company: string;
  location: string;
  job_type: JobType;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  description: string;
  requirements: string[];
  nice_to_have: string[];
  apply_url: string;
  apply_email?: string;
  application_method: ApplicationMethod;
  source: string;            // 'linkedin', 'indeed', 'weworkremotely', 'company_site', 'glassdoor', 'remotive'
  source_id?: string;        // original job ID from source
  match_score: number;       // 0-100
  match_reasons: string[];
  status: JobStatus;
  found_at: string;
  applied_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CoverLetter {
  id: string;
  user_id: string;
  job_id: string;
  content: string;
  subject_line: string;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  job?: Job;
}

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  cover_letter_id?: string;
  status: JobStatus;
  applied_at: string;
  email_sent_at?: string;
  email_message_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  job?: Job;
  cover_letter?: CoverLetter;
}

export interface SearchConfig {
  id: string;
  user_id: string;
  keywords: string[];
  locations: string[];
  job_types: JobType[];
  min_match_score: number;
  excluded_companies: string[];
  is_active: boolean;
  created_at: string;
}

export interface EmailNotification {
  id: string;
  user_id: string;
  job_id?: string;
  type: 'new_match' | 'applied' | 'manual_apply_needed' | 'weekly_summary';
  subject: string;
  sent_at: string;
  resend_id?: string;
}

// ─── API Response Types ────────────────────────────────────────────────────

export interface JobSearchResult {
  jobs: Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>[];
  total_found: number;
  search_duration_ms: number;
}

export interface DashboardStats {
  total_found: number;
  total_applied: number;
  total_interviews: number;
  total_offers: number;
  avg_match_score: number;
  needs_manual_apply: number;
  this_week_found: number;
  this_week_applied: number;
}

export interface SearchResponse {
  success: boolean;
  message: string;
  jobs_found: number;
  jobs_saved: number;
  notifications_sent: number;
}
