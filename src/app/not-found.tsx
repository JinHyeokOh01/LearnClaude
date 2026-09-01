import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-12 text-center">
      <h1 className="mb-2 text-2xl font-bold text-[var(--text)]">페이지를 찾을 수 없어요</h1>
      <p className="mb-6 text-[var(--text-muted)]">
        존재하지 않는 강의나 트랙일 수 있어요.
      </p>
      <div className="flex justify-center gap-3">
        <Link href="/" className="rounded-md bg-[var(--accent)] px-4 py-2 text-white">
          홈으로
        </Link>
        <Link
          href="/tracks/"
          className="rounded-md border border-[var(--border)] px-4 py-2 text-[var(--text)]"
        >
          트랙 목록
        </Link>
      </div>
    </div>
  );
}
