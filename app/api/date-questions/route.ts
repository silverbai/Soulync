// app/api/date-questions/route.ts
// Generates personalized 12 questions for a matched pair's date

import { NextRequest, NextResponse } from 'next/server';
import { jsonCompletion } from '@/lib/openai';
import { createServiceClient } from '@/lib/supabase';
import { QUESTION_POOL, QUESTION_SELECTION_PROMPT } from '@/lib/questions-engine';

export async function POST(req: NextRequest) {
  try {
    const { matchId } = await req.json();
    const supabase = createServiceClient();

    // Get match + both users' profiles
    const { data: match } = await supabase
      .from('matches')
      .select('user_a, user_b, compatibility_score')
      .eq('id', matchId)
      .single();

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Get psych profiles
    const { data: profileA } = await supabase
      .from('psych_profiles')
      .select('*')
      .eq('user_id', match.user_a)
      .single();

    const { data: profileB } = await supabase
      .from('psych_profiles')
      .select('*')
      .eq('user_id', match.user_b)
      .single();

    if (!profileA || !profileB) {
      return NextResponse.json({ error: 'Profiles not found' }, { status: 404 });
    }

    // Get user locales
    const { data: userA } = await supabase
      .from('profiles')
      .select('display_name, locale')
      .eq('id', match.user_a)
      .single();

    const { data: userB } = await supabase
      .from('profiles')
      .select('display_name, locale')
      .eq('id', match.user_b)
      .single();

    // Build context for AI
    const context = JSON.stringify({
      user_a: {
        name: userA?.display_name,
        locale: userA?.locale || 'en',
        attachment_style: profileA.attachment_style,
        big_five: {
          openness: profileA.openness,
          conscientiousness: profileA.conscientiousness,
          extraversion: profileA.extraversion,
          agreeableness: profileA.agreeableness,
          neuroticism: profileA.neuroticism,
        },
        conflict_style: profileA.conflict_style,
        love_language: profileA.love_language,
        values: {
          family: profileA.value_family,
          career: profileA.value_career,
          adventure: profileA.value_adventure,
          stability: profileA.value_stability,
          intimacy: profileA.value_intimacy,
          independence: profileA.value_independence,
        },
      },
      user_b: {
        name: userB?.display_name,
        locale: userB?.locale || 'en',
        attachment_style: profileB.attachment_style,
        big_five: {
          openness: profileB.openness,
          conscientiousness: profileB.conscientiousness,
          extraversion: profileB.extraversion,
          agreeableness: profileB.agreeableness,
          neuroticism: profileB.neuroticism,
        },
        conflict_style: profileB.conflict_style,
        love_language: profileB.love_language,
        values: {
          family: profileB.value_family,
          career: profileB.value_career,
          adventure: profileB.value_adventure,
          stability: profileB.value_stability,
          intimacy: profileB.value_intimacy,
          independence: profileB.value_independence,
        },
      },
      question_pool: QUESTION_POOL,
    });

    // Generate personalized questions
    const result = await jsonCompletion<any>(QUESTION_SELECTION_PROMPT, context);

    // Save to database
    await supabase.from('date_questions').upsert({
      match_id: matchId,
      questions: result.questions,
      eye_contact_prompt_en: result.eye_contact_prompt_en,
      eye_contact_prompt_zh: result.eye_contact_prompt_zh,
      date_note_en: result.date_note_en,
      date_note_zh: result.date_note_zh,
    }, { onConflict: 'match_id' });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Date questions API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
