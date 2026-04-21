// app/api/chat/route.ts
// Handles AI psychological interview (rounds 1 & 2)

import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion, jsonCompletion } from '@/lib/openai';
import { createServiceClient } from '@/lib/supabase';
import { 
  ROUND_1_SYSTEM_PROMPT, 
  ROUND_2_SYSTEM_PROMPT, 
  ANALYSIS_PROMPT 
} from '@/lib/ai-prompts';

export async function POST(req: NextRequest) {
  try {
    const { userId, round, messages, userMessage } = await req.json();

    if (!userId || !round || !userMessage) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Build conversation history
    const history = [
      ...messages.map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    // Select prompt based on round
    const systemPrompt = round === 1 ? ROUND_1_SYSTEM_PROMPT : ROUND_2_SYSTEM_PROMPT;

    // Get AI response
    const aiResponse = await chatCompletion(systemPrompt, history);

    // Updated message list
    const updatedMessages = [
      ...messages,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: aiResponse },
    ];

    // Check if round is complete (4-5 exchanges = 8-10 messages)
    const userMessageCount = updatedMessages.filter((m: any) => m.role === 'user').length;
    const isRoundComplete = userMessageCount >= 4 && (
      aiResponse.toLowerCase().includes('round 2') ||
      aiResponse.includes('第二轮') ||
      aiResponse.toLowerCase().includes('profile') ||
      aiResponse.includes('画像') ||
      aiResponse.toLowerCase().includes('thank you for sharing') ||
      aiResponse.includes('谢谢你的分享') ||
      aiResponse.toLowerCase().includes('appreciate your openness') ||
      userMessageCount >= 5
    );

    // Save conversation to database
    await supabase.from('ai_conversations').upsert({
      user_id: userId,
      round: round,
      messages: updatedMessages,
      status: isRoundComplete ? 'completed' : 'in_progress',
      completed_at: isRoundComplete ? new Date().toISOString() : null,
    }, {
      onConflict: 'user_id,round',
    });

    // If round 2 is complete, generate psychological profile
    let psychProfile = null;
    if (round === 2 && isRoundComplete) {
      // Get round 1 conversation too
      const { data: round1 } = await supabase
        .from('ai_conversations')
        .select('messages')
        .eq('user_id', userId)
        .eq('round', 1)
        .single();

      const fullTranscript = [
        '--- Round 1: Icebreaker & Behavioral Patterns ---',
        ...(round1?.messages || []).map((m: any) => `${m.role}: ${m.content}`),
        '--- Round 2: Attachment & Conflict ---',
        ...updatedMessages.map((m: any) => `${m.role}: ${m.content}`),
      ].join('\n');

      // Generate profile using AI
      psychProfile = await jsonCompletion(ANALYSIS_PROMPT, fullTranscript);

      // Save to database
      const profileData = psychProfile as any;
      await supabase.from('psych_profiles').upsert({
        user_id: userId,
        openness: profileData.big_five.openness,
        conscientiousness: profileData.big_five.conscientiousness,
        extraversion: profileData.big_five.extraversion,
        agreeableness: profileData.big_five.agreeableness,
        neuroticism: profileData.big_five.neuroticism,
        attachment_style: profileData.attachment_style,
        conflict_style: profileData.conflict_style,
        value_family: profileData.values.family,
        value_career: profileData.values.career,
        value_adventure: profileData.values.adventure,
        value_stability: profileData.values.stability,
        value_intimacy: profileData.values.intimacy,
        value_independence: profileData.values.independence,
        love_language: profileData.love_language,
        summary_en: profileData.summary_en,
        summary_zh: profileData.summary_zh,
        raw_analysis: profileData,
      }, { onConflict: 'user_id' });

      // Mark onboarding complete
      await supabase
        .from('profiles')
        .update({ onboarding_complete: true })
        .eq('id', userId);
    }

    return NextResponse.json({
      aiMessage: aiResponse,
      messages: updatedMessages,
      isRoundComplete,
      psychProfile,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
