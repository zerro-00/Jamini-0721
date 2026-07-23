"use client";

// 로그인 후 표시되는 아바타 드롭다운 (내 프로필 · 관리자 · 로그아웃)
import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UserMenu({
  initial,
  isAdmin,
  labels,
}: {
  initial: string; // 아바타에 표시할 첫 글자
  isAdmin: boolean;
  labels: { profile: string; admin: string; logout: string };
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 메뉴 바깥을 클릭하면 닫기
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-panel text-sm font-bold text-wine transition hover:border-wine"
      >
        {initial.toUpperCase()}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-2xl border border-line bg-panel py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-ink transition hover:bg-night"
          >
            {labels.profile}
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-wine transition hover:bg-night"
            >
              {labels.admin}
            </Link>
          )}
          <div className="my-1 border-t border-line" />
          <button
            onClick={handleLogout}
            className="block w-full px-4 py-2.5 text-left text-sm text-ink-soft transition hover:bg-night"
          >
            {labels.logout}
          </button>
        </div>
      )}
    </div>
  );
}
