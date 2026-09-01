"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ContentIndex } from "../content/index";
import type { PersistedState, DiagnosticResult, DiagnosticAnswers } from "../domain/types";
import { createStorageAdapter, type StorageAdapter } from "../storage/adapter";
import { createInitialState } from "../storage/state-schema";
import { localDateKey } from "../domain/date";
import { progressReducer, type ProgressAction } from "./reducer";

/**
 * 진도 상태 컨텍스트 (design §7.1, §4.4 / AC-5.1, 5.7, 5.9)
 * - mounted 플래그로 하이드레이션 가드 제공
 * - 각 액션은 리듀서를 통해 원자적으로 처리 후 즉시 저장
 */
export interface ProgressContextValue {
  mounted: boolean;
  state: PersistedState;
  isPersistent: boolean;
  completeLesson(lessonId: string): void;
  uncompleteLesson(lessonId: string): void;
  skipLesson(lessonId: string): void;
  pinTrack(trackId: string | null): void;
  saveDiagnostic(result: DiagnosticResult, answers: DiagnosticAnswers | null): void;
  setDaily(date: string, lessonId: string): void;
  setHideBelowStartLevel(value: boolean): void;
  resetAll(): void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({
  index,
  children,
}: {
  index: ContentIndex;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<PersistedState>(() => createInitialState());
  const adapterRef = useRef<StorageAdapter | null>(null);

  // 클라이언트 마운트 후에만 저장소를 읽는다 (하이드레이션 불일치 방지)
  useEffect(() => {
    const adapter = createStorageAdapter();
    adapterRef.current = adapter;
    setState(adapter.read());
    setMounted(true);
  }, []);

  const dispatch = (action: ProgressAction) => {
    setState((prev) => {
      const next = progressReducer(prev, action, createInitialState);
      adapterRef.current?.write(next);
      return next;
    });
  };

  const value = useMemo<ProgressContextValue>(() => {
    const today = () => localDateKey();
    return {
      mounted,
      state,
      isPersistent: adapterRef.current?.isPersistent ?? true,
      completeLesson: (lessonId) => dispatch({ type: "complete", lessonId, today: today() }),
      uncompleteLesson: (lessonId) => dispatch({ type: "uncomplete", lessonId, today: today() }),
      skipLesson: (lessonId) => dispatch({ type: "skip", lessonId, today: today() }),
      pinTrack: (trackId) => dispatch({ type: "pinTrack", trackId }),
      saveDiagnostic: (result, answers) =>
        dispatch({ type: "saveDiagnostic", result, answers, index, today: today() }),
      setDaily: (date, lessonId) => dispatch({ type: "setDaily", date, lessonId }),
      setHideBelowStartLevel: (value) => dispatch({ type: "setHideBelowStartLevel", value }),
      resetAll: () => dispatch({ type: "reset" }),
    };
  }, [mounted, state, index]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
