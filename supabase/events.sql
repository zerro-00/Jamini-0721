-- ============================================================
-- [승인됨] 사용자 행동 이벤트 테이블
-- Supabase → SQL Editor 에 붙여넣고 [Run] 하세요.
-- 대화 내용 본문·개인식별정보는 저장하지 않습니다 (메타데이터만).
-- ============================================================

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  session_id text,             -- 브라우저 탭 세션 랜덤 id (개인정보 아님)
  event_type text not null,    -- chat_start | message_send | model_change | chat_leave | pricing_view | checkout_start | checkout_done
  character_slug text,
  locale text,
  model text,                  -- 사용 모델 (변경 이벤트면 변경 후)
  prev_model text,             -- 모델 변경 전
  turn_count integer,          -- 이벤트 시점 대화 턴 수
  meta jsonb not null default '{}',  -- 진입경로(src=mail 등) 비식별 메타만
  created_at timestamptz not null default now()
);

create index if not exists events_type_time_idx on public.events (event_type, created_at);
create index if not exists events_character_time_idx on public.events (character_slug, created_at);
create index if not exists events_user_time_idx on public.events (user_id, created_at);

alter table public.events enable row level security;

-- 로그인 유저가 자기 이벤트만 insert. select 정책 없음(조회는 관리자 API의 service_role만)
drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own" on public.events
  for insert with check (auth.uid() = user_id);

grant all on public.events to anon, authenticated, service_role;
