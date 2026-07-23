// 내 대화 — 대화를 나눈 캐릭터 목록 (최근 대화 순)
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { fetchPublicCharacters } from "@/lib/characters";
import RewindMark from "@/components/RewindMark";
import { focalPosition } from "@/lib/focal";

export const dynamic = "force-dynamic";

export default async function MyChatsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("sidebar");
  const tVuny = await getTranslations("vuny");
  const tHome = await getTranslations("home");

  if (!isSupabaseConfigured()) redirect({ href: "/", locale });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect({ href: "/login", locale });

  // 최근 메시지에서 대화한 캐릭터를 최근 순으로 추림
  const { data: recent } = await supabase
    .from("messages")
    .select("character_id, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(300);

  const orderedIds: string[] = [];
  for (const m of recent ?? []) {
    if (!orderedIds.includes(m.character_id)) orderedIds.push(m.character_id);
  }

  const { characters } = await fetchPublicCharacters(locale);
  const chatted = orderedIds
    .map((id) => characters.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-black text-ink">{t("myChats")}</h1>

      {chatted.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-panel px-6 py-14 text-center">
          <RewindMark size={40} className="text-wine opacity-20" />
          <p className="text-sm text-ink-soft">{tVuny("empty")}</p>
          <Link
            href="/"
            className="rounded-full border border-wine/50 px-5 py-2 text-sm font-semibold text-wine transition duration-200 hover:bg-cta hover:text-ink"
          >
            {tHome("chat")} →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-panel">
          <ul className="divide-y divide-line">
            {chatted.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/chat/${c.slug}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors duration-200 hover:bg-night/60"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-line">
                    {c.thumbnail_url ? (
                      <Image
                        src={c.thumbnail_url}
                        alt={c.name}
                        fill
                        unoptimized
                        className="object-cover"
                        style={{ objectPosition: focalPosition(c.slug) }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-night text-sm font-bold text-wine">
                        {c.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-ink">{c.name}</div>
                    {c.tagline && (
                      <div className="truncate text-xs text-ink-soft">
                        {c.tagline}
                      </div>
                    )}
                  </div>
                  <span className="text-ink-soft">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
