"use client";

import { useEffect, useState } from "react";

/**
 * 테마 토글 (T-41 / NFR-10)
 * light / dark / system 3상태. 선택값은 localStorage에 저장하고
 * <html data-theme>를 조작한다. system이면 속성을 제거해 미디어쿼리에 맡긴다.
 */
type Theme = "light" | "dark" | "system";
const KEY = "stepup.theme";

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as Theme | null) ?? "system";
    setTheme(saved);
    apply(saved);
    setMounted(true);
  }, []);

  function cycle() {
    const order: Theme[] = ["system", "light", "dark"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    apply(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // 저장 실패해도 세션 내 테마는 적용됨
    }
  }

  const label = { system: "시스템", light: "라이트", dark: "다크" }[theme];

  return (
    <button
      type="button"
      onClick={cycle}
      className="rounded-[var(--radius-s)] px-3 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
      aria-label={`테마 전환 (현재: ${label})`}
    >
      {mounted ? label : "테마"}
    </button>
  );
}
