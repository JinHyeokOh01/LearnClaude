"use client";

import Link from "next/link";
import { useProgress } from "@/lib/state/ProgressProvider";

/**
 * 설정 패널 (T-65 / AC-1.9, AC-1.10, AC-5.9)
 * 진단 재응시, 레벨 필터 토글, 진도 초기화(확인).
 */
export function SettingsPanel() {
  const { mounted, state, setHideBelowStartLevel, resetAll } = useProgress();
  if (!mounted) return null;

  function confirmReset() {
    const ok = window.confirm(
      "진도 데이터를 모두 초기화할까요? 완료 기록·스트릭·진단 결과가 삭제되며 되돌릴 수 없어요.",
    );
    if (ok) resetAll();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[var(--text)]">설정</h1>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-2 font-semibold text-[var(--text)]">레벨 진단</h2>
        <p className="mb-3 text-sm text-[var(--text-muted)]">
          다시 응시하면 시작 레벨과 트랙 순서만 갱신되고, 완료·직접 건너뛴 기록은 보존돼요.
        </p>
        <Link
          href="/diagnostic/"
          className="inline-block rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)]"
        >
          진단 다시 하기
        </Link>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-2 font-semibold text-[var(--text)]">학습 표시</h2>
        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input
            type="checkbox"
            checked={state.settings.hideBelowStartLevel}
            onChange={(e) => setHideBelowStartLevel(e.target.checked)}
          />
          내 레벨보다 낮은 강의를 &quot;이미 아는 내용&quot;으로 건너뛰기
        </label>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-2 font-semibold text-[var(--text)]">진도 데이터</h2>
        <p className="mb-3 text-sm text-[var(--text-muted)]">
          진도는 이 브라우저에만 저장되며 기기 간 동기화되지 않아요.
        </p>
        <button
          type="button"
          onClick={confirmReset}
          className="rounded-md border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)]"
        >
          진도 초기화
        </button>
      </section>
    </div>
  );
}
