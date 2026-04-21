import OpenAI from 'openai';

// ============================================
// SOULYNC AI CLIENT
// Default: DeepSeek (cheapest, bilingual, global)
// Override with AI_PROVIDER env var:
//   'deepseek' (default) — api.deepseek.com
//   'openai'             — api.openai.com
//   'alibaba'            — dashscope.aliyuncs.com (China-optimized)
// ============================================

const provider = process.env.AI_PROVIDER || 'deepseek';

const CONFIG: Record<string, { apiKey: string; baseURL?: string; model: string }> = {
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-chat',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4o-mini',
  },
  alibaba: {
    apiKey: process.env.DASHSCOPE_API_KEY || '',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
  },
};

const config = CONFIG[provider] || CONFIG.deepseek;

export const openai = new OpenAI({
  apiKey: config.apiKey,
  baseURL: config.baseURL,
});

export const AI_MODEL = config.model;

export async function chatCompletion(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  options?: { temperature?: number; maxTokens?: number }
) {
  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    temperature: options?.temperature ?? 0.8,
    max_tokens: options?.maxTokens ?? 500,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  });

  return response.choices[0]?.message?.content ?? '';
}

export async function jsonCompletion<T>(
  systemPrompt: string, 
  userContent: string
): Promise<T> {
  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
  });

  const text = response.choices[0]?.message?.content ?? '{}';
  return JSON.parse(text) as T;
}
