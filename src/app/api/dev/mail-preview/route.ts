// [개발 전용] 환영 메일 미리보기 — 4명을 데스크톱(600px)·모바일(390px) 폭으로 한눈에 비교
// 사용법: http://localhost:3000/api/dev/mail-preview        → 비교 페이지
//         http://localhost:3000/api/dev/mail-preview?slug=kai&locale=ko → 개별 메일 원문
// 배포(production)에서는 404.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderHtml } from "@/lib/email/sendWelcome";
import { WELCOME_MAILS, type WelcomeLocale } from "@/lib/email/welcomeContent";

const SLUGS = ["kai", "ren", "yul", "siwoo"];

async function buildMail(slug: string, locale: WelcomeLocale) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("characters")
    .select("slug, thumbnail_url, character_translations(locale, name)")
    .eq("slug", slug)
    .single();
  const translations = (data?.character_translations ?? []) as {
    locale: string;
    name: string;
  }[];
  const name =
    translations.find((t) => t.locale === locale)?.name ??
    translations.find((t) => t.locale === "ko")?.name ??
    slug;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const mail = WELCOME_MAILS[slug][locale];
  return renderHtml({
    name,
    slug,
    locale,
    imageUrl: `${siteUrl}${data?.thumbnail_url ?? ""}`,
    chatUrl: `${siteUrl}/${locale}/chat/${slug}`,
    subject: mail.subject,
    body: mail.body,
    cta: mail.cta,
  });
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const locale = (searchParams.get("locale") === "en" ? "en" : "ko") as WelcomeLocale;

  // 개별 메일 원문
  if (slug && SLUGS.includes(slug)) {
    const html = await buildMail(slug, locale);
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // 비교 페이지: 4명 × (600px / 390px)
  const frames = SLUGS.map(
    (s) => `
    <div style="margin-bottom:48px;">
      <h2 style="color:#F0EDF5;font-family:sans-serif;font-size:16px;">${s}</h2>
      <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;">
        <div>
          <div style="color:#A79FB8;font-size:12px;font-family:sans-serif;margin-bottom:6px;">데스크톱 640px</div>
          <iframe src="/api/dev/mail-preview?slug=${s}&locale=${locale}" style="width:640px;height:980px;border:1px solid #2A2437;border-radius:8px;background:#12101A;"></iframe>
        </div>
        <div>
          <div style="color:#A79FB8;font-size:12px;font-family:sans-serif;margin-bottom:6px;">모바일 390px</div>
          <iframe src="/api/dev/mail-preview?slug=${s}&locale=${locale}" style="width:390px;height:1080px;border:1px solid #2A2437;border-radius:8px;background:#12101A;"></iframe>
        </div>
      </div>
    </div>`
  ).join("");

  const page = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>환영 메일 미리보기</title></head>
  <body style="background:#0c0a12;padding:32px;">
    <h1 style="color:#F0EDF5;font-family:sans-serif;">환영 메일 미리보기 (${locale}) — <a href="?locale=${locale === "ko" ? "en" : "ko"}" style="color:#D4A0B8;">${locale === "ko" ? "영어판 보기" : "한국어판 보기"}</a></h1>
    ${frames}
  </body></html>`;
  return new NextResponse(page, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
