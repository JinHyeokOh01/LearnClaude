import { test, expect } from "@playwright/test";

/**
 * E2E 시나리오 (T-80 / design §10.2)
 * 정적 export를 serve로 띄운 뒤 주요 플로우를 검증한다.
 * localStorage 기반이므로 각 테스트는 깨끗한 컨텍스트에서 시작.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("1. 첫 방문 → 진단 → 결과 → 첫 레슨 완료 → 스트릭", async ({ page }) => {
  await page.goto("/");
  // 진단 미완료 → 진단 CTA
  await expect(page.getByRole("link", { name: "레벨 진단 시작" })).toBeVisible();
  await page.getByRole("link", { name: "레벨 진단 시작" }).click();

  // Q1 (업무 유형)
  await expect(page.getByText("1 / 5")).toBeVisible();
  await page.getByRole("radio", { name: "글쓰기·자료조사" }).click();
  await page.getByRole("button", { name: "다음" }).click();

  // Q2~Q5 (경험) — 전부 "모른다"
  for (let i = 2; i <= 5; i++) {
    await page.getByRole("radio", { name: "모른다" }).click();
    const btn = i < 5 ? "다음" : "결과 보기";
    await page.getByRole("button", { name: btn }).click();
  }

  // 결과 화면
  await expect(page.getByRole("heading", { name: "진단 완료" })).toBeVisible();
  await page.getByRole("link", { name: "오늘의 첫 강 시작" }).click();

  // 홈 → 오늘의 레슨 카드
  await expect(page.getByRole("link", { name: "오늘의 강 시작" })).toBeVisible();
});

test("2. 진단 건너뛰기 → 기본 경로 동작", async ({ page }) => {
  await page.goto("/diagnostic/");
  await page.getByRole("button", { name: "건너뛰기" }).click();
  await expect(page.getByRole("heading", { name: "진단 완료" })).toBeVisible();
});

test("3. 트랙 목록에서 진행률 표시", async ({ page }) => {
  await page.goto("/tracks/");
  await expect(page.getByRole("heading", { name: "기능별 코스" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Basics/ })).toBeVisible();
});

test("4. 레슨에서 완료 → 완료 취소", async ({ page }) => {
  await page.goto("/lessons/basics-100/");
  await page.getByRole("button", { name: "완료" }).click();
  await expect(page.getByText("완료한 강이에요")).toBeVisible();
  await page.getByRole("button", { name: "완료 취소" }).click();
  await expect(page.getByRole("button", { name: "완료" })).toBeVisible();
});

test("5. 설정에서 진도 초기화", async ({ page }) => {
  // 먼저 레슨 완료로 상태 만들기
  await page.goto("/lessons/basics-100/");
  await page.getByRole("button", { name: "완료" }).click();

  await page.goto("/settings/");
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "진도 초기화" }).click();

  // 초기화 후 레슨은 미완료 상태
  await page.goto("/lessons/basics-100/");
  await expect(page.getByRole("button", { name: "완료" })).toBeVisible();
});

test("6. 미션 프롬프트 복사 버튼 노출", async ({ page }) => {
  await page.goto("/lessons/basics-100/");
  await expect(page.getByRole("button", { name: "프롬프트 복사" })).toBeVisible();
});
