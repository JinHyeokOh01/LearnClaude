import type { DiagnosticAnswers, DiagnosticResult, ExperienceAnswer, Q1Answer, Level } from "./types";

/**
 * 진단 채점 (design §6.2 / AC-1.5)
 * 총점(0~8)으로 시작 레벨을 정하고, Q1 기반 기본 순서에서
 * 이미 숙련한 영역을 뒤로 미룬 트랙 순서를 만든다.
 */

const EXPERIENCE_SCORE: Record<ExperienceAnswer, number> = {
  built: 2,
  heard: 1,
  unknown: 0,
};

const Q1_PRIORITY: Record<Q1Answer, string[]> = {
  writing: ["basics", "artifact", "skill", "cowork", "mcp", "claude-code"],
  documents: ["basics", "cowork", "artifact", "skill", "mcp", "claude-code"],
  coding: ["basics", "claude-code", "skill", "artifact", "mcp", "cowork"],
  automation: ["basics", "cowork", "skill", "mcp", "artifact", "claude-code"],
};

export function scoreDiagnostic(answers: DiagnosticAnswers): DiagnosticResult {
  const total =
    EXPERIENCE_SCORE[answers.q2] +
    EXPERIENCE_SCORE[answers.q3] +
    EXPERIENCE_SCORE[answers.q4] +
    EXPERIENCE_SCORE[answers.q5]; // 0~8

  const startLevel: Level = total <= 2 ? 1 : total <= 5 ? 2 : 3;

  const base = Q1_PRIORITY[answers.q1];
  const mastered = new Set<string>();
  if (answers.q2 === "built") mastered.add("artifact");
  if (answers.q3 === "built") mastered.add("skill");
  if (answers.q4 === "built") {
    mastered.add("cowork");
    mastered.add("claude-code");
  }
  if (answers.q5 === "built") mastered.add("mcp");

  const trackOrder = [
    ...base.filter((t) => !mastered.has(t)),
    ...base.filter((t) => mastered.has(t)),
  ];

  return { startLevel, trackOrder };
}

/** 진단 건너뛰기 시 기본값 (AC-1.7) */
export const DEFAULT_DIAGNOSTIC: DiagnosticResult = {
  startLevel: 1,
  trackOrder: ["basics", "cowork", "artifact", "skill", "claude-code", "mcp"],
};
