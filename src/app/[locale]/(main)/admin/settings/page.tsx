// 관리자 — 사이트 설정 (언어 탭으로 제목·슬로건·소개문구 수정)
// 접근 제어는 admin/layout.tsx + API 양쪽에서 검사
import { createAdminClient } from "@/lib/supabase/admin";
import SettingsEditor from "@/components/SettingsEditor";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = createAdminClient();
  const { data: settings, error } = await supabase
    .from("site_settings")
    .select("locale, site_title, tagline, intro_text");

  if (error) {
    return (
      <div className="rounded-2xl border border-line bg-panel p-6 text-sm text-ink-soft">
        사이트 설정을 불러오지 못했어요: {error.message}
        <br />
        Supabase SQL Editor 에서{" "}
        <b className="text-wine">supabase/site_settings.sql</b> 을 실행했는지
        확인해 주세요. (SETUP.md 3-1번)
      </div>
    );
  }

  return <SettingsEditor initialSettings={settings ?? []} />;
}
