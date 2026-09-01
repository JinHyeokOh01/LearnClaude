import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { buildContentIndex, toLightIndex } from "@/lib/content/index";
import { ProgressProvider } from "@/lib/state/ProgressProvider";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { StorageWarningBanner } from "@/components/shared/StorageWarningBanner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_TITLE = "StepUp — Claude 활용 스텝업 가이드";
const SITE_DESC = "하루 3분씩 한 강씩 따라 하며 Claude 활용 수준을 단계적으로 올리는 학습 사이트";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESC,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESC,
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESC,
  },
};

// 콘텐츠 인덱스는 빌드 타임에 한 번 생성한다.
// 클라이언트 Provider에는 본문(body)을 뺀 경량 인덱스를 전달한다(NFR-3).
// 본문은 각 레슨 페이지(서버 컴포넌트)에서 별도로 렌더한다.
const index = toLightIndex(buildContentIndex());

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ProgressProvider index={index}>
          <StorageWarningBanner />
          <SiteHeader />
          <main className="mx-auto w-full max-w-2xl px-4 py-10">{children}</main>
        </ProgressProvider>
      </body>
    </html>
  );
}
