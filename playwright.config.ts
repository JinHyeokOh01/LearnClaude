import { defineConfig, devices } from "@playwright/test";

/**
 * E2E 설정 (design §10.2)
 * 정적 export 사이트를 로컬 프리뷰 서버로 띄워 테스트한다.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  // 정적 export 결과물을 서빙. 빌드는 CI/사전에 수행한다고 가정.
  webServer: {
    command: "npx serve out -l 3000",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
