import type { Lesson } from "../content/schema";
import type { PersistedState } from "./types";

/**
 * 진행률 집계 (design §6.4 / AC-3.2, AC-5.6, AC-5.12)
 * 진행률 = (완료 + 건너뜀) / 전체. 건너뜀은 두 종류 모두 소진으로 계산.
 */

export interface TrackProgress {
  total: number;
  completed: number;
  skipped: number; // manual + auto
  resolved: number; // completed + skipped
  percent: number; // 0~100
}

export function computeTrackProgress(lessons: Lesson[], state: PersistedState): TrackProgress {
  let completed = 0;
  let skipped = 0;
  for (const l of lessons) {
    const entry = state.progress[l.id];
    if (!entry) continue;
    if (entry.status === "completed") completed++;
    else skipped++; // skipped-manual | skipped-auto
  }
  const total = lessons.length;
  const resolved = completed + skipped;
  const percent = total === 0 ? 0 : Math.round((resolved / total) * 100);
  return { total, completed, skipped, resolved, percent };
}

/** 전체 진행률. 고아 진도 키(존재하지 않는 레슨)는 계산에서 제외된다. */
export function computeOverallProgress(
  allLessons: Lesson[],
  state: PersistedState,
): TrackProgress {
  return computeTrackProgress(allLessons, state);
}

/**
 * 트랙 완주 종류 판정 (design §6.1 / AC-1.11, AC-1.12)
 * - completed: 전부 소진 & 최소 하나는 직접 학습/건너뜀
 * - already-known: 전부 skipped-auto (진단 자동 건너뜀)
 * - in-progress: 미해결 레슨이 하나라도 있음
 */
export type TrackCompletionKind = "completed" | "already-known" | "in-progress";

export function trackCompletionKind(
  lessons: Lesson[],
  state: PersistedState,
): TrackCompletionKind {
  if (lessons.length === 0) return "in-progress";
  if (lessons.some((l) => !state.progress[l.id])) return "in-progress";
  const allAuto = lessons.every((l) => state.progress[l.id]?.status === "skipped-auto");
  return allAuto ? "already-known" : "completed";
}
