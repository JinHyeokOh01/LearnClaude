import type { LessonMeta } from "@/lib/content/schema";

/** 출처 + 검증일자 (T-63 / AC-4.7, AC-4.8) */
export function SourceList({ sources, verifiedAt }: Pick<LessonMeta, "sources" | "verifiedAt">) {
  return (
    <footer className="border-t border-[var(--border)] pt-4 text-sm text-[var(--text-muted)]">
      <p className="mb-1">공식 문서 출처</p>
      <ul className="mb-2 list-disc pl-5">
        {sources.map((s) => (
          <li key={s.url}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-text)] underline"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
      <p>검증일자: {verifiedAt}</p>
    </footer>
  );
}
