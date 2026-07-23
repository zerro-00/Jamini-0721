// AI 프로바이더 목록 + 자동 폴백 체인
// 순서: 선택한 모델 → 다른 활성 프로바이더(안정성 순) → 더미 응답
import "server-only";
import type { Provider, ProviderId, ChatTurn } from "./types";
import { gemini } from "./providers/gemini";
import { groq } from "./providers/groq";
import { openrouter } from "./providers/openrouter";
import { dummyReply } from "./providers/dummy";
import { recordCall } from "./status";

// 폴백 기본 순서 — Gemini(안정) → Groq(한도 큼) → OpenRouter(하루 50회라 최후)
export const ALL_PROVIDERS: Provider[] = [gemini, groq, openrouter];

// 키가 설정된 프로바이더만 활성화
export function activeProviders(): Provider[] {
  return ALL_PROVIDERS.filter((p) => p.isConfigured());
}

const CALL_TIMEOUT_MS = 10_000; // 각 호출 10초 제한 — 무한 대기 방지

async function callWithTimeout(
  provider: Provider,
  system: string,
  turns: ChatTurn[]
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);
  try {
    return await provider.chat(system, turns, controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

export type ChatResult = {
  reply: string;
  /** 어떤 경로로 응답했는지 — 서버 로그·관리자용. 사용자에게 노출 금지 */
  via: ProviderId | "dummy";
};

/**
 * 폴백 체인 실행. 절대 throw 하지 않는다 — 최후엔 반드시 더미가 답한다.
 */
export async function chatWithFallback(params: {
  system: string;
  turns: ChatTurn[];
  preferred?: string | null; // 사용자가 선택한 프로바이더 id
  characterSlug: string;
  locale: string;
  userMessage: string;
  lastReply?: string | null;
  /** 진단용: 특정 프로바이더를 제외하고 실행 (폴백 동작 테스트에 사용) */
  exclude?: string[];
}): Promise<ChatResult> {
  const active = activeProviders().filter(
    (p) => !params.exclude?.includes(p.id)
  );

  // 1) 선택한 모델을 맨 앞으로
  const chain = [...active].sort((a, b) => {
    if (a.id === params.preferred) return -1;
    if (b.id === params.preferred) return 1;
    return 0;
  });

  for (const provider of chain) {
    try {
      const reply = await callWithTimeout(provider, params.system, params.turns);
      recordCall(provider.id, true);
      console.log(`[ai] replied via ${provider.id} (${provider.modelId})`);
      return { reply, via: provider.id };
    } catch (err) {
      // 기술적 오류는 서버 로그에만 남긴다
      const note = err instanceof Error ? err.message : String(err);
      recordCall(provider.id, false, note);
      console.warn(`[ai] ${provider.id} failed → next. (${note})`);
    }
  }

  // 2) 전부 실패 → 더미 응답 (캐릭터 톤 유지, 항상 성공)
  console.warn("[ai] all providers failed → dummy reply");
  return {
    reply: dummyReply(
      params.characterSlug,
      params.locale,
      params.userMessage,
      params.lastReply
    ),
    via: "dummy",
  };
}
