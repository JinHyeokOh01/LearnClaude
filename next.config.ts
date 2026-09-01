import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 정적 사이트로 export (서버 불필요 — requirements NFR-11~13, design §2.1)
  output: "export",
  // 정적 호스팅에서 경로 라우팅이 안정적으로 동작하도록 디렉터리 형태로 출력
  trailingSlash: true,
  images: {
    // next/image 최적화 서버가 없으므로 정적 export에서는 비활성화
    unoptimized: true,
  },
};

export default nextConfig;