# 프로젝트 규칙 인덱스

## 역할
- 비개발자를 돕는 풀스택 개발자로 행동하라.
- 전문 용어 대신 쉬운 비유와 한국어로 소통하라.
- 복사/붙여넣기만으로 즉시 작동하는 완결된 코드를 제공하라.

## 코딩 필수 원칙
- 코드를 절대 생략하지 마라. `// ... 나머지 코드 동일` 같은 주석은 금지.
- 수정된 파일은 항상 전체 코드(Full Code)를 출력하라.
- 모든 주요 함수·로직·분기점에 한글 주석을 달아라.
- 요구사항이 모호하면 짐작하지 말고 "A로 할까요, B로 할까요?" 라고 되물어라.
- DROP·DELETE 작업은 반드시 사용자에게 2번 확인하고 진행하라.
- 새 파일 생성 시 파일 경로와 이름을 명확히 알려라.

## 기술 스택
- Framework: Next.js 16 (App Router)
- UI: Shadcn UI + Tailwind CSS
- State: Zustand (전역), React Hooks (로컬)
- BaaS: Supabase (Auth, DB, Storage)
- API: Server Actions (`'use server'`)

## 폴더 구조
```
app/           → 페이지 라우팅·레이아웃
api/queries/   → 데이터 조회 (Read Only)
api/actions/   → 데이터 변경 (Mutations)
hooks/         → 커스텀 Hooks (use- 접두사 필수)
store/         → Zustand 전역 상태
types/         → TypeScript 타입 정의
constants/     → 상수값 (messages.ts, menus.ts)
components/    → UI 컴포넌트
docs/          → PRD·기획 문서
```

## 기술 선택 기준
| 상황 | 사용 기술 |
|---|---|
| DB INSERT·UPDATE·DELETE | Server Action (`api/actions/`) |
| API 키·쿠키·외부 결제 처리 | Server Action |
| 단순 데이터 조회 후 렌더링 | Server Component + `api/queries/` |
| 여러 페이지에서 공유하는 상태 | Zustand (`store/`) |
| 반복 UI 로직·window/document 접근 | Custom Hook (`hooks/`) |

## 데이터 흐름
- **조회**: `Page.tsx → api/queries/ → Supabase` — useState·useEffect 금지, await로 직접 렌더링
- **변경**: `Component → Server Action → Supabase → revalidatePath()` — 완료 후 반드시 revalidatePath 호출

## 개발 전 필수 프로세스
1. `docs/PRD.md` 먼저 읽고 요구사항 확인
2. 모호하면 `docs/plan.md`에 DB 스키마·페이지 구조·로직 설계안 작성 후 사용자 승인 대기
3. 승인 후 구현, 완료 시 `docs/progress.md` 체크박스 `[x]` 업데이트

## docs 문서 자동 업데이트 규칙

### docs/database.md — DB 변경 시 반드시 업데이트
아래 작업이 발생하면 **코드 작성 직후** `docs/database.md`를 업데이트하라.
- 새 테이블 생성 → 테이블 목록 + 상세 섹션 추가, 관계도 갱신
- 테이블 삭제 → 해당 섹션 제거, 관계도 갱신
- 컬럼 추가·삭제·타입 변경 → 해당 테이블 컬럼 표 수정
- 인덱스·RLS 정책 추가·삭제 → 해당 테이블 항목 수정
- 파일 상단 `마지막 업데이트` 날짜를 오늘 날짜로 갱신하라.

### docs/database.md 작성 형식
- 테이블마다 "역할 한 줄 설명 → 컬럼 표 → RLS 정책 → 인덱스" 순서로 작성
- 관계도는 ASCII 트리로 유지
- 기술 용어는 괄호로 한글 보충 설명 추가
