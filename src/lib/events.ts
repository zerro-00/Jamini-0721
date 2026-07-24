"use client";

// 행동 이벤트 전송 헬퍼 (클라이언트)
// 대화 내용·개인정보는 절대 보내지 않는다 — 유형·메타데이터만.

type EventPayload = {
  event_type: string;
  character_slug?: string;
  locale?: string;
  model?: string | null;
  prev_model?: string | null;
  turn_count?: number;
  src?: string;
  after_chat?: boolean;
};

// 브라우저 세션 id (탭 단위 랜덤 — 개인정보 아님)
export function getSessionId(): string {
  try {
    let id = sessionStorage.getItem("vue-session");
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("vue-session", id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

export function trackEvent(payload: EventPayload) {
  try {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true, // 페이지 이동 중에도 전송 유지
      body: JSON.stringify({ ...payload, session_id: getSessionId() }),
    }).catch(() => {});
  } catch {
    /* 이벤트 실패는 무시 */
  }
}

// 페이지 이탈 시에도 전송이 보장되도록 sendBeacon 사용 (일부 유실 가능성은 있음)
export function trackEventBeacon(payload: EventPayload) {
  try {
    const body = JSON.stringify({ ...payload, session_id: getSessionId() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/events",
        new Blob([body], { type: "application/json" })
      );
    } else {
      trackEvent(payload);
    }
  } catch {
    /* 무시 */
  }
}

// 요금제 페이지의 "대화 후 진입" 판별용 — 최근 대화 활동 기록 (30분 유효)
export function noteChatActivity(turns: number) {
  try {
    sessionStorage.setItem(
      "vue-chat-activity",
      JSON.stringify({ turns, at: Date.now() })
    );
  } catch {
    /* 무시 */
  }
}

export function getRecentChatActivity(): { turns: number } | null {
  try {
    const raw = sessionStorage.getItem("vue-chat-activity");
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.at > 30 * 60 * 1000) return null; // 30분 지나면 무효
    return { turns: data.turns };
  } catch {
    return null;
  }
}
