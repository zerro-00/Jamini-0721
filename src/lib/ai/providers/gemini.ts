// Google Gemini (aistudio.google.com) — 무료 등급: 카드 불필요, 2.5 Flash 기준 10 RPM / 250 req/일
import "server-only";
import type { Provider, ChatTurn } from "../types";

// 2026-07 확인: 신규 계정에는 gemini-2.5-flash 제공 종료 → 3.6 Flash 사용
// (env GEMINI_MODEL 로 교체 가능)
const MODEL_ID = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

// 모델 ID → 표기 이름 (예: gemini-3.6-flash → Gemini 3.6 Flash)
function labelFromId(id: string): string {
  return id
    .split("-")
    .map((w) => (/^\d/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

async function chat(
  system: string,
  turns: ChatTurn[],
  signal: AbortSignal
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: turns.map((t) => ({
          role: t.role === "assistant" ? "model" : "user",
          parts: [{ text: t.content }],
        })),
        generationConfig: { maxOutputTokens: 1024, temperature: 0.9 },
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`gemini http ${res.status}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("gemini empty response");
  return text;
}

export const gemini: Provider = {
  id: "gemini",
  providerName: "Google Gemini",
  modelLabel: labelFromId(MODEL_ID),
  modelId: MODEL_ID,
  isConfigured: () => Boolean(process.env.GEMINI_API_KEY),
  chat,
};
