# Bar 0&1 근무 가능일 수집 웹앱

바 "0&1" 직원들의 매달 근무 가능일을 수집하고, 사장님이 한눈에 확인해서 쉬프트를 짤 수 있도록 만든 개인용 웹앱입니다.

- 직원용 화면: 로그인 없이 이름만 입력해서 접속, 근무 가능한 날짜를 캘린더에서 체크
- 관리자(사장)용 화면(`/admin`): 비밀번호로 로그인 후 월별 전체 현황 확인 + 직원 목록 관리
- 앱 UI(직원/관리자 화면 전체 텍스트)는 요청하신 대로 **일본어**로 작성되어 있습니다.
- 이 README와 아래 안내는 한국어로 작성했습니다.

## 기술 스택

- Next.js 14 (App Router)
- Upstash Redis (REST API 방식, `@upstash/redis` 사용)
- Vercel 배포 기준 구성 (`vercel.json` 포함)

## 데이터 구조

Upstash Redis에는 아래와 같은 키 구조로 저장됩니다.

| Key | 타입 | 값 |
| --- | --- | --- |
| `employees:list` | Set | 등록된 직원 이름 목록 (`SADD`/`SREM`/`SMEMBERS`) |
| `avail:{YYYY-MM}:{직원이름}` | String(JSON 배열) | 해당 월에 그 직원이 체크한 날짜 배열 (예: `["2026-09-01","2026-09-05"]`) |

- `employees:list`가 비어 있을 때(최초 실행 시) 환경변수 `EMPLOYEE_LIST`에 적어둔 이름들이 자동으로 시딩됩니다. 이후부터는 `/admin` 화면에서 직접 추가/삭제하면 됩니다.
- 같은 이름으로 다시 접속하면 `avail:{월}:{이름}` 키를 다시 불러와 기존에 체크했던 날짜가 그대로 표시되고, 수정 후 다시 저장하면 덮어씁니다.
- 직원용 화면은 본인이 입력한 이름에 해당하는 데이터만 조회/저장하도록 되어 있어 다른 직원의 데이터를 화면에 노출하지 않습니다. 다만 로그인 절차 없이 이름만으로 구분하는 방식이라, 다른 직원의 정확한 이름(등록된 이름과 동일한 철자)을 알고 있다면 그 사람인 척 입력해서 조회/수정하는 것 자체는 막을 수 없습니다. 소규모 개인 매장용으로 편의성을 우선한 구조이니 참고해주세요. 더 강한 보안이 필요하면 직원별 개별 링크(토큰) 방식으로 확장할 수 있습니다.

## 1. 로컬 환경 설정

### 1) 패키지 설치

```bash
npm install
```

### 2) 환경변수 설정

`.env.example` 파일을 복사해서 `.env.local` 파일을 만들고 값을 채워주세요.

```bash
cp .env.example .env.local
```

`.env.local` 내용:

```
UPSTASH_REDIS_REST_URL=여기에_Upstash_REST_URL
UPSTASH_REDIS_REST_TOKEN=여기에_Upstash_REST_TOKEN
ADMIN_PASSWORD=사장님이_사용할_관리자_비밀번호
EMPLOYEE_LIST=たなか,やまだ,すずき
```

#### Upstash Redis 값 가져오는 방법

1. [Upstash 콘솔](https://console.upstash.com/)에 로그인합니다. (없으면 무료로 가입 가능)
2. **Create Database**를 눌러 Redis 데이터베이스를 하나 생성합니다. (Region은 배포할 Vercel 리전과 가깝게 선택하면 좋습니다.)
3. 생성된 데이터베이스 상세 페이지에서 **REST API** 탭으로 이동합니다.
4. `UPSTASH_REDIS_REST_URL`과 `UPSTASH_REDIS_REST_TOKEN` 값을 복사해서 `.env.local`에 붙여넣습니다.

> Vercel과 Upstash를 마켓플레이스 연동(Vercel 대시보드 > Storage > Upstash)으로 붙이면, 이 두 환경변수가 Vercel 프로젝트에 자동으로 등록됩니다.

### 3) 로컬 실행

```bash
npm run dev
```

브라우저에서 접속:

- 직원용 화면: http://localhost:3000 (또는 http://localhost:3000/calendar)
- 관리자용 화면: http://localhost:3000/admin

## 2. Vercel 배포 방법

1. 이 저장소를 GitHub 등에 올린 상태에서 [Vercel](https://vercel.com/)에 로그인합니다.
2. **Add New... > Project**에서 이 저장소를 선택해 Import 합니다. (Framework는 Next.js로 자동 인식됩니다.)
3. 배포 전 **Environment Variables** 설정 화면에서 아래 값을 등록합니다.
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `ADMIN_PASSWORD`
   - `EMPLOYEE_LIST` (선택, 최초 시딩용)
   - 이미 Upstash를 Vercel 마켓플레이스로 연동했다면 REST URL/TOKEN 두 개는 자동으로 채워집니다.
4. **Deploy** 버튼을 눌러 배포합니다.
5. 배포 완료 후 발급된 도메인으로 접속해서 확인합니다.
   - 직원용: `https://내프로젝트.vercel.app/`
   - 관리자용: `https://내프로젝트.vercel.app/admin`

### 배포 후 직원 목록 관리

- 최초 배포 시 `EMPLOYEE_LIST`에 적어둔 이름들이 자동으로 등록됩니다.
- 이후 직원이 추가되거나 그만두는 경우 `/admin`에 로그인해서 "스태프 관리" 섹션에서 추가/삭제하면 됩니다. (코드 재배포 불필요)

## 3. 자주 발생할 수 있는 문제

- **`ADMIN_PASSWORD 환경변수가 설정되지 않았습니다` 오류**: `.env.local`(로컬) 또는 Vercel 프로젝트 환경변수에 `ADMIN_PASSWORD`가 빠져 있는 경우입니다. 값을 추가한 뒤 로컬은 재시작(`npm run dev`), Vercel은 재배포가 필요합니다.
- **직원 화면에서 "등록되지 않은 이름입니다" 오류**: `employees:list`에 해당 이름이 없는 경우입니다. `/admin`에서 직원을 추가해주세요. 이름은 공백 등 철자가 정확히 일치해야 합니다.
- **Upstash 관련 오류**: `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` 값이 정확한지, Upstash 콘솔에서 데이터베이스가 활성 상태인지 확인해주세요.

## 폴더 구조 요약

```
app/
  page.js              # 직원용 화면 (/, "use client")
  calendar/page.js      # /calendar (직원용 화면과 동일)
  admin/page.js         # 관리자 화면 진입점 (로그인 여부에 따라 분기)
  admin/login-form.js   # 관리자 로그인 폼
  admin/dashboard.js    # 관리자 월별 현황/직원 관리 화면
  api/staff/...          # 직원용 API (이름 검증, 근무 가능일 조회/저장)
  api/admin/...          # 관리자용 API (로그인/로그아웃, 현황 조회, 직원 관리)
  globals.css
lib/
  redis.js              # Upstash Redis 클라이언트
  auth.js               # 관리자 세션 쿠키 발급/검증
  employees.js          # 직원 목록 관리 (Redis Set)
  calendar-utils.js     # 달력 계산 유틸
  date-utils.js         # 날짜/월 문자열 검증, 키 생성
```

---

이 저장소 루트에는 기존에 있던 개인용 메모 캘린더(`index.html`, `app.js`, `styles.css` - 정적 사이트)가 그대로 남아있습니다. 이번에 추가한 Next.js 앱과는 별개의 파일이라 서로 충돌하지 않지만, 더 이상 필요하지 않다면 삭제하셔도 됩니다.
