// 환영 메일 렌더링 + 발송 (현재: Gmail SMTP / 보관: resendTransport.ts)
// 호출부는 반드시 try/catch — 발송 실패가 가입·로그인을 막으면 안 된다.
// ⚠️ 앱 비밀번호·키는 로그·메일 본문 어디에도 출력하지 않는다.
import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  WELCOME_MAILS,
  COMMON_TEXTS,
  type WelcomeLocale,
} from "./welcomeContent";
import {
  sendViaGmail,
  isGmailConfigured,
  gmailFromAddress,
} from "./gmailTransport";

// 사이트 팔레트 (globals.css 의 실제 값 — 새 색 도입 금지)
const C = {
  night: "#12101A",
  panel: "#1C1826",
  line: "#2A2437",
  ink: "#F0EDF5",
  inkSoft: "#A79FB8",
  cta: "#6B3A5B",
  rose: "#D4A0B8",
};

function isEnabled(): boolean {
  return process.env.WELCOME_EMAIL_ENABLED === "true" && isGmailConfigured();
}

// 본문 줄바꿈을 그대로 살려 HTML로 (확정된 줄바꿈 유지)
function bodyToHtml(body: string): string {
  return body
    .split("\n")
    .map((line) =>
      line.trim() === ""
        ? `<div style="height:16px;line-height:16px;">&nbsp;</div>`
        : `<div style="margin:0;padding:0;color:${C.ink};font-size:15px;line-height:1.7;">${line}</div>`
    )
    .join("");
}

function renderHtml(params: {
  name: string;
  slug: string;
  locale: WelcomeLocale;
  imageUrl: string;
  chatUrl: string;
  subject: string;
  body: string;
  cta: string;
}): string {
  const t = COMMON_TEXTS[params.locale];
  // 인라인 CSS · 600px 고정 · 다크 테마 · 이미지 차단돼도 내용 성립
  return `<!DOCTYPE html>
<html lang="${params.locale}">
<body style="margin:0;padding:0;background-color:${C.night};">
  <div style="display:none;max-height:0;overflow:hidden;">${params.subject}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.night};">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${C.panel};border:1px solid ${C.line};border-radius:20px;">
        <tr><td align="center" style="padding:36px 32px 0;">
          <img src="${params.imageUrl}" alt="${params.name}" width="120" height="120"
            style="display:block;width:120px;height:120px;border-radius:60px;object-fit:cover;object-position:top;border:1px solid ${C.line};" />
        </td></tr>
        <tr><td align="center" style="padding:20px 32px 0;">
          <div style="color:${C.rose};font-size:13px;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">${params.name} — VUE</div>
          <div style="color:${C.ink};font-size:21px;font-weight:bold;padding-top:8px;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">${params.subject}</div>
        </td></tr>
        <tr><td style="padding:28px 40px 0;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
          ${bodyToHtml(params.body)}
        </td></tr>
        <tr><td align="center" style="padding:32px 32px 0;">
          <a href="${params.chatUrl}"
            style="display:inline-block;background-color:${C.cta};color:${C.ink};text-decoration:none;font-size:15px;font-weight:bold;padding:14px 36px;border-radius:14px;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">${params.cta}</a>
          <div style="color:${C.inkSoft};font-size:12px;padding-top:14px;font-family:-apple-system,sans-serif;">${t.others}</div>
        </td></tr>
        <tr><td align="center" style="padding:32px;">
          <div style="border-top:1px solid ${C.line};padding-top:20px;">
            <div style="color:${C.rose};font-size:14px;letter-spacing:2px;">&#9664;&#9664;&nbsp;<span style="color:${C.ink};font-weight:bold;">VUE</span></div>
            <div style="color:${C.inkSoft};font-size:11px;padding-top:6px;font-family:-apple-system,sans-serif;">${t.tagline}</div>
            <div style="padding-top:10px;">
              <a href="mailto:${gmailFromAddress()}?subject=unsubscribe" style="color:${C.inkSoft};font-size:11px;text-decoration:underline;">${t.unsubscribe}</a>
            </div>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// 텍스트 전용 버전 (이미지·HTML 차단 환경)
function renderText(params: {
  name: string;
  locale: WelcomeLocale;
  chatUrl: string;
  body: string;
  cta: string;
}): string {
  const t = COMMON_TEXTS[params.locale];
  return `${params.name} — VUE

${params.body}

${params.cta}
${params.chatUrl}

${t.others}

◀◀ VUE — ${t.tagline}
${t.unsubscribe}: ${gmailFromAddress()}`;
}

/**
 * 가입 첫 로그인 시 호출 — 환영 메일 1회 발송
 * - welcome_email_sent_at 이 비어 있을 때만 (중복 방지: 조건부 UPDATE 로 선점)
 * - 어떤 실패도 throw 하지 않고 서버 로그만 남긴다
 */
export async function maybeSendWelcomeEmail(
  supabase: SupabaseClient,
  user: User
): Promise<void> {
  try {
    if (!isEnabled()) return; // 발송 비활성 (키 미설정/정지 시)
    if (!user.email) return;

    // 1) 프로필 확인 — 이미 발송했으면 종료
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("welcome_email_sent_at, preferred_locale")
      .eq("id", user.id)
      .single();
    if (profileError) {
      // 컬럼 미생성 등 — 조용히 종료 (가입 흐름 보호)
      console.warn("[welcome-email] profile read skip:", profileError.message);
      return;
    }
    if (profile.welcome_email_sent_at) return; // 이미 발송됨

    const locale: WelcomeLocale =
      profile.preferred_locale === "en" ? "en" : "ko";

    // 2) 공식 캐릭터 4명 중 랜덤 배정
    const { data: characters } = await supabase
      .from("characters")
      .select("slug, thumbnail_url, character_translations(locale, name)")
      .eq("is_public", true)
      .eq("is_official", true);
    const candidates = (characters ?? []).filter((c) => WELCOME_MAILS[c.slug]);
    if (candidates.length === 0) return;
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    const translations = picked.character_translations as {
      locale: string;
      name: string;
    }[];
    const name =
      translations.find((tr) => tr.locale === locale)?.name ??
      translations.find((tr) => tr.locale === "ko")?.name ??
      picked.slug;

    // 3) 선점 UPDATE (sent_at 이 비어 있는 경우에만) — 동시 요청이 와도 1회만 발송
    const { data: claimed } = await supabase
      .from("profiles")
      .update({
        welcome_character_slug: picked.slug,
        welcome_email_sent_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .is("welcome_email_sent_at", null)
      .select("id");
    if (!claimed || claimed.length === 0) return; // 다른 요청이 먼저 선점함

    // 4) 발송
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
    const mail = WELCOME_MAILS[picked.slug][locale];
    const chatUrl = `${siteUrl}/${locale}/chat/${picked.slug}`;
    const imageUrl = `${siteUrl}${picked.thumbnail_url ?? ""}`;

    // 발송 (Gmail SMTP — 하루 500통 제한 주의, 상세는 gmailTransport.ts 참조)
    try {
      await sendViaGmail({
        fromName: `${name} — VUE`,
        to: user.email,
        subject: mail.subject,
        html: renderHtml({
          name,
          slug: picked.slug,
          locale,
          imageUrl,
          chatUrl,
          subject: mail.subject,
          body: mail.body,
          cta: mail.cta,
        }),
        text: renderText({
          name,
          locale,
          chatUrl,
          body: mail.body,
          cta: mail.cta,
        }),
      });
    } catch (sendErr) {
      // 비밀번호·키 값은 절대 로그에 넣지 않는다. 사용자 화면에도 노출하지 않는다.
      console.warn(
        `[환영메일] 발송 실패 (가입은 정상 진행됨): ${
          sendErr instanceof Error ? sendErr.message : sendErr
        }`
      );
      return;
    }
    console.log(`[환영메일] 발송 완료: 캐릭터=${picked.slug}, 언어=${locale}`);
  } catch (err) {
    console.warn(
      `[환영메일] 건너뜀 (가입은 정상 진행됨): ${
        err instanceof Error ? err.message : err
      }`
    );
  }
}
