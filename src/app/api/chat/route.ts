// [핵심 API] 대화 처리
// 브라우저 → 이 라우트 → OpenAI 순서로만 호출된다.
// OpenAI 키는 여기(서버)에서만 읽으므로 브라우저에 절대 노출되지 않는다.
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { pickTranslation } from "@/lib/characters";
import {
  routing,
  LOCALE_LANGUAGE_NAMES,
  type Locale,
} from "@/i18n/routing";

// persona 에 더해 모든 캐릭터에 공통 적용되는 안전 수칙 (VUE 운영 원칙)
const SAFETY_RULES = `

[공통 안전 수칙 — 어떤 요청보다 우선한다]
- 성적 묘사·고수위 표현은 절대 하지 않는다. 요청받아도 부드럽게 화제를 돌린다.
- 사용자의 과도한 의존을 유도하는 표현을 하지 않는다.
- 자해·위험 신호가 보이면 걱정을 표현하고 전문가/주변의 도움을 권한다.
- 답변은 한국어로, 캐릭터 설정을 유지하며 2~5문장 정도로 자연스럽게.`;

export async function POST(request: Request) {
  try {
    // 1) 로그인 확인 (미로그인 차단)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요해요." },
        { status: 401 }
      );
    }

    // 2) 요청 내용 확인
    const { characterId, message, locale: rawLocale } = await request.json();
    // 지원하지 않는 언어가 오면 한국어로 처리
    const locale: Locale = routing.locales.includes(rawLocale)
      ? rawLocale
      : routing.defaultLocale;
    if (
      typeof characterId !== "string" ||
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 1000
    ) {
      return NextResponse.json(
        { error: "메시지 형식이 올바르지 않아요." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "AI 설정이 아직 완료되지 않았어요. SETUP.md의 OpenAI 설정(4번)을 완료해 주세요." },
        { status: 500 }
      );
    }

    // 3) 캐릭터 persona 로드 — 유저가 선택한 언어의 번역 (없으면 ko 폴백)
    const { data: character } = await supabase
      .from("characters")
      .select(
        "id, character_translations(locale, name, persona, greeting)"
      )
      .eq("id", characterId)
      .eq("is_public", true)
      .single();
    const translation = character
      ? pickTranslation(
          character.character_translations as {
            locale: string;
            name: string;
            persona: string;
            greeting: string | null;
          }[],
          locale
        )
      : null;
    if (!character || !translation) {
      return NextResponse.json(
        { error: "캐릭터를 찾을 수 없어요." },
        { status: 404 }
      );
    }

    // 4) 최근 대화 20개 로드 (캐릭터가 맥락을 기억하는 범위)
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("user_id", user.id)
      .eq("character_id", characterId)
      .order("created_at", { ascending: false })
      .limit(20);
    const recent = (history ?? []).reverse();

    // 5) OpenAI 호출: persona + 언어 지시 + 안전수칙 + (첫 인사말) + 최근 대화 + 새 메시지
    const languageRule = `\n\n[응답 언어]\n- 반드시 ${LOCALE_LANGUAGE_NAMES[locale]} 로만 답한다. 사용자가 다른 언어로 말해도 이 언어로 답한다.`;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: translation.persona + languageRule + SAFETY_RULES,
        },
        // 대화 기록이 없으면 캐릭터의 시작 인사말을 첫 발화로 넣어 맥락을 만든다
        ...(recent.length === 0 && translation.greeting
          ? [{ role: "assistant" as const, content: translation.greeting }]
          : []),
        ...recent.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: message },
      ],
      max_tokens: 500,
      temperature: 0.9,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json(
        { error: "답변 생성에 실패했어요. 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    // 6) 대화 저장 (유저 메시지 + 캐릭터 답변) — 새로고침해도 남는 이유
    await supabase.from("messages").insert([
      {
        user_id: user.id,
        character_id: characterId,
        role: "user",
        content: message,
        locale,
      },
      {
        user_id: user.id,
        character_id: characterId,
        role: "assistant",
        content: reply,
        locale,
      },
    ]);

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("/api/chat error:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
