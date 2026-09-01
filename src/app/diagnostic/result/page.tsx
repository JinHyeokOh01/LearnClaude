import { buildContentIndex, toLightIndex } from "@/lib/content/index";
import { ResultSummary } from "@/components/diagnostic/ResultSummary";

export default function DiagnosticResultPage() {
  const index = toLightIndex(buildContentIndex());
  return <ResultSummary index={index} />;
}
