// import { NextRequest, NextResponse } from 'next/server';
// import { supabaseAdmin } from '@/lib/supabase/client';

// export async function GET() {
//   const profileId = process.env.PROFILE_ID;
//   const { data, error } = await supabaseAdmin
//     .from('profiles')
//     .select('*, search_configs(*)')
//     .eq('id', profileId)
//     .single();

//   if (error) return NextResponse.json({ error: error.message }, { status: 500 });
//   return NextResponse.json(data);
// }

// export async function PATCH(request: NextRequest) {
//   const profileId = process.env.PROFILE_ID;
//   const body = await request.json();

//   const { data, error } = await supabaseAdmin
//     .from('profiles')
//     .update(body)
//     .eq('id', profileId)
//     .select()
//     .single();

//   if (error) return NextResponse.json({ error: error.message }, { status: 500 });
//   return NextResponse.json(data);
// }

// // Create profile (onboarding)
// export async function POST(request: NextRequest) {
//   const body = await request.json();

//   const { data, error } = await supabaseAdmin
//     .from('profiles')
//     .insert(body)
//     .select()
//     .single();

//   if (error) return NextResponse.json({ error: error.message }, { status: 500 });

//   // Create default search config
//   await supabaseAdmin.from('search_configs').insert({
//     user_id: data.id,
//     keywords: ['React Native Developer', 'React Native', 'Frontend Developer', 'Mobile Developer'],
//     locations: body.preferred_locations || ['Remote', 'Lagos', 'Ibadan'],
//     job_types: ['remote', 'onsite'],
//     min_match_score: 60,
//     is_active: true
//   });

//   return NextResponse.json(data);
// }

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

// Only these columns exist in the profiles table — never pass anything else to Supabase
const ALLOWED_PROFILE_FIELDS = new Set([
  'email', 'full_name', 'phone', 'location', 'portfolio_url',
  'github_url', 'linkedin_url', 'cv_text', 'cv_filename',
  'skills', 'years_experience', 'job_titles',
  'salary_min', 'salary_max', 'salary_currency',
  'preferred_locations', 'search_active', 'search_interval_hours',
]);

function sanitizeProfileBody(body: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(body).filter(([key]) => ALLOWED_PROFILE_FIELDS.has(key))
  );
}

export async function GET() {
  const profileId = process.env.PROFILE_ID;

  if (!profileId) {
    return NextResponse.json(
      { error: 'PROFILE_ID not set in environment variables. Follow README step 6.' },
      { status: 500 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*, search_configs(*)')
    .eq('id', profileId)
    .single();

  if (error) {
    // PGRST116 = row not found — return helpful message instead of crashing
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Profile not found. Run the INSERT SQL from README step 6 in your Supabase SQL editor.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const profileId = process.env.PROFILE_ID;

  if (!profileId) {
    return NextResponse.json({ error: 'PROFILE_ID not set' }, { status: 500 });
  }

  const raw = await request.json();
  // Strip out any non-column keys (e.g. error, search_configs, id, created_at)
  const body = sanitizeProfileBody(raw);

  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(body)
    .eq('id', profileId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// Create profile (onboarding)
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create default search config
  await supabaseAdmin.from('search_configs').insert({
    user_id: data.id,
    keywords: ['React Native Developer', 'React Native', 'Frontend Developer', 'Mobile Developer'],
    locations: body.preferred_locations || ['Remote', 'Lagos', 'Ibadan'],
    job_types: ['remote', 'onsite'],
    min_match_score: 60,
    is_active: true
  });

  return NextResponse.json(data);
}