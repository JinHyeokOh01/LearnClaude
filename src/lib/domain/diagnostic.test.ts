import { describe, it, expect } from "vitest";
import { scoreDiagnostic, DEFAULT_DIAGNOSTIC } from "./diagnostic";
import type { DiagnosticAnswers } from "./types";

const ans = (over: Partial<DiagnosticAnswers> = {}): DiagnosticAnswers => ({
  q1: "writing",
  q2: "unknown",
  q3: "unknown",
  q4: "unknown",
  q5: "unknown",
  ...over,
});

describe("scoreDiagnostic — 레벨 경계", () => {
  it("총점 0 → 레벨 1", () => {
    expect(scoreDiagnostic(ans()).startLevel).toBe(1);
  });
  it("총점 2 → 레벨 1 (경계 <=2)", () => {
    expect(scoreDiagnostic(ans({ q2: "built" })).startLevel).toBe(1); // 2
  });
  it("총점 3 → 레벨 2 (경계)", () => {
    expect(scoreDiagnostic(ans({ q2: "built", q3: "heard" })).startLevel).toBe(2); // 3
  });
  it("총점 5 → 레벨 2 (경계 <=5)", () => {
    expect(scoreDiagnostic(ans({ q2: "built", q3: "built", q4: "heard" })).startLevel).toBe(2); // 5
  });
  it("총점 6 → 레벨 3 (경계)", () => {
    expect(scoreDiagnostic(ans({ q2: "built", q3: "built", q4: "built" })).startLevel).toBe(3); // 6
  });
  it("총점 8 → 레벨 3", () => {
    expect(
      scoreDiagnostic(ans({ q2: "built", q3: "built", q4: "built", q5: "built" })).startLevel,
    ).toBe(3);
  });
});

describe("scoreDiagnostic — 트랙 순서", () => {
  it("Q1 4가지 모두 basics가 첫 트랙, 6개 트랙 중복·누락 없음", () => {
    for (const q1 of ["writing", "documents", "coding", "automation"] as const) {
      const order = scoreDiagnostic(ans({ q1 })).trackOrder;
      expect(order[0]).toBe("basics");
      expect(new Set(order).size).toBe(6);
      expect([...order].sort()).toEqual(
        ["artifact", "basics", "claude-code", "cowork", "mcp", "skill"].sort(),
      );
    }
  });

  it("mastered(built) 영역은 뒤로 밀린다", () => {
    // artifact를 built로 → artifact가 뒤쪽으로
    const order = scoreDiagnostic(ans({ q1: "writing", q2: "built" })).trackOrder;
    const nonMastered = order.slice(0, order.length - 1);
    expect(nonMastered).not.toContain("artifact");
    expect(order).toContain("artifact");
  });

  it("q4 built는 cowork와 claude-code 둘 다 뒤로", () => {
    const order = scoreDiagnostic(ans({ q1: "documents", q4: "built" })).trackOrder;
    const tail = order.slice(-2);
    expect(tail).toContain("cowork");
    expect(tail).toContain("claude-code");
  });

  it("q5 built는 mcp를 뒤로", () => {
    const order = scoreDiagnostic(ans({ q1: "writing", q5: "built" })).trackOrder;
    expect(order[order.length - 1]).toBe("mcp");
  });
});

describe("DEFAULT_DIAGNOSTIC", () => {
  it("레벨 1, basics·cowork 우선 순서 (AC-1.7)", () => {
    expect(DEFAULT_DIAGNOSTIC.startLevel).toBe(1);
    expect(DEFAULT_DIAGNOSTIC.trackOrder).toEqual([
      "basics",
      "cowork",
      "artifact",
      "skill",
      "claude-code",
      "mcp",
    ]);
  });
});
