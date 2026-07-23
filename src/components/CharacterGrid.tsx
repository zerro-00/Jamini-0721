"use client";

// 홈 캐릭터 영역 — 키워드 태그 필터 + 카드 그리드(순차 등장) + 시간대별 추천 섹션
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import CharacterCard from "@/components/CharacterCard";
import RewindMark from "@/components/RewindMark";
import type { TranslatedCharacter } from "@/lib/characters";

export default function CharacterGrid({
  characters,
}: {
  characters: TranslatedCharacter[];
}) {
  const t = useTranslations("home");
  const tVuny = useTranslations("vuny");
  const tRec = useTranslations("recommend");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 시간대별 추천 문구 (밤 10시~새벽 5시는 밤 카피) — 클라이언트에서만 계산
  const [isNight, setIsNight] = useState<boolean | null>(null);
  useEffect(() => {
    const hour = new Date().getHours();
    setIsNight(hour >= 22 || hour < 5);
  }, []);

  // 전체 키워드 목록 (중복 제거, 순서 유지)
  const tags = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const c of characters) {
      for (const k of c.keywords) {
        if (!seen.has(k)) {
          seen.add(k);
          list.push(k);
        }
      }
    }
    return list;
  }, [characters]);

  const filtered = selectedTag
    ? characters.filter((c) => c.keywords.includes(selectedTag))
    : characters;

  // 추천 캐릭터: 시간(시)을 기준으로 매일 자연스럽게 바뀜
  const recommended =
    characters.length > 0 && isNight !== null
      ? characters[new Date().getHours() % characters.length]
      : null;

  return (
    <div id="characters">
      {/* 섹션 제목 — 시선을 아래로 유도 (설명 없음) */}
      <h2 className="mb-4 text-left text-lg font-semibold text-ink-soft">
        {t("sectionTitle")}
      </h2>

      {/* 키워드 태그 필터 */}
      {tags.length > 0 && (
        <div className="mb-6 flex flex-wrap justify-start gap-2">
          <TagButton
            label={t("allTag")}
            selected={selectedTag === null}
            onClick={() => setSelectedTag(null)}
          />
          {tags.map((tag) => (
            <TagButton
              key={tag}
              label={`#${tag}`}
              selected={selectedTag === tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            />
          ))}
        </div>
      )}

      {/* 카드 그리드 — 모바일 2열 / 순차 등장 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-panel px-6 py-14 text-center">
          <RewindMark size={40} className="text-wine opacity-20" />
          <p className="text-sm text-ink-soft">{tVuny("empty")}</p>
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {filtered.map((c, i) => (
            <div
              key={c.id}
              className="vue-stagger"
              style={{ "--stagger": i } as React.CSSProperties}
            >
              <CharacterCard character={c} />
            </div>
          ))}
        </section>
      )}

      {/* 시간대별 추천 — "이런 밤엔" */}
      {recommended && (
        <section className="mt-12 rounded-2xl border border-line bg-panel/70 p-6 text-center sm:p-8">
          <div className="text-xs font-medium tracking-wide text-wine">
            {tRec("title")}
          </div>
          <p className="mt-2 text-lg font-semibold text-ink">
            {isNight ? tRec("night") : tRec("day")}
          </p>
          <Link
            href={`/characters/${recommended.slug}`}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-wine/50 px-5 py-2 text-sm font-semibold text-wine transition duration-200 hover:bg-cta hover:text-ink"
          >
            {recommended.name} →
          </Link>
        </section>
      )}
    </div>
  );
}

function TagButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors duration-200 ${
        selected
          ? "border-wine/70 bg-wine/10 font-semibold text-wine"
          : "border-line bg-panel text-ink-soft hover:border-wine/40 hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
