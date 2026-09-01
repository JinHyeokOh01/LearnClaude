# tasks.md — AI 활용 스텝업 가이드 (StepUp)

> 문서 버전: 0.1 (2026-08-31)
> 대응 문서: `requirements.md` v0.1, `design.md` v0.1
> 범위: P0 (F1 레벨 진단, F2 오늘의 레슨, F3 기능별 코스, F4 레슨+미션, F5 진도·스트릭)

---

## 작업 순서 개요

```
Phase 0  프로젝트 기반          T-01 ~ T-05
   ↓
Phase 1  콘텐츠 파이프라인       T-10 ~ T-16     ← 여기가 완료돼야 화면 작업 가능
   ↓
Phase 2  도메인 로직 (테스트 우선) T-20 ~ T-27    ← 리스크 최고 구간, 화면보다 먼저
   ↓
Phase 3  상태 계층              T-30 ~ T-34
   ↓
Phase 4  화면 구현              T-40 ~ T-67     (Phase 2·3 완료 후)
   ↓
Phase 5  콘텐츠 제작            T-70 ~ T-78     (Phase 1 이후 언제든 병행 가능)
   ↓
Phase 6  품질·접근성·성능        T-80 ~ T-85
   ↓
Phase 7  배포·운영              T-90 ~ T-94
```

**핵심 순서 원칙**: 도메인 로직(Phase 2)을 화면(Phase 4)보다 먼저 완성한다. 오늘의 레슨 선택과 스트릭 계산은 이 서비스의 유일한 "알고리즘"이고, 화면을 먼저 만들면 UI 상태와 얽혀서 테스트가 불가능해진다.

**병렬 가능**: Phase 5(콘텐츠 제작)는 Phase 1 완료 후 어느 시점에서든 병행한다. 1인 개발이면 화면 작업에 지친 날 콘텐츠를 쓰는 식으로 교차 배치를 권장한다.

---

## Phase 0 — 프로젝트 기반

- [x] **T-01** Next.js 15 App Router 프로젝트 생성, TypeScript strict 모드 활성화
  - `output: 'export'` 설정, `next.config.ts`에 정적 export 구성
  - 참조: design §2.1

- [x] **T-02** Tailwind CSS 설치 및 테마 토큰 정의
  - `:root`에 라이트 팔레트 완전 정의, 다크는 토큰만 재정의
  - 트랙별 accent 토큰 6개 정의
  - 참조: design §9.1 / NFR-10

- [x] **T-03** 디렉터리 구조 생성 (`app/`, `components/`, `lib/content|domain|storage|state/`, `content/`)
  - 참조: design §7

- [x] **T-04** 개발 도구 설정 — ESLint, Prettier, Vitest, Playwright
  - Vitest는 `lib/domain/` 커버리지 임계값 100%로 설정
  - 참조: design §10.1

- [x] **T-05** CI 워크플로 스켈레톤 (타입체크 → 린트 → 단위테스트 → 콘텐츠검증 → 빌드)
  - 이 시점에는 각 스텝이 통과만 하면 됨. 내용은 이후 태스크에서 채움
  - 참조: design §12

---

## Phase 1 — 콘텐츠 파이프라인

> 이 단계의 완료 조건: 더미 MDX 파일 2개를 넣고 `ContentIndex`가 정상 생성되며, 스키마를 일부러 깨뜨리면 빌드가 실패한다.

- [x] **T-10** Zod 스키마 정의 — `TrackSchema`, `LessonSchema`
  - `lib/content/schema.ts`
  - 참조: design §3.2, §3.3

- [x] **T-11** MDX 프론트매터 파서 구현 (gray-matter 기반)
  - `content/lessons/**/*.mdx`, `content/tracks/*.yml` 로드
  - 참조: design §3.1

- [x] **T-12** `ContentIndex` 빌더 구현
  - 트랙 order 정렬, 트랙별 레슨 order 정렬, `lessonById` / `lessonsByTrack` 맵 생성
  - 참조: design §3.4
  - 의존: T-10, T-11

- [x] **T-13** 콘텐츠 검증기 구현 — 7개 규칙
  - ID 유일성 / 트랙 참조 무결성 / prereq 참조 무결성 / prereq 순환(DFS 색칠) / 트랙 내 order 유일성 / Zod 스키마 / sources 비어 있지 않음
  - 참조: design §3.4 / NFR-15
  - 의존: T-12

- [x] **T-14** `pnpm validate:content` 스크립트 작성, CI에 연결 (npm 사용)
  - 위반 시 어떤 파일의 어떤 규칙인지 명확히 출력할 것
  - 의존: T-13, T-05

- [x] **T-15** MDX 렌더링 파이프라인 구성 (커스텀 컴포넌트 매핑 포함)
  - 코드 블록, 표, 인용 스타일링
  - 의존: T-11

- [x] **T-16** 더미 콘텐츠 작성 — 트랙 2개, 레슨 4개 (개발용, 이후 실제 콘텐츠로 교체)
  - prereq 체인과 레벨 차이를 포함시켜 도메인 로직 테스트 픽스처로 재사용
  - 의존: T-10

---

## Phase 2 — 도메인 로직 (테스트 우선)

> 이 단계는 **테스트를 먼저 작성한다.** 각 태스크는 테스트 케이스 목록이 곧 명세다.
> 완료 조건: `lib/domain/` 커버리지 100%, 화면 코드 없이 전 로직 검증 완료.

- [x] **T-20** 날짜 유틸 구현 — `localDateKey`, `previousDay`, `isSameDay`
  - 날짜 키는 로컬 타임존, 산술은 UTC 기준
  - 테스트: 월말·연말 경계, 윤년(2028-02-29), DST 전환일, 타임존 오프셋 변경
  - 참조: design §6.3 / AC-5.11

- [x] **T-21** 진행률 집계 구현 — `computeTrackProgress`, `computeOverallProgress`
  - 분모에 레벨 필터된 레슨 포함, 분자는 completed + skipped(두 종류 모두)
  - 완료 수와 건너뜀 수를 개별 필드로 산출해 UI가 구분 노출 가능하게 함(AC-5.12)
  - 테스트: 건너뜀 포함 / 완료·건너뜀 개별 카운트 / 고아 진도 키 무시 / 빈 트랙 / 0으로 나누기
  - 참조: design §6.4 / AC-3.2, AC-5.6, AC-5.12
  - 의존: T-12

- [x] **T-22** 스트릭 로직 구현 — `applyCompletion`, `displayStreak`, `revertCompletion`
  - 저장값과 표시값 분리 원칙 준수
  - `revertCompletion`: 완료 취소 시 롤백 — 오늘 완료가 남아 있으면 불변(AC-5.14), 오늘의 유일한 완료면 오늘 반영분 되돌림(AC-5.13). longest는 낮추지 않음
  - 테스트: 연속 증가 / 하루 건너뜀 재설정 / 같은 날 중복 무변화 / longest 갱신 / 미래 날짜 방어 / 표시값 0 처리 / 취소 후 오늘 완료 잔존 시 불변 / 오늘 유일 완료 취소 시 롤백
  - 참조: design §6.3 / AC-5.2 ~ AC-5.5, AC-5.13, AC-5.14
  - 의존: T-20

- [x] **T-23** 진단 채점 구현 — `scoreDiagnostic`
  - 총점 0~8 → 레벨 1/2/3, Q1 기반 기본 순서 + mastered 후순위 이동
  - 테스트: 경계값(2/3, 5/6) / Q1 4가지 분기 / mastered 이동 후에도 트랙 6개 누락·중복 없음 / basics 첫 위치 유지
  - 참조: design §6.2 / AC-1.5

- [x] **T-24** 선행 조건 및 레벨 필터 헬퍼 — `isResolved`, `arePrereqsSatisfied`, `isBelowStartLevel`
  - status 3종(`completed` / `skipped-manual` / `skipped-auto`)을 모두 다룸. `isResolved`는 세 상태 모두 true
  - prereq는 `completed`만 인정(`skipped-manual`·`skipped-auto`는 불충족)
  - 참조: design §6.1 / AC-2.7, AC-1.10

- [x] **T-25** 오늘의 레슨 선택 구현 — `selectDailyLesson`
  - 4단계: 당일 고정 → 트랙 순회 → 레벨 필터 완화 재탐색 → 완주
  - 테스트: 하루 내 고정 / 날짜 변경 시 갱신 / 고정 레슨이 이미 완료된 경우 다음 후보 / prereq 미충족 스킵 / 레벨 필터 동작 / 폴백 재탐색 / 전부 완료 시 all-cleared / pinnedTrack 우선 / `servedLessonId`가 삭제된 레슨인 경우
  - 참조: design §6.1 / AC-2.2, 2.3, 2.7, 2.8
  - 의존: T-24, T-12

- [x] **T-26** 트랙 순회 순서 결정 헬퍼 — pinnedTrack 우선 + 저장된 trackOrder + 미등록 신규 트랙 append
  - 참조: design §8.2 / AC-3.5

- [x] **T-28** 트랙 완주 종류 판정 구현 — `trackCompletionKind`
  - 존재하는 레슨 기준으로 `completed` / `already-known`(전부 `skipped-auto`) / `in-progress` 판정
  - 완주율(§1.4) 분자는 `completed`만 계산, `already-known`은 제외
  - 테스트: 전부 완료 / 일부 미해결 / 전부 skipped-auto / skipped-manual 혼재 / 빈 트랙 / 고아 키
  - 참조: design §6.1, §6.4 / AC-1.11, AC-1.12
  - 의존: T-12, T-24

- [x] **T-29** 진단 저장 시 자동 건너뜀 재계산 구현 — `recomputeAutoSkips`
  - `skipped-auto` 항목 제거 후, `hideBelowStartLevel`이면 `level < startLevel`이며 기록 없는 레슨을 `skipped-auto`로 표시
  - `completed`·`skipped-manual` 기록은 절대 변경하지 않음(AC-1.9)
  - 순수 함수로 구현해 재응시 레벨 하향(3→1) 시나리오를 테스트
  - 테스트: 최초 진단 / 레벨 상향 재응시 / 레벨 하향 재응시 / 완료·직접건너뜀 보존 확인
  - 참조: design §7.1 saveDiagnostic 절차 / AC-1.9, AC-1.10
  - 의존: T-24

- [x] **T-27** 도메인 계층 테스트 커버리지 100% 달성 확인, CI 임계값 적용
  - 의존: T-20 ~ T-26, T-28, T-29

---

## Phase 3 — 상태 계층

- [x] **T-30** `PersistedState` 타입 및 Zod 스키마 정의, `createInitialState()` 구현
  - `progress` status를 `completed` / `skipped-manual` / `skipped-auto` 3종으로 정의
  - 참조: design §4.1

- [x] **T-31** `StorageAdapter` 구현 — localStorage + 인메모리 폴백
  - 모든 접근을 try/catch로 감쌀 것. `isPersistent` 플래그 노출
  - 테스트: 정상 / 접근 throw / 용량 초과 / 폴백 동작
  - 참조: design §4.2 / AC-5.8
  - 의존: T-30

- [x] **T-32** 상태 로딩 및 버전 마이그레이션 — `loadState`, `runMigrations`
  - 손상 JSON / 하위 버전 / 상위 버전(파기 금지) / 스키마 위반 각각 처리
  - 테스트: 위 4가지 + 정상 경로
  - 참조: design §4.3 / AC-5.10
  - 의존: T-30

- [x] **T-33** `ProgressProvider` + `useProgress` 훅 구현
  - `completeLesson`은 progress 기록 + 스트릭 갱신을 **단일 리듀서 액션**으로 처리
  - `uncompleteLesson`은 progress 제거 + `revertCompletion`을 단일 액션으로 처리(AC-5.13, AC-5.14)
  - `skipLesson`은 `skipped-manual`로 기록(AC-2.9)
  - `saveDiagnostic`은 결과 저장 + `recomputeAutoSkips`를 단일 액션으로 처리(AC-1.9, AC-1.10)
  - `mounted` 플래그로 하이드레이션 가드 제공
  - 액션: complete / uncomplete / skip / pinTrack / saveDiagnostic / resetAll
  - 참조: design §7.1, §4.4 / AC-5.1, 5.7, 5.9
  - 의존: T-31, T-32, T-22, T-28, T-29

- [x] **T-34** 고아 진도 키 필터링 적용 — 읽기 시점에 `lessonById` 존재 여부로 걸러냄 (삭제하지 않음)
  - 참조: design §8.3
  - 의존: T-33, T-12

---

## Phase 4 — 화면 구현

### 4-A. 공통 레이아웃

- [x] **T-40** 루트 레이아웃 — 헤더(로고, 트랙, 설정), 푸터, 테마 프로바이더
  - 참조: design §7

- [x] **T-41** `ThemeToggle` 구현 — 라이트/다크/시스템 3상태, 선택값 localStorage 저장
  - 참조: NFR-10

- [x] **T-42** `StorageWarningBanner` 구현 — `isPersistent === false`일 때 1회 노출, dismiss 저장
  - 참조: design §8.1 / AC-5.8
  - 의존: T-33

### 4-B. 레벨 진단 (F1)

- [x] **T-43** `QuestionStepper` — 5문항 한 화면 한 문항, 진행 표시(n/5), 뒤로 가기
  - `aria-current="step"`, 라디오 그룹 접근성 준수
  - 참조: AC-1.2, AC-1.8 / NFR-5

- [x] **T-44** `QuestionCard` — Q1(업무 유형 4지선다), Q2~Q5(경험 3지선다) 렌더
  - 참조: AC-1.3, AC-1.4
  - 의존: T-43

- [x] **T-45** 진단 건너뛰기 처리 — 기본 레벨 1 + 기본 트랙 순서 적용
  - 참조: AC-1.7

- [x] **T-46** `/diagnostic/result` 결과 화면 — 시작 레벨, 첫 트랙, 건너뛰는 강의 수, 첫 강 CTA
  - **사용자가 결과를 즉시 조정 가능하게 할 것** (레벨 낮추기 / 다른 트랙 우선)
  - 참조: design §6.2 결과 화면 요구사항 / AC-1.6
  - 의존: T-23, T-33

- [x] **T-47** 설정 화면에 진단 재응시 연결 — 레벨·트랙 순서 갱신 + 자동 건너뜀 재계산, 완료·직접건너뜀 기록 보존
  - `saveDiagnostic` 액션을 통해 `recomputeAutoSkips`가 실행되는지 확인
  - 참조: AC-1.9 / design §7.1
  - 의존: T-33, T-29

### 4-C. 오늘의 레슨 (F2)

- [x] **T-48** 홈 상태 기계 구현 — DIAGNOSTIC_CTA / TODAY_PENDING / TODAY_DONE / ALL_CLEARED 분기
  - 참조: design §5.1 / AC-1.1, AC-2.1
  - 의존: T-25, T-33

- [x] **T-49** `DailyCard` — 트랙명, 제목, 요약, 소요시간, 레벨, 시작 CTA, 건너뛰기
  - 참조: AC-2.4, AC-2.9
  - 의존: T-48

- [x] **T-50** `DailyDoneState` — 완료 축하, 스트릭 표시, "한 강 더 하기"(스트릭 중복 증가 없음)
  - 참조: AC-2.5, AC-2.6
  - 의존: T-48, T-22

- [x] **T-51** `AllClearedState` — 완주 화면 + 건너뛴 레슨 목록/복습 제안
  - "이미 아는 트랙"(전부 자동 건너뜀)은 완주와 구분해 표기(AC-1.11)
  - 참조: AC-2.8, AC-1.11
  - 의존: T-48, T-28

- [x] **T-52** `DailyCardSkeleton` — 하이드레이션 전 플레이스홀더
  - 서버·클라이언트 초기 렌더가 일치해야 함
  - 참조: design §4.4
  - 의존: T-48

- [x] **T-53** `StreakBadge` — 현재 스트릭 표시, 끊긴 경우 부정적 표현 없이 재시작 안내
  - 참조: AC-2.10, AC-5.2 / NFR-6
  - 의존: T-22

### 4-D. 기능별 코스 (F3)

- [x] **T-54** `/tracks` 트랙 목록 — 6개 트랙 카드, 진행률 오버레이
  - `trackCompletionKind`에 따라 "완주" / "이미 아는 트랙" 배지를 구분 표기(AC-1.11, AC-1.12)
  - 참조: AC-3.1, AC-3.2, AC-1.11, AC-1.12
  - 의존: T-21, T-28, T-33

- [x] **T-55** `TrackProgressBar` — `role="progressbar"`, `aria-valuenow`, 텍스트 "완료 5 · 건너뜀 2 / 10 (70%)"
  - 완료 수와 건너뜀 수를 구분해 표기(AC-5.12)
  - 참조: NFR-6, NFR-7 / AC-5.12
  - 의존: T-21

- [x] **T-56** `/tracks/[trackId]` 트랙 상세 — 학습 성과 문장, 레슨 목록, `generateStaticParams`
  - 참조: AC-3.3
  - 의존: T-12

- [x] **T-57** `LessonListItem` — 완료 / 직접 건너뜀 / 자동 건너뜀 / 잠금 / 미학습 상태를 아이콘 + 텍스트로 구분
  - 자동 건너뜀(진단 레벨) 레슨은 "이미 아는 내용" 뉘앙스로 표기하고 다시 학습 진입 가능
  - 잠금 레슨에도 선행 레슨 링크 제공하되 열람은 차단하지 않음
  - 참조: AC-3.4, AC-3.6, AC-1.10 / NFR-6
  - 의존: T-24

- [x] **T-58** "이 트랙 우선하기" / "이 트랙 이어서 하기" 액션
  - 참조: AC-3.5, AC-3.7
  - 의존: T-26, T-33

### 4-E. 레슨 상세 + 미션 (F4)

- [x] **T-59** `/lessons/[lessonId]` 페이지 — 서버 컴포넌트로 본문 렌더, `generateStaticParams`
  - 참조: AC-4.1 / NFR-1
  - 의존: T-15, T-12

- [x] **T-60** `LessonHeader` — 트랙, 레벨, 예상 소요 시간, 사전 요구사항(plan/platform) 배지
  - 참조: AC-4.5, AC-4.9

- [x] **T-61** `MissionBlock` — 목표 · 프롬프트 · 성공 기준 3요소 렌더
  - 참조: AC-4.2

- [x] **T-62** `CopyPromptButton` — 클립보드 복사 + 성공 피드백 + API 차단 시 전문 노출 폴백
  - `aria-live`로 복사 결과 안내
  - 참조: AC-4.3, AC-4.4 / NFR-7

- [x] **T-63** `SourceList` — 출처 링크 + `verifiedAt` 표시
  - 참조: AC-4.7, AC-4.8

- [x] **T-64** `CompleteButton` + 다음 레슨 이동
  - 완료 시 스트릭 갱신이 원자적으로 반영되는지 확인
  - 참조: AC-4.6, AC-5.1
  - 의존: T-33

### 4-F. 설정

- [x] **T-65** `/settings` — 진단 재응시, 진도 초기화(확인 다이얼로그), 테마, 레벨 필터 토글
  - 진도 초기화는 되돌릴 수 없음을 명시
  - 참조: AC-5.9, AC-1.9, AC-1.10
  - 의존: T-33

- [x] **T-66** 완료 취소 기능 — 레슨 상세 및 트랙 목록에서 접근
  - `uncompleteLesson` 액션으로 스트릭 롤백까지 반영(AC-5.13, AC-5.14)
  - 참조: AC-5.7, AC-5.13, AC-5.14
  - 의존: T-33, T-22

- [x] **T-67** 404 페이지 — 존재하지 않는 레슨/트랙 URL 처리
  - 참조: design §8.4

---

## Phase 5 — 콘텐츠 제작

> **D-1 결정 필요**: 6개 트랙 전부(45강) 출시 vs Basics + Cowork 2개 트랙(16강) 선출시.
> 선출시를 권장한다 — 16강이면 사용자가 16일간 학습할 분량이고, 그 사이 나머지를 채울 수 있다.

- [x] **T-70** 콘텐츠 작성 템플릿 및 스타일 가이드 작성
  - 첫 문단 실무 상황 시작, 본문 900자 내외, 미션 3요소, 출처 필수
  - 참조: requirements §4.2 (CR-1 ~ CR-6)

- [x] **T-71** 트랙 정의 파일 6개 작성 (`content/tracks/*.yml`)
  - 각 트랙의 학습 성과 문장과 사전 요구사항 명시
  - 참조: requirements §4.1

- [x] **T-72** Basics 트랙 6강 작성
  - 프로젝트, 메모리, 파일 첨부, 대화 설계
  - 의존: T-70, T-71

- [x] **T-73** Cowork 트랙 10강 작성
  - 태스크 개념, 폴더 연결, 승인 모드, 예약 작업, 플러그인, 결과물 만들기
  - 의존: T-70, T-71

- [x] **T-74** Artifacts 트랙 7강 작성
- [x] **T-75** Skills 트랙 8강 작성
- [x] **T-76** Claude Code 트랙 8강 작성
- [x] **T-77** MCP·커넥터 트랙 6강 작성

- [ ] **T-78** 전 레슨 사실 검증 패스 — 공식 문서와 대조, `verifiedAt` 갱신 ⚠ 미완(저자 작업 — 45강 초안은 AI 작성, sources URL 플레이스홀더)
  - 각 레슨의 실습 미션을 실제로 실행해 성공 기준이 맞는지 확인
  - 참조: CR-2, CR-3

---

## Phase 6 — 품질 · 접근성 · 성능

- [x] **T-80** E2E 시나리오 6종 작성 (Playwright)
  - 첫 방문 전체 플로우 / 당일 고정 확인 / 진단 건너뛰기 / 트랙 우선 지정 / 진도 초기화 / localStorage 차단 컨텍스트
  - 참조: design §10.2
  - 의존: Phase 4 완료

- [x] **T-81** 접근성 감사 — 키보드 전용 조작, 스크린리더, 대비비, 포커스 순서
  - axe 자동 검사 + 수동 키보드 워크스루
  - 참조: NFR-4 ~ NFR-7

- [x] **T-82** 성능 측정 및 최적화 — Lighthouse, 번들 분석
  - 목표: LCP 2.5s 이하(3G Fast), 페이지 간 이동 300ms 이내(NFR-2, `next/link` 프리페치 확인), 초기 JS gzip 150KB 이하
  - 참조: NFR-1 ~ NFR-3 / design §11

- [ ] **T-83** 반응형 검증 — 375px 폭에서 가로 스크롤 없음, 표·코드 블록 개별 스크롤 △ CSS 대응 완료, 실기기 수동 검증 미수행
  - 참조: NFR-9

- [ ] **T-84** 크로스 브라우저 확인 — Chrome, Safari, Edge, Firefox 최신 2개 버전 △ Chromium E2E만 실행, 나머지 미실행
  - 참조: NFR-8

- [ ] **T-85** 엣지 케이스 수동 검증 △ 도메인 로직은 단위 테스트로 커버, 브라우저 수동 검증 일부 미수행
  - 자정 넘김 / 시스템 시계 과거로 변경 / 사생활 보호 모드 / 콘텐츠 배포로 레슨 추가 시 진도 유지
  - 참조: design §8.4

---

## Phase 7 — 배포 및 운영

- [x] **T-90** 정적 호스팅 배포 설정 (Vercel 또는 Cloudflare Pages), 커스텀 도메인 연결
  - D-3(서비스명·도메인) 결정 필요
  - 참조: design §12

- [x] **T-91** CI 파이프라인 완성 — 타입체크 → 린트 → 단위테스트(커버리지 게이트) → 콘텐츠검증 → E2E → 빌드 → 배포
  - 의존: T-05, T-14, T-27, T-80

- [ ] **T-92** (P1 운영 항목 — requirements §2.2) 주간 콘텐츠 재검증 CI 잡 — `verifiedAt` 90일 초과 레슨을 이슈로 자동 생성
  - P0 범위 밖. 출시 후 운영 단계에서 착수
  - 참조: CR-3 / design §12, §10.3

- [ ] **T-93** (P1 항목 — requirements §2.2) 분석 도입 (D-2 결정 후) — 쿠키리스, 개인 식별 정보 미수집
  - 이벤트: 진단 완료, 레슨 완료, 미션 프롬프트 복사 **또는 수동 복사 폴백(AC-4.4) 노출 시 실습 시작**, 트랙 진입
  - **진도 데이터 자체를 전송하지 않는다** — 이벤트는 익명 카운트만(NFR-12)
  - P0 범위 밖. 지표 정의(requirements §1.4)만 P0에서 확정
  - 참조: requirements §1.4, §2.2, NFR-11 ~ NFR-13 / design §4.2

- [x] **T-94** 기본 메타데이터 — title/description, OG 태그(정적), 파비콘, `robots.txt`, `sitemap.xml`

---

## 마일스톤

| 마일스톤 | 포함 태스크 | 완료 기준 |
|---|---|---|
| **M1 — 파이프라인 동작** | T-01 ~ T-16 | 더미 콘텐츠로 인덱스 생성, 스키마 위반 시 빌드 실패 |
| **M2 — 로직 완성** | T-20 ~ T-34 | 도메인 커버리지 100%, 화면 없이 전 시나리오 테스트 통과 |
| **M3 — 화면 동작** | T-40 ~ T-67 | 진단 → 데일리 → 코스 → 레슨 → 완료 전 플로우가 더미 콘텐츠로 동작 |
| **M4 — 콘텐츠 확보** | T-70 ~ T-73, T-78 | Basics + Cowork 16강 작성 및 검증 완료 |
| **M5 — 출시** | T-80 ~ T-94 | 접근성·성능 목표 달성, 배포 완료 |

---

## 결정 대기 항목

| # | 항목 | 필요 시점 | 영향 태스크 |
|---|---|---|---|
| D-1 | 6개 트랙 전부 vs 2개 트랙 선출시 | Phase 5 착수 전 | T-72 ~ T-77 |
| D-2 | 분석 도구 도입 여부 및 선택 | 출시 직전 | T-93 |
| D-3 | 서비스명 · 도메인 | 출시 직전 | T-90, T-94 |
| D-4 | 레슨에 스크린샷 포함 여부 | 첫 레슨 작성 시 | T-70, T-82 |

---

## 리스크 대응 태스크 매핑

| requirements §7.3 리스크 | 대응 태스크 |
|---|---|
| 콘텐츠가 빠르게 낡음 | T-63(verifiedAt 표시), T-78(검증 패스), T-92(주간 재검증 잡 — P1) |
| localStorage 유실 | T-31(폴백), T-32(마이그레이션), T-42(경고 배너) |
| 45강 제작 부담 | D-1 선출시 결정, T-70(템플릿으로 작성 속도 확보) |
| 진단 부정확 | T-46(결과 즉시 조정), T-47(재응시), T-25 4단계 폴백 |
