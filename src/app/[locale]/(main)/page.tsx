// 홈 — 히어로 + 태그 필터 + 캐릭터 그리드 + 시간대별 추천
// 상단 문구는 관리자가 수정하는 site_settings 값을 우선 사용 (없으면 번역 파일 기본값)
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  fetchPublicCharacters,
  type TranslatedCharacter,
} from "@/lib/characters";
import CharacterGrid from "@/components/CharacterGrid";
import RewindMark from "@/components/RewindMark";

export const dynamic = "force-dynamic";

// 히어로 카피를 두 줄로 고정 분리
// DB 값에 줄바꿈(\n)이 있으면 그대로 쓰고, 없으면 첫 쉼표(한·중·일·영) 뒤에서 나눈다
function splitHeroLines(text: string): string[] {
  if (text.includes("\n")) {
    return text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  for (const comma of [",", "，", "、"]) {
    const idx = text.indexOf(comma);
    if (idx > -1 && idx < text.length - 1) {
      return [text.slice(0, idx + 1).trim(), text.slice(idx + 1).trim()];
    }
  }
  return [text];
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const tVuny = await getTranslations("vuny");

  let characters: TranslatedCharacter[] = [];
  let error: string | null = null;
  let tagline: string | null = null;
  let introText: string | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();

    // 관리자 설정 문구 (수정 시 즉시 반영)
    const { data: settings } = await supabase
      .from("site_settings")
      .select("tagline, intro_text")
      .eq("locale", locale)
      .maybeSingle();
    tagline = settings?.tagline ?? null;
    introText = settings?.intro_text ?? null;

    const res = await fetchPublicCharacters(locale);
    characters = res.characters;
    error = res.error;
  } else {
    error = "no-env";
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      {/* 히어로 — 쉼표 뒤에서 명시적으로 두 줄 고정. 모바일 30px / 데스크톱 46px */}
      <section className="mb-12 mt-4 text-center sm:mb-16 sm:mt-6">
        <h1 className="text-[30px] font-bold leading-[1.35] tracking-[-0.02em] text-ink sm:text-[46px]">
          {splitHeroLines(tagline ?? t("hero")).map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h1>
        {/* 관리자가 사이트 설정에서 직접 넣은 경우에만 소개 문구 표시 (기본은 여백) */}
        {introText && (
          <p className="mt-4 text-sm text-ink-soft sm:text-base">{introText}</p>
        )}
      </section>

      {/* 캐릭터 영역 */}
      {error ? (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-line bg-panel px-6 py-12 text-center text-sm text-ink-soft">
          <RewindMark size={40} className="text-wine opacity-20" />
          <p className="text-ink">{tVuny("error")}</p>
          <p>
            {t("dbNotReady")} {t("dbNotReadyHint")}
          </p>
          {error !== "no-env" && (
            <p className="text-xs opacity-60">({error})</p>
          )}
        </div>
      ) : characters.length === 0 ? (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-line bg-panel px-6 py-12 text-center text-sm text-ink-soft">
          <RewindMark size={40} className="text-wine opacity-20" />
          <p>{tVuny("empty")}</p>
          <p className="text-xs opacity-70">{t("noCharacters")}</p>
        </div>
      ) : (
        <CharacterGrid characters={characters} />
      )}
    </div>
  );
}
