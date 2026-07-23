// 관리자 대시보드 — AI 연결 상태 + GA4 실제 방문자 데이터
// GA 조회는 /api/admin/analytics (서버) 를 통해서만 이뤄진다.
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import ProviderStatus from "@/components/ProviderStatus";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <ProviderStatus />
      <AnalyticsDashboard />
    </div>
  );
}
