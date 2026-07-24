// [보관용 — 현재 미사용] Resend 발송 경로
// Resend 계정 정지 + gmail.com 도메인 인증 불가로 Gmail SMTP 로 우회 중.
// 나중에 자체 도메인을 인증하면 이 함수로 되돌리면 된다:
//   1) .env.local 의 RESEND_API_KEY / RESEND_FROM_EMAIL 주석 해제
//   2) sendWelcome.ts 에서 sendViaGmail → sendViaResend 로 교체
import "server-only";

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

/** 메일 1통 발송 (Resend REST API). 실패 시 throw. */
export async function sendViaResend(params: {
  fromName: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${params.fromName} <${process.env.RESEND_FROM_EMAIL}>`,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`resend ${res.status}: ${errBody.slice(0, 150)}`);
  }
}
