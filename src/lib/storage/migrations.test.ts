import { describe, it, expect } from "vitest";
import { loadState } from "./migrations";
import { createInitialState, CURRENT_VERSION } from "./state-schema";

describe("loadState", () => {
  it("null이면 초기 상태", () => {
    expect(loadState(null)).toEqual(createInitialState());
  });

  it("정상 최신 버전은 그대로 파싱", () => {
    const state = createInitialState();
    state.streak.current = 3;
    const loaded = loadState(JSON.stringify(state));
    expect(loaded.streak.current).toBe(3);
  });

  it("손상된 JSON이면 초기 상태", () => {
    expect(loadState("{not json")).toEqual(createInitialState());
  });

  it("스키마 위반(최신 버전이지만 형식 불량)이면 초기 상태", () => {
    const bad = JSON.stringify({ schemaVersion: CURRENT_VERSION, streak: "nope" });
    expect(loadState(bad)).toEqual(createInitialState());
  });

  it("알 수 없는 상위 버전이면 파기하지 않고 초기 상태로 폴백 (AC-5.10)", () => {
    const future = JSON.stringify({ schemaVersion: 99, foo: "bar" });
    expect(loadState(future)).toEqual(createInitialState());
  });

  it("하위 버전이면 마이그레이션 경로 (현재는 초기 상태 반환)", () => {
    const old = JSON.stringify({ schemaVersion: 0 });
    expect(loadState(old)).toEqual(createInitialState());
  });
});
