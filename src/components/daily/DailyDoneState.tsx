"use client";

import { StreakBadge } from "@/components/shared/StreakBadge";

/**
 * 완료 축하 상태 (T-50 / AC-2.5, AC-2.6)
 * "한 강 더 하기"는 스트릭을 중복 증가시키지 않는다(AC-5.5는 도메인에서 보장).
 */
export function DailyDoneState({ onMore }: { onMore: () => void }) {
  return (
    <div className="rounded-lg border border-[var(--success)] bg-[var(--surface)] p-6 text-center">
      <p className="mb-2 text-2xl">🎉</p>
      <h2 className="mb-2 text-xl font-semibold text-[var(--text)]">오늘 학습 완료!</h2>
      <div className="mb-5 flex justify-center">
        <StreakBadge />
      </div>
      <button
        type="button"
        onClick={onMore}
        className="rounded-md border border-[var(--border)] px-4 py-2 text-[var(--text)]"
      >
        한 강 더 하기
      </button>
    </div>
  );
}
