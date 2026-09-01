/**
 * Claude 입력창 목업 (인포그래픽)
 * 미션 프롬프트를 "Claude 채팅 입력창에 넣은 모습"으로 보여줘,
 * 어디에 어떻게 붙여넣는지 직관적으로 전달한다.
 *
 * - 실제 Claude UI의 정확한 재현이 아니라 "개념 예시"다(라벨로 명시).
 * - 스크린샷이 아니라 코드로 그린 목업이라 UI 변경에 덜 취약하다.
 * - 순수 프레젠테이션(상태 없음) → 서버 컴포넌트로 렌더.
 * - 접근성: 장식용 목업이므로 텍스트는 그대로 노출하되 전송 아이콘은 aria-hidden.
 */
export function ClaudeInputMock({ prompt }: { prompt: string }) {
  return (
    <figure className="my-2">
      <figcaption className="mb-1.5 text-xs text-[var(--text-muted)]">
        Claude 입력창에 이렇게 붙여넣어요 (개념 예시 — 실제 화면과 다를 수 있어요)
      </figcaption>
      <div className="overflow-hidden rounded-[var(--radius-l)] border border-[var(--border)] bg-[var(--surface-2)]">
        {/* 입력된 프롬프트 영역 */}
        <div className="px-4 pt-3.5 pb-2">
          <pre className="overflow-x-auto font-mono text-sm whitespace-pre-wrap text-[var(--text)]">
            {prompt}
          </pre>
        </div>
        {/* 입력창 하단 바 — 전송 버튼 흉내 */}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-3 py-2">
          <span className="text-xs text-[var(--text-muted)]">메시지 입력…</span>
          <span
            className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-full)] bg-[var(--accent)] text-sm text-white"
            aria-hidden
          >
            ↑
          </span>
        </div>
      </div>
    </figure>
  );
}
