// app/api/date-plans/route.ts
// Generates AI date plans and handles user selections

import { NextRequest, NextResponse } from 'next/server';
import { jsonCompletion } from '@/lib/openai';
import { createServiceClient } from '@/lib/supabase';
import { DATE_PLAN_PROMPT } from '@/lib/ai-prompts';

// POST: Generate date plans for a match
export async function POST(req: NextRequest) {
  try {
    const { matchId } = await req.json();
    const supabase = createServiceClient();

    // Get match details
    const { data: match } = await supabase
      .from('matches')
      .select('*, user_a_profile:profiles!user_a(*), user_b_profile:profiles!user_b(*)')
      .eq('id', matchId)
      .single();

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Get date preferences for both users
    const { data: prefA } = await supabase
      .from('date_preferences')
      .select('*')
      .eq('user_id', match.user_a)
      .single();

    const { data: prefB } = await supabase
      .from('date_preferences')
      .select('*')
      .eq('user_id', match.user_b)
      .single();

    // Get psych profiles for personality-based venue selection
    const { data: psychA } = await supabase
      .from('psych_profiles')
      .select('extraversion, openness')
      .eq('user_id', match.user_a)
      .single();

    const { data: psychB } = await supabase
      .from('psych_profiles')
      .select('extraversion, openness')
      .eq('user_id', match.user_b)
      .single();

    const now = new Date();
    const input = JSON.stringify({
      current_date: now.toISOString().split('T')[0],
      current_day: now.toLocaleDateString('en', { weekday: 'long' }),
      user_a: {
        city: (match as any).user_a_profile?.city || 'New York',
        available_slots: prefA?.available_slots || [
          { day: 'weekday_evening', start: '18:00', end: '22:00' },
          { day: 'weekend', start: '10:00', end: '22:00' },
        ],
        location: prefA ? { lat: prefA.home_lat, lng: prefA.home_lng } : null,
        venue_types: prefA?.venue_types || ['cafe', 'park'],
        extraversion: psychA?.extraversion || 5,
        openness: psychA?.openness || 5,
      },
      user_b: {
        city: (match as any).user_b_profile?.city || 'New York',
        available_slots: prefB?.available_slots || [
          { day: 'weekday_evening', start: '18:00', end: '22:00' },
          { day: 'weekend', start: '10:00', end: '22:00' },
        ],
        location: prefB ? { lat: prefB.home_lat, lng: prefB.home_lng } : null,
        venue_types: prefB?.venue_types || ['cafe', 'park'],
        extraversion: psychB?.extraversion || 5,
        openness: psychB?.openness || 5,
      },
    });

    const result = await jsonCompletion<any>(DATE_PLAN_PROMPT, input);

    // Save each plan to database
    const plans = [];
    for (const plan of result.plans) {
      const { data: saved } = await supabase
        .from('date_plans')
        .insert({
          match_id: matchId,
          venue_name: plan.venue_name,
          venue_address: plan.venue_address,
          venue_lat: plan.venue_lat,
          venue_lng: plan.venue_lng,
          proposed_date: plan.date,
          proposed_time: plan.time,
          duration_minutes: plan.duration_minutes,
          secret_phrase_en: result.secret_phrase_en,
          secret_phrase_zh: result.secret_phrase_zh,
          response_a: 'pending',
          response_b: 'pending',
        })
        .select()
        .single();

      plans.push({ ...saved, vibe_en: plan.vibe_en, vibe_zh: plan.vibe_zh });
    }

    return NextResponse.json({ plans, secret_phrase: result.secret_phrase_en });
  } catch (error: any) {
    console.error('Date plans API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: User responds to a date plan
export async function PATCH(req: NextRequest) {
  try {
    const { planId, userId, response, matchId } = await req.json();
    const supabase = createServiceClient();

    // Determine if user is A or B
    const { data: match } = await supabase
      .from('matches')
      .select('user_a, user_b')
      .eq('id', matchId)
      .single();

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const isUserA = match.user_a === userId;
    const field = isUserA ? 'response_a' : 'response_b';

    // Update the plan
    await supabase
      .from('date_plans')
      .update({ [field]: response })
      .eq('id', planId);

    // Check if both accepted the same plan
    const { data: plan } = await supabase
      .from('date_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (plan?.response_a === 'accepted' && plan?.response_b === 'accepted') {
      // Date confirmed!
      await supabase
        .from('date_plans')
        .update({ status: 'confirmed' })
        .eq('id', planId);

      await supabase
        .from('matches')
        .update({ status: 'date_confirmed' })
        .eq('id', matchId);

      return NextResponse.json({ status: 'confirmed', plan });
    }

    // If user rejected, track it
    if (response === 'rejected') {
      const rejectField = isUserA ? 'rejection_count_a' : 'rejection_count_b';
      await supabase.rpc('increment_rejection', {
        match_id: matchId,
        field_name: rejectField,
      });
    }

    return NextResponse.json({ status: 'pending', plan });
  } catch (error: any) {
    console.error('Date plan PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
