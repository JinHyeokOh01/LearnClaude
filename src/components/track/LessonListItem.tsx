"use client";

import Link from "next/link";
import type { Lesson } from "@/lib/content/schema";
import type { PersistedState } from "@/lib/domain/types";
import { arePrereqsSatisfied } from "@/lib/domain/daily";

/**
 * 레슨 목록 항목 (T-57 / AC-3.4, AC-3.6, AC-1.10, NFR-6)
 * 완료 / 직접 건너뜀 / 자동 건너뜀 / 잠금 / 미학습을 아이콘+텍스트로 구분.
 * 잠금이어도 열람은 막지 않고 선행 레슨 안내만 제공.
 */
export function LessonListItem({
  lesson,
  state,
  lockedPrereqTitle,
}: {
  lesson: Lesson;
  state: PersistedState;
  lockedPrereqTitle?: string;
}) {
  const status = state.progress[lesson.id]?.status;
  const locked = !arePrereqsSatisfied(lesson, state);

  const badge = (() => {
    if (status === "completed") return { icon: "✓", text: "완료", cls: "text-[var(--success)]" };
    if (status === "skipped-manual")
      return { icon: "↷", text: "건너뜀", cls: "text-[var(--text-muted)]" };
    if (status === "skipped-auto")
      return { icon: "✓", text: "이미 아는 내용", cls: "text-[var(--text-muted)]" };
    if (locked) return { icon: "🔒", text: "잠금", cls: "text-[var(--text-muted)]" };
    return { icon: "○", text: "미학습", cls: "text-[var(--text-muted)]" };
  })();

  return (
    <li className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <span className={`text-sm ${badge.cls}`} aria-hidden>
        {badge.icon}
      </span>
      <div className="min-w-0 flex-1">
        <Link href={`/lessons/${lesson.id}/`} className="text-[var(--text)] hover:underline">
          {lesson.title}
        </Link>
        <p className="text-xs text-[var(--text-muted)]">
          <span>{badge.text}</span>
          <span aria-hidden> · </span>
          <span>레벨 {lesson.level}</span>
          {locked && lockedPrereqTitle && (
            <span> · 선행: {lockedPrereqTitle}</span>
          )}
        </p>
      </div>
    </li>
  );
}
