import type { Track, Lesson } from "./schema";

/**
 * 콘텐츠 교차 검증 (design §3.4 / NFR-15)
 * 스키마·기본 형식은 parse 단계에서 통과했다고 가정하고,
 * 여기서는 파일 간 무결성 규칙을 검사한다.
 *
 * 검사 규칙:
 *  - ID 유일성 (레슨)
 *  - 트랙 참조 무결성 (레슨.track → 존재하는 트랙)
 *  - 선행 조건 참조 무결성 (prereq → 존재하는 레슨)
 *  - 선행 조건 순환 (prereq 그래프에 사이클)
 *  - 트랙 내 order 유일성
 *  - 트랙 ID 유일성
 */
export function validateContent(tracks: Track[], lessons: Lesson[]): string[] {
  const errors: string[] = [];

  // 트랙 ID 유일성
  const trackIds = new Set<string>();
  for (const t of tracks) {
    if (trackIds.has(t.id)) errors.push(`중복 트랙 id: ${t.id}`);
    trackIds.add(t.id);
  }

  // 레슨 ID 유일성
  const lessonIds = new Set<string>();
  for (const l of lessons) {
    if (lessonIds.has(l.id)) errors.push(`중복 레슨 id: ${l.id}`);
    lessonIds.add(l.id);
  }

  // 트랙 참조 무결성
  for (const l of lessons) {
    if (!trackIds.has(l.track)) {
      errors.push(`레슨 ${l.id}: 존재하지 않는 트랙 참조 "${l.track}"`);
    }
  }

  // 선행 조건 참조 무결성
  for (const l of lessons) {
    for (const p of l.prereq) {
      if (!lessonIds.has(p)) {
        errors.push(`레슨 ${l.id}: 존재하지 않는 prereq 참조 "${p}"`);
      }
    }
  }

  // 트랙 내 order 유일성
  const orderByTrack = new Map<string, Set<number>>();
  for (const l of lessons) {
    const set = orderByTrack.get(l.track) ?? new Set<number>();
    if (set.has(l.order)) {
      errors.push(`트랙 ${l.track}: 중복 order ${l.order} (레슨 ${l.id})`);
    }
    set.add(l.order);
    orderByTrack.set(l.track, set);
  }

  // 선행 조건 순환 (DFS 색칠: white=0, gray=1, black=2)
  const cycle = findPrereqCycle(lessons, lessonIds);
  if (cycle) errors.push(`prereq 순환 감지: ${cycle.join(" → ")}`);

  return errors;
}

function findPrereqCycle(lessons: Lesson[], lessonIds: Set<string>): string[] | null {
  const adj = new Map<string, string[]>();
  for (const l of lessons) {
    // 존재하지 않는 prereq는 참조 무결성에서 이미 잡히므로 순환 탐색에서 제외
    adj.set(
      l.id,
      l.prereq.filter((p) => lessonIds.has(p)),
    );
  }

  const color = new Map<string, number>();
  const stack: string[] = [];

  function dfs(node: string): string[] | null {
    color.set(node, 1); // gray
    stack.push(node);
    for (const next of adj.get(node) ?? []) {
      const c = color.get(next) ?? 0;
      if (c === 1) {
        // 사이클: stack에서 next부터 현재까지 잘라 반환
        const start = stack.indexOf(next);
        return [...stack.slice(start), next];
      }
      if (c === 0) {
        const found = dfs(next);
        if (found) return found;
      }
    }
    color.set(node, 2); // black
    stack.pop();
    return null;
  }

  for (const id of adj.keys()) {
    if ((color.get(id) ?? 0) === 0) {
      const found = dfs(id);
      if (found) return found;
    }
  }
  return null;
}
