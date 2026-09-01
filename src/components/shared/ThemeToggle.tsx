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
      className="rounded-md border border-[var(--border)] px-2 py-1 text-sm text-[var(--text)] hover:bg-[var(--surface)]"
      aria-label={`테마 전환 (현재: ${label})`}
    >
      {mounted ? `테마: ${label}` : "테마"}
    </button>
  );
}
