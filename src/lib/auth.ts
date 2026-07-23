// [서버 전용] 관리자 판별 유틸
// .env.local 의 ADMIN_EMAILS (쉼표 구분) 에 포함된 이메일만 관리자다.
import "server-only";
import { createClient } from "@/lib/supabase/server";

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

// 현재 로그인한 유저가 관리자면 유저 객체를, 아니면 null 을 돌려준다.
// 관리자 페이지와 관리자 API 라우트 양쪽에서 반드시 이 함수로 검사한다.
export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}
