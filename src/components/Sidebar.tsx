"use client";

// 좌측 사이드바 (데스크톱 200px) — 모바일에서는 하단 탭바로 전환
// 현재 위치는 뮤트 와인 하이라이트 + 좌측 얇은 바
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

type Item = {
  href: string;
  label: string;
  icon: React.ReactNode;
  match: (path: string) => boolean;
};

// 미니멀 라인 아이콘 (이모지·동물 금지)
const ICONS = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  ),
  characters: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" />
      <circle cx="17.5" cy="9.5" r="2.5" />
      <path d="M15.6 14.8c2.7.2 4.9 1.9 5.9 5.2" />
    </svg>
  ),
  pricing: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
      <path d="M2.5 10h19" />
    </svg>
  ),
  chats: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1L3 21l1.6-4.6A8.5 8.5 0 1 1 21 12Z" />
    </svg>
  ),
};

export default function Sidebar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const t = useTranslations("sidebar");
  const tNav = useTranslations("nav");
  const pathname = usePathname();

  // 대화방에서는 입력창이 하단에 있으므로 모바일 탭바를 숨긴다
  const hideTabbar = pathname.startsWith("/chat/");

  const items: Item[] = [
    { href: "/", label: t("home"), icon: ICONS.home, match: (p) => p === "/" },
    {
      href: "/#characters",
      label: tNav("characters"),
      icon: ICONS.characters,
      match: (p) => p.startsWith("/characters"),
    },
    {
      href: "/pricing",
      label: tNav("pricing"),
      icon: ICONS.pricing,
      match: (p) => p.startsWith("/pricing"),
    },
    ...(isLoggedIn
      ? [
          {
            href: "/chats",
            label: t("myChats"),
            icon: ICONS.chats,
            match: (p: string) => p.startsWith("/chats") || p.startsWith("/chat/"),
          },
        ]
      : []),
  ];

  return (
    <>
      {/* 데스크톱: 좌측 사이드바 */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[200px] flex-col border-r border-line bg-panel/60 pt-20 md:flex">
        <nav className="flex flex-col gap-1 px-3">
          {items.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors duration-200 ${
                  active
                    ? "bg-wine/10 font-semibold text-wine"
                    : "text-ink-soft hover:bg-night/60 hover:text-ink"
                }`}
              >
                {/* 현재 위치 좌측 얇은 바 */}
                {active && (
                  <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-wine" />
                )}
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 모바일: 하단 탭바 */}
      <nav
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel/95 backdrop-blur md:hidden ${
          hideTabbar ? "hidden" : "flex"
        }`}
      >
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] transition-colors duration-200 ${
                active ? "text-wine" : "text-ink-soft"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
