// 프로바이더별 호출 기록 (관리자 상태 표시 + 모델 선택 UI의 실측 성능 표시용)
//
// [저장 위치 선택: 서버 메모리]
// - 저장하는 것: 프로바이더명·소요시간(ms)·성공여부·시각 뿐 (대화 내용·개인정보 없음)
// - 개발 서버는 장시간 떠 있으므로 메모리 롤링(최근 20회)으로 충분하고, 별도 SQL 실행이 필요 없다
// - 서버 재시작 시 초기화되며, 그동안은 "측정 중"으로 표시된다 (부정확한 값 노출 방지)
// - 나중에 Vercel(서버리스) 운영에서 영구 기록이 필요해지면 Supabase에
//   provider_calls(provider, ok, ms, created_at) 테이블 하나를 추가하는 방식으로 교체 가능
import "server-only";

export type CallStatus = {
  ok: boolean;
  at: string; // ISO 시각
  note?: string; // 서버 내부용 메모 (사용자에게 노출 금지)
};

type CallRecord = { ok: boolean; ms: number; at: string };

const MAX_RECORDS = 20; // 프로바이더당 최근 20회만 유지

const records = new Map<string, CallRecord[]>();
const lastNotes = new Map<string, string | undefined>();

export function recordCall(
  providerId: string,
  ok: boolean,
  ms: number,
  note?: string
) {
  const list = records.get(providerId) ?? [];
  list.push({ ok, ms, at: new Date().toISOString() });
  if (list.length > MAX_RECORDS) list.shift();
  records.set(providerId, list);
  lastNotes.set(providerId, note);
}

// (관리자 페이지용 — 기존 형태 유지)
export function getStatus(providerId: string): CallStatus | null {
  const list = records.get(providerId);
  if (!list || list.length === 0) return null;
  const last = list[list.length - 1];
  return { ok: last.ok, at: last.at, note: lastNotes.get(providerId) };
}

// 실측 성능 요약 (최근 20회 기준) — 임의 고정값 없음, 기록이 없으면 samples=0
export type PerfSummary = {
  samples: number; // 표본 개수
  avgSec?: number; // 평균 응답시간(초, 소수 1자리) — 표본 3회 이상일 때만
  successRate?: number; // 성공률(%) — 표본 3회 이상일 때만
};

export function getPerf(providerId: string): PerfSummary {
  const list = records.get(providerId) ?? [];
  if (list.length < 3) return { samples: list.length };
  const avgMs = list.reduce((sum, r) => sum + r.ms, 0) / list.length;
  const okCount = list.filter((r) => r.ok).length;
  return {
    samples: list.length,
    avgSec: Math.round(avgMs / 100) / 10, // 소수 1자리
    successRate: Math.round((okCount / list.length) * 100),
  };
}
