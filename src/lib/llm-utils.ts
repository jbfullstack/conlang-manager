import { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions.mjs";

export function parseLLMJson(content: string, fallback: any = {}): any {
  const cleaned = (content ?? '')
    .trim()
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Essai d'extraire le premier bloc JSON
    const m = cleaned.match(/(\{.*\})/s);
    if (m && m[1]) {
      try {
        return JSON.parse(m[1]);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

export default parseLLMJson;

export function getLLModel() : string {
    return process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
}

export function buildLLMPromptRequest(prompt: string, temperature = 0.4, max_tokens=400): ChatCompletionCreateParamsNonStreaming {
  return {
    model: getLLModel(),
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature: temperature,
    max_tokens: max_tokens
  };
}