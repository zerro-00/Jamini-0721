// [서버 전용] GA4 Data API 래퍼
// 서비스 계정으로 인증해서 방문자 수·페이지뷰 등을 읽어온다.
// 프론트엔드에서 직접 호출 금지 — 반드시 /api/admin/analytics 를 거칠 것.
import "server-only";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

// GA 설정이 완료됐는지 (env 4개가 다 채워졌는지)
export function isGaConfigured(): boolean {
  return Boolean(
    process.env.GA_PROPERTY_ID &&
      process.env.GA_CLIENT_EMAIL &&
      process.env.GA_PRIVATE_KEY
  );
}

function getClient() {
  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: process.env.GA_CLIENT_EMAIL!,
      // .env 파일에는 개행이 "\n" 두 글자로 저장되므로 진짜 개행으로 되돌린다
      private_key: process.env.GA_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    },
  });
}

export type GaSummary = {
  activeUsers7d: number;
  activeUsers28d: number;
  pageViews7d: number;
  pageViews28d: number;
  topPages: { path: string; views: number }[];
  chatStarts: { slug: string; count: number }[];
};

export async function fetchGaSummary(): Promise<GaSummary> {
  const client = getClient();
  const property = `properties/${process.env.GA_PROPERTY_ID}`;

  // 최근 7일 / 28일 활성 사용자 + 페이지뷰
  const [totals] = await client.runReport({
    property,
    dateRanges: [
      { startDate: "7daysAgo", endDate: "today", name: "7d" },
      { startDate: "28daysAgo", endDate: "today", name: "28d" },
    ],
    metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
  });

  // 최근 28일 인기 페이지 top 5
  const [pages] = await client.runReport({
    property,
    dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 5,
  });

  const summary: GaSummary = {
    activeUsers7d: 0,
    activeUsers28d: 0,
    pageViews7d: 0,
    pageViews28d: 0,
    topPages: [],
    chatStarts: [],
  };

  // 캐릭터별 대화 시작(chat_start) 횟수 — GA에 커스텀 측정기준(character_slug)을
  // 등록해야 조회된다 (SETUP.md 참조). 등록 전이면 조용히 빈 목록으로 둔다.
  try {
    const [chats] = await client.runReport({
      property,
      dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
      dimensions: [{ name: "customEvent:character_slug" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: { matchType: "EXACT", value: "chat_start" },
        },
      },
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 10,
    });
    summary.chatStarts = (chats.rows ?? [])
      .map((row) => ({
        slug: row.dimensionValues?.[0]?.value ?? "",
        count: Number(row.metricValues?.[0]?.value ?? 0),
      }))
      .filter((c) => c.slug && c.slug !== "(not set)");
  } catch {
    // 커스텀 측정기준 미등록 등 — 대시보드의 다른 지표는 정상 표시
  }

  for (const row of totals.rows ?? []) {
    // dateRange 차원 값은 마지막 dimensionValues 에 "7d" / "28d" 로 들어온다
    const range = row.dimensionValues?.at(-1)?.value;
    const users = Number(row.metricValues?.[0]?.value ?? 0);
    const views = Number(row.metricValues?.[1]?.value ?? 0);
    if (range === "7d") {
      summary.activeUsers7d = users;
      summary.pageViews7d = views;
    } else if (range === "28d") {
      summary.activeUsers28d = users;
      summary.pageViews28d = views;
    }
  }

  summary.topPages = (pages.rows ?? []).map((row) => ({
    path: row.dimensionValues?.[0]?.value ?? "",
    views: Number(row.metricValues?.[0]?.value ?? 0),
  }));

  return summary;
}
