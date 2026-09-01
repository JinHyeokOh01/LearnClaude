import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * 접근성 자동 검사 (T-81 / NFR-4)
 * axe-core로 WCAG 2.0/2.1 A·AA 위반을 검사한다.
 * 자동 검사는 전체의 일부만 잡으므로, 수동 키보드/스크린리더 점검은 별도 필요.
 */

const pages = [
  { name: "홈(진단 CTA)", path: "/" },
  { name: "진단", path: "/diagnostic/" },
  { name: "트랙 목록", path: "/tracks/" },
  { name: "트랙 상세", path: "/tracks/basics/" },
  { name: "레슨 상세", path: "/lessons/basics-100/" },
  { name: "설정", path: "/settings/" },
];

for (const p of pages) {
  test(`a11y: ${p.name}`, async ({ page }) => {
    await page.goto(p.path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
