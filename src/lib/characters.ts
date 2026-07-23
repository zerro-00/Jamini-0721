// 캐릭터 + 번역(4개 언어) 조회 헬퍼
// 현재 언어의 번역이 없으면 한국어(ko)로 폴백한다
import { createClient } from "@/lib/supabase/server";

export type CharacterTranslation = {
  locale: string;
  name: string;
  tagline: string | null;
  description: string | null;
  keywords: string[] | null;
  greeting: string | null;
};

export type TranslatedCharacter = {
  id: string;
  slug: string;
  thumbnail_url: string | null;
  is_official: boolean;
  name: string;
  tagline: string | null;
  description: string | null;
  keywords: string[];
  greeting: string | null;
};

// 번역 목록에서 현재 언어 → ko → 첫 번째 순으로 고른다
export function pickTranslation<T extends { locale: string }>(
  translations: T[] | null | undefined,
  locale: string
): T | null {
  if (!translations || translations.length === 0) return null;
  return (
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale === "ko") ??
    translations[0]
  );
}

type CharacterRow = {
  id: string;
  slug: string;
  thumbnail_url: string | null;
  is_official: boolean;
  character_translations: CharacterTranslation[];
};

function toTranslated(
  row: CharacterRow,
  locale: string
): TranslatedCharacter | null {
  const tr = pickTranslation(row.character_translations, locale);
  if (!tr) return null;
  return {
    id: row.id,
    slug: row.slug,
    thumbnail_url: row.thumbnail_url,
    is_official: row.is_official,
    name: tr.name,
    tagline: tr.tagline,
    description: tr.description,
    keywords: tr.keywords ?? [],
    greeting: tr.greeting,
  };
}

// 홈: 공개 캐릭터 전체 (공식 먼저)
export async function fetchPublicCharacters(locale: string): Promise<{
  characters: TranslatedCharacter[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("characters")
    .select(
      "id, slug, thumbnail_url, is_official, character_translations(locale, name, tagline, description, keywords, greeting)"
    )
    .eq("is_public", true)
    .order("is_official", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) return { characters: [], error: error.message };
  const characters = ((data ?? []) as CharacterRow[])
    .map((row) => toTranslated(row, locale))
    .filter((c): c is TranslatedCharacter => c !== null);
  return { characters, error: null };
}

// 상세/대화: slug 로 캐릭터 1명
export async function fetchCharacterBySlug(
  slug: string,
  locale: string
): Promise<TranslatedCharacter | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("characters")
    .select(
      "id, slug, thumbnail_url, is_official, character_translations(locale, name, tagline, description, keywords, greeting)"
    )
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (!data) return null;
  return toTranslated(data as CharacterRow, locale);
}
