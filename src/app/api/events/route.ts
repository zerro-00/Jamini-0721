// 행동 이벤트 수집 (로그인 유저만 — RLS insert 정책과 일치)
// ⚠️ 대화 내용 본문·개인식별정보는 받지도, 저장하지도 않는다.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = [
  "chat_start",
  "message_send",
  "model_change",
  "chat_leave",
  "pricing_view",
  "checkout_start",
  "checkout_done",
];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // 비로그인 이벤트는 조용히 무시 (에러 아님)
    if (!user) return NextResponse.json({ ok: true });

    const body = await request.json();
    if (!ALLOWED_TYPES.includes(body.event_type)) {
      return NextResponse.json({ error: "unknown event" }, { status: 400 });
    }

    // 허용 필드만 골라 저장 (본문·자유 텍스트 차단)
    await supabase.from("events").insert({
      user_id: user.id,
      session_id:
        typeof body.session_id === "string" ? body.session_id.slice(0, 64) : null,
      event_type: body.event_type,
      character_slug:
        typeof body.character_slug === "string" ? body.character_slug.slice(0, 64) : null,
      locale: typeof body.locale === "string" ? body.locale.slice(0, 8) : null,
      model: typeof body.model === "string" ? body.model.slice(0, 64) : null,
      prev_model:
        typeof body.prev_model === "string" ? body.prev_model.slice(0, 64) : null,
      turn_count:
        typeof body.turn_count === "number" ? Math.floor(body.turn_count) : null,
      meta: {
        // 진입 경로 분류값만 (자유 텍스트 아님)
        ...(typeof body.src === "string" && ["mail", "home", "detail", "direct"].includes(body.src)
          ? { src: body.src }
          : {}),
        ...(typeof body.after_chat === "boolean" ? { after_chat: body.after_chat } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    // 이벤트 수집 실패는 사용자 흐름에 영향을 주지 않는다
    return NextResponse.json({ ok: true });
  }
}
