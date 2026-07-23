// 상단 네비게이션 바 (서버 컴포넌트 — 로그인 상태를 서버에서 확인)
// 페이지 이동 링크는 사이드바/탭바가 담당하고, 여기는 브랜드 + 언어 + 계정만
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAdminEmail } from "@/lib/auth";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import UserMenu from "@/components/UserMenu";
import RewindMark from "@/components/RewindMark";

export default async function Navbar() {
  const t = await getTranslations("nav");
  const tBrand = await getTranslations("brand");

  // Supabase 설정 전에는 로그인 상태 확인을 건너뛴다 (화면 에러 방지)
  let user = null;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  const isAdmin = isAdminEmail(user?.email);
  const initial = (user?.user_metadata?.full_name ?? user?.email ?? "?").charAt(0);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-night/85 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          {/* 브랜드 심볼 ◀◀ */}
          <RewindMark size={20} className="text-wine" />
          <span className="text-xl font-black tracking-tight text-ink">
            {tBrand("name")}
          </span>
          <span className="hidden text-[11px] text-ink-soft lg:inline">
            {tBrand("slogan")}
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {/* 언어 선택 드롭다운 */}
          <LocaleSwitcher isLoggedIn={Boolean(user)} />
          {user ? (
            <UserMenu
              initial={initial}
              isAdmin={isAdmin}
              labels={{
                profile: t("profile"),
                admin: t("admin"),
                logout: t("logout"),
              }}
            />
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-wine/60 px-4 py-1.5 text-sm font-semibold text-wine transition duration-200 hover:bg-cta hover:text-ink"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
