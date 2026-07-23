"use client";

// GA4 대시보드 화면 — /api/admin/analytics 에서 데이터를 받아 카드/표로 표시
import { useCallback, useEffect, useState } from "react";

type GaSummary = {
  activeUsers7d: number;
  activeUsers28d: number;
  pageViews7d: number;
  pageViews28d: number;
  topPages: { path: string; views: number }[];
  chatStarts: { slug: string; count: number }[];
};

type State =
  | { status: "loading" }
  | { status: "not_configured" }
  | { status: "error"; detail: string; clientEmail: string }
  | { status: "ready"; summary: GaSummary };

export default function AnalyticsDashboard() {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      if (data.summary) {
        setState({ status: "ready", summary: data.summary });
      } else if (data.error === "not_configured") {
        setState({ status: "not_configured" });
      } else {
        setState({
          status: "error",
          detail: data.detail ?? data.error ?? "알 수 없는 오류",
          clientEmail: data.clientEmail ?? "",
        });
      }
    } catch {
      setState({ status: "error", detail: "네트워크 오류", clientEmail: "" });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (state.status === "loading") {
    return (
      <div className="rounded-2xl border border-line bg-panel p-10 text-center text-sm text-ink-soft">
        방문자 데이터를 불러오는 중…
      </div>
    );
  }

  if (state.status === "not_configured") {
    return (
      <div className="rounded-2xl border border-line bg-panel p-8 text-center text-sm text-ink-soft">
        <p className="font-bold text-wine">GA 연결 전입니다</p>
        <p className="mt-2">
          <b>SETUP.md</b>의 GA4 서비스 계정 설정을 완료하면
          <br />
          여기에 실제 방문자 수·페이지뷰·캐릭터별 대화 수가 표시됩니다.
        </p>
        <p className="mt-2 text-xs opacity-70">
          (설정 전에도 사이트와 다른 관리자 기능은 정상 작동해요)
        </p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-2xl border border-line bg-panel p-8 text-sm text-ink-soft">
        <p className="font-bold text-ink">GA 데이터를 불러오지 못했어요.</p>
        <p className="mt-2">
          가장 흔한 원인: GA4 관리 화면에서 서비스 계정 이메일
          {state.clientEmail && (
            <b className="break-all text-wine"> ({state.clientEmail}) </b>
          )}
          에 <b className="text-ink">뷰어 권한</b>을 추가하지 않은 경우예요.
          SETUP.md의 GA 설정 ③번을 확인해 주세요.
        </p>
        <p className="mt-2 break-all text-xs opacity-60">{state.detail}</p>
        <button
          onClick={load}
          className="mt-4 rounded-lg border border-line bg-night px-4 py-2 text-xs font-semibold text-ink transition hover:border-wine"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const { summary } = state;

  return (
    <div className="space-y-6">
      {/* 지표 카드 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="활성 사용자 (7일)" value={summary.activeUsers7d} />
        <StatCard label="활성 사용자 (28일)" value={summary.activeUsers28d} />
        <StatCard label="페이지뷰 (7일)" value={summary.pageViews7d} />
        <StatCard label="페이지뷰 (28일)" value={summary.pageViews28d} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 인기 페이지 top 5 */}
        <div className="overflow-hidden rounded-2xl border border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-sm font-bold text-ink">
              인기 페이지 (최근 28일)
            </span>
            <button
              onClick={load}
              className="text-xs text-ink-soft transition hover:text-wine"
            >
              새로고침
            </button>
          </div>
          {summary.topPages.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-ink-soft">
              아직 집계된 데이터가 없어요. (GA 반영까지 하루 정도 걸릴 수
              있어요)
            </p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-line">
                {summary.topPages.map((p) => (
                  <tr key={p.path}>
                    <td className="px-6 py-2.5 text-ink-soft">{p.path}</td>
                    <td className="px-6 py-2.5 text-right font-medium text-ink">
                      {p.views.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 캐릭터별 대화 시작 */}
        <div className="overflow-hidden rounded-2xl border border-line bg-panel">
          <div className="border-b border-line px-6 py-4 text-sm font-bold text-ink">
            캐릭터별 대화 시작 (최근 28일)
          </div>
          {summary.chatStarts.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-ink-soft">
              아직 데이터가 없어요.
              <br />
              <span className="text-xs opacity-70">
                (GA4에 커스텀 측정기준 character_slug 등록이 필요해요 —
                SETUP.md GA 설정 마지막 단계 참조)
              </span>
            </p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-line">
                {summary.chatStarts.map((c) => (
                  <tr key={c.slug}>
                    <td className="px-6 py-2.5 text-ink-soft">{c.slug}</td>
                    <td className="px-6 py-2.5 text-right font-medium text-wine">
                      {c.count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-5">
      <div className="text-xs text-ink-soft">{label}</div>
      <div className="mt-1 text-2xl font-black text-wine">
        {value.toLocaleString()}
      </div>
    </div>
  );
}
