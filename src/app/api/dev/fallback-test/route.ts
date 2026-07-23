// [개발 전용 진단] 폴백 체인 동작 테스트
// 배포(production)에서는 404 — 개발 서버에서만 동작한다. 키·오류 내용은 노출하지 않는다.
// 사용법:
//   /api/dev/fallback-test                → 정상 체인 (첫 번째 활성 AI가 답해야 함)
//   /api/dev/fallback-test?exclude=gemini → gemini 실패 상황 시뮬레이션 (다음 AI로 넘어가야 함)
//   /api/dev/fallback-test?exclude=gemini,groq,openrouter → 전부 실패 → 더미 응답
import { NextResponse } from "next/server";
import { chatWithFallback, activeProviders } from "@/lib/ai";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const exclude = (searchParams.get("exclude") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const preferred = searchParams.get("preferred");

  const started = Date.now();
  const result = await chatWithFallback({
    system:
      "너는 테스트 도우미다. 어떤 질문이든 반드시 한국어 한 문장으로만 짧게 답한다.",
    turns: [{ role: "user", content: "지금 잘 연결됐는지 한 문장으로 알려줘." }],
    preferred,
    characterSlug: "kai",
    locale: "ko",
    userMessage: "지금 잘 연결됐는지 한 문장으로 알려줘.",
    exclude,
  });

  return NextResponse.json({
    active: activeProviders().map((p) => p.id),
    excluded: exclude,
    via: result.via, // 어떤 경로로 응답했는지
    ms: Date.now() - started,
    reply: result.reply,
  });
}
