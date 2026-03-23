# 데이터베이스 스키마 문서

> Supabase 프로젝트: **Design Crawling** (`whffzfvwxtwuedciksdc`) — ap-northeast-2 (서울)
> 마지막 업데이트: 2026-03-24

---

## 테이블 목록

| 테이블 | 역할 | RLS |
|---|---|---|
| `crawl_jobs` | 크롤링 작업 설정 | 활성화 |
| `crawl_selectors` | 클릭·수집 셀렉터 설정 | 활성화 |
| `crawl_results` | 수집된 데이터 저장 | 활성화 |
| `crawl_logs` | 실행 이력 및 에러 기록 | 활성화 |

---

## crawl_jobs — 크롤링 작업 설정

사용자가 등록한 크롤링 작업(URL, 주기 등)을 저장합니다.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | 자동 생성 |
| `user_id` | uuid FK → auth.users | 작업 소유자 |
| `name` | text | 작업 이름 |
| `url` | text | 크롤링 대상 URL |
| `cron_expression` | text | 실행 주기 (예: `0 9 * * *`) |
| `is_active` | boolean | 활성 여부 (기본값 true) |
| `last_run_at` | timestamptz | 마지막 실행 시각 |
| `created_at` | timestamptz | 생성 시각 |

**RLS 정책**: 본인(`auth.uid() = user_id`) 행만 SELECT / INSERT / UPDATE / DELETE 가능

---

## crawl_selectors — 셀렉터 설정

각 작업에서 클릭하거나 데이터를 추출할 CSS 셀렉터 단계를 저장합니다.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | 자동 생성 |
| `job_id` | uuid FK → crawl_jobs | 연결된 작업 |
| `step_order` | integer | 실행 순서 (기본값 1) |
| `action` | text | `click` 또는 `extract` |
| `selector` | text | CSS 셀렉터 |
| `data_type` | text | `text` / `image_url` / `href` / `table` (extract 시 필요) |
| `field_name` | text | 결과 데이터의 필드 키 이름 |
| `created_at` | timestamptz | 생성 시각 |

**RLS 정책**: 부모 `crawl_jobs`의 `user_id = auth.uid()`인 행만 접근 가능

---

## crawl_results — 수집된 데이터

크롤링 실행 결과 데이터를 JSON 형태로 저장합니다.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | 자동 생성 |
| `job_id` | uuid FK → crawl_jobs | 연결된 작업 |
| `run_id` | uuid | 한 번의 실행을 묶는 ID |
| `data` | jsonb | 수집된 실제 데이터 |
| `crawled_at` | timestamptz | 수집 시각 |

**인덱스**
- `idx_crawl_results_job_id` — job_id 조회 최적화
- `idx_crawl_results_run_id` — run_id 조회 최적화
- `idx_crawl_results_crawled_at` — 최신순 정렬 최적화 (DESC)

**RLS 정책**: 부모 `crawl_jobs`의 `user_id = auth.uid()`인 행만 SELECT / INSERT / DELETE 가능

---

## crawl_logs — 실행 이력

크롤링 실행 결과(성공/실패)와 소요 시간을 기록합니다.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | 자동 생성 |
| `job_id` | uuid FK → crawl_jobs | 연결된 작업 |
| `run_id` | uuid | 한 번의 실행을 묶는 ID (`crawl_results`와 동일 값) |
| `status` | text | `success` / `failed` / `partial` |
| `error_message` | text | 실패 시 에러 메시지 |
| `duration_ms` | integer | 실행 소요 시간 (밀리초) |
| `executed_at` | timestamptz | 실행 시각 |

**인덱스**
- `idx_crawl_logs_job_id` — job_id 조회 최적화
- `idx_crawl_logs_executed_at` — 최신순 정렬 최적화 (DESC)

**RLS 정책**: 부모 `crawl_jobs`의 `user_id = auth.uid()`인 행만 SELECT / INSERT 가능

---

## 테이블 관계도

```
auth.users
    └── crawl_jobs (user_id)
            ├── crawl_selectors (job_id)
            ├── crawl_results   (job_id)
            └── crawl_logs      (job_id)
```

- 부모 삭제 시 자식 행 자동 삭제 (`ON DELETE CASCADE`)
- `crawl_results.run_id` = `crawl_logs.run_id` — 같은 실행 묶음을 조인할 때 사용
