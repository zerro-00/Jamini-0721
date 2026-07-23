// Supabase 환경변수가 채워졌는지 확인하는 헬퍼
// (설정 전에도 화면이 에러 없이 안내 문구를 보여주기 위해 사용)
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
