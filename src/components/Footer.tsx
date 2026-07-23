// 푸터 — 서비스 한 줄 소개 + ◀◀ + 언어 선택 + 약관/개인정보 자리
import { getTranslations } from "next-intl/server";
import RewindMark from "@/components/RewindMark";
import LocaleSwitcher from "@/components/LocaleSwitcher";

export default async function Footer({ isLoggedIn }: { isLoggedIn: boolean }) {
  const t = await getTranslations("footer");

  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-10 text-center">
        <RewindMark size={24} className="text-wine/50" />
        <p className="text-xs text-ink-soft">{t("intro")}</p>
        <div className="flex items-center gap-4 text-xs text-ink-soft">
          {/* 약관·개인정보 링크 자리 (문서는 추후) */}
          <span className="cursor-default transition hover:text-ink">
            {t("terms")}
          </span>
          <span className="text-line">·</span>
          <span className="cursor-default transition hover:text-ink">
            {t("privacy")}
          </span>
        </div>
        <LocaleSwitcher isLoggedIn={isLoggedIn} />
      </div>
    </footer>
  );
}
