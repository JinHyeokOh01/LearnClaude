import { notFound } from "next/navigation";
import { buildContentIndex } from "@/lib/content/index";
import { LessonBody } from "@/lib/content/mdx";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { MissionBlock } from "@/components/lesson/MissionBlock";
import { SourceList } from "@/components/lesson/SourceList";
import { CompleteButton } from "@/components/lesson/CompleteButton";

export function generateStaticParams() {
  const index = buildContentIndex();
  return index.lessons.map((l) => ({ lessonId: l.id }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const index = buildContentIndex();
  const lesson = index.lessonById[lessonId];
  if (!lesson) notFound();

  const trackTitle = index.tracks.find((t) => t.id === lesson.track)?.title ?? lesson.track;

  // 같은 트랙 내 다음 레슨
  const trackLessons = index.lessonsByTrack[lesson.track] ?? [];
  const idx = trackLessons.findIndex((l) => l.id === lesson.id);
  const nextLessonId = idx >= 0 && idx < trackLessons.length - 1 ? trackLessons[idx + 1].id : null;

  return (
    <article className="flex flex-col gap-6">
      <LessonHeader lesson={lesson} trackTitle={trackTitle} />

      {/* 개념 설명 (MDX 본문) */}
      <div>
        <LessonBody source={lesson.body} />
      </div>

      {/* 실습 미션 */}
      <MissionBlock mission={lesson.mission} />

      {/* 정리: 출처 + 검증일자 */}
      <SourceList sources={lesson.sources} verifiedAt={lesson.verifiedAt} />

      <CompleteButton lessonId={lesson.id} nextLessonId={nextLessonId} />
    </article>
  );
}
