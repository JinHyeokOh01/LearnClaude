import { QuestionStepper } from "@/components/diagnostic/QuestionStepper";

export default function DiagnosticPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-[var(--text)]">레벨 진단</h1>
      <p className="mb-6 text-[var(--text-muted)]">
        5개 문항으로 시작 지점을 정해 드려요. 이미 아는 내용은 건너뛸 수 있어요.
      </p>
      <QuestionStepper />
    </div>
  );
}
