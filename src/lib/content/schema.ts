import { z } from "zod";

/**
 * 콘텐츠 스키마 (design §3.2, §3.3)
 * 빌드 타임에 트랙/레슨 파일을 검증한다. 위반 시 빌드 실패(NFR-15).
 */

export const TrackSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "트랙 id는 소문자·숫자·하이픈만 허용"),
  title: z.string().min(1),
  tagline: z.string().max(60),
  order: z.number().int(),
  outcome: z.string().min(1),
  prerequisiteNote: z.string().optional(),
  accentToken: z.string().min(1),
});

export type Track = z.infer<typeof TrackSchema>;

const MissionSchema = z.object({
  goal: z.string().min(1),
  prompt: z.string().min(1),
  success: z.string().min(1),
});

const SourceSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

const RequiresSchema = z
  .object({
    plan: z.enum(["free", "paid"]).optional(),
    platform: z.enum(["web", "desktop", "cli"]).optional(),
  })
  .optional();

export const LessonSchema = z.object({
  // ID는 발행 후 변경 금지(NFR-17). 형식: <track>-<number>
  id: z.string().regex(/^[a-z0-9-]+-\d+$/, "레슨 id 형식은 <track>-<number>"),
  track: z.string().min(1),
  order: z.number().int().positive(),
  title: z.string().max(40),
  summary: z.string().max(80),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  estMinutes: z.number().int().min(1).max(10),
  prereq: z.array(z.string()).default([]),
  // P0 미사용, P1 검색용으로 미리 축적 (requirements §5.2, 선택 필드)
  tags: z.array(z.string()).default([]),
  requires: RequiresSchema,
  mission: MissionSchema,
  // YAML 파서가 날짜를 Date로 변환할 수 있으므로 Date/string 모두 받아
  // YYYY-MM-DD 문자열로 정규화한 뒤 형식을 검증한다.
  verifiedAt: z
    .union([z.string(), z.date()])
    .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v))
    .pipe(z.string().date()),
  sources: z.array(SourceSchema).min(1, "출처(sources)는 최소 1개 필요"),
});

// 본문(content)은 프론트매터와 분리해서 다루므로 스키마엔 포함하지 않는다.
export type LessonMeta = z.infer<typeof LessonSchema>;

export interface Lesson extends LessonMeta {
  /** MDX 본문 (프론트매터 제외) */
  body: string;
}
