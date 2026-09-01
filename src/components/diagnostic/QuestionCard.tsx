"use client";

/**
 * 단일 문항 카드 (T-44 / AC-1.3, AC-1.4, NFR-5)
 * 라디오 그룹 접근성 준수.
 */
export function QuestionCard<T extends string>({
  question,
  options,
  value,
  onChange,
}: {
  question: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
      <legend className="mb-4 text-lg font-semibold text-[var(--text)]">{question}</legend>
      <div role="radiogroup" aria-label={question} className="flex flex-col gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={`rounded-md border px-4 py-3 text-left text-[var(--text)] ${
                selected
                  ? "border-[var(--accent)] bg-[var(--bg)]"
                  : "border-[var(--border)] hover:bg-[var(--bg)]"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
