"use client";

import { useRouter } from "next/navigation";
import type { ContentIndex } from "@/lib/content/index";
import type { Track, Lesson } from "@/lib/content/schema";
import { useProgress } from "@/lib/state/ProgressProvider";
import { isResolved } from "@/lib/domain/daily";
import { LessonListItem } from "./LessonListItem";

/**
 * 트랙 상세 (T-56, T-58 / AC-3.3, 3.5, 3.7)
 * 학습 성과 + 레슨 목록(order 순) + "이 트랙 우선하기" / "이어서 하기".
 */
export function TrackDetail({
  index,
  track,
  lessons,
}: {
  index: ContentIndex;
  track: Track;
  lessons: Lesson[];
}) {
  const router = useRouter();
  const { mounted, state, pinTrack } = useProgress();

  const firstUnresolved = lessons.find((l) => !isResolved(state, l.id));
  const isPinned = state.settings.pinnedTrack === track.id;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-[var(--text)]">{track.title}</h1>
        <p className="text-[var(--text-muted)]">{track.outcome}</p>
        {track.prerequisiteNote && (
          <p className="mt-2 text-sm text-[var(--accent-text)]">⚠ {track.prerequisiteNote}</p>
        )}
      </div>

      {mounted && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => pinTrack(isPinned ? null : track.id)}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)]"
          >
            {isPinned ? "우선 해제" : "이 트랙 우선하기"}
          </button>
          {firstUnresolved && (
            <button
              type="button"
              onClick={() => router.push(`/lessons/${firstUnresolved.id}/`)}
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              이 트랙 이어서 하기
            </button>
          )}
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {lessons.map((lesson) => {
          const prereqTitle = lesson.prereq
            .map((id) => index.lessonById[id]?.title)
            .filter(Boolean)
            .join(", ");
          return (
            <LessonListItem
              key={lesson.id}
              lesson={lesson}
              state={state}
              lockedPrereqTitle={prereqTitle || undefined}
            />
          );
        })}
      </ul>
    </div>
  );
}
