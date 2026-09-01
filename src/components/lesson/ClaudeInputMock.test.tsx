import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ClaudeInputMock } from "./ClaudeInputMock";

const html = (el: React.ReactElement) => renderToStaticMarkup(el);

describe("ClaudeInputMock", () => {
  it("프롬프트 텍스트를 그대로 노출한다", () => {
    const out = html(<ClaudeInputMock prompt="이 폴더의 파일을 정리해줘" />);
    expect(out).toContain("이 폴더의 파일을 정리해줘");
  });

  it("개념 예시 안내 캡션을 표시한다", () => {
    const out = html(<ClaudeInputMock prompt="테스트" />);
    expect(out).toContain("개념 예시");
  });

  it("여러 줄 프롬프트도 보존한다", () => {
    const out = html(<ClaudeInputMock prompt={"1) 첫째\n2) 둘째"} />);
    expect(out).toContain("1) 첫째");
    expect(out).toContain("2) 둘째");
  });
});
