// 프로바이더별 최근 호출 결과 (관리자 페이지 표시용)
// 서버 메모리에만 기록 — 재시작하면 초기화된다 (MVP 용도로 충분)
import "server-only";

export type CallStatus = {
  ok: boolean;
  at: string; // ISO 시각
  note?: string; // 서버 내부용 메모 (사용자에게 노출 금지)
};

const statusMap = new Map<string, CallStatus>();

export function recordCall(providerId: string, ok: boolean, note?: string) {
  statusMap.set(providerId, { ok, at: new Date().toISOString(), note });
}

export function getStatus(providerId: string): CallStatus | null {
  return statusMap.get(providerId) ?? null;
}
