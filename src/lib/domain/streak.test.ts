import { describe, it, expect } from "vitest";
import { applyCompletion, displayStreak, revertCompletion } from "./streak";
import type { Streak } from "./types";

const s = (over: Partial<Streak> = {}): Streak => ({
  current: 0,
  longest: 0,
  lastCompletedDate: null,
  ...over,
});

describe("applyCompletion", () => {
  it("첫 완료면 1", () => {
    expect(applyCompletion(s(), "2026-03-10")).toEqual({
      current: 1,
      longest: 1,
      lastCompletedDate: "2026-03-10",
    });
  });

  it("어제 이어서 완료하면 +1 (AC-5.3)", () => {
    const prev = s({ current: 3, longest: 5, lastCompletedDate: "2026-03-09" });
    expect(applyCompletion(prev, "2026-03-10")).toEqual({
      current: 4,
      longest: 5,
      lastCompletedDate: "2026-03-10",
    });
  });

  it("하루 이상 건너뛰면 1로 재설정 (AC-5.4)", () => {
    const prev = s({ current: 7, longest: 7, lastCompletedDate: "2026-03-07" });
    expect(applyCompletion(prev, "2026-03-10")).toEqual({
      current: 1,
      longest: 7,
      lastCompletedDate: "2026-03-10",
    });
  });

  it("같은 날 중복 완료는 무변화 (AC-5.5)", () => {
    const prev = s({ current: 2, longest: 4, lastCompletedDate: "2026-03-10" });
    expect(applyCompletion(prev, "2026-03-10")).toBe(prev);
  });

  it("연속 증가로 longest 갱신", () => {
    const prev = s({ current: 5, longest: 5, lastCompletedDate: "2026-03-09" });
    expect(applyCompletion(prev, "2026-03-10").longest).toBe(6);
  });
});

describe("displayStreak", () => {
  it("오늘 완료했으면 current", () => {
    expect(displayStreak(s({ current: 3, lastCompletedDate: "2026-03-10" }), "2026-03-10")).toBe(3);
  });
  it("어제 완료면 오늘 아직 유효 → current", () => {
    expect(displayStreak(s({ current: 3, lastCompletedDate: "2026-03-09" }), "2026-03-10")).toBe(3);
  });
  it("이틀 전 이상이면 끊김 → 0", () => {
    expect(displayStreak(s({ current: 3, lastCompletedDate: "2026-03-01" }), "2026-03-10")).toBe(0);
  });
  it("기록 없으면 0", () => {
    expect(displayStreak(s(), "2026-03-10")).toBe(0);
  });
});

describe("revertCompletion", () => {
  it("오늘 완료가 남아 있으면 불변 (AC-5.14)", () => {
    const prev = s({ current: 4, longest: 4, lastCompletedDate: "2026-03-10" });
    expect(revertCompletion(prev, "2026-03-10", 1)).toBe(prev);
  });

  it("마지막 완료일이 오늘이 아니면 불변", () => {
    const prev = s({ current: 4, longest: 4, lastCompletedDate: "2026-03-09" });
    expect(revertCompletion(prev, "2026-03-10", 0)).toBe(prev);
  });

  it("오늘 유일 완료 취소 → current-1, lastCompletedDate=어제 (AC-5.13)", () => {
    const prev = s({ current: 4, longest: 6, lastCompletedDate: "2026-03-10" });
    expect(revertCompletion(prev, "2026-03-10", 0)).toEqual({
      current: 3,
      longest: 6,
      lastCompletedDate: "2026-03-09",
    });
  });

  it("current가 1이었으면 0 + lastCompletedDate=null", () => {
    const prev = s({ current: 1, longest: 3, lastCompletedDate: "2026-03-10" });
    expect(revertCompletion(prev, "2026-03-10", 0)).toEqual({
      current: 0,
      longest: 3,
      lastCompletedDate: null,
    });
  });
});
