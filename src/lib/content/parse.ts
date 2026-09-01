import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { load as yamlLoad } from "js-yaml";
import { TrackSchema, LessonSchema, type Track, type Lesson } from "./schema";

/**
 * 콘텐츠 파일 로딩·파싱 (design §3.1)
 * - 트랙: content/tracks/*.yml
 * - 레슨: content/lessons/**\/*.mdx (프론트매터 + 본문)
 * 빌드 타임에만 호출된다(파일시스템 접근).
 */

const CONTENT_ROOT = path.join(process.cwd(), "content");
const TRACKS_DIR = path.join(CONTENT_ROOT, "tracks");
const LESSONS_DIR = path.join(CONTENT_ROOT, "lessons");

/** 검증 실패 시 파일 경로를 포함해 던지는 에러 */
export class ContentParseError extends Error {
  constructor(file: string, detail: string) {
    super(`[content] ${file}: ${detail}`);
    this.name = "ContentParseError";
  }
}

function listFiles(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, ext));
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

export function parseTracks(): Track[] {
  return listFiles(TRACKS_DIR, ".yml").map((file) => {
    const raw = fs.readFileSync(file, "utf8");
    let data: unknown;
    try {
      data = yamlLoad(raw);
    } catch (e) {
      throw new ContentParseError(file, `YAML 파싱 실패: ${(e as Error).message}`);
    }
    const result = TrackSchema.safeParse(data);
    if (!result.success) {
      throw new ContentParseError(file, formatZodError(result.error));
    }
    return result.data;
  });
}

export function parseLessons(): Lesson[] {
  return listFiles(LESSONS_DIR, ".mdx").map((file) => {
    const raw = fs.readFileSync(file, "utf8");
    const { data, content } = matter(raw);
    const result = LessonSchema.safeParse(data);
    if (!result.success) {
      throw new ContentParseError(file, formatZodError(result.error));
    }
    return { ...result.data, body: content.trim() };
  });
}

function formatZodError(error: import("zod").ZodError): string {
  return error.issues
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}
