import { buildContentIndex, toLightIndex } from "@/lib/content/index";
import { TrackList } from "@/components/track/TrackList";

export default function TracksPage() {
  const index = toLightIndex(buildContentIndex());
  return <TrackList index={index} />;
}
