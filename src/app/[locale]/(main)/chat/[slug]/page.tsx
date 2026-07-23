// 대화 화면 (로그인 필수)
// 서버에서 캐릭터 정보(현재 언어 번역) + 기존 대화 기록을 불러와 클라이언트 UI에 넘긴다.
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { fetchCharacterBySlug } from "@/lib/characters";
import ChatRoom from "@/components/ChatRoom";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!isSupabaseConfigured()) redirect({ href: "/", locale });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인 안 했으면 캐릭터 상세로 (거기서 로그인 유도)
  if (!user) redirect({ href: `/characters/${slug}`, locale });

  // 캐릭터 정보 — 현재 언어의 번역 (persona 는 서버 API 에서만 사용, 여기서 안 내려줌)
  const character = await fetchCharacterBySlug(slug, locale);
  if (!character) redirect({ href: "/", locale });

  // 기존 대화 기록 (새로고침해도 유지되는 이유)
  const { data: history } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("user_id", user!.id)
    .eq("character_id", character!.id)
    .order("created_at", { ascending: true })
    .limit(200);

  return (
    <ChatRoom
      slug={slug}
      character={{
        id: character!.id,
        name: character!.name,
        description: character!.tagline ?? character!.description,
        greeting: character!.greeting,
        thumbnail_url: character!.thumbnail_url,
      }}
      locale={locale}
      initialMessages={history ?? []}
    />
  );
}
