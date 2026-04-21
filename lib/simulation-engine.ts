// ============================================
// SOULYNC DIGITAL TWIN SIMULATION ENGINE
// The "Black Mirror Moment" — AI simulates two
// user personas interacting across conflict,
// intimacy, and life-challenge scenarios.
// ============================================

// ── Scenario Definitions ──
// Each scenario is a pressure-test for the relationship.
// The AI roleplays both personas and evaluates the outcome.

export const SIMULATION_SCENARIOS = [
  {
    id: 'first_date',
    name_en: 'First date',
    name_zh: '第一次约会',
    prompt: `Simulate a first date between Person A and Person B at a quiet café. 
They've never met before. Simulate 6-8 exchanges of natural conversation.
Pay attention to: Who initiates topics? Who asks deeper questions? Does the conversation flow or stall?
Does one person dominate? Do they find genuine common ground or just make small talk?`,
    weight: 0.15,
  },
  {
    id: 'disagreement',
    name_en: 'Opinion clash',
    name_zh: '意见分歧',
    prompt: `Person A and Person B are on their 4th date. A topic comes up where they strongly disagree 
(politics, lifestyle choice, or a moral dilemma). Simulate 6-8 exchanges.
Pay attention to: Does either person shut down? Get defensive? Try to "win"? 
Or do they listen, ask questions, and find middle ground?`,
    weight: 0.25,
  },
  {
    id: 'vulnerability',
    name_en: 'Emotional vulnerability',
    name_zh: '情感脆弱时刻',
    prompt: `Person A has had a terrible day — a career setback or family conflict. They share this with Person B.
Simulate 6-8 exchanges.
Pay attention to: Does B offer genuine empathy or try to "fix" it? Does A open up or deflect?
How does each person's attachment style show up under emotional stress?`,
    weight: 0.25,
  },
  {
    id: 'external_pressure',
    name_en: 'External pressure',
    name_zh: '外部压力',
    prompt: `Person A and Person B have been together for 3 months. Person A's close friend/family member 
expresses disapproval of the relationship. Simulate 6-8 exchanges where they discuss this.
Pay attention to: Does A defend the relationship or waver? Does B feel secure or threatened?
How do they navigate loyalty to each other vs. external relationships?`,
    weight: 0.20,
  },
  {
    id: 'long_term_planning',
    name_en: 'Future planning',
    name_zh: '未来规划',
    prompt: `Person A and Person B are 6 months in. They discuss where the relationship is going — 
living together, career moves to different cities, or having kids someday. Simulate 6-8 exchanges.
Pay attention to: Are their life goals compatible? Can they compromise?
Does one person avoid the conversation while the other pushes for answers?`,
    weight: 0.15,
  },
];

// ── The Simulation System Prompt ──
// This is the "brain" that roleplays both personas.

export const SIMULATION_SYSTEM_PROMPT = `You are Soulync's Digital Twin Engine. Your job is to simulate a realistic interaction between two people based on their deep psychological profiles.

You will receive:
1. Person A's psychological profile (Big Five, attachment style, conflict style, values, love language)
2. Person B's psychological profile (same)
3. A scenario description

YOUR TASK:
Roleplay BOTH Person A and Person B having a natural conversation in the given scenario. 
Generate 6-8 exchanges (back and forth). Make it realistic — not idealized, not catastrophic.

CRITICAL RULES:
- Person A's responses MUST reflect their actual psychological profile. An avoidant person WILL pull back when things get emotional. An anxious person WILL seek reassurance. A confrontational person WILL push back in disagreements.
- Person B's responses MUST similarly reflect their profile. Do NOT make either person act "out of character" to create a happy ending.
- Include subtle behavioral cues: pauses, topic changes, deflections, warmth, humor, defensiveness — whatever is psychologically authentic.
- The conversation should feel like eavesdropping on two real people, not a therapy session.

After the simulated conversation, provide your analysis.

OUTPUT FORMAT — respond ONLY with this JSON, no markdown:
{
  "conversation": [
    {"speaker": "A", "text": "..."},
    {"speaker": "B", "text": "..."}
  ],
  "analysis": {
    "communication_quality": <1-10>,
    "emotional_attunement": <1-10>,
    "conflict_resolution": <1-10>,
    "mutual_respect": <1-10>,
    "long_term_potential": <1-10>,
    "red_flags": ["<specific behavioral concern, or empty array if none>"],
    "green_flags": ["<specific positive dynamic>"],
    "narrative_en": "<2-3 sentence summary of how this interaction went and what it reveals>",
    "narrative_zh": "<same in Chinese>"
  }
}`;

// ── Run a single scenario simulation ──
export async function simulateScenario(
  openaiClient: any,
  model: string,
  profileA: any,
  profileB: any,
  scenario: typeof SIMULATION_SCENARIOS[0]
): Promise<any> {
  const userPrompt = `
PERSON A PROFILE:
- Big Five: Openness ${profileA.openness}/10, Conscientiousness ${profileA.conscientiousness}/10, Extraversion ${profileA.extraversion}/10, Agreeableness ${profileA.agreeableness}/10, Neuroticism ${profileA.neuroticism}/10
- Attachment Style: ${profileA.attachment_style}
- Conflict Style: ${profileA.conflict_style}
- Core Values: Family ${profileA.value_family}/10, Career ${profileA.value_career}/10, Adventure ${profileA.value_adventure}/10, Stability ${profileA.value_stability}/10, Intimacy ${profileA.value_intimacy}/10, Independence ${profileA.value_independence}/10
- Love Language: ${profileA.love_language}

PERSON B PROFILE:
- Big Five: Openness ${profileB.openness}/10, Conscientiousness ${profileB.conscientiousness}/10, Extraversion ${profileB.extraversion}/10, Agreeableness ${profileB.agreeableness}/10, Neuroticism ${profileB.neuroticism}/10
- Attachment Style: ${profileB.attachment_style}
- Conflict Style: ${profileB.conflict_style}
- Core Values: Family ${profileB.value_family}/10, Career ${profileB.value_career}/10, Adventure ${profileB.value_adventure}/10, Stability ${profileB.value_stability}/10, Intimacy ${profileB.value_intimacy}/10, Independence ${profileB.value_independence}/10
- Love Language: ${profileB.love_language}

SCENARIO: ${scenario.prompt}

Simulate their interaction now.`;

  const response = await openaiClient.chat.completions.create({
    model,
    temperature: 0.85, // High creativity for realistic variation
    max_tokens: 2000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SIMULATION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  const text = response.choices[0]?.message?.content ?? '{}';
  return JSON.parse(text);
}

// ── Run full simulation suite (all scenarios) ──
export async function runFullSimulation(
  openaiClient: any,
  model: string,
  profileA: any,
  profileB: any,
  iterations: number = 3 // Run each scenario multiple times for statistical reliability
): Promise<{
  overallScore: number;
  scenarioResults: any[];
  redFlags: string[];
  greenFlags: string[];
  summary_en: string;
  summary_zh: string;
  simulations: any[];
}> {
  const allResults: any[] = [];
  const allSimulations: any[] = [];

  for (const scenario of SIMULATION_SCENARIOS) {
    const scenarioRuns: any[] = [];

    for (let i = 0; i < iterations; i++) {
      try {
        const result = await simulateScenario(
          openaiClient, model, profileA, profileB, scenario
        );
        scenarioRuns.push(result);
        allSimulations.push({
          scenario: scenario.id,
          iteration: i + 1,
          conversation: result.conversation,
          analysis: result.analysis,
        });
      } catch (err) {
        console.error(`Simulation failed for ${scenario.id} iteration ${i}:`, err);
      }
    }

    if (scenarioRuns.length === 0) continue;

    // Average scores across iterations for this scenario
    const avgScores = {
      communication_quality: avg(scenarioRuns.map(r => r.analysis?.communication_quality || 5)),
      emotional_attunement: avg(scenarioRuns.map(r => r.analysis?.emotional_attunement || 5)),
      conflict_resolution: avg(scenarioRuns.map(r => r.analysis?.conflict_resolution || 5)),
      mutual_respect: avg(scenarioRuns.map(r => r.analysis?.mutual_respect || 5)),
      long_term_potential: avg(scenarioRuns.map(r => r.analysis?.long_term_potential || 5)),
    };

    // Composite score for this scenario (0-100)
    const scenarioScore = (
      avgScores.communication_quality * 0.2 +
      avgScores.emotional_attunement * 0.25 +
      avgScores.conflict_resolution * 0.25 +
      avgScores.mutual_respect * 0.15 +
      avgScores.long_term_potential * 0.15
    ) * 10;

    allResults.push({
      scenario: scenario.id,
      name_en: scenario.name_en,
      name_zh: scenario.name_zh,
      weight: scenario.weight,
      scores: avgScores,
      compositeScore: Math.round(scenarioScore),
      redFlags: scenarioRuns.flatMap(r => r.analysis?.red_flags || []),
      greenFlags: scenarioRuns.flatMap(r => r.analysis?.green_flags || []),
      narratives: scenarioRuns.map(r => ({
        en: r.analysis?.narrative_en,
        zh: r.analysis?.narrative_zh,
      })),
    });
  }

  // Calculate weighted overall score
  const overallScore = Math.round(
    allResults.reduce((sum, r) => sum + r.compositeScore * r.weight, 0)
  );

  // Deduplicate flags
  const redFlags = [...new Set(allResults.flatMap(r => r.redFlags))].slice(0, 5);
  const greenFlags = [...new Set(allResults.flatMap(r => r.greenFlags))].slice(0, 5);

  return {
    overallScore: Math.min(99, Math.max(1, overallScore)),
    scenarioResults: allResults,
    redFlags,
    greenFlags,
    summary_en: generateSummaryEN(overallScore, allResults, greenFlags, redFlags),
    summary_zh: generateSummaryZH(overallScore, allResults, greenFlags, redFlags),
    simulations: allSimulations,
  };
}

// ── Helper: Average ──
function avg(nums: number[]): number {
  if (nums.length === 0) return 5;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ── Generate human-readable summaries ──
function generateSummaryEN(
  score: number, results: any[], greens: string[], reds: string[]
): string {
  const bestScenario = results.reduce((best, r) => 
    r.compositeScore > best.compositeScore ? r : best, results[0]);
  const worstScenario = results.reduce((worst, r) => 
    r.compositeScore < worst.compositeScore ? r : worst, results[0]);

  let summary = `After simulating ${results.length} relationship scenarios, your compatibility score is ${score}%. `;
  summary += `You showed the strongest connection during "${bestScenario.name_en}" (${bestScenario.compositeScore}%)`;
  
  if (worstScenario.compositeScore < bestScenario.compositeScore - 15) {
    summary += `, but "${worstScenario.name_en}" revealed some tension (${worstScenario.compositeScore}%)`;
  }
  summary += '. ';
  
  if (greens.length > 0) {
    summary += `Key strengths: ${greens.slice(0, 2).join('; ')}. `;
  }
  if (reds.length > 0) {
    summary += `Watch out for: ${reds.slice(0, 1).join('; ')}.`;
  }
  
  return summary;
}

function generateSummaryZH(
  score: number, results: any[], greens: string[], reds: string[]
): string {
  const bestScenario = results.reduce((best, r) => 
    r.compositeScore > best.compositeScore ? r : best, results[0]);
  const worstScenario = results.reduce((worst, r) => 
    r.compositeScore < worst.compositeScore ? r : worst, results[0]);

  let summary = `经过${results.length}个关系场景的模拟，你们的匹配度为${score}%。`;
  summary += `在"${bestScenario.name_zh}"场景中表现最佳（${bestScenario.compositeScore}%）`;
  
  if (worstScenario.compositeScore < bestScenario.compositeScore - 15) {
    summary += `，但"${worstScenario.name_zh}"暴露了一些潜在摩擦（${worstScenario.compositeScore}%）`;
  }
  summary += '。';
  
  if (greens.length > 0) {
    summary += `核心优势：${greens.slice(0, 2).join('；')}。`;
  }
  if (reds.length > 0) {
    summary += `需要注意：${reds.slice(0, 1).join('；')}。`;
  }
  
  return summary;
}
