// AI 프로바이더 공통 타입
// 새 API 를 추가하려면 providers/ 아래 파일 하나 만들고 index.ts 목록에 넣으면 된다.

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export type ProviderId = "gemini" | "groq" | "openrouter";

export type Provider = {
  id: ProviderId;
  /** 서비스 이름 (관리자 표시용) */
  providerName: string;
  /** 실제 모델명 — UI에 그대로 노출 (임의 포장 금지) */
  modelLabel: string;
  /** API에 보내는 정확한 모델 ID */
  modelId: string;
  /** 키가 설정돼 있는지 */
  isConfigured: () => boolean;
  /** 동일 인터페이스: 시스템 프롬프트 + 대화내역 → 응답 텍스트 (실패 시 throw) */
  chat: (system: string, turns: ChatTurn[], signal: AbortSignal) => Promise<string>;
};
