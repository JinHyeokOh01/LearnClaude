/** 하이드레이션 전 플레이스홀더 (T-52 / design §4.4) */
export function DailyCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="mb-3 h-4 w-24 rounded bg-[var(--border)]" />
      <div className="mb-2 h-6 w-3/4 rounded bg-[var(--border)]" />
      <div className="h-4 w-full rounded bg-[var(--border)]" />
    </div>
  );
}
