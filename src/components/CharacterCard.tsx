"use client";

// 캐릭터 카드 — 3:4 이미지 위에 진한 하단 그라데이션(이름 22px·로즈 키워드 태그)
// 호버 시 1.02 확대 + 부드러운 그림자 (200ms ease-out)
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { focalPosition } from "@/lib/focal";
import type { TranslatedCharacter } from "@/lib/characters";

export default function CharacterCard({
  character,
}: {
  character: TranslatedCharacter;
}) {
  const t = useTranslations("home");

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-panel transition-shadow duration-200 ease-out hover:shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
      {/* 이미지 (3:4) — 클릭 시 상세 */}
      <Link href={`/characters/${character.slug}`} className="block">
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          {character.thumbnail_url ? (
            <Image
              src={character.thumbnail_url}
              alt={character.name}
              fill
              unoptimized
              className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
              style={{ objectPosition: focalPosition(character.slug) }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl font-black text-line">
              {character.name.charAt(0)}
            </div>
          )}

          {/* 하단 그라데이션 — 텍스트가 묻히지 않게 진하게 */}
          <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-night via-night/85 to-transparent" />

          {/* 이름 + 키워드 */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[22px] font-bold leading-tight text-ink">
                {character.name}
              </h2>
              {character.is_official && (
                <span className="rounded-full border border-wine/40 px-2 py-0.5 text-[10px] font-medium text-wine">
                  {t("official")}
                </span>
              )}
            </div>
            {character.tagline && (
              <p className="mt-1 line-clamp-1 text-xs text-ink-soft">
                {character.tagline}
              </p>
            )}
            {character.keywords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {character.keywords.slice(0, 3).map((k) => (
                  <span
                    key={k}
                    className="rounded-full border border-wine/50 px-2 py-0.5 text-[10px] text-wine"
                  >
                    #{k}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* 대화하기 — 딥 플럼 단색, 호버 시 한 톤 밝게 + 미세 상승 + 부드러운 그림자 */}
      <div className="p-3">
        <Link
          href={`/chat/${character.slug}`}
          className="block rounded-xl bg-cta px-4 py-2.5 text-center text-sm font-semibold text-ink transition-all duration-200 ease-out hover:-translate-y-px hover:bg-cta-hover hover:shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
        >
          {t("chat")}
        </Link>
      </div>
    </div>
  );
}
