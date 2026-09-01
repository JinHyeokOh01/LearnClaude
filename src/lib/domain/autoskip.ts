import type { ContentIndex } from "../content/index";
import type { DiagnosticResult, ProgressEntry } from "./types";

/**
 * 진단 저장 시 자동 건너뜀 재계산 (design §7.1 / AC-1.9, AC-1.10)
 * 1. 기존 skipped-auto 제거 (이전 진단 기준이므로 새로 판정)
 * 2. hideBelowStartLevel이면 level < startLevel & 기록 없는 레슨을 skipped-auto로 표시
 * 3. completed / skipped-manual 기록은 절대 변경하지 않음
 *
 * 순수 함수: 새 progress 맵을 반환한다.
 */
export function recomputeAutoSkips(
  index: ContentIndex,
  progress: Record<string, ProgressEntry>,
  result: DiagnosticResult,
  hideBelowStartLevel: boolean,
  today: string,
): Record<string, ProgressEntry> {
  const next: Record<string, ProgressEntry> = {};

  // 1. skipped-auto를 제외하고 나머지(completed / skipped-manual)는 보존
  for (const [id, entry] of Object.entries(progress)) {
    if (entry.status === "skipped-auto") continue;
    next[id] = entry;
  }

  // 2. 레벨 미달 & 미기록 레슨을 skipped-auto로 표시
  if (hideBelowStartLevel) {
    for (const lesson of index.lessons) {
      if (lesson.level < result.startLevel && !next[lesson.id]) {
        next[lesson.id] = { status: "skipped-auto", at: today };
      }
    }
  }

  return next;
}
