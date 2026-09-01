import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

/** 사이트 헤더 (T-40 / design §7) */
export function SiteHeader() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-[var(--text)]">
          StepUp
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/tracks" className="text-[var(--text-muted)] hover:text-[var(--text)]">
            트랙
          </Link>
          <Link href="/settings" className="text-[var(--text-muted)] hover:text-[var(--text)]">
            설정
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
