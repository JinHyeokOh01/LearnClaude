import { describe, it, expect } from "vitest";
import {
  computeTrackProgress,
  computeOverallProgress,
  trackCompletionKind,
} from "./progress";
import { makeLesson, makeState } from "./_fixtures";

const lessons = [
  makeLesson({ id: "b-100", track: "basics", order: 100 }),
  makeLesson({ id: "b-200", track: "basics", order: 200 }),
  makeLesson({ id: "b-300", track: "basics", order: 300 }),
];

describe("computeTrackProgress", () => {
  it("빈 진도 → 0%", () => {
    const p = computeTrackProgress(lessons, makeState());
    expect(p).toEqual({ total: 3, completed: 0, skipped: 0, resolved: 0, percent: 0 });
  });

  it("완료 + 건너뜀을 resolved로 계산", () => {
    const state = makeState({
      progress: {
        "b-100": { status: "completed", at: "2026-03-01" },
        "b-200": { status: "skipped-manual", at: "2026-03-01" },
      },
    });
    const p = computeTrackProgress(lessons, state);
    expect(p).toMatchObject({ total: 3, completed: 1, skipped: 1, resolved: 2, percent: 67 });
  });

  it("skipped-auto도 skipped로 카운트", () => {
    const state = makeState({
      progress: { "b-100": { status: "skipped-auto", at: "2026-03-01" } },
    });
    expect(computeTrackProgress(lessons, state).skipped).toBe(1);
  });

  it("고아 진도 키는 무시(해당 트랙 레슨만 계산)", () => {
    const state = makeState({
      progress: { "ghost-999": { status: "completed", at: "2026-03-01" } },
    });
    expect(computeTrackProgress(lessons, state).completed).toBe(0);
  });

  it("빈 트랙 → 0으로 나누기 방어", () => {
    expect(computeTrackProgress([], makeState()).percent).toBe(0);
  });

  it("computeOverallProgress는 computeTrackProgress에 위임", () => {
    expect(computeOverallProgress(lessons, makeState()).total).toBe(3);
  });
});

describe("trackCompletionKind", () => {
  it("빈 트랙 → in-progress", () => {
    expect(trackCompletionKind([], makeState())).toBe("in-progress");
  });

  it("미해결 레슨 있으면 in-progress", () => {
    const state = makeState({
      progress: { "b-100": { status: "completed", at: "2026-03-01" } },
    });
    expect(trackCompletionKind(lessons, state)).toBe("in-progress");
  });

  it("전부 skipped-auto → already-known", () => {
    const state = makeState({
      progress: {
        "b-100": { status: "skipped-auto", at: "x" },
        "b-200": { status: "skipped-auto", at: "x" },
        "b-300": { status: "skipped-auto", at: "x" },
      },
    });
    expect(trackCompletionKind(lessons, state)).toBe("already-known");
  });

  it("직접 학습 섞이면 completed", () => {
    const state = makeState({
      progress: {
        "b-100": { status: "completed", at: "x" },
        "b-200": { status: "skipped-auto", at: "x" },
        "b-300": { status: "skipped-manual", at: "x" },
      },
    });
    expect(trackCompletionKind(lessons, state)).toBe("completed");
  });
});
