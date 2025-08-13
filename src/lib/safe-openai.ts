import { openai } from '@/lib/openai';
import { buildLLMPromptRequest, getLLModel } from '@/lib/llm-utils';
import { canPerformAction, logAIRequest } from '@/lib/usage-tracking';

const MAX_PROMPT_CHARS = 4000;
const DEFAULT_MAX_TOKENS = 400; // borne “réponse”
const REQUEST_TIMEOUT_MS = 20_000;

export async function runChatCompletionSafe(args: {
  userId: string;
  role: 'USER'|'PREMIUM'|'MODERATOR'|'ADMIN';
  requestType: 'AI_SEARCH'|'AI_ANALYZE';
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const { userId, role, requestType } = args;
  let prompt = (args.prompt ?? '').trim();

  // 1) garde-fous côté usage & limites
  const can = await canPerformAction(userId, role, requestType === 'AI_SEARCH' ? 'aiSearchRequests' : 'aiAnalyzeRequests');
  if (!can.allowed) {
    await logAIRequest(userId, requestType, { prompt }, null, undefined, 'RATE_LIMITED', can.message);
    throw new Error(can.message || 'Daily limit reached');
  }

  // 2) prompt trop long ? on tronque
  if (prompt.length > MAX_PROMPT_CHARS) {
    prompt = prompt.slice(0, MAX_PROMPT_CHARS);
  }

  // 3) timeout
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), REQUEST_TIMEOUT_MS);

  const max_tokens = Math.min(args.maxTokens ?? DEFAULT_MAX_TOKENS, 2_000); // ceinture
  const request = buildLLMPromptRequest(prompt, args.temperature ?? 0.4, max_tokens);

  const t0 = Date.now();
  try {
    const resp = await openai.chat.completions.create(
      { ...request, model: getLLModel() },
      { signal: ctl.signal }
    );

    const content = resp.choices?.[0]?.message?.content ?? '';
    const usage = resp.usage; // tokens totaux/couts estimables selon modèle
    const ms = Date.now() - t0;

    await logAIRequest(
      userId,
      requestType,
      { promptLen: prompt.length },
      { contentLen: content.length },
      {
        tokensUsed: (usage?.total_tokens as number) || undefined,
        // si tu calcules le coût ailleurs, passe-le ici
        modelUsed: getLLModel(),
        responseTime: ms,
      },
      'SUCCESS'
    );

    return content;
  } catch (e: any) {
    const ms = Date.now() - t0;
    await logAIRequest(userId, requestType, { promptLen: prompt.length }, null, { responseTime: ms, modelUsed: getLLModel() }, e?.name === 'AbortError' ? 'RATE_LIMITED' : 'ERROR', String(e));
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
