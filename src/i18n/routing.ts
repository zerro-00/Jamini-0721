// 지원 언어 정의 — 여기만 고치면 언어가 추가/삭제된다
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ko", "zh", "en", "ja"],
  defaultLocale: "ko",
});

export type Locale = (typeof routing.locales)[number];

// 언어 선택 드롭다운에 표시할 이름 (각 언어의 원어 표기)
export const LOCALE_LABELS: Record<Locale, string> = {
  ko: "한국어",
  zh: "简体中文",
  en: "English",
  ja: "日本語",
};

// AI에게 "이 언어로 답하라"고 지시할 때 쓰는 언어 이름
export const LOCALE_LANGUAGE_NAMES: Record<Locale, string> = {
  ko: "한국어 (Korean)",
  zh: "简体中文 (Simplified Chinese)",
  en: "English",
  ja: "日本語 (Japanese)",
};
