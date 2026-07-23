// 내 프로필 — 이메일, 코인 잔액, 구독 상태, 선호 언어 (로그인 필수)
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LOCALE_LABELS, type Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("profile");

  if (!isSupabaseConfigured()) redirect({ href: "/", locale });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect({ href: "/", locale });

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "email, display_name, coin_balance, subscription_tier, preferred_locale, created_at"
    )
    .eq("id", user!.id)
    .single();

  const tierLabels: Record<string, string> = {
    free: t("tierFree"),
    basic: t("tierBasic"),
    premium: t("tierPremium"),
  };

  const preferred = (profile?.preferred_locale ?? "ko") as Locale;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-black text-ink">{t("title")}</h1>

      <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
        <div className="flex items-center gap-4 border-b border-line bg-night/40 p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-night text-xl font-black text-wine">
            {(profile?.display_name ?? user!.email ?? "?")
              .charAt(0)
              .toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-ink">
              {profile?.display_name ?? t("noName")}
            </div>
            <div className="text-sm text-ink-soft">{user!.email}</div>
          </div>
        </div>

        <dl className="divide-y divide-line">
          <Row label={t("coins")}>
            <span className="font-bold text-wine">
              {t("coinsUnit", {
                count: (profile?.coin_balance ?? 0).toLocaleString(),
              })}
            </span>
          </Row>
          <Row label={t("subscription")}>
            {tierLabels[profile?.subscription_tier ?? "free"] ??
              profile?.subscription_tier}
          </Row>
          <Row label={t("language")}>
            {LOCALE_LABELS[preferred] ?? preferred}
          </Row>
          <Row label={t("joined")}>
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString(locale)
              : "-"}
          </Row>
        </dl>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/pricing"
          className="text-sm font-medium text-wine transition hover:text-wine"
        >
          {t("goPricing")}
        </Link>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  );
}
