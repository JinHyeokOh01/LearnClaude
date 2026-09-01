"use client";

import { useRouter } from "next/navigation";
import { useProgress } from "@/lib/state/ProgressProvider";

/**
 * 완료 / 완료 취소 + 다음 레슨 이동 (T-64, T-66 / AC-4.6, AC-5.1, AC-5.7)
 * 완료 시 스트릭 갱신, 취소 시 롤백은 리듀서에서 원자적으로 처리.
 */
export function CompleteButton({
  lessonId,
  nextLessonId,
}: {
  lessonId: string;
  nextLessonId: string | null;
}) {
  const router = useRouter();
  const { mounted, state, completeLesson, uncompleteLesson } = useProgress();

  if (!mounted) return null;

  const done = state.progress[lessonId]?.status === "completed";

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4">
      <div aria-live="polite" className="text-sm text-[var(--success)]">
        {done ? "완료한 강이에요 ✓" : ""}
      </div>
      <div className="flex gap-3">
        {!done ? (
          <button
            type="button"
            onClick={() => completeLesson(lessonId)}
            className="rounded-md bg-[var(--success)] px-4 py-2 font-semibold text-white"
          >
            완료
          </button>
        ) : (
          <button
            type="button"
            onClick={() => uncompleteLesson(lessonId)}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-[var(--text)]"
          >
            완료 취소
          </button>
        )}
        {nextLessonId && (
          <button
            type="button"
            onClick={() => router.push(`/lessons/${nextLessonId}/`)}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-[var(--text)]"
          >
            다음 레슨
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-md border border-[var(--border)] px-4 py-2 text-[var(--text)]"
        >
          홈으로
        </button>
      </div>
    </div>
  );
}
