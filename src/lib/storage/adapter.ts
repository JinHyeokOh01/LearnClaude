import type { PersistedState } from "../domain/types";
import { STORAGE_KEY } from "./state-schema";
import { loadState } from "./migrations";

/**
 * 저장소 어댑터 (design §4.2 / AC-5.8)
 * localStorage 접근을 항상 try/catch로 감싸고, 실패 시 인메모리로 폴백한다.
 * 진도 데이터의 유일한 출구다(NFR-12: 네트워크 전송 경로 없음).
 */
export interface StorageAdapter {
  read(): PersistedState;
  write(state: PersistedState): void;
  clear(): void;
  readonly isPersistent: boolean;
}

/** localStorage 사용 가능 여부를 실제 접근으로 확인 */
function localStorageAvailable(): boolean {
  try {
    const k = "__stepup_probe__";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function createStorageAdapter(): StorageAdapter {
  const persistent = typeof localStorage !== "undefined" && localStorageAvailable();

  if (persistent) {
    return {
      isPersistent: true,
      read() {
        try {
          return loadState(localStorage.getItem(STORAGE_KEY));
        } catch {
          return loadState(null);
        }
      },
      write(state) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
          // 용량 초과 등 — 조용히 실패 (세션은 계속 동작)
        }
      },
      clear() {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
      },
    };
  }

  // 인메모리 폴백 (AC-5.8)
  let mem: string | null = null;
  return {
    isPersistent: false,
    read() {
      return loadState(mem);
    },
    write(state) {
      mem = JSON.stringify(state);
    },
    clear() {
      mem = null;
    },
  };
}
