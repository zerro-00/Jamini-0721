// OpenRouter (openrouter.ai) — :free 모델. 카드 불필요, 20 RPM / 무충전 계정 50 req/일
// 하루 한도가 작으므로 폴백 순서 마지막에 둔다. OpenAI 호환 API
import "server-only";
import type { Provider, ChatTurn } from "../types";

// 2026-07 실시간 조회 기준 무료 목록 중 대화 품질이 가장 좋은 모델.
// 무료 목록은 수시로 바뀌므로 env(OPENROUTER_MODEL)로 교체 가능.
const MODEL_ID = process.env.OPENROUTER_MODEL ?? "google/gemma-4-31b-it:free";

// 모델 ID → 사람이 읽는 표기 (임의 포장이 아니라 공식 이름 표기)
function labelFromId(id: string): string {
  const known: Record<string, string> = {
    "google/gemma-4-31b-it:free": "Gemma 4 31B",
    "openai/gpt-oss-20b:free": "GPT-OSS 20B",
  };
  if (known[id]) return known[id];
  // 모르는 ID는 "provider/model:free" 에서 모델 부분만 표기
  return id.split("/").pop()?.replace(":free", "") ?? id;
}

async function chat(
  system: string,
  turns: ChatTurn[],
  signal: AbortSignal
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    signal,
    body: JSON.stringify({
      model: MODEL_ID,
      messages: [{ role: "system", content: system }, ...turns],
      max_tokens: 1024,
      temperature: 0.9,
    }),
  });
  if (!res.ok) {
    throw new Error(`openrouter http ${res.status}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("openrouter empty response");
  return text;
}

export const openrouter: Provider = {
  id: "openrouter",
  providerName: "OpenRouter",
  modelLabel: labelFromId(MODEL_ID),
  modelId: MODEL_ID,
  isConfigured: () => Boolean(process.env.OPENROUTER_API_KEY),
  chat,
};
