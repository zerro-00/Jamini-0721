// 로그인 — 구글 단독, 전체화면. 라벤더 오브 배경 + 중앙 카드 (fade-in + 상승 모션)
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import LoginButton from "@/components/LoginButton";
import RewindMark from "@/components/RewindMark";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { locale } = await params;
  const { redirect: redirectTo } = await searchParams;
  const t = await getTranslations("login");
  const tBrand = await getTranslations("brand");
  const tVuny = await getTranslations("vuny");

  // 이미 로그인했으면 목적지(또는 홈)로
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect({ href: redirectTo?.replace(`/${locale}`, "") || "/", locale });
    }
  }

  // 로그인 후 돌아갈 곳 (안전을 위해 내부 경로만 허용)
  const next =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : `/${locale}`;

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      {/* 배경 오브 — 아주 옅은 라벤더 그라데이션 (opacity 8% 이하, blur 크게) */}
      <div
        className="pointer-events-none absolute h-[480px] w-[480px] rounded-full blur-[140px]"
        style={{ top: "-10%", left: "-5%", background: "#8A4B75", opacity: 0.08 }}
      />
      <div
        className="pointer-events-none absolute h-[400px] w-[400px] rounded-full blur-[140px]"
        style={{ bottom: "-15%", right: "-5%", background: "#A85D7F", opacity: 0.06 }}
      />

      {/* 중앙 카드 — fade-in + 살짝 위로 (400ms) */}
      <div className="vue-rise relative w-full max-w-sm rounded-3xl border border-line bg-panel/90 p-10 text-center shadow-[0_16px_60px_rgba(0,0,0,0.5)] backdrop-blur">
        {/* ◀◀ 심볼 */}
        <div className="mb-4 flex justify-center">
          <RewindMark size={36} className="text-wine" />
        </div>

        {/* 로고 타이포 */}
        <div className="text-3xl font-black tracking-tight text-ink">
          {tBrand("name")}
        </div>
        <p className="mt-2 text-sm text-ink-soft">{t("tagline")}</p>

        {/* 구글 버튼 — 흰 배경, 52px, 라운드 12px, 호버 시 미세 상승 */}
        <div className="mt-9">
          <LoginButton
            next={next}
            label={t("continueWithGoogle")}
            className="h-[52px] w-full justify-center !rounded-xl transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          />
        </div>

        <p className="mt-4 text-xs text-ink-soft">{t("autoSignup")}</p>

        {/* 뷰니의 한마디 — 모습 없이 목소리로만 */}
        <p className="mt-8 text-sm text-ink-soft/80">{tVuny("login")}</p>
      </div>
    </div>
  );
}
