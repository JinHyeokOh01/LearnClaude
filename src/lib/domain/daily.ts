import type { ContentIndex } from "../content/index";
import type { Lesson } from "../content/schema";
import type { PersistedState } from "./types";

/**
 * 오늘의 레슨 선택 및 헬퍼 (design §6.1 / AC-2.2, 2.3, 2.7, 2.8, 1.10, 3.5)
 * 모든 함수는 순수 함수. 오늘 날짜는 인자로 주입한다.
 */

export const isResolved = (s: PersistedState, id: string): boolean => Boolean(s.progress[id]);

export const isBelowStartLevel = (l: Lesson, s: PersistedState): boolean =>
  s.settings.hideBelowStartLevel && l.level < s.diagnostic.startLevel;

/** prereq는 completed만 인정 (skipped-manual/auto는 불충족) */
export const arePrereqsSatisfied = (l: Lesson, s: PersistedState): boolean =>
  l.prereq.every((id) => s.progress[id]?.status === "completed");

/** 트랙 순회 순서: pinnedTrack 우선 → 저장된 trackOrder → 미등록 신규 트랙 append (AC-3.5) */
export function resolveTrackOrder(index: ContentIndex, state: PersistedState): string[] {
  const base = state.settings.pinnedTrack
    ? [
        state.settings.pinnedTrack,
        ...state.diagnostic.trackOrder.filter((t) => t !== state.settings.pinnedTrack),
      ]
    : [...state.diagnostic.trackOrder];

  // 저장된 순서에 없는 신규 트랙을 뒤에 붙인다
  const known = new Set(base);
  for (const t of index.tracks) {
    if (!known.has(t.id)) base.push(t.id);
  }
  return base;
}

export type DailyResult =
  | { kind: "lesson"; lesson: Lesson; isSticky: boolean }
  | { kind: "all-cleared" };

export function selectDailyLesson(
  index: ContentIndex,
  state: PersistedState,
  today: string,
): DailyResult {
  // 1. 같은 날짜 내 고정 (AC-2.3)
  const { servedDate, servedLessonId } = state.daily;
  if (servedDate === today && servedLessonId) {
    const served = index.lessonById[servedLessonId];
    if (served && !isResolved(state, served.id)) {
      return { kind: "lesson", lesson: served, isSticky: true };
    }
    // 이미 완료/건너뜀 → 아래 로직으로 다음 후보 계산 (한 강 더 하기)
  }

  const order = resolveTrackOrder(index, state);

  // 2. 트랙 순회 → 트랙 내 order 오름차순 첫 후보 (레벨/선행 필터 적용)
  const strict = findFirstCandidate(index, state, order, false);
  if (strict) return { kind: "lesson", lesson: strict, isSticky: false };

  // 3. 레벨 필터를 풀고 재시도 (AC-1.10 폴백)
  const relaxed = findFirstCandidate(index, state, order, true);
  if (relaxed) return { kind: "lesson", lesson: relaxed, isSticky: false };

  // 4. 후보 없음 (AC-2.8)
  return { kind: "all-cleared" };
}

function findFirstCandidate(
  index: ContentIndex,
  state: PersistedState,
  order: string[],
  ignoreLevel: boolean,
): Lesson | null {
  for (const trackId of order) {
    const lessons = index.lessonsByTrack[trackId] ?? [];
    for (const lesson of lessons) {
      if (isResolved(state, lesson.id)) continue;
      if (!ignoreLevel && isBelowStartLevel(lesson, state)) continue;
      if (!arePrereqsSatisfied(lesson, state)) continue; // AC-2.7
      return lesson;
    }
  }
  return null;
}
