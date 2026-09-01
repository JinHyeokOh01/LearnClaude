import { buildContentIndex, toLightIndex } from "@/lib/content/index";
import { HomeStateMachine } from "@/components/daily/HomeStateMachine";

export default function Home() {
  const index = toLightIndex(buildContentIndex());
  return <HomeStateMachine index={index} />;
}
