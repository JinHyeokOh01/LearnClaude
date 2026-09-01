import { z } from "zod";
import type { PersistedState } from "../domain/types";

/**
 * 저장 상태 Zod 스키마 + 초기 상태 (design §4.1 / T-30)
 * localStorage에서 읽은 값을 런타임 검증하는 데 사용한다.
 */

export const CURRENT_VERSION = 1 as const;
export const STORAGE_KEY = "stepup.state.v1";

const LevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

const ProgressEntrySchema = z.object({
  status: z.enum(["completed", "skipped-manual", "skipped-auto"]),
  at: z.string(),
});

const DiagnosticAnswersSchema = z.object({
  q1: z.enum(["writing", "documents", "coding", "automation"]),
  q2: z.enum(["built", "heard", "unknown"]),
  q3: z.enum(["built", "heard", "unknown"]),
  q4: z.enum(["built", "heard", "unknown"]),
  q5: z.enum(["built", "heard", "unknown"]),
});

export const PersistedStateSchema = z.object({
  schemaVersion: z.literal(CURRENT_VERSION),
  diagnostic: z.object({
    completed: z.boolean(),
    takenAt: z.string().nullable(),
    startLevel: LevelSchema,
    trackOrder: z.array(z.string()),
    answers: DiagnosticAnswersSchema.nullable(),
  }),
  progress: z.record(z.string(), ProgressEntrySchema),
  streak: z.object({
    current: z.number(),
    longest: z.number(),
    lastCompletedDate: z.string().nullable(),
  }),
  daily: z.object({
    servedDate: z.string().nullable(),
    servedLessonId: z.string().nullable(),
  }),
  settings: z.object({
    pinnedTrack: z.string().nullable(),
    hideBelowStartLevel: z.boolean(),
  }),
});

export function createInitialState(): PersistedState {
  return {
    schemaVersion: CURRENT_VERSION,
    diagnostic: {
      completed: false,
      takenAt: null,
      startLevel: 1,
      trackOrder: [],
      answers: null,
    },
    progress: {},
    streak: { current: 0, longest: 0, lastCompletedDate: null },
    daily: { servedDate: null, servedLessonId: null },
    settings: { pinnedTrack: null, hideBelowStartLevel: true },
  };
}
