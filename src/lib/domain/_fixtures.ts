import type { ContentIndex } from "../content/index";
import type { Lesson, Track } from "../content/schema";
import type { PersistedState } from "./types";

/** 테스트용 레슨 생성 헬퍼 */
export function makeLesson(over: Partial<Lesson> & { id: string; track: string }): Lesson {
  return {
    order: 100,
    title: "t",
    summary: "s",
    level: 1,
    estMinutes: 3,
    prereq: [],
    tags: [],
    mission: { goal: "g", prompt: "p", success: "s" },
    verifiedAt: "2026-08-31",
    sources: [{ label: "l", url: "https://example.com" }],
    body: "본문",
    ...over,
  };
}

export function makeTrack(over: Partial<Track> & { id: string }): Track {
  return {
    title: over.id,
    tagline: "t",
    order: 100,
    outcome: "o",
    accentToken: "track-x",
    ...over,
  };
}

export function makeIndex(tracks: Track[], lessons: Lesson[]): ContentIndex {
  const lessonsByTrack: Record<string, Lesson[]> = {};
  for (const l of lessons) (lessonsByTrack[l.track] ??= []).push(l);
  for (const id of Object.keys(lessonsByTrack)) {
    lessonsByTrack[id].sort((a, b) => a.order - b.order);
  }
  const sortedTracks = [...tracks].sort((a, b) => a.order - b.order);
  const sortedLessons: Lesson[] = [];
  for (const t of sortedTracks) sortedLessons.push(...(lessonsByTrack[t.id] ?? []));
  const lessonById: Record<string, Lesson> = {};
  for (const l of lessons) lessonById[l.id] = l;
  return {
    tracks: sortedTracks,
    lessons: sortedLessons,
    lessonById,
    lessonsByTrack,
    totalLessonCount: lessons.length,
  };
}

export function makeState(over: Partial<PersistedState> = {}): PersistedState {
  return {
    schemaVersion: 1,
    diagnostic: {
      completed: true,
      takenAt: "2026-08-01",
      startLevel: 1,
      trackOrder: ["basics", "cowork"],
      answers: null,
    },
    progress: {},
    streak: { current: 0, longest: 0, lastCompletedDate: null },
    daily: { servedDate: null, servedLessonId: null },
    settings: { pinnedTrack: null, hideBelowStartLevel: true },
    ...over,
  };
}
