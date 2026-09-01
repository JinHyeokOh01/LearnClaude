import { MDXRemote } from "next-mdx-remote/rsc";
import type { ComponentProps } from "react";

/**
 * 레슨 본문 MDX 렌더 (T-15)
 * 서버 컴포넌트에서 MDX 문자열을 렌더하고, 기본 요소에 스타일을 매핑한다.
 * 정적 export에서도 빌드 타임에 렌더되므로 런타임 서버가 필요 없다.
 */

const components = {
  h2: (props: ComponentProps<"h2">) => (
    <h2 className="mt-8 mb-3 text-xl font-semibold text-[var(--text)]" {...props} />
  ),
  h3: (props: ComponentProps<"h3">) => (
    <h3 className="mt-6 mb-2 text-lg font-semibold text-[var(--text)]" {...props} />
  ),
  p: (props: ComponentProps<"p">) => (
    <p className="my-3 leading-relaxed text-[var(--text)]" {...props} />
  ),
  ul: (props: ComponentProps<"ul">) => (
    <ul className="my-3 list-disc pl-6 text-[var(--text)]" {...props} />
  ),
  ol: (props: ComponentProps<"ol">) => (
    <ol className="my-3 list-decimal pl-6 text-[var(--text)]" {...props} />
  ),
  blockquote: (props: ComponentProps<"blockquote">) => (
    <blockquote
      className="my-4 border-l-4 border-[var(--border)] pl-4 text-[var(--text-muted)] italic"
      {...props}
    />
  ),
  code: (props: ComponentProps<"code">) => (
    <code
      className="rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono text-sm text-[var(--accent)]"
      {...props}
    />
  ),
  pre: (props: ComponentProps<"pre">) => (
    <pre
      className="my-4 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 font-mono text-sm"
      {...props}
    />
  ),
  table: (props: ComponentProps<"table">) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props: ComponentProps<"th">) => (
    <th className="border border-[var(--border)] px-3 py-2 text-left font-semibold" {...props} />
  ),
  td: (props: ComponentProps<"td">) => (
    <td className="border border-[var(--border)] px-3 py-2" {...props} />
  ),
};

export function LessonBody({ source }: { source: string }) {
  return <MDXRemote source={source} components={components} />;
}
