-- ============================================================
-- JOB HUNTER - SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor (Dashboard → SQL)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ─────────────────────────────────────────────────────────────
create table if not exists profiles (
  id                    uuid primary key default uuid_generate_v4(),
  email                 text not null unique,
  full_name             text not null,
  phone                 text,
  location              text not null default 'Lagos, Nigeria',
  portfolio_url         text,
  github_url            text,
  linkedin_url          text,
  cv_text               text not null default '',
  cv_filename           text,
  skills                text[] not null default '{}',
  years_experience      integer not null default 1,
  job_titles            text[] not null default '{"React Native Developer","Frontend Developer"}',
  salary_min            integer,
  salary_max            integer,
  salary_currency       text not null default 'NGN',
  preferred_locations   text[] not null default '{"Remote","Lagos","Ibadan"}',
  search_active         boolean not null default true,
  search_interval_hours integer not null default 3,
  last_search_at        timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── JOBS ─────────────────────────────────────────────────────────────────
create table if not exists jobs (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references profiles(id) on delete cascade,
  title                 text not null,
  company               text not null,
  location              text not null,
  job_type              text not null default 'remote' check (job_type in ('remote','onsite','hybrid')),
  salary_min            integer,
  salary_max            integer,
  salary_currency       text,
  description           text not null,
  requirements          text[] not null default '{}',
  nice_to_have          text[] not null default '{}',
  apply_url             text not null,
  apply_email           text,
  application_method    text not null default 'form' check (application_method in ('email','form','linkedin','manual')),
  source                text not null,
  source_id             text,
  match_score           integer not null default 0 check (match_score >= 0 and match_score <= 100),
  match_reasons         text[] not null default '{}',
  status                text not null default 'found' check (status in (
    'found','reviewing','applied','email_sent','needs_manual_apply',
    'interview','offer','rejected','withdrawn'
  )),
  found_at              timestamptz not null default now(),
  applied_at            timestamptz,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  -- Prevent duplicate jobs per user
  unique(user_id, source, source_id)
);

create index if not exists jobs_user_id_idx on jobs(user_id);
create index if not exists jobs_status_idx on jobs(user_id, status);
create index if not exists jobs_match_score_idx on jobs(user_id, match_score desc);
create index if not exists jobs_found_at_idx on jobs(user_id, found_at desc);

-- ─── COVER LETTERS ────────────────────────────────────────────────────────
create table if not exists cover_letters (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references profiles(id) on delete cascade,
  job_id                uuid not null references jobs(id) on delete cascade,
  content               text not null,
  subject_line          text not null,
  version               integer not null default 1,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists cover_letters_job_idx on cover_letters(job_id);

-- ─── APPLICATIONS ─────────────────────────────────────────────────────────
create table if not exists applications (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references profiles(id) on delete cascade,
  job_id                uuid not null references jobs(id) on delete cascade,
  cover_letter_id       uuid references cover_letters(id),
  status                text not null default 'applied',
  applied_at            timestamptz not null default now(),
  email_sent_at         timestamptz,
  email_message_id      text,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists applications_user_idx on applications(user_id);
create index if not exists applications_job_idx on applications(job_id);

-- ─── EMAIL NOTIFICATIONS ──────────────────────────────────────────────────
create table if not exists email_notifications (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references profiles(id) on delete cascade,
  job_id                uuid references jobs(id) on delete set null,
  type                  text not null check (type in ('new_match','applied','manual_apply_needed','weekly_summary')),
  subject               text not null,
  sent_at               timestamptz not null default now(),
  resend_id             text
);

-- ─── SEARCH CONFIG ────────────────────────────────────────────────────────
create table if not exists search_configs (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references profiles(id) on delete cascade,
  keywords              text[] not null default '{"React Native","React Native Developer","Frontend Developer"}',
  locations             text[] not null default '{"Remote","Lagos","Ibadan"}',
  job_types             text[] not null default '{"remote","onsite"}',
  min_match_score       integer not null default 60,
  excluded_companies    text[] not null default '{}',
  is_active             boolean not null default true,
  created_at            timestamptz not null default now()
);

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();
create trigger jobs_updated_at before update on jobs
  for each row execute function update_updated_at();
create trigger cover_letters_updated_at before update on cover_letters
  for each row execute function update_updated_at();
create trigger applications_updated_at before update on applications
  for each row execute function update_updated_at();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────
alter table profiles enable row level security;
alter table jobs enable row level security;
alter table cover_letters enable row level security;
alter table applications enable row level security;
alter table email_notifications enable row level security;
alter table search_configs enable row level security;

-- Service role bypasses RLS automatically (for API routes)
-- These policies are for future multi-user / auth support

create policy "service_role_profiles" on profiles using (true) with check (true);
create policy "service_role_jobs" on jobs using (true) with check (true);
create policy "service_role_cover_letters" on cover_letters using (true) with check (true);
create policy "service_role_applications" on applications using (true) with check (true);
create policy "service_role_email_notifications" on email_notifications using (true) with check (true);
create policy "service_role_search_configs" on search_configs using (true) with check (true);
