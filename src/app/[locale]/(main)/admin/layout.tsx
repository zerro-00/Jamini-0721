// 관리자 영역 공통 레이아웃
// ADMIN_EMAILS 에 포함된 이메일로 로그인한 경우에만 접근 가능
import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { getAdminUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const t = await getTranslations("admin");

  if (!isSupabaseConfigured()) redirect({ href: "/", locale });

  const admin = await getAdminUser();
  if (!admin) redirect({ href: "/", locale }); // 관리자가 아니면 홈으로

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-black text-ink">{t("title")}</h1>
        <nav className="flex flex-wrap gap-1 rounded-full border border-line bg-panel p-1 text-sm">
          <AdminTab href="/admin" label={t("dashboard")} />
          <AdminTab href="/admin/characters" label={t("characters")} />
          <AdminTab href="/admin/members" label={t("members")} />
          <AdminTab href="/admin/settings" label={t("settings")} />
        </nav>
      </div>
      {children}
    </div>
  );
}

function AdminTab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full px-4 py-1.5 text-ink-soft transition hover:bg-night hover:text-wine"
    >
      {label}
    </Link>
  );
}
