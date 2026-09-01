import { describe, it, expect } from "vitest";
import {
  selectDailyLesson,
  resolveTrackOrder,
  isResolved,
  isBelowStartLevel,
  arePrereqsSatisfied,
} from "./daily";
import { makeLesson, makeTrack, makeIndex, makeState } from "./_fixtures";

const tracks = [
  makeTrack({ id: "basics", order: 100 }),
  makeTrack({ id: "cowork", order: 400 }),
];
const lessons = [
  makeLesson({ id: "b-100", track: "basics", order: 100, level: 1 }),
  makeLesson({ id: "b-200", track: "basics", order: 200, level: 2, prereq: ["b-100"] }),
  makeLesson({ id: "c-100", track: "cowork", order: 100, level: 2 }),
];
const index = makeIndex(tracks, lessons);

describe("헬퍼", () => {
  it("isResolved", () => {
    const s = makeState({ progress: { "b-100": { status: "completed", at: "x" } } });
    expect(isResolved(s, "b-100")).toBe(true);
    expect(isResolved(s, "b-200")).toBe(false);
  });
  it("isBelowStartLevel — hide 켜짐 & 레벨 미달", () => {
    const s = makeState({ diagnostic: { ...makeState().diagnostic, startLevel: 2 } });
    expect(isBelowStartLevel(lessons[0], s)).toBe(true); // level 1 < 2
    expect(isBelowStartLevel(lessons[2], s)).toBe(false); // level 2
  });
  it("isBelowStartLevel — hide 꺼지면 false", () => {
    const s = makeState({
      diagnostic: { ...makeState().diagnostic, startLevel: 2 },
      settings: { pinnedTrack: null, hideBelowStartLevel: false },
    });
    expect(isBelowStartLevel(lessons[0], s)).toBe(false);
  });
  it("arePrereqsSatisfied — completed만 인정", () => {
    const s1 = makeState({ progress: { "b-100": { status: "completed", at: "x" } } });
    expect(arePrereqsSatisfied(lessons[1], s1)).toBe(true);
    const s2 = makeState({ progress: { "b-100": { status: "skipped-manual", at: "x" } } });
    expect(arePrereqsSatisfied(lessons[1], s2)).toBe(false);
    expect(arePrereqsSatisfied(lessons[0], makeState())).toBe(true); // prereq 없음
  });
});

describe("resolveTrackOrder", () => {
  it("pinnedTrack이 맨 앞으로", () => {
    const s = makeState({
      diagnostic: { ...makeState().diagnostic, trackOrder: ["basics", "cowork"] },
      settings: { pinnedTrack: "cowork", hideBelowStartLevel: true },
    });
    expect(resolveTrackOrder(index, s)).toEqual(["cowork", "basics"]);
  });
  it("pin 없으면 저장된 순서", () => {
    const s = makeState({
      diagnostic: { ...makeState().diagnostic, trackOrder: ["basics", "cowork"] },
    });
    expect(resolveTrackOrder(index, s)).toEqual(["basics", "cowork"]);
  });
  it("저장된 순서에 없는 신규 트랙은 뒤에 append", () => {
    const s = makeState({
      diagnostic: { ...makeState().diagnostic, trackOrder: ["basics"] },
    });
    expect(resolveTrackOrder(index, s)).toEqual(["basics", "cowork"]);
  });
});

describe("selectDailyLesson", () => {
  it("빈 진도 → 첫 트랙 첫 레슨", () => {
    const r = selectDailyLesson(index, makeState(), "2026-03-10");
    expect(r).toEqual({ kind: "lesson", lesson: lessons[0], isSticky: false });
  });

  it("같은 날짜 고정 (sticky)", () => {
    const s = makeState({ daily: { servedDate: "2026-03-10", servedLessonId: "c-100" } });
    const r = selectDailyLesson(index, s, "2026-03-10");
    expect(r).toEqual({ kind: "lesson", lesson: lessons[2], isSticky: true });
  });

  it("고정 레슨이 이미 완료됐으면 다음 후보 (한 강 더 하기)", () => {
    const s = makeState({
      daily: { servedDate: "2026-03-10", servedLessonId: "b-100" },
      progress: { "b-100": { status: "completed", at: "2026-03-10" } },
    });
    const r = selectDailyLesson(index, s, "2026-03-10");
    // b-100 완료 → b-200(prereq 충족) 후보
    expect(r).toMatchObject({ kind: "lesson", isSticky: false });
    if (r.kind === "lesson") expect(r.lesson.id).toBe("b-200");
  });

  it("서로 다른 날짜면 고정 무시하고 재선택", () => {
    const s = makeState({ daily: { servedDate: "2026-03-09", servedLessonId: "c-100" } });
    const r = selectDailyLesson(index, s, "2026-03-10");
    if (r.kind === "lesson") expect(r.lesson.id).toBe("b-100");
  });

  it("prereq 미충족 레슨은 건너뛴다 (AC-2.7)", () => {
    // b-100을 skip(미완료)하면 b-200 prereq 불충족 → cowork로
    const s = makeState({
      progress: { "b-100": { status: "skipped-manual", at: "x" } },
      diagnostic: { ...makeState().diagnostic, startLevel: 1 },
    });
    const r = selectDailyLesson(index, s, "2026-03-10");
    if (r.kind === "lesson") expect(r.lesson.id).toBe("c-100");
  });

  it("레벨 필터: startLevel 3이면 전부 필터 → 폴백으로 첫 레슨 반환", () => {
    const s = makeState({
      diagnostic: { ...makeState().diagnostic, startLevel: 3 },
    });
    const r = selectDailyLesson(index, s, "2026-03-10");
    // 모든 레슨 level<3 → strict 실패 → relaxed 폴백 → b-100
    expect(r).toMatchObject({ kind: "lesson" });
    if (r.kind === "lesson") expect(r.lesson.id).toBe("b-100");
  });

  it("전부 완료/건너뜀 → all-cleared", () => {
    const s = makeState({
      progress: {
        "b-100": { status: "completed", at: "x" },
        "b-200": { status: "completed", at: "x" },
        "c-100": { status: "skipped-manual", at: "x" },
      },
    });
    expect(selectDailyLesson(index, s, "2026-03-10")).toEqual({ kind: "all-cleared" });
  });

  it("servedLessonId가 삭제된 레슨이면 재계산", () => {
    const s = makeState({ daily: { servedDate: "2026-03-10", servedLessonId: "ghost" } });
    const r = selectDailyLesson(index, s, "2026-03-10");
    if (r.kind === "lesson") expect(r.lesson.id).toBe("b-100");
  });

  it("pinnedTrack이 오늘의 레슨 트랙을 우선", () => {
    const s = makeState({
      settings: { pinnedTrack: "cowork", hideBelowStartLevel: true },
    });
    const r = selectDailyLesson(index, s, "2026-03-10");
    if (r.kind === "lesson") expect(r.lesson.id).toBe("c-100");
  });

  it("레슨이 없는 트랙은 건너뛴다 (빈 트랙 방어, design §8.2)", () => {
    // trackOrder에 레슨이 하나도 없는 트랙 id를 앞에 둔다
    const s = makeState({
      diagnostic: { ...makeState().diagnostic, trackOrder: ["empty-track", "basics", "cowork"] },
    });
    const r = selectDailyLesson(index, s, "2026-03-10");
    // empty-track은 lessonsByTrack에 없어 ?? [] 로 스킵 → basics 첫 레슨
    if (r.kind === "lesson") expect(r.lesson.id).toBe("b-100");
  });
});
