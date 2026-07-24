// Gmail SMTP 발송 (nodemailer) — 수업 실습용 발송 경로
// ⚠️ Gmail 무료 계정은 하루 500통 발송 제한이 있다 (초과 시 일시 차단).
// ⚠️ 앱 비밀번호(GMAIL_APP_PASSWORD)는 서버 전용 — 로그·응답·메일 본문에 절대 출력 금지.
// 실행 위치: 서버 라우트(auth/callback → sendWelcome)에서만 호출된다.
import "server-only";
import nodemailer from "nodemailer";

export function isGmailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

// 발신 주소 (수신거부 안내 등에 사용)
export function gmailFromAddress(): string {
  return process.env.GMAIL_USER ?? "";
}

/**
 * 메일 1통 발송. 실패 시 throw — 호출부(sendWelcome)가 잡아서 한국어 로그만 남긴다.
 * fromName: "카이 — VUE" 처럼 캐릭터 이름이 보이는 표시명
 * (Gmail 은 실제 발신 주소를 계정 주소로 강제하지만, 표시 이름은 그대로 보인다)
 */
export async function sendViaGmail(params: {
  fromName: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // 587 = STARTTLS (연결 후 암호화 승격)
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"${params.fromName}" <${process.env.GMAIL_USER}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
}
