"use client";

import { useProgress } from "@/lib/state/ProgressProvider";
import { displayStreak } from "@/lib/domain/streak";
import { localDateKey } from "@/lib/domain/date";

/**
 * 스트릭 배지 (T-53 / AC-2.10, AC-5.2, NFR-6)
 * 색상 외 텍스트로도 값 전달. 끊긴 경우 부정적 표현 없이 재시작 안내.
 */
export function StreakBadge() {
  const { mounted, state } = useProgress();
  if (!mounted) return null;

  const today = localDateKey();
  const current = displayStreak(state.streak, today);
  const longest = state.streak.longest;

  return (
    <div className="text-sm text-[var(--text-muted)]" aria-live="polite">
      {current > 0 ? (
        <span>
          🔥 현재 <strong className="text-[var(--text)]">{current}일</strong> 연속 · 최장 {longest}일
        </span>
      ) : (
        <span>오늘 한 강으로 다시 시작해 볼까요? (최장 {longest}일)</span>
      )}
    </div>
  );
}
