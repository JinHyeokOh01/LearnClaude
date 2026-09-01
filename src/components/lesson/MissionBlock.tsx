import type { LessonMeta } from "@/lib/content/schema";
import { CopyPromptButton } from "./CopyPromptButton";

/** 3분 실습 미션 (T-61 / AC-4.2) — 목표·프롬프트·성공 기준 */
export function MissionBlock({ mission }: { mission: LessonMeta["mission"] }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">3분 실습 미션</h2>

      <div className="mb-4">
        <p className="mb-1 text-sm font-semibold text-[var(--text-muted)]">목표</p>
        <p className="text-[var(--text)]">{mission.goal}</p>
      </div>

      <div className="mb-4">
        <p className="mb-1 text-sm font-semibold text-[var(--text-muted)]">복붙 프롬프트</p>
        <pre className="mb-2 overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--bg)] p-3 font-mono text-sm whitespace-pre-wrap text-[var(--text)]">
          {mission.prompt}
        </pre>
        <CopyPromptButton prompt={mission.prompt} />
      </div>

      <div>
        <p className="mb-1 text-sm font-semibold text-[var(--text-muted)]">성공 기준</p>
        <p className="text-[var(--text)]">{mission.success}</p>
      </div>
    </section>
  );
}
