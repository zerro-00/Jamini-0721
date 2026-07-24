// 구글 로그인 후 돌아오는 곳 (OAuth 콜백)
// 인증 코드를 세션으로 바꾸고, 마지막 로그인 시각을 기록한 뒤 원래 페이지로 보낸다.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { maybeSendWelcomeEmail } from "@/lib/email/sendWelcome";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // 로그인 전에 보고 있던 페이지로 돌려보내기 (기본: 홈)
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // 마지막 로그인 시각 갱신
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ last_login_at: new Date().toISOString() })
          .eq("id", user.id);

        // 환영 메일 (가입 후 1회) — 함수 내부에서 모든 실패를 삼키므로
        // 어떤 경우에도 로그인 진행을 막지 않는다
        await maybeSendWelcomeEmail(supabase, user);
      }
      // login=success 표시를 붙여 보내면 화면에서 GA 이벤트를 한 번 기록한다
      const dest = new URL(`${origin}${next}`);
      dest.searchParams.set("login", "success");
      return NextResponse.redirect(dest.toString());
    }
  }

  // 실패하면 홈으로 (에러 표시)
  return NextResponse.redirect(`${origin}/?login_error=1`);
}
