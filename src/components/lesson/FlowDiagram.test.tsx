import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FlowDiagram } from "./FlowDiagram";

// jsdom 없이 서버 렌더 마크업으로 검증(순수 프레젠테이션 컴포넌트).
const html = (el: React.ReactElement) => renderToStaticMarkup(el);

describe("FlowDiagram", () => {
  it("'/'로 구분된 단계를 각각 렌더한다", () => {
    const out = html(<FlowDiagram steps="첫 단계 / 둘째 / 셋째" />);
    expect(out).toContain("첫 단계");
    expect(out).toContain("둘째");
    expect(out).toContain("셋째");
  });

  it("공백·빈 항목을 걸러낸다 (li 개수 = 유효 단계 수)", () => {
    const out = html(<FlowDiagram steps=" A /  / B / " />);
    const liCount = (out.match(/<li/g) ?? []).length;
    expect(liCount).toBe(2);
  });

  it("caption을 렌더한다", () => {
    const out = html(<FlowDiagram steps="A / B" caption="설명 문구" />);
    expect(out).toContain("설명 문구");
  });

  it("단계 사이에만 화살표가 들어간다 (n-1개)", () => {
    const out = html(<FlowDiagram steps="A / B / C" />);
    const arrowCount = (out.match(/aria-hidden/g) ?? []).length;
    expect(arrowCount).toBe(2);
  });
});
