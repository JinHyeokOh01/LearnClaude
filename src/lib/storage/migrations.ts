import type { PersistedState } from "../domain/types";
import { CURRENT_VERSION, PersistedStateSchema, createInitialState } from "./state-schema";

/**
 * 저장 상태 로딩 및 버전 마이그레이션 (design §4.3 / AC-5.10)
 * - 정상 최신 버전: 스키마 검증 후 반환, 실패 시 안전 기본값
 * - 하위 버전: 순차 마이그레이션 (현재 v1뿐이라 실제 변환 없음)
 * - 알 수 없는 상위 버전: 파기하지 않고 안전 기본값 폴백
 * - 손상 JSON: 안전 기본값
 */
export function loadState(raw: string | null): PersistedState {
  if (!raw) return createInitialState();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return createInitialState();
  }

  const version = (parsed as { schemaVersion?: unknown } | null)?.schemaVersion;

  if (version === CURRENT_VERSION) {
    const result = PersistedStateSchema.safeParse(parsed);
    return result.success ? result.data : createInitialState();
  }

  if (typeof version === "number" && version < CURRENT_VERSION) {
    return runMigrations(parsed, version);
  }

  // 알 수 없는 상위 버전 — 데이터를 파기하지 않고 세션 기본값으로 동작 (AC-5.10)
  return createInitialState();
}

/**
 * 순차 마이그레이션. 현재는 v1이 최신이라 실제 변환 단계가 없다.
 * 새 버전이 생기면 여기에 vN→vN+1 변환을 추가한다.
 */
export function runMigrations(_data: unknown, _fromVersion: number): PersistedState {
  // 아직 하위 버전이 존재하지 않으므로 안전 기본값을 반환한다.
  return createInitialState();
}
