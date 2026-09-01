/**
 * 도메인·저장 상태 타입 (design §4.1)
 * 도메인 함수는 이 타입들을 입력으로 받는 순수 함수다.
 */

export type Level = 1 | 2 | 3;

export type LessonStatus = "completed" | "skipped-manual" | "skipped-auto";

export interface ProgressEntry {
  status: LessonStatus;
  at: string; // YYYY-MM-DD
}

export type Q1Answer = "writing" | "documents" | "coding" | "automation";
export type ExperienceAnswer = "built" | "heard" | "unknown";

export interface DiagnosticAnswers {
  q1: Q1Answer;
  q2: ExperienceAnswer; // Artifact
  q3: ExperienceAnswer; // Skill
  q4: ExperienceAnswer; // Cowork / Claude Code
  q5: ExperienceAnswer; // MCP
}

export interface DiagnosticResult {
  startLevel: Level;
  trackOrder: string[];
}

export interface Streak {
  current: number;
  longest: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
}

export interface PersistedState {
  schemaVersion: 1;
  diagnostic: {
    completed: boolean;
    takenAt: string | null;
    startLevel: Level;
    trackOrder: string[];
    answers: DiagnosticAnswers | null;
  };
  progress: Record<string, ProgressEntry>;
  streak: Streak;
  daily: {
    servedDate: string | null;
    servedLessonId: string | null;
  };
  settings: {
    pinnedTrack: string | null;
    hideBelowStartLevel: boolean;
  };
}
