// [관리자 전용 API] 행동 이벤트 집계 (7일/28일)
// 반드시 관리자 검사 통과 후 service_role 로 집계. 개인 식별 정보는 반환하지 않는다.
// 숫자는 전부 events/profiles 테이블 실측 — 하드코딩·더미 없음.
import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type EventRow = {
  user_id: string | null;
  session_id: string | null;
  event_type: string;
  character_slug: string | null;
  locale: string | null;
  model: string | null;
  prev_model: string | null;
  turn_count: number | null;
  meta: { src?: string; after_chat?: boolean };
  created_at: string;
};

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "관리자만 볼 수 있어요." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const days = searchParams.get("days") === "28" ? 28 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      "user_id, session_id, event_type, character_slug, locale, model, prev_model, turn_count, meta, created_at"
    )
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(20000);

  if (error) {
    // 테이블 미생성 등
    return NextResponse.json({ error: "not_ready", detail: error.message });
  }

  const events = (data ?? []) as EventRow[];

  // ---------- 캐릭터별: 시작 수 / 평균 턴 / 첫 턴 이탈률 ----------
  // 세션(session_id×캐릭터) 단위로 최대 턴 수를 구한다
  const sessionTurns = new Map<string, { slug: string; locale: string; maxTurn: number }>();
  for (const e of events) {
    if (e.event_type !== "message_send" && e.event_type !== "chat_leave") continue;
    if (!e.session_id || !e.character_slug) continue;
    const key = `${e.session_id}|${e.character_slug}`;
    const cur = sessionTurns.get(key);
    const turn = e.turn_count ?? 0;
    if (!cur) {
      sessionTurns.set(key, { slug: e.character_slug, locale: e.locale ?? "ko", maxTurn: turn });
    } else if (turn > cur.maxTurn) cur.maxTurn = turn;
  }

  const byCharacter: Record<
    string,
    { starts: number; sessions: number; totalTurns: number; bounces: number }
  > = {};
  for (const e of events) {
    if (e.event_type === "chat_start" && e.character_slug) {
      byCharacter[e.character_slug] ??= { starts: 0, sessions: 0, totalTurns: 0, bounces: 0 };
      byCharacter[e.character_slug].starts++;
    }
  }
  for (const s of sessionTurns.values()) {
    byCharacter[s.slug] ??= { starts: 0, sessions: 0, totalTurns: 0, bounces: 0 };
    byCharacter[s.slug].sessions++;
    byCharacter[s.slug].totalTurns += s.maxTurn;
    if (s.maxTurn <= 1) byCharacter[s.slug].bounces++;
  }
  const characters = Object.entries(byCharacter).map(([slug, c]) => ({
    slug,
    starts: c.starts,
    avgTurns: c.sessions > 0 ? +(c.totalTurns / c.sessions).toFixed(1) : null,
    bounceRate: c.sessions > 0 ? Math.round((c.bounces / c.sessions) * 100) : null,
  }));

  // ---------- 모델: 사용 비율 / 변경 평균 턴 / 변경 조합 ----------
  const modelUse: Record<string, number> = {};
  for (const e of events) {
    if (e.event_type === "message_send" && e.model) {
      modelUse[e.model] = (modelUse[e.model] ?? 0) + 1;
    }
  }
  const totalMsgs = Object.values(modelUse).reduce((a, b) => a + b, 0);
  const modelChanges = events.filter((e) => e.event_type === "model_change");
  const changeTurns = modelChanges
    .map((e) => e.turn_count)
    .filter((t): t is number => typeof t === "number");
  const comboCount: Record<string, number> = {};
  for (const e of modelChanges) {
    const combo = `${e.prev_model ?? "?"} → ${e.model ?? "?"}`;
    comboCount[combo] = (comboCount[combo] ?? 0) + 1;
  }

  // ---------- 결제 경로 ----------
  const pricingViews = events.filter((e) => e.event_type === "pricing_view");
  const afterChat = pricingViews.filter((e) => e.meta?.after_chat === true);
  const afterChatTurns = afterChat
    .map((e) => e.turn_count)
    .filter((t): t is number => typeof t === "number");

  // ---------- 언어별 ----------
  const byLocale: Record<string, { sessions: number; totalTurns: number }> = {};
  for (const s of sessionTurns.values()) {
    byLocale[s.locale] ??= { sessions: 0, totalTurns: 0 };
    byLocale[s.locale].sessions++;
    byLocale[s.locale].totalTurns += s.maxTurn;
  }

  // ---------- 재방문: 기간 내 2일 이상 활동 유저 비율 ----------
  const userDays = new Map<string, Set<string>>();
  for (const e of events) {
    if (!e.user_id) continue;
    const day = e.created_at.slice(0, 10);
    if (!userDays.has(e.user_id)) userDays.set(e.user_id, new Set());
    userDays.get(e.user_id)!.add(day);
  }
  const totalUsers = userDays.size;
  const returning = [...userDays.values()].filter((d) => d.size >= 2).length;

  // ---------- 환영 메일: 캐릭터별 배정 수 / 메일 링크 유입 ----------
  const { data: welcomeRows } = await supabase
    .from("profiles")
    .select("welcome_character_slug")
    .not("welcome_character_slug", "is", null);
  const welcomeBySlug: Record<string, number> = {};
  for (const row of welcomeRows ?? []) {
    const s = row.welcome_character_slug as string;
    welcomeBySlug[s] = (welcomeBySlug[s] ?? 0) + 1;
  }
  const welcomeSent = (welcomeRows ?? []).length;
  const mailEntries = events.filter(
    (e) => e.event_type === "chat_start" && e.meta?.src === "mail"
  ).length;

  return NextResponse.json({
    days,
    totalEvents: events.length,
    characters,
    models: {
      usage: Object.entries(modelUse).map(([model, count]) => ({
        model,
        count,
        pct: totalMsgs > 0 ? Math.round((count / totalMsgs) * 100) : 0,
      })),
      changeCount: modelChanges.length,
      avgChangeTurn:
        changeTurns.length > 0
          ? +(changeTurns.reduce((a, b) => a + b, 0) / changeTurns.length).toFixed(1)
          : null,
      combos: Object.entries(comboCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([combo, count]) => ({ combo, count })),
    },
    pricing: {
      views: pricingViews.length,
      afterChat: afterChat.length,
      direct: pricingViews.length - afterChat.length,
      avgTurnsBeforePricing:
        afterChatTurns.length > 0
          ? +(afterChatTurns.reduce((a, b) => a + b, 0) / afterChatTurns.length).toFixed(1)
          : null,
    },
    locales: Object.entries(byLocale).map(([locale, v]) => ({
      locale,
      sessions: v.sessions,
      avgTurns: v.sessions > 0 ? +(v.totalTurns / v.sessions).toFixed(1) : null,
    })),
    retention: { totalUsers, returning },
    welcome: { sent: welcomeSent, bySlug: welcomeBySlug, mailEntries },
  });
}
