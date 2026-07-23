"use client";

// 언어 선택 드롭다운 — 같은 페이지의 다른 언어 버전으로 이동
// 로그인 상태면 profiles.preferred_locale 도 함께 저장한다
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, LOCALE_LABELS, type Locale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { trackLocaleChange } from "@/lib/gaEvents";

export default function LocaleSwitcher({
  isLoggedIn,
}: {
  isLoggedIn: boolean;
}) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = e.target.value as Locale;

    // GA: 언어 변경 이벤트 (개인정보 없음)
    trackLocaleChange(nextLocale);

    // 로그인한 유저는 선호 언어를 기억해 둔다 (실패해도 이동은 계속)
    if (isLoggedIn) {
      try {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase
              .from("profiles")
              .update({ preferred_locale: nextLocale })
              .eq("id", user.id)
              .then(() => {});
          }
        });
      } catch {
        // Supabase 미설정 등 — 무시하고 언어만 전환
      }
    }

    startTransition(() => {
      // 같은 경로의 다른 언어 버전으로 이동 (동적 파라미터 유지)
      router.replace(
        // @ts-expect-error — 동적 경로 파라미터를 그대로 전달
        { pathname, params },
        { locale: nextLocale }
      );
      router.refresh();
    });
  }

  return (
    <select
      value={locale}
      onChange={handleChange}
      disabled={isPending}
      aria-label="Language"
      className="cursor-pointer rounded-full border border-line bg-panel px-2.5 py-1.5 text-xs text-ink outline-none transition hover:border-wine"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
