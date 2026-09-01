"use client";

import type { ContentIndex } from "@/lib/content/index";
import { useProgress } from "@/lib/state/ProgressProvider";
import { computeOverallProgress } from "@/lib/domain/progress";
import { displayStreak } from "@/lib/domain/streak";
import { localDateKey } from "@/lib/domain/date";

/**
 * 홈 진행 요약 (전체 진행률 + 스트릭) — 습관 형성 동기부여(F5)
 * 색 외 텍스트로도 값 전달(NFR-6), 진행률 role=progressbar.
 */
export function HomeProgress({ index }: { index: ContentIndex }) {
  const { mounted, state } = useProgress();
  if (!mounted) return null;

  const today = localDateKey();
  const p = computeOverallProgress(index.lessons, state);
  const current = displayStreak(state.streak, today);

  return (
    <div className="rounded-[var(--radius-l)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-[var(--text)]">
          {current > 0 ? (
            <>🔥 {current}일 연속</>
          ) : (
            <span className="text-[var(--text-muted)]">오늘 한 강으로 시작해요</span>
          )}
        </span>
        <span className="text-[var(--text-muted)]">
          완료 {p.completed} · 건너뜀 {p.skipped} / {p.total} ({p.percent}%)
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={p.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`전체 진행률 ${p.percent}퍼센트`}
        className="h-2 w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--surface-2)]"
      >
        <div className="h-full bg-[var(--accent)]" style={{ width: `${p.percent}%` }} />
      </div>
    </div>
  );
}
