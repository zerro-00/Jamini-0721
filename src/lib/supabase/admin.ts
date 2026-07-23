// [서버 전용] 관리자 기능에서 쓰는 Supabase 클라이언트
// service_role 키를 사용하므로 RLS(행 보안)를 무시하고 모든 데이터에 접근 가능.
// 반드시 "관리자인지 확인한 뒤"에만 사용할 것. 브라우저에 절대 노출 금지.
import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
