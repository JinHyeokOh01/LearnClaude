import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  // JSX 자동 런타임 → 테스트에서 React 임포트 불필요
  esbuild: {
    jsx: "automatic",
  },
  test: {
    // 도메인 로직은 순수 함수 → node 환경. 컴포넌트 테스트가 필요한 파일은
    // 파일 상단 주석 // @vitest-environment jsdom 으로 개별 지정한다.
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // 도메인 순수 함수는 커버리지 100%를 강제한다 (design §10.1)
      include: ["src/lib/domain/**/*.ts"],
      exclude: [
        "src/lib/domain/**/*.{test,spec}.ts",
        "src/lib/domain/_fixtures.ts",
        "src/lib/domain/types.ts",
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
