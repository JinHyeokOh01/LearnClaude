"use client";

import Link from "next/link";
import type { Lesson } from "@/lib/content/schema";
import { useProgress } from "@/lib/state/ProgressProvider";

/**
 * 오늘의 레슨 카드 (T-49 / AC-2.4, AC-2.9)
 * 트랙명, 제목, 요약, 소요시간, 레벨, 시작 CTA, 건너뛰기.
 */
export function DailyCard({ lesson, trackTitle }: { lesson: Lesson; trackTitle: string }) {
  const { skipLesson } = useProgress();

  return (
    <div className="rounded-[var(--radius-l)] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-[var(--radius-full)] bg-[var(--accent-soft)] px-2.5 py-1 font-medium text-[var(--accent)]">
          {trackTitle}
        </span>
        <span className="text-[var(--text-muted)]">레벨 {lesson.level}</span>
        <span className="text-[var(--text-muted)]" aria-hidden>
          ·
        </span>
        <span className="text-[var(--text-muted)]">약 {lesson.estMinutes}분</span>
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-[var(--text)]">{lesson.title}</h2>
      <p className="mb-6 text-[var(--text-muted)]">{lesson.summary}</p>
      <div className="flex flex-wrap gap-2.5">
        <Link
          href={`/lessons/${lesson.id}/`}
          className="rounded-[var(--radius-m)] bg-[var(--accent)] px-5 py-2.5 font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          오늘의 강 시작
        </Link>
        <button
          type="button"
          onClick={() => skipLesson(lesson.id)}
          className="rounded-[var(--radius-m)] border border-[var(--border)] px-4 py-2.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
        >
          이 강의 건너뛰기
        </button>
      </div>
    </div>
  );
}
