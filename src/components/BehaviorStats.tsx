"use client";

// 관리자 — 행동 분석 섹션 (7일/28일 토글)
// 모든 숫자는 /api/admin/events-stats 실측값. 더미·하드코딩 없음.
import { useCallback, useEffect, useState } from "react";

type Stats = {
  days: number;
  totalEvents: number;
  characters: { slug: string; starts: number; avgTurns: number | null; bounceRate: number | null }[];
  models: {
    usage: { model: string; count: number; pct: number }[];
    changeCount: number;
    avgChangeTurn: number | null;
    combos: { combo: string; count: number }[];
  };
  pricing: { views: number; afterChat: number; direct: number; avgTurnsBeforePricing: number | null };
  locales: { locale: string; sessions: number; avgTurns: number | null }[];
  retention: { totalUsers: number; returning: number };
  welcome: { sent: number; bySlug: Record<string, number>; mailEntries: number };
};

export default function BehaviorStats() {
  const [days, setDays] = useState<7 | 28>(7);
  const [stats, setStats] = useState<Stats | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "not_ready" | "error">("loading");

  const load = useCallback(async (d: 7 | 28) => {
    setState("loading");
    try {
      const res = await fetch(`/api/admin/events-stats?days=${d}`);
      const data = await res.json();
      if (data.error === "not_ready") return setState("not_ready");
      if (data.error) return setState("error");
      setStats(data);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <span className="text-sm font-bold text-ink">행동 분석</span>
        {/* 기간 토글 */}
        <div className="flex gap-1 rounded-full border border-line bg-night p-0.5 text-xs">
          {([7, 28] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-full px-3 py-1 transition ${
                days === d ? "bg-wine/20 font-semibold text-wine" : "text-ink-soft hover:text-ink"
              }`}
            >
              최근 {d}일
            </button>
          ))}
        </div>
      </div>

      {state === "loading" && (
        <p className="px-6 py-10 text-center text-sm text-ink-soft">불러오는 중…</p>
      )}
      {state === "not_ready" && (
        <p className="px-6 py-10 text-center text-sm text-ink-soft">
          이벤트 테이블이 아직 없어요. <b className="text-wine">supabase/events.sql</b> 을
          실행해 주세요.
        </p>
      )}
      {state === "error" && (
        <p className="px-6 py-10 text-center text-sm text-ink-soft">
          데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}

      {state === "ready" && stats && stats.totalEvents === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-ink-soft">아직 데이터가 없어요.</p>
      ) : state === "ready" && stats ? (
        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
          {/* 캐릭터별 */}
          <Section title="캐릭터별">
            {stats.characters.length === 0 ? (
              <Empty />
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-ink-soft">
                    <th className="py-1.5 font-medium">캐릭터</th>
                    <th className="py-1.5 text-right font-medium">시작</th>
                    <th className="py-1.5 text-right font-medium">평균 턴</th>
                    <th className="py-1.5 text-right font-medium">첫 턴 이탈</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {stats.characters.map((c) => (
                    <tr key={c.slug}>
                      <td className="py-1.5 text-ink">{c.slug}</td>
                      <td className="py-1.5 text-right text-ink">{c.starts}</td>
                      <td className="py-1.5 text-right text-ink">{c.avgTurns ?? "—"}</td>
                      <td className="py-1.5 text-right text-ink">
                        {c.bounceRate !== null ? `${c.bounceRate}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {/* 모델 */}
          <Section title="모델">
            {stats.models.usage.length === 0 ? (
              <Empty />
            ) : (
              <div className="space-y-2 text-xs text-ink">
                {stats.models.usage.map((m) => (
                  <div key={m.model} className="flex items-center gap-2">
                    <span className="w-24 truncate text-ink-soft">{m.model}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-night">
                      <div className="h-full rounded-full bg-wine" style={{ width: `${m.pct}%` }} />
                    </div>
                    <span className="w-16 text-right">{m.pct}% ({m.count})</span>
                  </div>
                ))}
                <div className="pt-2 text-ink-soft">
                  모델 변경 {stats.models.changeCount}회
                  {stats.models.avgChangeTurn !== null && (
                    <> · 평균 <b className="text-wine">{stats.models.avgChangeTurn}턴</b>째 변경</>
                  )}
                </div>
                {stats.models.combos.map((c) => (
                  <div key={c.combo} className="text-ink-soft">
                    {c.combo} <span className="text-ink">({c.count})</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* 결제 경로 */}
          <Section title="결제 경로 (요금제 진입)">
            {stats.pricing.views === 0 ? (
              <Empty />
            ) : (
              <div className="space-y-1.5 text-xs text-ink">
                <div>총 조회 <b>{stats.pricing.views}</b>회</div>
                <div>
                  대화 후 진입 <b className="text-wine">{stats.pricing.afterChat}</b> vs 바로 진입{" "}
                  <b>{stats.pricing.direct}</b>
                </div>
                {stats.pricing.avgTurnsBeforePricing !== null && (
                  <div className="text-ink-soft">
                    대화 후 진입 시 평균 <b className="text-wine">{stats.pricing.avgTurnsBeforePricing}턴</b> 나눈 뒤 진입
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* 언어별 + 재방문 */}
          <Section title="언어별 · 재방문">
            {stats.locales.length === 0 && stats.retention.totalUsers === 0 ? (
              <Empty />
            ) : (
              <div className="space-y-1.5 text-xs text-ink">
                {stats.locales.map((l) => (
                  <div key={l.locale}>
                    {l.locale}: 세션 {l.sessions} · 평균 {l.avgTurns ?? "—"}턴
                  </div>
                ))}
                <div className="pt-2 text-ink-soft">
                  활동 유저 {stats.retention.totalUsers}명 중{" "}
                  <b className="text-wine">{stats.retention.returning}명</b>이 2일 이상 재방문
                </div>
              </div>
            )}
          </Section>

          {/* 환영 메일 */}
          <Section title="환영 메일">
            {stats.welcome.sent === 0 ? (
              <Empty />
            ) : (
              <div className="space-y-1.5 text-xs text-ink">
                <div>총 발송 <b>{stats.welcome.sent}</b>건</div>
                {Object.entries(stats.welcome.bySlug).map(([slug, n]) => (
                  <div key={slug} className="text-ink-soft">
                    {slug}: {n}건
                  </div>
                ))}
                <div className="pt-1">
                  메일 링크로 대화 시작 <b className="text-wine">{stats.welcome.mailEntries}</b>회
                  {stats.welcome.sent > 0 && (
                    <span className="text-ink-soft">
                      {" "}(발송 대비 {Math.round((stats.welcome.mailEntries / stats.welcome.sent) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
            )}
          </Section>
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-night/40 p-4">
      <div className="mb-3 text-xs font-bold text-rose">{title}</div>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-xs text-ink-soft">아직 데이터가 없어요.</p>;
}
