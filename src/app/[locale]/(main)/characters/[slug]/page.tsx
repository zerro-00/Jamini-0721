// 캐릭터 상세 — 소개·키워드·대화하기 (비로그인이면 proxy가 /login 으로 안내)
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { fetchCharacterBySlug } from "@/lib/characters";
import { focalPosition } from "@/lib/focal";

export const dynamic = "force-dynamic";

export default async function CharacterDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations("characterDetail");
  const tHome = await getTranslations("home");

  if (!isSupabaseConfigured()) redirect({ href: "/", locale });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const character = await fetchCharacterBySlug(slug, locale);
  if (!character) redirect({ href: "/", locale });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-ink-soft transition hover:text-ink"
      >
        ← {t("back")}
      </Link>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* 이미지 */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-line bg-panel shadow-[0_12px_50px_rgba(0,0,0,0.45)]">
          {character!.thumbnail_url ? (
            <Image
              src={character!.thumbnail_url}
              alt={character!.name}
              fill
              unoptimized
              className="object-cover"
              style={{ objectPosition: focalPosition(character!.slug) }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-7xl font-black text-line">
              {character!.name.charAt(0)}
            </div>
          )}
        </div>

        {/* 소개 */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold text-ink">{character!.name}</h1>
            {character!.is_official && (
              <span className="rounded-full border border-wine/40 px-2.5 py-1 text-xs font-medium text-wine">
                {tHome("official")}
              </span>
            )}
          </div>

          {character!.tagline && (
            <p className="mt-2 text-lg text-wine">{character!.tagline}</p>
          )}

          {/* 키워드 */}
          {character!.keywords.length > 0 && (
            <div className="mt-5">
              <div className="mb-1.5 text-xs font-medium text-ink-soft">
                {t("keywords")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {character!.keywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-full border border-line bg-panel px-3 py-1 text-xs text-wine"
                  >
                    #{k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {character!.description && (
            <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
              {character!.description}
            </p>
          )}

          <div className="mt-auto pt-8">
            <Link
              href={`/chat/${character!.slug}`}
              className="block rounded-2xl bg-cta px-6 py-3.5 text-center font-semibold text-ink transition-all duration-200 hover:-translate-y-px hover:bg-cta-hover hover:shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
            >
              {t("chat")}
            </Link>
            {!user && (
              <p className="mt-2.5 text-center text-xs text-ink-soft">
                {t("loginToChat")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
