// 모든 페이지 요청마다 실행되는 관문 (Next.js 16의 proxy = 예전 middleware)
// 역할 1: URL에 언어(/ko /zh /en /ja)를 붙이고 언어별 페이지로 안내 (next-intl)
// 역할 2: Supabase 로그인 세션(쿠키) 자동 갱신
import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const handleI18n = createIntlMiddleware(routing);

// 로그인해야만 들어갈 수 있는 경로 (언어 뒤에 붙는 부분 기준)
const PROTECTED_PREFIXES = ["/chat", "/profile", "/admin"];

export default async function proxy(request: NextRequest) {
  // 1) 언어 처리 (리다이렉트/리라이트 응답 생성)
  const response = handleI18n(request);

  // 2) Supabase 세션 갱신 — 설정 전(.env.local 미기입)에는 건너뜀
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    // 세션이 만료됐으면 여기서 자동 갱신된다
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 3) 보호된 페이지 접근 제어 — 비로그인 시 /login 으로
    const { pathname } = request.nextUrl;
    const firstSegment = pathname.split("/")[1];
    const locale = (routing.locales as readonly string[]).includes(firstSegment)
      ? firstSegment
      : null;
    if (locale && !user) {
      const rest = pathname.slice(locale.length + 1) || "/";
      if (PROTECTED_PREFIXES.some((p) => rest.startsWith(p))) {
        const loginUrl = new URL(`/${locale}/login`, request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return response;
}

export const config = {
  // api / auth(OAuth 콜백) / 정적 파일에는 실행하지 않음
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
