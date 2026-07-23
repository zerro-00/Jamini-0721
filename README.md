# VUE — 1단계 웹서비스

**로그인한 유저가 캐릭터를 골라 실제로 대화하는 "가상 연인" 대화 서비스.**

- 슬로건: *잠들지 못하는 밤, 다시 보고 싶은 그 한 장면.*
- 이 저장소는 VUE의 1단계 MVP입니다: 구글 로그인 → 캐릭터 선택 → AI 대화 → 관리자 페이지(GA4 대시보드 포함).
- **공식 캐릭터 4명**: 카이(kai)·렌(ren)·율(yul)·시우(siwoo)
- **4개 언어 지원**: 한국어(/ko)·중국어 간체(/zh)·영어(/en)·일본어(/ja) — 헤더의 드롭다운으로 전환

## 처음이라면: SETUP.md 부터!

외부 서비스(Supabase·OpenAI·GA4) 연결이 필요합니다.
**[SETUP.md](./SETUP.md)** 를 위에서부터 순서대로 따라 하세요. 코딩 지식이 없어도 됩니다.

## 실행 방법

```bash
# 1) 이 폴더로 이동
cd vue-app

# 2) 처음 한 번만: 패키지 설치
npm install

# 3) 개발 서버 실행
npm run dev
```

브라우저에서 **http://localhost:3000** 을 열면 됩니다.
종료하려면 터미널에서 `Ctrl + C`.

## 화면 구성

주소 맨 앞에는 언어가 붙습니다 (예: `/ko`, `/en/pricing`). `/`로 들어가면 자동으로 `/ko`로 이동합니다.

| 주소 | 화면 | 누가 볼 수 있나 |
|---|---|---|
| `/ko` | 홈 — 캐릭터 목록 | 누구나 (구경 가능) |
| `/ko/characters/[slug]` | 캐릭터 상세 (소개·키워드) | 누구나 |
| `/ko/chat/[slug]` | 대화 화면 (말풍선) | 로그인 유저 |
| `/ko/profile` | 내 프로필 (이메일·코인·구독·선호 언어) | 로그인 유저 |
| `/ko/pricing` | 요금제 (결제는 "준비 중") | 누구나 |
| `/ko/admin` | GA4 방문자 대시보드 | 관리자만 |
| `/ko/admin/characters` | 캐릭터 추가/수정/삭제 (4개 언어 입력) | 관리자만 |
| `/ko/admin/members` | 회원 목록 | 관리자만 |

관리자 = `.env.local` 의 `ADMIN_EMAILS` 에 등록된 이메일로 로그인한 사람.

## 기술 구성 (참고)

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS**
- **next-intl** — 4개 언어(ko/zh/en/ja) URL 기반 다국어
- **Supabase** — 구글 로그인 + 데이터베이스 (profiles / characters / character_translations / messages)
- **OpenAI API** (기본 모델 gpt-4o-mini) — 대화 생성. AI는 선택한 언어로 답변. **키는 서버에서만 사용**
- **Google Analytics 4** — 방문자 추적(측정 ID) + 관리자 대시보드(Data API·서비스 계정)

## 보안 원칙

- OpenAI 키·GA 서비스 계정 키·Supabase service_role 키는 **전부 서버 전용**이며 브라우저에 절대 노출되지 않습니다.
- 대화 요청은 반드시 `/api/chat` (서버) 를 거쳐 OpenAI 를 호출합니다.
- `.env.local` 은 git 에 올라가지 않습니다 (.gitignore 처리됨).

## 아직 안 만든 것 (다음 단계)

- 실제 결제 연동 (요금제 버튼은 "준비 중")
- 작가 마켓플레이스
- 모바일 앱
