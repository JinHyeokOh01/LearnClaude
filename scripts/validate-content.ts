/**
 * 콘텐츠 스키마·무결성 검증 (T-14 / design §3.4 / NFR-15)
 * 위반 시 어떤 파일의 어떤 규칙인지 출력하고 종료 코드 1로 빌드를 실패시킨다.
 * 실행: tsx scripts/validate-content.ts
 */
import { buildContentIndex, ContentValidationError } from "../src/lib/content/index";
import { ContentParseError } from "../src/lib/content/parse";

try {
  const index = buildContentIndex();
  console.log(
    `[validate:content] OK — 트랙 ${index.tracks.length}개, 레슨 ${index.totalLessonCount}개`,
  );
  process.exit(0);
} catch (e) {
  if (e instanceof ContentValidationError) {
    console.error("[validate:content] 검증 실패:");
    for (const err of e.errors) console.error(`  - ${err}`);
  } else if (e instanceof ContentParseError) {
    console.error(`[validate:content] 파싱 실패: ${e.message}`);
  } else {
    console.error(`[validate:content] 예상치 못한 오류: ${(e as Error).message}`);
  }
  process.exit(1);
}
