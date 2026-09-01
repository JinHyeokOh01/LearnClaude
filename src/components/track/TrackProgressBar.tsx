import type { TrackProgress } from "@/lib/domain/progress";

/**
 * 트랙 진행률 바 (T-55 / AC-5.12, NFR-6, NFR-7)
 * 색상 외 텍스트로도 값 전달, role=progressbar.
 */
export function TrackProgressBar({ progress }: { progress: TrackProgress }) {
  const { completed, skipped, total, percent } = progress;
  const label = `완료 ${completed} · 건너뜀 ${skipped} / ${total} (${percent}%)`;

  return (
    <div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]"
      >
        <div
          className="h-full bg-[var(--success)]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{label}</p>
    </div>
  );
}
