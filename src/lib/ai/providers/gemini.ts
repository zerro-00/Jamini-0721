// Google Gemini (aistudio.google.com) — 무료 등급: 카드 불필요, 2.5 Flash 기준 10 RPM / 250 req/일
import "server-only";
import type { Provider, ChatTurn } from "../types";

const MODEL_ID = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

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
  modelLabel: "Gemini 2.5 Flash",
  modelId: MODEL_ID,
  isConfigured: () => Boolean(process.env.GEMINI_API_KEY),
  chat,
};
