// [관리자 전용 API] GA4 방문자 데이터 조회
// 프론트엔드는 이 라우트만 호출하고, GA 서비스 계정 키는 서버에서만 사용된다.
import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { isGaConfigured, fetchGaSummary } from "@/lib/ga";

export async function GET() {
  // 관리자 확인 (프론트 화면만 믿지 않고 API에서도 다시 검사)
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "관리자만 볼 수 있어요." }, { status: 403 });
  }

  if (!isGaConfigured()) {
    return NextResponse.json(
      { error: "not_configured" },
      { status: 200 } // 설정 전 상태는 에러가 아니라 안내 대상
    );
  }

  try {
    const summary = await fetchGaSummary();
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("/api/admin/analytics error:", err);
    return NextResponse.json(
      {
        error: "ga_error",
        detail: err instanceof Error ? err.message : String(err),
        clientEmail: process.env.GA_CLIENT_EMAIL ?? "",
      },
      { status: 502 }
    );
  }
}
