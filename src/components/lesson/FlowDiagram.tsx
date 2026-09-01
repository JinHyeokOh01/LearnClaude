import { Fragment } from "react";

/**
 * 개념 흐름도 (인포그래픽)
 * 단계(박스)를 화살표로 이어 개념의 흐름을 보여준다.
 * - UI 스크린샷이 아니라 "개념도"이므로 도구 UI가 바뀌어도 잘 낡지 않는다.
 * - 순수 프레젠테이션(상태 없음) → 서버 컴포넌트로 렌더, MDX에서 임포트 없이 사용.
 * - 반응형: 데스크톱 가로, 모바일 세로. 다크모드 토큰 대응.
 * - 접근성: 순서 있는 목록(ol)으로 의미 전달, 화살표는 aria-hidden.
 *
 * MDX 사용 예 (문자열 prop — MDX에서 가장 안정적):
 *   <FlowDiagram steps="프롬프트 작성 / Artifact 생성 / 수정 / 공유" caption="..." />
 * 단계는 "/"로 구분한다.
 */
export function FlowDiagram({ steps: stepsRaw, caption }: { steps: string; caption?: string }) {
  const steps = stepsRaw
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <figure className="my-6">
      <ol className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        {steps.map((step, i) => (
          <Fragment key={i}>
            <li className="flex items-center justify-center rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-center text-sm font-medium text-[var(--text)] sm:flex-1">
              {step}
            </li>
            {i < steps.length - 1 && (
              <span
                className="flex shrink-0 items-center justify-center text-lg leading-none text-[var(--accent)]"
                aria-hidden
              >
                <span className="hidden sm:inline">→</span>
                <span className="inline sm:hidden">↓</span>
              </span>
            )}
          </Fragment>
        ))}
      </ol>
      {caption && (
        <figcaption className="mt-2 text-center text-xs text-[var(--text-muted)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
