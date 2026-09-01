import type { Streak } from "./types";
import { previousDay } from "./date";

/**
 * 스트릭 계산 (design §6.3 / AC-5.2~5.5, 5.13, 5.14)
 * 저장값(applyCompletion/revertCompletion)과 표시값(displayStreak)을 분리한다.
 */

/** 레슨 완료 시 스트릭 갱신 */
export function applyCompletion(streak: Streak, today: string): Streak {
  if (streak.lastCompletedDate === today) return streak; // AC-5.5 같은 날 중복
  const next = streak.lastCompletedDate === previousDay(today) ? streak.current + 1 : 1; // AC-5.3 / AC-5.4
  return {
    current: next,
    longest: Math.max(streak.longest, next),
    lastCompletedDate: today,
  };
}

/** 렌더링 시 표시할 스트릭. 저장값을 변경하지 않는다. */
export function displayStreak(streak: Streak, today: string): number {
  if (streak.lastCompletedDate === today) return streak.current;
  if (streak.lastCompletedDate === previousDay(today)) return streak.current; // 오늘 아직 가능
  return 0; // 이미 끊김
}

/**
 * 완료 취소 시 스트릭 롤백 (AC-5.13, AC-5.14)
 * completedTodayCountAfter: 취소 대상을 제외한 "오늘 완료로 남는 레슨 수"
 */
export function revertCompletion(
  streak: Streak,
  today: string,
  completedTodayCountAfter: number,
): Streak {
  // 오늘의 완료가 아직 남아 있으면 스트릭 불변 (AC-5.14)
  if (streak.lastCompletedDate !== today || completedTodayCountAfter > 0) {
    return streak;
  }
  // 오늘의 유일한 완료를 취소 — 오늘 반영분을 되돌린다 (AC-5.13)
  const restoredCurrent = Math.max(0, streak.current - 1);
  return {
    current: restoredCurrent,
    longest: streak.longest, // 최장 기록은 낮추지 않는다
    lastCompletedDate: restoredCurrent > 0 ? previousDay(today) : null,
  };
}
