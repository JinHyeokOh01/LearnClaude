# design.md — AI 활용 스텝업 가이드 (StepUp)

> 문서 버전: 0.1 (2026-08-31)
> 대응 문서: `requirements.md` v0.1
> 범위: P0 (F1 레벨 진단, F2 오늘의 레슨, F3 기능별 코스, F4 레슨+미션, F5 진도·스트릭)

---

## 1. 설계 원칙

이 프로젝트의 설계는 네 가지 원칙을 따른다.

1. **콘텐츠는 하나, 뷰는 여러 개.** 레슨은 단일 원자 단위이고, 데일리·코스는 같은 레슨 풀을 다르게 인덱싱한 뷰다. P1의 검색·레시피도 같은 풀 위에 얹는다. 콘텐츠를 기능별로 중복 작성하지 않는다.
2. **서버 없는 개인화.** 진단과 진도는 전부 클라이언트에 있다. 서버가 없으므로 개인화 로직은 순수 함수여야 하고, 테스트 가능해야 한다.
3. **콘텐츠 추가에 코드 수정이 필요 없다.** 마크다운 파일 하나를 추가하면 데일리·코스·진행률에 자동 반영된다.
4. **진도 데이터는 깨지지 않는다.** 콘텐츠는 계속 바뀌지만 사용자의 완료 기록은 살아남아야 한다. 모든 참조는 안정적인 레슨 ID 기반이다.

---

## 2. 아키텍처 개요

### 2.1 기술 스택

| 계층 | 선택 | 근거 |
|---|---|---|
| 프레임워크 | Next.js 15 (App Router) | 정적 export 지원 + 파일 기반 라우팅 + MDX 생태계 |
| 빌드 산출물 | `output: 'export'` 정적 사이트 | 서버 불필요(NFR-11~13), 배포 단순, 비용 0 |
| 언어 | TypeScript (strict) | 콘텐츠 스키마와 상태 모델의 타입 안정성 |
| 콘텐츠 | MDX 파일 (`content/lessons/*.mdx`, `content/tracks/*.yml`) | 코드 수정 없는 콘텐츠 추가(NFR-14) |
| 스키마 검증 | Zod | 빌드 타임 검증 및 빌드 실패 처리(NFR-15) |
| 스타일 | Tailwind CSS + CSS 변수 토큰 | 라이트/다크 테마(NFR-10) |
| 상태 | React Context + useReducer + localStorage 어댑터 | 외부 상태 라이브러리 불필요한 규모 |
| 테스트 | Vitest (로직) + Playwright (E2E) | 선택 알고리즘·스트릭이 핵심 리스크 |
| 배포 | Vercel 또는 Cloudflare Pages | 정적 호스팅, Git push 배포 |

> **대안 검토** — Astro는 콘텐츠 사이트에 더 가볍지만, 진단·진도·데일리가 모두 클라이언트 상태에 의존하므로 React 인터랙션 비중이 높다. Next.js App Router로 통일하는 편이 상태 관리 일관성 면에서 유리하다고 판단했다.

### 2.2 계층 구조

```
┌─────────────────────────────────────────────────┐
│  Presentation — app/ 라우트, components/         │
│  서버 컴포넌트(콘텐츠 렌더) + 클라이언트 컴포넌트(진도) │
└───────────────┬─────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────┐
│  Domain — lib/domain/                            │
│  순수 함수: 진단 채점, 다음 레슨 선택, 스트릭 계산,   │
│            진행률 집계                            │
│  → 부수효과 없음, 100% 단위 테스트 대상            │
└───────────────┬─────────────────────────────────┘
                │
    ┌───────────┴───────────┐
    │                       │
┌───▼──────────────┐  ┌─────▼──────────────────────┐
│ Content (빌드타임) │  │ Persistence (런타임)        │
│ lib/content/      │  │ lib/storage/               │
│ MDX 파싱 → 인덱스 │  │ localStorage 어댑터 +       │
│ Zod 검증          │  │ 인메모리 폴백 + 버전 마이그레이션│
└──────────────────┘  └────────────────────────────┘
```

**핵심 경계**: Domain 계층은 콘텐츠 인덱스와 진도 스냅샷을 **입력으로 받는 순수 함수**만 갖는다. localStorage나 `Date.now()`를 직접 참조하지 않고, 오늘 날짜는 인자로 주입받는다. 이 규칙 하나로 데일리 로직 전체가 테스트 가능해진다.

---

## 3. 콘텐츠 모델

### 3.1 디렉터리 구조

```
content/
├── tracks/
│   ├── basics.yml
│   ├── artifact.yml
│   ├── skill.yml
│   ├── cowork.yml
│   ├── claude-code.yml
│   └── mcp.yml
└── lessons/
    ├── basics/
    │   ├── basics-100.mdx
    │   └── basics-200.mdx
    ├── cowork/
    │   └── cowork-100.mdx
    └── ...
```

### 3.2 Track 스키마

```yaml
# content/tracks/cowork.yml
id: cowork
title: Cowork
tagline: 내 폴더를 연결해 실제 파일 작업을 맡긴다
order: 400
outcome: 이 트랙을 마치면 Cowork로 내 폴더의 파일을 정리·변환하고, 반복 작업을 예약 실행할 수 있습니다.
prerequisiteNote: 유료 플랜(Pro/Max/Team/Enterprise)이 필요합니다.
accentToken: track-cowork
```

```ts
const TrackSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  tagline: z.string().max(60),
  order: z.number().int(),
  outcome: z.string(),
  prerequisiteNote: z.string().optional(),
  accentToken: z.string(),
});
```

### 3.3 Lesson 스키마

```mdx
---
id: cowork-300
track: cowork
order: 300
title: 폴더를 연결해서 내 파일로 일 시키기
summary: 업로드 없이 내 컴퓨터 폴더를 Claude에게 직접 열어주는 방법
level: 2
estMinutes: 3
prereq: [cowork-100, cowork-200]
tags: [파일작업, 데스크톱, 폴더연결]   # P0 미사용, P1 검색용으로 미리 축적
requires:
  plan: paid
  platform: desktop
mission:
  goal: 내 폴더 하나를 연결하고 파일 목록을 정리시켜 본다
  prompt: |
    이 폴더에 있는 파일들을 확장자별로 몇 개씩 있는지 세어주고,
    3개월 이상 수정되지 않은 파일 목록을 표로 보여줘.
  success: 파일 개수 표와 오래된 파일 목록이 표로 돌아오면 성공입니다.
verifiedAt: 2026-08-31
sources:
  - label: Get started with Claude Cowork
    url: https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork
---

## 이게 왜 필요한가

(실무 상황으로 시작하는 본문 — 약 900자)
```

```ts
const LessonSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+-\d+$/),
  track: z.string(),
  order: z.number().int().positive(),
  title: z.string().max(40),
  summary: z.string().max(80),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  estMinutes: z.number().int().min(1).max(10),
  prereq: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  requires: z.object({
    plan: z.enum(['free', 'paid']).optional(),
    platform: z.enum(['web', 'desktop', 'cli']).optional(),
  }).optional(),
  mission: z.object({
    goal: z.string(),
    prompt: z.string(),
    success: z.string(),
  }),
  verifiedAt: z.string().date(),
  sources: z.array(z.object({ label: z.string(), url: z.string().url() })).min(1),
});
```

### 3.4 콘텐츠 인덱스 (빌드 타임 생성)

빌드 시 모든 MDX를 파싱해 다음 인덱스를 만든다. 런타임에는 이 인덱스만 사용하고 파일시스템을 다시 읽지 않는다.

```ts
interface ContentIndex {
  tracks: Track[];                        // order 오름차순 정렬 완료
  lessons: Lesson[];                      // track → order 오름차순 정렬 완료
  lessonById: Record<string, Lesson>;
  lessonsByTrack: Record<string, Lesson[]>;
  totalLessonCount: number;
}
```

**빌드 타임 검증 규칙** (위반 시 빌드 실패 — NFR-15)

| 규칙 | 실패 조건 |
|---|---|
| ID 유일성 | 중복 `id` 존재 |
| 트랙 참조 무결성 | 존재하지 않는 `track` 참조 |
| 선행 조건 무결성 | 존재하지 않는 `prereq` ID 참조 |
| 선행 조건 순환 | prereq 그래프에 사이클 존재 |
| order 유일성 | 같은 트랙 내 `order` 중복 |
| 필수 필드 | Zod 스키마 위반 |
| 출처 | `sources` 배열이 비어 있음 |

> 검증 순환 탐지는 DFS 색칠(white/gray/black)로 구현한다. prereq는 트랙 간 참조도 허용하므로 전체 그래프를 대상으로 한다.

---

## 4. 클라이언트 상태 모델

### 4.1 저장 스키마

```ts
const STORAGE_KEY = 'stepup.state.v1';

interface PersistedState {
  schemaVersion: 1;

  diagnostic: {
    completed: boolean;
    takenAt: string | null;        // YYYY-MM-DD
    startLevel: 1 | 2 | 3;
    trackOrder: string[];          // 개인화된 트랙 ID 순서
    answers: DiagnosticAnswers | null;
  };

  progress: {
    // 레슨 ID → 상태 기록
    [lessonId: string]: {
      // skipped-manual: 사용자가 직접 건너뜀 (AC-2.9)
      // skipped-auto:   진단 레벨 미달로 자동 건너뜀 (AC-1.10)
      status: 'completed' | 'skipped-manual' | 'skipped-auto';
      at: string;                  // YYYY-MM-DD
    };
  };

  streak: {
    current: number;
    longest: number;
    lastCompletedDate: string | null;   // YYYY-MM-DD
  };

  daily: {
    servedDate: string | null;     // YYYY-MM-DD
    servedLessonId: string | null;
  };

  settings: {
    pinnedTrack: string | null;
    hideBelowStartLevel: boolean;  // 기본 true (AC-1.10)
  };
}
```

**설계 결정 — 왜 `progress`가 배열이 아니라 맵인가**
완료 여부 조회가 렌더링마다 발생한다(트랙 목록, 진행률, 다음 레슨 탐색). 맵이면 O(1)이고, 레슨이 삭제되어도 고아 키가 계산에 참여하지 않아 안전하다(§8.3).

**설계 결정 — 왜 `skipped`를 완료와 분리하는가**
"건너뜀"을 완료로 기록하면 사용자가 나중에 그 레슨을 학습해야 할 때 찾을 수 없다. 진행률에서는 소진된 것으로 계산하되(AC-3.2), 상태는 구분해 유지한다(AC-2.9, AC-3.4). 또한 건너뜀을 `skipped-manual`(직접)과 `skipped-auto`(진단 레벨 자동)로 나눠 저장한다. 재응시로 레벨이 낮아지면 `skipped-auto`만 되돌리고 `skipped-manual`과 `completed`는 보존해야 하며(AC-1.9), 트랙이 전부 `skipped-auto`인 경우를 "이미 아는 트랙"으로 판정하기 위해서다(AC-1.11).

### 4.2 저장소 어댑터

```ts
interface StorageAdapter {
  read(): PersistedState | null;
  write(state: PersistedState): void;
  clear(): void;
  isPersistent: boolean;   // false면 인메모리 폴백 중
}
```

- `localStorage` 접근을 **항상 try/catch로 감싼다.** 사생활 보호 모드, 저장소 차단 설정, 용량 초과에서 접근 자체가 throw한다(AC-5.8).
- 접근 실패 시 인메모리 Map으로 폴백하고 `isPersistent = false`로 표시한다. UI는 이 값을 보고 안내 배너를 1회 노출한다.
- 쓰기는 상태 변경 시마다 즉시 수행한다(전체 상태가 수 KB 규모이므로 디바운스 불필요).
- 이 어댑터가 진도 데이터의 **유일한 출구**다. 네트워크 전송 경로를 두지 않으므로 진도는 브라우저를 벗어나지 않는다(NFR-12). P2에서 계정 동기화를 도입할 때도 이 어댑터를 교체하는 방식으로만 확장한다.

### 4.3 버전 마이그레이션

```ts
function loadState(raw: string | null): PersistedState {
  if (!raw) return createInitialState();
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return createInitialState(); }

  const version = (parsed as any)?.schemaVersion;

  if (version === CURRENT_VERSION) {
    const result = PersistedStateSchema.safeParse(parsed);
    return result.success ? result.data : createInitialState();
  }
  if (typeof version === 'number' && version < CURRENT_VERSION) {
    return runMigrations(parsed, version);      // 순차 마이그레이션
  }
  // 알 수 없는 상위 버전 — 파기하지 않고 안전 기본값 반환 (AC-5.10)
  return createInitialState();
}
```

> 상위 버전을 만나는 경우: 사용자가 새 배포를 본 뒤 캐시된 구버전 번들로 되돌아간 상황. 이때 데이터를 지우면 진도가 소실되므로, 읽지 못하더라도 **덮어쓰지 않고** 세션 한정 기본 상태로 동작시킨다.

### 4.4 하이드레이션 전략

정적 export이므로 서버는 진도를 모른다. 진도에 의존하는 UI를 서버 렌더 결과에 포함하면 하이드레이션 불일치가 발생한다.

**규칙**: 진도 의존 UI는 `mounted` 플래그가 true가 된 뒤에만 렌더한다.

```tsx
const { state, mounted } = useProgress();
if (!mounted) return <DailyCardSkeleton />;   // 서버·클라이언트 초기 렌더 일치
return <DailyCard lesson={selectDailyLesson(...)} />;
```

레슨 본문·트랙 소개처럼 진도와 무관한 콘텐츠는 서버 컴포넌트로 렌더해 SEO와 LCP를 확보한다(NFR-1).

---

## 5. 라우팅 및 화면 구조

| 경로 | 렌더링 | 화면 | 대응 요구사항 |
|---|---|---|---|
| `/` | 클라이언트 상태 의존 | 오늘의 레슨 홈. 진단 미완료 시 진단 시작 화면으로 대체 | AC-1.1, AC-2.1 |
| `/diagnostic` | 클라이언트 | 5문항 진단 (한 화면 한 문항) | AC-1.2~1.8 |
| `/diagnostic/result` | 클라이언트 | 진단 결과 요약 + 첫 강 CTA | AC-1.6 |
| `/tracks` | 정적 + 진도 오버레이 | 트랙 6개 목록, 진행률 | AC-3.1, AC-3.2 |
| `/tracks/[trackId]` | 정적 + 진도 오버레이 | 트랙 상세, 레슨 목록, 이어서 하기 | AC-3.3~3.7 |
| `/lessons/[lessonId]` | 정적 + 진도 오버레이 | 레슨 본문, 실습 미션, 완료 | AC-4.1~4.9 |
| `/settings` | 클라이언트 | 진단 재응시, 진도 초기화, 테마 | AC-1.9, AC-5.9 |

`/tracks/[trackId]`와 `/lessons/[lessonId]`는 `generateStaticParams`로 빌드 타임에 전부 생성한다.

### 5.1 홈 화면 상태 기계

```
                 ┌──────────────────┐
   진단 이력 없음 → │  DIAGNOSTIC_CTA  │ → /diagnostic
                 └──────────────────┘
                 ┌──────────────────┐
  오늘 미완료   → │   TODAY_PENDING  │  오늘의 레슨 카드 + 시작 CTA
                 └──────────────────┘
                 ┌──────────────────┐
  오늘 완료     → │   TODAY_DONE     │  축하 + 스트릭 + "한 강 더 하기"
                 └──────────────────┘
                 ┌──────────────────┐
  후보 없음     → │   ALL_CLEARED    │  완주 화면 + 건너뛴 레슨 복습 제안 (트랙별 "이미 아는 트랙"은 완주와 구분 표기 — §6.4)
                 └──────────────────┘
```

---

## 6. 도메인 로직

모든 함수는 `lib/domain/`에 위치하며 순수 함수다. 오늘 날짜는 항상 인자로 주입한다.

### 6.1 오늘의 레슨 선택 (AC-2.2, 2.3, 2.7, 2.8, 2.9)

```ts
type DailyResult =
  | { kind: 'lesson'; lesson: Lesson; isSticky: boolean }
  | { kind: 'all-cleared' };

// 트랙별 완주 종류 판정에 사용 (AC-1.11, AC-1.12)
type TrackCompletionKind =
  | 'completed'        // 직접 학습·건너뜀이 하나라도 있고 전부 소진
  | 'already-known'    // 전부 skipped-auto (진단 자동 건너뜀)
  | 'in-progress';

function selectDailyLesson(
  index: ContentIndex,
  state: PersistedState,
  today: string,               // YYYY-MM-DD, 로컬 타임존 기준
): DailyResult {
  // 1. 같은 날짜 내 고정 (AC-2.3)
  const { servedDate, servedLessonId } = state.daily;
  if (servedDate === today && servedLessonId) {
    const served = index.lessonById[servedLessonId];
    if (served && !isResolved(state, served.id)) {
      return { kind: 'lesson', lesson: served, isSticky: true };
    }
    // 이미 완료/건너뜀 → 아래 로직으로 다음 후보 계산 (한 강 더 하기)
  }

  // 2. 트랙 우선순위 결정
  const order = state.settings.pinnedTrack
    ? [state.settings.pinnedTrack,
       ...state.diagnostic.trackOrder.filter(t => t !== state.settings.pinnedTrack)]
    : state.diagnostic.trackOrder;

  // 3. 트랙 순회 → 트랙 내 order 오름차순 첫 후보
  for (const trackId of order) {
    const lessons = index.lessonsByTrack[trackId] ?? [];
    for (const lesson of lessons) {
      if (isResolved(state, lesson.id)) continue;                       // 완료/건너뜀
      if (isBelowStartLevel(lesson, state)) continue;                   // AC-1.10
      if (!arePrereqsSatisfied(lesson, state)) continue;                // AC-2.7
      return { kind: 'lesson', lesson, isSticky: false };
    }
  }

  // 4. 레벨 필터 때문에 후보가 없을 수 있으므로 필터를 풀고 재시도
  const relaxed = findFirstUnresolved(index, state, order, { ignoreLevel: true });
  if (relaxed) return { kind: 'lesson', lesson: relaxed, isSticky: false };

  return { kind: 'all-cleared' };                                       // AC-2.8
}

const isResolved = (s: PersistedState, id: string) => Boolean(s.progress[id]);

const isBelowStartLevel = (l: Lesson, s: PersistedState) =>
  s.settings.hideBelowStartLevel && l.level < s.diagnostic.startLevel;

const arePrereqsSatisfied = (l: Lesson, s: PersistedState) =>
  l.prereq.every(id => s.progress[id]?.status === 'completed');

// 트랙 완주 종류 판정 (AC-1.11): 존재하는 레슨 기준으로만 계산
function trackCompletionKind(
  index: ContentIndex, s: PersistedState, trackId: string,
): TrackCompletionKind {
  const lessons = index.lessonsByTrack[trackId] ?? [];
  if (lessons.length === 0) return 'in-progress';
  if (lessons.some(l => !isResolved(s, l.id))) return 'in-progress';
  // 전부 소진됨 — 종류 구분
  const allAuto = lessons.every(l => s.progress[l.id]?.status === 'skipped-auto');
  return allAuto ? 'already-known' : 'completed';
}
```

**설계 노트 — 4단계 폴백이 필요한 이유**
진단 레벨이 3인 사용자에게는 레벨 1~2 레슨이 전부 필터링된다. 레벨 3 레슨을 모두 마치면 후보가 0이 되는데, 이때 곧바로 "완주"를 띄우면 아직 안 배운 레슨이 남아 있는데도 학습이 끝난 것처럼 보인다. 레벨 필터를 풀고 한 번 더 탐색해 남은 레슨을 제시한다.

**설계 노트 — prereq는 `completed`만 인정한다**
건너뛴 선행 레슨은 선행 조건을 충족하지 못한다. 건너뛰기가 커리큘럼 의존성을 무력화하면 후속 레슨이 이해 불가능해지기 때문이다.

### 6.2 진단 채점 (AC-1.3, 1.4, 1.5)

**문항 구성**

| # | 질문 | 선택지 | 용도 |
|---|---|---|---|
| Q1 | Claude로 주로 어떤 일을 하시나요? | 글쓰기·자료조사 / 문서·데이터 작업 / 코딩 / 업무 자동화 | 우선 트랙 결정 |
| Q2 | Artifact를 만들어본 적 있나요? | 만들어봤다 / 들어는 봤다 / 모른다 | 레벨 + `artifact` 트랙 순위 |
| Q3 | Skill을 만들거나 설치해본 적 있나요? | 동일 | 레벨 + `skill` 트랙 순위 |
| Q4 | Cowork나 Claude Code로 내 파일을 다뤄본 적 있나요? | 동일 | 레벨 + `cowork`/`claude-code` 순위 |
| Q5 | MCP·커넥터로 외부 서비스를 연결해본 적 있나요? | 동일 | 레벨 + `mcp` 트랙 순위 |

```ts
const EXPERIENCE_SCORE = { built: 2, heard: 1, unknown: 0 } as const;

const Q1_PRIORITY: Record<Q1Answer, string[]> = {
  writing:    ['basics', 'artifact', 'skill', 'cowork', 'mcp', 'claude-code'],
  documents:  ['basics', 'cowork', 'artifact', 'skill', 'mcp', 'claude-code'],
  coding:     ['basics', 'claude-code', 'skill', 'artifact', 'mcp', 'cowork'],
  automation: ['basics', 'cowork', 'skill', 'mcp', 'artifact', 'claude-code'],
};

function scoreDiagnostic(answers: DiagnosticAnswers): DiagnosticResult {
  const total = [answers.q2, answers.q3, answers.q4, answers.q5]
    .reduce((sum, a) => sum + EXPERIENCE_SCORE[a], 0);       // 0~8

  const startLevel = total <= 2 ? 1 : total <= 5 ? 2 : 3;

  // Q1이 정한 기본 순서에서, 이미 '만들어봤다'인 영역을 뒤로 민다
  const base = Q1_PRIORITY[answers.q1];
  const mastered = new Set<string>();
  if (answers.q2 === 'built') mastered.add('artifact');
  if (answers.q3 === 'built') mastered.add('skill');
  if (answers.q4 === 'built') { mastered.add('cowork'); mastered.add('claude-code'); }
  if (answers.q5 === 'built') mastered.add('mcp');

  const trackOrder = [
    ...base.filter(t => !mastered.has(t)),
    ...base.filter(t =>  mastered.has(t)),
  ];

  return { startLevel, trackOrder };
}
```

> `basics`는 어떤 경로에서도 첫 트랙으로 유지한다. 레벨 3 사용자에게는 `hideBelowStartLevel`이 basics의 레벨 1 레슨 대부분을 자동으로 걸러내므로, 순서를 유지해도 실제로 보이는 강의는 적다.

**결과 화면 요구사항**: 산출된 시작 레벨과 첫 트랙을 보여주고, 사용자가 즉시 조정(레벨 낮추기 / 다른 트랙 우선)할 수 있게 한다. 진단은 추정이고, 추정을 사용자가 뒤집을 수 있어야 한다(§7.3 리스크 대응).

### 6.3 스트릭 계산 (AC-5.2 ~ AC-5.5, AC-5.11)

스트릭은 **저장값**과 **표시값**을 분리한다. 이것이 이 로직의 핵심이다.

```ts
// 저장 — 레슨 완료 시에만 호출
function applyCompletion(streak: Streak, today: string): Streak {
  if (streak.lastCompletedDate === today) return streak;          // AC-5.5 같은 날 중복
  const next = streak.lastCompletedDate === previousDay(today)
    ? streak.current + 1                                          // AC-5.3 연속
    : 1;                                                          // AC-5.4 끊김
  return {
    current: next,
    longest: Math.max(streak.longest, next),
    lastCompletedDate: today,
  };
}

// 표시 — 렌더링 시 호출, 저장값을 변경하지 않는다
function displayStreak(streak: Streak, today: string): number {
  if (streak.lastCompletedDate === today) return streak.current;
  if (streak.lastCompletedDate === previousDay(today)) return streak.current; // 오늘 아직 가능
  return 0;                                                        // 이미 끊김
}

// 완료 취소 시 스트릭 되돌리기 (AC-5.13, AC-5.14)
// completedTodayCount: 취소 대상을 제외한 "오늘 완료로 남는 레슨 수"
function revertCompletion(
  streak: Streak, today: string, completedTodayCountAfter: number,
): Streak {
  // 오늘의 완료가 아직 남아 있으면 스트릭 불변 (AC-5.14)
  if (streak.lastCompletedDate !== today || completedTodayCountAfter > 0) {
    return streak;
  }
  // 오늘의 유일한 완료를 취소 — 오늘 반영분을 되돌린다 (AC-5.13)
  // 증가(+1)였든 재설정(=1)이었든, "오늘 이전" 상태로 복원한다.
  const prev = previousDay(today);
  const restoredCurrent = Math.max(0, streak.current - 1);
  return {
    current: restoredCurrent,
    longest: streak.longest,             // 최장 기록은 낮추지 않는다
    lastCompletedDate: restoredCurrent > 0 ? prev : null,
  };
}
```

> `revertCompletion`은 "오늘 이전"의 정확한 스트릭을 복원하지 못하는 한계가 있다(예: 재설정으로 1이 된 경우 이전 값은 알 수 없음). 저장 모델에 직전 스냅샷을 두면 완벽히 복원할 수 있으나, P0에서는 단순성을 택해 `current - 1`과 `lastCompletedDate = 어제`로 근사한다. 완료 취소는 드문 조작이고 최장 기록은 보존되므로 사용자 체감 손실이 작다.

**왜 분리하는가**
사용자가 3일 쉬고 돌아왔을 때, 저장된 `current`는 여전히 과거 값이다. 이걸 그대로 보여주면 거짓말이고, 읽기 시점에 저장값을 0으로 덮어쓰면 순수 렌더링이 부수효과를 갖는다. 표시 함수가 판정만 하고 저장은 다음 완료 시점에 `applyCompletion`이 1로 재설정한다.

**날짜 처리**

```ts
// 사용자 로컬 타임존 기준 YYYY-MM-DD (AC-5.11)
const localDateKey = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// 문자열 날짜 산술 — UTC 기준으로 계산해 DST 영향을 제거
function previousDay(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) - 86_400_000;
  const dt = new Date(t);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}
```

> 날짜 키 생성은 로컬 타임존, 날짜 산술은 UTC. 로컬 `Date` 산술로 하루를 빼면 서머타임 전환일에 23시간/25시간이 되어 날짜가 어긋난다. 한국은 DST가 없지만 사용자가 해외에 있을 수 있고, 이 버그는 재현이 어렵다.

### 6.4 진행률 집계 (AC-3.2, AC-5.6)

```ts
interface TrackProgress {
  total: number;
  completed: number;
  skipped: number;
  resolved: number;      // completed + skipped
  percent: number;       // resolved / total
}
```

진행률은 `resolved / total`이다. 건너뛴 레슨을 미완료로 계산하면 100%에 영원히 도달하지 못해 완주 경험이 사라진다. 대신 트랙 상세에서 건너뛴 개수를 별도로 표기해 사용자가 되돌아갈 수 있게 한다. UI는 완료 수와 건너뜀 수를 구분해 함께 노출한다(AC-5.12).

**완주율 지표와 "이미 아는 트랙" (AC-1.11, AC-1.12)**
트랙 완주율(§1.4)은 `trackCompletionKind`가 `completed`인 트랙만 분자로 센다. `already-known`(전부 `skipped-auto`)은 사용자가 실제로 학습을 완료한 것이 아니므로 완주율에서 제외하고, UI에서도 "완주"가 아닌 "이미 아는 트랙" 배지로 표기한다. 사용자가 해당 트랙의 개별 레슨을 열어 학습하면 그 레슨은 `completed`로 전환되고, 트랙 종류는 자연히 `completed`로 바뀐다.

`hideBelowStartLevel`이 걸러낸 레슨은 **분모에 포함한다.** 진단 레벨은 추정일 뿐이므로 분모에서 빼면 사용자가 실제로 본 적 없는 콘텐츠가 통계에서 사라진다.

---

## 7. 컴포넌트 구조

```
app/
├── layout.tsx                    # 테마 토큰, 폰트, 헤더/푸터
├── page.tsx                      # 홈 — 상태 기계 분기
├── diagnostic/
│   ├── page.tsx                  # 문항 스텝퍼
│   └── result/page.tsx
├── tracks/
│   ├── page.tsx
│   └── [trackId]/page.tsx
├── lessons/[lessonId]/page.tsx
└── settings/page.tsx

components/
├── daily/
│   ├── DailyCard.tsx             # 오늘의 레슨 카드
│   ├── DailyDoneState.tsx        # 완료 축하 + 한 강 더 하기
│   ├── AllClearedState.tsx
│   └── DailyCardSkeleton.tsx     # 하이드레이션 전 플레이스홀더
├── diagnostic/
│   ├── QuestionStepper.tsx
│   ├── QuestionCard.tsx
│   └── ResultSummary.tsx
├── track/
│   ├── TrackCard.tsx
│   ├── TrackProgressBar.tsx
│   └── LessonListItem.tsx        # 완료/건너뜀/잠금 상태 표현
├── lesson/
│   ├── LessonHeader.tsx          # 트랙, 레벨, 소요시간, 사전 요구사항
│   ├── MissionBlock.tsx          # 목표 · 프롬프트 · 성공 기준
│   ├── CopyPromptButton.tsx      # 클립보드 + 폴백
│   ├── SourceList.tsx            # 출처 + verifiedAt
│   └── CompleteButton.tsx
└── shared/
    ├── StreakBadge.tsx
    ├── StorageWarningBanner.tsx
    └── ThemeToggle.tsx

lib/
├── content/  (index.ts, parse.ts, schema.ts, validate.ts)
├── domain/   (daily.ts, diagnostic.ts, streak.ts, progress.ts, date.ts)
├── storage/  (adapter.ts, migrations.ts)
└── state/    (ProgressProvider.tsx, useProgress.ts)
```

### 7.1 상태 제공자 인터페이스

```ts
interface ProgressContextValue {
  mounted: boolean;                 // 하이드레이션 가드
  state: PersistedState;
  isPersistent: boolean;            // false → 경고 배너

  completeLesson(lessonId: string): void;
  uncompleteLesson(lessonId: string): void;   // AC-5.7
  skipLesson(lessonId: string): void;         // AC-2.9
  pinTrack(trackId: string | null): void;     // AC-3.5
  saveDiagnostic(result: DiagnosticResult, answers: DiagnosticAnswers): void;
  resetAll(): void;                           // AC-5.9
}
```

`completeLesson`은 하나의 리듀서 액션에서 `progress` 기록과 `streak` 갱신을 원자적으로 처리한다. 두 개의 액션으로 나누면 중간 렌더에서 불일치가 보인다.

**`uncompleteLesson` (AC-5.7, AC-5.13, AC-5.14)**
완료 기록을 제거한 뒤, 취소 후 "오늘 완료로 남는 레슨 수"를 세어 `revertCompletion`에 전달한다. 오늘 다른 완료가 남아 있으면 스트릭은 불변이고(AC-5.14), 오늘의 유일한 완료였다면 오늘 반영분을 되돌린다(AC-5.13). `progress` 제거와 `streak` 갱신도 단일 액션에서 원자적으로 처리한다.

**`saveDiagnostic` — 자동 건너뜀 재계산 (AC-1.9, AC-1.10)**
진단(최초·재응시) 완료 시 다음을 순서대로 수행한다.
1. 새 `startLevel`·`trackOrder`를 저장한다.
2. 기존 `progress`에서 `status === 'skipped-auto'`인 항목을 모두 제거한다. (이전 진단이 자동으로 넘긴 것이므로 새 진단 기준으로 다시 판정)
3. `hideBelowStartLevel`이 true이면, 존재하는 레슨 중 `level < startLevel`이면서 아직 기록이 없는 레슨을 `skipped-auto`로 표시한다.
4. `completed`와 `skipped-manual` 기록은 절대 건드리지 않는다(AC-1.9 "기존 완료 기록 보존").

이 절차 덕분에 레벨을 3→1로 낮추는 재응시에서 이전에 자동으로 가려졌던 레슨이 다시 학습 대상으로 돌아오고, 사용자가 직접 완료·건너뛴 기록은 그대로 유지된다.

---

## 8. 엣지 케이스 및 실패 처리

### 8.1 저장소 사용 불가 (AC-5.8)

인메모리 폴백으로 세션 내 동작은 정상 유지. `StorageWarningBanner`를 1회 노출하고 dismiss 상태는 sessionStorage에 저장(그것마저 실패하면 컴포넌트 상태로).

### 8.2 콘텐츠 변경에 대한 내성

| 변경 | 영향 | 대응 |
|---|---|---|
| 레슨 추가 (중간 삽입) | 진행률 분모 증가 | `order` 100 단위 간격으로 사이에 삽입(NFR-16). 완료 기록은 ID 기반이라 무영향 |
| 레슨 삭제 | `progress`에 고아 키 발생 | 계산 시 `lessonById` 존재 여부로 필터링, 삭제하지 않고 무시(§8.3) |
| 레슨 ID 변경 | 완료 기록 유실 | **금지**(NFR-17). 린트 규칙 또는 발행 ID 목록 파일로 방어 |
| 트랙 추가 | `trackOrder`에 없는 트랙 발생 | 저장된 순서 뒤에 미등록 트랙을 append하여 순회 |
| 트랙 삭제 | `trackOrder`에 고아 ID | 순회 시 `lessonsByTrack` 없으면 skip |

### 8.3 고아 진도 기록을 지우지 않는 이유

레슨이 일시적으로 비공개 처리되었다가 복구될 수 있다. 고아 키를 즉시 삭제하면 복구 시 사용자가 완료했던 레슨을 다시 학습해야 한다. 읽기 시점 필터링은 비용이 무시할 만하다.

### 8.4 기타

| 상황 | 처리 |
|---|---|
| 진단 중 이탈 | 답변을 세션 상태로만 유지. 미완료 진단은 저장하지 않음 |
| 존재하지 않는 레슨 URL 직접 접근 | 정적 404 페이지 + 트랙 목록 링크 |
| 클립보드 API 차단 (AC-4.4) | `navigator.clipboard` 실패 시 `<pre>` 전문 노출 + 전체 선택 |
| 시스템 시계 변경으로 과거 날짜 | `lastCompletedDate`가 미래이면 스트릭을 1로 재설정 |
| 자정 넘김 (탭을 계속 열어둠) | 완료 액션 시점에 날짜를 재계산. 마운트 시점 날짜를 캐시하지 않음 |

---

## 9. 스타일 및 테마

### 9.1 토큰 구조

```css
:root {
  --bg: #fbfaf8;  --surface: #ffffff;  --border: #e8e4dd;
  --text: #1f1d1a; --text-muted: #6b665e;
  --accent: #c2603a;               /* 브랜드 강조 */
  --success: #3f7a52;

  --track-basics: #6b7f9e;  --track-artifact: #a0603f;
  --track-skill: #7a6394;   --track-cowork: #3f7a6b;
  --track-claude-code: #5c6470; --track-mcp: #96693a;
}
:root[data-theme='dark'], /* 명시 선택 */
:root:not([data-theme='light']) { /* 시스템 다크일 때만 media query 안에서 */ }
```

라이트 팔레트를 `:root`에 완전히 정의하고, 다크는 토큰만 재정의한다. 색상의 유일한 정의가 미디어 쿼리 안에 있으면 안 된다(NFR-10).

### 9.2 접근성 규칙 (NFR-4 ~ NFR-7)

- 진행률 바에 `role="progressbar"` + `aria-valuenow` + 텍스트 "6/10강 (60%)"
- 완료 버튼 상태 변화를 `aria-live="polite"` 리전으로 알림
- 트랙 색상은 장식용. 상태(완료/건너뜀/잠금)는 아이콘 + 텍스트 레이블로 전달
- 진단 스텝퍼는 `aria-current="step"`, 라디오 그룹은 `role="radiogroup"`
- 포커스 링을 제거하지 않으며 `:focus-visible`로 명시 스타일 지정

---

## 10. 테스트 전략

### 10.1 단위 테스트 (Vitest) — 필수 커버리지

도메인 순수 함수는 **커버리지 100%를 요구한다.** 여기가 버그가 나면 사용자가 알아채기 어렵고 신뢰를 잃는다.

| 대상 | 케이스 |
|---|---|
| `selectDailyLesson` | 하루 내 고정 / 날짜 변경 시 갱신 / prereq 미충족 스킵 / 레벨 필터 / 폴백 재탐색 / 전부 완료 / pinnedTrack 우선 / 고아 servedLessonId |
| `scoreDiagnostic` | 총점 경계값(2/3, 5/6) / Q1별 트랙 순서 / mastered 후순위 이동 / 6개 트랙 누락·중복 없음 |
| `applyCompletion` | 연속 / 하루 건너뜀 / 같은 날 중복 / 최장 갱신 / 미래 날짜 |
| `displayStreak` | 오늘 / 어제 / 이틀 전 / 기록 없음 |
| `previousDay` | 월말·연말 경계 / 윤년 / DST 전환일 |
| `loadState` | 정상 / 손상 JSON / 하위 버전 / 상위 버전 / 스키마 위반 |
| `computeTrackProgress` | 건너뜀 포함 / 고아 키 / 빈 트랙 |

### 10.2 E2E 테스트 (Playwright)

1. 첫 방문 → 진단 5문항 → 결과 → 첫 레슨 → 완료 → 홈에 스트릭 1 표시
2. 같은 날 재방문 시 오늘의 레슨이 동일한지 확인 (AC-2.3)
3. 진단 건너뛰기 → 기본 경로 동작
4. 트랙 우선 지정 → 다음 오늘의 레슨이 해당 트랙에서 선택
5. 진도 초기화 → 초기 상태 복귀
6. localStorage 차단 컨텍스트 → 경고 배너 노출 + 기능 동작

### 10.3 콘텐츠 검증 (CI)

빌드 전 `pnpm validate:content` 실행. §3.4 규칙 위반 시 CI 실패. `verifiedAt` 90일 초과 레슨의 경고 리포트와 정기 재검증은 P1 운영 항목이다(CR-3, requirements §2.2). P0에서는 `verifiedAt` 필드의 존재·형식 검증까지만 빌드에 포함한다.

---

## 11. 성능 설계 (NFR-1 ~ NFR-3)

- **정적 프리렌더링**: 모든 레슨/트랙 페이지를 빌드 타임 생성. 홈만 클라이언트 상태에 의존
- **클라이언트 라우팅**: 내부 이동은 전부 `next/link`. 뷰포트에 들어온 링크를 프리페치해 300ms 이내 반응 확보(NFR-2)
- **콘텐츠 인덱스 분할**: 전체 인덱스에는 메타데이터만(본문 제외). 45강 × 약 200바이트 ≈ 9KB. 본문은 각 레슨 페이지에 인라인
- **클라이언트 컴포넌트 최소화**: 진도 의존 컴포넌트만 `'use client'`. 레슨 본문은 서버 컴포넌트
- **폰트**: `next/font`로 자체 호스팅, `font-display: swap`
- **이미지**: 스크린샷은 WebP + 명시적 width/height로 CLS 방지

---

## 12. 배포 및 운영

| 항목 | 설계 |
|---|---|
| 배포 | Git push → CI(타입체크·단위테스트·콘텐츠검증·빌드) → 정적 호스팅 |
| 콘텐츠 발행 | MDX 추가 → PR → CI 통과 → 머지 → 자동 배포 |
| 재검증 루틴 | (P1 운영 항목 — requirements §2.2) 주간 CI 잡이 `verifiedAt` 90일 초과 레슨 목록을 이슈로 생성 |
| 롤백 | 호스팅 플랫폼의 이전 배포로 즉시 복구 |

---

## 13. P1 확장을 위한 사전 설계

P0에서 만들지 않지만, 나중에 구조를 갈아엎지 않도록 다음을 미리 준비한다.

| P1 기능 | P0에서 준비하는 것 |
|---|---|
| 검색 · 용어 사전 | `tags` 필드를 콘텐츠 작성 시점부터 채움. 인덱스에 tag → lesson 역인덱스 생성 여지 확보 |
| 프롬프트 레시피 | `mission`이 이미 goal/prompt/success로 구조화되어 있어, 레슨에서 미션만 추출하면 레시피 컬렉션이 됨 |
| 최신성 경고 배너 | `verifiedAt`을 P0에서 표시까지 함. 배너는 임계값 비교만 추가 |
| 북마크 | `PersistedState`에 `bookmarks: string[]` 추가 + schemaVersion 2 마이그레이션 |
| 계정 동기화 (P2) | `PersistedState` 전체가 직렬화 가능한 단일 객체. 서버 도입 시 이 객체를 그대로 업로드/머지 |

---

## 14. 미해결 사항

| # | 항목 | 결정 필요 시점 |
|---|---|---|
| D-1 | 초기 출시를 6개 트랙 전부로 할지, Basics + Cowork 2개 트랙(16강)으로 선출시할지 | 콘텐츠 작성 착수 전 |
| D-2 | 분석 도구 도입 여부 및 선택 (쿠키리스 조건) | 출시 직전 |
| D-3 | 도메인 및 서비스명 확정 | 출시 직전 |
| D-4 | 레슨 본문에 스크린샷을 포함할지 (제작·유지 비용 vs 이해도) | 첫 레슨 작성 시 |
