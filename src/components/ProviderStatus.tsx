// 관리자 — AI 프로바이더 연결 상태 (서버 컴포넌트)
import { ALL_PROVIDERS } from "@/lib/ai";
import { getStatus } from "@/lib/ai/status";

export default function ProviderStatus() {
  const rows = ALL_PROVIDERS.map((p) => {
    const configured = p.isConfigured();
    const last = getStatus(p.id);
    return {
      id: p.id,
      providerName: p.providerName,
      modelLabel: p.modelLabel,
      modelId: p.modelId,
      configured,
      last,
    };
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="border-b border-line px-6 py-4 text-sm font-bold text-ink">
        AI 연결 상태
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-soft">
              <th className="px-5 py-3 font-medium">프로바이더</th>
              <th className="px-5 py-3 font-medium">모델</th>
              <th className="px-5 py-3 font-medium">키 설정</th>
              <th className="px-5 py-3 font-medium">최근 호출</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-3 font-semibold text-ink">
                  {r.providerName}
                </td>
                <td className="px-5 py-3">
                  <div className="text-ink">{r.modelLabel}</div>
                  <div className="font-mono text-[10px] text-ink-soft">
                    {r.modelId}
                  </div>
                </td>
                <td className="px-5 py-3">
                  {r.configured ? (
                    <span className="rounded-full bg-wine/15 px-2.5 py-0.5 text-[11px] font-semibold text-wine">
                      설정됨
                    </span>
                  ) : (
                    <span className="rounded-full bg-night px-2.5 py-0.5 text-[11px] text-ink-soft/60">
                      키 없음
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-xs">
                  {!r.configured ? (
                    <span className="text-ink-soft/60">—</span>
                  ) : !r.last ? (
                    <span className="text-ink-soft">아직 호출 없음</span>
                  ) : r.last.ok ? (
                    <span className="text-wine">
                      성공 · {new Date(r.last.at).toLocaleTimeString("ko-KR")}
                    </span>
                  ) : (
                    <span className="text-ink-soft">
                      실패 · {new Date(r.last.at).toLocaleTimeString("ko-KR")}
                      <span className="ml-1 opacity-60">({r.last.note})</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-6 py-3 text-xs text-ink-soft">
        키를 하나도 안 넣어도 대화는 작동합니다 (캐릭터 톤의 준비된 응답으로
        대체). 하나가 실패하면 자동으로 다음 AI로 넘어갑니다.
      </p>
    </div>
  );
}
