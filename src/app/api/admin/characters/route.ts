// [관리자 전용 API] 캐릭터 추가/수정/삭제 (번역 4개 언어 포함)
// service_role 키(서버 전용)를 쓰므로 반드시 관리자 검사를 먼저 통과해야 한다.
import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { routing } from "@/i18n/routing";

type TranslationInput = {
  locale?: string;
  name?: string;
  tagline?: string | null;
  description?: string | null;
  keywords?: string[] | null;
  persona?: string;
  greeting?: string | null;
};

function sanitizeCharacter(body: {
  slug?: string;
  thumbnail_url?: string | null;
  is_official?: boolean;
  is_public?: boolean;
}) {
  return {
    slug: String(body.slug ?? "")
      .trim()
      .toLowerCase(),
    thumbnail_url: String(body.thumbnail_url ?? "").trim() || null,
    is_official: Boolean(body.is_official),
    is_public: body.is_public === undefined ? true : Boolean(body.is_public),
  };
}

function sanitizeTranslations(input: unknown) {
  if (!Array.isArray(input)) return [];
  return (input as TranslationInput[])
    .map((tr) => ({
      locale: String(tr.locale ?? "").trim(),
      name: String(tr.name ?? "").trim(),
      tagline: String(tr.tagline ?? "").trim() || null,
      description: String(tr.description ?? "").trim() || null,
      keywords: Array.isArray(tr.keywords)
        ? tr.keywords.map((k) => String(k).trim()).filter(Boolean)
        : [],
      persona: String(tr.persona ?? "").trim(),
      greeting: String(tr.greeting ?? "").trim() || null,
    }))
    .filter(
      (tr) =>
        (routing.locales as readonly string[]).includes(tr.locale) &&
        tr.name &&
        tr.persona
    );
}

async function requireAdmin() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "관리자만 가능해요." }, { status: 403 });
  }
  return null;
}

// 캐릭터 추가
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json();
  const values = sanitizeCharacter(body);
  const translations = sanitizeTranslations(body.translations);

  if (!values.slug || !translations.some((t) => t.locale === "ko")) {
    return NextResponse.json(
      { error: "slug와 한국어 번역(이름+persona)은 필수예요." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data: character, error } = await supabase
    .from("characters")
    .insert(values)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { error: trError } = await supabase.from("character_translations").insert(
    translations.map((tr) => ({ ...tr, character_id: character.id }))
  );
  if (trError) {
    return NextResponse.json({ error: trError.message }, { status: 500 });
  }

  return NextResponse.json({ character });
}

// 캐릭터 수정 (기본 정보 갱신 + 번역은 upsert, 폼에서 비운 언어는 삭제)
export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json();
  const id = String(body.id ?? "");
  if (!id) {
    return NextResponse.json({ error: "id가 필요해요." }, { status: 400 });
  }
  const values = sanitizeCharacter(body);
  const translations = sanitizeTranslations(body.translations);
  if (!values.slug || !translations.some((t) => t.locale === "ko")) {
    return NextResponse.json(
      { error: "slug와 한국어 번역(이름+persona)은 필수예요." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data: character, error } = await supabase
    .from("characters")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 번역 upsert (character_id + locale 기준)
  const { error: trError } = await supabase
    .from("character_translations")
    .upsert(
      translations.map((tr) => ({ ...tr, character_id: id })),
      { onConflict: "character_id,locale" }
    );
  if (trError) {
    return NextResponse.json({ error: trError.message }, { status: 500 });
  }

  // 폼에서 빠진 언어의 기존 번역은 삭제
  const keepLocales = translations.map((t) => t.locale);
  const { error: delError } = await supabase
    .from("character_translations")
    .delete()
    .eq("character_id", id)
    .not("locale", "in", `(${keepLocales.join(",")})`);
  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  return NextResponse.json({ character });
}

// 캐릭터 삭제 (번역·대화 기록도 함께 삭제됨 — DB cascade)
export async function DELETE(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id가 필요해요." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("characters").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
