import { notFound } from "next/navigation";
import { buildContentIndex, toLightIndex } from "@/lib/content/index";
import { TrackDetail } from "@/components/track/TrackDetail";

export function generateStaticParams() {
  const index = buildContentIndex();
  return index.tracks.map((t) => ({ trackId: t.id }));
}

export default async function TrackDetailPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = await params;
  const index = toLightIndex(buildContentIndex());
  const track = index.tracks.find((t) => t.id === trackId);
  if (!track) notFound();

  const lessons = index.lessonsByTrack[trackId] ?? [];
  return <TrackDetail index={index} track={track} lessons={lessons} />;
}
