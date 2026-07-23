// 메인 영역 레이아웃 — 좌측 사이드바(데스크톱) / 하단 탭바(모바일) + 푸터
// 로그인 페이지는 이 그룹 밖에 있어 전체화면을 그대로 쓴다
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let isLoggedIn = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    isLoggedIn = Boolean(data.user);
  }

  return (
    <div className="flex flex-1 flex-col">
      <Sidebar isLoggedIn={isLoggedIn} />
      {/* 데스크톱은 사이드바 폭만큼 밀고, 모바일은 하단 탭바 높이만큼 여백 */}
      <div className="flex flex-1 flex-col pb-20 md:pb-0 md:pl-[200px]">
        <div className="vue-fade-in flex flex-1 flex-col">{children}</div>
        <Footer isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}
