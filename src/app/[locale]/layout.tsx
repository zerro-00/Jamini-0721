import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Noto_Sans_JP, Noto_Sans_SC } from "next/font/google";
import { routing } from "@/i18n/routing";
// Pretendard (한글·영문 본문 폰트) — npm 패키지에서 self-host 로드
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "../globals.css";
import Navbar from "@/components/Navbar";
import GaEvents from "@/components/GaEvents";

// 일본어·중국어 폴백 폰트 (next/font — 자동 최적화)
const notoJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-jp",
  display: "swap",
  preload: false,
});
const notoSc = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-noto-sc",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "VUE — 다시 보고 싶은 그 한 장면",
  description: "다시 한번 느껴보고 싶은 설렘 — 잠들지 못하는 밤의 AI 캐릭터 대화, VUE.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html
      lang={locale}
      className={`h-full antialiased ${notoJp.variable} ${notoSc.variable}`}
    >
      <body className="flex min-h-full flex-col">
        {/* 배경 오브 — 아주 옅은 라벤더 빛 (평면감 제거, opacity 5% 이하) */}
        <div
          className="vue-orb h-[420px] w-[420px]"
          style={{ top: "-120px", right: "-100px", background: "#8A4B75", opacity: 0.05 }}
        />
        <div
          className="vue-orb h-[360px] w-[360px]"
          style={{ bottom: "-140px", left: "-80px", background: "#A85D7F", opacity: 0.04 }}
        />
        <NextIntlClientProvider>
          <Navbar />
          <main className="relative z-10 flex flex-1 flex-col">{children}</main>
          {/* GA 커스텀 이벤트 (login_success 등) — 개인정보는 보내지 않음 */}
          {gaId && <GaEvents />}
        </NextIntlClientProvider>
        {/* GA4 방문자 추적 — 측정 ID가 설정된 경우에만 심는다 */}
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
