// 사용 가능한 AI 모델 목록 (키가 설정된 프로바이더만)
// 실제 모델명을 그대로 노출한다 — 별명·별칭으로 포장하지 않는 것이 기획 원칙.
// ⚠️ API 키 값 자체는 절대 응답에 포함하지 않는다 (존재 여부로 필터링만).
import { NextResponse } from "next/server";
import { activeProviders } from "@/lib/ai";
import { getPerf } from "@/lib/ai/status";

// 프로바이더 짧은 표기 (모달의 부가 정보용)
const PROVIDER_SHORT_NAMES: Record<string, string> = {
  gemini: "Google",
  groq: "Groq",
  openrouter: "OpenRouter",
};

export async function GET() {
  const models = activeProviders().map((p) => ({
    id: p.id, // 선택값으로 쓰는 프로바이더 id
    label: p.modelLabel, // 실제 모델명 (원본 그대로)
    provider: PROVIDER_SHORT_NAMES[p.id] ?? p.providerName,
    status: "ok" as const, // 키가 있어 활성화된 상태
    // 실측 성능 (최근 20회): 표본 3회 미만이면 avgSec/successRate 없음 → UI는 "측정 중" 표시
    perf: getPerf(p.id),
  }));
  return NextResponse.json({ models });
}
