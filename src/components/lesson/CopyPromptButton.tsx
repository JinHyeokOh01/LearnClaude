"use client";

import { useState } from "react";

/**
 * 프롬프트 복사 버튼 (T-62 / AC-4.3, AC-4.4, NFR-7)
 * 클립보드 복사 + 성공 피드백. API 차단 시 전문 노출 폴백.
 * 복사 결과는 aria-live로 안내.
 */
export function CopyPromptButton({ prompt }: { prompt: string }) {
  const [state, setState] = useState<"idle" | "copied" | "fallback">("idle");

  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(prompt);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("fallback");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-white"
        >
          프롬프트 복사
        </button>
        <span aria-live="polite" className="text-sm text-[var(--success)]">
          {state === "copied" ? "복사됨!" : ""}
        </span>
      </div>
      {state === "fallback" && (
        <div>
          <p className="mb-1 text-xs text-[var(--text-muted)]">
            자동 복사가 차단됐어요. 아래 내용을 직접 선택해 복사하세요.
          </p>
          <textarea
            readOnly
            value={prompt}
            rows={5}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] p-2 font-mono text-sm text-[var(--text)]"
          />
        </div>
      )}
    </div>
  );
}
