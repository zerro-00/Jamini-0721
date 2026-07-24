-- ============================================================
-- [승인 대기] 환영 메일용 컬럼 2개 추가
-- Supabase → SQL Editor 에 붙여넣고 [Run] 하세요.
-- (여러 번 실행해도 안전합니다. 기존 데이터는 건드리지 않습니다)
-- ============================================================

-- 가입 시 배정된 환영 캐릭터 (kai / ren / yul / siwoo)
alter table public.profiles
  add column if not exists welcome_character_slug text;

-- 환영 메일 발송 시각 — 비어 있을 때만 발송하므로 중복 발송이 원천 차단됨
alter table public.profiles
  add column if not exists welcome_email_sent_at timestamptz;
