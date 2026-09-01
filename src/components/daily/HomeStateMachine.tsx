"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ContentIndex } from "@/lib/content/index";
import { useProgress } from "@/lib/state/ProgressProvider";
import { selectDailyLesson } from "@/lib/domain/daily";
import { localDateKey } from "@/lib/domain/date";
import { DailyCard } from "./DailyCard";
import { DailyDoneState } from "./DailyDoneState";
import { AllClearedState } from "./AllClearedState";
import { DailyCardSkeleton } from "./DailyCardSkeleton";
import { HomeProgress } from "./HomeProgress";

/**
 * 홈 상태 기계 (T-48 / design §5.1 / AC-1.1, AC-2.1, AC-2.11)
 * DIAGNOSTIC_CTA / TODAY_PENDING / TODAY_DONE / ALL_CLEARED
 */
export function HomeStateMachine({ index }: { index: ContentIndex }) {
  const router = useRouter();
  const { mounted, state, setDaily } = useProgress();
  const today = localDateKey();

  const result = mounted ? selectDailyLesson(index, state, today) : null;

  // 오늘의 레슨을 확정하면 고정값 저장 (날짜 변경 시 갱신 — AC-2.3, AC-2.11)
  const servedId = result?.kind === "lesson" ? result.lesson.id : null;
  useEffect(() => {
    if (!mounted || !servedId) return;
    if (state.daily.servedDate !== today || state.daily.servedLessonId !== servedId) {
      // 당일 첫 확정만 저장. sticky(이미 저장된 값)는 setDaily가 무변경 처리.
      if (state.daily.servedDate !== today) setDaily(today, servedId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, servedId, today]);

  if (!mounted) return <DailyCardSkeleton />;

  // 진단 미완료 → 진단 CTA (AC-1.1)
  if (!state.diagnostic.completed) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <h1 className="mb-2 text-2xl font-bold text-[var(--text)]">StepUp</h1>
        <p className="mb-5 text-[var(--text-muted)]">
          하루 3분, 한 강씩. 먼저 5개 문항으로 시작 지점을 정해 드릴게요.
        </p>
        <Link
          href="/diagnostic/"
          className="inline-block rounded-md bg-[var(--accent)] px-5 py-3 font-semibold text-white"
        >
          레벨 진단 시작
        </Link>
      </div>
    );
  }

  if (!result || result.kind === "all-cleared") {
    return (
      <div className="flex flex-col gap-4">
        <HomeProgress index={index} />
        <AllClearedState index={index} />
      </div>
    );
  }

  const lesson = result.lesson;
  const trackTitle = index.tracks.find((t) => t.id === lesson.track)?.title ?? lesson.track;

  // 오늘의 고정 레슨이 완료됐는지 → 완료 상태
  const servedDone =
    state.daily.servedDate === today &&
    state.daily.servedLessonId != null &&
    state.progress[state.daily.servedLessonId]?.status === "completed";

  if (servedDone) {
    return (
      <div className="flex flex-col gap-4">
        <HomeProgress index={index} />
        <DailyDoneState
          onMore={() => {
            // 다음 후보로 클라이언트 라우팅 이동(NFR-2, 페이지 리로드 없음)
            router.push(`/lessons/${lesson.id}/`);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <HomeProgress index={index} />
      <DailyCard lesson={lesson} trackTitle={trackTitle} />
    </div>
  );
}
