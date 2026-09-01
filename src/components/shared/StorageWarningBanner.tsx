"use client";

import { useState } from "react";
import { useProgress } from "@/lib/state/ProgressProvider";

/**
 * 저장소 경고 배너 (T-42 / AC-5.8)
 * isPersistent가 false면 진도가 저장되지 않는다는 안내를 1회 노출.
 * dismiss 상태는 sessionStorage에 저장(실패 시 컴포넌트 상태로).
 */
export function StorageWarningBanner() {
  const { mounted, isPersistent } = useProgress();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("stepup.storageWarnDismissed") === "1";
    } catch {
      return false;
    }
  });

  if (!mounted || isPersistent || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem("stepup.storageWarnDismissed", "1");
    } catch {
      // ignore
    }
  }

  return (
    <div
      role="status"
      className="bg-[var(--accent)] px-4 py-2 text-center text-sm text-white"
    >
      이 브라우저에서는 진도가 저장되지 않습니다. 학습 기록이 이 세션에만 유지돼요.{" "}
      <button type="button" onClick={dismiss} className="underline" aria-label="안내 닫기">
        닫기
      </button>
    </div>
  );
}
