// ============================================
// SOULYNC: 12 QUESTIONS ENGINE
// Based on Arthur Aron's 36 Questions + Amir Levine's Attached
// AI generates personalized date questions for each matched pair
// ============================================

// ── Question Pool: 100+ questions across 3 intensity levels ──
// AI selects 12 from this pool based on both users' psych profiles

export const QUESTION_POOL = {
  // SET 1: LIGHT — Build comfort, discover shared ground (10 min)
  light: [
    { id: 'L1', en: "If you could wake up anywhere in the world tomorrow, where would it be?", zh: "如果明天醒来可以在世界上任何地方，你会选哪里？", reveals: 'openness' },
    { id: 'L2', en: "What small thing made you genuinely happy this week?", zh: "这周有什么小事让你真正开心了？", reveals: 'positivity' },
    { id: 'L3', en: "What does a perfect Sunday look like for you?", zh: "你理想中的周日是什么样的？", reveals: 'lifestyle' },
    { id: 'L4', en: "If you had to teach a class on anything, what would it be?", zh: "如果你要教一门课，你会教什么？", reveals: 'passion' },
    { id: 'L5', en: "What's the best meal you've ever had, and who were you with?", zh: "你吃过最好吃的一顿饭是什么？当时和谁一起？", reveals: 'memory_style' },
    { id: 'L6', en: "What would you do if you had a completely free month with no obligations?", zh: "如果你有完整的一个月完全自由，你会做什么？", reveals: 'values' },
    { id: 'L7', en: "What's something you're weirdly passionate about that most people don't know?", zh: "你有什么大多数人不知道的、有点奇怪的热情？", reveals: 'authenticity' },
    { id: 'L8', en: "Do you have a favorite family tradition?", zh: "你有什么喜欢的家庭传统吗？", reveals: 'family_values' },
    { id: 'L9', en: "What kind of music do you listen to when you're alone?", zh: "你一个人的时候听什么音乐？", reveals: 'inner_world' },
    { id: 'L10', en: "If you could have dinner with anyone, living or dead, who would it be?", zh: "如果可以和任何人（在世的或已故的）吃一顿饭，你会选谁？", reveals: 'aspirations' },
    { id: 'L11', en: "What's one thing you've always wanted to try but haven't yet?", zh: "有什么你一直想尝试但还没做的事？", reveals: 'openness' },
    { id: 'L12', en: "What does your morning routine look like?", zh: "你早上的日常是什么样的？", reveals: 'conscientiousness' },
    { id: 'L13', en: "What makes you laugh the hardest?", zh: "什么事情能让你笑得最厉害？", reveals: 'humor_style' },
    { id: 'L14', en: "If your life had a theme song right now, what would it be?", zh: "如果你现在的生活有一首主题曲，会是什么？", reveals: 'self_perception' },
  ],

  // SET 2: MEDIUM — Build trust, reveal vulnerability (10 min)
  medium: [
    { id: 'M1', en: "What's something you changed your mind about in the last few years?", zh: "最近几年你在什么事上改变了想法？", reveals: 'growth' },
    { id: 'M2', en: "When do you feel most yourself in a relationship?", zh: "在一段关系中，什么时候你最觉得自己是自己？", reveals: 'attachment_needs' },
    { id: 'M3', en: "What's a fear you're working on overcoming?", zh: "你正在克服什么恐惧？", reveals: 'vulnerability' },
    { id: 'M4', en: "How do you know when you trust someone?", zh: "你怎么知道自己信任一个人了？", reveals: 'trust_style' },
    { id: 'M5', en: "What's the most important lesson a past relationship taught you?", zh: "过去的感情教会你最重要的一件事是什么？", reveals: 'attachment_history' },
    { id: 'M6', en: "What does 'feeling safe' with someone look like for you?", zh: "对你来说，和一个人在一起'有安全感'是什么样的？", reveals: 'attachment_style' },
    { id: 'M7', en: "When you're stressed, do you want someone to help fix it, or just listen?", zh: "你压力大的时候，希望对方帮你解决问题，还是只是听你说？", reveals: 'support_needs' },
    { id: 'M8', en: "What's something you wish people understood about you right away?", zh: "你希望别人马上就能理解你的一点是什么？", reveals: 'self_awareness' },
    { id: 'M9', en: "Do you think people can truly change? Why or why not?", zh: "你觉得人真的能改变吗？为什么？", reveals: 'worldview' },
    { id: 'M10', en: "What do you value more: honesty that might hurt, or kindness that might hide?", zh: "你更看重：可能伤人的坦诚，还是可能隐瞒的善意？", reveals: 'conflict_style' },
    { id: 'M11', en: "What's something you're proud of that you don't get to talk about much?", zh: "有什么你很骄傲但不太有机会说的事？", reveals: 'hidden_self' },
    { id: 'M12', en: "How do you show someone you care about them?", zh: "你怎么表达对一个人的在乎？", reveals: 'love_language' },
    { id: 'M13', en: "What's the hardest boundary you've ever had to set?", zh: "你设过的最难的界限是什么？", reveals: 'assertiveness' },
    { id: 'M14', en: "When was the last time you felt truly understood by someone?", zh: "你上一次感觉被一个人真正理解是什么时候？", reveals: 'intimacy_need' },
  ],

  // SET 3: DEEP — Build intimacy, create connection (10 min)
  deep: [
    { id: 'D1', en: "What have you never told anyone on a first date before?", zh: "有什么是你从没在第一次约会时对人说过的？", reveals: 'trust_leap' },
    { id: 'D2', en: "When was the last time you cried? What happened?", zh: "你上一次哭是什么时候？发生了什么？", reveals: 'emotional_access' },
    { id: 'D3', en: "If you knew this connection would last, what would you want to say right now?", zh: "如果你知道我们的关系会持续下去，你现在最想说什么？", reveals: 'romantic_courage' },
    { id: 'D4', en: "What do you think we might already have in common, just from tonight?", zh: "就今晚的感受，你觉得我们可能有什么共同点？", reveals: 'connection_awareness' },
    { id: 'D5', en: "What does love mean to you — not the dictionary definition, but your own?", zh: "爱对你来说是什么意思——不是词典的定义，是你自己的？", reveals: 'core_beliefs' },
    { id: 'D6', en: "What's something you need in a partner that you used to feel embarrassed to admit?", zh: "你对伴侣有什么需求，是你曾经不好意思承认的？", reveals: 'attachment_needs' },
    { id: 'D7', en: "If I asked your best friend to describe you in a relationship, what would they say?", zh: "如果我问你最好的朋友，你在感情中是什么样的，他们会怎么说？", reveals: 'self_perception' },
    { id: 'D8', en: "What's the bravest thing you've ever done for love?", zh: "你为爱做过最勇敢的事是什么？", reveals: 'attachment_security' },
    { id: 'D9', en: "Is there something you've been afraid to want?", zh: "有什么是你一直不敢去想要的？", reveals: 'deep_desires' },
    { id: 'D10', en: "Right now, in this moment, what are you feeling?", zh: "就现在这一刻，你在感受什么？", reveals: 'present_awareness' },
    { id: 'D11', en: "What would make you feel safe enough to be completely yourself with someone?", zh: "什么会让你足够安心，可以在一个人面前完全做自己？", reveals: 'security_needs' },
    { id: 'D12', en: "If this is the start of something, what do you hope it becomes?", zh: "如果这是一个开始，你希望它变成什么？", reveals: 'intentionality' },
  ],
};

// ── AI Prompt for Question Selection ──
export const QUESTION_SELECTION_PROMPT = `You are Soulync's Date Designer. Your job is to select 12 personalized questions for a first date between two matched users.

You have access to:
1. Both users' psychological profiles (attachment style, Big Five, conflict style, values, love language)
2. A pool of 100+ questions across 3 intensity levels (light, medium, deep)

SELECTION RULES (based on Attachment Theory from "Attached" by Amir Levine):

FOR ANXIOUS + SECURE PAIRS:
- Light: Include questions about daily routines and shared interests (builds predictability the anxious person needs)
- Medium: Include "what does safety look like" and "how do you show care" (lets secure person demonstrate reliability)
- Deep: Include questions about needs and desires (gives anxious person permission to express needs without shame)
- AVOID: Questions about past breakups or rejection (can trigger anxious spiraling)

FOR AVOIDANT + SECURE PAIRS:
- Light: Include questions about passions and independence (respects avoidant's autonomy)
- Medium: Include "how do you know you trust someone" (gradual, not forced intimacy)
- Deep: Include "what are you afraid to want" (gently invites vulnerability without pressure)
- AVOID: Questions that demand immediate emotional disclosure or commitment language

FOR SECURE + SECURE PAIRS:
- Full range available — these pairs handle escalating intimacy naturally
- Include playful and adventurous questions
- Can go deeper faster

FOR ANXIOUS + ANXIOUS PAIRS (rare but possible):
- Light: Grounding, present-moment questions
- Medium: Questions about growth and self-awareness
- Deep: Questions about what they've learned, not what they fear
- AVOID: Questions that amplify worry or comparison

GENERAL RULES:
- Select exactly 4 light, 4 medium, 4 deep questions
- Questions should flow naturally — each set should feel like a conversation, not an interrogation
- Consider both users' extraversion levels: lower extraversion = more reflective questions, higher = more playful
- Consider both users' openness: higher openness = more creative/philosophical questions
- The final question (Q12) should always be forward-looking and hopeful
- Adapt language based on the locale: English or Chinese

OUTPUT FORMAT — respond ONLY with this JSON:
{
  "questions": [
    {"id": "<question_id from pool>", "set": "light|medium|deep", "text_en": "<question text>", "text_zh": "<question text in Chinese>", "why": "<1 sentence explaining why this question was chosen for this specific pair>"}
  ],
  "eye_contact_prompt_en": "<a warm, brief instruction for the 4-minute eye contact exercise>",
  "eye_contact_prompt_zh": "<same in Chinese>",
  "date_note_en": "<a 2-sentence personalized note to both users about how to approach tonight — warm, encouraging, specific to their profiles>",
  "date_note_zh": "<same in Chinese>"
}`;

// ── Attachment-Aware Matching Rules (from "Attached") ──
export const ATTACHMENT_MATCHING_RULES = `
ATTACHMENT COMPATIBILITY MATRIX (from "Attached" by Amir Levine & Rachel Heller):

The core insight: attachment style is the SINGLE BEST PREDICTOR of relationship success.
It's more predictive than shared interests, physical attraction, or life goals.

COMPATIBILITY SCORES:
- Secure + Secure = 95 (gold standard, both regulate emotions well)
- Secure + Anxious = 80 (secure provides the consistency anxious needs)  
- Secure + Avoidant = 75 (secure gives space without triggering abandonment)
- Anxious + Anxious = 60 (can work if both are self-aware, but amplification risk)
- Avoidant + Avoidant = 50 (peaceful but emotionally distant, may never deepen)
- Anxious + Avoidant = 25 (THE TRAP — pursuit-withdrawal cycle, feels like passion but is actually pain)

CRITICAL RULE: NEVER match anxious + avoidant unless BOTH have explicitly high self-awareness scores AND the anxious user shows "earned secure" traits.

WHY THIS MATTERS FOR SOULYNC:
Most dating apps accidentally optimize for anxious+avoidant matches because the "chemistry" feels intense. But that intensity is anxiety, not love. Soulync's job is to break this cycle by:
1. Identifying attachment styles through behavioral questions (not self-report)
2. Steering users toward secure or secure-leaning partners
3. Using the 12 Questions date format to build REAL intimacy (reciprocal disclosure) instead of FAKE chemistry (anxiety-driven attachment)
`;
