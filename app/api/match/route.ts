// app/api/match/route.ts
// Finds best match using AI compatibility + Digital Twin Simulation
// This is the "Black Mirror moment" — AI personas interact in virtual scenarios

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { openai, AI_MODEL } from '@/lib/openai';
import { runFullSimulation } from '@/lib/simulation-engine';

export const maxDuration = 120; // Allow up to 2 min for simulations

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    const supabase = createServiceClient();

    // ── 1. Get current user's profiles ──
    const { data: myProfile } = await supabase
      .from('psych_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!myProfile) {
      return NextResponse.json({ error: 'Complete onboarding first' }, { status: 400 });
    }

    const { data: myInfo } = await supabase
      .from('profiles')
      .select('gender, seeking, city')
      .eq('id', userId)
      .single();

    // ── 2. Find candidates (exclude already matched) ──
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('user_a, user_b')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);

    const matchedUserIds = new Set(
      (existingMatches || []).flatMap(m => [m.user_a, m.user_b])
    );
    matchedUserIds.delete(userId);

    let query = supabase
      .from('profiles')
      .select('id, display_name, gender')
      .eq('onboarding_complete', true)
      .eq('is_active', true)
      .neq('id', userId);

    if (myInfo?.seeking !== 'everyone') {
      query = query.eq('gender', myInfo?.seeking);
    }

    const { data: candidates } = await query.limit(20);
    const eligible = (candidates || []).filter(c => !matchedUserIds.has(c.id));

    if (eligible.length === 0) {
      return NextResponse.json({ error: 'No candidates available yet' }, { status: 404 });
    }

    const { data: candidateProfiles } = await supabase
      .from('psych_profiles')
      .select('*')
      .in('user_id', eligible.map(c => c.id));

    if (!candidateProfiles || candidateProfiles.length === 0) {
      return NextResponse.json({ error: 'No profiled candidates yet' }, { status: 404 });
    }

    // ── 3. Phase 1: Quick compatibility pre-screen ──
    const preScreened: { candidateProfile: any; quickScore: number; candidateInfo: any }[] = [];

    for (const cp of candidateProfiles) {
      const quickScore = calculateQuickCompatibility(myProfile, cp);
      const info = eligible.find(c => c.id === cp.user_id);
      if (quickScore >= 40 && info) {
        preScreened.push({ candidateProfile: cp, quickScore, candidateInfo: info });
      }
    }

    preScreened.sort((a, b) => b.quickScore - a.quickScore);
    const topCandidates = preScreened.slice(0, 3);

    if (topCandidates.length === 0) {
      return NextResponse.json({ error: 'No compatible matches found.' }, { status: 404 });
    }

    // ── 4. Phase 2: Digital Twin Simulation ──
    // THE BLACK MIRROR CORE: AI personas interact across 5 scenarios
    let bestMatch: any = null;
    let bestSimulation: any = null;
    let bestTotalScore = 0;

    for (const candidate of topCandidates) {
      const simulation = await runFullSimulation(
        openai,
        AI_MODEL,
        myProfile,
        candidate.candidateProfile,
        2 // iterations per scenario (MVP=2, prod=5+)
      );

      // Combined: 30% static + 70% simulation
      const totalScore = Math.round(
        candidate.quickScore * 0.3 + simulation.overallScore * 0.7
      );

      if (totalScore > bestTotalScore) {
        bestTotalScore = totalScore;
        bestMatch = candidate;
        bestSimulation = simulation;
      }
    }

    if (!bestMatch || bestTotalScore < 50) {
      return NextResponse.json({ error: 'No strong matches after simulation.' }, { status: 404 });
    }

    // ── 5. Save match ──
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        user_a: userId,
        user_b: bestMatch.candidateProfile.user_id,
        compatibility_score: bestTotalScore,
        match_reason_en: bestSimulation.summary_en,
        match_reason_zh: bestSimulation.summary_zh,
        ai_analysis: {
          quick_score: bestMatch.quickScore,
          simulation_score: bestSimulation.overallScore,
          combined_score: bestTotalScore,
          scenarios: bestSimulation.scenarioResults,
          red_flags: bestSimulation.redFlags,
          green_flags: bestSimulation.greenFlags,
          total_simulations: bestSimulation.simulations.length,
        },
        status: 'date_planning',
      })
      .select()
      .single();

    if (matchError) {
      return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
    }

    return NextResponse.json({
      match: {
        id: match.id,
        partnerName: bestMatch.candidateInfo.display_name,
        score: bestTotalScore,
        simulationScore: bestSimulation.overallScore,
        scenarioResults: bestSimulation.scenarioResults.map((s: any) => ({
          name_en: s.name_en,
          name_zh: s.name_zh,
          score: s.compositeScore,
        })),
        redFlags: bestSimulation.redFlags,
        greenFlags: bestSimulation.greenFlags,
        summary_en: bestSimulation.summary_en,
        summary_zh: bestSimulation.summary_zh,
        sampleConversation: bestSimulation.simulations[0]?.conversation?.slice(0, 4) || [],
      },
    });
  } catch (error: any) {
    console.error('Match API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── Quick static compatibility pre-screening ──
function calculateQuickCompatibility(a: any, b: any): number {
  let score = 50;

  // Attachment compatibility (±20)
  const am: Record<string, Record<string, number>> = {
    secure:  { secure: 15, anxious: 12, avoidant: 10, fearful: 5 },
    anxious: { secure: 12, anxious: 0, avoidant: -15, fearful: -5 },
    avoidant:{ secure: 10, anxious: -15, avoidant: -5, fearful: -10 },
    fearful: { secure: 5, anxious: -5, avoidant: -10, fearful: -10 },
  };
  score += am[a.attachment_style]?.[b.attachment_style] ?? 0;

  // Value alignment (±15)
  const vDiffs = [
    Math.abs((a.value_family || 5) - (b.value_family || 5)),
    Math.abs((a.value_stability || 5) - (b.value_stability || 5)),
    Math.abs((a.value_intimacy || 5) - (b.value_intimacy || 5)),
  ];
  score += Math.round((5 - vDiffs.reduce((s, d) => s + d, 0) / vDiffs.length) * 3);

  // Personality complementarity (±10)
  const eGap = Math.abs((a.extraversion || 5) - (b.extraversion || 5));
  if (eGap >= 2 && eGap <= 4) score += 5;
  const cGap = Math.abs((a.conscientiousness || 5) - (b.conscientiousness || 5));
  if (cGap <= 2) score += 5;

  // Conflict compatibility (±5)
  if (a.conflict_style === b.conflict_style) score += 5;
  else if (a.conflict_style === 'collaborate' || b.conflict_style === 'collaborate') score += 3;
  else if (
    (a.conflict_style === 'confront' && b.conflict_style === 'avoid') ||
    (a.conflict_style === 'avoid' && b.conflict_style === 'confront')
  ) score -= 5;

  return Math.min(100, Math.max(0, score));
}
