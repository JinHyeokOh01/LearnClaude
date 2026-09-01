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
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="mb-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <span>{trackTitle}</span>
        <span aria-hidden>·</span>
        <span>레벨 {lesson.level}</span>
        <span aria-hidden>·</span>
        <span>약 {lesson.estMinutes}분</span>
      </div>
      <h2 className="mb-2 text-xl font-semibold text-[var(--text)]">{lesson.title}</h2>
      <p className="mb-5 text-[var(--text-muted)]">{lesson.summary}</p>
      <div className="flex gap-3">
        <Link
          href={`/lessons/${lesson.id}/`}
          className="rounded-md bg-[var(--accent)] px-4 py-2 font-semibold text-white"
        >
          오늘의 강 시작
        </Link>
        <button
          type="button"
          onClick={() => skipLesson(lesson.id)}
          className="rounded-md border border-[var(--border)] px-4 py-2 text-[var(--text)]"
        >
          이 강의 건너뛰기
        </button>
      </div>
    </div>
  );
}
