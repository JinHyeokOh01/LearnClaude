import { describe, it, expect } from "vitest";
import { progressReducer, withoutOrphanProgress } from "./reducer";
import { createInitialState } from "../storage/state-schema";
import { makeLesson, makeTrack, makeIndex, makeState } from "../domain/_fixtures";

const index = makeIndex(
  [makeTrack({ id: "basics", order: 100 })],
  [
    makeLesson({ id: "b-100", track: "basics", order: 100, level: 1 }),
    makeLesson({ id: "b-200", track: "basics", order: 200, level: 2 }),
  ],
);

describe("progressReducer", () => {
  it("complete: progress 기록 + 스트릭 갱신 (원자적)", () => {
    const next = progressReducer(
      makeState(),
      { type: "complete", lessonId: "b-100", today: "2026-03-10" },
      createInitialState,
    );
    expect(next.progress["b-100"]).toEqual({ status: "completed", at: "2026-03-10" });
    expect(next.streak.current).toBe(1);
  });

  it("uncomplete: 오늘 유일 완료 취소 → 스트릭 롤백 (AC-5.13)", () => {
    const state = makeState({
      progress: { "b-100": { status: "completed", at: "2026-03-10" } },
      streak: { current: 1, longest: 1, lastCompletedDate: "2026-03-10" },
    });
    const next = progressReducer(
      state,
      { type: "uncomplete", lessonId: "b-100", today: "2026-03-10" },
      createInitialState,
    );
    expect(next.progress["b-100"]).toBeUndefined();
    expect(next.streak.current).toBe(0);
  });

  it("uncomplete: 오늘 다른 완료가 남으면 스트릭 불변 (AC-5.14)", () => {
    const state = makeState({
      progress: {
        "b-100": { status: "completed", at: "2026-03-10" },
        "b-200": { status: "completed", at: "2026-03-10" },
      },
      streak: { current: 5, longest: 5, lastCompletedDate: "2026-03-10" },
    });
    const next = progressReducer(
      state,
      { type: "uncomplete", lessonId: "b-100", today: "2026-03-10" },
      createInitialState,
    );
    expect(next.streak.current).toBe(5);
  });

  it("skip: skipped-manual로 기록", () => {
    const next = progressReducer(
      makeState(),
      { type: "skip", lessonId: "b-100", today: "2026-03-10" },
      createInitialState,
    );
    expect(next.progress["b-100"]).toEqual({ status: "skipped-manual", at: "2026-03-10" });
  });

  it("pinTrack: 설정 반영", () => {
    const next = progressReducer(
      makeState(),
      { type: "pinTrack", trackId: "cowork" },
      createInitialState,
    );
    expect(next.settings.pinnedTrack).toBe("cowork");
  });

  it("saveDiagnostic: 결과 저장 + 자동 건너뜀 재계산 (AC-1.9, 1.10)", () => {
    const state = makeState({
      progress: { "b-100": { status: "completed", at: "old" } },
    });
    const next = progressReducer(
      state,
      {
        type: "saveDiagnostic",
        result: { startLevel: 2, trackOrder: ["basics"] },
        answers: null,
        index,
        today: "2026-03-10",
      },
      createInitialState,
    );
    expect(next.diagnostic.completed).toBe(true);
    expect(next.diagnostic.startLevel).toBe(2);
    // b-100은 completed로 보존, b-200(level2)은 startLevel2와 같아 자동 건너뜀 아님
    expect(next.progress["b-100"].status).toBe("completed");
  });

  it("reset: 초기 상태로", () => {
    const state = makeState({ streak: { current: 9, longest: 9, lastCompletedDate: "x" } });
    const next = progressReducer(state, { type: "reset" }, createInitialState);
    expect(next).toEqual(createInitialState());
  });
});

describe("withoutOrphanProgress", () => {
  it("존재하는 레슨 진도만 남긴다 (design §8.3)", () => {
    const state = makeState({
      progress: {
        "b-100": { status: "completed", at: "x" },
        "ghost-999": { status: "completed", at: "x" },
      },
    });
    const filtered = withoutOrphanProgress(state, index);
    expect(filtered.progress["b-100"]).toBeDefined();
    expect(filtered.progress["ghost-999"]).toBeUndefined();
  });
});
