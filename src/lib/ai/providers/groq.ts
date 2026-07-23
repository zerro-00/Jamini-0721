// Groq (console.groq.com) — 무료 등급: 카드 불필요, 30 RPM / 모델별 1,000~14,400 req/일
// OpenAI 호환 API
import "server-only";
import type { Provider, ChatTurn } from "../types";

const MODEL_ID = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

async function chat(
  system: string,
  turns: ChatTurn[],
  signal: AbortSignal
): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
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
    throw new Error(`groq http ${res.status}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("groq empty response");
  return text;
}

export const groq: Provider = {
  id: "groq",
  providerName: "Groq",
  modelLabel: "Llama 3.3 70B",
  modelId: MODEL_ID,
  isConfigured: () => Boolean(process.env.GROQ_API_KEY),
  chat,
};
