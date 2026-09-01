"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProgress } from "@/lib/state/ProgressProvider";
import { scoreDiagnostic, DEFAULT_DIAGNOSTIC } from "@/lib/domain/diagnostic";
import type { DiagnosticAnswers, Q1Answer, ExperienceAnswer } from "@/lib/domain/types";
import { QuestionCard } from "./QuestionCard";
import {
  Q1_QUESTION,
  Q1_OPTIONS,
  EXP_OPTIONS,
  EXP_QUESTIONS,
  TOTAL_QUESTIONS,
} from "./questions";

/**
 * 진단 스텝퍼 (T-43, T-45 / AC-1.2, 1.5, 1.7, 1.8)
 * 한 화면 한 문항, 진행 표시(n/5), 뒤로 가기, 건너뛰기.
 */
export function QuestionStepper() {
  const router = useRouter();
  const { saveDiagnostic } = useProgress();

  const [step, setStep] = useState(0); // 0..4
  const [q1, setQ1] = useState<Q1Answer | null>(null);
  const [exp, setExp] = useState<Record<"q2" | "q3" | "q4" | "q5", ExperienceAnswer | null>>({
    q2: null,
    q3: null,
    q4: null,
    q5: null,
  });

  const canNext = step === 0 ? q1 !== null : exp[EXP_QUESTIONS[step - 1].key] !== null;

  function finish() {
    const answers: DiagnosticAnswers = {
      q1: q1!,
      q2: exp.q2!,
      q3: exp.q3!,
      q4: exp.q4!,
      q5: exp.q5!,
    };
    const result = scoreDiagnostic(answers);
    saveDiagnostic(result, answers);
    router.push("/diagnostic/result");
  }

  function skip() {
    saveDiagnostic(DEFAULT_DIAGNOSTIC, null); // AC-1.7
    router.push("/diagnostic/result");
  }

  function next() {
    if (step < TOTAL_QUESTIONS - 1) setStep(step + 1);
    else finish();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
        <span aria-live="polite">
          {step + 1} / {TOTAL_QUESTIONS}
        </span>
        <button type="button" onClick={skip} className="underline hover:text-[var(--text)]">
          건너뛰기
        </button>
      </div>

      {step === 0 ? (
        <QuestionCard
          question={Q1_QUESTION}
          options={Q1_OPTIONS}
          value={q1}
          onChange={setQ1}
        />
      ) : (
        <QuestionCard
          question={EXP_QUESTIONS[step - 1].question}
          options={EXP_OPTIONS}
          value={exp[EXP_QUESTIONS[step - 1].key]}
          onChange={(v) => setExp({ ...exp, [EXP_QUESTIONS[step - 1].key]: v })}
        />
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="rounded-md border border-[var(--border)] px-4 py-2 text-[var(--text)] disabled:opacity-40"
        >
          이전
        </button>
        <button
          type="button"
          onClick={next}
          disabled={!canNext}
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-white disabled:opacity-40"
        >
          {step < TOTAL_QUESTIONS - 1 ? "다음" : "결과 보기"}
        </button>
      </div>
    </div>
  );
}
