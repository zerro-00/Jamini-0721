# VUE 설정 가이드 (SETUP.md)

> 코딩을 몰라도 괜찮아요. 위에서부터 순서대로 따라 하면 모든 연결이 끝납니다.
> 예상 소요 시간: 40분~1시간. 중간에 막히면 그 단계 제목을 그대로 검색하거나 Claude에게 물어보세요.

값을 채워 넣는 곳은 전부 `vue-app` 폴더 안의 **`.env.local`** 파일입니다.
(없다면 `.env.local.example` 파일을 복사해서 이름을 `.env.local`로 바꾸세요.)

---

## 1. Supabase 프로젝트 만들기 (로그인 + 데이터베이스)

1. https://supabase.com 접속 → 구글 계정으로 가입/로그인
2. **New project** 클릭
   - Name: `vue` (아무거나 OK)
   - Database Password: 아무 비밀번호나 만들고 **꼭 따로 메모** (나중에 거의 쓸 일 없음)
   - Region: `Northeast Asia (Seoul)` 선택
3. 프로젝트가 만들어지면(1~2분 소요) 왼쪽 메뉴 맨 아래 **⚙ Project Settings → API Keys** 로 이동
4. 다음 세 값을 복사해 `.env.local`에 붙여넣기:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** 키 (Reveal 버튼 눌러서 확인) → `SUPABASE_SERVICE_ROLE_KEY`
     - ⚠️ service_role 키는 절대 다른 사람에게 보여주면 안 되는 최고 권한 키입니다.

---

## 2. 구글 로그인 연결하기

구글 로그인 버튼이 작동하려면 "구글 클라우드"와 "Supabase" 양쪽을 연결해야 합니다.

### 2-1. 구글 클라우드에서 OAuth 클라이언트 만들기

1. https://console.cloud.google.com 접속 → 구글 로그인
2. 상단의 프로젝트 선택 메뉴 → **새 프로젝트** → 이름 `vue` → 만들기 → 만든 프로젝트 선택
3. 왼쪽 메뉴 **API 및 서비스 → OAuth 동의 화면**
   - User Type: **외부(External)** 선택 → 만들기
   - 앱 이름 `VUE`, 사용자 지원 이메일과 개발자 이메일에 본인 이메일 입력 → 저장
   - (테스트 사용자 추가 화면이 나오면 본인 구글 이메일을 추가)
4. 왼쪽 메뉴 **API 및 서비스 → 사용자 인증 정보(Credentials)**
   - **+ 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
   - 애플리케이션 유형: **웹 애플리케이션**
   - 이름: `vue-web`
   - **승인된 리디렉션 URI** 에 아래 주소 추가 (중요!):
     ```
     https://<Supabase프로젝트주소>/auth/v1/callback
     ```
     `<Supabase프로젝트주소>` 는 1번에서 복사한 Project URL에서 `https://` 를 뺀 부분입니다.
     예: Project URL이 `https://abcd1234.supabase.co` 라면
     → `https://abcd1234.supabase.co/auth/v1/callback`
   - 만들기를 누르면 **클라이언트 ID**와 **클라이언트 보안 비밀(Secret)** 이 나옵니다. 이 화면을 켜둔 채 다음으로.

### 2-2. Supabase에 구글 로그인 등록

1. Supabase 대시보드 → 왼쪽 메뉴 **Authentication → Sign In / Providers** (또는 Providers)
2. 목록에서 **Google** 클릭 → **Enable** 켜기
3. 방금 구글에서 받은 **클라이언트 ID** / **클라이언트 보안 비밀** 붙여넣기 → **Save**
4. 같은 Authentication 메뉴의 **URL Configuration** 으로 이동
   - **Site URL** 에 `http://localhost:3000` 입력 → Save
   - (나중에 실제 도메인으로 배포하면 그 주소로 바꾸면 됩니다)

---

## 3. 데이터베이스 테이블 만들기 (SQL 실행)

1. Supabase 대시보드 → 왼쪽 메뉴 **SQL Editor** → **New query**
2. `vue-app/supabase/schema.sql` 파일을 열어 내용 **전체를 복사** → 붙여넣기 → **Run** 클릭
3. "Success" 가 나오면 완료!
   - 테이블 4개(profiles, characters, character_translations, messages)와
     공식 캐릭터 4명 **카이(kai)·렌(ren)·율(yul)·시우(siwoo)** 가 4개 언어(한/중/영/일)로 만들어집니다.
   - 확인: 왼쪽 메뉴 **Table Editor** → `characters` 테이블에 4명이 보이면 성공.
   - ⚠️ 예전 버전(v1) SQL을 이미 실행했던 경우에도 그냥 다시 실행하면 됩니다.
     (캐릭터·대화 테이블은 새로 만들어지고, 회원 정보는 유지됩니다)

### 3-1. 사이트 설정 테이블 추가 (site_settings)

관리자 페이지에서 홈 화면의 제목·슬로건·소개문구를 수정하는 기능에 필요합니다.

1. 같은 방법으로 **SQL Editor → New query**
2. `vue-app/supabase/site_settings.sql` 파일 내용 **전체 복사** → 붙여넣기 → **Run**
3. "Success" 가 나오면 완료. (여러 번 실행해도 안전합니다)

---

## 4. OpenAI API 키 발급 (AI 대화)

1. https://platform.openai.com 접속 → 가입/로그인
2. 결제 수단 등록: 오른쪽 위 ⚙ Settings → **Billing** → 카드 등록 후 최소 금액(예: $5) 충전
   - 충전 없이는 API가 동작하지 않습니다. gpt-4o-mini는 매우 저렴해서 $5로도 오래 씁니다.
3. https://platform.openai.com/api-keys → **Create new secret key**
   - 이름 `vue` → 만들기 → `sk-` 로 시작하는 키가 딱 한 번 표시됩니다. 바로 복사!
4. `.env.local` 의 `OPENAI_API_KEY` 에 붙여넣기
   - ⚠️ 이 키도 절대 공개 금지. `NEXT_PUBLIC_` 을 붙이면 안 됩니다.

---

## 5. GA4 만들기 — 측정 ID 얻기 (방문자 추적)

1. https://analytics.google.com 접속 → 구글 로그인
2. (처음이면) **측정 시작** → 계정 이름 `VUE` → 다음
3. **속성 만들기**: 속성 이름 `VUE 웹`, 시간대 `대한민국`, 통화 `원` → 다음 → 비즈니스 정보는 대충 선택 → 만들기
4. 플랫폼 선택에서 **웹** 클릭
   - 웹사이트 URL: `http://localhost:3000` (나중에 실제 주소로 변경 가능), 스트림 이름 `VUE`
5. 만들어진 웹 스트림 화면에 **측정 ID** 가 보입니다. `G-` 로 시작 (예: `G-AB12CD34EF`)
6. `.env.local` 의 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 에 붙여넣기

---

## 6. GA4 대시보드용 서비스 계정 만들기 (관리자 페이지에서 방문자 수 보기)

관리자 페이지가 GA 데이터를 "읽어오려면" 구글 클라우드의 **서비스 계정**(로봇 계정)이 필요합니다.
**4단계**입니다. 순서대로!

### 6-① Google Analytics Data API 켜기

1. https://console.cloud.google.com 접속 → 위쪽에서 2번에서 만든 `vue` 프로젝트 선택
2. 왼쪽 메뉴 **API 및 서비스 → 라이브러리**
3. 검색창에 `Google Analytics Data API` 입력 → 클릭 → **사용(Enable)** 버튼 클릭

### 6-② 서비스 계정 만들기 + JSON 키 발급

1. 왼쪽 메뉴 **API 및 서비스 → 사용자 인증 정보** → **+ 사용자 인증 정보 만들기 → 서비스 계정**
2. 이름: `vue-dashboard` → **만들고 계속하기** → 역할은 건너뛰기(선택 안 함) → **완료**
3. 목록에서 방금 만든 서비스 계정 클릭 → **키(Keys)** 탭 → **키 추가 → 새 키 만들기 → JSON → 만들기**
   - JSON 파일이 컴퓨터에 다운로드됩니다.
4. 다운로드한 JSON 파일을 메모장 등으로 열면 이런 값들이 있습니다:
   - `"client_email"`: `vue-dashboard@....iam.gserviceaccount.com` → `.env.local` 의 `GA_CLIENT_EMAIL` 에 복사
   - `"private_key"`: `"-----BEGIN PRIVATE KEY-----\n....\n-----END PRIVATE KEY-----\n"` → `GA_PRIVATE_KEY` 에 복사 (붙여넣기 요령은 아래 7번 참고)

### 6-③ GA4에 서비스 계정 권한 추가 (⚠️ 가장 많이 빠뜨리는 단계!)

1. https://analytics.google.com → 왼쪽 아래 ⚙ **관리**
2. 속성 열에서 **속성 액세스 관리** 클릭
3. 오른쪽 위 **+** → **사용자 추가**
4. 이메일 주소에 6-②의 서비스 계정 이메일(`vue-dashboard@....iam.gserviceaccount.com`) 입력
5. 역할: **뷰어(Viewer)** 선택 → 추가
   - 이걸 빠뜨리면 관리자 대시보드에 "권한 오류"가 납니다.

### 6-④ GA4 속성 ID(숫자) 찾기

1. https://analytics.google.com → ⚙ **관리** → 속성 열의 **속성 세부정보**
2. 오른쪽 위에 **속성 ID** 가 보입니다 (숫자만, 예: `123456789`)
3. `.env.local` 의 `GA_PROPERTY_ID` 에 붙여넣기
   - ⚠️ `G-` 로 시작하는 측정 ID와 다른 값입니다! 여긴 숫자만 넣어요.

### 6-⑤ (선택) "캐릭터별 대화 수" 표를 보려면 — 커스텀 측정기준 등록

관리자 대시보드의 "캐릭터별 대화 시작" 표에 숫자가 나오게 하려면 한 가지 등록이 더 필요합니다.
(건너뛰어도 다른 지표는 모두 정상 표시됩니다)

1. https://analytics.google.com → ⚙ **관리** → 속성 열의 **맞춤 정의(Custom definitions)**
2. **맞춤 측정기준 만들기(Create custom dimension)** 클릭
3. 입력값:
   - 측정기준 이름: `character_slug`
   - 범위: **이벤트(Event)**
   - 이벤트 매개변수: `character_slug`
4. 저장. (등록 후 새로 쌓이는 데이터부터 집계됩니다 — 하루 정도 걸릴 수 있어요)

---

## 7. .env.local 채우기 최종 점검

`.env.local` 파일이 대략 이런 모습이면 완성입니다 (값은 예시):

```
NEXT_PUBLIC_SUPABASE_URL=https://abcd1234.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
ADMIN_EMAILS=zerro@yonsei.ac.kr
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-AB12CD34EF
GA_PROPERTY_ID=123456789
GA_CLIENT_EMAIL=vue-dashboard@vue-123456.iam.gserviceaccount.com
GA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADAN...\n-----END PRIVATE KEY-----\n"
```

**GA_PRIVATE_KEY 붙여넣기 요령:**
- JSON 파일의 `"private_key"` 값(큰따옴표 안쪽 전체)을 그대로 복사해서
- **큰따옴표로 감싼 채** 한 줄로 붙여넣으세요.
- 중간에 보이는 `\n` 글자들은 지우지 말고 그대로 두세요. (코드가 알아서 처리합니다)

**ADMIN_EMAILS:**
- 관리자로 쓸 본인 구글 이메일을 넣으세요. 여러 명이면 쉼표로: `a@x.com,b@y.com`

---

## 8. 실행하고 확인하기

터미널에서:

```bash
cd /Users/ryung/01_yonsei_cc/project/0721_1일차/vue-app
npm run dev
```

브라우저에서 http://localhost:3000 열고 체크리스트:

- [ ] 홈에 캐릭터 4명(카이·렌·율·시우)이 사진·이름·키워드와 함께 보인다
- [ ] 오른쪽 위 언어 선택(한국어/简体中文/English/日本語)을 바꾸면 캐릭터 이름·소개·화면 문구가 모두 바뀐다
- [ ] "구글로 로그인" 이 작동한다 (구글 계정 선택 화면이 뜬다)
- [ ] 로그인 후 "대화하기" → 각 캐릭터가 서로 다른 말투로, 선택한 언어로 답한다
- [ ] 새로고침해도 대화가 남아 있다
- [ ] 관리자 이메일로 로그인하면 상단에 "관리자" 메뉴가 보인다
- [ ] /admin 대시보드에 방문자 숫자가 보인다
  - (방금 만든 GA라면 숫자가 0일 수 있어요. GA는 반영까지 하루 정도 걸립니다)
- [ ] /admin 캐릭터 관리에서 언어 탭(한/중/영/일)으로 캐릭터를 수정할 수 있다
- [ ] 요금제 페이지의 결제 버튼이 "준비 중" 이다

문제가 생기면 화면에 뜨는 안내 문구가 어느 SETUP 단계를 다시 봐야 하는지 알려줍니다.
