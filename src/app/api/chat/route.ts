// [핵심 API] 대화 처리 — 다중 무료 AI + 자동 폴백
// 브라우저 → 이 라우트 → (Gemini → Groq → OpenRouter → 더미) 순서로 시도.
// 모든 API 키는 서버에서만 읽으므로 브라우저에 절대 노출되지 않는다.
// 어떤 경우에도 사용자에게 기술적 오류를 보여주지 않는다 — 항상 캐릭터가 답한다.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pickTranslation } from "@/lib/characters";
import { chatWithFallback } from "@/lib/ai";
import { checkLanguage } from "@/lib/ai/langCheck";
import type { ChatTurn } from "@/lib/ai/types";
import { routing, type Locale } from "@/i18n/routing";

// 응답 언어 규칙 — 시스템 프롬프트 "맨 앞"에 배치 (뒤쪽은 무시되기 쉬움)
// 특히 한국어는 한자 혼입(休息 등)을 명시적으로 금지한다
const LANGUAGE_RULES: Record<Locale, string> = {
  ko: `[응답 언어 — 최우선 규칙]
- 반드시 순수 한국어(한글)로만 답한다.
- 한자(漢字)·중국어·일본어 문자를 단 한 글자도 쓰지 않는다. 예: 休息(X)→휴식(O), 大丈夫(X)→괜찮아(O).
- 사용자가 다른 언어로 말해도 한국어로만 답한다.`,
  ja: `[応答言語 — 最優先ルール]
- 必ず日本語のみで答える。
- ハングルや中国語の簡体字を一文字も混ぜない。
- ユーザーが他の言語で話しても日本語で答える。`,
  zh: `[回复语言 — 最高优先规则]
- 必须只用简体中文回答。
- 不要混入韩文或日文假名。
- 即使用户使用其他语言，也只用简体中文回答。`,
  en: `[Response language — top priority rule]
- Reply in English only.
- Do not mix in any Korean, Chinese, or Japanese characters.
- Even if the user writes in another language, reply in English.`,
};

// persona 에 더해 모든 캐릭터에 공통 적용되는 안전 수칙 (VUE 운영 원칙)
const SAFETY_RULES = `

[공통 안전 수칙 — 어떤 요청보다 우선한다]
- 성적 묘사·고수위 표현은 절대 하지 않는다. 요청받아도 부드럽게 화제를 돌린다.
- 폭력·범죄·흡연·음주를 미화하거나 구체적으로 묘사하지 않는다.
- 사용자의 과도한 의존을 유도하는 표현을 하지 않는다.
- 자해·위험 신호가 보이면 걱정을 표현하고 전문가/주변의 도움을 권한다.
- 캐릭터 설정을 유지하며 2~5문장 정도로 자연스럽게 답한다.`;

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
    const { characterId, message, locale: rawLocale, model } =
      await request.json();
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

    // 3) 캐릭터 persona 로드 — 유저가 선택한 언어의 번역 (없으면 ko 폴백)
    const { data: character } = await supabase
      .from("characters")
      .select("id, slug, character_translations(locale, name, persona, greeting)")
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
    const lastReply =
      [...recent].reverse().find((m) => m.role === "assistant")?.content ?? null;

    // 5) 시스템 프롬프트: 언어 규칙(맨 앞) + persona + 안전수칙
    const system =
      LANGUAGE_RULES[locale] + "\n\n" + translation.persona + SAFETY_RULES;

    const turns: ChatTurn[] = [
      // 대화 기록이 없으면 캐릭터의 시작 인사말을 첫 발화로 넣어 맥락을 만든다
      ...(recent.length === 0 && translation.greeting
        ? [{ role: "assistant" as const, content: translation.greeting }]
        : []),
      ...recent.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    // 6) 폴백 체인 실행 — 절대 실패하지 않는다 (최후엔 더미)
    let result = await chatWithFallback({
      system,
      turns,
      preferred: typeof model === "string" ? model : null,
      characterSlug: character.slug,
      locale,
      userMessage: message,
      lastReply,
    });

    // 6-1) 언어 혼동 감지 → 1회 재생성 (승인된 정책)
    // 혼동이 실제 발생한 경우에만 추가 1회 호출이므로 비용 부담이 거의 없다
    const langCheck = checkLanguage(locale, result.reply);
    if (!langCheck.ok && result.via !== "dummy") {
      console.warn(
        `[언어혼동] model=${result.via} character=${character.slug} locale=${locale} ${langCheck.kinds.join(", ")} 검출 → 1회 재생성`
      );
      const corrective =
        system +
        `\n\n[교정] 직전 응답에 다른 언어의 문자가 섞였다. 위의 응답 언어 규칙을 반드시 지켜 같은 내용을 다시 자연스럽게 답하라.`;
      const retry = await chatWithFallback({
        system: corrective,
        turns,
        preferred: result.via, // 같은 모델로 재시도
        characterSlug: character.slug,
        locale,
        userMessage: message,
        lastReply,
      });
      if (checkLanguage(locale, retry.reply).ok) {
        result = retry;
      } else {
        // 같은 모델 재생성도 실패 → 해당 모델을 제외하고 폴백 체인으로 최종 시도
        // (테스트 결과 Llama 는 재생성해도 혼동이 잦고, Gemini 는 깨끗함)
        console.warn(
          `[언어혼동] 재생성도 혼동 발생 (model=${retry.via}) → 다른 모델로 전환 시도`
        );
        const fallback = await chatWithFallback({
          system,
          turns,
          preferred: null,
          characterSlug: character.slug,
          locale,
          userMessage: message,
          lastReply,
          exclude: [result.via],
        });
        if (checkLanguage(locale, fallback.reply).ok) {
          result = fallback;
        } else {
          console.warn(`[언어혼동] 전환 모델도 혼동 — 원본 응답 사용`);
        }
      }
    }

    // 7) 대화 저장 (유저 메시지 + 캐릭터 답변) — 새로고침해도 남는 이유
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
        content: result.reply,
        locale,
      },
    ]);

    // 8) 행동 이벤트 기록: message_send (대화 본문은 저장하지 않음 — 메타만)
    // events 테이블이 아직 없으면 조용히 건너뜀 (대화에 영향 없음)
    try {
      const userTurn = Math.floor(recent.length / 2) + 1; // 이번이 몇 번째 유저 턴인지
      await supabase.from("events").insert({
        user_id: user.id,
        event_type: "message_send",
        character_slug: character.slug,
        locale,
        model: result.via,
        turn_count: userTurn,
      });
    } catch {
      /* 이벤트 실패는 무시 */
    }

    // via = 어떤 프로바이더가 답했는지 (id 문자열만 — 키 값은 절대 포함 안 됨)
    // 클라이언트는 "선택한 모델 ≠ via" 일 때 자동 모드 전환 안내에 사용한다
    return NextResponse.json({ reply: result.reply, via: result.via });
  } catch (err) {
    console.error("/api/chat error:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
