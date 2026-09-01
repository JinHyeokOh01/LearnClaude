import { parseTracks, parseLessons } from "./parse";
import { validateContent } from "./validate";
import type { Track, Lesson } from "./schema";

export type { Track, Lesson } from "./schema";

/**
 * 런타임에서 사용하는 콘텐츠 인덱스 (design §3.4)
 * 빌드 타임에 한 번 생성하고, 런타임에는 파일시스템을 다시 읽지 않는다.
 */
export interface ContentIndex {
  tracks: Track[]; // order 오름차순 정렬 완료
  lessons: Lesson[]; // track → order 오름차순 정렬 완료
  lessonById: Record<string, Lesson>;
  lessonsByTrack: Record<string, Lesson[]>;
  totalLessonCount: number;
}

/** 검증 실패를 모아 던지는 에러 (빌드 실패용) */
export class ContentValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(`콘텐츠 검증 실패:\n- ${errors.join("\n- ")}`);
    this.name = "ContentValidationError";
  }
}

/** 본문(body)을 제거한 경량 인덱스. 클라이언트로 넘길 때 사용(NFR-3). */
export function toLightIndex(full: ContentIndex): ContentIndex {
  const strip = (l: Lesson): Lesson => ({ ...l, body: "" });
  return {
    tracks: full.tracks,
    lessons: full.lessons.map(strip),
    lessonById: Object.fromEntries(Object.entries(full.lessonById).map(([id, l]) => [id, strip(l)])),
    lessonsByTrack: Object.fromEntries(
      Object.entries(full.lessonsByTrack).map(([t, ls]) => [t, ls.map(strip)]),
    ),
    totalLessonCount: full.totalLessonCount,
  };
}

let cached: ContentIndex | null = null;

export function buildContentIndex(): ContentIndex {
  if (cached) return cached;

  const tracks = parseTracks();
  const lessons = parseLessons();

  const errors = validateContent(tracks, lessons);
  if (errors.length > 0) throw new ContentValidationError(errors);

  const sortedTracks = [...tracks].sort((a, b) => a.order - b.order);

  const lessonsByTrack: Record<string, Lesson[]> = {};
  for (const l of lessons) {
    (lessonsByTrack[l.track] ??= []).push(l);
  }
  for (const id of Object.keys(lessonsByTrack)) {
    lessonsByTrack[id].sort((a, b) => a.order - b.order);
  }

  // 전체 레슨: 트랙 order → 트랙 내 order 순
  const sortedLessons: Lesson[] = [];
  for (const t of sortedTracks) {
    sortedLessons.push(...(lessonsByTrack[t.id] ?? []));
  }

  const lessonById: Record<string, Lesson> = {};
  for (const l of lessons) lessonById[l.id] = l;

  cached = {
    tracks: sortedTracks,
    lessons: sortedLessons,
    lessonById,
    lessonsByTrack,
    totalLessonCount: lessons.length,
  };
  return cached;
}
