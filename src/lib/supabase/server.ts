// 서버 컴포넌트 / API 라우트에서 쓰는 Supabase 클라이언트
// 쿠키에 담긴 로그인 세션을 읽어 "지금 로그인한 유저"로 동작한다.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 서버 컴포넌트에서 쿠키를 쓸 수 없는 경우는 무시해도 안전
            // (proxy.ts 에서 세션이 갱신된다)
          }
        },
      },
    }
  );
}
