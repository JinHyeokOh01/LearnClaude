"use client";

import Link from "next/link";
import type { ContentIndex } from "@/lib/content/index";
import { useProgress } from "@/lib/state/ProgressProvider";

/**
 * 완주 화면 (T-51 / AC-2.8, AC-1.11)
 * 건너뛴 레슨 목록/복습 제안. "이미 아는 트랙"은 개념상 완주와 구분되지만
 * 이 화면은 전체 소진 시점의 안내이므로 건너뛴 레슨 복습을 제안한다.
 */
export function AllClearedState({ index }: { index: ContentIndex }) {
  const { state } = useProgress();

  const skipped = index.lessons.filter((l) => {
    const s = state.progress[l.id]?.status;
    return s === "skipped-manual" || s === "skipped-auto";
  });

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="mb-2 text-xl font-semibold text-[var(--text)]">모든 강을 마쳤어요 🎓</h2>
      <p className="mb-4 text-[var(--text-muted)]">
        지금까지 정말 잘 따라오셨어요. 건너뛴 강이 있다면 복습해 볼까요?
      </p>
      {skipped.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {skipped.map((l) => (
            <li key={l.id}>
              <Link
                href={`/lessons/${l.id}/`}
                className="text-[var(--accent)] underline"
              >
                {l.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[var(--text-muted)]">건너뛴 강이 없어요. 완벽해요!</p>
      )}
    </div>
  );
}
