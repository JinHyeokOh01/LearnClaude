import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createStorageAdapter } from "./adapter";
import { createInitialState } from "./state-schema";

/**
 * node 환경에는 localStorage가 없으므로 기본은 인메모리 폴백 경로를 검증한다.
 * (localStorage 실제 경로는 E2E/T-85에서 브라우저로 검증)
 */
describe("createStorageAdapter — 인메모리 폴백 (AC-5.8)", () => {
  it("localStorage 없으면 isPersistent=false", () => {
    const a = createStorageAdapter();
    expect(a.isPersistent).toBe(false);
  });

  it("write→read 왕복이 세션 내 유지", () => {
    const a = createStorageAdapter();
    const state = createInitialState();
    state.streak.current = 4;
    a.write(state);
    expect(a.read().streak.current).toBe(4);
  });

  it("read 초기값은 초기 상태", () => {
    const a = createStorageAdapter();
    expect(a.read()).toEqual(createInitialState());
  });

  it("clear 후 초기 상태", () => {
    const a = createStorageAdapter();
    const state = createInitialState();
    state.streak.current = 7;
    a.write(state);
    a.clear();
    expect(a.read()).toEqual(createInitialState());
  });
});

describe("createStorageAdapter — localStorage 경로", () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    (globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    } as Storage;
  });
  afterEach(() => {
    store.clear();
    delete (globalThis as unknown as { localStorage?: Storage }).localStorage;
  });

  it("localStorage 있으면 isPersistent=true, 왕복 유지", () => {
    const a = createStorageAdapter();
    expect(a.isPersistent).toBe(true);
    const state = createInitialState();
    state.streak.current = 2;
    a.write(state);
    expect(a.read().streak.current).toBe(2);
    a.clear();
    expect(a.read().streak.current).toBe(0);
  });
});
