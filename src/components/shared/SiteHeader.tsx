import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

/** 사이트 헤더 (T-40 / design §7) */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3.5">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-[var(--text)]"
        >
          <span className="text-[var(--accent-text)]">Step</span>Up
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/tracks"
            className="rounded-[var(--radius-s)] px-3 py-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            트랙
          </Link>
          <Link
            href="/settings"
            className="rounded-[var(--radius-s)] px-3 py-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            설정
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
