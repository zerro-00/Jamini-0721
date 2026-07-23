// 회원 목록 (관리자 전용 — admin/layout.tsx 에서 접근 검사 완료)
// 모든 회원을 봐야 하므로 service_role 클라이언트(서버 전용) 사용
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const TIER_LABELS: Record<string, string> = {
  free: "무료",
  basic: "베이직",
  premium: "프리미엄",
};

export default async function AdminMembersPage() {
  const supabase = createAdminClient();
  const { data: members, error } = await supabase
    .from("profiles")
    .select(
      "id, email, display_name, coin_balance, subscription_tier, created_at, last_login_at"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <div className="rounded-2xl border border-line bg-panel p-6 text-sm text-red-400">
        회원 목록을 불러오지 못했어요: {error.message}
        <br />
        .env.local 의 SUPABASE_SERVICE_ROLE_KEY 값을 확인해 주세요 (SETUP.md
        1번).
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
      <div className="border-b border-line px-6 py-4 text-sm font-bold text-ink">
        전체 회원 {members?.length ?? 0}명
      </div>
      {!members || members.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-ink-soft">
          아직 가입한 회원이 없어요.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-soft">
                <th className="px-5 py-3 font-medium">이메일</th>
                <th className="px-5 py-3 font-medium">이름</th>
                <th className="px-5 py-3 text-right font-medium">코인</th>
                <th className="px-5 py-3 font-medium">구독</th>
                <th className="px-5 py-3 font-medium">가입일</th>
                <th className="px-5 py-3 font-medium">마지막 로그인</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-5 py-3 text-ink">{m.email}</td>
                  <td className="px-5 py-3 text-ink-soft">
                    {m.display_name ?? "-"}
                  </td>
                  <td className="px-5 py-3 text-right text-ink">
                    {(m.coin_balance ?? 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-night px-2 py-0.5 text-[11px] font-medium text-wine">
                      {TIER_LABELS[m.subscription_tier] ?? m.subscription_tier}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    {new Date(m.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    {new Date(m.last_login_at).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
