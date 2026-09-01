import { describe, it, expect } from "vitest";
import { recomputeAutoSkips } from "./autoskip";
import { makeLesson, makeTrack, makeIndex } from "./_fixtures";
import type { ProgressEntry } from "./types";

const index = makeIndex(
  [makeTrack({ id: "basics", order: 100 })],
  [
    makeLesson({ id: "b-100", track: "basics", order: 100, level: 1 }),
    makeLesson({ id: "b-200", track: "basics", order: 200, level: 2 }),
    makeLesson({ id: "b-300", track: "basics", order: 300, level: 3 }),
  ],
);

describe("recomputeAutoSkips", () => {
  it("최초 진단(레벨 2): level<2 레슨을 skipped-auto로", () => {
    const next = recomputeAutoSkips(index, {}, { startLevel: 2, trackOrder: [] }, true, "2026-03-10");
    expect(next["b-100"]).toEqual({ status: "skipped-auto", at: "2026-03-10" });
    expect(next["b-200"]).toBeUndefined();
    expect(next["b-300"]).toBeUndefined();
  });

  it("hideBelowStartLevel=false면 자동 건너뜀 없음", () => {
    const next = recomputeAutoSkips(index, {}, { startLevel: 3, trackOrder: [] }, false, "x");
    expect(Object.keys(next)).toHaveLength(0);
  });

  it("레벨 하향 재응시(3→1): 기존 skipped-auto 제거", () => {
    const prev: Record<string, ProgressEntry> = {
      "b-100": { status: "skipped-auto", at: "old" },
      "b-200": { status: "skipped-auto", at: "old" },
    };
    const next = recomputeAutoSkips(index, prev, { startLevel: 1, trackOrder: [] }, true, "new");
    // level 1이면 아무것도 자동 건너뜀 안 됨 → 이전 auto 제거되어 비어야
    expect(Object.keys(next)).toHaveLength(0);
  });

  it("completed / skipped-manual는 보존 (AC-1.9)", () => {
    const prev: Record<string, ProgressEntry> = {
      "b-100": { status: "completed", at: "old" },
      "b-200": { status: "skipped-manual", at: "old" },
    };
    const next = recomputeAutoSkips(index, prev, { startLevel: 2, trackOrder: [] }, true, "new");
    expect(next["b-100"]).toEqual({ status: "completed", at: "old" });
    expect(next["b-200"]).toEqual({ status: "skipped-manual", at: "old" });
    // b-100은 이미 기록 있어 자동 건너뜀으로 덮이지 않음
  });

  it("이미 기록된 레슨은 skipped-auto로 덮어쓰지 않음", () => {
    const prev: Record<string, ProgressEntry> = {
      "b-100": { status: "completed", at: "old" },
    };
    const next = recomputeAutoSkips(index, prev, { startLevel: 3, trackOrder: [] }, true, "new");
    expect(next["b-100"].status).toBe("completed");
    // b-200(level2<3)은 기록 없으므로 자동 건너뜀
    expect(next["b-200"]).toEqual({ status: "skipped-auto", at: "new" });
  });
});
