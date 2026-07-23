-- ============================================================
-- VUE 추가 업데이트: 사이트 설정 테이블 (site_settings)
-- Supabase → SQL Editor 에 통째로 붙여넣고 [Run] 하세요.
-- (이미 실행한 적이 있어도 다시 실행해도 안전합니다)
-- 관리자 페이지 → 사이트 설정에서 제목·슬로건·소개문구를 언어별로 수정할 수 있게 합니다.
-- ============================================================

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  locale text not null unique check (locale in ('ko', 'zh', 'en', 'ja')),
  site_title text not null default 'VUE',
  tagline text,          -- 홈 상단 큰 문구
  intro_text text,       -- 홈 상단 소개 문구
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- 누구나 읽을 수 있음 (홈 화면 표시용). 쓰기는 서버(관리자)만
drop policy if exists "site_settings_select_all" on public.site_settings;
create policy "site_settings_select_all" on public.site_settings
  for select using (true);

-- ---------- 테이블 접근 권한 (중요!) ----------
-- 새 Supabase 프로젝트는 이 권한이 없으면 "permission denied" 오류가 납니다.
-- (실제 데이터 보호는 위의 RLS 정책이 담당하므로 안전합니다)
grant usage on schema public to anon, authenticated, service_role;
grant all privileges on all tables in schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;

-- 4개 언어 기본 문구 — 확정 카피 한 줄, 서브 없음
-- (다시 실행하면 최신 기본 문구로 덮어씁니다)
insert into public.site_settings (locale, site_title, tagline, intro_text) values
  ('ko', 'VUE', '지금부터, 우리의 첫 페이지', null),
  ('en', 'VUE', 'From here, our first page', null),
  ('ja', 'VUE', 'ここから、わたしたちの序章', null),
  ('zh', 'VUE', '现在起，我们的初篇', null)
on conflict (locale) do update
  set tagline = excluded.tagline,
      intro_text = excluded.intro_text,
      updated_at = now();
