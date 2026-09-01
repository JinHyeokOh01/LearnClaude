import type { ContentIndex } from "../content/index";
import type { PersistedState, DiagnosticResult, DiagnosticAnswers } from "../domain/types";
import { applyCompletion, revertCompletion } from "../domain/streak";
import { recomputeAutoSkips } from "../domain/autoskip";

/**
 * 진도 상태 리듀서 (design §7.1)
 * 각 액션은 progress/streak 등을 원자적으로 갱신하는 순수 함수다.
 * today와 index는 부수효과 없는 입력으로 주입한다.
 */

export type ProgressAction =
  | { type: "complete"; lessonId: string; today: string }
  | { type: "uncomplete"; lessonId: string; today: string }
  | { type: "skip"; lessonId: string; today: string }
  | { type: "pinTrack"; trackId: string | null }
  | { type: "setDaily"; date: string; lessonId: string }
  | { type: "setHideBelowStartLevel"; value: boolean }
  | {
      type: "saveDiagnostic";
      result: DiagnosticResult;
      answers: DiagnosticAnswers | null;
      index: ContentIndex;
      today: string;
    }
  | { type: "reset" };

/** 오늘 완료된 레슨 수 (특정 레슨 제외 옵션) */
function countCompletedToday(state: PersistedState, today: string, exceptId?: string): number {
  let n = 0;
  for (const [id, entry] of Object.entries(state.progress)) {
    if (id === exceptId) continue;
    if (entry.status === "completed" && entry.at === today) n++;
  }
  return n;
}

export function progressReducer(
  state: PersistedState,
  action: ProgressAction,
  createInitial: () => PersistedState,
): PersistedState {
  switch (action.type) {
    case "complete": {
      const progress = {
        ...state.progress,
        [action.lessonId]: { status: "completed" as const, at: action.today },
      };
      const streak = applyCompletion(state.streak, action.today);
      return { ...state, progress, streak };
    }

    case "uncomplete": {
      const progress = { ...state.progress };
      delete progress[action.lessonId];
      // 취소 후 오늘 남는 완료 수로 스트릭 롤백 판정 (AC-5.13, 5.14)
      const remaining = countCompletedToday(state, action.today, action.lessonId);
      const streak = revertCompletion(state.streak, action.today, remaining);
      return { ...state, progress, streak };
    }

    case "skip": {
      const progress = {
        ...state.progress,
        [action.lessonId]: { status: "skipped-manual" as const, at: action.today },
      };
      return { ...state, progress };
    }

    case "pinTrack":
      return { ...state, settings: { ...state.settings, pinnedTrack: action.trackId } };

    case "setDaily":
      // 이미 같은 값이면 변경 없이 그대로 반환(불필요한 저장/렌더 방지)
      if (state.daily.servedDate === action.date && state.daily.servedLessonId === action.lessonId) {
        return state;
      }
      return { ...state, daily: { servedDate: action.date, servedLessonId: action.lessonId } };

    case "saveDiagnostic": {
      const progress = recomputeAutoSkips(
        action.index,
        state.progress,
        action.result,
        state.settings.hideBelowStartLevel,
        action.today,
      );
      return {
        ...state,
        diagnostic: {
          completed: true,
          takenAt: action.today,
          startLevel: action.result.startLevel,
          trackOrder: action.result.trackOrder,
          answers: action.answers,
        },
        progress,
      };
    }

    case "setHideBelowStartLevel":
      return {
        ...state,
        settings: { ...state.settings, hideBelowStartLevel: action.value },
      };

    case "reset":
      return createInitial();
  }
}

/**
 * 고아 진도 키 필터링 (design §8.3 / T-34)
 * 존재하지 않는 레슨의 진도 기록을 읽기 시점에 걸러낸다(삭제하지 않음).
 */
export function withoutOrphanProgress(
  state: PersistedState,
  index: ContentIndex,
): PersistedState {
  const filtered: PersistedState["progress"] = {};
  for (const [id, entry] of Object.entries(state.progress)) {
    if (index.lessonById[id]) filtered[id] = entry;
  }
  return { ...state, progress: filtered };
}
