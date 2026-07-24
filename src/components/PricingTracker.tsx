"use client";

// 요금제 페이지 조회 이벤트 — "대화 직후 진입인지"와 그때의 턴 수만 기록 (개인정보 없음)
import { useEffect } from "react";
import { trackEvent, getRecentChatActivity } from "@/lib/events";

export default function PricingTracker() {
  useEffect(() => {
    const activity = getRecentChatActivity(); // 최근 30분 내 대화 여부
    trackEvent({
      event_type: "pricing_view",
      after_chat: Boolean(activity),
      ...(activity ? { turn_count: activity.turns } : {}),
    });
  }, []);

  return null;
}
