// 사용 가능한 AI 모델 목록 (키가 설정된 프로바이더만)
// 실제 모델명을 그대로 노출한다 — 등급 이름으로 포장하지 않는 것이 기획 원칙.
// 가격 정보는 현재 무료라 없음. 나중에 필드만 추가하면 되는 구조.
import { NextResponse } from "next/server";
import { activeProviders } from "@/lib/ai";

export async function GET() {
  const models = activeProviders().map((p) => ({
    id: p.id, // 프로바이더 id (선택값으로 사용)
    label: p.modelLabel, // 실제 모델명 — 번역하지 않는 고유명사
    modelId: p.modelId,
  }));
  return NextResponse.json({ models });
}
