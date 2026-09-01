"use client";

import Link from "next/link";
import type { ContentIndex } from "@/lib/content/index";
import { useProgress } from "@/lib/state/ProgressProvider";

/**
 * 진단 결과 요약 (T-46 / AC-1.6)
 * 시작 레벨, 첫 트랙, 건너뛰는 강의 수 + 첫 강 CTA.
 * 결과 조정(레벨/우선 트랙)은 설정/트랙 화면으로 연결.
 */
export function ResultSummary({ index }: { index: ContentIndex }) {
  const { mounted, state } = useProgress();
  if (!mounted) return null;

  const { startLevel, trackOrder } = state.diagnostic;
  const firstTrackId = trackOrder[0] ?? index.tracks[0]?.id;
  const firstTrack = index.tracks.find((t) => t.id === firstTrackId);

  // 자동 건너뜀으로 표시된 레슨 수
  const autoSkipped = Object.values(state.progress).filter(
    (e) => e.status === "skipped-auto",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="mb-4 text-2xl font-bold text-[var(--text)]">진단 완료</h1>
        <ul className="flex flex-col gap-2 text-[var(--text)]">
          <li>
            시작 레벨: <strong>레벨 {startLevel}</strong>
          </li>
          <li>
            첫 트랙: <strong>{firstTrack?.title ?? firstTrackId}</strong>
          </li>
          <li>
            건너뛰는 강의: <strong>{autoSkipped}강</strong> (이미 아는 내용으로 표시)
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/"
          className="rounded-md bg-[var(--accent)] px-4 py-3 text-center font-semibold text-white"
        >
          오늘의 첫 강 시작
        </Link>
        <p className="text-center text-sm text-[var(--text-muted)]">
          시작 지점이 안 맞나요?{" "}
          <Link href="/settings" className="underline">
            설정에서 조정
          </Link>{" "}
          하거나{" "}
          <Link href="/tracks" className="underline">
            트랙을 직접 선택
          </Link>
          할 수 있어요.
        </p>
      </div>
    </div>
  );
}
