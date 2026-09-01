import type { LessonMeta } from "@/lib/content/schema";

/** 레슨 헤더 (T-60 / AC-4.5, AC-4.9) — 트랙·레벨·소요시간·사전 요구사항 */
export function LessonHeader({ lesson, trackTitle }: { lesson: LessonMeta; trackTitle: string }) {
  const plan = lesson.requires?.plan;
  const platform = lesson.requires?.platform;
  const reqParts: string[] = [];
  if (plan === "paid") reqParts.push("유료 플랜 필요");
  if (platform === "desktop") reqParts.push("데스크톱 앱 필요");
  if (platform === "cli") reqParts.push("터미널(CLI) 필요");

  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <span>{trackTitle}</span>
        <span aria-hidden>·</span>
        <span>레벨 {lesson.level}</span>
        <span aria-hidden>·</span>
        <span>약 {lesson.estMinutes}분</span>
      </div>
      <h1 className="text-2xl font-bold text-[var(--text)]">{lesson.title}</h1>
      {reqParts.length > 0 && (
        <p className="rounded-md border border-[var(--accent)] px-3 py-2 text-sm text-[var(--accent)]">
          사전 요구사항: {reqParts.join(", ")}
        </p>
      )}
    </header>
  );
}
