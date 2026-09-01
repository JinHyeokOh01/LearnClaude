"use client";

import Link from "next/link";
import type { ContentIndex } from "@/lib/content/index";
import { useProgress } from "@/lib/state/ProgressProvider";
import { computeTrackProgress, trackCompletionKind } from "@/lib/domain/progress";
import { TrackProgressBar } from "./TrackProgressBar";

/**
 * 트랙 목록 (T-54 / AC-3.1, 3.2, 1.11, 1.12)
 * trackCompletionKind로 "완주" / "이미 아는 트랙" 배지를 구분 표기.
 */
export function TrackList({ index }: { index: ContentIndex }) {
  const { mounted, state } = useProgress();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-[var(--text)]">기능별 코스</h1>
      <ul className="flex flex-col gap-3">
        {index.tracks.map((track) => {
          const lessons = index.lessonsByTrack[track.id] ?? [];
          const progress = computeTrackProgress(lessons, state);
          const kind = mounted ? trackCompletionKind(lessons, state) : "in-progress";
          return (
            <li key={track.id}>
              <Link
                href={`/tracks/${track.id}/`}
                className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--accent)]"
              >
                <div className="mb-1 flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-[var(--text)]">{track.title}</h2>
                  {mounted && kind === "completed" && (
                    <span className="rounded bg-[var(--success)] px-2 py-0.5 text-xs text-white">
                      완주
                    </span>
                  )}
                  {mounted && kind === "already-known" && (
                    <span className="rounded bg-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                      이미 아는 트랙
                    </span>
                  )}
                </div>
                <p className="mb-3 text-sm text-[var(--text-muted)]">{track.tagline}</p>
                {mounted && <TrackProgressBar progress={progress} />}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
