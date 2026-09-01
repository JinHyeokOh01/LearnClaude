import type { LessonMeta } from "@/lib/content/schema";
import { CopyPromptButton } from "./CopyPromptButton";
import { ClaudeInputMock } from "./ClaudeInputMock";

/** 3분 실습 미션 (T-61 / AC-4.2) — 목표·프롬프트·성공 기준 */
export function MissionBlock({ mission }: { mission: LessonMeta["mission"] }) {
  return (
    <section className="rounded-[var(--radius-l)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">3분 실습 미션</h2>

      <div className="mb-5">
        <p className="mb-1 text-sm font-semibold text-[var(--text-muted)]">목표</p>
        <p className="text-[var(--text)]">{mission.goal}</p>
      </div>

      <div className="mb-5">
        <p className="mb-1.5 text-sm font-semibold text-[var(--text-muted)]">복붙 프롬프트</p>
        <ClaudeInputMock prompt={mission.prompt} />
        <div className="mt-2">
          <CopyPromptButton prompt={mission.prompt} />
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-semibold text-[var(--text-muted)]">성공 기준</p>
        <p className="text-[var(--text)]">{mission.success}</p>
      </div>
    </section>
  );
}
