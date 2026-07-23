"use client";

// GA4 커스텀 이벤트 전송 헬퍼 (딱 3개만 사용: login_success / chat_start / locale_change)
// ⚠️ 개인정보(이메일·이름·대화 내용)는 절대 보내지 않는다.
import { sendGAEvent } from "@next/third-parties/google";

function gaEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
}

// 로그인 성공
export function trackLoginSuccess() {
  if (!gaEnabled()) return;
  sendGAEvent("event", "login_success", {});
}

// 캐릭터별 대화 시작
export function trackChatStart(characterSlug: string) {
  if (!gaEnabled()) return;
  sendGAEvent("event", "chat_start", { character_slug: characterSlug });
}

// 언어 변경
export function trackLocaleChange(locale: string) {
  if (!gaEnabled()) return;
  sendGAEvent("event", "locale_change", { locale });
}
