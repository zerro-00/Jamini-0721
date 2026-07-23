// 캐릭터 관리 (서버에서 전체 목록 로드 → 클라이언트 편집 UI)
import { createAdminClient } from "@/lib/supabase/admin";
import CharacterManager from "@/components/CharacterManager";

export const dynamic = "force-dynamic";

export default async function AdminCharactersPage() {
  // 관리자 검사는 admin/layout.tsx 에서 이미 통과한 상태
  // 비공개 캐릭터·전체 번역까지 모두 보여야 하므로 service_role 클라이언트 사용
  const supabase = createAdminClient();
  const { data: characters, error } = await supabase
    .from("characters")
    .select(
      "id, slug, thumbnail_url, is_official, is_public, created_at, character_translations(locale, name, tagline, description, keywords, persona, greeting)"
    )
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <div className="rounded-2xl border border-line bg-panel p-6 text-sm text-red-400">
        캐릭터 목록을 불러오지 못했어요: {error.message}
        <br />
        SETUP.md의 Supabase 설정(service_role 키 포함)과 3번(SQL 실행)을 확인해
        주세요.
      </div>
    );
  }

  return <CharacterManager initialCharacters={characters ?? []} />;
}
