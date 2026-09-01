import { describe, it, expect } from "vitest";
import { localDateKey, previousDay, isSameDay, isBefore } from "./date";

describe("localDateKey", () => {
  it("로컬 날짜를 YYYY-MM-DD로 (한 자리 월/일 zero-pad)", () => {
    // 로컬 타임존 기준 생성자 사용
    const d = new Date(2026, 0, 5); // 2026-01-05 로컬
    expect(localDateKey(d)).toBe("2026-01-05");
  });

  it("인자 없으면 오늘 날짜 형식", () => {
    expect(localDateKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("previousDay", () => {
  it("일반 하루 전", () => {
    expect(previousDay("2026-03-15")).toBe("2026-03-14");
  });
  it("월 경계", () => {
    expect(previousDay("2026-03-01")).toBe("2026-02-28");
  });
  it("연 경계", () => {
    expect(previousDay("2026-01-01")).toBe("2025-12-31");
  });
  it("윤년 2월 29일", () => {
    expect(previousDay("2028-03-01")).toBe("2028-02-29");
  });
});

describe("isSameDay / isBefore", () => {
  it("isSameDay", () => {
    expect(isSameDay("2026-01-01", "2026-01-01")).toBe(true);
    expect(isSameDay("2026-01-01", "2026-01-02")).toBe(false);
  });
  it("isBefore", () => {
    expect(isBefore("2026-01-01", "2026-01-02")).toBe(true);
    expect(isBefore("2026-01-02", "2026-01-01")).toBe(false);
    expect(isBefore("2026-01-01", "2026-01-01")).toBe(false);
  });
});
